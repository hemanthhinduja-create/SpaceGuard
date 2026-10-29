import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Radio, Pause, Play, RefreshCw, AlertCircle } from 'lucide-react';
import { ErrorState, LoadingState, NotFound } from '../components/StatePanel';
import TelemetryCard from '../components/TelemetryCard';
import MissionHealth from '../components/MissionHealth';
import SignalChart from '../components/SignalChart';
import useTelemetry from '../hooks/useTelemetry';
import { getSatelliteById } from '../services/satelliteService';
import { METRICS } from '../utils/telemetry';

function TelemetryDashboard({ satellite }) {
  const { telemetry, history, status, lastUpdated, error, retry, pause, fail } = useTelemetry(
    satellite.id,
  );
  const stale = status !== 'live';
  const statusLabels = {
    connecting: 'Starting simulation',
    live: 'Simulation running',
    paused: 'Stream paused',
    error: 'Simulation interrupted',
  };

  return (
    <div className="page-content">
      <div className="page-toolbar">
        <Link className="back-link" to={`/mission/${satellite.id}`}>
          <ArrowLeft size={16} />
          Mission Command Center
        </Link>
        {telemetry && (
          <a href="#mission-health" className="back-link">
            Mission Health ↓
          </a>
        )}
      </div>
      <div className="telemetry-heading">
        <div>
          <p className="eyebrow text-primary mb-3">Live telemetry</p>
          <h1>{satellite.name}</h1>
          <p className="muted mt-3">
            Simulated telemetry stream <span aria-hidden="true">·</span> Server updates every 2
            seconds
          </p>
        </div>
        <span className="simulation-label">
          <Radio size={17} />
          SIMULATION
        </span>
      </div>
      <div className="stream-toolbar panel">
        <div>
          <p
            className={`stream-status ${status === 'live' ? 'text-primary' : status === 'error' ? 'text-error' : 'muted'}`}
            role="status"
          >
            <span className={`status-dot ${status === 'live' ? 'pulse-dot' : ''}`} />
            {statusLabels[status]}
          </p>
          <p className="muted text-sm mt-2">
            Last updated:{' '}
            <time dateTime={lastUpdated ? new Date(lastUpdated).toISOString() : undefined}>
              {lastUpdated
                ? new Date(lastUpdated).toLocaleTimeString()
                : 'Waiting for first sample'}
            </time>
            {lastUpdated && stale ? ' · values held' : ''}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-outline"
          disabled={status === 'connecting'}
          onClick={status === 'live' ? pause : retry}
        >
          {status === 'live' ? <Pause size={16} /> : <Play size={16} />}
          {status === 'live'
            ? 'Pause stream'
            : status === 'connecting'
              ? 'Connecting…'
              : status === 'error'
                ? 'Try Again'
                : 'Resume stream'}
        </button>
      </div>
      {status === 'paused' && (
        <div className="alert stream-alert" role="status">
          <Pause size={18} />
          <span>
            Stream paused. Readings and health show the last sample. Select Resume stream to
            continue.
          </span>
        </div>
      )}
      {status === 'error' && (
        <div className="alert alert-error stream-alert" role="alert">
          <AlertCircle size={20} />
          <div>
            <strong>Simulation interrupted</strong>
            <p>
              {error || 'The demo interruption stopped updates.'} Last readings are preserved. Use
              Try Again to restart the stream.
            </p>
          </div>
        </div>
      )}
      {!telemetry && status === 'connecting' ? (
        <LoadingState label="Waiting for the simulator’s first sample…" count={3} />
      ) : telemetry ? (
        <>
          <div className={`telemetry-grid ${stale ? 'readings-stale' : ''}`}>
            {METRICS.map((metric) => (
              <TelemetryCard key={metric.key} metric={metric} value={telemetry[metric.key]} />
            ))}
          </div>
          <div className="assessment-grid">
            <MissionHealth telemetry={telemetry} stale={stale} />
            <div className="space-y-5">
              <SignalChart history={history} />
              <details className="panel simulation-controls">
                <summary>
                  <RefreshCw size={16} />
                  Simulation controls
                </summary>
                <p className="muted my-4 text-sm">
                  Try an interruption to see how the dashboard holds the last reading and recovers.
                  This only affects this dashboard session.
                </p>
                <button
                  className="btn btn-outline w-full"
                  type="button"
                  onClick={fail}
                  disabled={status !== 'live'}
                >
                  Simulate interruption
                </button>
              </details>
            </div>
          </div>
        </>
      ) : (
        <p className="panel p-6 muted">
          No samples available. Restart the stream to generate a reading.
        </p>
      )}
      <p className="catalogue-note muted">
        All values and health thresholds are fictional teaching data. They do not describe this
        spacecraft’s actual instruments, power system, or operational health.
      </p>
    </div>
  );
}

export default function LiveTelemetry({ catalogue, onSelect }) {
  const { satelliteId } = useParams();
  const { satellites, loading, error, retry } = catalogue;
  const satellite = getSatelliteById(satelliteId, satellites);
  useEffect(() => {
    if (satellite) onSelect(satellite.id);
  }, [satellite, onSelect]);
  if (loading) return <LoadingState label="Loading mission data…" />;
  if (error) return <ErrorState message={error} onRetry={retry} />;
  if (!satellite) return <NotFound />;
  return <TelemetryDashboard key={satellite.id} satellite={satellite} />;
}
