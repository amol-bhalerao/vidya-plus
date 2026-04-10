import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from '@/App';
import '@/index.css';
import { Toaster } from '@/components/ui/toaster';
import { HelmetProvider } from 'react-helmet-async';
import { UserProvider } from '@/contexts/UserContext';

// Using PHP MySQL backend with UserContext
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <HelmetProvider>
          <UserProvider>
            <App />
            <Toaster />
          </UserProvider>
      </HelmetProvider>
    </Router>
  </React.StrictMode>
);