"""
FastAPI backend for the AI Academic & Career Advisor voice pipeline.

Endpoints:
  GET  /scribe-token  — single-use ElevenLabs token for client-side STT
  WS   /ws            — voice pipeline WebSocket (text in, audio + text out)
"""

import os
import json

from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from elevenlabs import ElevenLabs

from pipeline import VoicePipeline

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

elevenlabs_client = ElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY"))


@app.get("/scribe-token")
async def scribe_token():
    """Generate a single-use token for client-side real-time STT."""
    token = elevenlabs_client.tokens.single_use.create("realtime_scribe")
    return token


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    pipeline = VoicePipeline(ws)

    try:
        while True:
            raw = await ws.receive_text()
            msg = json.loads(raw)

            if msg.get("type") == "transcript":
                text = msg.get("text", "").strip()
                if text:
                    await pipeline.handle_message(text)
    except WebSocketDisconnect:
        pass
