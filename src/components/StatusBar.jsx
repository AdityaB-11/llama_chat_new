import React from 'react';
import '../styles/status-bar.css';

const StatusBar = ({ serverStatus, selectedModel, loading }) => {
  const getStatusText = () => {
    if (loading) return 'Loading models...';
    if (serverStatus === 'starting') return 'Starting Ollama server...';
    if (serverStatus === 'error') return 'Ollama server error';
    if (!selectedModel) return 'No model selected';
    return `Model: ${selectedModel}`;
  };
  
  const getStatusClass = () => {
    if (loading) return 'loading';
    if (serverStatus === 'starting') return 'starting';
    if (serverStatus === 'error') return 'error';
    if (!selectedModel) return 'warning';
    return 'connected';
  };
  
  return (
    <div className="status-bar">
      <div className={`status-indicator ${getStatusClass()}`}>
        <span className="status-text">{getStatusText()}</span>
      </div>
    </div>
  );
};

export default StatusBar; 