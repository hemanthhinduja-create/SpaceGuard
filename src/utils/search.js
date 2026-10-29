export const MAX_QUERY_LENGTH = 400;

export function normalizeQuery(value) {
  return String(value)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[–—−]/g, '-')
    .trim()
    .replace(/\s+/g, ' ');
}

export function searchSatellites(query, satellites, category = 'All missions') {
  const normalized = normalizeQuery(query);
  const words = normalized.split(' ').filter(Boolean);
  return satellites
    .filter((satellite) => {
      if (category !== 'All missions' && satellite.category !== category) return false;
      const searchableText = normalizeQuery(
        [satellite.name, satellite.mission, satellite.agency, satellite.category].join(' '),
      );
      return words.every((word) => searchableText.includes(word));
    })
    .sort((a, b) => {
      // Exact and prefix name matches are easier to select than agency-only matches.
      const rank = (satellite) => {
        const name = normalizeQuery(satellite.name);
        return name === normalized ? 0 : name.startsWith(normalized) ? 1 : 2;
      };
      return rank(a) - rank(b) || a.name.localeCompare(b.name);
    });
}

export function relatedSatellites(selected, satellites) {
  return satellites
    .filter((item) => item.id !== selected.id && item.status === 'Active')
    .map((item) => ({
      item,
      score:
        (selected.relatedSatelliteIds.includes(item.id) ? 8 : 0) +
        (item.category === selected.category ? 4 : 0) +
        (item.agency.split(' / ').some((agency) => selected.agency.split(' / ').includes(agency))
          ? 2
          : 0) +
        (item.orbit === selected.orbit ? 1 : 0),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name))
    .slice(0, 3)
    .map(({ item }) => item);
}
