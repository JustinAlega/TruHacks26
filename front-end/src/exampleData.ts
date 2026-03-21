import type {
  AssignmentData,
  CourseData,
  ProfessorData,
  CourseRoadmapData,
  GPAData,
  JobListingData,
  ScheduleData,
  WidgetType,
  Position,
  Size,
} from './types';

export const assignmentsExample: AssignmentData = {
  assignments: [
    { id: '1', courseName: 'CS 301', name: 'Binary Tree Implementation', dueDate: '2026-03-25T23:59:00Z', status: 'upcoming', pointsPossible: 100 },
    { id: '2', courseName: 'MATH 240', name: 'Eigenvalue Problem Set #5', dueDate: '2026-03-24T23:59:00Z', status: 'upcoming', pointsPossible: 50 },
    { id: '3', courseName: 'CS 350', name: 'Sprint 3 Deliverable', dueDate: '2026-04-01T23:59:00Z', status: 'upcoming', pointsPossible: 200 },
    { id: '4', courseName: 'CS 301', name: 'AVL Tree Quiz', dueDate: '2026-03-18T23:59:00Z', status: 'graded', pointsEarned: 92, pointsPossible: 100 },
    { id: '5', courseName: 'ENG 102', name: 'Research Paper Draft', dueDate: '2026-03-15T23:59:00Z', status: 'submitted', pointsPossible: 150 },
    { id: '6', courseName: 'MATH 240', name: 'Midterm Exam', dueDate: '2026-03-10T23:59:00Z', status: 'graded', pointsEarned: 78, pointsPossible: 100 },
  ],
};

export const courseExample: CourseData = {
  name: 'Data Structures & Algorithms',
  courseId: 'CS 301',
  description: 'Fundamental data structures including trees, graphs, hash tables, and heaps. Algorithm design techniques: divide-and-conquer, greedy, dynamic programming. Analysis of time and space complexity.',
  term: 'Spring 2026',
  instructor: 'Dr. Sarah Chen',
  credits: 3,
  schedule: 'MWF 9:00–9:50 AM · Hurst Hall 204',
  currentGrade: 'A-',
};

export const professorExample: ProfessorData = {
  name: 'Dr. Sarah Chen',
  department: 'Computer Science',
  email: 's.chen@university.edu',
  office: 'Hurst Hall 312',
  rating: 4.2,
  difficulty: 3.1,
  wouldTakeAgain: 89,
  numRatings: 47,
  topTags: ['Caring', 'Respected', 'Tough Grader', 'Amazing Lectures', 'Group Projects'],
};

export const roadmapExample: CourseRoadmapData = {
  major: 'Computer Science, B.S.',
  nodes: [
    { id: 'CS101', name: 'Intro to CS', credits: 3, status: 'completed', grade: 'A', prereqs: [] },
    { id: 'MATH151', name: 'Calculus I', credits: 4, status: 'completed', grade: 'B+', prereqs: [] },
    { id: 'CS201', name: 'OOP & Design', credits: 3, status: 'completed', grade: 'A-', prereqs: ['CS101'] },
    { id: 'MATH240', name: 'Linear Algebra', credits: 3, status: 'in_progress', prereqs: ['MATH151'] },
    { id: 'CS301', name: 'Data Structures', credits: 3, status: 'in_progress', prereqs: ['CS201', 'MATH151'] },
    { id: 'CS310', name: 'Computer Arch.', credits: 3, status: 'planned', prereqs: ['CS201'] },
    { id: 'CS350', name: 'Software Eng.', credits: 3, status: 'in_progress', prereqs: ['CS201'] },
    { id: 'CS401', name: 'Operating Systems', credits: 3, status: 'available', prereqs: ['CS301', 'CS310'] },
    { id: 'CS420', name: 'Artificial Intel.', credits: 3, status: 'planned', prereqs: ['CS301', 'MATH240'] },
    { id: 'CS450', name: 'Senior Project', credits: 3, status: 'planned', prereqs: ['CS350', 'CS401'] },
  ],
};

export const gpaExample: GPAData = {
  currentGPA: 3.67,
  totalCredits: 72,
  semesters: [
    { term: "Fall '24", gpa: 3.4, credits: 15 },
    { term: "Spr '25", gpa: 3.6, credits: 16 },
    { term: "Fall '25", gpa: 3.8, credits: 17 },
    { term: "Spr '26", gpa: 3.9, credits: 12 },
  ],
};

export const jobsExample: JobListingData = {
  query: 'Software Engineering Intern',
  listings: [
    { id: 'j1', title: 'Software Engineering Intern', company: 'TechCorp', location: 'San Francisco, CA', salary: '$45/hr', technologies: ['React', 'TypeScript', 'Python'], postedDate: '2026-03-18', url: '#' },
    { id: 'j2', title: 'Full Stack Developer Intern', company: 'StartupXYZ', location: 'Remote', salary: '$35–40/hr', technologies: ['Node.js', 'React', 'PostgreSQL'], postedDate: '2026-03-15', url: '#' },
    { id: 'j3', title: 'Backend Engineer (New Grad)', company: 'DataFlow Inc.', location: 'Austin, TX', salary: '$95K–110K', technologies: ['Python', 'FastAPI', 'AWS'], postedDate: '2026-03-12', url: '#' },
    { id: 'j4', title: 'ML Engineering Intern', company: 'AI Labs', location: 'New York, NY', technologies: ['Python', 'PyTorch', 'Docker'], postedDate: '2026-03-10', url: '#' },
  ],
};

export const scheduleExample: ScheduleData = {
  courses: [
    { name: 'Data Structures & Algorithms', courseId: 'CS 301', days: ['Mon', 'Wed', 'Fri'], startTime: '09:00', endTime: '09:50', location: 'Hurst 204', color: '#006a6a' },
    { name: 'Linear Algebra', courseId: 'MATH 240', days: ['Tue', 'Thu'], startTime: '10:00', endTime: '11:15', location: 'Korman 120', color: '#7c3aed' },
    { name: 'Software Engineering', courseId: 'CS 350', days: ['Mon', 'Wed'], startTime: '13:00', endTime: '14:15', location: 'UCross 153', color: '#b45309' },
    { name: 'English Composition II', courseId: 'ENG 102', days: ['Tue', 'Thu'], startTime: '14:00', endTime: '15:15', location: 'MacAlister 2018', color: '#be185d' },
  ],
};

export interface ExampleWidget {
  type: WidgetType;
  data: unknown;
  position: Position;
  size: Size;
}

export const EXAMPLE_WIDGETS: ExampleWidget[] = [
  {
    type: 'gpa',
    data: gpaExample,
    position: { x: 40, y: 40 },
    size: { width: 320, height: 280 },
  },
  {
    type: 'assignments',
    data: assignmentsExample,
    position: { x: 400, y: 30 },
    size: { width: 400, height: 420 },
  },
  {
    type: 'professor',
    data: professorExample,
    position: { x: 840, y: 50 },
    size: { width: 340, height: 380 },
  },
  {
    type: 'schedule',
    data: scheduleExample,
    position: { x: 30, y: 360 },
    size: { width: 540, height: 400 },
  },
  {
    type: 'course-roadmap',
    data: roadmapExample,
    position: { x: 610, y: 470 },
    size: { width: 620, height: 380 },
  },
  {
    type: 'course-details',
    data: courseExample,
    position: { x: 30, y: 800 },
    size: { width: 360, height: 300 },
  },
  {
    type: 'job-listings',
    data: jobsExample,
    position: { x: 430, y: 890 },
    size: { width: 400, height: 400 },
  },
];
