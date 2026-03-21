import { useWidgetWindowStore } from '../../stores/widgetWindowStore';
import './WidgetDock.css';

export function WidgetDock() {
  const windows = useWidgetWindowStore((s) => s.windows);
  const toggleMinimize = useWidgetWindowStore((s) => s.toggleMinimize);
  const focus = useWidgetWindowStore((s) => s.focus);
  const minimized = windows.filter((w) => w.minimized);

  if (minimized.length === 0) return null;

  return (
    <div className="dock" role="toolbar" aria-label="Minimized panels">
      {minimized.map((w) => (
        <button
          key={w.id}
          className="dock__chip"
          onClick={() => { focus(w.id); toggleMinimize(w.id); }}
        >
          {w.title}
        </button>
      ))}
    </div>
  );
}
