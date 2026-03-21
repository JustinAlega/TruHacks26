import type { CourseData } from '../../types';

export function CourseDetailsWidget({ data }: { data: CourseData }) {
  return (
    <div className="widget-course-details">
      <div className="course-header-row">
        <span className="course-id-badge">{data.courseId}</span>
        <span className="course-term">{data.term}</span>
        {data.currentGrade && (
          <span className="course-grade-badge">{data.currentGrade}</span>
        )}
      </div>

      <h3 className="course-title">{data.name}</h3>

      <div className="course-meta-row">
        <span>{data.credits} credits</span>
        <span className="meta-separator">·</span>
        <span>{data.instructor}</span>
      </div>

      {data.schedule && (
        <div className="course-schedule">{data.schedule}</div>
      )}

      <p className="course-description">{data.description}</p>
    </div>
  );
}
