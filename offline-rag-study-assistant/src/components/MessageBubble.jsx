import React from 'react';

/**
 * A single chat message bubble.
 * Supports: regular text, typing animation, and loading dots.
 */
const MessageBubble = ({ text, isUser, loading }) => {
  return (
    <div className={`message-row ${isUser ? 'user' : 'bot'}`}>
      <div className="msg-avatar">{isUser ? '👤' : '🤖'}</div>
      <div className="msg-bubble">
        {loading ? (
          <div className="typing-dots">
            <span /><span /><span />
          </div>
        ) : (
          <p style={{ whiteSpace: 'pre-wrap' }}>{text}</p>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;