import React, { useState } from 'react';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';
import '../styles/code-block.css';

const CodeBlock = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const detectLanguage = () => {
    if (language) {
      return language;
    }
    try {
      const result = hljs.highlightAuto(code);
      return result.language;
    } catch (error) {
      return 'plaintext';
    }
  };

  const highlightCode = () => {
    const detectedLanguage = detectLanguage();
    try {
      const highlighted = hljs.highlight(code, { 
        language: detectedLanguage 
      }).value;
      return highlighted;
    } catch (error) {
      return code;
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="code-block">
      <div className="code-header">
        <span className="language-tag">{detectLanguage()}</span>
        <button 
          className="copy-button"
          onClick={copyToClipboard}
        >
          {copied ? 'Copied!' : 'Copy code'}
        </button>
      </div>
      <pre>
        <code 
          dangerouslySetInnerHTML={{ __html: highlightCode() }} 
        />
      </pre>
    </div>
  );
};

export default CodeBlock; 