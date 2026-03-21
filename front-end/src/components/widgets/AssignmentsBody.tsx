import type { Assignment } from '../../types';
import './AssignmentsBody.css';

export function AssignmentsBody({ data }: { data: Record<string, unknown> }) {
  const list = (data.assignments ?? []) as Assignment[];
  const missing = list.filter((a) => a.status === 'missing');
  const upcoming = list.filter((a) => a.status === 'upcoming');

  return (
    <>
      {missing.length > 0 && (
        <section className="asec">
          {/* §6 DO — tertiary_fixed for "At Risk" / urgent */}
          <div className="asec__label asec__label--urgent">
            Missing
            <span className="asec__count">{missing.length}</span>
          </div>
          <ul className="alist">
            {missing.map((a) => (
              <li key={a.id} className="arow arow--missing">
                <span className="arow__dot" aria-hidden />
                <div>
                  <div className="arow__name">{a.name}</div>
                  <div className="arow__meta">{a.course} &middot; Due {fmt(a.dueDate)}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
      {upcoming.length > 0 && (
        <section className="asec">
          <div className="asec__label">Upcoming</div>
          <ul className="alist">
            {upcoming.map((a) => (
              <li key={a.id} className="arow arow--upcoming">
                <span className="arow__dot" aria-hidden />
                <div>
                  <div className="arow__name">{a.name}</div>
                  <div className="arow__meta">{a.course} &middot; Due {fmt(a.dueDate)}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function fmt(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
