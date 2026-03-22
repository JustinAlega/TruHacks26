import { useRef, useCallback, type PointerEvent, type ReactNode } from 'react';
import type { WidgetInstance, Position } from '../types';
import { WIDGET_TITLES } from '../types';
import { AcademicOverviewWidget } from './widgets/AcademicOverviewWidget';
import { CourseDetailsWidget } from './widgets/CourseDetailsWidget';
import { ProfessorWidget } from './widgets/ProfessorWidget';
import { CourseRoadmapWidget } from './widgets/CourseRoadmapWidget';
import { JobListingsWidget } from './widgets/JobListingsWidget';
import { ScheduleWidget } from './widgets/ScheduleWidget';
import type {
  AcademicOverviewData,
  CourseData,
  ProfessorData,
  CourseRoadmapData,
  JobListingData,
  ScheduleData,
} from '../types';

function WidgetContent({ type, data }: { type: string; data: unknown }): ReactNode {
  switch (type) {
    case 'academic-overview':
      return <AcademicOverviewWidget data={data as AcademicOverviewData} />;
    case 'course-details':
      return <CourseDetailsWidget data={data as CourseData} />;
    case 'professor':
      return <ProfessorWidget data={data as ProfessorData} />;
    case 'course-roadmap':
      return <CourseRoadmapWidget data={data as CourseRoadmapData} />;
    case 'job-listings':
      return <JobListingsWidget data={data as JobListingData} />;
    case 'schedule':
      return <ScheduleWidget data={data as ScheduleData} />;
    default:
      return <div className="widget-empty">Unknown widget type</div>;
  }
}

interface WidgetProps {
  widget: WidgetInstance;
  onClose: (id: string) => void;
  onMinimize: (id: string) => void;
  onPositionChange: (id: string, pos: Position) => void;
  onBringToFront: (id: string) => void;
}

export function Widget({
  widget,
  onClose,
  onMinimize,
  onPositionChange,
  onBringToFront,
}: WidgetProps) {
  const dragState = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);

  const handlePointerDown = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      onBringToFront(widget.id);

      const el = e.currentTarget;
      el.setPointerCapture(e.pointerId);

      dragState.current = {
        startX: e.clientX,
        startY: e.clientY,
        originX: widget.position.x,
        originY: widget.position.y,
      };
    },
    [widget.id, widget.position, onBringToFront],
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (!dragState.current) return;
      const dx = e.clientX - dragState.current.startX;
      const dy = e.clientY - dragState.current.startY;
      onPositionChange(widget.id, {
        x: dragState.current.originX + dx,
        y: dragState.current.originY + dy,
      });
    },
    [widget.id, onPositionChange],
  );

  const handlePointerUp = useCallback(() => {
    dragState.current = null;
  }, []);

  const title = WIDGET_TITLES[widget.type] || widget.type;

  return (
    <div
      className={`widget-frame ${widget.minimized ? 'minimized' : ''}`}
      style={{
        left: widget.position.x,
        top: widget.position.y,
        width: widget.size.width,
        zIndex: widget.zIndex,
      }}
      onPointerDown={() => onBringToFront(widget.id)}
    >
      <div className="widget-accent-line" />

      <div
        className="widget-header"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <span className="widget-title">{title}</span>
        <div className="widget-controls">
          <button
            className="widget-ctrl-btn minimize"
            onClick={(e) => { e.stopPropagation(); onMinimize(widget.id); }}
            aria-label="Minimize"
          >
            <svg width="10" height="10" viewBox="0 0 10 10">
              <line x1="2" y1="5" x2="8" y2="5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
          <button
            className="widget-ctrl-btn close"
            onClick={(e) => { e.stopPropagation(); onClose(widget.id); }}
            aria-label="Close"
          >
            <svg width="10" height="10" viewBox="0 0 10 10">
              <line x1="2" y1="2" x2="8" y2="8" stroke="currentColor" strokeWidth="1.5" />
              <line x1="8" y1="2" x2="2" y2="8" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </div>
      </div>

      {!widget.minimized && (
        <div className="widget-body">
          <WidgetContent type={widget.type} data={widget.data} />
        </div>
      )}
    </div>
  );
}
