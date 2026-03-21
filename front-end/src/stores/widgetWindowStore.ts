import { create } from 'zustand';
import type { WidgetAction, WidgetType, WidgetSize } from '../types';

export interface WidgetWindow {
  id: string;
  type: WidgetType;
  title: string;
  position: { x: number; y: number };
  size: WidgetSize;
  zIndex: number;
  minimized: boolean;
  animState: 'spawning' | 'active' | 'dismissing';
  data: Record<string, unknown>;
}

const DEFAULT_TITLES: Record<WidgetType, string> = {
  assignments:       'Critical Tasks',
  job_listings:      'Opportunities',
  skills_tree:       'Skills Progress',
  course:            'Course Info',
  professor:         'Professor',
  course_roadmap:    'Course Roadmap',
  gpa_tracker:       'GPA Tracker',
  grade_breakdown:   'Grade Breakdown',
  deadline_timeline: 'Deadlines',
  quick_stats:       'Quick Stats',
  course_compare:    'Compare Courses',
};

const DEFAULT_SIZES: Record<WidgetType, WidgetSize> = {
  assignments:       'standard',
  job_listings:      'standard',
  skills_tree:       'standard',
  course:            'standard',
  professor:         'standard',
  course_roadmap:    'wide',
  gpa_tracker:       'standard',
  grade_breakdown:   'standard',
  deadline_timeline: 'wide',
  quick_stats:       'compact',
  course_compare:    'wide',
};

let zSeed = 100;
function nextZ() { return ++zSeed; }

let cascadeOffset = 0;
function nextSpawnPos(): { x: number; y: number } {
  const base = { x: 80, y: 60 };
  const pos = {
    x: base.x + cascadeOffset * 32,
    y: base.y + cascadeOffset * 28,
  };
  cascadeOffset = (cascadeOffset + 1) % 8;
  return pos;
}

function uid(): string {
  return crypto.randomUUID();
}

interface Store {
  windows: WidgetWindow[];

  titleFor: (type: WidgetType) => string;
  applyActions: (actions: WidgetAction[]) => void;
  spawn: (type: WidgetType, data: Record<string, unknown>, customTitle?: string) => string;
  move: (id: string, pos: { x: number; y: number }) => void;
  focus: (id: string) => void;
  toggleMinimize: (id: string) => void;
  close: (id: string) => void;
  finishSpawn: (id: string) => void;
  clear: () => void;
}

export const useWidgetWindowStore = create<Store>((set, get) => ({
  windows: [],

  titleFor: (t) => DEFAULT_TITLES[t],

  spawn: (type, data, customTitle) => {
    const id = uid();
    const w: WidgetWindow = {
      id,
      type,
      title: customTitle ?? DEFAULT_TITLES[type],
      position: nextSpawnPos(),
      size: DEFAULT_SIZES[type],
      zIndex: nextZ(),
      minimized: false,
      animState: 'spawning',
      data,
    };
    set((s) => ({ windows: [...s.windows, w] }));
    setTimeout(() => get().finishSpawn(id), 400);
    return id;
  },

  applyActions: (actions) => {
    for (const a of actions) {
      if (a.action === 'dismiss' && a.id) {
        get().close(a.id);
      } else if (a.action === 'dismiss') {
        set((s) => ({
          windows: s.windows.filter((w) => w.type !== a.type),
        }));
      } else if (a.action === 'update' && a.id) {
        set((s) => ({
          windows: s.windows.map((w) =>
            w.id === a.id
              ? { ...w, data: { ...w.data, ...a.data }, zIndex: nextZ() }
              : w,
          ),
        }));
      } else {
        get().spawn(a.type, a.data);
      }
    }
  },

  move: (id, pos) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, position: pos } : w)),
    })),

  focus: (id) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, zIndex: nextZ() } : w)),
    })),

  toggleMinimize: (id) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, minimized: !w.minimized, zIndex: nextZ() } : w,
      ),
    })),

  close: (id) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, animState: 'dismissing' as const } : w,
      ),
    })),

  finishSpawn: (id) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id && w.animState === 'spawning'
          ? { ...w, animState: 'active' as const }
          : w,
      ),
    })),

  clear: () => set({ windows: [] }),
}));

export function removeDismissed() {
  useWidgetWindowStore.setState((s) => ({
    windows: s.windows.filter((w) => w.animState !== 'dismissing'),
  }));
}
