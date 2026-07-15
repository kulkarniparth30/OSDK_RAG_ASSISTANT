/**
 * webllmClient.js — main-thread interface to the WebLLM Web Worker.
 *
 * Bug fix: the original code used worker.onmessage = … in both initModel and
 * generate(), causing the second assignment to silently overwrite the first.
 * We now use addEventListener with per-call handlers that remove themselves
 * when their job is done, preventing any race conditions.
 */

const worker = new Worker(new URL('./webllmWorker.js', import.meta.url), {
  type: 'module',
});

/** Shared dispatcher — routes every worker message to all registered handlers */
const handlers = new Set();
worker.addEventListener('message', (e) => {
  handlers.forEach((fn) => fn(e.data));
});

/**
 * Load (or reload) a model inside the Web Worker.
 * @param {string} modelId   — WebLLM model ID
 * @param {(p: object) => void} onProgress — called with progress objects
 * @returns {Promise<void>}  — resolves when the model is ready
 */
export function initModel(modelId, onProgress) {
  return new Promise((resolve, reject) => {
    function handler(data) {
      if (data.type === 'progress') onProgress?.(data.payload);
      if (data.type === 'ready') {
        handlers.delete(handler);
        resolve();
      }
      if (data.type === 'error') {
        handlers.delete(handler);
        reject(new Error(data.payload));
      }
    }
    handlers.add(handler);
    worker.postMessage({ type: 'init', payload: { modelId } });
  });
}

/**
 * Stream a chat completion through the already-loaded model.
 * @param {Array<{role: string, content: string}>} messages
 * @param {(token: string) => void} onToken
 * @param {() => void} onDone
 */
export function generate(messages, onToken, onDone) {
  function handler(data) {
    if (data.type === 'token') onToken(data.payload);
    if (data.type === 'done') {
      handlers.delete(handler);
      onDone();
    }
    if (data.type === 'error') {
      handlers.delete(handler);
      onDone(); // surface error via the stream finishing
      console.error('[WebLLM] generation error:', data.payload);
    }
  }
  handlers.add(handler);
  worker.postMessage({ type: 'generate', payload: { messages } });
}