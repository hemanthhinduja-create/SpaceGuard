import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LockKeyhole, Mail, Moon, Sun } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Login({ theme }) {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={location.state?.from || '/'} replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    setError('');
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setError('Enter your email and password.');
      return;
    }
    setSubmitting(true);
    try {
      await login(cleanEmail, password);
      navigate(location.state?.from || '/', { replace: true });
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  const Logo = theme === 'dark' ? Moon : Sun;

  return (
    <main className="auth-page shell">
      <section className="auth-card panel" aria-labelledby="login-title">
        <div className="auth-brand">
          <span className="brand-mark"><Logo size={23} strokeWidth={1.8} /></span>
          <span>SpaceGuard<span className="brand-period">.</span></span>
        </div>
        <p className="eyebrow muted mb-2">MISSION ACCESS</p>
        <h1 id="login-title">Welcome back.</h1>
        <p className="muted auth-lead">Sign in to continue to mission intelligence. Your session is secured by the SpaceGuard server.</p>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {error && <div className="alert alert-error auth-alert" role="alert">{error}</div>}
          <label className="auth-field">
            <span>Email</span>
            <span className="auth-input-wrap">
              <Mail size={17} aria-hidden="true" />
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                disabled={submitting}
              />
            </span>
          </label>
          <label className="auth-field">
            <span>Password</span>
            <span className="auth-input-wrap">
              <LockKeyhole size={17} aria-hidden="true" />
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                disabled={submitting}
              />
            </span>
          </label>
          <button className="btn btn-primary auth-submit" type="submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="auth-switch muted">
          New to SpaceGuard? <Link to="/register">Create an account</Link>
        </p>
      </section>
    </main>
  );
}
