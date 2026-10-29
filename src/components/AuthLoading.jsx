export default function AuthLoading() {
  return (
    <main className="auth-page" aria-live="polite">
      <div className="auth-card panel">
        <div className="loading loading-spinner text-primary" aria-hidden="true" />
        <p className="muted mt-4">Checking mission access…</p>
      </div>
    </main>
  );
}
