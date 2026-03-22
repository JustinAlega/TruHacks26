import type { JobListingData } from '../../types';

function timeAgo(dateStr: string): string {
  if (!dateStr) return 'Recent';
  const now = new Date();
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Recent';
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function JobListingsWidget({ data }: { data: JobListingData }) {
  return (
    <div className="widget-jobs">
      {data.query && (
        <div className="jobs-query">Results for "{data.query}"</div>
      )}

      <div className="jobs-list">
        {data.listings.map((job) => (
          <div key={job.id} className="job-card">
            <div className="job-header">
              <span className="job-title">{job.title}</span>
              <span className="job-posted">{timeAgo(job.postedDate)}</span>
            </div>
            <div className="job-company">{job.company}</div>
            <div className="job-meta-row">
              <span className="job-location">{job.location}</span>
              {job.salary && (
                <>
                  <span className="meta-separator">·</span>
                  <span className="job-salary">{job.salary}</span>
                </>
              )}
            </div>
            <div className="job-techs">
              {job.technologies.map((t) => (
                <span key={t} className="tech-pill">{t}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
