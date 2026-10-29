import { useCallback, useEffect, useRef, useState } from 'react';
import { getSatellites } from '../services/satelliteService';

export default function useSatellites() {
  const [state, setState] = useState({ satellites: [], source: null, loading: true, error: '' });
  const activeRequest = useRef(null);
  const load = useCallback(async (force = false) => {
    if (activeRequest.current) return; // Repeated retry clicks share one operation.
    const controller = new AbortController();
    activeRequest.current = controller;
    setState((previous) => ({ ...previous, loading: true, error: '' }));
    try {
      const data = await getSatellites({ force, signal: controller.signal });
      if (!controller.signal.aborted) setState({ ...data, loading: false, error: '' });
    } catch (error) {
      if (!controller.signal.aborted)
        setState((previous) => ({ ...previous, loading: false, error: error.message }));
    } finally {
      if (activeRequest.current === controller) activeRequest.current = null;
    }
  }, []);
  useEffect(() => {
    load();
    return () => {
      activeRequest.current?.abort();
      activeRequest.current = null;
    };
  }, [load]);
  return { ...state, retry: () => load(true) };
}
