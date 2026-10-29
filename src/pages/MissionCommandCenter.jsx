import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import SelectedSatellite from '../components/SelectedSatellite';
import SatelliteCard from '../components/SatelliteCard';
import { ErrorState, LoadingState, NotFound } from '../components/StatePanel';
import { getSatelliteById } from '../services/satelliteService';
import { relatedSatellites } from '../utils/search';

export default function MissionCommandCenter({ catalogue, onSelect }) {
  const { satelliteId } = useParams();
  const { satellites, loading, error, retry } = catalogue;
  const selected = getSatelliteById(satelliteId, satellites);
  useEffect(() => {
    if (selected) onSelect(selected.id);
  }, [selected, onSelect]);

  if (loading) return <LoadingState label="Loading mission profile…" />;
  if (error) return <ErrorState message={error} onRetry={retry} />;
  if (!selected) return <NotFound />;
  const related = relatedSatellites(selected, satellites);

  return (
    <div className="page-content">
      <div className="page-toolbar">
        <Link to="/" className="back-link">
          <ArrowLeft size={16} />
          Mission directory
        </Link>
        <span className="eyebrow muted">Mission Command Center</span>
      </div>
      <SelectedSatellite satellite={selected} />
      <section className="mt-12" aria-labelledby="related-title">
        <div className="section-heading mb-3">
          <h2 id="related-title">Other active missions</h2>
          <span className="badge badge-outline muted">Curated connections</span>
        </div>
        <p className="muted mb-6 text-sm">
          Active in this demo. Related by purpose, category, agency, or reference location—not live
          orbital proximity.
        </p>
        {related.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((satellite) => (
              <SatelliteCard key={satellite.id} satellite={satellite} onSelect={onSelect} />
            ))}
          </div>
        ) : (
          <p className="panel p-6 muted">
            No related active missions in this catalogue. Explore another mission from Home.
          </p>
        )}
      </section>
    </div>
  );
}
