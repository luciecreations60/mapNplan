import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/navigation/Sidebar.jsx';
import { TopBar } from '../components/navigation/TopBar.jsx';

const MOBILE_NAVIGATION_QUERY = '(max-width: 960px)';

export function AppLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_NAVIGATION_QUERY);

    function handleViewportChange(event) {
      if (!event.matches) setSidebarOpen(false);
    }

    mediaQuery.addEventListener('change', handleViewportChange);
    return () => mediaQuery.removeEventListener('change', handleViewportChange);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('navigation-open', isSidebarOpen);
    return () => document.body.classList.remove('navigation-open');
  }, [isSidebarOpen]);

  return (
    <div className="app-shell">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="app-shell__main">
        <TopBar onOpenMenu={() => setSidebarOpen(true)} />
        <main className="page-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
