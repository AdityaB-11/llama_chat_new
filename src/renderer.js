import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App';
import './styles/global.css';

console.log('Renderer script running');

// Get the container element
const container = document.getElementById('root');
console.log('Container element:', container);

// Create a root
const root = createRoot(container);
console.log('Root created');

// Render the app
console.log('Rendering app...');
root.render(<App />);
console.log('App rendered'); 