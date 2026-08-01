import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from './components/feedback/ErrorBoundary.jsx';
import { AppLayout } from './layouts/AppLayout.jsx';
import { ContentStudioPage } from './pages/ContentStudioPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { ExplorePage } from './pages/ExplorePage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';
import { PrintTripPage } from './pages/PrintTripPage.jsx';
import { PublicDestinationPage } from './pages/PublicDestinationPage.jsx';
import { SharedTripPage } from './pages/SharedTripPage.jsx';
import { SettingsPage } from './pages/SettingsPage.jsx';
import { TemplatesPage } from './pages/TemplatesPage.jsx';
import { TripWorkspacePage } from './pages/TripWorkspacePage.jsx';
import { TripsPage } from './pages/TripsPage.jsx';

/**
 * Application route registry.
 *
 * HashRouter is intentionally used because it works reliably on GitHub Pages
 * without server-side rewrite rules.
 */
export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <Routes>
          <Route path="/trips/:tripId/print" element={<PrintTripPage />} />
          <Route path="/shared" element={<SharedTripPage />} />
          <Route path="/guides/:slug" element={<PublicDestinationPage />} />
          <Route element={<AppLayout />}>
            <Route index element={<Navigate replace to="/dashboard" />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/trips" element={<TripsPage />} />
            <Route path="/trips/:tripId" element={<TripWorkspacePage />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/content" element={<ContentStudioPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  );
}
