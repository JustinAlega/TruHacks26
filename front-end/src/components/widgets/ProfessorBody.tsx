import type { ProfessorInfo } from '../../types';
import './ProfessorBody.css';

export function ProfessorBody({ data }: { data: Record<string, unknown> }) {
  const p = data.professor as ProfessorInfo | undefined;
  if (!p) return null;

  const stars = Math.round(p.avgRating);

  return (
    <div className="prof">
      <div className="prof__header">
        <div className="prof__avatar">
          {p.firstName[0]}{p.lastName[0]}
        </div>
        <div>
          <h3 className="prof__name">{p.firstName} {p.lastName}</h3>
          <p className="prof__dept">{p.department}</p>
        </div>
      </div>

      <div className="prof__ratings">
        <div className="prof__rating-card prof__rating-card--quality">
          <span className="prof__rating-value">{p.avgRating.toFixed(1)}</span>
          <span className="prof__rating-label">Quality</span>
          <div className="prof__stars" aria-label={`${p.avgRating} out of 5 stars`}>
            {[1, 2, 3, 4, 5].map((i) => (
              <span key={i} className={`prof__star ${i <= stars ? 'prof__star--filled' : ''}`}>&#9733;</span>
            ))}
          </div>
        </div>
        <div className="prof__rating-card">
          <span className="prof__rating-value">{p.avgDifficulty.toFixed(1)}</span>
          <span className="prof__rating-label">Difficulty</span>
        </div>
        <div className="prof__rating-card">
          <span className="prof__rating-value">{p.numRatings}</span>
          <span className="prof__rating-label">Ratings</span>
        </div>
      </div>

      <dl className="prof__details">
        <div className="prof__detail-row">
          <dt>School</dt>
          <dd>{p.school}</dd>
        </div>
        {p.email && (
          <div className="prof__detail-row">
            <dt>Email</dt>
            <dd>{p.email}</dd>
          </div>
        )}
      </dl>

      {p.rmpLink && (
        <a
          className="prof__rmp-link"
          href={p.rmpLink}
          target="_blank"
          rel="noopener noreferrer"
        >
          View on RateMyProfessors
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      )}
    </div>
  );
}
