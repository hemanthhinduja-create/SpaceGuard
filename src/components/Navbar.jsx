import { Link, NavLink } from 'react-router-dom';
import { Moon, Sun, ArrowUpRight, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Navbar({ theme, setTheme, selected }) {
  const { user, logout } = useAuth();
  const Logo = theme === 'dark' ? Moon : Sun;
  const ToggleIcon = theme === 'dark' ? Sun : Moon;
  async function handleLogout() {
    try {
      await logout();
    } catch {
      // The session is cleared locally even if the server could not be reached.
    }
  }
  return (
    <header className="site-header">
      <div className="navbar shell min-h-20 gap-3 px-0">
        <Link to="/" className="brand" aria-label="SpaceGuard home">
          <span className="brand-mark">
            <Logo size={23} strokeWidth={1.8} data-testid="theme-logo" />
          </span>
          <span>
            SpaceGuard<span className="brand-period">.</span>
          </span>
        </Link>
        <nav aria-label="Main navigation" className="ml-auto flex items-center gap-1 sm:gap-5">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}
          >
            Home
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}
          >
            About
          </NavLink>
          {selected && (
            <Link
              className="btn btn-ghost hidden gap-2 lg:inline-flex"
              to={`/mission/${selected.id}`}
            >
              Resume mission <ArrowUpRight size={16} />
            </Link>
          )}
          <button
            type="button"
            className="btn btn-ghost gap-2"
            onClick={handleLogout}
            title="Sign out"
          >
            <LogOut size={17} />
            <span className="hidden sm:inline">Sign out</span>
          </button>
          <button
            type="button"
            className="btn theme-toggle"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            <ToggleIcon size={19} />
          </button>
        </nav>
      </div>
    </header>
  );
}
