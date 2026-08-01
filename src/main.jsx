import { PROJECT_CONFIG } from '../project.config.js';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { AffiliateProvider } from './contexts/AffiliateContext.jsx';
import { ContentStudioProvider } from './contexts/ContentStudioContext.jsx';
import { LocalizationProvider } from './contexts/LocalizationContext.jsx';
import { ThemeProvider } from './contexts/ThemeContext.jsx';
import { TemplateProvider } from './contexts/TemplateContext.jsx';
import { TripProvider } from './contexts/TripContext.jsx';
import { diagnosticsService } from './services/diagnostics/DiagnosticsService.js';
import { registerServiceWorker } from './services/pwa/registerServiceWorker.js';
import './styles/tokens.css';
import './styles/global.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/pages.css';
import './styles/print.css';

document.documentElement.dataset.appVersion = PROJECT_CONFIG.version;
diagnosticsService.installGlobalHandlers();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LocalizationProvider>
      <ThemeProvider>
        <TripProvider>
          <AffiliateProvider>
            <TemplateProvider>
              <ContentStudioProvider>
                <App />
              </ContentStudioProvider>
            </TemplateProvider>
          </AffiliateProvider>
        </TripProvider>
      </ThemeProvider>
    </LocalizationProvider>
  </StrictMode>,
);

registerServiceWorker();
