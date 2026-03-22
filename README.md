# A.R.I.A. — Academic Resource Intelligence Assistant

A voice-first AI advisor that lets university students talk naturally to get live grades, professor ratings, degree plans, and job listings — all rendered as interactive widgets on a JARVIS-inspired HUD. One conversation replaces a dozen tabs.

## Architecture

```
Browser Mic → ElevenLabs Scribe STT (client-side) → WebSocket → FastAPI Backend
                                                                      ↓
                                                                Gemini 2.5 Flash
                                                                + Autonomous Tool Calling
                                                                      ↓
                                                              ElevenLabs TTS WebSocket
                                                                      ↓
                                                      WebSocket → Browser Audio Playback
                                                                + Interactive Widgets
```

## Prerequisites

- **Python 3.12+** and [uv](https://docs.astral.sh/uv/) (backend package manager)
- **Node.js 18+** and npm (frontend)
- API keys listed below

## Environment Variables

All secrets live in a single `.env` file **at the repository root** (not inside `backend/`). Vite is configured with `envDir: '..'` so both the frontend and backend read from the same file.

Copy `backend/.env.example` and fill in your values:

| Variable | Purpose |
|----------|---------|
| `GEMINI_API_KEY` | Google Gemini 2.5 Flash |
| `ELEVENLABS_API_KEY` | ElevenLabs TTS + Scribe STT token |
| `canvas_API` | Canvas LMS personal access token |
| `theirstacks_API` | TheirStack job listings API key |
| `VITE_SUPABASE_URL` | Supabase project URL (frontend auth) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key (frontend auth) |

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

The Vite dev server runs on `http://localhost:5173` and proxies `/ws` and `/scribe-token` to the backend at `localhost:8000`.

**Rebuild course embeddings** (only needed if `availablecourses.db` changes):

```bash
cd backend
uv run python tools/build_embeddings.py
```

## AI Tools

| Tool | Source | Purpose |
|------|--------|---------|
| `get_canvas_courses` | Canvas LMS API | Current courses, grades, late assignments |
| `lookup_professor` | Rate My Professors GraphQL | Professor ratings and reviews |
| `search_job_listings` | TheirStack API | Job/internship search |
| `get_cs_degree_roadmap` | Local JSON | CS degree prerequisite roadmap |
| `search_available_courses` | RAG (sentence-transformers + numpy) | Semantic course catalog search via natural language query |

### Course Catalog RAG

Instead of SQL filters, the course catalog uses vector embeddings for semantic search. All 1,138 courses are embedded with `all-MiniLM-L6-v2` (384-dim) and searched via cosine similarity at query time. Gemini passes a natural language query (e.g. "courses about machine learning") and gets back the most relevant courses as context for its response.
