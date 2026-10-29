export default function SignalChart({ history }) {
  const points = history
    .map((sample, index) => `${20 + (index / 23) * 600},${145 - sample.value * 1.15}`)
    .join(' ');
  return (
    <section className="panel signal-panel" aria-labelledby="signal-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow mb-2">Stream history</p>
          <h2 id="signal-title">Signal stability</h2>
        </div>
        <span className="mono muted text-xs">0–100%</span>
      </div>
      {history.length < 2 ? (
        <p className="muted py-12 text-sm" role="status">
          Collecting a second sample to draw the trend…
        </p>
      ) : (
        <>
          <svg
            viewBox="0 0 640 165"
            className="signal-chart"
            role="img"
            aria-label={`Signal strength across the last ${history.length} samples. Latest: ${Math.round(history.at(-1).value)} percent.`}
          >
            {[30, 87.5, 145].map((y) => (
              <line
                key={y}
                x1="20"
                x2="620"
                y1={y}
                y2={y}
                className="chart-grid"
                strokeDasharray="3 6"
              />
            ))}
            <polyline
              fill="none"
              className="chart-line"
              strokeWidth="2.5"
              strokeLinejoin="round"
              points={points}
            />
            <circle
              cx={20 + ((history.length - 1) / 23) * 600}
              cy={145 - history.at(-1).value * 1.15}
              r="4"
              className="chart-dot"
            />
          </svg>
          <div className="flex justify-between gap-3 text-xs muted mono">
            <span>{new Date(history[0].timestamp).toLocaleTimeString()}</span>
            <span>{history.length} / 24 samples · 2s</span>
            <span>{new Date(history.at(-1).timestamp).toLocaleTimeString()}</span>
          </div>
        </>
      )}
      <p className="muted mt-5 text-sm">A rolling window of simulated signal readings from the SpaceGuard server.</p>
    </section>
  );
}
