import { useLocation } from 'react-router-dom';
import { PRIMARY_NAVIGATION, SECONDARY_NAVIGATION } from '../../config/navigation.config.js';
import { useTheme } from '../../hooks/useTheme.js';
import { Brand } from '../common/Brand.jsx';
import { Icon } from '../common/Icon.jsx';

const ALL_NAVIGATION = [...PRIMARY_NAVIGATION, ...SECONDARY_NAVIGATION];

export function TopBar({ onOpenMenu }) {
  const location = useLocation();
  const { resolvedTheme, setTheme } = useTheme();
  const currentPage = ALL_NAVIGATION.find((item) => item.path === location.pathname);

  return (
    <header className="topbar">
      <div className="topbar__mobile-brand">
        <button className="icon-button" type="button" aria-label="Open menu" onClick={onOpenMenu}>
          <Icon name="menu" />
        </button>
        <Brand compact />
      </div>

      <div className="topbar__title">
        <span>{currentPage?.label || 'TripFlow'}</span>
      </div>

      <div className="topbar__actions">
        <button className="topbar__search" type="button" aria-label="Search">
          <Icon name="search" size={18} />
          <span>Search trips and places</span>
          <kbd>⌘ K</kbd>
        </button>
        <button className="icon-button" type="button" aria-label="Notifications">
          <Icon name="bell" />
          <span className="notification-dot" />
        </button>
        <button
          className="icon-button"
          type="button"
          aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} theme`}
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        >
          <Icon name={resolvedTheme === 'dark' ? 'sun' : 'moon'} />
        </button>
        <button className="avatar" type="button" aria-label="Open profile">LC</button>
      </div>
    </header>
  );
}
