import { useLocation } from 'react-router-dom';
import { PRIMARY_NAVIGATION, SECONDARY_NAVIGATION } from '../../config/navigation.config.js';
import { useI18n } from '../../hooks/useI18n.js';
import { useTheme } from '../../hooks/useTheme.js';
import { Brand } from '../common/Brand.jsx';
import { Icon } from '../common/Icon.jsx';

const ALL_NAVIGATION = [...PRIMARY_NAVIGATION, ...SECONDARY_NAVIGATION];

export function TopBar({ onOpenMenu }) {
  const location = useLocation();
  const { t } = useI18n();
  const { resolvedTheme, setTheme } = useTheme();
  const currentPage = ALL_NAVIGATION.find((item) => item.path === location.pathname);

  return (
    <header className="topbar">
      <div className="topbar__mobile-brand">
        <button className="icon-button" type="button" aria-label={t('nav.openMenu')} onClick={onOpenMenu}>
          <Icon name="menu" />
        </button>
        <Brand compact />
      </div>

      <div className="topbar__title">
        <span>{currentPage ? t(currentPage.labelKey) : 'TripFlow'}</span>
      </div>

      <div className="topbar__actions">
        <button className="topbar__search" type="button" aria-label={t('nav.search')}>
          <Icon name="search" size={18} />
          <span>{t('nav.search')}</span>
          <kbd>⌘ K</kbd>
        </button>
        <button className="icon-button" type="button" aria-label={t('nav.notifications')}>
          <Icon name="bell" />
          <span className="notification-dot" />
        </button>
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
