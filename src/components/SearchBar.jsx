import { useMemo, useRef, useState } from 'react';
import { ArrowRight, Search, X, ArrowUpRight, SearchX } from 'lucide-react';
import { MAX_QUERY_LENGTH, searchSatellites } from '../utils/search';
import { CategoryIcon } from './SatelliteCard';

export default function SearchBar({
  query,
  setQuery,
  satellites,
  category,
  onSelect,
  onSearch,
  loading,
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [error, setError] = useState('');
  const [selecting, setSelecting] = useState(false);
  const selectionLock = useRef(false);
  const input = useRef(null);
  const matches = useMemo(
    () => searchSatellites(query, satellites, category),
    [query, satellites, category],
  );
  const suggestions = matches.slice(0, 5);
  const showSuggestions = open && query.trim().length > 0 && !loading && !selecting;

  function updateQuery(value) {
    setQuery(value.slice(0, MAX_QUERY_LENGTH));
    setError('');
    setActiveIndex(-1);
    setOpen(true);
  }

  function select(id) {
    if (selectionLock.current) return;
    selectionLock.current = true;
    setSelecting(true);
    setOpen(false);
    onSelect(id);
  }

  function submit(event) {
    event.preventDefault();
    if (loading || selecting) return;
    if (!query.trim()) {
      setError('Enter a satellite, mission, agency, or category.');
      input.current?.focus();
      return;
    }
    if (showSuggestions && activeIndex >= 0 && suggestions[activeIndex]) {
      select(suggestions[activeIndex].id);
    } else {
      setOpen(false);
      onSearch(); // Searching local records is synchronous and idempotent.
    }
  }

  function onKeyDown(event) {
    if (event.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
    if (['ArrowDown', 'ArrowUp'].includes(event.key) && suggestions.length) {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((previous) =>
        event.key === 'ArrowDown'
          ? (previous + 1) % suggestions.length
          : previous <= 0
            ? suggestions.length - 1
            : previous - 1,
      );
    }
  }

  return (
    <div
      className="search-area"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false);
          setActiveIndex(-1);
        }
      }}
    >
      <form onSubmit={submit} noValidate role="search">
        <label htmlFor="satellite-search" className="sr-only">
          Search satellites, missions, agencies, or categories
        </label>
        <div className={`search-shell ${error ? 'search-invalid' : ''}`}>
          <Search size={22} className="search-icon shrink-0" aria-hidden="true" />
          <input
            ref={input}
            id="satellite-search"
            className="input search-input"
            type="text"
            value={query}
            maxLength={MAX_QUERY_LENGTH}
            autoComplete="off"
            placeholder="Search satellites, missions, agencies…"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={showSuggestions}
            aria-controls={showSuggestions ? 'satellite-suggestions' : undefined}
            aria-activedescendant={
              showSuggestions && activeIndex >= 0
                ? `suggestion-${suggestions[activeIndex]?.id}`
                : undefined
            }
            aria-invalid={Boolean(error)}
            aria-describedby="search-help"
            onChange={(event) => updateQuery(event.target.value)}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            disabled={selecting}
          />
          {query && (
            <button
              type="button"
              className="btn btn-ghost clear-search"
              aria-label="Clear search input"
              onClick={() => {
                updateQuery('');
                input.current?.focus();
              }}
            >
              <X size={17} />
            </button>
          )}
          <button
            type="submit"
            className="btn btn-primary search-submit"
            disabled={loading || selecting}
          >
            <span className="hidden sm:inline">{selecting ? 'Opening…' : 'Search'}</span>
            <ArrowRight size={19} />
            <span className="sr-only sm:hidden">Search</span>
          </button>
        </div>
        <p
          id="search-help"
          className={`search-help ${error ? 'text-error' : 'muted'}`}
          aria-live="polite"
        >
          {error ||
            (query.length === MAX_QUERY_LENGTH
              ? '400 / 400 characters. Shorter queries work best.'
              : 'Search by name, mission, agency, or category. Use ↑ ↓ and Enter to select.')}
        </p>
      </form>
      {showSuggestions && (
        <div className="search-dropdown panel">
          <div className="dropdown-heading">
            <span>{matches.length ? 'Matching missions' : 'Search results'}</span>
            <span>{matches.length} found</span>
          </div>
          <ul id="satellite-suggestions" role="listbox" aria-label="Satellite suggestions">
            {suggestions.map((satellite, index) => (
              <li
                key={satellite.id}
                id={`suggestion-${satellite.id}`}
                role="option"
                aria-selected={index === activeIndex}
                className={`suggestion ${index === activeIndex ? 'suggestion-active' : ''}`}
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => select(satellite.id)}
                onPointerMove={() => setActiveIndex(index)}
              >
                <span className="category-icon">
                  <CategoryIcon category={satellite.category} size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block break-words">{satellite.name}</strong>
                  <span className="muted text-sm">
                    {satellite.agency} · {satellite.category}
                  </span>
                </span>
                <ArrowUpRight size={18} className="shrink-0 muted" />
              </li>
            ))}
          </ul>
          {!matches.length && (
            <div className="px-5 py-7 text-center" role="status">
              <SearchX size={26} className="mx-auto mb-3 muted" />
              <strong>No satellites found</strong>
              <p className="muted mt-2 text-sm">Try “Aditya”, “NASA”, or “Lunar”.</p>
              <button
                className="btn btn-ghost mt-3"
                type="button"
                onClick={() => {
                  updateQuery('');
                  input.current?.focus();
                }}
              >
                Clear search
              </button>
            </div>
          )}
          {matches.length > 5 && (
            <button
              className="btn dropdown-more"
              type="button"
              onClick={() => {
                setOpen(false);
                onSearch();
              }}
            >
              Show all {matches.length} matches <ArrowRight size={16} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
