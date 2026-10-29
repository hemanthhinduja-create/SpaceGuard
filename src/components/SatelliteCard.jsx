import {
  ArrowUpRight,
  Orbit,
  Radio,
  Sun,
  Telescope,
  Globe2,
  Moon,
  FlaskConical,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const icons = {
  'Solar Observation': Sun,
  'Earth Observation': Globe2,
  'Space Telescope': Telescope,
  Lunar: Moon,
  Planetary: Orbit,
  Communication: Radio,
  'Scientific Research': FlaskConical,
};

export function CategoryIcon({ category, size = 22 }) {
  const Icon = icons[category] || Orbit;
  return <Icon size={size} strokeWidth={1.5} aria-hidden="true" />;
}

export function StatusBadge({ satellite }) {
  return (
    <span
      className={`badge status-badge ${satellite.status === 'Active' ? 'status-active' : 'status-archive'}`}
      title={satellite.statusBasis}
    >
      <span className="status-dot" />
      {satellite.status === 'Active' ? 'Active · demo' : 'Archive'}
    </span>
  );
}

export default function SatelliteCard({ satellite, onSelect, featured = false }) {
  return (
    <Link
      to={`/mission/${satellite.id}`}
      onClick={() => onSelect?.(satellite.id)}
      className="card mission-card panel group"
      aria-label={`Open ${satellite.name} mission`}
    >
      {featured && (
        <div className="card-visual">
          <img
            src={satellite.image}
            alt={`${satellite.category} category schematic; not an actual spacecraft position`}
            width="640"
            height="360"
          />
        </div>
      )}
      <div className="p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-2">
          <span className="category-icon">
            <CategoryIcon category={satellite.category} />
          </span>
          <StatusBadge satellite={satellite} />
        </div>
        <p className="eyebrow mb-2">{satellite.agency}</p>
        <h3 className="card-title break-words">{satellite.name}</h3>
        <p className="muted mt-2 text-sm">{satellite.category}</p>
        <div className="card-bottom">
          <span className="flex min-w-0 items-center gap-2 text-sm">
            <Orbit size={15} className="shrink-0" />
            <span>{satellite.orbit}</span>
          </span>
          <ArrowUpRight
            size={20}
            className="shrink-0 text-primary transition-transform group-hover:-translate-y-0.5"
          />
        </div>
      </div>
    </Link>
  );
}
