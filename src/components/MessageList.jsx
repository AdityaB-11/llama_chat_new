import React, { useEffect, useRef } from 'react';
import MessageContent from './MessageContent';
import '../styles/message-list.css';

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const Message = ({ message }) => {
  const { role, content, timestamp, isStreaming, error } = message;
  
  return (
    <div className={`message ${role} ${isStreaming ? 'streaming' : ''} ${error ? 'error' : ''}`}>
      <div className="message-header">
        <span className="message-role">
          {role === 'user' ? 'You' : role === 'system' ? 'System' : 'AI'}
        </span>
        {timestamp && (
          <span className="message-time">{formatTimestamp(timestamp)}</span>
        )}
      </div>
      <MessageContent content={content} />
    </div>
  );
};

const MessageList = ({ messages }) => {
  const messagesEndRef = useRef(null);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  return (
    <div className="message-list">
      {messages.length === 0 ? (
        <div className="empty-state">
          <p>Start a conversation with the AI assistant</p>
        </div>
      ) : (
        messages.map((message, index) => (
          <Message key={index} message={message} />
        ))
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList; 