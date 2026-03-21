export interface StudentContext {
  name: string;
  major: string;
  studentId: string;
}

export type WidgetType =
  | 'assignments'
  | 'course'
  | 'professor'
  | 'course_roadmap'
  | 'job_listings'
  | 'skills_tree'
  | 'gpa_tracker'
  | 'grade_breakdown'
  | 'deadline_timeline'
  | 'quick_stats'
  | 'course_compare';

export type WidgetActionKind = 'show' | 'update' | 'dismiss';

export interface WidgetAction {
  action: WidgetActionKind;
  id?: string;
  type: WidgetType;
  data: Record<string, unknown>;
}

export interface AIResponse {
  id: string;
  text: string;
  widgets?: WidgetAction[];
}

export interface UserMessage {
  text: string;
  studentContext?: StudentContext;
}

export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: number;
  widgets?: WidgetAction[];
}

/* ── Domain types ─────────────────────────────────────────── */

export interface Assignment {
  id: string;
  name: string;
  course: string;
  dueDate: string;
  status: 'missing' | 'upcoming' | 'submitted' | 'graded';
}

export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'full-time' | 'part-time' | 'internship' | 'co-op';
  description: string;
  skills: string[];
}

export interface Skill {
  id: string;
  name: string;
  level: number;
  category: string;
  children?: Skill[];
}

export interface CourseInfo {
  id: string;
  code: string;
  name: string;
  credits: number;
  professor: string;
  schedule: string;
  description: string;
  prerequisites?: string[];
  rating?: number;
}

export interface ProfessorInfo {
  id: string;
  firstName: string;
  lastName: string;
  department: string;
  email?: string;
  avgRating: number;
  avgDifficulty: number;
  numRatings: number;
  school: string;
  rmpLink?: string;
}

export type CourseNodeStatus = 'completed' | 'in_progress' | 'available' | 'locked';

export interface CourseNode {
  id: string;
  code: string;
  name: string;
  credits: number;
  status: CourseNodeStatus;
}

export interface CourseEdge {
  source: string;
  target: string;
}

export interface CourseRoadmapData {
  nodes: CourseNode[];
  edges: CourseEdge[];
}

export interface GpaSummary {
  cumulative: number;
  semester: number;
  creditsCompleted: number;
  creditsRemaining: number;
  courses: { name: string; grade: string; gpa: number; credits: number }[];
}

export interface GradeCategory {
  name: string;
  weight: number;
  score: number;
  items: { name: string; score: number; maxScore: number }[];
}

export interface GradeBreakdownData {
  courseName: string;
  courseCode: string;
  currentGrade: string;
  currentScore: number;
  categories: GradeCategory[];
}

export interface DeadlineEvent {
  id: string;
  name: string;
  course: string;
  courseCode: string;
  dueDate: string;
  type: 'assignment' | 'exam' | 'quiz' | 'project';
}

export interface ScheduleBlock {
  id: string;
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri';
  startTime: string;
  endTime: string;
  courseName: string;
  courseCode: string;
  location: string;
}

export interface QuickStatsData {
  gpa: number;
  creditsCompleted: number;
  creditsRemaining: number;
  currentSemester: string;
  coursesThisSemester: number;
}

export type WidgetSize = 'compact' | 'standard' | 'wide' | 'tall';
