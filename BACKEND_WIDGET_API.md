# Backend → Frontend Widget API

## How It Works

The frontend listens for a **`widget`** message type on the existing WebSocket connection (`/ws`). When the backend sends this message, the frontend automatically creates a draggable, glassmorphic widget popup on the user's canvas.

The backend sends this message **after all tool call rounds complete** (not per-tool-call). `_resolve_widget()` in `pipeline.py` picks the single best tool result to display, then `_format_widget()` transforms it to the widget schema. The widget appears on the HUD after Aria finishes speaking.

---

## WebSocket Message Format

```json
{
  "type": "widget",
  "widget_type": "<one of the supported widget types>",
  "data": { ... },
  "position": { "x": 400, "y": 200 },
  "size": { "width": 400, "height": 420 }
}
```

| Field         | Type   | Required | Description |
|---------------|--------|----------|-------------|
| `type`        | string | **yes**  | Must be `"widget"` |
| `widget_type` | string | **yes**  | One of the supported widget type keys (see below) |
| `data`        | object | **yes**  | Widget-specific data payload. Must match the schema for the given `widget_type`. |
| `position`    | object | no       | `{ "x": number, "y": number }` — pixel position on canvas. If omitted, auto-placed with slight randomization. |
| `size`        | object | no       | `{ "width": number, "height": number }` — pixel dimensions. If omitted, uses sensible defaults per widget type. |

### Python Example (in pipeline.py)

```python
await self.ws.send_json({
    "type": "widget",
    "widget_type": "job-listings",
    "data": {
        "query": "Data Engineering Intern",
        "listings": [
            {
                "id": "j1",
                "title": "Data Engineering Intern",
                "company": "Snowflake",
                "location": "San Mateo, CA",
                "salary": "$50/hr",
                "technologies": ["Python", "SQL", "Spark", "dbt"],
                "postedDate": "2026-03-18",
                "url": "https://example.com/apply"
            }
        ]
    }
})
```

---

## Supported Widget Types

### 1. `"academic-overview"` — GPA, Current Courses & Missing Assignments

Default size: 420 × 460

Unified widget combining GPA trend, enrolled courses with current grades, and missing assignment counts.

```json
{
  "type": "widget",
  "widget_type": "academic-overview",
  "data": {
    "currentGPA": 3.67,
    "totalCredits": 72,
    "semesters": [
      { "term": "Fall '24", "gpa": 3.4, "credits": 15 },
      { "term": "Spr '25", "gpa": 3.6, "credits": 16 },
      { "term": "Fall '25", "gpa": 3.8, "credits": 17 },
      { "term": "Spr '26", "gpa": 3.9, "credits": 12 }
    ],
    "courses": [
      { "courseId": "CS 301", "name": "Data Structures & Algorithms", "grade": "A-", "missingCount": 0 },
      { "courseId": "MATH 240", "name": "Linear Algebra", "grade": "B+", "missingCount": 1 },
      { "courseId": "CS 350", "name": "Software Engineering", "grade": "A", "missingCount": 0 },
      { "courseId": "ENG 102", "name": "English Composition II", "grade": "B", "missingCount": 2 }
    ]
  }
}
```

**Top-level fields:**

| Field          | Type   | Required | Description |
|----------------|--------|----------|-------------|
| `currentGPA`   | number | **yes**  | Cumulative GPA (0.0–4.0) |
| `totalCredits` | number | **yes**  | Total credits earned |
| `semesters`    | array  | **yes**  | Array of semester GPA objects for the bar chart |
| `courses`      | array  | **yes**  | Array of currently enrolled courses |

**Semester object:**

| Field     | Type   | Required | Description |
|-----------|--------|----------|-------------|
| `term`    | string | **yes**  | Short label, e.g. `"Fall '24"` |
| `gpa`     | number | **yes**  | Semester GPA (0.0–4.0) |
| `credits` | number | **yes**  | Credits taken that semester |

**Course object:**

| Field          | Type   | Required | Description |
|----------------|--------|----------|-------------|
| `courseId`      | string | **yes**  | Course code, e.g. `"CS 301"` |
| `name`         | string | **yes**  | Full course name |
| `grade`        | string | no       | Current letter grade if available, e.g. `"A-"`. Shows "—" if omitted. |
| `missingCount` | number | **yes**  | Number of missing assignments. `0` = no badge shown; `>0` = red badge. |

---

### 2. `"course-details"` — Single Course Info Card

Default size: 360 × 280

```json
{
  "type": "widget",
  "widget_type": "course-details",
  "data": {
    "name": "Data Structures & Algorithms",
    "courseId": "CS 301",
    "description": "Fundamental data structures including trees, graphs, hash tables...",
    "term": "Spring 2026",
    "instructor": "Dr. Sarah Chen",
    "credits": 3,
    "schedule": "MWF 9:00–9:50 AM · Hurst Hall 204",
    "currentGrade": "A-"
  }
}
```

| Field          | Type   | Required | Description |
|----------------|--------|----------|-------------|
| `name`         | string | **yes**  | Full course name |
| `courseId`      | string | **yes**  | Course code, e.g. `"CS 301"` |
| `description`  | string | **yes**  | Course description text |
| `term`         | string | **yes**  | e.g. `"Spring 2026"` |
| `instructor`   | string | **yes**  | Instructor name |
| `credits`      | number | **yes**  | Credit hours |
| `schedule`     | string | no       | Meeting time and room |
| `currentGrade` | string | no       | Current grade if available, e.g. `"A-"` |

---

### 3. `"professor"` — Professor Rating & Contact

Default size: 340 × 340

```json
{
  "type": "widget",
  "widget_type": "professor",
  "data": {
    "name": "Dr. Sarah Chen",
    "department": "Computer Science",
    "email": "s.chen@university.edu",
    "office": "Hurst Hall 312",
    "rating": 4.2,
    "difficulty": 3.1,
    "wouldTakeAgain": 89,
    "numRatings": 47,
    "topTags": ["Caring", "Respected", "Tough Grader", "Amazing Lectures"]
  }
}
```

| Field          | Type     | Required | Description |
|----------------|----------|----------|-------------|
| `name`         | string   | **yes**  | Full name |
| `department`   | string   | **yes**  | Department name |
| `email`        | string   | no       | Contact email |
| `office`       | string   | no       | Office location |
| `rating`       | number   | **yes**  | 1.0–5.0 quality rating |
| `difficulty`   | number   | **yes**  | 1.0–5.0 difficulty rating |
| `wouldTakeAgain`| number  | **yes**  | Percentage (0–100) |
| `numRatings`   | number   | **yes**  | Total number of ratings |
| `topTags`      | string[] | **yes**  | Array of tag strings (e.g. `["Caring", "Tough Grader"]`) |

---

### 4. `"course-roadmap"` — Degree Path DAG

Default size: 600 × 380

```json
{
  "type": "widget",
  "widget_type": "course-roadmap",
  "data": {
    "major": "Computer Science, B.S.",
    "nodes": [
      {
        "id": "CS101",
        "name": "Intro to CS",
        "credits": 3,
        "status": "completed",
        "grade": "A",
        "prereqs": []
      },
      {
        "id": "CS201",
        "name": "OOP & Design",
        "credits": 3,
        "status": "completed",
        "grade": "A-",
        "prereqs": ["CS101"]
      },
      {
        "id": "CS301",
        "name": "Data Structures",
        "credits": 3,
        "status": "in_progress",
        "prereqs": ["CS201"]
      },
      {
        "id": "CS401",
        "name": "Operating Systems",
        "credits": 3,
        "status": "planned",
        "prereqs": ["CS301"]
      }
    ]
  }
}
```

| Field (node)  | Type     | Required | Description |
|---------------|----------|----------|-------------|
| `id`          | string   | **yes**  | Unique course identifier (used for prereq references) |
| `name`        | string   | **yes**  | Short course name |
| `credits`     | number   | **yes**  | Credit hours |
| `status`      | string   | **yes**  | One of: `"completed"`, `"in_progress"`, `"planned"`, `"available"` |
| `grade`       | string   | no       | Letter grade (only for completed courses) |
| `prereqs`     | string[] | **yes**  | Array of `id` strings this course depends on. Empty array `[]` if none. |

**How the DAG renders:** Nodes are laid out left-to-right by topological depth. Edges (curved lines) connect prerequisite → dependent course. Colors indicate status: teal = completed, pulsing teal = in progress, blue highlight = available to take next, dim = planned future.

---

### 5. `"job-listings"` — Job/Internship Results

Default size: 400 × 400

```json
{
  "type": "widget",
  "widget_type": "job-listings",
  "data": {
    "query": "Data Engineering Intern",
    "listings": [
      {
        "id": "j1",
        "title": "Data Engineering Intern",
        "company": "Snowflake",
        "location": "San Mateo, CA",
        "salary": "$50/hr",
        "technologies": ["Python", "SQL", "Spark", "dbt"],
        "postedDate": "2026-03-18",
        "url": "https://example.com/apply"
      },
      {
        "id": "j2",
        "title": "Analytics Engineer Intern",
        "company": "Databricks",
        "location": "Remote",
        "technologies": ["SQL", "Python", "Airflow"],
        "postedDate": "2026-03-15"
      }
    ]
  }
}
```

| Field (listing) | Type     | Required | Description |
|------------------|----------|----------|-------------|
| `id`             | string   | **yes**  | Unique identifier |
| `title`          | string   | **yes**  | Job title |
| `company`        | string   | **yes**  | Company name |
| `location`       | string   | **yes**  | Location or `"Remote"` |
| `salary`         | string   | no       | Salary/rate string, e.g. `"$50/hr"` or `"$95K–110K"` |
| `technologies`   | string[] | **yes**  | Tech stack tags |
| `postedDate`     | string   | **yes**  | ISO date string `"YYYY-MM-DD"` |
| `url`            | string   | no       | Link to job posting |

**Top-level `query`** (optional string) is displayed as a subtitle: *Results for "Data Engineering Intern"*

---

### 6. `"schedule"` — Weekly Class Timetable

Default size: 540 × 400

```json
{
  "type": "widget",
  "widget_type": "schedule",
  "data": {
    "courses": [
      {
        "name": "Data Structures & Algorithms",
        "courseId": "CS 301",
        "days": ["Mon", "Wed", "Fri"],
        "startTime": "09:00",
        "endTime": "09:50",
        "location": "Hurst 204",
        "color": "#006a6a"
      },
      {
        "name": "Linear Algebra",
        "courseId": "MATH 240",
        "days": ["Tue", "Thu"],
        "startTime": "10:00",
        "endTime": "11:15",
        "location": "Korman 120",
        "color": "#7c3aed"
      }
    ]
  }
}
```

| Field       | Type     | Required | Description |
|-------------|----------|----------|-------------|
| `name`      | string   | **yes**  | Full course name |
| `courseId`   | string   | **yes**  | Short code, e.g. `"CS 301"` |
| `days`      | string[] | **yes**  | Array of: `"Mon"`, `"Tue"`, `"Wed"`, `"Thu"`, `"Fri"` |
| `startTime` | string   | **yes**  | 24-hour format `"HH:MM"`, e.g. `"09:00"`, `"13:30"` |
| `endTime`   | string   | **yes**  | 24-hour format `"HH:MM"` |
| `location`  | string   | **yes**  | Room/building |
| `color`     | string   | **yes**  | Hex color for visual distinction, e.g. `"#006a6a"` |

**Suggested colors to cycle through:** `#006a6a`, `#7c3aed`, `#b45309`, `#be185d`, `#1d4ed8`, `#15803d`

---

## Current Integration (pipeline.py)

Widget selection and formatting is implemented in `pipeline.py` with three methods:

### `_resolve_widget(tool_results_log)` — picks which result to display
- No tool calls → `None`
- All calls to the same tool → format the last result
- Multiple distinct tools → asks Gemini to pick, then formats the chosen one

### `_format_widget(tool_name, args, result)` — transforms scraper output to widget schema

**Field mappings from scraper output → widget schema:**

| Tool | Scraper field | Widget field |
|------|--------------|--------------|
| `search_job_listings` | `role` | `title` |
| `search_job_listings` | `salary_min` + `salary_max` | `salary` (formatted as `$X–$Y`) |
| `search_job_listings` | `posted_date` | `postedDate` |
| `lookup_professor` | `firstName` + `lastName` | `name` |
| `lookup_professor` | `avgRating` | `rating` |
| `lookup_professor` | `avgDifficulty` | `difficulty` |
| `get_canvas_courses` | `course_code` | `courses[].courseId` |
| `get_canvas_courses` | `course_name` | `courses[].name` |
| `get_canvas_courses` | `current_score` | `courses[].grade` (convert number to letter) |
| `get_canvas_courses` | missing assignments count | `courses[].missingCount` |

### `_execute_tool(function_call)` — runs the tool and sends `tool_call` + `tool_result` messages

Widget message is sent once after all tool rounds complete (at the end of `_stream_with_tools`), not inside `_execute_tool`.

---

## Timing & Ordering

Actual message sequence for a single turn with one tool call:

```
1.  backend → frontend:  { "type": "tool_call", "name": "search_job_listings", "args": {...} }
2.  backend → frontend:  { "type": "tool_result", "name": "search_job_listings", "data": {...} }
3.  backend → frontend:  { "type": "text", "data": "I found some great..." }  // Gemini's 2nd pass
4.  backend → frontend:  { "type": "audio", "data": "<base64>" }
    ... more text/audio chunks ...
5.  backend → frontend:  { "type": "widget", "widget_type": "job-listings", "data": {...} }
6.  backend → frontend:  { "type": "done" }
```

Steps 1–2 happen during tool execution. Steps 3–4 are Gemini narrating results + TTS audio (streamed in parallel). Step 5 is the widget, sent after all tool rounds and streaming complete. Step 6 signals the turn is done.

---

## Widget Selection (Multiple Tool Calls)

When multiple distinct tools are called in one turn (e.g., grades + jobs), only **one** widget is sent. `_resolve_widget()` asks Gemini which tool result is most relevant, then formats that one. This keeps the canvas uncluttered.

If the same tool is called multiple times (e.g., two job searches), the last result is used.

---

## Quick Reference: Widget Types

| `widget_type`          | What it shows                              | Key data fields                              |
|------------------------|--------------------------------------------|----------------------------------------------|
| `"academic-overview"`  | GPA trend + current courses + missing work | `currentGPA`, `semesters[]`, `courses[]`     |
| `"course-details"`     | Single course info card                    | flat object                                  |
| `"professor"`          | Professor rating & contact                 | flat object                                  |
| `"course-roadmap"`     | Prerequisite DAG visualization             | `major` + `nodes[]`                          |
| `"job-listings"`       | Job/internship search results              | `query` + `listings[]`                       |
| `"schedule"`           | Weekly class timetable grid                | `courses[]`                                  |
