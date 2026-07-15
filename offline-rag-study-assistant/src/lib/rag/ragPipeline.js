import { embedText } from '../embeddings/embedder';
import { searchTopK } from '../vectorstore/indexedDbStore';
import { generate } from '../llm/webllmClient';

const SYSTEM_PROMPT = `You are an elite, highly intelligent study assistant and AI tutor. Your goal is to provide rich, comprehensive, and well-structured answers using ONLY the provided context.

Follow these formatting rules strictly:
1. STRUCTURE: Use Markdown formatting extensively. Use bold headers (##) to divide different concepts.
2. CLARITY: Break down complex topics into easily digestible bullet points or numbered lists.
3. EMPHASIS: Use **bold text** to highlight key terms or important concepts.
4. DEPTH: Provide detailed, thorough explanations. Do not be overly brief. Synthesize the context into a complete, well-rounded response.
5. TONE: Be encouraging, pedagogical, and highly articulate.
6. CITATIONS: Naturally weave citations into your text (e.g., "According to [Document, page X]...").

CRITICAL: DO NOT copy and paste the raw context block. Synthesize and explain in your own words. If the answer is not in the context, say "I cannot find the answer to this in the provided documents."`;

export async function askQuestion(question, onToken, onDone) {
  const qVector = await embedText(question);
  const topChunks = await searchTopK(qVector, 8);

  const context = topChunks
    .map(c => `[Source: ${c.source}, page ${c.page}]\n${c.text}`)
    .join('\n\n');

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: `Context:\n${context}\n\nQuestion: ${question}` },
  ];

  generate(messages, onToken, onDone);
  return topChunks; // for showing citations in UI
}