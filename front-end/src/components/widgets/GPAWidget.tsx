import type { GPAData } from '../../types';

export function GPAWidget({ data }: { data: GPAData }) {
  const maxGPA = 4.0;
  const barMaxH = 100;

  return (
    <div className="widget-gpa">
      <div className="gpa-headline">
        <span className="gpa-number">{data.currentGPA.toFixed(2)}</span>
        <span className="gpa-scale">/ {maxGPA.toFixed(1)}</span>
      </div>
      <div className="gpa-credits">{data.totalCredits} credits earned</div>

      <div className="gpa-chart">
        <svg
          width="100%"
          height={barMaxH + 30}
          viewBox={`0 0 ${data.semesters.length * 60 + 20} ${barMaxH + 30}`}
          preserveAspectRatio="xMidYMax meet"
        >
          <defs>
            <linearGradient id="gpaBarGrad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#006a6a" />
              <stop offset="100%" stopColor="#93f2f2" />
            </linearGradient>
          </defs>
          {data.semesters.map((sem, i) => {
            const barH = (sem.gpa / maxGPA) * barMaxH;
            const x = 10 + i * 60;
            const y = barMaxH - barH;
            return (
              <g key={sem.term}>
                <rect
                  x={x} y={y}
                  width={36} height={barH}
                  rx={4}
                  fill="url(#gpaBarGrad)"
                  opacity={0.85}
                />
                <text
                  x={x + 18} y={y - 6}
                  textAnchor="middle"
                  fill="#93f2f2"
                  fontSize="11"
                  fontWeight="600"
                  fontFamily="'Inter', sans-serif"
                >
                  {sem.gpa.toFixed(1)}
                </text>
                <text
                  x={x + 18} y={barMaxH + 16}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="'Inter', sans-serif"
                >
                  {sem.term}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
