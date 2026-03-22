"""
Gemini-callable tool functions wrapping existing scrapers.

Each function here is passed directly to Gemini's `tools` parameter.
The google-genai SDK auto-generates FunctionDeclarations from the
type hints and docstrings.
"""

from tools.canvas_scraper import get_courses, extract_grades, get_late_stats
from tools.course_scraper import search_courses as _search_courses
from tools.rmp_scraper import search_school, search_professor
from tools.course_scraper import search_courses as _search_courses
from tools.theirstack_scraper import search_jobs as _search_jobs, extract_fields
import json
import os

def _fill_elective_options(node: dict) -> None:
    """For wildcard nodes, prefill electiveOptions from the course catalog."""
    if node.get("status") != "wildcard":
        return

    name = node.get("name", "")
    if "CS Elective" in name:
        query = "computer science upper level elective 300 400"
    elif "JINS" in node.get("id", ""):
        query = "JINS 300 level writing enriched"
    else:
        query = "elective course"

    results = _search_courses(query=query, top_k=10)
    node["electiveOptions"] = [
        {
            "course": r.get("course_code", ""),
            "section": r.get("section", ""),
            "name": r.get("name", ""),
            "crn": r.get("crn", ""),
            "time": r.get("time", ""),
            "professor": r.get("professor", ""),
            "description": r.get("description", ""),
            "credits": r.get("credits", 3),
        }
        for r in results
    ]


def get_cs_degree_roadmap() -> dict:
    """Fetch the student's Computer Science degree roadmap and completion status.

    Returns a widget payload containing the degree major and the list of course nodes
    with prerequisite paths and completion status. Wildcard elective nodes are
    populated with available course options from the catalog.
    """
    script_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.dirname(script_dir)
    json_path = os.path.join(backend_dir, 'cs_degree_roadmap.json')

    with open(json_path, 'r', encoding='utf-8') as f:
        roadmap = json.load(f)

    for node in roadmap.get("nodes", []):
        _fill_elective_options(node)

    return roadmap

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


def search_available_courses(query: str) -> list[dict]:
    """Search the university course catalog using natural language.

    Args:
        query: Natural language description of what courses to find
            (e.g. "introductory programming", "upper level biology labs",
            "courses about data science or machine learning").

    Returns a list of the most relevant courses with fields: course_code,
    name, section, crn, time, professor, credits, description.
    """
    return _search_courses(query=query)


# List of all tool functions for Gemini
ALL_TOOLS = [get_canvas_courses, lookup_professor, search_job_listings, get_cs_degree_roadmap, search_available_courses]
