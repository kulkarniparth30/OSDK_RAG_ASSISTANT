import React, { useState, useRef } from 'react';
import { parsePdf } from '../lib/parsing/pdfParser';
import { parseDocx } from '../lib/parsing/docxParser';
import { chunkText } from '../lib/chunking/chunker';
import { embedBatch } from '../lib/embeddings/embedder';
import { saveChunk } from '../lib/vectorstore/indexedDbStore';

/**
 * DocUploader — Drag & drop file upload with real pipeline wiring.
 *
 * Props:
 *   onUploadComplete  {(filename, chunkCount) => void}
 *   uploadedDocs      {Array<{name, chunks}>}
 */
const DocUploader = ({ onUploadComplete, uploadedDocs = [], onClearDocs }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const fileRef = useRef();

  const processFile = async (file) => {
    if (!file) return;
    setError(null);
    setIsUploading(true);
    setProgress(0);

    try {
      // 1 — Parse
      setProgress(10);
      let pages;
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        pages = await parsePdf(file);
      } else if (
        file.type ===
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.name.endsWith('.docx')
      ) {
        pages = await parseDocx(file);
      } else {
        throw new Error('Unsupported file type. Please upload PDF or DOCX.');
      }

      // 2 — Chunk
      setProgress(25);
      const chunks = chunkText(pages, file.name);

      // 3 — Embed & store each chunk in parallel batches

      const BATCH_SIZE = 50;
      for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        setProgress(25 + Math.round((i / chunks.length) * 70));
        
        const batch = chunks.slice(i, i + BATCH_SIZE);
        const texts = batch.map(c => c.text);
        
        // embedBatch takes an array of strings and returns an array of vectors
        const vectors = await embedBatch(texts);
        
        // Save them to IndexedDB concurrently
        await Promise.all(batch.map((chunk, idx) => saveChunk(chunk, vectors[idx])));
      }

      setProgress(100);
      onUploadComplete?.(file.name, chunks.length);
    } catch (err) {
      console.error('[DocUploader]', err);
      setError(err.message);
    } finally {
      setIsUploading(false);
      // Reset the input so the same file can be re-uploaded
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Upload zone */}
      {!isUploading ? (
        <div
          className="doc-upload-zone"
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
        >
          <div className="doc-upload-icon">📂</div>
          <div className="doc-upload-text">
            Drop your study notes here
          </div>
          <div className="doc-upload-hint">PDF or DOCX • click or drag</div>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.docx"
            className="file-input"
            onChange={(e) => processFile(e.target.files[0])}
          />
        </div>
      ) : (
        <div className="upload-progress">
          <div className="progress-bar-wrap">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="progress-label">
            {progress < 25
              ? 'Parsing document…'
              : progress < 95
              ? `Embedding chunks… ${progress}%`
              : 'Finishing up…'}
          </span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="error-box">
          ⚠️ {error}
          <button
            className="btn-sm btn-ghost"
            style={{ marginLeft: 10 }}
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Uploaded docs list */}
      {uploadedDocs.length > 0 && (
        <>
          <div className="section-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Processed Documents</span>
            <button 
              className="btn-sm btn-ghost" 
              onClick={onClearDocs}
              style={{ color: 'var(--red)', borderColor: 'rgba(239,68,68,0.3)' }}
            >
              Clear Data
            </button>
          </div>
          <div className="docs-list">
            {uploadedDocs.map((d, i) => (
              <div className="doc-item" key={i}>
                <span className="doc-icon">
                  {d.name.endsWith('.pdf') ? '📕' : '📘'}
                </span>
                <div>
                  <div className="doc-name">{d.name}</div>
                  <div className="doc-meta">{d.chunks} chunks embedded</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default DocUploader;