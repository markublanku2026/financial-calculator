import { Link, NavLink, Outlet } from 'react-router-dom';

import { SkipLink } from '../components/SkipLink';
import { usePreferences } from '../context/PreferencesContext';
import { footerNav, mainNav } from '../data/site';

export function AppLayout() {
  const { preferences, setReducedMotion, storageEnabled } = usePreferences();

  return (
    <div className="app-shell">
      <SkipLink />
      <header className="site-header">
        <div className="container header-row">
          <Link className="brand" to="/">
            Financial Calculator Hub
          </Link>
          <nav aria-label="Primary">
            <ul className="nav-list">
              {mainNav.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to}>{item.label}</NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <label className="toggle-row">
            <input
              checked={preferences.reducedMotion}
              type="checkbox"
              onChange={(event) => setReducedMotion(event.target.checked)}
            />
            <span>Reduced motion</span>
          </label>
        </div>
      </header>
      <main className="container main-content" id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="container footer-grid">
          <div>
            <p className="brand brand-small">Financial Calculator Hub</p>
            <p>Local-first financial planning tools with browser-only calculations and no registration requirement.</p>
            <p className="muted">Local preferences {storageEnabled ? 'are available on this device.' : 'could not be stored on this device.'}</p>
          </div>
          <nav aria-label="Footer">
            <ul className="footer-links">
              {footerNav.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to}>{item.label}</NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </footer>
    </div>
  );
}
