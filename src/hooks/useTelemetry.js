import { useEffect, useRef, useState } from 'react';
import { getTelemetryHistory, simulateTelemetry } from '../services/satelliteService';

const POLL_MS = 2000;
const HISTORY_LENGTH = 24;

const toPoint = (reading) => ({ value: reading.signal, timestamp: new Date(reading.timestamp).getTime() });

// The backend generates and stores the simulated readings; this hook polls it every 2 s while
// the dashboard is live. Pausing, errors and unmounting all stop the timer and cancel in-flight requests.
export default function useTelemetry(satelliteId) {
  const [telemetry, setTelemetry] = useState(null);
  const [history, setHistory] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [status, setStatus] = useState('connecting');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const historyLoaded = useRef(false);
  const retryLocked = useRef(false);

  useEffect(() => {
    historyLoaded.current = false;
    setTelemetry(null);
    setHistory([]);
    setLastUpdated(null);
    setError('');
    setStatus('connecting');
  }, [satelliteId]);

  const active = status !== 'paused' && status !== 'error';

  useEffect(() => {
    retryLocked.current = false;
    if (!active) return undefined;
    const controller = new AbortController();
    let timer;

    async function step() {
      try {
        const reading = await simulateTelemetry(satelliteId, { signal: controller.signal });
        if (controller.signal.aborted) return;
        setTelemetry(reading);
        setHistory((previous) => [...previous, toPoint(reading)].slice(-HISTORY_LENGTH));
        setLastUpdated(new Date(reading.timestamp).getTime());
        setError('');
        setStatus('live');
        timer = setTimeout(step, POLL_MS);
      } catch (failure) {
        if (controller.signal.aborted) return;
        setError(failure.message || 'The telemetry request failed.');
        setStatus('error'); // last readings stay on screen, flagged as held/stale
      }
    }

    async function start() {
      try {
        if (!historyLoaded.current) {
          const readings = await getTelemetryHistory(satelliteId, {
            limit: HISTORY_LENGTH,
            signal: controller.signal,
          });
          if (controller.signal.aborted) return;
          historyLoaded.current = true;
          setHistory(readings.map(toPoint));
        }
      } catch (failure) {
        if (controller.signal.aborted) return;
        setError(failure.message || 'The telemetry request failed.');
        setStatus('error');
        return;
      }
      step();
    }

    start();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [satelliteId, active, attempt]);

  function retry() {
    if (retryLocked.current || status === 'connecting') return;
    retryLocked.current = true;
    setStatus('connecting');
    setAttempt((previous) => previous + 1);
  }

  return {
    telemetry,
    history,
    lastUpdated,
    status,
    error,
    retry,
    pause: () => setStatus('paused'),
    fail: () => setStatus('error'),
  };
}
