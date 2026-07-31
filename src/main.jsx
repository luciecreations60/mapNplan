import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { LocalizationProvider } from './contexts/LocalizationContext.jsx';
import { ThemeProvider } from './contexts/ThemeContext.jsx';
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
          <App />
        </TripProvider>
      </ThemeProvider>
    </LocalizationProvider>
  </StrictMode>,
);

registerServiceWorker();
