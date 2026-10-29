import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Search, Orbit } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import SatelliteCard from '../components/SatelliteCard';
import { EmptyState, ErrorState, LoadingState } from '../components/StatePanel';
import useLocalStorage from '../hooks/useLocalStorage';
import { searchSatellites, MAX_QUERY_LENGTH } from '../utils/search';

const categories = [
  'All missions',
  'Solar Observation',
  'Earth Observation',
  'Space Telescope',
  'Lunar',
  'Planetary',
  'Communication',
  'Scientific Research',
];
const featuredIds = ['aditya-l1', 'james-webb', 'sentinel-2a'];

export default function Home({ catalogue, selected, onSelect }) {
  const navigate = useNavigate();
  const [query, setQuery] = useLocalStorage(
    'search',
    '',
    (value) => typeof value === 'string' && value.length <= MAX_QUERY_LENGTH,
  );
  const [category, setCategory] = useLocalStorage('category', 'All missions', (value) =>
    categories.includes(value),
  );
  const [browsing, setBrowsing] = useState(Boolean(query.trim()) || category !== 'All missions');
  const [visibleCount, setVisibleCount] = useState(9);
  const { satellites, loading, error, retry } = catalogue;
  const results = useMemo(
    () => searchSatellites(query, satellites, category),
    [query, satellites, category],
  );
  const featured = featuredIds
    .map((id) => satellites.find((satellite) => satellite.id === id))
    .filter(Boolean);

  function select(id) {
    onSelect(id);
    navigate(`/mission/${id}`);
  }
  function search() {
    setBrowsing(true);
    setVisibleCount(9);
  }
  function clear() {
    setQuery('');
    setCategory('All missions');
    setBrowsing(false);
    setVisibleCount(9);
  }

  return (
    <>
      <section className="home-intro" aria-labelledby="home-title">
        <div className="catalogue-label">
          <Orbit size={16} />
          <span>THE MISSION DIRECTORY</span>
        </div>
        <h1 id="home-title">
          Every mission.
          <br />
          <span>A clearer perspective.</span>
        </h1>
        <p className="hero-tagline">Mission intelligence, simplified.</p>
        <p className="muted intro-description">
          Find a satellite, explore its purpose, and understand its health.
        </p>
        <SearchBar
          query={query}
          setQuery={(value) => {
            setQuery(value);
            setVisibleCount(9);
          }}
          category={category}
          satellites={satellites}
          onSelect={select}
          onSearch={search}
          loading={loading || Boolean(error)}
        />
        <div className="quick-searches">
          <span className="muted text-sm">Try a search</span>
          {['Aditya-L1', 'NASA', 'Lunar'].map((term) => (
            <button
              type="button"
              className="btn quick-search"
              key={term}
              onClick={() => {
                setQuery(term);
                setCategory('All missions');
                search();
              }}
            >
              <Search size={12} />
              {term}
            </button>
          ))}
        </div>
        {selected && (
          <Link to={`/mission/${selected.id}`} className="resume-link">
            Continue exploring {selected.name}
            <ArrowRight size={15} />
          </Link>
        )}
      </section>

      <div className="directory-stats" aria-label="Catalogue overview">
        <div>
          <span className="mono">{satellites.length || '—'}</span>
          <span>Mission profiles</span>
        </div>
        <div>
          <span className="mono">07</span>
          <span>Mission categories</span>
        </div>
        <div>
          <span className="mono">SIM</span>
          <span>Simulated telemetry</span>
        </div>
      </div>

      <section className="directory-section" aria-labelledby="directory-title">
        <div className="section-heading mb-6">
          <div>
            <p className="eyebrow muted mb-2">Explore the catalogue</p>
            <h2 id="directory-title">
              {browsing ? 'Mission search results' : 'Featured missions'}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="sr-only" htmlFor="category-filter">
              Filter missions by category
            </label>
            <select
              id="category-filter"
              className="select category-select"
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                setBrowsing(true);
                setVisibleCount(9);
              }}
            >
              {categories.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
            <button
              className="btn btn-ghost browse-button"
              type="button"
              onClick={
                browsing
                  ? clear
                  : () => {
                      setQuery('');
                      search();
                    }
              }
            >
              {browsing ? 'Reset' : 'View all'}
              <ArrowUpRight size={16} />
            </button>
          </div>
        </div>
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={retry} />
        ) : browsing ? (
          <>
            <p className="muted mb-5 text-sm" role="status">
              {results.length} {results.length === 1 ? 'mission' : 'missions'} found
              {query.trim() && (
                <>
                  {' '}
                  for <span className="query-preview">“{query}”</span>
                </>
              )}
            </p>
            {results.length ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {results.slice(0, visibleCount).map((satellite) => (
                    <SatelliteCard key={satellite.id} satellite={satellite} onSelect={onSelect} />
                  ))}
                </div>
                {results.length > visibleCount && (
                  <div className="mt-7 text-center">
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => setVisibleCount((count) => count + 9)}
                    >
                      Show more missions ({results.length - visibleCount} remaining)
                    </button>
                  </div>
                )}
              </>
            ) : (
              <EmptyState onClear={clear} />
            )}
          </>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((satellite) => (
              <SatelliteCard
                key={satellite.id}
                satellite={satellite}
                onSelect={onSelect}
                featured
              />
            ))}
          </div>
        )}
        <p className="catalogue-note muted">
          Curated mission references. “Active” means enabled in this demo; it does not report
          current spacecraft operations.
        </p>
      </section>
    </>
  );
}
