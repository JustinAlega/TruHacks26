"""
Canvas LMS Course & Grade Scraper
==================================
Extracts all courses, grades, and late assignment stats from Canvas LMS.

Usage:
  python canvas_scraper.py              # print courses + grades
  python canvas_scraper.py --save       # also save to courses.json
"""

import os
import json
import argparse
import requests
from dotenv import load_dotenv

# -- Load API key from .env ------------------------------------------------
load_dotenv()
API_KEY = os.getenv("canvas_API")

BASE_URL = "https://canvas.instructure.com/api/v1"
HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
}


def get_courses() -> list[dict]:
    """Fetch all active courses for the authenticated user."""
    courses = []
    url = f"{BASE_URL}/courses"
    params = {
        "enrollment_state": "active",
        "include[]": ["total_scores", "current_grading_period_scores", "term"],
        "per_page": 100,
    }

    while url:
        resp = requests.get(url, headers=HEADERS, params=params, timeout=30)
        resp.raise_for_status()
        courses.extend(resp.json())

        # Handle pagination via Link header
        url = None
        params = None  # params already encoded in the next URL
        link_header = resp.headers.get("Link", "")
        for part in link_header.split(","):
            if 'rel="next"' in part:
                url = part.split(";")[0].strip().strip("<>")
                break

    return courses


def get_late_stats(course_id: int) -> dict:
    """
    Fetch all assignments for a course (with submission data) and count
    how many were submitted late or are missing.

    Returns dict with total_assignments, late_assignments, missing_assignments, and on_time.
    """
    assignments = []
    url = f"{BASE_URL}/courses/{course_id}/assignments"
    params = {
        "include[]": ["submission"],
        "per_page": 100,
    }

    while url:
        resp = requests.get(url, headers=HEADERS, params=params, timeout=30)
        resp.raise_for_status()
        assignments.extend(resp.json())

        url = None
        params = None
        link_header = resp.headers.get("Link", "")
        for part in link_header.split(","):
            if 'rel="next"' in part:
                url = part.split(";")[0].strip().strip("<>")
                break

    # Count late and missing submissions
    total = len(assignments)
    late = 0
    missing = 0
    for assignment in assignments:
        submission = assignment.get("submission", {})
        if submission:
            if submission.get("late"):
                late += 1
            if submission.get("missing"):
                missing += 1

    return {
        "total_assignments": total,
        "late_assignments": late,
        "missing_assignments": missing,
        "on_time": total - late - missing,
        "late_fraction": f"{late}/{total}" if total > 0 else "0/0",
        "missing_fraction": f"{missing}/{total}" if total > 0 else "0/0",
    }


def extract_grades(course: dict, late_stats: dict) -> dict:
    """
    Extract course info and grade from a course object.

    Canvas returns grade info inside the 'enrollments' array
    when include[]=total_scores is used.
    """
    enrollments = course.get("enrollments", [])

    # Find the student enrollment (type = 'student')
    grade_info = {}
    for enrollment in enrollments:
        if enrollment.get("type") == "student":
            grade_info = {
                "current_score": enrollment.get("computed_current_score"),
                "current_grade": enrollment.get("computed_current_grade"),
                "final_score": enrollment.get("computed_final_score"),
                "final_grade": enrollment.get("computed_final_grade"),
            }
            break

    return {
        "course_id": course.get("id"),
        "course_name": course.get("name", "N/A"),
        "course_code": course.get("course_code", "N/A"),
        "current_score": grade_info.get("current_score"),
        "current_grade": grade_info.get("current_grade"),
        "final_score": grade_info.get("final_score"),
        "final_grade": grade_info.get("final_grade"),
        "total_assignments": late_stats.get("total_assignments", 0),
        "late_assignments": late_stats.get("late_assignments", 0),
        "late_fraction": late_stats.get("late_fraction", "0/0"),
        "missing_assignments": late_stats.get("missing_assignments", 0),
        "missing_fraction": late_stats.get("missing_fraction", "0/0"),
    }


def print_results(records: list[dict]) -> None:
    """Pretty-print course and grade info."""
    divider = "-" * 60
    for i, rec in enumerate(records, 1):
        print(f"\n{divider}")
        print(f"  #{i}  {rec['course_name']}")
        print(divider)
        print(f"  Course Code   : {rec['course_code']}")
        print(f"  Current Score : {rec['current_score'] or 'N/A'}")
        print(f"  Current Grade : {rec['current_grade'] or 'N/A'}")
        print(f"  Final Grade   : {rec['final_grade'] or 'N/A'}")
        print(f"  Late Work     : {rec['late_fraction']} assignments late")
        print(f"  Missing Work  : {rec['missing_fraction']} assignments missing")
    print(f"\n{'=' * 60}")
    print(f"  Total courses: {len(records)}")
    print(f"{'=' * 60}\n")


def save_to_json(records: list[dict], filename: str = "courses.json") -> None:
    """Save extracted course data to JSON."""
    filepath = os.path.join(os.path.dirname(__file__), filename)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2, ensure_ascii=False)
    print(f"[SAVED] Results saved to {filepath}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Canvas LMS Course & Grade Scraper",
    )
    parser.add_argument(
        "--save",
        action="store_true",
        help="Save results to courses.json",
    )
    args = parser.parse_args()

    if not API_KEY:
        print("[ERROR] Missing API key. Set 'canvas_API' in your .env file.")
        return

    print("[CANVAS] Fetching courses and grades...\n")

    try:
        courses = get_courses()
    except requests.exceptions.HTTPError as e:
        resp_text = "N/A"
        try:
            resp_text = e.response.text
        except Exception:
            pass
        print(f"[ERROR] API error: {e}")
        print(f"        Response: {resp_text}")
        return
    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Network error: {e}")
        return

    if not courses:
        print("[WARN] No courses found.")
        return

    records = []
    for c in courses:
        cid = c.get("id")
        print(f"  Checking assignments for: {c.get('name', cid)}")
        try:
            late_stats = get_late_stats(cid)
        except Exception:
            late_stats = {"total_assignments": 0, "late_assignments": 0, "late_fraction": "0/0"}
        records.append(extract_grades(c, late_stats))
    print()
    print_results(records)

    if args.save:
        save_to_json(records)


if __name__ == "__main__":
    main()
