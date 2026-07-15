import React from 'react';

const MODELS = [
  {
    id: 'Phi-3.5-mini-instruct-q4f16_1-MLC',
    name: 'Phi-3.5 Mini (Best Quality)',
    size: '~2.2 GB',
  },
  {
    id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC',
    name: 'Llama-3.2 1B (Smaller / Faster)',
    size: '~800 MB',
  },
];

/**
 * ModelSelector — dropdown + status indicator.
 *
 * All model-loading logic lives in App.jsx; this is a pure presentation component.
 *
 * Props:
 *   selectedModel  {string}
 *   status         {'idle'|'loading'|'ready'|'error'}
 *   progressText   {string}   e.g. "Downloading model – 47 %"
 *   onModelChange  {(modelId: string) => void}
 */
const ModelSelector = ({ selectedModel, status, progressText, onModelChange }) => {
  return (
    <div className="model-card">
      <div className="model-status-row">
        <span className={`status-dot ${status}`} />
        <span className="status-text">
          {status === 'idle' && 'Model not loaded'}
          {status === 'loading' && (progressText || 'Initializing…')}
          {status === 'ready' && 'Model ready'}
          {status === 'error' && 'Load failed'}
        </span>
      </div>

      <select
        className="model-select"
        value={selectedModel}
        onChange={(e) => onModelChange(e.target.value)}
        disabled={status === 'loading'}
        id="model-select"
      >
        {MODELS.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name} ({m.size})
          </option>
        ))}
      </select>
    </div>
  );
};

export default ModelSelector;