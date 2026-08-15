import { useLocation } from 'react-router-dom';
import { APP_CONFIG } from '../../config/app.config.js';
import { PRIMARY_NAVIGATION, SECONDARY_NAVIGATION } from '../../config/navigation.config.js';
import { useI18n } from '../../hooks/useI18n.js';
import { useTheme } from '../../hooks/useTheme.js';
import { Brand } from '../common/Brand.jsx';
import { Icon } from '../common/Icon.jsx';
import { GlobalSearch } from './GlobalSearch.jsx';
import { NotificationCenter } from './NotificationCenter.jsx';

const ALL_NAVIGATION = [...PRIMARY_NAVIGATION, ...SECONDARY_NAVIGATION];

export function TopBar({ menuButtonRef, isSidebarOpen, isMobileNavigation, onOpenMenu }) {
  const location = useLocation();
  const { t } = useI18n();
  const { resolvedTheme, setTheme } = useTheme();
  const currentPage = ALL_NAVIGATION.find((item) => item.path === location.pathname);
  const showMenuTrigger = isMobileNavigation || !isSidebarOpen;

  return (
    <header className="topbar">
      {showMenuTrigger && (
        <div className="topbar__navigation-trigger">
          <button
            ref={menuButtonRef}
            className="icon-button"
            type="button"
            aria-controls="application-navigation"
            aria-expanded={isSidebarOpen}
            aria-label={t('nav.openMenu')}
            onClick={onOpenMenu}
          >
            <Icon name="menu" />
          </button>
          {isMobileNavigation && <Brand compact />}
        </div>
      )}

      <div className="topbar__title">
        <span>{currentPage ? t(currentPage.labelKey) : APP_CONFIG.brandName}</span>
      </div>

      <div className="topbar__actions">
        <GlobalSearch />
        <NotificationCenter />
        <button
          className="icon-button"
          type="button"
          aria-label={resolvedTheme === 'dark' ? t('theme.switchToLight') : t('theme.switchToDark')}
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        >
          <Icon name={resolvedTheme === 'dark' ? 'sun' : 'moon'} />
        </button>
        <button className="avatar" type="button" aria-label={t('nav.profile')}>LC</button>
      </div>
    </header>
  );
}
