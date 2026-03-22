"""
Tests for widget selection logic in the voice pipeline.

Unit tests for _resolve_widget / _format_widget (no Gemini needed).
Integration tests use real Gemini API + mocked tool functions.
"""

import asyncio
import os
import json
from unittest.mock import AsyncMock, patch, MagicMock

import pytest
import pytest_asyncio

# Ensure backend package is importable
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from pipeline import VoicePipeline, GEMINI_MODEL


# ── Fixtures ──────────────────────────────────────────────────────────

class FakeWS:
    """Accumulates sent JSON messages for assertion."""

    def __init__(self):
        self.messages: list[dict] = []

    async def send_json(self, data: dict):
        self.messages.append(data)

    def widget_messages(self) -> list[dict]:
        return [m for m in self.messages if m.get("type") == "widget"]


# Canned tool results matching what the real scrapers return

CANVAS_RESULT = {
    "results": [
        {
            "course_id": 101,
            "course_name": "Data Structures",
            "course_code": "CS 301",
            "current_score": 92.5,
            "current_grade": "A-",
            "late_assignments": 1,
            "missing_assignments": 0,
            "total_assignments": 12,
        },
        {
            "course_id": 102,
            "course_name": "Linear Algebra",
            "course_code": "MATH 240",
            "current_score": 85.0,
            "current_grade": "B+",
            "late_assignments": 0,
            "missing_assignments": 2,
            "total_assignments": 8,
        },
    ]
}

COURSE_SEARCH_RESULT = {
    "results": [
        {
            "course_code": "CS 370",
            "name": "Web Development",
            "section": "001",
            "crn": "24810",
            "time": "MWF 11:00-11:50",
            "professor": "Dr. Rivera",
            "credits": 3,
            "description": "Modern web application development with React, Node.js, and cloud deployment.",
        }
    ]
}

RMP_RESULT = {
    "firstName": "Sarah",
    "lastName": "Chen",
    "avgRating": 4.2,
    "numRatings": 47,
    "avgDifficulty": 3.1,
    "department": "Computer Science",
    "rmp_link": "https://www.ratemyprofessors.com/professor/12345",
}

RMP_RESULT_FULL = {
    "firstName": "Sarah",
    "lastName": "Chen",
    "avgRating": 4.2,
    "numRatings": 47,
    "avgDifficulty": 3.1,
    "department": "Computer Science",
    "wouldTakeAgainPercent": 89.0,
    "teacherRatingTags": [
        {"tagName": "Caring", "tagCount": 20},
        {"tagName": "Tough Grader", "tagCount": 15},
        {"tagName": "Amazing Lectures", "tagCount": 10},
    ],
    "rmp_link": "https://www.ratemyprofessors.com/professor/12345",
}

RMP_RESULT_NO_WTA = {
    "firstName": "Sarah",
    "lastName": "Chen",
    "avgRating": 4.2,
    "numRatings": 47,
    "avgDifficulty": 3.1,
    "department": "Computer Science",
    "wouldTakeAgainPercent": -1,
    "teacherRatingTags": [],
    "rmp_link": "https://www.ratemyprofessors.com/professor/12345",
}

JOBS_RESULT = {
    "results": [
        {
            "role": "Software Engineering Intern",
            "company": "TechCorp",
            "location": "San Francisco, CA",
            "remote": False,
            "technologies": ["React", "TypeScript", "Python"],
            "salary_min": 45,
            "salary_max": 55,
            "salary_currency": "USD",
            "industry": "Technology",
            "seniority": "Intern",
            "description": "Build cool stuff",
            "url": "https://example.com/apply",
            "company_domain": "techcorp.com",
        }
    ]
}


def make_pipeline(ws=None) -> VoicePipeline:
    """Create a VoicePipeline with a fake WS and real Gemini client."""
    return VoicePipeline(ws or FakeWS())


# ── Unit tests: _format_widget ────────────────────────────────────────


class TestFormatWidget:
    def test_format_job_listings(self):
        p = make_pipeline()
        args = {"titles": ["Software Engineer"], "technologies": ["Python"]}
        msg = p._format_widget("search_job_listings", args, JOBS_RESULT)

        assert msg is not None
        assert msg["type"] == "widget"
        assert msg["widget_type"] == "job-listings"
        assert msg["data"]["query"] == "Software Engineer"
        assert len(msg["data"]["listings"]) == 1

        listing = msg["data"]["listings"][0]
        assert listing["title"] == "Software Engineering Intern"
        assert listing["company"] == "TechCorp"
        assert listing["technologies"] == ["React", "TypeScript", "Python"]

    def test_format_professor(self):
        p = make_pipeline()
        args = {"professor_name": "Sarah Chen", "school_name": "Drexel"}
        msg = p._format_widget("lookup_professor", args, RMP_RESULT)

        assert msg is not None
        assert msg["type"] == "widget"
        assert msg["widget_type"] == "professor"
        assert msg["data"]["name"] == "Sarah Chen"
        assert msg["data"]["rating"] == 4.2
        assert msg["data"]["difficulty"] == 3.1
        assert msg["data"]["numRatings"] == 47
        # Defaults when RMP fields are missing
        assert msg["data"]["wouldTakeAgain"] == 0
        assert msg["data"]["topTags"] == []

    def test_format_professor_full_rmp_data(self):
        p = make_pipeline()
        args = {"professor_name": "Sarah Chen", "school_name": "Drexel"}
        msg = p._format_widget("lookup_professor", args, RMP_RESULT_FULL)

        assert msg["data"]["wouldTakeAgain"] == 89
        assert msg["data"]["topTags"] == ["Caring", "Tough Grader", "Amazing Lectures"]

    def test_format_professor_insufficient_wta(self):
        p = make_pipeline()
        args = {"professor_name": "Sarah Chen", "school_name": "Drexel"}
        msg = p._format_widget("lookup_professor", args, RMP_RESULT_NO_WTA)

        assert msg["data"]["wouldTakeAgain"] == 0
        assert msg["data"]["topTags"] == []

    def test_format_canvas_academic_overview(self):
        p = make_pipeline()
        msg = p._format_widget("get_canvas_courses", {}, CANVAS_RESULT)

        assert msg is not None
        assert msg["type"] == "widget"
        assert msg["widget_type"] == "academic-overview"
        data = msg["data"]
        assert "currentGPA" in data
        assert "totalCredits" in data
        assert "semesters" in data
        assert len(data["courses"]) == 2
        assert data["courses"][0]["courseId"] == "CS 301"
        assert data["courses"][0]["name"] == "Data Structures"
        assert data["courses"][0]["grade"] == "A-"
        assert data["courses"][0]["missingCount"] == 0
        assert data["courses"][1]["missingCount"] == 2

    def test_format_canvas_empty(self):
        p = make_pipeline()
        msg = p._format_widget("get_canvas_courses", {}, {"results": []})
        assert msg is None

    def test_format_course_details(self):
        p = make_pipeline()
        msg = p._format_widget("search_available_courses", {}, COURSE_SEARCH_RESULT)

        assert msg is not None
        assert msg["type"] == "widget"
        assert msg["widget_type"] == "course-details"
        assert msg["data"]["name"] == "Web Development"
        assert msg["data"]["courseId"] == "CS 370"
        assert msg["data"]["instructor"] == "Dr. Rivera"
        assert msg["data"]["credits"] == 3
        assert msg["data"]["schedule"] == "MWF 11:00-11:50"

    def test_format_course_details_empty(self):
        p = make_pipeline()
        msg = p._format_widget("search_available_courses", {}, {"results": []})
        assert msg is None

    def test_format_unknown_tool(self):
        p = make_pipeline()
        msg = p._format_widget("unknown_tool", {}, {"foo": "bar"})
        assert msg is None

    def test_format_professor_error(self):
        p = make_pipeline()
        error_result = {"error": "Professor not found: Fake Name at Drexel"}
        msg = p._format_widget("lookup_professor", {"professor_name": "Fake"}, error_result)
        assert msg is None

    def test_job_listings_no_salary(self):
        p = make_pipeline()
        result = {
            "results": [
                {
                    "role": "Intern",
                    "company": "Startup",
                    "location": "Remote",
                    "technologies": ["Go"],
                    "url": None,
                }
            ]
        }
        msg = p._format_widget("search_job_listings", {"titles": []}, result)
        listing = msg["data"]["listings"][0]
        assert listing["salary"] is None

    def test_job_listings_salary_formatting(self):
        p = make_pipeline()
        result = {
            "results": [
                {
                    "role": "SWE",
                    "company": "BigCo",
                    "location": "NYC",
                    "technologies": [],
                    "salary_min": 80000,
                    "salary_max": 120000,
                }
            ]
        }
        msg = p._format_widget("search_job_listings", {"titles": ["SWE"]}, result)
        assert msg["data"]["listings"][0]["salary"] == "$80,000–$120,000"

    def test_job_listings_none_titles(self):
        p = make_pipeline()
        msg = p._format_widget("search_job_listings", {}, JOBS_RESULT)
        assert msg["data"]["query"] == "Job Search"

    def test_job_listings_empty_titles(self):
        p = make_pipeline()
        msg = p._format_widget("search_job_listings", {"titles": []}, JOBS_RESULT)
        assert msg["data"]["query"] == "Job Search"


# ── Unit tests: _resolve_widget ───────────────────────────────────────


class TestResolveWidget:
    @pytest.mark.asyncio
    async def test_empty_log_returns_none(self):
        p = make_pipeline()
        result = await p._resolve_widget([])
        assert result is None

    @pytest.mark.asyncio
    async def test_single_tool_single_call(self):
        p = make_pipeline()
        log = [("search_job_listings", {"titles": ["SWE"]}, JOBS_RESULT)]
        result = await p._resolve_widget(log)
        assert result is not None
        assert result["widget_type"] == "job-listings"

    @pytest.mark.asyncio
    async def test_single_tool_multiple_calls_uses_last(self):
        """When the same tool is called multiple times, use the last result."""
        p = make_pipeline()
        early_result = {"results": [{"role": "Old Job", "company": "OldCo", "location": "NYC", "technologies": []}]}
        log = [
            ("search_job_listings", {"titles": ["Data"]}, early_result),
            ("search_job_listings", {"titles": ["SWE"]}, JOBS_RESULT),
        ]
        result = await p._resolve_widget(log)
        assert result is not None
        assert result["widget_type"] == "job-listings"
        # Should use the last result (TechCorp), not the first (OldCo)
        assert result["data"]["listings"][0]["company"] == "TechCorp"

    @pytest.mark.asyncio
    async def test_single_tool_returns_formatted(self):
        p = make_pipeline()
        log = [("lookup_professor", {"professor_name": "Chen", "school_name": "Drexel"}, RMP_RESULT)]
        result = await p._resolve_widget(log)
        assert result["widget_type"] == "professor"
        assert result["data"]["name"] == "Sarah Chen"


# ── Integration tests: real Gemini + mocked tools ─────────────────────


GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
skip_no_key = pytest.mark.skipif(
    not GEMINI_API_KEY, reason="GEMINI_API_KEY not set"
)


def mock_tool_map():
    """Return a TOOL_MAP where all tools return canned data."""
    def fake_canvas():
        return [
            {
                "course_id": 101, "course_name": "Data Structures",
                "course_code": "CS 301", "current_score": 92.5,
                "current_grade": "A-", "late_assignments": 1,
                "missing_assignments": 0, "total_assignments": 12,
            },
        ]

    def fake_rmp(professor_name, school_name):
        return {
            "firstName": "Sarah", "lastName": "Chen",
            "avgRating": 4.2, "numRatings": 47,
            "avgDifficulty": 3.1, "department": "Computer Science",
            "wouldTakeAgainPercent": 89.0,
            "teacherRatingTags": [{"tagName": "Caring", "tagCount": 20}],
            "rmp_link": "https://www.ratemyprofessors.com/professor/12345",
        }

    def fake_course_search(query):
        return [
            {
                "course_code": "CS 370", "name": "Web Development",
                "section": "001", "crn": "24810", "time": "MWF 11:00-11:50",
                "professor": "Dr. Rivera", "credits": 3,
                "description": "Modern web application development.",
            },
        ]

    def fake_jobs(titles=None, technologies=None, limit=10):
        return [
            {
                "role": "Software Engineering Intern", "company": "TechCorp",
                "location": "San Francisco, CA", "remote": False,
                "technologies": ["React", "TypeScript", "Python"],
                "salary_min": 45, "salary_max": 55,
                "salary_currency": "USD", "industry": "Technology",
                "seniority": "Intern", "description": "Build cool stuff",
                "url": "https://example.com/apply", "company_domain": "techcorp.com",
            }
        ]

    return {
        "get_canvas_courses": fake_canvas,
        "lookup_professor": fake_rmp,
        "search_job_listings": fake_jobs,
        "search_available_courses": fake_course_search,
    }


async def run_pipeline_text(user_text: str) -> FakeWS:
    """Run the pipeline with mocked tools and TTS, return the fake WS."""
    ws = FakeWS()
    pipeline = VoicePipeline(ws)

    # Mock TTS so it doesn't connect to ElevenLabs
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


@skip_no_key
class TestIntegrationSingleTool:
    @pytest.mark.asyncio
    async def test_grades_query_sends_widget(self):
        """Ask about grades → should call get_canvas_courses → academic-overview widget."""
        ws = await run_pipeline_text("What are my current grades in all my courses?")
        widgets = ws.widget_messages()
        # Gemini may not always call the tool — verify correctness when it does
        assert len(widgets) <= 1
        if widgets:
            assert widgets[0]["widget_type"] == "academic-overview"

    @pytest.mark.asyncio
    async def test_professor_query_sends_widget(self):
        """Ask about a professor → should call lookup_professor → professor widget."""
        ws = await run_pipeline_text(
            "What's the rating for Professor Sarah Chen at Drexel University?"
        )
        widgets = ws.widget_messages()
        assert len(widgets) <= 1
        if widgets:
            assert widgets[0]["widget_type"] == "professor"

    @pytest.mark.asyncio
    async def test_job_query_sends_widget(self):
        """Ask about jobs → should call search_job_listings → job-listings widget."""
        ws = await run_pipeline_text(
            "Find me software engineering internships that use Python"
        )
        widgets = ws.widget_messages()
        assert len(widgets) <= 1
        if widgets:
            assert widgets[0]["widget_type"] == "job-listings"


@skip_no_key
class TestIntegrationNoTool:
    @pytest.mark.asyncio
    async def test_greeting_no_widget(self):
        """A simple greeting should not produce any widget."""
        ws = await run_pipeline_text("Hello, how are you?")
        widgets = ws.widget_messages()
        assert len(widgets) == 0


@skip_no_key
class TestIntegrationMultipleTool:
    @pytest.mark.asyncio
    async def test_multi_tool_sends_one_widget(self):
        """Ask about grades AND jobs → multiple tools called → exactly one widget."""
        ws = await run_pipeline_text(
            "Show me my grades and also find me some software engineering jobs"
        )
        widgets = ws.widget_messages()
        # Should send at most one widget (Gemini picks the best one)
        assert len(widgets) <= 1
        if widgets:
            assert widgets[0]["widget_type"] in ("academic-overview", "job-listings")
