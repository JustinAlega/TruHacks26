import type { WidgetInstance } from '../types';
import { WIDGET_TITLES } from '../types';

const TYPE_ACCENTS: Record<string, string> = {
  'academic-overview': '#93f2f2',
  'course-details': '#6dd5d5',
  'professor': '#93c5fd',
  'course-roadmap': '#93f2f2',
  'job-listings': '#fbbf24',
  'schedule': '#a78bfa',
};

interface WidgetDockProps {
  minimizedWidgets: WidgetInstance[];
  onRestore: (id: string) => void;
  onClose: (id: string) => void;
}

export function WidgetDock({ minimizedWidgets, onRestore, onClose }: WidgetDockProps) {
  if (minimizedWidgets.length === 0) return null;

  return (
    <div className="widget-dock">
      {minimizedWidgets.map((w) => {
        const accent = TYPE_ACCENTS[w.type] ?? '#94a3b8';
        const title = WIDGET_TITLES[w.type] ?? w.type;

        return (
          <button
            key={w.id}
            className="dock-item"
            onClick={() => onRestore(w.id)}
            title={`Restore ${title}`}
          >
            <span className="dock-accent" style={{ background: accent }} />
            <span className="dock-label">{title}</span>
            <span
              className="dock-close"
              onClick={(e) => { e.stopPropagation(); onClose(w.id); }}
              title="Close"
            >
              ×
            </span>
          </button>
        );
      })}
    </div>
  );
}
