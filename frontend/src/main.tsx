import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// TypeScript-safe root element handling
const rootElement = document.getElementById('root') as HTMLElement;

if (!rootElement) {
  throw new Error('Root element not found. Make sure you have an element with id="root" in your HTML.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
