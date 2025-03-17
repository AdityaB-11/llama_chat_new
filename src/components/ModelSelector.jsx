import React from 'react';
import '../styles/model-selector.css';

const ModelSelector = ({ models, selectedModel, onModelChange, disabled, loading }) => {
  return (
    <div className="model-selector">
      <label htmlFor="model-select">Model:</label>
      <select 
        id="model-select"
        value={selectedModel}
        onChange={(e) => onModelChange(e.target.value)}
        disabled={disabled || loading || models.length === 0}
        className={loading ? 'loading' : ''}
      >
        {loading ? (
          <option value="">Loading models...</option>
        ) : models.length === 0 ? (
          <option value="">No models found</option>
        ) : (
          models.map(model => (
            <option key={model.id} value={model.name}>
              {model.name}
            </option>
          ))
        )}
      </select>
      {loading && <span className="loading-indicator"></span>}
    </div>
  );
};

export default ModelSelector; 