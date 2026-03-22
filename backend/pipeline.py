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
import logging
import os
import re

import websockets

logger = logging.getLogger(__name__)
from google import genai
from google.genai import types

from tools.gemini_tools import ALL_TOOLS, get_canvas_courses, lookup_professor, search_job_listings, get_cs_degree_roadmap, search_available_courses

GEMINI_MODEL = "gemini-2.5-flash"

VOICE_ID = "Xb7hH8MSUJpSbSDYk0k2"  # Alice — Clear, Engaging Educator
TTS_MODEL = "eleven_flash_v2_5"

SYSTEM_INSTRUCTION = """\
You are Aria, a university academic and career advisor. You speak out loud.

CRITICAL — TOOL CALLING:
When the student mentions grades, courses, professors, or jobs you MUST call the \
matching tool BEFORE you produce ANY text response. Do NOT generate a response first. \
Call the tool, wait for the result, THEN respond.
- Grades or current courses → call get_canvas_courses
- Professor → call lookup_professor
- Jobs or internships → call search_job_listings
- Available courses, course catalog, what classes to take, class search → call search_available_courses with a descriptive query
If you are unsure, call the tool anyway. NEVER guess or fabricate data.

RESPONSE RULES:
- 4 sentences max. No exceptions.
- After a tool call, keep your spoken response brief — the student can see the data \
in a widget on their screen.
- No markdown, no bullet lists, no numbered lists.
- Be opinionated, warm, and direct. Never say "as an AI."
- You are Aria and you have opinions."""

# Map function names to callables
TOOL_MAP = {
    "get_canvas_courses": get_canvas_courses,
    "lookup_professor": lookup_professor,
    "search_job_listings": search_job_listings,
    "get_cs_degree_roadmap": get_cs_degree_roadmap,
    "search_available_courses": search_available_courses,
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
        logger.info("[STT→LLM] User said: %s", text)
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
            automatic_function_calling=types.AutomaticFunctionCallingConfig(
                disable=True
            ),
        )

        accumulated_text = ""
        # (tool_name, args_dict, raw_result)
        tool_results_log: list[tuple[str, dict, dict]] = []

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
            args = dict(pending_tool_call.args) if pending_tool_call.args else {}
            tool_result = await self._execute_tool(pending_tool_call)
            tool_results_log.append((pending_tool_call.name, args, tool_result))
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

        logger.info(
            "[LLM→TTS] Response complete, %d chars, %d tool calls",
            len(accumulated_text), len(tool_results_log),
        )

        # Send widget for the best tool result
        widget_msg = await self._resolve_widget(tool_results_log)
        if widget_msg:
            logger.info("[WIDGET] Sending %s widget to frontend", widget_msg.get("widget_type"))
            await self.ws.send_json(widget_msg)

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

            parts = chunk.candidates[0].content.parts
            if not parts:
                continue

            for part in parts:
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
        logger.info("[TOOL] Calling %s with args: %s", name, args)

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

        logger.info("[TOOL] %s returned %d keys", name, len(result))
        return result

    # ── Widget selection & formatting ────────────────────────────────────

    async def _resolve_widget(
        self, tool_results_log: list[tuple[str, dict, dict]]
    ) -> dict | None:
        """Pick which tool result to display as a frontend widget.

        - No tool calls → None
        - All calls to the same tool → format last result
        - Multiple distinct tools → ask Gemini to pick, then format
        """
        if not tool_results_log:
            return None

        distinct_tools = {name for name, _, _ in tool_results_log}
        if len(distinct_tools) == 1:
            name, args, result = tool_results_log[-1]
            return self._format_widget(name, args, result)

        chosen_name, chosen_args, chosen_result = await self._pick_widget(
            tool_results_log
        )
        return self._format_widget(chosen_name, chosen_args, chosen_result)

    async def _pick_widget(
        self, tool_results_log: list[tuple[str, dict, dict]]
    ) -> tuple[str, dict, dict]:
        """Ask Gemini which tool result is most relevant to display."""
        last_per_tool: dict[str, tuple[dict, dict]] = {}
        for name, args, data in tool_results_log:
            last_per_tool[name] = (args, data)

        tool_names = list(last_per_tool.keys())
        prompt = (
            "The user asked a question and the following tools were called:\n"
        )
        for name in tool_names:
            prompt += f"- {name}\n"
        prompt += (
            "\nWhich ONE tool result is most important to display as a visual widget? "
            "Reply with ONLY the tool name, nothing else."
        )

        response = await self.gemini.aio.models.generate_content(
            model=GEMINI_MODEL,
            contents=self.history + [
                types.Content(role="user", parts=[types.Part(text=prompt)])
            ],
        )

        chosen = response.text.strip() if response.text else ""

        for name in tool_names:
            if name in chosen:
                args, data = last_per_tool[name]
                return name, args, data

        # Fallback: last tool result
        return tool_results_log[-1]

    def _format_widget(
        self, tool_name: str, args: dict, result: dict
    ) -> dict | None:
        """Convert a tool result into a widget message matching the frontend schema."""
        if tool_name == "get_cs_degree_roadmap":
            return {
                "type": "widget",
                "widget_type": "course-roadmap",
                "data": result
            }
            
        if tool_name == "search_job_listings":
            titles = args.get("titles") or []
            query = ", ".join(titles) if titles else "Job Search"
            return {
                "type": "widget",
                "widget_type": "job-listings",
                "data": {
                    "query": query,
                    "listings": [
                        {
                            "id": str(i),
                            "title": j.get("role", ""),
                            "company": j.get("company", ""),
                            "location": j.get("location", "Remote"),
                            "salary": (
                                f"${j['salary_min']:,.0f}–${j['salary_max']:,.0f}"
                                if j.get("salary_min") and j.get("salary_max")
                                else None
                            ),
                            "technologies": j.get("technologies", []) or [],
                            "postedDate": j.get("posted_date", ""),
                            "url": j.get("url"),
                        }
                        for i, j in enumerate(result.get("results", []))
                    ],
                },
            }

        if tool_name == "lookup_professor":
            if result.get("error"):
                return None
            return {
                "type": "widget",
                "widget_type": "professor",
                "data": {
                    "name": f"{result.get('firstName', '')} {result.get('lastName', '')}".strip()
                    or args.get("professor_name", ""),
                    "department": result.get("department", ""),
                    "rating": result.get("avgRating", 0),
                    "difficulty": result.get("avgDifficulty", 0),
                    "wouldTakeAgain": 0,
                    "numRatings": result.get("numRatings", 0),
                    "topTags": [],
                },
            }

        if tool_name == "get_canvas_courses":
            courses = result.get("results", [])
            if not courses:
                return None
            return {
                "type": "widget",
                "widget_type": "assignments",
                "data": {
                    "assignments": [
                        {
                            "id": str(i),
                            "courseName": c.get("course_code", ""),
                            "name": c.get("course_name", ""),
                            "dueDate": "",
                            "status": "graded",
                            "pointsEarned": c.get("current_score"),
                            "pointsPossible": 100,
                        }
                        for i, c in enumerate(courses)
                    ],
                },
            }

        return None

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
