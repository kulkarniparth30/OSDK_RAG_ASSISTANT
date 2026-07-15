import * as webllm from '@mlc-ai/web-llm';

let engine;

self.onmessage = async (e) => {
  const { type, payload } = e.data;

  if (type === 'init') {
    try {
      engine = await webllm.CreateMLCEngine(payload.modelId, {
        initProgressCallback: (p) =>
          self.postMessage({ type: 'progress', payload: p }),
      });
      self.postMessage({ type: 'ready' });
    } catch (err) {
      self.postMessage({ type: 'error', payload: err.message });
    }
  }

  if (type === 'generate') {
    if (!engine) {
      self.postMessage({ type: 'error', payload: 'Model not initialized yet.' });
      return;
    }
    try {
      const stream = await engine.chat.completions.create({
        messages: payload.messages,
        temperature: 0.2,
        max_tokens: 400,
        stream: true,
      });
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content ?? '';
        if (delta) self.postMessage({ type: 'token', payload: delta });
      }
      self.postMessage({ type: 'done' });
    } catch (err) {
      self.postMessage({ type: 'error', payload: err.message });
    }
  }
};