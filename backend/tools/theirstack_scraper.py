"""
TheirStack Job Market Intelligence Scraper
==========================================
Extracts:
  - Role Name        -> job_title
  - Technologies     -> technologies (array)
  - Salary           -> salary_min / salary_max
  - Industry         -> company_object.industry
  - School History   -> Filter by company_domain_or (alumni-heavy companies)

Usage:
  python theirstack_scraper.py                          # general search
  python theirstack_scraper.py --school-filter           # alumni company filter
  python theirstack_scraper.py --titles "Data Engineer"  # custom titles
"""

import os
import json
import argparse
import requests
from dotenv import load_dotenv

# ── Load API key from .env ────────────────────────────────────────────────────
load_dotenv()
API_KEY = os.getenv("theirstacks_API")

BASE_URL = "https://api.theirstack.com/v1/jobs/search"
HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
}

# ── Alumni-heavy company domains ──────────────────────────────────────────────
# Customize this list with the top companies from your school's LinkedIn Alumni
# tab ("Where they work" section). These are example placeholders.
ALUMNI_COMPANY_DOMAINS = [
    "google.com",
    "microsoft.com",
    "amazon.com",
    "apple.com",
    "meta.com",
    "salesforce.com",
    "ibm.com",
    "oracle.com",
    "accenture.com",
    "deloitte.com",
    "jpmorgan.com",
    "goldmansachs.com",
    "ford.com",
    "generalmotors.com",
    "boeing.com",
    "lockheedmartin.com",
    "nvidia.com",
    "intel.com",
    "cisco.com",
    "adobe.com",
]


def search_jobs(
    titles: list[str] | None = None,
    technologies: list[str] | None = None,
    company_domains: list[str] | None = None,
    posted_at_max_age_days: int = 30,
    limit: int = 25,
    page: int = 0,
) -> dict:
    """
    Query TheirStack's /v1/jobs/search endpoint.

    Parameters
    ----------
    titles : list[str], optional
        Job titles to search (OR logic).
    technologies : list[str], optional
        Technologies to filter by (OR logic).
    company_domains : list[str], optional
        Company domains to restrict results to.
    posted_at_max_age_days : int
        Only return jobs posted within this many days (required by API).
    limit : int
        Max results per page (default 25).
    page : int
        Page number for pagination.

    Returns
    -------
    dict  -- Raw JSON response from TheirStack.
    """
    payload: dict = {
        "limit": limit,
        "page": page,
        "posted_at_max_age_days": posted_at_max_age_days,
        "job_country_code_or": ["US"],
    }

    if titles:
        payload["job_title_or"] = titles
    if technologies:
        payload["job_description_pattern_or"] = technologies
    if company_domains:
        payload["company_domain_or"] = company_domains

    response = requests.post(BASE_URL, json=payload, headers=HEADERS, timeout=30)
    response.raise_for_status()
    return response.json()


def extract_fields(job: dict) -> dict:
    """
    Pull the key data points from a single job object.

    Returns a clean dict with:
      role, technologies, salary_min, salary_max, salary_currency,
      industry, company, company_domain, description (truncated)
    """
    company_obj = job.get("company_object") or {}

    return {
        "role": job.get("job_title", "N/A"),
        "url": job.get("final_url") or job.get("url", "N/A"),
        "technologies": job.get("technology_slugs", []) or [],
        "salary_min": job.get("min_annual_salary"),
        "salary_max": job.get("max_annual_salary"),
        "salary_currency": job.get("salary_currency"),
        "salary_string": job.get("salary_string"),
        "industry": (
            company_obj.get("industry", "N/A")
            if isinstance(company_obj, dict)
            else "N/A"
        ),
        "company": job.get("company", "N/A"),
        "company_domain": job.get("company_domain", "N/A"),
        "location": job.get("short_location") or job.get("location", "N/A"),
        "remote": job.get("remote", False),
        "seniority": job.get("seniority", "N/A"),
        "description": (job.get("description") or "")[:300] + "...",
        "date_posted": job.get("date_posted", ""),
    }


def format_salary(record: dict) -> str:
    """Return a human-readable salary string."""
    lo, hi, cur = record["salary_min"], record["salary_max"], record["salary_currency"]
    if lo and hi:
        return f"{cur or '$'} {lo:,.0f} - {hi:,.0f}"
    if lo:
        return f"{cur or '$'} {lo:,.0f}+"
    if hi:
        return f"Up to {cur or '$'} {hi:,.0f}"
    if record.get("salary_string"):
        return record["salary_string"]
    return "Not listed"


def print_results(records: list[dict]) -> None:
    """Pretty-print extracted job records to the console."""
    divider = "-" * 72
    for i, rec in enumerate(records, 1):
        print(f"\n{divider}")
        print(f"  #{i}  {rec['role']}")
        print(divider)
        print(f"  Company     : {rec['company']} ({rec['company_domain']})")
        print(f"  Industry    : {rec['industry']}")
        print(f"  Location    : {rec['location']}{' [Remote]' if rec['remote'] else ''}")
        print(f"  Seniority   : {rec['seniority']}")
        print(f"  Technologies: {', '.join(rec['technologies']) if rec['technologies'] else 'N/A'}")
        print(f"  Salary      : {format_salary(rec)}")
        print(f"  Description : {rec['description']}")
    print(f"\n{'=' * 72}")
    print(f"  Total results shown: {len(records)}")
    print(f"{'=' * 72}\n")


def save_to_json(records: list[dict], filename: str = "jobs.json") -> None:
    """Dump extracted records to a JSON file."""
    filepath = os.path.join(os.path.dirname(__file__), filename)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2, ensure_ascii=False)
    print(f"[SAVED] Results saved to {filepath}")


# ── CLI ───────────────────────────────────────────────────────────────────────
def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="TheirStack Job Market Intelligence Scraper",
    )
    parser.add_argument(
        "--titles",
        nargs="+",
        default=["Software Engineer", "Data Engineer"],
        help='Job titles to search (default: "Software Engineer" "Data Engineer")',
    )
    parser.add_argument(
        "--tech",
        nargs="+",
        default=None,
        help="Filter by technologies (e.g. Python Apex Snowflake)",
    )
    parser.add_argument(
        "--school-filter",
        action="store_true",
        help="Restrict results to alumni-heavy companies (edit ALUMNI_COMPANY_DOMAINS list)",
    )
    parser.add_argument(
        "--domains",
        nargs="+",
        default=None,
        help="Custom company domains to filter by",
    )
    parser.add_argument(
        "--days",
        type=int,
        default=30,
        help="Only show jobs posted within this many days (default 30)",
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=25,
        help="Max results to return (default 25)",
    )
    parser.add_argument(
        "--page",
        type=int,
        default=0,
        help="Page number for pagination (default 0)",
    )
    parser.add_argument(
        "--save",
        action="store_true",
        help="Save results to jobs.json",
    )
    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    if not API_KEY:
        print("[ERROR] Missing API key. Set 'theirstacks_API' in your .env file.")
        return

    # Determine company domain filter
    domains = None
    if args.school_filter:
        domains = ALUMNI_COMPANY_DOMAINS
        print("[SCHOOL] Alumni filter ON -- searching alumni-heavy companies only")
    elif args.domains:
        domains = args.domains

    print(f"[SEARCH] Searching for: {', '.join(args.titles)}")
    if args.tech:
        print(f"[TECH]   Tech filter : {', '.join(args.tech)}")
    if domains:
        print(f"[DOMAIN] Domains     : {', '.join(domains)}")
    print()

    try:
        raw = search_jobs(
            titles=args.titles,
            technologies=args.tech,
            company_domains=domains,
            posted_at_max_age_days=args.days,
            limit=args.limit,
            page=args.page,
        )
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

    # Extract the jobs list — TheirStack wraps results in a "data" key
    jobs = raw.get("data", raw) if isinstance(raw, dict) else raw
    if isinstance(jobs, dict):
        jobs = jobs.get("results", [])

    if not jobs:
        print("[WARN] No results found. Try broadening your search.")
        return

    records = [extract_fields(job) for job in jobs]
    print_results(records)

    if args.save:
        save_to_json(records)


if __name__ == "__main__":
    main()
