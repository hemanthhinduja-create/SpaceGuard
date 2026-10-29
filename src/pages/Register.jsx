import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LockKeyhole, Mail, Moon, Sun, UserRound } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Register({ theme }) {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    setError('');
    if (!name.trim() || !email.trim() || !password || !confirm) {
      setError('Complete all fields.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await register(name.trim(), email.trim().toLowerCase(), password);
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
      <section className="auth-card panel" aria-labelledby="register-title">
        <div className="auth-brand">
          <span className="brand-mark"><Logo size={23} strokeWidth={1.8} /></span>
          <span>SpaceGuard<span className="brand-period">.</span></span>
        </div>
        <p className="eyebrow muted mb-2">NEW MISSION PROFILE</p>
        <h1 id="register-title">Create access.</h1>
        <p className="muted auth-lead">Create an account to enter mission control. Your password is hashed on the server.</p>
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {error && <div className="alert alert-error auth-alert" role="alert">{error}</div>}
          <label className="auth-field">
            <span>Name</span>
            <span className="auth-input-wrap"><UserRound size={17} /><input autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" disabled={submitting} /></span>
          </label>
          <label className="auth-field">
            <span>Email</span>
            <span className="auth-input-wrap"><Mail size={17} /><input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" disabled={submitting} /></span>
          </label>
          <label className="auth-field">
            <span>Password</span>
            <span className="auth-input-wrap"><LockKeyhole size={17} /><input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" disabled={submitting} /></span>
          </label>
          <label className="auth-field">
            <span>Confirm password</span>
            <span className="auth-input-wrap"><LockKeyhole size={17} /><input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat your password" disabled={submitting} /></span>
          </label>
          <button className="btn btn-primary auth-submit" type="submit" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <p className="auth-switch muted">Already have access? <Link to="/login">Sign in</Link></p>
      </section>
    </main>
  );
}
