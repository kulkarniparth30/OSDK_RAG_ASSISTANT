import React, { useState, useEffect } from 'react';
import { getAllChunks } from '../lib/vectorstore/indexedDbStore';
import QuizView from './QuizView';
import StudyPlanView from './StudyPlanView';
import AnalysisView from './AnalysisView';

const TABS = [
  { key: 'quiz',     icon: '🧠', label: 'Quiz' },
  { key: 'plan',     icon: '📅', label: 'Study Plan' },
  { key: 'analysis', icon: '🔬', label: 'Analysis' },
];

/**
 * CrewAIPanel — tab-switched interface for CrewAI-powered study tools.
 *
 * Props:
 *   docsLoaded  {boolean}  — whether any docs have been embedded
 */
const CrewAIPanel = ({ docsLoaded }) => {
  const [tab, setTab]             = useState('quiz');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [backendUp, setBackendUp] = useState(null); // null = unknown

  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState(null);
  const [quizCount, setQuizCount]         = useState(5);
  const [quizDifficulty, setQuizDifficulty] = useState('medium');

  // Plan state
  const [plan, setPlan]           = useState(null);
  const [planDays, setPlanDays]   = useState(7);
  const [planHours, setPlanHours] = useState(2);

  // Analysis state
  const [analysis, setAnalysis]   = useState(null);

  // Health check
  useEffect(() => {
    fetch('/health')
      .then((r) => r.ok ? setBackendUp(true) : setBackendUp(false))
      .catch(() => setBackendUp(false));
  }, []);

  const getContext = async () => {
    const chunks = await getAllChunks();
    if (!chunks.length) throw new Error('No documents uploaded yet.');
    return chunks.map((c) => c.text).join('\n\n').slice(0, 6000);
  };

  // ── Generate quiz ────────────────────────────────────────────────────────
  const generateQuiz = async () => {
    setLoading(true);
    setError(null);
    setQuizQuestions(null);
    try {
      const context = await getContext();
      const res = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context,
          num_questions: quizCount,
          difficulty: quizDifficulty,
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.detail || `Server error ${res.status}`);
      }
      const data = await res.json();
      setQuizQuestions(data.questions);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Generate study plan ──────────────────────────────────────────────────
  const generatePlan = async () => {
    setLoading(true);
    setError(null);
    setPlan(null);
    try {
      const context = await getContext();
      const res = await fetch('/api/study-plan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context,
          days_available: planDays,
          study_hours_per_day: planHours,
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.detail || `Server error ${res.status}`);
      }
      const data = await res.json();
      setPlan(data.plan);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Generate analysis ────────────────────────────────────────────────────
  const generateAnalysis = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const context = await getContext();
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.detail || `Server error ${res.status}`);
      }
      const data = await res.json();
      setAnalysis(data.analysis);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="crew-panel">
      {/* Backend status */}
      {backendUp === false && (
        <div className="backend-offline-warning">
          🔴 CrewAI backend not running. Start it with:&nbsp;
          <code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 4 }}>
            cd backend &amp;&amp; python main.py
          </code>
        </div>
      )}

      {!docsLoaded && (
        <div className="no-docs-warning">
          📄 Upload a document first — CrewAI needs your study material to work with.
        </div>
      )}

      {/* Tabs */}
      <div className="crew-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`crew-tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => { setTab(t.key); setError(null); }}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <span className="crew-badge">🤖 CrewAI</span>
      </div>

      {/* Content */}
      <div className="crew-content">
        {/* ── Quiz tab ──────────────────────────────────────────────────── */}
        {tab === 'quiz' && (
          <>
            <div className="controls-card">
              <h3>🧠 Generate Quiz</h3>
              <p>
                CrewAI deploys a <strong>Content Analyst</strong> and a{' '}
                <strong>Quiz Master</strong> to create multiple-choice questions from your
                documents.
              </p>
              <div className="controls-row">
                <div className="field-group">
                  <label className="field-label">Questions</label>
                  <select className="field-select" value={quizCount} onChange={(e) => setQuizCount(Number(e.target.value))}>
                    {[3, 5, 8, 10].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div className="field-group">
                  <label className="field-label">Difficulty</label>
                  <select className="field-select" value={quizDifficulty} onChange={(e) => setQuizDifficulty(e.target.value)}>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <button
                  className="btn-generate"
                  disabled={loading || !docsLoaded || backendUp === false}
                  onClick={generateQuiz}
                >
                  {loading && tab === 'quiz' ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Generating…</> : '⚡ Generate Quiz'}
                </button>
              </div>
            </div>
            {quizQuestions && <QuizView questions={quizQuestions} />}
          </>
        )}

        {/* ── Study plan tab ────────────────────────────────────────────── */}
        {tab === 'plan' && (
          <>
            <div className="controls-card">
              <h3>📅 Generate Study Plan</h3>
              <p>
                A <strong>Curriculum Designer</strong> and <strong>Study Coach</strong> build
                a personalised day-by-day plan from your material.
              </p>
              <div className="controls-row">
                <div className="field-group">
                  <label className="field-label">Days</label>
                  <select className="field-select" value={planDays} onChange={(e) => setPlanDays(Number(e.target.value))}>
                    {[3, 5, 7, 10, 14].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div className="field-group">
                  <label className="field-label">Hrs / Day</label>
                  <select className="field-select" value={planHours} onChange={(e) => setPlanHours(Number(e.target.value))}>
                    {[1, 2, 3, 4, 6].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <button
                  className="btn-generate"
                  disabled={loading || !docsLoaded || backendUp === false}
                  onClick={generatePlan}
                >
                  {loading && tab === 'plan' ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Generating…</> : '⚡ Generate Plan'}
                </button>
              </div>
            </div>
            {plan && <StudyPlanView plan={plan} />}
          </>
        )}

        {/* ── Analysis tab ──────────────────────────────────────────────── */}
        {tab === 'analysis' && (
          <>
            <div className="controls-card">
              <h3>🔬 Document Analysis</h3>
              <p>
                An <strong>Educational Researcher</strong> and <strong>Academic Summarizer</strong> produce
                a deep breakdown of your material: key concepts, exam topics, and study advice.
              </p>
              <div className="controls-row">
                <button
                  className="btn-generate"
                  disabled={loading || !docsLoaded || backendUp === false}
                  onClick={generateAnalysis}
                >
                  {loading && tab === 'analysis' ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Analyzing…</> : '⚡ Analyze Documents'}
                </button>
              </div>
            </div>
            {analysis && <AnalysisView analysis={analysis} />}
          </>
        )}

        {/* ── Shared states ─────────────────────────────────────────────── */}
        {loading && (
          <div className="loading-state">
            <div className="spinner" />
            <span>CrewAI agents are collaborating…</span>
            <span className="text-xs text-muted">This may take 15-60 seconds</span>
          </div>
        )}

        {error && <div className="error-box">⚠️ {error}</div>}
      </div>
    </div>
  );
};

export default CrewAIPanel;
