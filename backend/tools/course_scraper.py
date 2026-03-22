"""
Query the local availablecourses.db SQLite database.

Supports filtering by major prefix (e.g. "CS") and course level
(e.g. 300 returns 300–399).
"""

import os
import sqlite3

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "availablecourses.db")


def search_courses(
    major: str | None = None,
    level: int | None = None,
) -> list[dict]:
    """Search available courses with optional major and level filters.

    Args:
        major: Department prefix, e.g. "CS", "MATH", "ACCT".
        level: Course level as a multiple of 100 (e.g. 300 returns 300–399).

    Returns:
        List of course dicts with keys: course_code, name, section, crn,
        time, professor, credits, description.
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        query = "SELECT course_code, name, section, crn, time, professor, credits, description FROM courses WHERE 1=1"
        params: list = []

        if major:
            query += " AND course_code LIKE ? || ' %'"
            params.append(major.upper())

        if level is not None:
            # Extract the numeric portion after the space, cast to int, and range-check
            query += (
                " AND CAST(SUBSTR(course_code, INSTR(course_code, ' ') + 1) AS INTEGER)"
                " BETWEEN ? AND ?"
            )
            params.extend([level, level + 99])

        query += " ORDER BY course_code LIMIT 50"

        rows = conn.execute(query, params).fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()
