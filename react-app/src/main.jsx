// 📁 src/main.jsx
// 🚀 React app entry point

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import Modal from 'react-modal';
import App from './App';
import { queryClient } from './queryClient';
import './styles.css';

// Set Modal app element for accessibility
Modal.setAppElement('#root');

// Allow disabling StrictMode in dev to investigate double image requests (e.g., React 18 intentional double-mount)
// Set VITE_DISABLE_STRICT_MODE=true in .env to render without StrictMode.
const disableStrict = import.meta.env.VITE_DISABLE_STRICT_MODE === 'true';

const AppTree = (
  <BrowserRouter
    future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    }}
  >
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </BrowserRouter>
);

ReactDOM.createRoot(document.getElementById('root')).render(
  disableStrict ? AppTree : <React.StrictMode>{AppTree}</React.StrictMode>
);

// Register service worker for PWA/offline support 
// Temporarily enabled in dev mode for offline testing
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('✅ SW registered:', registration);
      })
      .catch((err) => {
        console.error('❌ SW registration failed:', err);
      });
  });
}
