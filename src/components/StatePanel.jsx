import { AlertCircle, ArrowLeft, SearchX, RefreshCw, Satellite } from 'lucide-react';
import { Link } from 'react-router-dom';

export function LoadingState({ label = 'Loading mission catalogue…', count = 3 }) {
  return (
    <div role="status" aria-live="polite" className="py-6">
      <p className="muted mb-5 flex items-center gap-2">
        <span className="loading loading-spinner loading-xs" />
        {label}
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className="card panel p-6">
            <div className="skeleton mb-6 h-8 w-16" />
            <div className="skeleton mb-3 h-7 w-3/4" />
            <div className="skeleton h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ErrorState({ message = 'Unable to load mission data.', onRetry, loading = false }) {
  return (
    <section role="alert" className="state-panel panel">
      <AlertCircle className="text-error" size={30} />
      <h2>Unable to load mission data</h2>
      <p className="muted max-w-lg">{message}</p>
      <button className="btn btn-primary" type="button" onClick={onRetry} disabled={loading}>
        <RefreshCw size={16} />
        {loading ? 'Retrying…' : 'Try Again'}
      </button>
    </section>
  );
}

export function EmptyState({ onClear }) {
  return (
    <section className="state-panel panel" role="status">
      <SearchX size={30} className="muted" />
      <h2>No satellites found</h2>
      <p className="muted">Try a name, mission, agency, or a different category.</p>
      <button className="btn btn-outline" type="button" onClick={onClear}>
        Clear search
      </button>
    </section>
  );
}

export function NotFound({ page = false }) {
  return (
    <section className="state-panel panel my-12">
      <Satellite size={32} className="muted" />
      <h1>{page ? 'Page not found' : 'Satellite not found'}</h1>
      <p className="muted">
        {page
          ? 'This route is outside mission control.'
          : 'This satellite ID is not in the curated catalogue.'}
      </p>
      <Link className="btn btn-primary" to="/">
        <ArrowLeft size={16} />
        Back to Mission Control
      </Link>
    </section>
  );
}
