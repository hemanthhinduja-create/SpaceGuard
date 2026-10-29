import { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { WifiOff, Database, AlertCircle } from 'lucide-react';
import Navbar from './components/Navbar';
import { NotFound } from './components/StatePanel';
import Home from './pages/Home';
import About from './pages/About';
import MissionCommandCenter from './pages/MissionCommandCenter';
import LiveTelemetry from './pages/LiveTelemetry';
import useLocalStorage from './hooks/useLocalStorage';
import useSatellites from './hooks/useSatellites';
import { useAuth } from './hooks/useAuth';
import AuthLoading from './components/AuthLoading';
import Login from './pages/Login';
import Register from './pages/Register';

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const [theme, setTheme] = useLocalStorage('theme', 'dark', (value) =>
    ['light', 'dark'].includes(value),
  );
  const [selectedId, setSelectedId] = useLocalStorage(
    'selected',
    '',
    (value) => typeof value === 'string' && /^[a-z0-9-]{0,80}$/.test(value),
  );
  const [offline, setOffline] = useState(!navigator.onLine);
  const [storageUnavailable, setStorageUnavailable] = useState(false);
  if (authLoading) return <AuthLoading />;

  if (!user) {
    return <AuthThemeWrapper theme={theme} setTheme={setTheme} />;
  }

  return (
    <AuthenticatedApp
      theme={theme}
      setTheme={setTheme}
      selectedId={selectedId}
      setSelectedId={setSelectedId}
      offline={offline}
      setOffline={setOffline}
      storageUnavailable={storageUnavailable}
      setStorageUnavailable={setStorageUnavailable}
    />
  );
}

function AuthThemeWrapper({ theme, setTheme }) {
  const location = useLocation();
  useEffect(() => {
    document.documentElement.dataset.theme = `space-${theme}`;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0a111c' : '#f3f6fa');
  }, [theme]);
  return (
    <Routes>
      <Route path="/register" element={<Register theme={theme} />} />
      <Route path="/login" element={<Login theme={theme} />} />
      <Route path="*" element={<Navigate to="/login" replace state={{ from: location.pathname }} />} />
    </Routes>
  );
}

function AuthenticatedApp({ theme, setTheme, selectedId, setSelectedId, offline, setOffline, storageUnavailable, setStorageUnavailable }) {
  const catalogue = useSatellites();
  const location = useLocation();
  const selected = catalogue.satellites.find((satellite) => satellite.id === selectedId);

  useEffect(() => {
    document.documentElement.dataset.theme = `space-${theme}`;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#0a111c' : '#f3f6fa');
  }, [theme]);

  useEffect(() => {
    const updateConnection = () => setOffline(!navigator.onLine);
    const reportStorage = () => setStorageUnavailable(true);
    window.addEventListener('online', updateConnection);
    window.addEventListener('offline', updateConnection);
    window.addEventListener('spaceguard:storage-unavailable', reportStorage);
    // Also detect blocked storage before an event listener was attached.
    try {
      localStorage.setItem('spaceguard:check', '1');
      localStorage.removeItem('spaceguard:check');
    } catch {
      reportStorage();
    }
    return () => {
      window.removeEventListener('online', updateConnection);
      window.removeEventListener('offline', updateConnection);
      window.removeEventListener('spaceguard:storage-unavailable', reportStorage);
    };
  }, []);

  useEffect(() => {
    const routeId = location.pathname.split('/')[2];
    const mission = catalogue.satellites.find((satellite) => satellite.id === routeId);
    document.title = mission
      ? `${mission.name} · SpaceGuard`
      : location.pathname === '/about'
        ? 'About · SpaceGuard'
        : 'SpaceGuard — Mission intelligence, simplified.';
  }, [location.pathname, catalogue.satellites]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.getElementById('main-content')?.focus({ preventScroll: true });
  }, [location.pathname]);

  return (
    <div className="app-frame">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <Navbar theme={theme} setTheme={setTheme} selected={selected} />
      <main id="main-content" className="shell flex-1" tabIndex={-1}>
        {offline && (
          <div className="alert system-notice mt-5" role="status">
            <WifiOff size={18} />
            <span>
              You’re offline. Loaded mission data remains available; live telemetry needs the server connection.
            </span>
          </div>
        )}
        {storageUnavailable && (
          <div className="alert system-notice mt-5" role="status">
            <AlertCircle size={18} />
            <span>
              Browser storage is unavailable. You can continue, but preferences may reset on
              refresh.
            </span>
          </div>
        )}
        {catalogue.source === 'saved' && (
          <div className="alert system-notice mt-5" role="status">
            <Database size={18} />
            <span>Showing the saved catalogue because the current request failed.</span>
            <button
              type="button"
              className="btn btn-sm btn-outline"
              disabled={catalogue.loading}
              onClick={catalogue.retry}
            >
              {catalogue.loading ? 'Retrying…' : 'Try Again'}
            </button>
          </div>
        )}
        <Routes>
          <Route
            path="/"
            element={<Home catalogue={catalogue} selected={selected} onSelect={setSelectedId} />}
          />
          <Route path="/about" element={<About />} />
          <Route
            path="/mission/:satelliteId"
            element={<MissionCommandCenter catalogue={catalogue} onSelect={setSelectedId} />}
          />
          <Route
            path="/telemetry/:satelliteId"
            element={<LiveTelemetry catalogue={catalogue} onSelect={setSelectedId} />}
          />
          <Route path="*" element={<NotFound page />} />
        </Routes>
      </main>
      <footer className="site-footer shell">
        <span>
          <strong>SpaceGuard.</strong>
          <span className="muted ml-2">Mission intelligence, simplified.</span>
        </span>
        <Link to="/about">Curated data. Simulated telemetry.</Link>
      </footer>
    </div>
  );
}
