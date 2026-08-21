import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { APP_CONFIG } from '../../config/app.config.js';
import { PRIMARY_NAVIGATION, SECONDARY_NAVIGATION } from '../../config/navigation.config.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import { useFocusTrap } from '../../hooks/useFocusTrap.js';
import { useI18n } from '../../hooks/useI18n.js';
import { useTheme } from '../../hooks/useTheme.js';
import { Brand } from '../common/Brand.jsx';
import { Icon } from '../common/Icon.jsx';
import { GlobalSearch } from './GlobalSearch.jsx';
import { NotificationCenter } from './NotificationCenter.jsx';

function initialsFromEmail(email) {
  if (!email) return '?';
  return email.slice(0, 2).toUpperCase();
}

const ALL_NAVIGATION = [...PRIMARY_NAVIGATION, ...SECONDARY_NAVIGATION];

export function TopBar({ menuButtonRef, isSidebarOpen, isMobileNavigation, onOpenMenu }) {
  const location = useLocation();
  const { t } = useI18n();
  const { resolvedTheme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const currentPage = ALL_NAVIGATION.find((item) => item.path === location.pathname);
  const showMenuTrigger = isMobileNavigation || !isSidebarOpen;

  const [isAccountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef(null);
  const accountButtonRef = useRef(null);

  useFocusTrap({ active: isAccountMenuOpen, containerRef: accountMenuRef, initialFocusRef: null });

  useEffect(() => {
    if (!isAccountMenuOpen) return undefined;

    function handleOutsideClick(event) {
      if (accountMenuRef.current?.contains(event.target)) return;
      if (accountButtonRef.current?.contains(event.target)) return;
      setAccountMenuOpen(false);
    }

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isAccountMenuOpen]);

  function closeAccountMenu() {
    setAccountMenuOpen(false);
    window.requestAnimationFrame(() => accountButtonRef.current?.focus({ preventScroll: true }));
  }

  function handleAccountKeyDown(event) {
    if (event.key === 'Escape') closeAccountMenu();
  }

  async function handleSignOut() {
    closeAccountMenu();
    await signOut();
  }

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
        <div className="account-menu">
          <button
            ref={accountButtonRef}
            className="avatar"
            type="button"
            aria-label={t('nav.profile')}
            aria-haspopup="menu"
            aria-expanded={isAccountMenuOpen}
            onClick={() => setAccountMenuOpen((open) => !open)}
          >
            {initialsFromEmail(user?.email)}
          </button>
          {isAccountMenuOpen && (
            <div
              ref={accountMenuRef}
              className="account-menu__panel"
              role="menu"
              tabIndex="-1"
              onKeyDown={handleAccountKeyDown}
            >
              {user?.email && <div className="account-menu__email">{user.email}</div>}
              <button type="button" role="menuitem" className="account-menu__item" onClick={handleSignOut}>
                <Icon name="logOut" size={16} />
                <span>{t('auth.signOut')}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
