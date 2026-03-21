"""
Rate My Professor Scraper
=========================
Fetches professor ratings and school info from Rate My Professors.

Usage:
  python rmp_scraper.py --professor "John Smith" --school "University of Michigan"
  python rmp_scraper.py --professor "John Smith" --school "University of Michigan" --save
"""

import os
import json
import argparse
import requests

# -- Constants -----------------------------------------------------------------
RMP_GRAPHQL_URL = "https://www.ratemyprofessors.com/graphql"
RMP_AUTH_HEADER = "Basic dGVzdDp0ZXN0"  # Static auth used by RMP web app

# -- GraphQL Queries -----------------------------------------------------------
SCHOOL_SEARCH_QUERY = """
query SchoolSearch($query: String!) {
  newSearch {
    schools(query: {text: $query}) {
      edges {
        node {
          id
          name
          city
          state
        }
      }
    }
  }
}
"""

TEACHER_SEARCH_QUERY = """
query TeacherSearch($query: String!, $schoolID: ID!) {
  newSearch {
    teachers(query: {text: $query, schoolID: $schoolID}) {
      edges {
        node {
          id
          firstName
          lastName
          avgRating
          numRatings
          avgDifficulty
          department
          school {
            name
            id
          }
        }
      }
    }
  }
}
"""

def rmp_request(query: str, variables: dict) -> dict:
    """Make a GraphQL request to Rate My Professor."""
    headers = {
        "Authorization": RMP_AUTH_HEADER,
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    payload = {
        "query": query,
        "variables": variables
    }
    resp = requests.post(RMP_GRAPHQL_URL, json=payload, headers=headers, timeout=30)
    resp.raise_for_status()
    return resp.json()

def search_school(school_name: str) -> dict | None:
    """Find a school by name and return its node."""
    data = rmp_request(SCHOOL_SEARCH_QUERY, {"query": school_name})
    edges = data.get("data", {}).get("newSearch", {}).get("schools", {}).get("edges", [])
    if not edges:
        return None
    # Return the first (best) match
    return edges[0]["node"]

def search_professor(professor_name: str, school_id: str) -> dict | None:
    """Find a professor by name within a school and return its node."""
    data = rmp_request(TEACHER_SEARCH_QUERY, {"query": professor_name, "schoolID": school_id})
    edges = data.get("data", {}).get("newSearch", {}).get("teachers", {}).get("edges", [])
    if not edges:
        return None
    # Return the first (best) match
    return edges[0]["node"]

def print_professor(prof: dict) -> None:
    """Pretty-print professor details."""
    divider = "-" * 60
    print(f"\n{divider}")
    print(f"  Professor: {prof['firstName']} {prof['lastName']}")
    print(divider)
    print(f"  School      : {prof['school']['name']}")
    print(f"  Department  : {prof['department']}")
    print(f"  Rating      : {prof['avgRating']} / 5.0 ({prof['numRatings']} ratings)")
    print(f"  Difficulty  : {prof['avgDifficulty']} / 5.0")
    print(f"  RMP Link    : https://www.ratemyprofessors.com/professor/{prof['id'][11:]}")
    print(f"{'=' * 60}\n")

def save_to_json(data: dict, filename: str = "professors.json") -> None:
    """Save extracted professor data to JSON."""
    filepath = os.path.join(os.path.dirname(__file__), filename)
    
    # Load existing data if file exists
    existing_data = []
    if os.path.exists(filepath):
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                existing_data = json.load(f)
                if not isinstance(existing_data, list):
                    existing_data = []
        except Exception:
            existing_data = []

    # Update or add new record
    updated = False
    for i, item in enumerate(existing_data):
        if item.get("id") == data.get("id"):
            existing_data[i] = data
            updated = True
            break
    
    if not updated:
        existing_data.append(data)

    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(existing_data, f, indent=2, ensure_ascii=False)
    print(f"[SAVED] Results saved to {filepath}")

def main() -> None:
    parser = argparse.ArgumentParser(description="Rate My Professor Scraper")
    parser.add_argument("--professor", required=True, help="Name of the professor")
    parser.add_argument("--school", required=True, help="Name of the school")
    parser.add_argument("--save", action="store_true", help="Save results to professors.json")
    
    args = parser.parse_args()

    print(f"[RMP] Searching for school: {args.school}...")
    school = search_school(args.school)
    if not school:
        print(f"[ERROR] School not found: {args.school}")
        return
    
    print(f"[RMP] School found: {school['name']} (ID: {school['id']})")
    print(f"[RMP] Searching for professor: {args.professor}...")
    
    prof = search_professor(args.professor, school["id"])
    if not prof:
        print(f"[ERROR] Professor not found: {args.professor} at {school['name']}")
        return

    print_professor(prof)

    if args.save:
        save_to_json(prof)

if __name__ == "__main__":
    main()
