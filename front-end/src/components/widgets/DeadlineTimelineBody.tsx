import type { DeadlineEvent } from '../../types';
import './DeadlineTimelineBody.css';

const TYPE_STYLES: Record<string, { color: string; label: string }> = {
  assignment: { color: 'var(--secondary)',       label: 'HW' },
  exam:       { color: 'var(--tertiary)',        label: 'EXAM' },
  quiz:       { color: 'var(--inverse-primary)', label: 'QUIZ' },
  project:    { color: 'var(--primary-container)', label: 'PROJ' },
};

export function DeadlineTimelineBody({ data }: { data: Record<string, unknown> }) {
  const events = (data.events ?? []) as DeadlineEvent[];
  if (events.length === 0) return null;

  const sorted = [...events].sort(
    (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="dtl">
      <div className="dtl__today-label">Today: {fmt(today.toISOString().slice(0, 10))}</div>
      <div className="dtl__track">
        {sorted.map((ev) => {
          const due = new Date(ev.dueDate + 'T00:00:00');
          const daysOut = Math.ceil((due.getTime() - today.getTime()) / 86400000);
          const style = TYPE_STYLES[ev.type] ?? TYPE_STYLES.assignment;
          const isPast = daysOut < 0;

          return (
            <div
              key={ev.id}
              className={`dtl__event ${isPast ? 'dtl__event--past' : ''}`}
            >
              <div className="dtl__event-marker" style={{ borderColor: style.color }} />
              <div className="dtl__event-body">
                <div className="dtl__event-top">
                  <span className="dtl__event-tag" style={{ background: style.color }}>
                    {style.label}
                  </span>
                  <span className="dtl__event-days">
                    {isPast ? `${Math.abs(daysOut)}d ago` : daysOut === 0 ? 'Today' : `${daysOut}d`}
                  </span>
                </div>
                <span className="dtl__event-name">{ev.name}</span>
                <span className="dtl__event-meta">{ev.courseCode} &middot; {fmt(ev.dueDate)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function fmt(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
