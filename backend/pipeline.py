"""
Voice pipeline: Gemini streaming + ElevenLabs TTS WebSocket.

Handles a single WebSocket session's conversation loop:
  1. Receive text from frontend (STT transcript)
  2. Stream to Gemini with tool calling (async)
  3. Execute tool calls, feed results back
  4. Pipe Gemini's text response to ElevenLabs TTS WebSocket
  5. Forward audio chunks to frontend
"""

import asyncio
import json
import os
import re

import websockets
from google import genai
from google.genai import types

from tools.gemini_tools import ALL_TOOLS, get_canvas_courses, lookup_professor, search_job_listings

GEMINI_MODEL = "gemini-2.5-flash"

VOICE_ID = "Xb7hH8MSUJpSbSDYk0k2"  # Alice — Clear, Engaging Educator
TTS_MODEL = "eleven_flash_v2_5"

SYSTEM_INSTRUCTION = """You are an AI Academic & Career Advisor named Aria. You help university students with:
- Checking their current grades and courses on Canvas
- Finding professor ratings on Rate My Professors
- Discovering job listings matching their skills and interests

You have access to tools for each of these. Use them when the student asks about grades, professors, or jobs.

Keep your spoken responses concise and conversational — you're speaking out loud, not writing an essay.
When reporting data from tools, summarize the key points rather than listing every field."""

# Map function names to callables
TOOL_MAP = {
    "get_canvas_courses": get_canvas_courses,
    "lookup_professor": lookup_professor,
    "search_job_listings": search_job_listings,
}

# Sentence boundary pattern for chunking text to TTS
SENTENCE_END = re.compile(r"(?<=[.!?])\s+")

MAX_TOOL_ROUNDS = 5  # Prevent infinite tool call loops


class VoicePipeline:
    def __init__(self, ws):
        self.ws = ws
        self.gemini = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        self.history: list[types.Content] = []

    async def handle_message(self, text: str):
        """Process a user transcript: Gemini streaming -> TTS -> audio out."""
        self.history.append(
            types.Content(role="user", parts=[types.Part(text=text)])
        )

        tts_ws = await self._connect_tts()
        tts_receive_task = asyncio.create_task(self._receive_tts_audio(tts_ws))
        tts_closed = False

        try:
            full_text = await self._stream_with_tools(tts_ws)

            if full_text:
                self.history.append(
                    types.Content(
                        role="model", parts=[types.Part(text=full_text)]
                    )
                )
        finally:
            if not tts_closed:
                await self._close_tts(tts_ws)
                await tts_receive_task

        await self.ws.send_json({"type": "done"})

    async def _stream_with_tools(self, tts_ws) -> str:
        """Stream Gemini, handling tool calls in a loop (supports chained tools)."""
        config = types.GenerateContentConfig(
            system_instruction=SYSTEM_INSTRUCTION,
            tools=ALL_TOOLS,
        )

        accumulated_text = ""

        for _ in range(MAX_TOOL_ROUNDS):
            text, pending_tool_call = await self._stream_one_round(tts_ws, config)
            accumulated_text += text

            if pending_tool_call is None:
                # No more tool calls — done
                break

            # Save any pre-tool-call text to history
            model_parts = []
            if text:
                model_parts.append(types.Part(text=text))
            model_parts.append(types.Part(function_call=pending_tool_call))
            self.history.append(
                types.Content(role="model", parts=model_parts)
            )

            # Execute tool and add result to history
            tool_result = await self._execute_tool(pending_tool_call)
            self.history.append(
                types.Content(
                    role="user",
                    parts=[
                        types.Part(
                            function_response=types.FunctionResponse(
                                name=pending_tool_call.name,
                                response=tool_result,
                            )
                        )
                    ],
                )
            )
            # Loop will call Gemini again with the tool result

        return accumulated_text

    async def _stream_one_round(self, tts_ws, config) -> tuple[str, object | None]:
        """Run one Gemini streaming call. Returns (text, function_call_or_None)."""
        full_text = ""
        text_buffer = ""
        pending_tool_call = None

        # Use async streaming to avoid blocking the event loop
        response_stream = await self.gemini.aio.models.generate_content_stream(
            model=GEMINI_MODEL,
            contents=self.history,
            config=config,
        )

        async for chunk in response_stream:
            if not chunk.candidates:
                continue

            for part in chunk.candidates[0].content.parts:
                if part.function_call:
                    # Flush buffered text before tool call
                    if text_buffer.strip():
                        await self._send_tts_text(tts_ws, text_buffer, flush=True)
                        text_buffer = ""
                    pending_tool_call = part.function_call
                    # Stop processing this stream — will continue after tool execution
                    break

                if part.text:
                    full_text += part.text
                    text_buffer += part.text

                    await self.ws.send_json(
                        {"type": "text", "data": part.text}
                    )

                    # Send complete sentences to TTS for better prosody
                    sentences = SENTENCE_END.split(text_buffer)
                    if len(sentences) > 1:
                        to_send = " ".join(sentences[:-1]) + " "
                        await self._send_tts_text(tts_ws, to_send)
                        text_buffer = sentences[-1]

            if pending_tool_call:
                break

        # Flush remaining text
        if text_buffer.strip():
            await self._send_tts_text(tts_ws, text_buffer, flush=True)

        return full_text, pending_tool_call

    async def _execute_tool(self, function_call) -> dict:
        """Execute a Gemini function call and return the result."""
        name = function_call.name
        args = dict(function_call.args) if function_call.args else {}

        await self.ws.send_json(
            {"type": "tool_call", "name": name, "args": args}
        )

        fn = TOOL_MAP.get(name)
        if not fn:
            result = {"error": f"Unknown tool: {name}"}
        else:
            try:
                result = await asyncio.to_thread(fn, **args)
            except Exception as e:
                result = {"error": str(e)}

        if isinstance(result, list):
            result = {"results": result}

        await self.ws.send_json(
            {"type": "tool_result", "name": name, "data": result}
        )

        return result

    # ── ElevenLabs TTS WebSocket ─────────────────────────────────────────

    async def _connect_tts(self):
        """Open a WebSocket to ElevenLabs TTS streaming API."""
        api_key = os.getenv("ELEVENLABS_API_KEY")
        uri = (
            f"wss://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}"
            f"/stream-input?model_id={TTS_MODEL}"
        )

        ws = await websockets.connect(uri)

        await ws.send(
            json.dumps(
                {
                    "text": " ",
                    "voice_settings": {
                        "stability": 0.5,
                        "similarity_boost": 0.8,
                    },
                    "generation_config": {
                        "chunk_length_schedule": [80, 120, 200, 260],
                    },
                    "xi_api_key": api_key,
                }
            )
        )

        return ws

    async def _send_tts_text(self, tts_ws, text: str, flush: bool = False):
        """Send a text chunk to the TTS WebSocket."""
        msg = {"text": text}
        if flush:
            msg["flush"] = True
        await tts_ws.send(json.dumps(msg))

    async def _close_tts(self, tts_ws):
        """Signal end of text to the TTS WebSocket."""
        try:
            await tts_ws.send(json.dumps({"text": ""}))
        except Exception:
            pass

    async def _receive_tts_audio(self, tts_ws):
        """Receive audio chunks from TTS WebSocket and forward to frontend."""
        try:
            async for message in tts_ws:
                data = json.loads(message)
                if data.get("audio"):
                    await self.ws.send_json(
                        {"type": "audio", "data": data["audio"]}
                    )
                elif data.get("isFinal"):
                    break
        except websockets.exceptions.ConnectionClosed:
            pass
