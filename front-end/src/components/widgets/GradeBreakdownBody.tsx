import type { GradeBreakdownData } from '../../types';
import './GradeBreakdownBody.css';

export function GradeBreakdownBody({ data }: { data: Record<string, unknown> }) {
  const bd = data.breakdown as GradeBreakdownData | undefined;
  if (!bd) return null;

  return (
    <div className="gbd">
      <div className="gbd__header">
        <div>
          <span className="gbd__code">{bd.courseCode}</span>
          <h3 className="gbd__name">{bd.courseName}</h3>
        </div>
        <div className="gbd__overall">
          <span className="gbd__overall-grade">{bd.currentGrade}</span>
          <span className="gbd__overall-score">{bd.currentScore.toFixed(1)}%</span>
        </div>
      </div>

      <div className="gbd__categories">
        {bd.categories.map((cat) => (
          <div key={cat.name} className="gbd__cat">
            <div className="gbd__cat-header">
              <span className="gbd__cat-name">{cat.name}</span>
              <span className="gbd__cat-meta">
                {cat.score.toFixed(1)}% &middot; {cat.weight}%
              </span>
            </div>
            <div className="gbd__cat-track">
              <div
                className="gbd__cat-fill"
                style={{
                  width: `${cat.score}%`,
                  background: cat.score >= 90 ? 'var(--secondary)'
                    : cat.score >= 70 ? 'var(--inverse-primary)'
                    : 'var(--tertiary)',
                }}
              />
            </div>
            {cat.items.length > 0 && (
              <div className="gbd__items">
                {cat.items.map((item) => (
                  <div key={item.name} className="gbd__item">
                    <span className="gbd__item-name">{item.name}</span>
                    <span className="gbd__item-score">
                      {item.score}/{item.maxScore}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
