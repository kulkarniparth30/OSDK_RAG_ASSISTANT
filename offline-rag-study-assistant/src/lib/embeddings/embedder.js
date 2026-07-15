// Acts as a proxy to the embedder Web Worker

let worker;
const pendingRequests = new Map();
let messageIdCounter = 0;

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL('./embedderWorker.js', import.meta.url), {
      type: 'module',
    });

    worker.addEventListener('message', (e) => {
      const { type, payload } = e.data;
      if (type === 'embed_result') {
        const req = pendingRequests.get(payload.id);
        if (req) {
          req.resolve(payload.vectors);
          pendingRequests.delete(payload.id);
        }
      } else if (type === 'error' && payload.id) {
        const req = pendingRequests.get(payload.id);
        if (req) {
          req.reject(new Error(payload.error));
          pendingRequests.delete(payload.id);
        }
      }
    });

    worker.postMessage({ type: 'init' });
  }
  return worker;
}

export function embedBatch(texts) {
  return new Promise((resolve, reject) => {
    const w = getWorker();
    const id = ++messageIdCounter;
    pendingRequests.set(id, { resolve, reject });
    w.postMessage({ type: 'embed', payload: { id, texts } });
  });
}

export async function embedText(text) {
  const vectors = await embedBatch([text]);
  return vectors[0];
}