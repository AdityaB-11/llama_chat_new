import React, { useState } from 'react';
import '../styles/chat-input.css';

const ChatInput = ({ onSendMessage, onStopGeneration, disabled, isStreaming }) => {
  const [message, setMessage] = useState('');
  const [thinkingMode, setThinkingMode] = useState(false);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message, thinkingMode);
      setMessage('');
    }
  };
  
  return (
    <div className="chat-input-container">
      <form onSubmit={handleSubmit} className="chat-form">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message here..."
          disabled={disabled || isStreaming}
          className="chat-textarea"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              handleSubmit(e);
            }
          }}
        />
        <div className="chat-controls">
          <label className="thinking-switch">
            <input
              type="checkbox"
              checked={thinkingMode}
              onChange={() => setThinkingMode(!thinkingMode)}
              disabled={disabled || isStreaming}
            />
            <span className="switch-slider"></span>
            <span className="thinking-label">Think</span>
          </label>
          
          {isStreaming ? (
            <button
              type="button"
              onClick={onStopGeneration}
              className="stop-button"
            >
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={disabled || !message.trim()}
              className="send-button"
            >
              Send
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ChatInput; 