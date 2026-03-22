import type { AcademicOverviewData } from '../../types';

export function AcademicOverviewWidget({ data }: { data: AcademicOverviewData }) {
  const maxGPA = 4.0;
  const barMaxH = 80;
  const totalMissing = data.courses.reduce((sum, c) => sum + c.missingCount, 0);

  return (
    <div className="widget-academic">
      <div className="academic-top">
        <div className="academic-gpa-col">
          <div className="academic-gpa-headline">
            <span className="academic-gpa-number">{data.currentGPA.toFixed(2)}</span>
            <span className="academic-gpa-scale">/ {maxGPA.toFixed(1)}</span>
          </div>
          <div className="academic-gpa-label">Cumulative GPA</div>
          <div className="academic-stats-row">
            <div className="academic-stat">
              <span className="academic-stat-value">{data.totalCredits}</span>
              <span className="academic-stat-label">Credits</span>
            </div>
            <div className="academic-stat">
              <span className="academic-stat-value">{data.courses.length}</span>
              <span className="academic-stat-label">Courses</span>
            </div>
            {totalMissing > 0 && (
              <div className="academic-stat alert">
                <span className="academic-stat-value">{totalMissing}</span>
                <span className="academic-stat-label">Missing</span>
              </div>
            )}
          </div>
        </div>

        <div className="academic-chart-col">
          <svg
            width="100%"
            height={barMaxH + 24}
            viewBox={`0 0 ${data.semesters.length * 48 + 8} ${barMaxH + 24}`}
            preserveAspectRatio="xMidYMax meet"
          >
            <defs>
              <linearGradient id="acadBarGrad" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#006a6a" />
                <stop offset="100%" stopColor="#93f2f2" />
              </linearGradient>
            </defs>
            {data.semesters.map((sem, i) => {
              const barH = (sem.gpa / maxGPA) * barMaxH;
              const x = 4 + i * 48;
              const y = barMaxH - barH;
              return (
                <g key={sem.term}>
                  <rect
                    x={x} y={y}
                    width={30} height={barH}
                    rx={3}
                    fill="url(#acadBarGrad)"
                    opacity={0.85}
                  />
                  <text
                    x={x + 15} y={y - 4}
                    textAnchor="middle"
                    fill="#93f2f2"
                    fontSize="9"
                    fontWeight="600"
                    fontFamily="'Inter', sans-serif"
                  >
                    {sem.gpa.toFixed(1)}
                  </text>
                  <text
                    x={x + 15} y={barMaxH + 14}
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize="8"
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

      <div className="academic-divider" />

      <div className="academic-courses-header">Current Courses</div>
      <div className="academic-course-list">
        {data.courses.map((course) => (
          <div key={course.courseId} className="academic-course-row">
            <div className="academic-course-info">
              <span className="academic-course-id">{course.courseId}</span>
              <span className="academic-course-name">{course.name}</span>
            </div>
            <div className="academic-course-right">
              {course.missingCount > 0 && (
                <span className="academic-missing-badge">
                  {course.missingCount} missing
                </span>
              )}
              <span className={`academic-grade ${course.grade ? '' : 'no-grade'}`}>
                {course.grade ?? '—'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
