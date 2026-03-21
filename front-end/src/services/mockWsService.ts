import type { WSService, OnChunkCb, OnCompleteCb, OnWidgetCb } from './wsService';
import type { AIResponse, StudentContext, UserMessage, WidgetAction } from '../types';

interface Scenario {
  match: (t: string) => boolean;
  respond: (ctx: StudentContext) => { text: string; widgets?: WidgetAction[] };
}

const scenarios: Scenario[] = [
  {
    match: (t) => /assign|homework|due|missing|task/i.test(t),
    respond: (ctx) => ({
      text: `Here are your current assignments, ${ctx.name}. You have one missing assignment that needs immediate attention, plus two upcoming deadlines this week.`,
      widgets: [{
        action: 'show',
        type: 'assignments',
        data: {
          assignments: [
            { id: 'a1', name: 'Binary Tree Traversal Lab', course: 'CS 201 - Data Structures', dueDate: '2026-03-14', status: 'missing' },
            { id: 'a2', name: 'Database Normalization Report', course: 'CS 340 - Databases', dueDate: '2026-03-25', status: 'upcoming' },
            { id: 'a3', name: 'Ethics Case Study', course: 'CS 490 - Ethics in Computing', dueDate: '2026-03-28', status: 'upcoming' },
            { id: 'a4', name: 'Sorting Algorithms Analysis', course: 'CS 201 - Data Structures', dueDate: '2026-03-10', status: 'graded' },
          ],
        },
      }],
    }),
  },
  {
    match: (t) => /job|intern|career|work|employ|opportunit/i.test(t),
    respond: (ctx) => ({
      text: `Based on your ${ctx.major} background, here are three openings that match your current skills well.`,
      widgets: [{
        action: 'show',
        type: 'job_listings',
        data: {
          listings: [
            { id: 'j1', title: 'Software Engineering Intern', company: 'Google', location: 'Mountain View, CA (Hybrid)', type: 'internship', description: 'Core infrastructure projects.', skills: ['Python', 'Algorithms', 'System Design'] },
            { id: 'j2', title: 'Junior Full-Stack Developer', company: 'Shopify', location: 'Remote', type: 'full-time', description: 'Merchant features with React & Rails.', skills: ['React', 'TypeScript', 'Ruby on Rails'] },
            { id: 'j3', title: 'Data Science Co-op', company: 'IBM', location: 'New York, NY', type: 'co-op', description: 'Predictive models for enterprise clients.', skills: ['Python', 'SQL', 'Machine Learning'] },
          ],
        },
      }],
    }),
  },
  {
    match: (t) => /skill|learn|progress|improve|strength|weak/i.test(t),
    respond: (ctx) => ({
      text: `Here is your skills snapshot, ${ctx.name}. Programming fundamentals are strong — system design and cloud are your growth areas this semester.`,
      widgets: [{
        action: 'show',
        type: 'skills_tree',
        data: {
          skills: [
            { id: 's1', name: 'Programming', level: 82, category: 'Core', children: [
              { id: 's1a', name: 'Python', level: 90, category: 'Languages' },
              { id: 's1b', name: 'Java', level: 75, category: 'Languages' },
              { id: 's1c', name: 'TypeScript', level: 70, category: 'Languages' },
            ]},
            { id: 's2', name: 'Web Development', level: 72, category: 'Applied', children: [
              { id: 's2a', name: 'React', level: 78, category: 'Frontend' },
              { id: 's2b', name: 'Node.js', level: 65, category: 'Backend' },
            ]},
            { id: 's3', name: 'System Design', level: 35, category: 'Advanced' },
            { id: 's4', name: 'Cloud & DevOps', level: 28, category: 'Infrastructure' },
          ],
        },
      }],
    }),
  },
  {
    match: (t) => /professor|prof\b|rating|rmp|rate\s*my/i.test(t),
    respond: () => ({
      text: `Here's the profile for Dr. Sarah Chen. She has excellent ratings and is known for clear lectures.`,
      widgets: [{
        action: 'show',
        type: 'professor',
        data: {
          professor: {
            id: 'p1',
            firstName: 'Sarah',
            lastName: 'Chen',
            department: 'Computer Science',
            email: 'schen@university.edu',
            avgRating: 4.6,
            avgDifficulty: 3.2,
            numRatings: 142,
            school: 'University of Michigan',
            rmpLink: 'https://www.ratemyprofessors.com/professor/12345',
          },
        },
      }],
    }),
  },
  {
    match: (t) => /road\s*map|prereq|path|plan.*course|degree.*plan|dag/i.test(t),
    respond: (ctx) => ({
      text: `Here's your course roadmap, ${ctx.name}. I've mapped out the prerequisite chain for your ${ctx.major} degree. Green courses are completed, blue are in progress, and gray are upcoming.`,
      widgets: [{
        action: 'show',
        type: 'course_roadmap',
        data: {
          roadmap: {
            nodes: [
              { id: 'cs101', code: 'CS 101', name: 'Intro to CS', credits: 3, status: 'completed' },
              { id: 'cs102', code: 'CS 102', name: 'Programming II', credits: 3, status: 'completed' },
              { id: 'math240', code: 'MATH 240', name: 'Discrete Math', credits: 3, status: 'completed' },
              { id: 'cs201', code: 'CS 201', name: 'Data Structures', credits: 3, status: 'in_progress' },
              { id: 'cs250', code: 'CS 250', name: 'Computer Org', credits: 3, status: 'in_progress' },
              { id: 'cs301', code: 'CS 301', name: 'Algorithms', credits: 3, status: 'available' },
              { id: 'cs340', code: 'CS 340', name: 'Databases', credits: 3, status: 'available' },
              { id: 'cs350', code: 'CS 350', name: 'Operating Systems', credits: 3, status: 'locked' },
              { id: 'cs401', code: 'CS 401', name: 'Machine Learning', credits: 3, status: 'locked' },
              { id: 'cs490', code: 'CS 490', name: 'Capstone', credits: 3, status: 'locked' },
            ],
            edges: [
              { source: 'cs101', target: 'cs102' },
              { source: 'cs102', target: 'cs201' },
              { source: 'math240', target: 'cs201' },
              { source: 'cs102', target: 'cs250' },
              { source: 'cs201', target: 'cs301' },
              { source: 'math240', target: 'cs301' },
              { source: 'cs201', target: 'cs340' },
              { source: 'cs250', target: 'cs350' },
              { source: 'cs301', target: 'cs350' },
              { source: 'cs301', target: 'cs401' },
              { source: 'cs340', target: 'cs401' },
              { source: 'cs301', target: 'cs490' },
              { source: 'cs350', target: 'cs490' },
            ],
          },
        },
      }],
    }),
  },
  {
    match: (t) => /gpa|grade\s*point|cumulative/i.test(t),
    respond: (ctx) => ({
      text: `Here's your GPA breakdown, ${ctx.name}. You're at a 3.45 cumulative — solid position. Your current semester is trending a bit higher at 3.62.`,
      widgets: [{
        action: 'show',
        type: 'gpa_tracker',
        data: {
          gpa: {
            cumulative: 3.45,
            semester: 3.62,
            creditsCompleted: 68,
            creditsRemaining: 52,
            courses: [
              { name: 'Data Structures', grade: 'A-', gpa: 3.7, credits: 3 },
              { name: 'Databases', grade: 'B+', gpa: 3.3, credits: 3 },
              { name: 'Ethics in Computing', grade: 'A', gpa: 4.0, credits: 3 },
              { name: 'Computer Organization', grade: 'B+', gpa: 3.3, credits: 3 },
              { name: 'Technical Writing', grade: 'A', gpa: 4.0, credits: 2 },
            ],
          },
        },
      }],
    }),
  },
  {
    match: (t) => /grade.*break|breakdown|score|weight|category/i.test(t),
    respond: () => ({
      text: `Here's the grade breakdown for CS 201 Data Structures. Your exam scores are strong, but the lab component is pulling things down slightly.`,
      widgets: [{
        action: 'show',
        type: 'grade_breakdown',
        data: {
          breakdown: {
            courseName: 'Data Structures',
            courseCode: 'CS 201',
            currentGrade: 'A-',
            currentScore: 91.2,
            categories: [
              { name: 'Exams', weight: 40, score: 93.5, items: [
                { name: 'Midterm 1', score: 91, maxScore: 100 },
                { name: 'Midterm 2', score: 96, maxScore: 100 },
              ]},
              { name: 'Labs', weight: 30, score: 85.0, items: [
                { name: 'Lab 1 - Linked Lists', score: 90, maxScore: 100 },
                { name: 'Lab 2 - Trees', score: 75, maxScore: 100 },
                { name: 'Lab 3 - Hash Maps', score: 90, maxScore: 100 },
              ]},
              { name: 'Homework', weight: 20, score: 95.0, items: [
                { name: 'HW 1', score: 48, maxScore: 50 },
                { name: 'HW 2', score: 47, maxScore: 50 },
                { name: 'HW 3', score: 45, maxScore: 50 },
              ]},
              { name: 'Participation', weight: 10, score: 100.0, items: [] },
            ],
          },
        },
      }],
    }),
  },
  {
    match: (t) => /deadline|timeline|what.*due|calendar|upcoming/i.test(t),
    respond: (ctx) => ({
      text: `Here's your deadline timeline for the next few weeks, ${ctx.name}. Keep an eye on that databases report due Thursday.`,
      widgets: [{
        action: 'show',
        type: 'deadline_timeline',
        data: {
          events: [
            { id: 'd1', name: 'Database Normalization Report', course: 'Databases', courseCode: 'CS 340', dueDate: '2026-03-25', type: 'assignment' },
            { id: 'd2', name: 'Ethics Case Study', course: 'Ethics in Computing', courseCode: 'CS 490', dueDate: '2026-03-28', type: 'assignment' },
            { id: 'd3', name: 'Midterm 2', course: 'Data Structures', courseCode: 'CS 201', dueDate: '2026-04-01', type: 'exam' },
            { id: 'd4', name: 'Hash Map Lab', course: 'Data Structures', courseCode: 'CS 201', dueDate: '2026-04-04', type: 'assignment' },
            { id: 'd5', name: 'Quiz 3', course: 'Computer Organization', courseCode: 'CS 250', dueDate: '2026-04-07', type: 'quiz' },
            { id: 'd6', name: 'Final Project Proposal', course: 'Databases', courseCode: 'CS 340', dueDate: '2026-04-14', type: 'project' },
          ],
        },
      }],
    }),
  },
  {
    match: (t) => /stats|overview|summary|dashboard|quick/i.test(t),
    respond: (ctx) => ({
      text: `Here's your quick stats dashboard, ${ctx.name}. Everything at a glance.`,
      widgets: [{
        action: 'show',
        type: 'quick_stats',
        data: {
          stats: {
            gpa: 3.45,
            creditsCompleted: 68,
            creditsRemaining: 52,
            currentSemester: 'Spring 2026',
            coursesThisSemester: 5,
          },
        },
      }],
    }),
  },
  {
    match: (t) => /course|class|enroll|register|schedule|recommend/i.test(t),
    respond: () => ({
      text: `I'd recommend CS 301 next semester — it builds on Data Structures and unlocks upper-level electives.`,
      widgets: [{
        action: 'show',
        type: 'course',
        data: {
          course: {
            id: 'c1', code: 'CS 301', name: 'Algorithm Design & Analysis', credits: 3,
            professor: 'Dr. Sarah Chen', schedule: 'MWF 10:00 - 10:50 AM',
            description: 'Divide-and-conquer, dynamic programming, greedy, and graph algorithms. Correctness proofs and complexity analysis.',
            prerequisites: ['CS 201 - Data Structures', 'MATH 240 - Discrete Mathematics'],
            rating: 4.3,
          },
        },
      }],
    }),
  },
];

function greeting(ctx: StudentContext): AIResponse {
  return {
    id: crypto.randomUUID(),
    text: `Hello ${ctx.name}! I'm Aria, your academic and career advisor. You're studying ${ctx.major}. Ask me about your assignments, courses, professors, GPA, deadlines, or career opportunities — I'll pull up insight panels for you.`,
  };
}

function fallback(ctx: StudentContext): { text: string; widgets?: WidgetAction[] } {
  return {
    text: `That's an interesting question, ${ctx.name}. Try asking about your assignments, courses, professors, GPA, grade breakdown, deadlines, career opportunities, or degree roadmap — I'll pull up the right panel for you.`,
  };
}

function streamWords(
  text: string,
  id: string,
  onChunk: OnChunkCb | null,
  onComplete: OnCompleteCb | null,
  onWidget: OnWidgetCb | null,
  widgets?: WidgetAction[],
) {
  const words = text.split(' ');
  let i = 0;
  let dead = false;

  const iv = setInterval(() => {
    if (dead) { clearInterval(iv); return; }
    if (i < words.length) {
      onChunk?.(id, (i === 0 ? '' : ' ') + words[i]);
      i++;
    } else {
      clearInterval(iv);
      if (widgets?.length) {
        onWidget?.(widgets);
      }
      onComplete?.({ id, text });
    }
  }, 35 + Math.random() * 25);

  return { cancel() { dead = true; clearInterval(iv); } };
}

export function createMockWSService(): WSService {
  let ctx: StudentContext | null = null;
  let stream: { cancel(): void } | null = null;

  const svc: WSService = {
    onChunk: null, onComplete: null, onWidget: null, onError: null,

    connect(c) {
      ctx = c;
      setTimeout(() => {
        const g = greeting(c);
        stream = streamWords(g.text, g.id, svc.onChunk, svc.onComplete, svc.onWidget);
      }, 350);
    },

    disconnect() { stream?.cancel(); stream = null; ctx = null; },

    send(msg: UserMessage) {
      if (!ctx) { svc.onError?.(new Error('Not connected')); return; }
      const c = ctx;
      setTimeout(() => {
        const sc = scenarios.find((s) => s.match(msg.text));
        const r = sc ? sc.respond(c) : fallback(c);
        const id = crypto.randomUUID();
        stream = streamWords(r.text, id, svc.onChunk, svc.onComplete, svc.onWidget, r.widgets);
      }, 250 + Math.random() * 350);
    },
  };
  return svc;
}
