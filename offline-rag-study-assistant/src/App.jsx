import React, { useState, useCallback, useEffect } from 'react';
import { initModel } from './lib/llm/webllmClient';
import { getUniqueSources, clearAllChunks, clearChatHistory } from './lib/vectorstore/indexedDbStore';
import DocUploader from './components/DocUploader';
import ChatWindow from './components/ChatWindow';
import ModelSelector from './components/ModelSelector';
import OfflineIndicator from './components/OfflineIndicator';
import CrewAIPanel from './components/CrewAIPanel';
import './App.css';

/**
 * App — root shell for the Offline RAG Study Assistant.
 *
 * Layout: Icon sidebar | Left panel (docs + model) | Main area (chat or crewAI)
 *
 * This rewrite fixes every bug from the audit:
 *   • Uses real initModel() — no setTimeout simulation
 *   • Renders ChatWindow (which calls real askQuestion()) — no fake responses
 *   • Fixes the initProfit typo — variable is initProgress throughout
 */
function App() {
  // ── View state ────────────────────────────────────────────────────────────
  const [view, setView] = useState('chat'); // 'chat' | 'crewai'

  // ── Model state ───────────────────────────────────────────────────────────
  const [modelId, setModelId] = useState(() => localStorage.getItem('study_model_id') || 'Phi-3.5-mini-instruct-q4f16_1-MLC');
  const [modelStatus, setModelStatus] = useState('idle');      // idle | loading | ready | error
  const [progressText, setProgressText] = useState('');

  // ── Document state ────────────────────────────────────────────────────────
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const docsLoaded = uploadedDocs.length > 0;

  // Load existing documents from DB on boot
  useEffect(() => {
    getUniqueSources().then(sources => {
      setUploadedDocs(sources.map(s => ({ name: s, chunks: '?' })));
    });
  }, []);

  const handleClearDocs = async () => {
    if (window.confirm('Are you sure you want to clear all documents and chat history?')) {
      await clearAllChunks();
      await clearChatHistory();
      setUploadedDocs([]);
      // Force reload to clear chat window state easily
      window.location.reload();
    }
  };

  // ── Model initialisation (calls real WebLLM) ─────────────────────────────
  const loadModel = useCallback(async (id) => {
    setModelStatus('loading');
    setProgressText('Starting model download…');
    try {
      await initModel(id, (progress) => {
        if (typeof progress === 'string') {
          setProgressText(progress);
        } else if (progress?.text) {
          setProgressText(progress.text);
        } else if (typeof progress?.progress === 'number') {
          setProgressText(`Loading… ${Math.round(progress.progress * 100)}%`);
        }
      });
      setModelStatus('ready');
      setProgressText('');
    } catch (err) {
      console.error('[App] model init failed:', err);
      setModelStatus('error');
      setProgressText(err.message);
    }
  }, []);

  // Auto-load on boot
  useEffect(() => {
    loadModel(modelId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleModelChange = (newId) => {
    setModelId(newId);
    localStorage.setItem('study_model_id', newId);
    loadModel(newId);
  };

  const handleUploadComplete = (filename, chunkCount) => {
    setUploadedDocs((prev) => [...prev, { name: filename, chunks: chunkCount }]);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="app-shell">
      {/* ── Icon sidebar ─────────────────────────────────────────────────── */}
      <nav className="icon-sidebar" aria-label="Main navigation">
        <div className="sidebar-logo">🧠</div>

        <button
          className={`nav-btn ${view === 'chat' ? 'active' : ''}`}
          onClick={() => setView('chat')}
          id="nav-chat"
          aria-label="Chat view"
        >
          💬
          <span className="nav-tooltip">Chat</span>
        </button>

        <button
          className={`nav-btn ${view === 'crewai' ? 'active' : ''}`}
          onClick={() => setView('crewai')}
          id="nav-crewai"
          aria-label="CrewAI tools"
        >
          🤖
          <span className="nav-tooltip">CrewAI Tools</span>
        </button>

        <div className="sidebar-divider" />

        <button
          className="nav-btn"
          onClick={() => {
            if (modelStatus !== 'loading') loadModel(modelId);
          }}
          id="nav-load-model"
          aria-label="Load AI model"
          disabled={modelStatus === 'loading'}
        >
          ⚡
          <span className="nav-tooltip">
            {modelStatus === 'ready' ? 'Reload Model' : 'Load Model'}
          </span>
        </button>

        <div style={{ flex: 1 }} />

        <OfflineIndicator />
      </nav>

      {/* ── Left panel (documents + model) ───────────────────────────────── */}
      <aside className="left-panel">
        <div className="panel-header">
          <div className="panel-title">Documents</div>
        </div>
        <div className="panel-body">
          <DocUploader
            onUploadComplete={handleUploadComplete}
            uploadedDocs={uploadedDocs}
            onClearDocs={handleClearDocs}
          />

          <div style={{ marginTop: 'auto' }}>
            <div className="section-label" style={{ marginBottom: 8 }}>AI Model</div>
            <ModelSelector
              selectedModel={modelId}
              status={modelStatus}
              progressText={progressText}
              onModelChange={handleModelChange}
            />
          </div>
        </div>
      </aside>

      {/* ── Main area ────────────────────────────────────────────────────── */}
      <main className="main-area">
        <header className="top-bar">
          <h1 className="top-bar-title">StudyMind AI</h1>
          <span className="top-bar-subtitle">
            {view === 'chat' ? 'On-Device RAG Chat' : 'CrewAI Study Tools'}
          </span>
          <div className="top-bar-spacer" />
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Built for OSDHack 2026
          </span>
        </header>

        <div className="view-content">
          {view === 'chat' && (
            <ChatWindow
              modelReady={modelStatus === 'ready'}
              docsLoaded={docsLoaded}
            />
          )}
          {view === 'crewai' && (
            <CrewAIPanel docsLoaded={docsLoaded} />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;