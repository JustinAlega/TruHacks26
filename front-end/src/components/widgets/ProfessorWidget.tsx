import type { ProfessorData } from '../../types';

function RatingCircle({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = (value / max) * 100;
  const r = 28;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="rating-circle-group">
      <svg width="68" height="68" viewBox="0 0 68 68">
        <circle
          cx="34" cy="34" r={r}
          fill="none"
          stroke="rgba(148, 163, 184, 0.12)"
          strokeWidth="4"
        />
        <circle
          cx="34" cy="34" r={r}
          fill="none"
          stroke="url(#tealGrad)"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 34 34)"
        />
        <defs>
          <linearGradient id="tealGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#006a6a" />
            <stop offset="100%" stopColor="#93f2f2" />
          </linearGradient>
        </defs>
        <text x="34" y="34" textAnchor="middle" dominantBaseline="central"
          fill="#e2e8f0" fontSize="15" fontWeight="600" fontFamily="'Inter', sans-serif">
          {value.toFixed(1)}
        </text>
      </svg>
      <span className="rating-label">{label}</span>
    </div>
  );
}

export function ProfessorWidget({ data }: { data: ProfessorData }) {
  return (
    <div className="widget-professor">
      <div className="prof-identity">
        <div className="prof-avatar">
          {data.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
        </div>
        <div>
          <h3 className="prof-name">{data.name}</h3>
          <span className="prof-department">{data.department}</span>
        </div>
      </div>

      <div className="prof-ratings">
        <RatingCircle value={data.rating} max={5} label="Quality" />
        <RatingCircle value={data.difficulty} max={5} label="Difficulty" />
        <div className="rating-circle-group">
          <div className="take-again-value">{data.wouldTakeAgain}%</div>
          <span className="rating-label">Take Again</span>
        </div>
      </div>

      <div className="prof-tags">
        {data.topTags.map((tag) => (
          <span key={tag} className="prof-tag">{tag}</span>
        ))}
      </div>

      {(data.email || data.office) && (
        <div className="prof-contact">
          {data.email && (
            <div className="contact-row">
              <span className="contact-icon">✉</span>
              <span>{data.email}</span>
            </div>
          )}
          {data.office && (
            <div className="contact-row">
              <span className="contact-icon">◎</span>
              <span>{data.office}</span>
            </div>
          )}
        </div>
      )}

      <div className="prof-rating-count">{data.numRatings} ratings on RateMyProfessors</div>
    </div>
  );
}
