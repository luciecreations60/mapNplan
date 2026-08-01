import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { AffiliateProvider } from './contexts/AffiliateContext.jsx';
import { LocalizationProvider } from './contexts/LocalizationContext.jsx';
import { ThemeProvider } from './contexts/ThemeContext.jsx';
import { TemplateProvider } from './contexts/TemplateContext.jsx';
import { TripProvider } from './contexts/TripContext.jsx';
import { registerServiceWorker } from './services/pwa/registerServiceWorker.js';
import './styles/tokens.css';
import './styles/global.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/pages.css';
import './styles/print.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LocalizationProvider>
      <ThemeProvider>
        <TripProvider>
          <AffiliateProvider>
            <TemplateProvider>
              <App />
            </TemplateProvider>
          </AffiliateProvider>
        </TripProvider>
      </ThemeProvider>
    </LocalizationProvider>
  </StrictMode>,
);

registerServiceWorker();
