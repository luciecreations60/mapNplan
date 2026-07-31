import { NavLink } from 'react-router-dom';
import { APP_CONFIG } from '../../config/app.config.js';
import {
  PRIMARY_NAVIGATION,
  SECONDARY_NAVIGATION,
} from '../../config/navigation.config.js';
import { Brand } from '../common/Brand.jsx';
import { Icon } from '../common/Icon.jsx';

function NavigationGroup({ items, onNavigate }) {
  return (
    <nav className="sidebar__navigation" aria-label="Application navigation">
      {items.map((item) => (
        <NavLink
          key={item.path}
          className={({ isActive }) =>
            `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
          }
          to={item.path}
          onClick={onNavigate}
        >
          <Icon name={item.icon} size={19} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export function Sidebar({ isOpen, onClose }) {
  return (
    <>
      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__brand-row">
          <Brand />
          <button className="icon-button sidebar__close" type="button" aria-label="Close menu" onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>

        <div className="sidebar__primary">
          <NavigationGroup items={PRIMARY_NAVIGATION} onNavigate={onClose} />
        </div>

        <div className="sidebar__upgrade">
          <span className="sidebar__upgrade-icon"><Icon name="sparkles" size={18} /></span>
          <strong>Build your next journey</strong>
          <p>Planning, budgets and reservations will live in one calm workspace.</p>
        </div>

        <div className="sidebar__secondary">
          <NavigationGroup items={SECONDARY_NAVIGATION} onNavigate={onClose} />
          <div className="sidebar__version">v{APP_CONFIG.version} · Foundation</div>
        </div>
      </aside>
      {isOpen && <button className="sidebar-overlay" aria-label="Close menu" onClick={onClose} />}
    </>
  );
}
