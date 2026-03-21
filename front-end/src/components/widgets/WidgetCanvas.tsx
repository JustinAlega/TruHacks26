import { useCallback, useRef, useState, useEffect } from 'react';
import Draggable, { type DraggableData, type DraggableEvent } from 'react-draggable';
import { useWidgetWindowStore, type WidgetWindow } from '../../stores/widgetWindowStore';
import { FloatingWidgetWindow } from './FloatingWidgetWindow';
import { AssignmentsBody } from './AssignmentsBody';
import { JobListingsBody } from './JobListingsBody';
import { SkillsTreeBody } from './SkillsTreeBody';
import { CourseBody } from './CourseBody';
import { ProfessorBody } from './ProfessorBody';
import { CourseRoadmapBody } from './CourseRoadmapBody';
import { GpaTrackerBody } from './GpaTrackerBody';
import { GradeBreakdownBody } from './GradeBreakdownBody';
import { DeadlineTimelineBody } from './DeadlineTimelineBody';
import { QuickStatsBody } from './QuickStatsBody';
import './WidgetCanvas.css';

function body(w: WidgetWindow) {
  switch (w.type) {
    case 'assignments':       return <AssignmentsBody data={w.data} />;
    case 'job_listings':      return <JobListingsBody data={w.data} />;
    case 'skills_tree':       return <SkillsTreeBody data={w.data} />;
    case 'course':            return <CourseBody data={w.data} />;
    case 'professor':         return <ProfessorBody data={w.data} />;
    case 'course_roadmap':    return <CourseRoadmapBody data={w.data} />;
    case 'gpa_tracker':       return <GpaTrackerBody data={w.data} />;
    case 'grade_breakdown':   return <GradeBreakdownBody data={w.data} />;
    case 'deadline_timeline': return <DeadlineTimelineBody data={w.data} />;
    case 'quick_stats':       return <QuickStatsBody data={w.data} />;
    default:                  return <div>Unknown widget</div>;
  }
}

function Shell({ w }: { w: WidgetWindow }) {
  const close = useWidgetWindowStore((s) => s.close);
  const toggleMinimize = useWidgetWindowStore((s) => s.toggleMinimize);
  const focusFn = useWidgetWindowStore((s) => s.focus);

  return (
    <FloatingWidgetWindow
      title={w.title}
      size={w.size}
      animState={w.animState}
      onClose={() => close(w.id)}
      onMinimize={() => toggleMinimize(w.id)}
      onFocus={() => focusFn(w.id)}
    >
      {body(w)}
    </FloatingWidgetWindow>
  );
}

export function WidgetCanvas() {
  const windows = useWidgetWindowStore((s) => s.windows);
  const move = useWidgetWindowStore((s) => s.move);
  const focus = useWidgetWindowStore((s) => s.focus);

  const canvasRef = useRef<HTMLDivElement>(null);
  const [cw, setCw] = useState(0);
  const [ch, setCh] = useState(0);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setCw(r.width);
      setCh(r.height);
    });
    ro.observe(el);
    const r = el.getBoundingClientRect();
    setCw(r.width);
    setCh(r.height);
    return () => ro.disconnect();
  }, []);

  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const u = () => setMobile(mq.matches);
    u();
    mq.addEventListener('change', u);
    return () => mq.removeEventListener('change', u);
  }, []);

  const onStop = useCallback(
    (id: string, _e: DraggableEvent, d: DraggableData) => {
      const x = Math.min(Math.max(0, d.x), Math.max(0, cw - 280));
      const y = Math.min(Math.max(0, d.y), Math.max(0, ch - 200));
      move(id, { x, y });
    },
    [cw, ch, move],
  );

  const visible = windows.filter((w) => !w.minimized).sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div ref={canvasRef} className={`wc ${mobile ? 'wc--mobile' : ''}`}>
      {visible.map((w) =>
        mobile ? (
          <div key={w.id} className="wc__mobile-slot" style={{ zIndex: w.zIndex }}>
            <Shell w={w} />
          </div>
        ) : (
          <Draggable
            key={w.id}
            handle=".fw__drag-handle"
            cancel=".fw__icon-btn"
            bounds="parent"
            position={w.position}
            onStart={() => focus(w.id)}
            onStop={(e, d) => onStop(w.id, e, d)}
          >
            <div className="wc__slot" style={{ zIndex: w.zIndex }}>
              <Shell w={w} />
            </div>
          </Draggable>
        ),
      )}
    </div>
  );
}
