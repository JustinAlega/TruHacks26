import type { GpaSummary } from '../../types';
import './GpaTrackerBody.css';

export function GpaTrackerBody({ data }: { data: Record<string, unknown> }) {
  const gpa = data.gpa as GpaSummary | undefined;
  if (!gpa) return null;

  const pct = (gpa.cumulative / 4.0) * 100;
  const semPct = (gpa.semester / 4.0) * 100;
  const creditsPct = (gpa.creditsCompleted / (gpa.creditsCompleted + gpa.creditsRemaining)) * 100;

  return (
    <div className="gpa">
      <div className="gpa__gauges">
        <div className="gpa__gauge">
          <svg viewBox="0 0 100 100" className="gpa__ring">
            <circle cx="50" cy="50" r="42" className="gpa__ring-track" />
            <circle
              cx="50" cy="50" r="42"
              className="gpa__ring-fill"
              style={{
                strokeDasharray: `${pct * 2.64} ${264 - pct * 2.64}`,
                stroke: 'var(--secondary)',
              }}
            />
          </svg>
          <div className="gpa__gauge-text">
            <span className="gpa__gauge-value">{gpa.cumulative.toFixed(2)}</span>
            <span className="gpa__gauge-label">Cumulative</span>
          </div>
        </div>
        <div className="gpa__gauge">
          <svg viewBox="0 0 100 100" className="gpa__ring">
            <circle cx="50" cy="50" r="42" className="gpa__ring-track" />
            <circle
              cx="50" cy="50" r="42"
              className="gpa__ring-fill"
              style={{
                strokeDasharray: `${semPct * 2.64} ${264 - semPct * 2.64}`,
                stroke: 'var(--inverse-primary)',
              }}
            />
          </svg>
          <div className="gpa__gauge-text">
            <span className="gpa__gauge-value">{gpa.semester.toFixed(2)}</span>
            <span className="gpa__gauge-label">Semester</span>
          </div>
        </div>
      </div>

      <div className="gpa__credits">
        <div className="gpa__credits-header">
          <span className="gpa__credits-label">Credits Progress</span>
          <span className="gpa__credits-num">{gpa.creditsCompleted} / {gpa.creditsCompleted + gpa.creditsRemaining}</span>
        </div>
        <div className="gpa__credits-track">
          <div className="gpa__credits-fill" style={{ width: `${creditsPct}%` }} />
        </div>
      </div>

      <div className="gpa__courses">
        {gpa.courses.map((c) => (
          <div key={c.name} className="gpa__course-row">
            <span className="gpa__course-name">{c.name}</span>
            <span className="gpa__course-grade">{c.grade}</span>
            <span className="gpa__course-pts">{c.gpa.toFixed(1)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
