import { Link } from 'react-router-dom';
import { ArrowRight, ExternalLink, Orbit, Radio } from 'lucide-react';
import { StatusBadge } from './SatelliteCard';

export default function SelectedSatellite({ satellite }) {
  return (
    <section className="selected-mission panel">
      <div className="selected-heading">
        <div className="flex flex-wrap items-center gap-3">
          <span className="eyebrow text-primary">Selected satellite</span>
          <StatusBadge satellite={satellite} />
        </div>
        <span className="mono muted text-xs">CAT / {satellite.id.toUpperCase()}</span>
      </div>
      <div className="grid lg:grid-cols-[1.15fr_1fr]">
        <div className="selected-content">
          <p className="eyebrow muted mb-3">
            {satellite.agency} / {satellite.category}
          </p>
          <h1>{satellite.name}</h1>
          <p className="selected-description muted">{satellite.description}</p>
          <dl className="mission-facts grid grid-cols-2 gap-x-5 gap-y-6">
            <div>
              <dt>Mission</dt>
              <dd>{satellite.mission}</dd>
            </div>
            <div>
              <dt>Agency</dt>
              <dd>{satellite.agency}</dd>
            </div>
            <div>
              <dt>Orbit / reference location</dt>
              <dd>{satellite.orbit}</dd>
            </div>
            <div>
              <dt>Launch year</dt>
              <dd className="mono">{satellite.launchYear}</dd>
            </div>
            <div>
              <dt>Mission type</dt>
              <dd>{satellite.category}</dd>
            </div>
            <div>
              <dt>Operational status</dt>
              <dd>{satellite.status === 'Active' ? 'Not live-verified' : 'Historical mission'}</dd>
            </div>
          </dl>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link to={`/telemetry/${satellite.id}`} className="btn btn-primary telemetry-cta">
              <Radio size={18} />
              TO TELEMETRY <ArrowRight size={18} />
            </Link>
            <a href={satellite.sourceUrl} target="_blank" rel="noreferrer" className="source-link">
              Mission reference <ExternalLink size={14} />
            </a>
          </div>
        </div>
        <div className="mission-display">
          <div className="flex justify-between gap-3 px-6 pt-6">
            <span className="eyebrow muted">Mission profile</span>
            <Orbit size={18} className="text-primary" />
          </div>
          <img
            src={satellite.image}
            alt={`${satellite.category} category diagram, not an actual orbital position`}
            width="640"
            height="360"
          />
          <div className="display-caption">
            <span className="eyebrow muted">Reference location</span>
            <p>{satellite.orbit}</p>
            <p className="muted text-sm">Illustrative category diagram. No position tracking.</p>
          </div>
        </div>
      </div>
      <p className="selected-note">{satellite.statusBasis} All telemetry is simulated.</p>
    </section>
  );
}
