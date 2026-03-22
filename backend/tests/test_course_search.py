"""Tests for the course catalog search tool."""

import logging
import os
import re
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from tools.course_scraper import search_courses

logger = logging.getLogger(__name__)


def _course_num(course_code: str) -> int:
    """Extract the numeric portion from a course code like 'CS 365L'."""
    raw = course_code.split(" ")[1]
    return int(re.match(r"\d+", raw).group())


def test_major_filter(caplog):
    with caplog.at_level(logging.INFO):
        logger.info("=== test_major_filter ===")
        logger.info("Query: search_courses(major='CS')")
        results = search_courses(major="CS")
        logger.info("Returned %d results", len(results))
        for r in results:
            logger.info("  %s — %s (prof: %s)", r["course_code"], r["name"], r["professor"])
            assert r["course_code"].startswith("CS "), f"Expected CS prefix, got {r['course_code']}"
        assert len(results) > 0, "Expected at least one CS course"
        logger.info("PASS: All %d results have 'CS ' prefix", len(results))


def test_level_filter(caplog):
    with caplog.at_level(logging.INFO):
        logger.info("=== test_level_filter ===")
        logger.info("Query: search_courses(level=300)")
        results = search_courses(level=300)
        logger.info("Returned %d results across all majors", len(results))
        for r in results:
            code = r["course_code"]
            num = _course_num(code)
            logger.info("  %s — %s (num=%d)", code, r["name"], num)
            assert 300 <= num <= 399, f"Course {code} has num {num}, expected 300-399"
        assert len(results) > 0, "Expected at least one 300-level course"
        logger.info("PASS: All %d results are in 300-399 range", len(results))


def test_combined_filter(caplog):
    with caplog.at_level(logging.INFO):
        logger.info("=== test_combined_filter ===")
        logger.info("Query: search_courses(major='CS', level=100)")
        results = search_courses(major="CS", level=100)
        logger.info("Returned %d results", len(results))
        for r in results:
            num = _course_num(r["course_code"])
            logger.info("  %s — %s (num=%d)", r["course_code"], r["name"], num)
            assert r["course_code"].startswith("CS "), f"Expected CS prefix, got {r['course_code']}"
            assert 100 <= num <= 199, f"Course {r['course_code']} has num {num}, expected 100-199"
        assert len(results) > 0, "Expected at least one CS 100-level course"
        logger.info("PASS: All %d results are CS 100-199", len(results))


def test_no_filters_returns_results(caplog):
    with caplog.at_level(logging.INFO):
        logger.info("=== test_no_filters_returns_results ===")
        logger.info("Query: search_courses() — no filters")
        results = search_courses()
        logger.info("Returned %d results", len(results))
        logger.info("  First: %s — %s", results[0]["course_code"], results[0]["name"])
        logger.info("  Last:  %s — %s", results[-1]["course_code"], results[-1]["name"])
        assert len(results) > 0, "Expected results with no filters"
        assert len(results) <= 50, f"Expected <= 50 results (limit), got {len(results)}"
        logger.info("PASS: Got %d results, within 50 limit", len(results))


def test_invalid_major_returns_empty(caplog):
    with caplog.at_level(logging.INFO):
        logger.info("=== test_invalid_major_returns_empty ===")
        logger.info("Query: search_courses(major='ZZZNOTREAL')")
        results = search_courses(major="ZZZNOTREAL")
        logger.info("Returned %d results", len(results))
        assert results == [], f"Expected empty list for fake major, got {len(results)} results"
        logger.info("PASS: Correctly returned empty list for nonexistent major")


def test_result_has_expected_keys(caplog):
    with caplog.at_level(logging.INFO):
        logger.info("=== test_result_has_expected_keys ===")
        logger.info("Query: search_courses(major='CS', level=100)")
        results = search_courses(major="CS", level=100)
        expected_keys = {"course_code", "name", "section", "crn", "time", "professor", "credits", "description"}
        actual_keys = set(results[0].keys())
        logger.info("Expected keys: %s", sorted(expected_keys))
        logger.info("Actual keys:   %s", sorted(actual_keys))
        missing = expected_keys - actual_keys
        extra = actual_keys - expected_keys
        if missing:
            logger.info("Missing: %s", missing)
        if extra:
            logger.info("Extra: %s", extra)
        assert actual_keys == expected_keys
        logger.info("PASS: Keys match exactly")


def test_case_insensitive_major(caplog):
    with caplog.at_level(logging.INFO):
        logger.info("=== test_case_insensitive_major ===")
        logger.info("Query: search_courses(major='CS') vs search_courses(major='cs')")
        upper = search_courses(major="CS")
        lower = search_courses(major="cs")
        logger.info("Uppercase 'CS' returned %d results", len(upper))
        logger.info("Lowercase 'cs' returned %d results", len(lower))
        assert len(upper) == len(lower), f"Case mismatch: CS={len(upper)}, cs={len(lower)}"
        logger.info("PASS: Both return %d results", len(upper))
