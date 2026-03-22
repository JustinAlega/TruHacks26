"""
Integration tests for Gemini's tool calling with search_available_courses.

Uses the real Gemini API to verify the model calls the right tool with
correct arguments for various course catalog prompts. Tools and TTS are mocked.
"""

import asyncio
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
        "course_code": "CS 310",
        "name": "Data Structures & Algorithms",
        "section": "01",
        "crn": "6897",
        "time": "MWF 11:30 am - 12:20 pm",
        "professor": "MD Nazmul Shahadat",
        "credits": "3.000",
        "description": "Study of abstract data types and algorithms.",
    },
    {
        "course_code": "CS 315",
        "name": "Internet Programming",
        "section": "01",
        "crn": "6898",
        "time": "MWF 2:30 pm - 3:20 pm",
        "professor": "Chen-Yeou Yu",
        "credits": "3.000",
        "description": "Programming for the World Wide Web.",
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

    def fake_courses(major=None, level=None):
        return FAKE_COURSES

    return {
        "get_canvas_courses": fake_canvas,
        "lookup_professor": fake_rmp,
        "search_job_listings": fake_jobs,
        "search_available_courses": fake_courses,
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
    async def test_major_query_calls_tool(self, caplog):
        """Asking about CS courses should call search_available_courses with major='CS'."""
        with caplog.at_level(logging.INFO):
            logger.info("=== test_major_query_calls_tool ===")
            logger.info("Prompt: 'What CS courses are available?'")

            ws = await run_pipeline("What CS courses are available?")

            calls = ws.tool_calls()
            logger.info("Tool calls made: %d", len(calls))
            for c in calls:
                logger.info("  Tool: %s | Args: %s", c["name"], c.get("args", {}))

            course_calls = [c for c in calls if c["name"] == "search_available_courses"]
            assert len(course_calls) >= 1, f"Expected search_available_courses call, got: {[c['name'] for c in calls]}"

            args = course_calls[0].get("args", {})
            logger.info("First course call args: %s", args)
            assert args.get("major", "").upper() == "CS", f"Expected major='CS', got {args}"
            logger.info("PASS: Model called search_available_courses with major=CS")

    @pytest.mark.asyncio
    async def test_level_query_calls_tool(self, caplog):
        """Asking about 300-level courses should call with level=300."""
        with caplog.at_level(logging.INFO):
            logger.info("=== test_level_query_calls_tool ===")
            logger.info("Prompt: 'Show me all 300 level courses'")

            ws = await run_pipeline("Show me all 300 level courses")

            calls = ws.tool_calls()
            logger.info("Tool calls made: %d", len(calls))
            for c in calls:
                logger.info("  Tool: %s | Args: %s", c["name"], c.get("args", {}))

            course_calls = [c for c in calls if c["name"] == "search_available_courses"]
            assert len(course_calls) >= 1, f"Expected search_available_courses call, got: {[c['name'] for c in calls]}"

            args = course_calls[0].get("args", {})
            logger.info("First course call args: %s", args)
            assert args.get("level") == 300, f"Expected level=300, got {args}"
            logger.info("PASS: Model called search_available_courses with level=300")

    @pytest.mark.asyncio
    async def test_combined_query_calls_tool(self, caplog):
        """Asking about 200-level MATH should call with both major and level."""
        with caplog.at_level(logging.INFO):
            logger.info("=== test_combined_query_calls_tool ===")
            logger.info("Prompt: 'What 200 level math courses can I take?'")

            ws = await run_pipeline("What 200 level math courses can I take?")

            calls = ws.tool_calls()
            logger.info("Tool calls made: %d", len(calls))
            for c in calls:
                logger.info("  Tool: %s | Args: %s", c["name"], c.get("args", {}))

            course_calls = [c for c in calls if c["name"] == "search_available_courses"]
            assert len(course_calls) >= 1, f"Expected search_available_courses call, got: {[c['name'] for c in calls]}"

            args = course_calls[0].get("args", {})
            logger.info("First course call args: %s", args)
            assert args.get("major", "").upper() == "MATH", f"Expected major='MATH', got {args}"
            assert args.get("level") == 200, f"Expected level=200, got {args}"
            logger.info("PASS: Model called search_available_courses with major=MATH, level=200")

    @pytest.mark.asyncio
    async def test_greeting_does_not_call_course_tool(self, caplog):
        """A greeting should NOT trigger search_available_courses."""
        with caplog.at_level(logging.INFO):
            logger.info("=== test_greeting_does_not_call_course_tool ===")
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
    async def test_tool_result_forwarded(self, caplog):
        """Verify the tool result is sent back to the frontend."""
        with caplog.at_level(logging.INFO):
            logger.info("=== test_tool_result_forwarded ===")
            logger.info("Prompt: 'What CS courses are available?'")

            ws = await run_pipeline("What CS courses are available?")

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

    @pytest.mark.asyncio
    async def test_professor_query_does_not_call_course_tool(self, caplog):
        """A professor query should call lookup_professor, not search_available_courses."""
        with caplog.at_level(logging.INFO):
            logger.info("=== test_professor_query_does_not_call_course_tool ===")
            logger.info("Prompt: 'What's the rating for Professor Smith at Truman State?'")

            ws = await run_pipeline("What's the rating for Professor Smith at Truman State?")

            calls = ws.tool_calls()
            logger.info("Tool calls made: %d", len(calls))
            for c in calls:
                logger.info("  Tool: %s | Args: %s", c["name"], c.get("args", {}))

            course_calls = [c for c in calls if c["name"] == "search_available_courses"]
            prof_calls = [c for c in calls if c["name"] == "lookup_professor"]
            assert len(course_calls) == 0, f"Should not call course tool for professor query"
            assert len(prof_calls) >= 1, f"Expected lookup_professor call, got: {[c['name'] for c in calls]}"
            logger.info("PASS: Model called lookup_professor, not search_available_courses")
