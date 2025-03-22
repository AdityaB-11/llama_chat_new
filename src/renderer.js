import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App';
import DemoPage from './components/DemoPage';
import './styles/global.css';

console.log('Renderer script running');

// Get the container element
const container = document.getElementById('root');
console.log('Container element:', container);

const Main = () => {
  const [currentPage, setCurrentPage] = useState('app');

  useEffect(() => {
    // Simple URL parameter-based routing
    const params = new URLSearchParams(window.location.search);
    const page = params.get('page');
    
    if (page === 'demo') {
      setCurrentPage('demo');
    }
    
    // Listen for route changes
    window.api.onRouteChange(route => {
      setCurrentPage(route);
    });
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'demo':
        return <DemoPage />;
      default:
        return <App />;
    }
  };

  return renderPage();
};

// Create a root
const root = createRoot(container);
console.log('Root created');

// Render the main component
console.log('Rendering main component...');
root.render(<Main />);
console.log('Main component rendered'); 