# Widget Specification

Comprehensive specification for all widget types in the Aria HUD canvas. Each widget is a draggable, glassmorphic popup that displays AI-generated or API-sourced data.

---

## 1. Assignments Widget

**Purpose:** Show upcoming and past assignments across all enrolled courses.

**Data Schema:**
```typescript
interface AssignmentData {
  assignments: {
    id: string;
    courseName: string;
    name: string;
    dueDate: string;          // ISO date
    status: 'upcoming' | 'submitted' | 'late' | 'missing' | 'graded';
    pointsEarned?: number;
    pointsPossible?: number;
  }[];
}
```

**Behavior:**
- Two tabs: **Upcoming** (status = upcoming) and **Past** (submitted/graded/late/missing)
- Sorted by due date (nearest first for upcoming, most recent first for past)
- Each row shows: course name label, assignment name, relative due date, status badge
- Status badges: upcoming (teal), submitted (blue), graded (green with score), late (amber), missing (red)
- Scrollable when content exceeds widget height

**Default Size:** 400 × 420px

**Example Data:**
```json
{
  "assignments": [
    { "id": "1", "courseName": "CS 301", "name": "Binary Tree Implementation", "dueDate": "2026-03-25T23:59:00Z", "status": "upcoming", "pointsPossible": 100 },
    { "id": "2", "courseName": "MATH 240", "name": "Eigenvalue Problem Set #5", "dueDate": "2026-03-24T23:59:00Z", "status": "upcoming", "pointsPossible": 50 },
    { "id": "3", "courseName": "CS 350", "name": "Sprint 3 Deliverable", "dueDate": "2026-04-01T23:59:00Z", "status": "upcoming", "pointsPossible": 200 },
    { "id": "4", "courseName": "CS 301", "name": "AVL Tree Quiz", "dueDate": "2026-03-18T23:59:00Z", "status": "graded", "pointsEarned": 92, "pointsPossible": 100 },
    { "id": "5", "courseName": "ENG 102", "name": "Research Paper Draft", "dueDate": "2026-03-15T23:59:00Z", "status": "submitted", "pointsPossible": 150 },
    { "id": "6", "courseName": "MATH 240", "name": "Midterm Exam", "dueDate": "2026-03-10T23:59:00Z", "status": "graded", "pointsEarned": 78, "pointsPossible": 100 }
  ]
}
```

---

## 2. Course Details Widget

**Purpose:** Display detailed information about a specific course.

**Data Schema:**
```typescript
interface CourseData {
  name: string;
  courseId: string;
  description: string;
  term: string;
  instructor: string;
  credits: number;
  schedule?: string;
  currentGrade?: string;
}
```

**Behavior:**
- Static display card (no tabs or interactive elements)
- Course ID and term shown as label/metadata
- Description as body text (truncated with "show more" if long)
- Current grade shown as a prominent badge if available

**Default Size:** 360 × 280px

**Example Data:**
```json
{
  "name": "Data Structures & Algorithms",
  "courseId": "CS 301",
  "description": "Fundamental data structures including trees, graphs, hash tables, and heaps. Algorithm design techniques: divide-and-conquer, greedy, dynamic programming. Analysis of time and space complexity.",
  "term": "Spring 2026",
  "instructor": "Dr. Sarah Chen",
  "credits": 3,
  "schedule": "MWF 9:00–9:50 AM · Room 204 Hurst Hall",
  "currentGrade": "A-"
}
```

---

## 3. Professor Details Widget

**Purpose:** Show professor information and Rate My Professors rating breakdown.

**Data Schema:**
```typescript
interface ProfessorData {
  name: string;
  department: string;
  email?: string;
  office?: string;
  rating: number;           // 1.0–5.0
  difficulty: number;       // 1.0–5.0
  wouldTakeAgain: number;   // percentage 0–100
  numRatings: number;
  topTags: string[];
}
```

**Behavior:**
- Professor name as headline
- Rating as a large prominent number with /5 and star icon
- Difficulty and "Would Take Again" as secondary metrics
- Top tags rendered as pill badges
- Contact info (email, office) shown if available

**Default Size:** 340 × 340px

**Example Data:**
```json
{
  "name": "Dr. Sarah Chen",
  "department": "Computer Science",
  "email": "s.chen@university.edu",
  "office": "Hurst Hall 312",
  "rating": 4.2,
  "difficulty": 3.1,
  "wouldTakeAgain": 89,
  "numRatings": 47,
  "topTags": ["Caring", "Respected", "Tough Grader", "Amazing Lectures", "Group Projects"]
}
```

---

## 4. Course Roadmap Widget (DAG)

**Purpose:** Visualize the student's degree path as a directed acyclic graph showing prerequisites, completed courses, and what's ahead.

**Data Schema:**
```typescript
interface CourseRoadmapData {
  major: string;
  nodes: {
    id: string;
    name: string;
    credits: number;
    status: 'completed' | 'in_progress' | 'planned' | 'available';
    grade?: string;
    prereqs: string[];       // IDs of prerequisite course nodes
  }[];
}
```

**Behavior:**
- Rendered as an SVG DAG with left-to-right flow (past → future)
- Nodes are grouped into columns by topological depth (courses with no prereqs in column 0, etc.)
- Edges drawn as curved SVG paths from prerequisite to dependent course
- Nodes color-coded by status:
  - Completed: solid teal fill
  - In Progress: pulsing teal outline
  - Planned: dim outline
  - Available: highlighted outline (ready to take)
- Hover shows course name and grade if completed
- Legend at bottom of widget

**Default Size:** 600 × 380px

**Example Data:**
```json
{
  "major": "Computer Science, B.S.",
  "nodes": [
    { "id": "CS101", "name": "Intro to CS", "credits": 3, "status": "completed", "grade": "A", "prereqs": [] },
    { "id": "MATH151", "name": "Calculus I", "credits": 4, "status": "completed", "grade": "B+", "prereqs": [] },
    { "id": "CS201", "name": "OOP & Design", "credits": 3, "status": "completed", "grade": "A-", "prereqs": ["CS101"] },
    { "id": "MATH240", "name": "Linear Algebra", "credits": 3, "status": "in_progress", "prereqs": ["MATH151"] },
    { "id": "CS301", "name": "Data Structures", "credits": 3, "status": "in_progress", "prereqs": ["CS201", "MATH151"] },
    { "id": "CS310", "name": "Computer Arch.", "credits": 3, "status": "planned", "prereqs": ["CS201"] },
    { "id": "CS350", "name": "Software Eng.", "credits": 3, "status": "in_progress", "prereqs": ["CS201"] },
    { "id": "CS401", "name": "Operating Systems", "credits": 3, "status": "available", "prereqs": ["CS301", "CS310"] },
    { "id": "CS420", "name": "Artificial Intel.", "credits": 3, "status": "planned", "prereqs": ["CS301", "MATH240"] },
    { "id": "CS450", "name": "Senior Project", "credits": 3, "status": "planned", "prereqs": ["CS350", "CS401"] }
  ]
}
```

---

## 5. GPA Tracker Widget

**Purpose:** Show current GPA with a semester-by-semester trend visualization.

**Data Schema:**
```typescript
interface GPAData {
  currentGPA: number;
  totalCredits: number;
  semesters: {
    term: string;
    gpa: number;
    credits: number;
  }[];
}
```

**Behavior:**
- Current GPA displayed as a large headline number
- Total credits shown below
- SVG bar chart showing GPA per semester (4.0 scale)
- Bars colored with gradient from secondary to secondary-fixed
- Hover shows exact GPA value for each semester

**Default Size:** 320 × 260px

**Example Data:**
```json
{
  "currentGPA": 3.67,
  "totalCredits": 72,
  "semesters": [
    { "term": "Fall '24", "gpa": 3.4, "credits": 15 },
    { "term": "Spring '25", "gpa": 3.6, "credits": 16 },
    { "term": "Fall '25", "gpa": 3.8, "credits": 17 },
    { "term": "Spring '26", "gpa": 3.9, "credits": 12 }
  ]
}
```

---

## 6. Job Listings Widget

**Purpose:** Display matching job/internship listings from TheirStack based on the student's skills and interests.

**Data Schema:**
```typescript
interface JobListingData {
  query?: string;
  listings: {
    id: string;
    title: string;
    company: string;
    location: string;
    salary?: string;
    technologies: string[];
    postedDate: string;
    url?: string;
  }[];
}
```

**Behavior:**
- Scrollable list of job cards
- Each card shows: title, company, location, posted date
- Technologies rendered as small pills
- Salary shown if available
- Click a card to open URL (future: in-app detail view)

**Default Size:** 400 × 400px

**Example Data:**
```json
{
  "query": "Software Engineering Intern",
  "listings": [
    { "id": "j1", "title": "Software Engineering Intern", "company": "TechCorp", "location": "San Francisco, CA", "salary": "$45/hr", "technologies": ["React", "TypeScript", "Python"], "postedDate": "2026-03-18", "url": "#" },
    { "id": "j2", "title": "Full Stack Developer Intern", "company": "StartupXYZ", "location": "Remote", "salary": "$35–40/hr", "technologies": ["Node.js", "React", "PostgreSQL"], "postedDate": "2026-03-15", "url": "#" },
    { "id": "j3", "title": "Backend Engineer (New Grad)", "company": "DataFlow Inc.", "location": "Austin, TX", "salary": "$95K–110K", "technologies": ["Python", "FastAPI", "AWS"], "postedDate": "2026-03-12", "url": "#" },
    { "id": "j4", "title": "ML Engineering Intern", "company": "AI Labs", "location": "New York, NY", "technologies": ["Python", "PyTorch", "Docker"], "postedDate": "2026-03-10", "url": "#" }
  ]
}
```

---

## 7. Weekly Schedule Widget

**Purpose:** Visual timetable showing the student's weekly class schedule.

**Data Schema:**
```typescript
interface ScheduleData {
  courses: {
    name: string;
    courseId: string;
    days: ('Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri')[];
    startTime: string;     // "HH:MM" 24-hr
    endTime: string;
    location: string;
    color: string;          // hex color for visual distinction
  }[];
}
```

**Behavior:**
- 5-column grid (Mon–Fri), rows representing 30-minute time slots
- Course blocks positioned and sized based on start/end times
- Each course has a unique color for visual distinction
- Time labels on the left axis
- Course blocks show: courseId, location

**Default Size:** 520 × 400px

**Example Data:**
```json
{
  "courses": [
    { "name": "Data Structures & Algorithms", "courseId": "CS 301", "days": ["Mon", "Wed", "Fri"], "startTime": "09:00", "endTime": "09:50", "location": "Hurst 204", "color": "#006a6a" },
    { "name": "Linear Algebra", "courseId": "MATH 240", "days": ["Tue", "Thu"], "startTime": "10:00", "endTime": "11:15", "location": "Korman 120", "color": "#6d28d9" },
    { "name": "Software Engineering", "courseId": "CS 350", "days": ["Mon", "Wed"], "startTime": "13:00", "endTime": "14:15", "location": "UCross 153", "color": "#b45309" },
    { "name": "English Composition II", "courseId": "ENG 102", "days": ["Tue", "Thu"], "startTime": "14:00", "endTime": "15:15", "location": "MacAlister 2018", "color": "#be185d" }
  ]
}
```

---

## Suggested Additional Widgets (Future)

### 8. Study Timer / Pomodoro
Focus timer with configurable work/break intervals. Shows session count and total study time. Integrates with the voice assistant ("Aria, start a 25-minute study session").

### 9. Quick Notes
Scratchpad widget for jotting down notes during a voice advising session. Auto-saves. Could be pre-populated by AI with key takeaways.

### 10. Degree Progress Ring
Circular progress visualization showing overall degree completion — credits earned vs. required, with breakdowns by category (major, gen-ed, electives).

### 11. Grade Calculator
What-if scenario tool: input hypothetical grades for remaining assignments to see projected final grade in a course.

### 12. Campus Resources
Quick-access cards to tutoring services, career center, library hours, mental health resources — contextually surfaced by the AI.

### 13. Comparison Widget
Side-by-side comparison of two professors or two courses, useful when deciding between sections.

---

## Widget Lifecycle

```
1. CREATION
   createWidget(type, data) → generates ID, assigns position, adds to canvas

2. INTERACTION
   - Drag: pointer events on header bar
   - Bring to front: click anywhere on widget
   - Minimize: collapse to title bar only
   - Close: remove from canvas

3. UPDATE (future)
   updateWidget(id, newData) → re-render with fresh data

4. PERSISTENCE (future)
   Save widget positions and state to localStorage
```
