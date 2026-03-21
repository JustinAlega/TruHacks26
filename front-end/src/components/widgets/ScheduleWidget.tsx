import type { ScheduleData, DayOfWeek } from '../../types';

const DAYS: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const START_HOUR = 8;
const END_HOUR = 17;
const HOUR_HEIGHT = 40;
const DAY_WIDTH = 90;
const TIME_COL_WIDTH = 44;

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function ScheduleWidget({ data }: { data: ScheduleData }) {
  const totalHours = END_HOUR - START_HOUR;
  const gridHeight = totalHours * HOUR_HEIGHT;

  return (
    <div className="widget-schedule">
      <div className="schedule-grid" style={{ height: gridHeight + 32 }}>
        <div className="schedule-time-col" style={{ width: TIME_COL_WIDTH }}>
          {Array.from({ length: totalHours }, (_, i) => {
            const hour = START_HOUR + i;
            const label = hour <= 12 ? `${hour} AM` : `${hour - 12} PM`;
            return (
              <div
                key={hour}
                className="schedule-time-label"
                style={{ top: i * HOUR_HEIGHT, height: HOUR_HEIGHT }}
              >
                {label}
              </div>
            );
          })}
        </div>

        <div className="schedule-days">
          <div className="schedule-day-headers">
            {DAYS.map((day) => (
              <div key={day} className="schedule-day-header" style={{ width: DAY_WIDTH }}>
                {day}
              </div>
            ))}
          </div>

          <div className="schedule-day-columns" style={{ height: gridHeight }}>
            {Array.from({ length: totalHours + 1 }, (_, i) => (
              <div
                key={i}
                className="schedule-hour-line"
                style={{ top: i * HOUR_HEIGHT }}
              />
            ))}

            {DAYS.map((day, di) => (
              <div
                key={day}
                className="schedule-day-col"
                style={{ left: di * DAY_WIDTH, width: DAY_WIDTH }}
              >
                {data.courses
                  .filter((c) => c.days.includes(day))
                  .map((course) => {
                    const startMin = timeToMinutes(course.startTime);
                    const endMin = timeToMinutes(course.endTime);
                    const topPx = ((startMin - START_HOUR * 60) / 60) * HOUR_HEIGHT;
                    const heightPx = ((endMin - startMin) / 60) * HOUR_HEIGHT;

                    return (
                      <div
                        key={course.courseId}
                        className="schedule-block"
                        style={{
                          top: topPx,
                          height: heightPx,
                          backgroundColor: course.color + '30',
                          borderLeft: `3px solid ${course.color}`,
                        }}
                      >
                        <span className="schedule-block-id">{course.courseId}</span>
                        <span className="schedule-block-loc">{course.location}</span>
                      </div>
                    );
                  })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
