import type { QuickStatsData } from '../../types';
import './QuickStatsBody.css';

export function QuickStatsBody({ data }: { data: Record<string, unknown> }) {
  const stats = data.stats as QuickStatsData | undefined;
  if (!stats) return null;

  return (
    <div className="qstats">
      <div className="qstats__grid">
        <div className="qstats__tile qstats__tile--gpa">
          <span className="qstats__value">{stats.gpa.toFixed(2)}</span>
          <span className="qstats__label">GPA</span>
        </div>
        <div className="qstats__tile">
          <span className="qstats__value">{stats.creditsCompleted}</span>
          <span className="qstats__label">Credits Done</span>
        </div>
        <div className="qstats__tile">
          <span className="qstats__value">{stats.creditsRemaining}</span>
          <span className="qstats__label">Credits Left</span>
        </div>
        <div className="qstats__tile">
          <span className="qstats__value">{stats.coursesThisSemester}</span>
          <span className="qstats__label">Courses</span>
        </div>
      </div>
      <div className="qstats__semester">{stats.currentSemester}</div>
    </div>
  );
}
