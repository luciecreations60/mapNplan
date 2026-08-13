import { useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { APP_CONFIG } from '../../config/app.config.js';
import { PRIMARY_NAVIGATION, SECONDARY_NAVIGATION } from '../../config/navigation.config.js';
import { useFocusTrap } from '../../hooks/useFocusTrap.js';
import { useI18n } from '../../hooks/useI18n.js';
import { Brand } from '../common/Brand.jsx';
import { Icon } from '../common/Icon.jsx';

function NavigationGroup({ items, onNavigate }) {
  const { t } = useI18n();

  return (
    <nav className="sidebar__navigation" aria-label={t('nav.aria')}>
      {items.map((item) => (
        <NavLink
          key={item.path}
          className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
          to={item.path}
          onClick={() => onNavigate?.()}
        >
          <Icon name={item.icon} size={19} aria-hidden="true" />
          <span>{t(item.labelKey)}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export function Sidebar({ isOpen, isMobile, onClose }) {
  const { t } = useI18n();
  const sidebarRef = useRef(null);
  const closeButtonRef = useRef(null);

  useFocusTrap({
    active: Boolean(isMobile && isOpen),
    containerRef: sidebarRef,
    initialFocusRef: closeButtonRef,
  });

  return (
    <>
      <aside
        ref={sidebarRef}
        id="application-navigation"
        className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}
        role={isMobile ? 'dialog' : undefined}
        aria-modal={isMobile && isOpen ? 'true' : undefined}
        aria-label={isMobile ? t('nav.mobileNavigation') : undefined}
        aria-hidden={isMobile && !isOpen ? 'true' : undefined}
        tabIndex={isMobile ? -1 : undefined}
      >
        <div className="sidebar__brand-row">
          <Brand />
          <button ref={closeButtonRef} className="icon-button sidebar__close" type="button" aria-label={t('nav.closeMenu')} onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>

        <div className="sidebar__primary">
          <NavigationGroup items={PRIMARY_NAVIGATION} onNavigate={isMobile ? onClose : undefined} />
        </div>

        <div className="sidebar__upgrade">
          <span className="sidebar__upgrade-icon"><Icon name="sparkles" size={18} /></span>
          <strong>{t('nav.buildTitle')}</strong>
          <p>{t('nav.buildText')}</p>
        </div>

        <div className="sidebar__secondary">
          <NavigationGroup items={SECONDARY_NAVIGATION} onNavigate={isMobile ? onClose : undefined} />
          <div className="sidebar__version">v{APP_CONFIG.version} · {t('nav.foundation')}</div>
        </div>
      </aside>
      {isMobile && isOpen && <button className="sidebar-overlay" type="button" aria-label={t('nav.closeMenu')} onClick={onClose} />}
    </>
  );
}
