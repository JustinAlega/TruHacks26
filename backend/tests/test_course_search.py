"""Tests for the RAG-based course catalog search."""

import logging
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from tools.course_scraper import search_courses

logger = logging.getLogger(__name__)


def test_programming_query(caplog):
    with caplog.at_level(logging.INFO):
        logger.info("=== test_programming_query ===")
        logger.info("Query: 'introductory programming'")
        results = search_courses("introductory programming")
        logger.info("Returned %d results", len(results))
        for r in results:
            logger.info("  %s — %s", r["course_code"], r["name"])
        cs_count = sum(1 for r in results if r["course_code"].startswith("CS "))
        logger.info("CS courses in results: %d / %d", cs_count, len(results))
        assert cs_count >= 2, f"Expected at least 2 CS courses for 'introductory programming', got {cs_count}"
        logger.info("PASS: Found %d CS courses", cs_count)


def test_accounting_query(caplog):
    with caplog.at_level(logging.INFO):
        logger.info("=== test_accounting_query ===")
        logger.info("Query: 'accounting and financial reporting'")
        results = search_courses("accounting and financial reporting")
        logger.info("Returned %d results", len(results))
        for r in results:
            logger.info("  %s — %s", r["course_code"], r["name"])
        acct_count = sum(1 for r in results if r["course_code"].startswith("ACCT "))
        logger.info("ACCT courses in results: %d / %d", acct_count, len(results))
        assert acct_count >= 2, f"Expected at least 2 ACCT courses, got {acct_count}"
        logger.info("PASS: Found %d ACCT courses", acct_count)


def test_biology_query(caplog):
    with caplog.at_level(logging.INFO):
        logger.info("=== test_biology_query ===")
        logger.info("Query: 'biology lab'")
        results = search_courses("biology lab")
        logger.info("Returned %d results", len(results))
        for r in results:
            logger.info("  %s — %s", r["course_code"], r["name"])
        bio_count = sum(1 for r in results if r["course_code"].startswith("BIOL "))
        logger.info("BIOL courses in results: %d / %d", bio_count, len(results))
        assert bio_count >= 2, f"Expected at least 2 BIOL courses, got {bio_count}"
        logger.info("PASS: Found %d BIOL courses", bio_count)


def test_art_query(caplog):
    with caplog.at_level(logging.INFO):
        logger.info("=== test_art_query ===")
        logger.info("Query: 'painting and sculpture'")
        results = search_courses("painting and sculpture")
        logger.info("Returned %d results", len(results))
        for r in results:
            logger.info("  %s — %s", r["course_code"], r["name"])
        art_count = sum(1 for r in results if r["course_code"].startswith("ART "))
        logger.info("ART courses in results: %d / %d", art_count, len(results))
        assert art_count >= 2, f"Expected at least 2 ART courses, got {art_count}"
        logger.info("PASS: Found %d ART courses", art_count)


def test_returns_expected_keys(caplog):
    with caplog.at_level(logging.INFO):
        logger.info("=== test_returns_expected_keys ===")
        results = search_courses("anything")
        expected_keys = {"course_code", "name", "section", "crn", "time", "professor", "credits", "description"}
        actual_keys = set(results[0].keys())
        logger.info("Expected keys: %s", sorted(expected_keys))
        logger.info("Actual keys:   %s", sorted(actual_keys))
        assert actual_keys == expected_keys
        logger.info("PASS: Keys match exactly")


def test_top_k_limit(caplog):
    with caplog.at_level(logging.INFO):
        logger.info("=== test_top_k_limit ===")
        results_5 = search_courses("computer science", top_k=5)
        results_3 = search_courses("computer science", top_k=3)
        logger.info("top_k=5 returned %d results", len(results_5))
        logger.info("top_k=3 returned %d results", len(results_3))
        assert len(results_5) == 5
        assert len(results_3) == 3
        logger.info("PASS: top_k correctly limits results")


def test_relevance_ordering(caplog):
    with caplog.at_level(logging.INFO):
        logger.info("=== test_relevance_ordering ===")
        logger.info("Query: 'artificial intelligence'")
        results = search_courses("artificial intelligence")
        logger.info("Top result: %s — %s", results[0]["course_code"], results[0]["name"])
        logger.info("Last result: %s — %s", results[-1]["course_code"], results[-1]["name"])
        # The top result should contain "artificial intelligence" or "AI" in the name
        top_name = results[0]["name"].lower()
        assert "artificial intelligence" in top_name or "ai" in top_name, \
            f"Expected top result to be about AI, got: {results[0]['name']}"
        logger.info("PASS: Top result is about AI")
