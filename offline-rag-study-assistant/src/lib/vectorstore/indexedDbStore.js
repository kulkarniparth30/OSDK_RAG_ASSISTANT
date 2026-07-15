import { openDB } from 'idb';

const DB_NAME = 'rag-store';
const DB_VERSION = 2;
const STORE = 'chunks';
const CHAT_STORE = 'chat_history';

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db, oldVersion) {
    if (!db.objectStoreNames.contains(STORE)) {
      db.createObjectStore(STORE, { keyPath: 'id' });
    }
    if (!db.objectStoreNames.contains(CHAT_STORE)) {
      db.createObjectStore(CHAT_STORE, { keyPath: 'id' });
    }
  },
});

export async function saveMessage(msg) {
  const db = await dbPromise;
  await db.put(CHAT_STORE, msg);
}

export async function getChatHistory() {
  const db = await dbPromise;
  const msgs = await db.getAll(CHAT_STORE);
  return msgs.sort((a, b) => a.id - b.id);
}

/** Persist a chunk along with its embedding vector. */
export async function saveChunk(chunk, vector) {
  const db = await dbPromise;
  await db.put(STORE, { ...chunk, vector });
}

/** Retrieve every stored chunk (used by CrewAI features to get full context). */
export async function getAllChunks() {
  const db = await dbPromise;
  return db.getAll(STORE);
}

export async function getUniqueSources() {
  const db = await dbPromise;
  const all = await db.getAll(STORE);
  const sources = new Set(all.map(c => c.source));
  return Array.from(sources);
}

/** Clear all stored chunks (e.g. when user resets the session). */
export async function clearAllChunks() {
  const db = await dbPromise;
  return db.clear(STORE);
}

export async function clearChatHistory() {
  const db = await dbPromise;
  return db.clear(CHAT_STORE);
}

function cosineSim(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

/** Return the top-k most similar chunks to queryVector. */
export async function searchTopK(queryVector, k = 5) {
  const db = await dbPromise;
  const all = await db.getAll(STORE);
  return all
    .map((c) => ({ ...c, score: cosineSim(queryVector, c.vector) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}