export type WidgetType =
  | 'academic-overview'
  | 'course-details'
  | 'professor'
  | 'course-roadmap'
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

export interface EnrolledCourse {
  courseId: string;
  name: string;
  grade?: string;
  missingCount: number;
}

export interface AcademicOverviewData {
  currentGPA: number;
  totalCredits: number;
  semesters: SemesterGPA[];
  courses: EnrolledCourse[];
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

export interface ElectiveOption {
  course: string;
  section: string;
  name: string;
  crn: string;
  time: string;
  professor: string;
  description: string;
  credits: number;
}

export interface RoadmapNode {
  id: string;
  name: string;
  credits: number;
  status: 'completed' | 'in_progress' | 'planned' | 'available' | 'wildcard';
  grade?: string;
  prereqs: string[];
  semester?: number;
  electiveOptions?: ElectiveOption[];
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
  'academic-overview': 'Academic Overview',
  'course-details': 'Course Details',
  'professor': 'Professor',
  'course-roadmap': 'Course Roadmap',
  'job-listings': 'Job Listings',
  'schedule': 'Schedule',
};

export const WIDGET_DEFAULT_SIZES: Record<WidgetType, Size> = {
  'academic-overview': { width: 420, height: 460 },
  'course-details': { width: 360, height: 280 },
  'professor': { width: 340, height: 340 },
  'course-roadmap': { width: 600, height: 380 },
  'job-listings': { width: 400, height: 400 },
  'schedule': { width: 540, height: 400 },
};
