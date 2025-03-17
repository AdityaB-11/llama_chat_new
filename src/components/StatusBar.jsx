import React, { useState, useEffect } from 'react';
import '../styles/status-bar.css';

const StatusBar = ({ serverStatus, selectedModel, loading }) => {
  // State to store the stable model name
  const [stableModelName, setStableModelName] = useState(selectedModel);
  
  // Update stable model name when selectedModel changes and it's not empty
  useEffect(() => {
    if (selectedModel) {
      setStableModelName(selectedModel);
    }
  }, [selectedModel]);
  
  // Get status text based on server status
  const getStatusText = () => {
    switch (serverStatus) {
      case 'online':
        return 'Online';
      case 'starting':
        return 'Starting...';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="status-bar">
      <div className="server-status">
        <span className="status-label">Server:</span>
        <span className={`status-indicator ${serverStatus}`}>
          {getStatusText()}
        </span>
      </div>
      
      <div className="model-status">
        {loading ? (
          <span className="status-label">Loading models...</span>
        ) : stableModelName ? (
          <>
            <span className="status-label">Active Model:</span>
            <span className="model-name" title={stableModelName}>{stableModelName}</span>
          </>
        ) : (
          <span className="status-label">No model selected</span>
        )}
      </div>
      
      <div className="app-info">
        <span>Llama Chat v1.0.0</span>
      </div>
    </div>
  );
};

export default StatusBar; 