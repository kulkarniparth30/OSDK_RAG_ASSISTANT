import React, { useState, useRef, useEffect } from 'react';
import { askQuestion } from '../lib/rag/ragPipeline';
import { getChatHistory, saveMessage } from '../lib/vectorstore/indexedDbStore';
import MessageBubble from './MessageBubble';

/**
 * ChatWindow — the main chat interface.
 * Correctly wired to the real RAG pipeline (askQuestion → embed → search → generate).
 *
 * Props:
 *   modelReady  {boolean}  — whether WebLLM has finished loading
 *   docsLoaded  {boolean}  — whether at least one document has been processed
 */
const ChatWindow = ({ modelReady, docsLoaded }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef();

  // Load persistent chat history
  useEffect(() => {
    getChatHistory().then((history) => {
      if (history.length > 0) setMessages(history);
    });
  }, []);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const sendMessage = async (e) => {
    e?.preventDefault();
    const q = input.trim();
    if (!q || isLoading || !modelReady) return;

    const userMsg = { id: Date.now(), text: q, isUser: true };
    const botId   = Date.now() + 1;

    await saveMessage(userMsg); // Persist user message

    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: botId, text: '', isUser: false, loading: true },
    ]);
    setInput('');
    setIsLoading(true);

    try {
      let fullResponse = '';
      await askQuestion(
        q,
        (token) => {
          fullResponse += token;
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.id === botId) {
              return [...prev.slice(0, -1), { ...last, text: fullResponse, loading: false }];
            }
            return prev;
          });
          scrollToBottom();
        },
        async () => {
          setIsLoading(false);
          await saveMessage({ id: botId, text: fullResponse, isUser: false }); // Persist bot message
        },
      );
    } catch (err) {
      const errMsg = { id: Date.now(), text: `⚠️ Error: ${err.message}`, isUser: false, loading: false };
      setMessages((prev) => [...prev.slice(0, -1), errMsg]);
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const canSend = modelReady && docsLoaded && !isLoading;

  return (
    <div className="chat-container">
      {/* Warnings */}
      {!modelReady && (
        <div className="model-not-ready-banner">
          ⏳ Loading AI model… please wait before asking questions.
        </div>
      )}
      {modelReady && !docsLoaded && (
        <div className="model-not-ready-banner" style={{ color: 'var(--cyan)', borderColor: 'rgba(6,182,212,0.3)', background: 'rgba(6,182,212,0.08)' }}>
          📄 Upload a document from the left panel to start asking questions.
        </div>
      )}

      {/* Messages */}
      <div className="messages-area">
        {messages.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">💬</div>
            <div className="empty-state-title">Ask anything about your documents</div>
            <div className="empty-state-desc">
              Upload study material on the left, then ask questions here.
              Answers are generated 100% on your device.
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            text={msg.text}
            isUser={msg.isUser}
            loading={msg.loading}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form className="chat-input-form" onSubmit={sendMessage}>
        <textarea
          className="chat-input"
          value={input}
          rows={1}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={canSend ? 'Ask a question about your documents…' : 'Waiting for model & documents…'}
          disabled={!canSend}
        />
        <button
          type="submit"
          className="chat-send-btn"
          disabled={!canSend || !input.trim()}
          id="chat-send-btn"
          aria-label="Send message"
        >
          ➤
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;