"""
Gemini-callable tool functions wrapping existing scrapers.

Each function here is passed directly to Gemini's `tools` parameter.
The google-genai SDK auto-generates FunctionDeclarations from the
type hints and docstrings.
"""

from tools.canvas_scraper import get_courses, extract_grades, get_late_stats
from tools.rmp_scraper import search_school, search_professor
from tools.theirstack_scraper import search_jobs as _search_jobs, extract_fields


def get_canvas_courses() -> list[dict]:
    """Fetch all current courses, grades, and late assignment stats from Canvas LMS.

    Returns a list of course objects with fields: course_name, course_code,
    current_score, current_grade, final_score, final_grade, late_assignments,
    total_assignments.
    """
    courses = get_courses()
    records = []
    for c in courses:
        cid = c.get("id")
        try:
            late_stats = get_late_stats(cid)
        except Exception:
            late_stats = {
                "total_assignments": 0,
                "late_assignments": 0,
                "late_fraction": "0/0",
            }
        records.append(extract_grades(c, late_stats))
    return records


def lookup_professor(professor_name: str, school_name: str) -> dict:
    """Look up a professor's ratings on Rate My Professors.

    Args:
        professor_name: Full or partial name of the professor (e.g. "John Smith").
        school_name: Name of the university (e.g. "University of Michigan").

    Returns a dict with: firstName, lastName, avgRating, numRatings,
    avgDifficulty, department, school name, and RMP profile link.
    """
    school = search_school(school_name)
    if not school:
        return {"error": f"School not found: {school_name}"}

    prof = search_professor(professor_name, school["id"])
    if not prof:
        return {"error": f"Professor not found: {professor_name} at {school['name']}"}

    prof["rmp_link"] = (
        f"https://www.ratemyprofessors.com/professor/{prof['id'][11:]}"
    )
    return prof


def search_job_listings(
    titles: list[str] | None = None,
    technologies: list[str] | None = None,
    limit: int = 10,
) -> list[dict]:
    """Search for job listings matching given criteria.

    Args:
        titles: Job titles to search for (e.g. ["Software Engineer", "Data Scientist"]).
            Defaults to Software Engineer and Data Engineer if not provided.
        technologies: Technologies to filter by (e.g. ["Python", "React"]).
        limit: Maximum number of results to return. Defaults to 10.

    Returns a list of job objects with fields: role, company, location,
    technologies, salary range, industry, seniority, and description.
    """
    raw = _search_jobs(
        titles=titles,
        technologies=technologies,
        limit=limit,
    )
    jobs = raw.get("data", raw) if isinstance(raw, dict) else raw
    if isinstance(jobs, dict):
        jobs = jobs.get("results", [])

    return [extract_fields(job) for job in jobs]


# List of all tool functions for Gemini
ALL_TOOLS = [get_canvas_courses, lookup_professor, search_job_listings]
