import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './auth/AuthContext.jsx';
import { LocalizationProvider } from './contexts/LocalizationContext.jsx';
import { ThemeProvider } from './contexts/ThemeContext.jsx';
import { TripProvider } from './contexts/TripContext.jsx';
import './styles/main.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LocalizationProvider>
      <ThemeProvider>
        <AuthProvider>
          <TripProvider>
            <App />
          </TripProvider>
        </AuthProvider>
      </ThemeProvider>
    </LocalizationProvider>
  </React.StrictMode>,
);
