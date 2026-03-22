"""
Integration tests for Gemini's tool calling with RAG-based search_available_courses.

Uses the real Gemini API to verify the model calls the right tool with
appropriate query strings. Tools and TTS are mocked.
"""

import json
import logging
import os
import sys
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from pipeline import VoicePipeline

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
skip_no_key = pytest.mark.skipif(not GEMINI_API_KEY, reason="GEMINI_API_KEY not set")


# ── Fake WebSocket that records messages ─────────────────────────────

class FakeWS:
    def __init__(self):
        self.messages: list[dict] = []

    async def send_json(self, data: dict):
        self.messages.append(data)

    def tool_calls(self) -> list[dict]:
        return [m for m in self.messages if m.get("type") == "tool_call"]

    def tool_results(self) -> list[dict]:
        return [m for m in self.messages if m.get("type") == "tool_result"]


# ── Canned tool results ─────────────────────────────────────────────

FAKE_COURSES = [
    {
        "course_code": "CS 480",
        "name": "Artificial Intelligence",
        "section": "01",
        "crn": "6900",
        "time": "MWF 10:30 am - 11:20 am",
        "professor": "Chen-Yeou Yu",
        "credits": "3.000",
        "description": "Introduction to artificial intelligence concepts and techniques.",
    },
    {
        "course_code": "CS 310",
        "name": "Data Structures & Algorithms",
        "section": "01",
        "crn": "6897",
        "time": "MWF 11:30 am - 12:20 pm",
        "professor": "MD Nazmul Shahadat",
        "credits": "3.000",
        "description": "Study of abstract data types and algorithms.",
    },
]


def mock_tool_map():
    """TOOL_MAP where search_available_courses returns canned data, others are stubs."""
    def fake_canvas():
        return []

    def fake_rmp(professor_name, school_name):
        return {"error": "mocked"}

    def fake_jobs(titles=None, technologies=None, limit=10):
        return []

    def fake_courses(query):
        return FAKE_COURSES

    def fake_roadmap():
        return {}

    return {
        "get_canvas_courses": fake_canvas,
        "lookup_professor": fake_rmp,
        "search_job_listings": fake_jobs,
        "search_available_courses": fake_courses,
        "get_cs_degree_roadmap": fake_roadmap,
    }


async def run_pipeline(user_text: str) -> FakeWS:
    """Run the pipeline with mocked tools and TTS, return the fake WS."""
    ws = FakeWS()
    pipeline = VoicePipeline(ws)

    fake_tts_ws = AsyncMock()
    fake_tts_ws.send = AsyncMock()
    fake_tts_ws.__aiter__ = MagicMock(
        return_value=iter([json.dumps({"isFinal": True})])
    )

    with patch.object(pipeline, "_connect_tts", return_value=fake_tts_ws), \
         patch.object(pipeline, "_receive_tts_audio", return_value=None), \
         patch.object(pipeline, "_close_tts", return_value=None), \
         patch("pipeline.TOOL_MAP", mock_tool_map()):
        await pipeline.handle_message(user_text)

    return ws


# ── Tests ────────────────────────────────────────────────────────────


@skip_no_key
class TestCourseToolCalling:

    @pytest.mark.asyncio
    async def test_semantic_query_calls_tool(self, caplog):
        """Asking about database courses should call search_available_courses with a query string."""
        with caplog.at_level(logging.INFO):
            logger.info("=== test_semantic_query_calls_tool ===")
            logger.info("Prompt: 'What courses teach databases?'")

            ws = await run_pipeline("What courses teach databases?")

            calls = ws.tool_calls()
            logger.info("Tool calls made: %d", len(calls))
            for c in calls:
                logger.info("  Tool: %s | Args: %s", c["name"], c.get("args", {}))

            course_calls = [c for c in calls if c["name"] == "search_available_courses"]
            assert len(course_calls) >= 1, f"Expected search_available_courses call, got: {[c['name'] for c in calls]}"

            args = course_calls[0].get("args", {})
            assert "query" in args, f"Expected 'query' parameter, got: {args}"
            logger.info("Query passed to tool: '%s'", args["query"])
            logger.info("PASS: Model called search_available_courses with query string")

    @pytest.mark.asyncio
    async def test_topic_query_calls_tool(self, caplog):
        """Asking about AI courses should call the tool with a relevant query."""
        with caplog.at_level(logging.INFO):
            logger.info("=== test_topic_query_calls_tool ===")
            logger.info("Prompt: 'I want to learn about artificial intelligence'")

            ws = await run_pipeline("I want to learn about artificial intelligence")

            calls = ws.tool_calls()
            logger.info("Tool calls made: %d", len(calls))
            for c in calls:
                logger.info("  Tool: %s | Args: %s", c["name"], c.get("args", {}))

            course_calls = [c for c in calls if c["name"] == "search_available_courses"]
            assert len(course_calls) >= 1, f"Expected search_available_courses call, got: {[c['name'] for c in calls]}"

            query = course_calls[0].get("args", {}).get("query", "")
            logger.info("Query passed to tool: '%s'", query)
            assert len(query) > 0, "Expected non-empty query string"
            logger.info("PASS: Model called search_available_courses with relevant query")

    @pytest.mark.asyncio
    async def test_greeting_no_call(self, caplog):
        """A greeting should NOT trigger search_available_courses."""
        with caplog.at_level(logging.INFO):
            logger.info("=== test_greeting_no_call ===")
            logger.info("Prompt: 'Hey, how's it going?'")

            ws = await run_pipeline("Hey, how's it going?")

            calls = ws.tool_calls()
            logger.info("Tool calls made: %d", len(calls))
            for c in calls:
                logger.info("  Tool: %s | Args: %s", c["name"], c.get("args", {}))

            course_calls = [c for c in calls if c["name"] == "search_available_courses"]
            assert len(course_calls) == 0, f"Did not expect course tool call for greeting, got: {course_calls}"
            logger.info("PASS: Model correctly did NOT call search_available_courses")

    @pytest.mark.asyncio
    async def test_professor_query_no_call(self, caplog):
        """A professor query should call lookup_professor, not search_available_courses."""
        with caplog.at_level(logging.INFO):
            logger.info("=== test_professor_query_no_call ===")
            logger.info("Prompt: 'What's the rating for Professor Smith at Truman State?'")

            ws = await run_pipeline("What's the rating for Professor Smith at Truman State?")

            calls = ws.tool_calls()
            logger.info("Tool calls made: %d", len(calls))
            for c in calls:
                logger.info("  Tool: %s | Args: %s", c["name"], c.get("args", {}))

            course_calls = [c for c in calls if c["name"] == "search_available_courses"]
            prof_calls = [c for c in calls if c["name"] == "lookup_professor"]
            assert len(course_calls) == 0, "Should not call course tool for professor query"
            assert len(prof_calls) >= 1, f"Expected lookup_professor call, got: {[c['name'] for c in calls]}"
            logger.info("PASS: Model called lookup_professor, not search_available_courses")

    @pytest.mark.asyncio
    async def test_tool_result_forwarded(self, caplog):
        """Verify the tool result is sent back to the frontend."""
        with caplog.at_level(logging.INFO):
            logger.info("=== test_tool_result_forwarded ===")
            logger.info("Prompt: 'What courses teach databases?'")

            ws = await run_pipeline("What courses teach databases?")

            results = ws.tool_results()
            logger.info("Tool results sent to frontend: %d", len(results))
            for r in results:
                logger.info("  Tool: %s | Data keys: %s", r["name"], list(r["data"].keys()))

            course_results = [r for r in results if r["name"] == "search_available_courses"]
            if course_results:
                data = course_results[0]["data"]
                logger.info("Course result data: %s", json.dumps(data, indent=2)[:500])
                assert "results" in data, f"Expected 'results' key in data, got {list(data.keys())}"
                assert len(data["results"]) == len(FAKE_COURSES)
                logger.info("PASS: Tool result forwarded with %d courses", len(data["results"]))
            else:
                logger.info("SKIP: Model did not call search_available_courses this run")
