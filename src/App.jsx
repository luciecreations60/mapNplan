import { lazy, Suspense } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from './components/feedback/ErrorBoundary.jsx';
import { RouteLoading } from './components/feedback/RouteLoading.jsx';
import { AppLayout } from './layouts/AppLayout.jsx';
import { RequireAuth } from './auth/RequireAuth.jsx';

function lazyNamed(importer, exportName) {
  return lazy(() => importer().then((module) => ({ default: module[exportName] })));
}

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
const LoginPage = lazyNamed(() => import('./pages/LoginPage.jsx'), 'LoginPage');
const PrivacyPolicyPage = lazyNamed(() => import('./pages/PrivacyPolicyPage.jsx'), 'PrivacyPolicyPage');

export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <Suspense fallback={<RouteLoading />}>
          <Routes>
            <Route path="/trips/:tripId/print" element={<PrintTripPage />} />
            <Route path="/shared" element={<SharedTripPage />} />
            <Route path="/guides/:slug" element={<PublicDestinationPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/confidentialite" element={<PrivacyPolicyPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route
              element={(
                <RequireAuth>
                  <AppLayout />
                </RequireAuth>
              )}
            >
              <Route index element={<Navigate replace to="/dashboard" />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/trips" element={<TripsPage />} />
              <Route path="/trips/:tripId" element={<TripWorkspacePage />} />
              <Route path="/templates" element={<TemplatesPage />} />
              <Route path="/explore" element={<ExplorePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </Suspense>
      </HashRouter>
    </ErrorBoundary>
  );
}
