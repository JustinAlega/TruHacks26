# TruHacks26

AI Academic & Career Advisor — a voice-powered platform that helps students plan courses, track grades, and discover career paths.

## Architecture

```
Browser Mic → ElevenLabs STT (client-side) → WebSocket → FastAPI Backend
                                                              ↓
                                                        Gemini 2.5 Flash
                                                        + Tool Calling
                                                              ↓
                                                      ElevenLabs TTS WebSocket
                                                              ↓
                                              WebSocket → Browser Audio Playback
```

## Running

**Backend:**
```bash
cd backend
uv sync
uv run uvicorn main:app --reload --port 8000
```

**Frontend:**
```bash
cd front-end
npm install
npm run dev
```

Requires `ELEVENLABS_API_KEY` and `GEMINI_API_KEY` in `backend/.env`.

## Known Issues

- Tool calls (Canvas grades, Rate My Professor, job search) are not yet working end-to-end. The Gemini tool declarations and scraper wrappers are in place but need debugging.
