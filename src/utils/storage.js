const prefix = 'spaceguard:';

export function readStorage(key, fallback, isValid = () => true) {
  try {
    const raw = localStorage.getItem(prefix + key);
    if (raw === null) return fallback;
    const value = JSON.parse(raw);
    return isValid(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

export function writeStorage(key, value) {
  try {
    localStorage.setItem(prefix + key, JSON.stringify(value));
    return true;
  } catch {
    window.dispatchEvent(new Event('spaceguard:storage-unavailable'));
    return false;
  }
}
