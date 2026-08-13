import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './auth/AuthContext.jsx';
import { LocalizationProvider } from './contexts/LocalizationContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LocalizationProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </LocalizationProvider>
  </React.StrictMode>
);
