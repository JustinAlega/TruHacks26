import { useState } from 'react';
import type { AssignmentData } from '../../types';

function relativeDate(iso: string): string {
  const now = new Date();
  const d = new Date(iso);
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
  if (diffDays > 7) return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  if (diffDays === -1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const STATUS_STYLES: Record<string, { className: string; label: string }> = {
  upcoming: { className: 'badge-teal', label: 'Upcoming' },
  submitted: { className: 'badge-blue', label: 'Submitted' },
  graded: { className: 'badge-green', label: 'Graded' },
  late: { className: 'badge-amber', label: 'Late' },
  missing: { className: 'badge-red', label: 'Missing' },
};

export function AssignmentsWidget({ data }: { data: AssignmentData }) {
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  const upcoming = data.assignments
    .filter((a) => a.status === 'upcoming')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const past = data.assignments
    .filter((a) => a.status !== 'upcoming')
    .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

  const list = tab === 'upcoming' ? upcoming : past;

  return (
    <div className="widget-assignments">
      <div className="widget-tabs">
        <button
          className={`widget-tab ${tab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setTab('upcoming')}
        >
          Upcoming ({upcoming.length})
        </button>
        <button
          className={`widget-tab ${tab === 'past' ? 'active' : ''}`}
          onClick={() => setTab('past')}
        >
          Past ({past.length})
        </button>
      </div>

      <div className="assignment-list">
        {list.map((a) => {
          const style = STATUS_STYLES[a.status];
          return (
            <div key={a.id} className="assignment-row">
              <div className="assignment-info">
                <span className="assignment-course">{a.courseName}</span>
                <span className="assignment-name">{a.name}</span>
                <span className="assignment-date">{relativeDate(a.dueDate)}</span>
              </div>
              <div className="assignment-meta">
                <span className={`badge ${style.className}`}>
                  {a.status === 'graded' && a.pointsEarned !== undefined
                    ? `${a.pointsEarned}/${a.pointsPossible}`
                    : style.label}
                </span>
              </div>
            </div>
          );
        })}
        {list.length === 0 && (
          <div className="widget-empty">No {tab} assignments</div>
        )}
      </div>
    </div>
  );
}
