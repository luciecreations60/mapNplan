import { lazy, Suspense } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from './components/feedback/ErrorBoundary.jsx';
import { RouteLoading } from './components/feedback/RouteLoading.jsx';
import { AppLayout } from './layouts/AppLayout.jsx';

function lazyNamed(importer, exportName) {
  return lazy(() => importer().then((module) => ({ default: module[exportName] })));
}

const ContentStudioPage = lazyNamed(() => import('./pages/ContentStudioPage.jsx'), 'ContentStudioPage');
const DashboardPage = lazyNamed(() => import('./pages/DashboardPage.jsx'), 'DashboardPage');
const ExplorePage = lazyNamed(() => import('./pages/ExplorePage.jsx'), 'ExplorePage');
const NotFoundPage = lazyNamed(() => import('./pages/NotFoundPage.jsx'), 'NotFoundPage');
const PrintTripPage = lazyNamed(() => import('./pages/PrintTripPage.jsx'), 'PrintTripPage');
const PublicDestinationPage = lazyNamed(() => import('./pages/PublicDestinationPage.jsx'), 'PublicDestinationPage');
const SharedTripPage = lazyNamed(() => import('./pages/SharedTripPage.jsx'), 'SharedTripPage');
const SettingsPage = lazyNamed(() => import('./pages/SettingsPage.jsx'), 'SettingsPage');
const TemplatesPage = lazyNamed(() => import('./pages/TemplatesPage.jsx'), 'TemplatesPage');
const TripWorkspacePage = lazyNamed(() => import('./pages/TripWorkspacePage.jsx'), 'TripWorkspacePage');
const TripsPage = lazyNamed(() => import('./pages/TripsPage.jsx'), 'TripsPage');

/**
 * Application route registry.
 *
 * HashRouter is intentionally used because it works reliably on GitHub Pages
 * without server-side rewrite rules. Route-level lazy loading keeps the first
 * download small while preserving the current static hosting architecture.
 */
export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <Suspense fallback={<RouteLoading />}>
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
        </Suspense>
      </HashRouter>
    </ErrorBoundary>
  );
}
