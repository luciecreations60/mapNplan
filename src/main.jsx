import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './auth/AuthContext.jsx';
import { AffiliateProvider } from './contexts/AffiliateContext.jsx';
import { LocalizationProvider } from './contexts/LocalizationContext.jsx';
import { ThemeProvider } from './contexts/ThemeContext.jsx';
import { TripProvider } from './contexts/TripContext.jsx';
import { TemplateProvider } from './contexts/TemplateContext.jsx';
import './styles/tokens.css';
import './styles/global.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/pages.css';
import './styles/brand-mapnplan.css';
import './styles/print.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LocalizationProvider>
      <ThemeProvider>
        <AuthProvider>
          <AffiliateProvider>
            <TripProvider>
              <TemplateProvider>
                <App />
              </TemplateProvider>
            </TripProvider>
          </AffiliateProvider>
        </AuthProvider>
      </ThemeProvider>
    </LocalizationProvider>
  </React.StrictMode>,
);