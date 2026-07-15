import React, { useState } from 'react';

/**
 * StudyPlanView — renders the day-by-day study plan from CrewAI.
 *
 * Props:
 *   plan  {object}  — { overview, total_days, hours_per_day, days: [...], tips: [...] }
 */
const StudyPlanView = ({ plan }) => {
  const [openDay, setOpenDay] = useState(0); // index of expanded day, -1 = none

  if (!plan) return null;

  const toggle = (i) => setOpenDay(openDay === i ? -1 : i);

  return (
    <div className="plan-container">
      {/* Overview */}
      {plan.overview && (
        <div className="plan-overview">
          <p>{plan.overview}</p>
          <div className="plan-stats">
            <div className="plan-stat">
              <div className="plan-stat-num">{plan.total_days || plan.days?.length || '–'}</div>
              <div className="plan-stat-label">Days</div>
            </div>
            <div className="plan-stat">
              <div className="plan-stat-num">{plan.hours_per_day || '–'}</div>
              <div className="plan-stat-label">Hrs / Day</div>
            </div>
            <div className="plan-stat">
              <div className="plan-stat-num">
                {(plan.total_days || plan.days?.length || 0) * (plan.hours_per_day || 0)}
              </div>
              <div className="plan-stat-label">Total Hrs</div>
            </div>
          </div>
        </div>
      )}

      {/* Day cards */}
      <div className="day-cards">
        {(plan.days || []).map((day, i) => {
          const isOpen = openDay === i;
          return (
            <div className="day-card" key={i}>
              <div className="day-card-header" onClick={() => toggle(i)}>
                <div className="day-number">{day.day ?? i + 1}</div>
                <div className="day-title">{day.title || `Day ${day.day ?? i + 1}`}</div>
                <span className={`day-toggle ${isOpen ? 'open' : ''}`}>▼</span>
              </div>

              {isOpen && (
                <div className="day-card-body">
                  {/* Topics */}
                  {day.topics?.length > 0 && (
                    <div>
                      <div className="day-section-title">Topics</div>
                      <div className="tag-list">
                        {day.topics.map((t, j) => (
                          <span className="tag topic" key={j}>{t}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Goals */}
                  {day.goals?.length > 0 && (
                    <div>
                      <div className="day-section-title">Goals</div>
                      <div className="tag-list">
                        {day.goals.map((g, j) => (
                          <span className="tag goal" key={j}>{g}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Activities */}
                  {day.activities?.length > 0 && (
                    <div>
                      <div className="day-section-title">Activities</div>
                      <div className="tag-list">
                        {day.activities.map((a, j) => (
                          <span className="tag activity" key={j}>{a}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Review note */}
                  {day.review && (
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      📝 {day.review}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Tips */}
      {plan.tips?.length > 0 && (
        <div className="section-card">
          <div className="section-card-title">💡 Study Tips</div>
          {plan.tips.map((tip, i) => (
            <div className="fact-item" key={i}>{tip}</div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudyPlanView;
