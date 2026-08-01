import { useEffect, useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/navigation/Sidebar.jsx';
import { TopBar } from '../components/navigation/TopBar.jsx';
import { useI18n } from '../hooks/useI18n.js';

const MOBILE_NAVIGATION_QUERY = '(max-width: 960px)';

export function AppLayout() {
  const { t } = useI18n();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isMobileNavigation, setMobileNavigation] = useState(() => window.matchMedia(MOBILE_NAVIGATION_QUERY).matches);
  const menuButtonRef = useRef(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_NAVIGATION_QUERY);

    function handleViewportChange(event) {
      setMobileNavigation(event.matches);
      if (!event.matches) setSidebarOpen(false);
    }

    handleViewportChange(mediaQuery);
    if (mediaQuery.addEventListener) mediaQuery.addEventListener('change', handleViewportChange);
    else mediaQuery.addListener(handleViewportChange);

    return () => {
      if (mediaQuery.removeEventListener) mediaQuery.removeEventListener('change', handleViewportChange);
      else mediaQuery.removeListener(handleViewportChange);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle('navigation-open', isSidebarOpen && isMobileNavigation);
    return () => document.body.classList.remove('navigation-open');
  }, [isMobileNavigation, isSidebarOpen]);

  function closeSidebar() {
    setSidebarOpen(false);
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">{t('a11y.skipToContent')}</a>
      <Sidebar isOpen={isSidebarOpen} isMobile={isMobileNavigation} onClose={closeSidebar} />
      <div className="app-shell__main">
        <TopBar menuButtonRef={menuButtonRef} onOpenMenu={() => setSidebarOpen(true)} />
        <main id="main-content" className="page-container" tabIndex="-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
