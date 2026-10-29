import { ShieldCheck, Info } from 'lucide-react';
import { calculateHealth } from '../utils/healthScore';

export default function MissionHealth({ telemetry, stale }) {
  const health = calculateHealth(telemetry);
  if (!health) return null;
  const tone = health.score >= 75 ? 'healthy' : health.score >= 50 ? 'attention' : 'critical';
  return (
    <section
      id="mission-health"
      className={`panel health-panel ${tone}`}
      aria-labelledby="health-title"
    >
      <div className="section-heading mb-6">
        <div>
          <p className="eyebrow mb-2">System assessment</p>
          <h2 id="health-title">Mission Health</h2>
        </div>
        <ShieldCheck size={24} className="health-color" />
      </div>
      <div className="grid gap-8 md:grid-cols-[210px_1fr] md:items-center">
        <div className="health-summary">
          <div className="health-ring" style={{ '--score': `${health.score}%` }}>
            <div>
              <span className="mono health-value">
                {health.score}
                <small>%</small>
              </span>
              <span className="health-classification">{health.classification}</span>
            </div>
          </div>
          <p className="muted mt-4 text-sm">
            {stale ? 'Based on last sample' : 'Based on latest sample'}
          </p>
        </div>
        <div className="space-y-4">
          {health.breakdown.map((metric) => (
            <div key={metric.label}>
              <div className="mb-2 flex justify-between gap-4 text-sm">
                <span>{metric.label}</span>
                <span className="mono">
                  {Math.round(metric.score)}
                  <span className="muted"> / 100</span>
                </span>
              </div>
              <progress
                className="progress health-progress h-1.5"
                value={metric.score}
                max="100"
                aria-label={`${metric.label} health score`}
              />
            </div>
          ))}
        </div>
      </div>
      <details className="health-rules">
        <summary>
          <Info size={16} />
          How is this score calculated?
        </summary>
        <p className="mt-4 text-sm muted">
          Each metric scores 0–100. The total is their equally weighted average, rounded to a whole
          number.
        </p>
        <ul className="mt-3 space-y-2 text-sm">
          {health.breakdown.map((metric) => (
            <li key={metric.label}>
              <strong>{metric.label}:</strong> {metric.rule}.
            </li>
          ))}
        </ul>
        <p className="mono mt-4 text-sm">
          Score = round((temperature + battery + solar + voltage + signal) / 5)
        </p>
        <p className="muted mt-3 text-sm">
          90–100 Excellent · 75–89 Good · 50–74 Attention · Below 50 Critical
        </p>
        <p className="muted mt-3 text-sm">
          These are teaching thresholds for a fictional system, not engineering limits for this
          spacecraft. Propellant and data rate are displayed but not scored.
        </p>
      </details>
    </section>
  );
}
