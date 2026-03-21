import type { CourseInfo } from '../../types';
import './CourseBody.css';

export function CourseBody({ data }: { data: Record<string, unknown> }) {
  const c = data.course as CourseInfo | undefined;
  if (!c) return null;

  return (
    <div className="cbody">
      <p className="cbody__code">{c.code}</p>
      <h3 className="cbody__name">{c.name}</h3>

      <dl className="cbody__dl">
        <Row label="Professor" value={c.professor} />
        <Row label="Credits"   value={String(c.credits)} />
        <Row label="Schedule"  value={c.schedule} />
        {c.rating != null && <Row label="Rating" value={c.rating.toFixed(1)} accent />}
      </dl>

      <p className="cbody__desc">{c.description}</p>

      {c.prerequisites && c.prerequisites.length > 0 && (
        <div className="cbody__prereq">
          <span className="cbody__prereq-label">Prerequisites</span>
          <ul className="cbody__prereq-list">
            {c.prerequisites.map((p) => <li key={p}>{p}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="cbody__dl-row">
      <dt>{label}</dt>
      <dd className={accent ? 'cbody__accent' : ''}>{value}</dd>
    </div>
  );
}
