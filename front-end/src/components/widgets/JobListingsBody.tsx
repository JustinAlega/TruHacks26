import type { JobListing } from '../../types';
import './JobListingsBody.css';

export function JobListingsBody({ data }: { data: Record<string, unknown> }) {
  const list = (data.listings ?? []) as JobListing[];

  return (
    <div className="jlist">
      {list.map((j) => (
        <article key={j.id} className="jcard">
          <div className="jcard__row">
            <h4 className="jcard__title">{j.title}</h4>
            <span className={`jtag jtag--${j.type}`}>{fmtType(j.type)}</span>
          </div>
          <p className="jcard__co">{j.company} &middot; {j.location}</p>
          <div className="jcard__skills">
            {j.skills.map((s) => <span key={s} className="jpill">{s}</span>)}
          </div>
        </article>
      ))}
    </div>
  );
}

function fmtType(t: string) {
  return t.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join('-');
}
