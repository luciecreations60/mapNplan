import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from './components/feedback/ErrorBoundary.jsx';
import { AppLayout } from './layouts/AppLayout.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { ExplorePage } from './pages/ExplorePage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';
import { PrintTripPage } from './pages/PrintTripPage.jsx';
import { SettingsPage } from './pages/SettingsPage.jsx';
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
          <Route element={<AppLayout />}>
            <Route index element={<Navigate replace to="/dashboard" />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/trips" element={<TripsPage />} />
            <Route path="/trips/:tripId" element={<TripWorkspacePage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  );
}
