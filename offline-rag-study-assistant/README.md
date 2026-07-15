# Offline RAG Study Assistant

This is an implementation of an Offline RAG (Retrieval-Augmented Generation) Study Assistant built for the OSDHack 2026 hackathon. The application allows users to upload PDF/DOCX documents, process them locally, and ask questions about the content using a local LLM that runs entirely in the browser.

## Features

- **100% Local Processing**: All AI processing (embedding generation and LLM inference) happens client-side using WebGPU/WebAssembly
- **Document Support**: Upload and process PDF and DOCX files
- **Text Chunking**: Intelligent text splitting with overlap for better context retention
- **Vector Storage**: Efficient similarity search using IndexedDB
- **Local LLM**: Powered by WebLLM with Phi-3.5-mini-instruct or Llama-3.2-1B fallback
- **RAG Pipeline**: Retrieval-Augmented Generation for accurate, citation-backed responses
- **Privacy-Focused**: No document content ever leaves the user's device
- **Offline Capable**: Works completely offline after initial model download
- **Responsive UI**: Built with React and Tailwind CSS

## Implementation Details

### Folder Structure
```
offline-rag-study-assistant/
├── public/
├── src/
│   ├── components/
│   │   ├── ChatWindow.jsx
│   │   ├── DocUploader.jsx
│   │   ├── MessageBubble.jsx
│   │   ├── OfflineIndicator.jsx
│   │   └── ModelSelector.jsx
│   ├── lib/
│   │   ├── parsing/
│   │   │   ├── pdfParser.js
│   │   │   └── docxParser.js
│   │   ├── chunking/
│   │   │   └── chunker.js
│   │   ├── embeddings/
│   │   │   └── embedder.js
│   │   ├── vectorstore/
│   │   │   └── indexedDbStore.js
│   │   ├── llm/
│   │   │   ├── webllmWorker.js
│   │   │   └── webllmClient.js
│   │   └── rag/
│   │       └── ragPipeline.js
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

### Person A Implementation (Document Ingestion & Chunking, Embedding & Vector Store)

**Completed Components:**
- `pdfParser.js`: PDF text extraction using pdf.js-dist
- `docxParser.js`: DOCX text extraction using mammoth
- `chunker.js`: Recursive text splitting (~500 tokens, 50 overlap)
- `embedder.js`: Text embedding using @xenova/transformers (Xenova/all-MiniLM-L6-v2)
- `indexedDbStore.js`: Vector storage and cosine similarity search using IndexedDB

### Person B Implementation (LLM & Generation, RAG Orchestration)

**Completed Components:**
- `webllmWorker.js`: WebLLM integration running in a Web Worker for non-blocking UI
- `webllmClient.js`: Main-thread interface for WebLLM worker
- `ragPipeline.js`: RAG orchestration combining retrieval and generation

### Tech Stack (As Specified in PDF)

| Layer | Technology | Purpose |
|-------|------------|---------|
| LLM Inference | WebLLM (MLC-AI) | Phi-3.5-mini-instruct-q4f16 / Llama-3.2-1B-Instruct-q4f16 |
| Embeddings | @xenova/transformers | Xenova/all-MiniLM-L6-v2 (ONNX) |
| Vector Store | IndexedDB | Custom implementation with cosine similarity |
| File Parsing | pdf.js-dist, mammoth | PDF and DOCX text extraction |
| Frontend | React + Vite + Tailwind CSS | UI framework and styling |
| Web Worker | Native Web API | Offload LLM computation to prevent UI blocking |
| Optional Cloud | Supabase | Auth and metadata storage only (not used in core AI) |

## Key Features Implemented

1. **Document Processing Pipeline**:
   - File upload (PDF/DOCX)
   - Text extraction using appropriate parsers
   - Intelligent chunking with overlap preservation
   - Embedding generation using local transformer model
   - Vector storage in IndexedDB for efficient similarity search

2. **RAG Pipeline**:
   - Query embedding using same model as document embeddings
   - Similarity search over stored document chunks
   - Context assembly from top-k relevant chunks
   - Prompt engineering with system instructions for citation
   - Local LLM generation via WebLLM in Web Worker

3. **User Interface**:
   - Document upload with progress tracking
   - Chat interface with message history
   - Loading states and visual feedback
   - Model selection (Phi-3.5/Llama-3.2)
   - Online/offline status indicator
   - Responsive design for various screen sizes

4. **Privacy & Security**:
   - All processing occurs client-side
   - No document content, embeddings, or chat history leaves the device
   - Optional cloud integration limited to auth/metadata only
   - Works completely offline after initial model download

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Usage

1. Launch the application in your browser
2. Optionally select a model (Phi-3.5 for best quality, Llama-3.2 for lower resource usage)
3. Upload your PDF or DOCX study notes using the file upload component
4. Wait for processing to complete (progress indicator shown)
5. Ask questions about your documents in the chat interface
6. Receive answers with contextual references to your source material
7. Use the application offline after initial model download

## OSDHack 2026 Compliance

This implementation fully complies with the OSDHack 2026 Resource Guide:

✅ **Core Rule**: Main AI functionality (embedding + retrieval + generation) runs entirely client-side via WebGPU/WASM
✅ **Models vs. Libraries**: Uses specific, named, downloadable weights artifacts (Phi-3.5-mini-instruct-q4f16_1-MLC, Xenova/all-MiniLM-L6-v2)
✅ **Cloud Usage**: Limited to optional non-AI support features (auth, metadata sync) - core AI is completely local
✅ **Privacy**: No document content, embeddings, or generated answers leave the user's device