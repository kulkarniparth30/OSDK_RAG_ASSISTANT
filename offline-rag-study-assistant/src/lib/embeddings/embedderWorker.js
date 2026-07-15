import { pipeline } from '@xenova/transformers';

let embedderPromise;

self.onmessage = async (e) => {
  const { type, payload } = e.data;

  if (type === 'init') {
    if (!embedderPromise) {
      embedderPromise = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
        progress_callback: (progress) => {
          self.postMessage({ type: 'progress', payload: progress });
        }
      });
    }
    try {
      await embedderPromise;
      self.postMessage({ type: 'ready' });
    } catch (err) {
      self.postMessage({ type: 'error', payload: err.message });
    }
  }

  if (type === 'embed') {
    try {
      const embedder = await embedderPromise;
      const output = await embedder(payload.texts, { pooling: 'mean', normalize: true });
      self.postMessage({ 
        type: 'embed_result', 
        payload: { 
          id: payload.id, 
          vectors: output.tolist() 
        } 
      });
    } catch (err) {
      self.postMessage({ 
        type: 'error', 
        payload: { id: payload.id, error: err.message } 
      });
    }
  }
};
