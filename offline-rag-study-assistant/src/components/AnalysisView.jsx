import React from 'react';

/**
 * AnalysisView — renders the document analysis from CrewAI.
 *
 * Props:
 *   analysis  {object}  — { executive_summary, key_concepts, key_facts,
 *                            exam_topics, connections, study_recommendations,
 *                            difficulty_areas }
 */
const AnalysisView = ({ analysis }) => {
  if (!analysis) return null;

  return (
    <div className="analysis-container">
      {/* Executive summary */}
      {analysis.executive_summary && (
        <div className="analysis-summary">
          <p>{analysis.executive_summary}</p>
        </div>
      )}

      {/* Key concepts grid */}
      {analysis.key_concepts?.length > 0 && (
        <>
          <div className="section-label">Key Concepts</div>
          <div className="concept-grid">
            {analysis.key_concepts.map((c, i) => (
              <div className="concept-card" key={i}>
                {c.importance && (
                  <span className={`importance-badge ${c.importance}`}>
                    {c.importance}
                  </span>
                )}
                <div className="concept-name">{c.concept}</div>
                <div className="concept-exp">{c.explanation}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Key facts */}
      {analysis.key_facts?.length > 0 && (
        <div className="section-card">
          <div className="section-card-title">📋 Key Facts</div>
          <div className="fact-list">
            {analysis.key_facts.map((f, i) => (
              <div className="fact-item" key={i}>{f}</div>
            ))}
          </div>
        </div>
      )}

      {/* Exam topics */}
      {analysis.exam_topics?.length > 0 && (
        <div className="section-card">
          <div className="section-card-title">🎯 Likely Exam Topics</div>
          <div className="tag-list">
            {analysis.exam_topics.map((t, i) => (
              <span className="tag topic" key={i}>{t}</span>
            ))}
          </div>
        </div>
      )}

      {/* Connections */}
      {analysis.connections?.length > 0 && (
        <div className="section-card">
          <div className="section-card-title">🔗 Concept Connections</div>
          <div className="fact-list">
            {analysis.connections.map((c, i) => (
              <div className="fact-item" key={i}>{c}</div>
            ))}
          </div>
        </div>
      )}

      {/* Study recommendations */}
      {analysis.study_recommendations?.length > 0 && (
        <div className="section-card">
          <div className="section-card-title">📚 Study Recommendations</div>
          <div className="fact-list">
            {analysis.study_recommendations.map((r, i) => (
              <div className="fact-item" key={i}>{r}</div>
            ))}
          </div>
        </div>
      )}

      {/* Difficulty areas */}
      {analysis.difficulty_areas?.length > 0 && (
        <div className="section-card">
          <div className="section-card-title">⚠️ Difficulty Areas</div>
          <div className="tag-list">
            {analysis.difficulty_areas.map((d, i) => (
              <span className="tag" key={i} style={{ borderColor: 'rgba(239,68,68,0.3)', color: 'var(--error)', background: 'rgba(239,68,68,0.08)' }}>
                {d}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisView;
