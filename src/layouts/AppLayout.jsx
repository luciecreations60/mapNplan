import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/navigation/Sidebar.jsx';
import { TopBar } from '../components/navigation/TopBar.jsx';

export function AppLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

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
