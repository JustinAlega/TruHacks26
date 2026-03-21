# Widget Catalog — Aria AI Academic Advisor

Living reference for all widget types. Each widget is an AI-driven draggable glassmorphic panel spawned on the JARVIS-style canvas during conversation.

---

## 1. Assignments (`assignments`)

**Purpose:** Show upcoming, missing, submitted, and graded assignments across all courses.

**Display name:** Critical Tasks  
**Size:** `standard` (380px)  
**Backend tool:** `get_canvas_courses` (Canvas LMS scraper)  
**Trigger phrases:** "assignments", "homework", "due", "missing", "tasks"

### Data Interface

```typescript
interface Assignment {
  id: string;
  name: string;
  course: string;        // e.g. "CS 201 - Data Structures"
  dueDate: string;       // ISO date "2026-03-25"
  status: 'missing' | 'upcoming' | 'submitted' | 'graded';
}
// Widget data: { assignments: Assignment[] }
```

### Example Payload

```json
{
  "assignments": [
    { "id": "a1", "name": "Binary Tree Traversal Lab", "course": "CS 201 - Data Structures", "dueDate": "2026-03-14", "status": "missing" },
    { "id": "a2", "name": "Database Normalization Report", "course": "CS 340 - Databases", "dueDate": "2026-03-25", "status": "upcoming" },
    { "id": "a3", "name": "Sorting Algorithms Analysis", "course": "CS 201 - Data Structures", "dueDate": "2026-03-10", "status": "graded" }
  ]
}
```

### UI Notes

- Groups by status: Missing (amber/urgent), Upcoming, Submitted, Graded
- Missing section uses `--tertiary` accent per DESIGN.md urgent rule
- Status dot color-codes each row

---

## 2. Course Details (`course`)

**Purpose:** Show detailed info for a specific course.

**Display name:** Course Info  
**Size:** `standard` (380px)  
**Backend tool:** `get_canvas_courses` + Gemini enrichment  
**Trigger phrases:** "course", "class", "enroll", "register", "recommend"

### Data Interface

```typescript
interface CourseInfo {
  id: string;
  code: string;           // "CS 301"
  name: string;           // "Algorithm Design & Analysis"
  credits: number;
  professor: string;
  schedule: string;       // "MWF 10:00 - 10:50 AM"
  description: string;
  prerequisites?: string[];
  rating?: number;        // 0-5 scale
}
// Widget data: { course: CourseInfo }
```

### Example Payload

```json
{
  "course": {
    "id": "c1", "code": "CS 301", "name": "Algorithm Design & Analysis", "credits": 3,
    "professor": "Dr. Sarah Chen", "schedule": "MWF 10:00 - 10:50 AM",
    "description": "Divide-and-conquer, dynamic programming, greedy, and graph algorithms.",
    "prerequisites": ["CS 201 - Data Structures", "MATH 240 - Discrete Mathematics"],
    "rating": 4.3
  }
}
```

---

## 3. Professor Details (`professor`)

**Purpose:** Show professor profile with RateMyProfessors ratings.

**Display name:** Professor  
**Size:** `standard` (380px)  
**Backend tool:** `lookup_professor` (RMP scraper)  
**Trigger phrases:** "professor", "prof", "rating", "rate my professors"

### Data Interface

```typescript
interface ProfessorInfo {
  id: string;
  firstName: string;
  lastName: string;
  department: string;
  email?: string;
  avgRating: number;       // 0-5
  avgDifficulty: number;   // 0-5
  numRatings: number;
  school: string;
  rmpLink?: string;
}
// Widget data: { professor: ProfessorInfo }
```

### Example Payload

```json
{
  "professor": {
    "id": "p1", "firstName": "Sarah", "lastName": "Chen",
    "department": "Computer Science", "email": "schen@university.edu",
    "avgRating": 4.6, "avgDifficulty": 3.2, "numRatings": 142,
    "school": "University of Michigan",
    "rmpLink": "https://www.ratemyprofessors.com/professor/12345"
  }
}
```

### UI Notes

- Avatar with initials and teal gradient
- 3-column rating grid: Quality (highlighted), Difficulty, Ratings count
- Star visualization for quality rating
- External link to RMP profile

---

## 4. Course Roadmap (`course_roadmap`)

**Purpose:** DAG visualization of courses, prerequisites, and progress toward degree completion.

**Display name:** Course Roadmap  
**Size:** `wide` (560px)  
**Backend tool:** `get_canvas_courses` + degree requirements (future)  
**Trigger phrases:** "roadmap", "prereq", "path", "degree plan", "DAG"

### Data Interface

```typescript
type CourseNodeStatus = 'completed' | 'in_progress' | 'available' | 'locked';

interface CourseNode {
  id: string;
  code: string;        // "CS 201"
  name: string;
  credits: number;
  status: CourseNodeStatus;
}

interface CourseEdge {
  source: string;      // prerequisite course ID
  target: string;      // dependent course ID
}

interface CourseRoadmapData {
  nodes: CourseNode[];
  edges: CourseEdge[];
}
// Widget data: { roadmap: CourseRoadmapData }
```

### Example Payload

```json
{
  "roadmap": {
    "nodes": [
      { "id": "cs101", "code": "CS 101", "name": "Intro to CS", "credits": 3, "status": "completed" },
      { "id": "cs201", "code": "CS 201", "name": "Data Structures", "credits": 3, "status": "in_progress" },
      { "id": "cs301", "code": "CS 301", "name": "Algorithms", "credits": 3, "status": "available" },
      { "id": "cs401", "code": "CS 401", "name": "Machine Learning", "credits": 3, "status": "locked" }
    ],
    "edges": [
      { "source": "cs101", "target": "cs201" },
      { "source": "cs201", "target": "cs301" },
      { "source": "cs301", "target": "cs401" }
    ]
  }
}
```

### UI Notes

- Uses `@xyflow/react` for DAG rendering
- Topological layer layout (left-to-right flow)
- Color-coded nodes: teal=completed, blue=in-progress, gray=available, dark=locked
- Animated edges for in-progress connections
- Pannable viewport; zoom disabled for simplicity

---

## 5. Job Listings (`job_listings`)

**Purpose:** Show relevant job and internship opportunities.

**Display name:** Opportunities  
**Size:** `standard` (380px)  
**Backend tool:** `search_job_listings` (TheirStack scraper)  
**Trigger phrases:** "job", "intern", "career", "work", "opportunities"

### Data Interface

```typescript
interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'full-time' | 'part-time' | 'internship' | 'co-op';
  description: string;
  skills: string[];
}
// Widget data: { listings: JobListing[] }
```

---

## 6. Skills Tree (`skills_tree`)

**Purpose:** Hierarchical skill progress visualization.

**Display name:** Skills Progress  
**Size:** `standard` (380px)  
**Backend tool:** Derived from course history + AI assessment  
**Trigger phrases:** "skill", "learn", "progress", "improve"

### Data Interface

```typescript
interface Skill {
  id: string;
  name: string;
  level: number;        // 0-100
  category: string;
  children?: Skill[];
}
// Widget data: { skills: Skill[] }
```

---

## 7. GPA Tracker (`gpa_tracker`)

**Purpose:** Cumulative and semester GPA with per-course breakdown.

**Display name:** GPA Tracker  
**Size:** `standard` (380px)  
**Backend tool:** `get_canvas_courses` (grades + credits)  
**Trigger phrases:** "GPA", "grade point", "cumulative"

### Data Interface

```typescript
interface GpaSummary {
  cumulative: number;     // e.g. 3.45
  semester: number;       // e.g. 3.62
  creditsCompleted: number;
  creditsRemaining: number;
  courses: {
    name: string;
    grade: string;        // "A-", "B+"
    gpa: number;          // 3.7, 3.3
    credits: number;
  }[];
}
// Widget data: { gpa: GpaSummary }
```

### UI Notes

- Two SVG ring gauges: Cumulative (teal) and Semester (blue)
- Credits progress bar below gauges
- Per-course rows: name, letter grade (teal accent), GPA points

---

## 8. Grade Breakdown (`grade_breakdown`)

**Purpose:** Detailed per-course grade composition with categories and weights.

**Display name:** Grade Breakdown  
**Size:** `standard` (380px)  
**Backend tool:** `get_canvas_courses` (extended)  
**Trigger phrases:** "grade breakdown", "score", "weight", "category"

### Data Interface

```typescript
interface GradeCategory {
  name: string;          // "Exams", "Labs", "Homework"
  weight: number;        // percentage, e.g. 40
  score: number;         // current score percentage
  items: {
    name: string;
    score: number;
    maxScore: number;
  }[];
}

interface GradeBreakdownData {
  courseName: string;
  courseCode: string;
  currentGrade: string;  // "A-"
  currentScore: number;  // 91.2
  categories: GradeCategory[];
}
// Widget data: { breakdown: GradeBreakdownData }
```

### UI Notes

- Header with course code, name, overall grade (large teal accent)
- Each category: name + weight, colored progress bar, expandable item list
- Bar colors: green (>=90), blue (>=70), amber (<70)

---

## 9. Deadline Timeline (`deadline_timeline`)

**Purpose:** Vertical timeline of upcoming deadlines across all courses.

**Display name:** Deadlines  
**Size:** `wide` (560px)  
**Backend tool:** `get_canvas_courses` (assignment dates)  
**Trigger phrases:** "deadline", "timeline", "what's due", "calendar", "upcoming"

### Data Interface

```typescript
interface DeadlineEvent {
  id: string;
  name: string;
  course: string;
  courseCode: string;
  dueDate: string;         // ISO date
  type: 'assignment' | 'exam' | 'quiz' | 'project';
}
// Widget data: { events: DeadlineEvent[] }
```

### UI Notes

- Vertical timeline with colored dot markers
- Type badges: HW (teal), EXAM (amber), QUIZ (blue), PROJ (deep blue)
- Days-out indicator (e.g. "3d", "Today", "2d ago")
- Past items shown with reduced opacity

---

## 10. Quick Stats (`quick_stats`)

**Purpose:** Compact heads-up display with key academic metrics.

**Display name:** Quick Stats  
**Size:** `compact` (280px)  
**Backend tool:** Derived from `get_canvas_courses`  
**Trigger phrases:** "stats", "overview", "summary", "dashboard"

### Data Interface

```typescript
interface QuickStatsData {
  gpa: number;
  creditsCompleted: number;
  creditsRemaining: number;
  currentSemester: string;
  coursesThisSemester: number;
}
// Widget data: { stats: QuickStatsData }
```

### UI Notes

- 2x2 grid of metric tiles
- GPA tile highlighted with teal accent
- Current semester label below grid
- Designed to stay compact, JARVIS HUD-style

---

## 11. Course Comparison (`course_compare`) — Future

**Purpose:** Side-by-side comparison of 2+ courses or professors.

**Display name:** Compare Courses  
**Size:** `wide` (560px)  
**Status:** Planned, not yet implemented

---

## Widget Lifecycle

1. **AI decides** to show a widget based on user query + tool results
2. **Backend emits** `{ type: "widget", action: "show", id, widget_type, data }`
3. **Store spawns** window with cascading position, spawn animation
4. **User interacts**: drag, minimize, close, focus
5. **AI can update** with `action: "update"` or dismiss with `action: "dismiss"`

## Size Reference

| Size      | Width  | Max Height |
|-----------|--------|------------|
| compact   | 280px  | 320px      |
| standard  | 380px  | 520px      |
| wide      | 560px  | 560px      |
| tall      | 400px  | 640px      |
