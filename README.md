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

**Rebuild course embeddings** (only needed if `availablecourses.db` changes):
```bash
cd backend && uv run python tools/build_embeddings.py
```

## Tools

| Tool | Source | Purpose |
|------|--------|---------|
| `get_canvas_courses` | Canvas LMS API | Current courses, grades, late assignments |
| `lookup_professor` | Rate My Professors GraphQL | Professor ratings and reviews |
| `search_job_listings` | TheirStack API | Job/internship search |
| `get_cs_degree_roadmap` | Local JSON | CS degree prerequisite roadmap |
| `search_available_courses` | RAG (sentence-transformers + numpy) | Semantic course catalog search via natural language query |

### Course Catalog RAG

Instead of SQL filters, the course catalog uses vector embeddings for semantic search. All 1,138 courses are embedded with `all-MiniLM-L6-v2` (384-dim) and searched via cosine similarity at query time. Gemini passes a natural language query (e.g. "courses about machine learning") and gets back the most relevant courses as context for its response.
