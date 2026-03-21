export type WidgetType =
  | 'assignments'
  | 'course-details'
  | 'professor'
  | 'course-roadmap'
  | 'gpa'
  | 'job-listings'
  | 'schedule';

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface WidgetInstance {
  id: string;
  type: WidgetType;
  data: unknown;
  position: Position;
  size: Size;
  zIndex: number;
  minimized: boolean;
}

export interface AssignmentItem {
  id: string;
  courseName: string;
  name: string;
  dueDate: string;
  status: 'upcoming' | 'submitted' | 'late' | 'missing' | 'graded';
  pointsEarned?: number;
  pointsPossible?: number;
}

export interface AssignmentData {
  assignments: AssignmentItem[];
}

export interface CourseData {
  name: string;
  courseId: string;
  description: string;
  term: string;
  instructor: string;
  credits: number;
  schedule?: string;
  currentGrade?: string;
}

export interface ProfessorData {
  name: string;
  department: string;
  email?: string;
  office?: string;
  rating: number;
  difficulty: number;
  wouldTakeAgain: number;
  numRatings: number;
  topTags: string[];
}

export interface RoadmapNode {
  id: string;
  name: string;
  credits: number;
  status: 'completed' | 'in_progress' | 'planned' | 'available';
  grade?: string;
  prereqs: string[];
}

export interface CourseRoadmapData {
  major: string;
  nodes: RoadmapNode[];
}

export interface SemesterGPA {
  term: string;
  gpa: number;
  credits: number;
}

export interface GPAData {
  currentGPA: number;
  totalCredits: number;
  semesters: SemesterGPA[];
}

export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  technologies: string[];
  postedDate: string;
  url?: string;
}

export interface JobListingData {
  query?: string;
  listings: JobListing[];
}

export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri';

export interface ScheduleCourse {
  name: string;
  courseId: string;
  days: DayOfWeek[];
  startTime: string;
  endTime: string;
  location: string;
  color: string;
}

export interface ScheduleData {
  courses: ScheduleCourse[];
}

export type Message =
  | { role: 'user'; text: string }
  | { role: 'assistant'; text: string }
  | { role: 'tool'; name: string; data: unknown };

export const WIDGET_TITLES: Record<WidgetType, string> = {
  'assignments': 'Assignments',
  'course-details': 'Course Details',
  'professor': 'Professor',
  'course-roadmap': 'Course Roadmap',
  'gpa': 'GPA Tracker',
  'job-listings': 'Job Listings',
  'schedule': 'Schedule',
};

export const WIDGET_DEFAULT_SIZES: Record<WidgetType, Size> = {
  'assignments': { width: 400, height: 420 },
  'course-details': { width: 360, height: 280 },
  'professor': { width: 340, height: 340 },
  'course-roadmap': { width: 600, height: 380 },
  'gpa': { width: 320, height: 280 },
  'job-listings': { width: 400, height: 400 },
  'schedule': { width: 540, height: 400 },
};
