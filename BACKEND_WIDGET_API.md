# Backend → Frontend Widget API

## How It Works

The frontend listens for a **`widget`** message type on the existing WebSocket connection (`/ws`). When the backend sends this message, the frontend automatically creates a draggable, glassmorphic widget popup on the user's HUD canvas.

Send this message **after** executing a tool call so the widget appears while Aria speaks about the results. The AI keeps the tool result in its conversation history, so it can discuss the data naturally while the student sees it visually.

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
| `widget_type` | string | **yes**  | One of: `"academic-overview"`, `"course-details"`, `"professor"`, `"course-roadmap"`, `"job-listings"` |
| `data`        | object | **yes**  | Widget-specific data payload — must match the schema for the given `widget_type` |
| `position`    | object | no       | `{ "x": number, "y": number }` pixel position on canvas. If omitted, auto-placed with slight randomization |
| `size`        | object | no       | `{ "width": number, "height": number }` pixel dimensions. If omitted, uses defaults per widget type |

### Python Example

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

---

### 1. `"academic-overview"` — GPA, Current Courses & Missing Assignments

**Default size:** 420 × 460

Unified widget showing the student's cumulative GPA with a semester trend chart, their currently enrolled courses with grades, and a count of missing assignments per course.

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
| `semesters`    | array  | **yes**  | Semester GPA history for the bar chart |
| `courses`      | array  | **yes**  | Currently enrolled courses |

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
| `grade`        | string | no       | Current letter grade. Shows "—" if omitted |
| `missingCount` | number | **yes**  | Number of missing assignments. `0` = no badge; `> 0` = red badge |

---

### 2. `"course-details"` — Single Course Info Card

**Default size:** 360 × 280

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

**Default size:** 340 × 340

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

| Field           | Type     | Required | Description |
|-----------------|----------|----------|-------------|
| `name`          | string   | **yes**  | Full name |
| `department`    | string   | **yes**  | Department name |
| `email`         | string   | no       | Contact email |
| `office`        | string   | no       | Office location |
| `rating`        | number   | **yes**  | 1.0–5.0 quality rating |
| `difficulty`    | number   | **yes**  | 1.0–5.0 difficulty rating |
| `wouldTakeAgain`| number   | **yes**  | Percentage (0–100) |
| `numRatings`    | number   | **yes**  | Total number of ratings |
| `topTags`       | string[] | **yes**  | Tag strings, e.g. `["Caring", "Tough Grader"]` |

---

### 4. `"course-roadmap"` — Degree Path DAG with Wildcard Electives

**Default size:** 600 × 380

Renders a directed acyclic graph of the student's degree path. Nodes are grouped into columns by prerequisite depth (left-to-right, roughly mapping to semesters). Edges are curved SVG lines connecting prerequisites to dependents.

**Wildcard nodes** represent free/technical elective slots. They render with an amber dashed border and a "+" icon. When the student clicks one, an in-widget overlay shows the available courses. Selecting one replaces the wildcard with the chosen course. The student can clear the selection to go back to the wildcard state.

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
        "id": "ELEC1",
        "name": "Free Elective",
        "credits": 3,
        "status": "wildcard",
        "prereqs": ["CS201"],
        "electiveOptions": [
          {
            "course": "CS 370",
            "section": "001",
            "name": "Web Development",
            "crn": "24810",
            "time": "MWF 11:00–11:50",
            "professor": "Dr. Rivera",
            "description": "Modern web application development with React, Node.js, and cloud deployment.",
            "credits": 3
          },
          {
            "course": "CS 380",
            "section": "002",
            "name": "Database Systems",
            "crn": "24822",
            "time": "TTh 1:00–2:15",
            "professor": "Dr. Patel",
            "description": "Relational databases, SQL, query optimization, and NoSQL systems.",
            "credits": 3
          }
        ]
      },
      {
        "id": "CS450",
        "name": "Senior Project",
        "credits": 3,
        "status": "planned",
        "prereqs": ["CS301"]
      }
    ]
  }
}
```

**Top-level fields:**

| Field   | Type   | Required | Description |
|---------|--------|----------|-------------|
| `major` | string | **yes**  | Degree program name, shown as widget subtitle |
| `nodes` | array  | **yes**  | Array of course nodes |

**Node object:**

| Field             | Type     | Required | Description |
|-------------------|----------|----------|-------------|
| `id`              | string   | **yes**  | Unique identifier (used for `prereqs` references) |
| `name`            | string   | **yes**  | Course name |
| `credits`         | number   | **yes**  | Credit hours |
| `status`          | string   | **yes**  | One of: `"completed"`, `"in_progress"`, `"planned"`, `"available"`, `"wildcard"` |
| `grade`           | string   | no       | Letter grade (completed courses only) |
| `prereqs`         | string[] | **yes**  | Array of node `id`s this course depends on. `[]` if none |
| `electiveOptions` | array    | no       | **Required when `status` is `"wildcard"`.** Array of available courses the student can choose from |

**ElectiveOption object** (for wildcard nodes):

| Field         | Type   | Required | Description |
|---------------|--------|----------|-------------|
| `course`      | string | **yes**  | Course code, e.g. `"CS 370"` |
| `section`     | string | **yes**  | Section number, e.g. `"001"` |
| `name`        | string | **yes**  | Course name |
| `crn`         | string | **yes**  | Course Registration Number |
| `time`        | string | **yes**  | Meeting time, e.g. `"MWF 11:00–11:50"` |
| `professor`   | string | **yes**  | Instructor name |
| `description` | string | **yes**  | Course description |
| `credits`     | number | **yes**  | Credit hours |

**Node status visual mapping:**

| Status        | Visual |
|---------------|--------|
| `completed`   | Solid teal fill, bright teal border |
| `in_progress` | Subtle teal fill, medium teal border |
| `planned`     | Dim gray fill, faint border, 60% opacity |
| `available`   | Blue-tinted fill, blue border (ready to take) |
| `wildcard`    | Amber dashed border, "+" icon — clickable elective picker |

---

### 5. `"job-listings"` — Job / Internship Search Results

**Default size:** 400 × 400

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

**Top-level fields:**

| Field      | Type   | Required | Description |
|------------|--------|----------|-------------|
| `query`    | string | no       | Displayed as subtitle: *Results for "..."* |
| `listings` | array  | **yes**  | Array of job listing objects |

**Listing object:**

| Field          | Type     | Required | Description |
|----------------|----------|----------|-------------|
| `id`           | string   | **yes**  | Unique identifier |
| `title`        | string   | **yes**  | Job title |
| `company`      | string   | **yes**  | Company name |
| `location`     | string   | **yes**  | Location or `"Remote"` |
| `salary`       | string   | no       | Salary string, e.g. `"$50/hr"` or `"$95K–110K"` |
| `technologies` | string[] | **yes**  | Tech stack tags |
| `postedDate`   | string   | **yes**  | ISO date `"YYYY-MM-DD"` |
| `url`          | string   | no       | Link to job posting |

---

## Message Sequence for a Turn

```
1.  backend → frontend:  { "type": "tool_call",   "name": "search_job_listings", "args": {...} }
2.  backend → frontend:  { "type": "tool_result",  "name": "search_job_listings", "data": {...} }
3.  backend → frontend:  { "type": "text",         "data": "I found some great..." }
4.  backend → frontend:  { "type": "audio",        "data": "<base64>" }
    ... more text/audio chunks ...
5.  backend → frontend:  { "type": "widget",       "widget_type": "job-listings", "data": {...} }
6.  backend → frontend:  { "type": "done" }
```

- Steps 1–2: Tool execution phase
- Steps 3–4: Gemini's second pass narrating results + TTS audio (streamed)
- Step 5: Widget creation — panel materializes on the canvas
- Step 6: Turn complete signal

## Multiple Widgets per Turn

You can send multiple `widget` messages in a single turn. Each creates a separate draggable panel:

```python
await self.ws.send_json({"type": "widget", "widget_type": "academic-overview", "data": {...}})
await self.ws.send_json({"type": "widget", "widget_type": "course-details", "data": {...}})
```

---

## Quick Reference

| `widget_type`          | What it shows                              | Default size | Key data fields                          |
|------------------------|--------------------------------------------|--------------|------------------------------------------|
| `"academic-overview"`  | GPA trend + current courses + missing work | 420 × 460    | `currentGPA`, `semesters[]`, `courses[]` |
| `"course-details"`     | Single course info card                    | 360 × 280    | flat object                              |
| `"professor"`          | Professor rating & contact                 | 340 × 340    | flat object                              |
| `"course-roadmap"`     | Prerequisite DAG with wildcard electives   | 600 × 380    | `major`, `nodes[]`                       |
| `"job-listings"`       | Job/internship search results              | 400 × 400    | `query`, `listings[]`                    |
