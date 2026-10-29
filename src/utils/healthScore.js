export const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value));

export function classifyHealth(score) {
  if (score >= 90) return 'EXCELLENT';
  if (score >= 75) return 'GOOD';
  if (score >= 50) return 'ATTENTION';
  return 'CRITICAL';
}

export function calculateHealth(telemetry) {
  const keys = ['temperature', 'battery', 'solarPower', 'voltage', 'signal'];
  if (!telemetry || keys.some((key) => !Number.isFinite(telemetry[key]))) return null;
  const { temperature, battery, solarPower, voltage, signal } = telemetry;
  // Teaching thresholds for a fictional 12–14 V bus, not spacecraft specifications.
  const temperaturePenalty =
    temperature < 10 ? (10 - temperature) * 5 : Math.max(0, temperature - 40) * 5;
  const voltagePenalty = voltage < 12 ? (12 - voltage) * 25 : Math.max(0, voltage - 14) * 25;
  const breakdown = [
    {
      label: 'Temperature',
      score: clamp(100 - temperaturePenalty),
      rule: '10–40 °C → 100; −5 points per °C outside',
    },
    { label: 'Battery', score: clamp(battery), rule: 'Battery percentage = points' },
    { label: 'Solar Power', score: clamp(solarPower), rule: 'Solar capacity percentage = points' },
    {
      label: 'Voltage',
      score: clamp(100 - voltagePenalty),
      rule: '12–14 V → 100; −25 points per V outside',
    },
    { label: 'Signal', score: clamp(signal), rule: 'Signal percentage = points' },
  ];
  const score = Math.round(
    breakdown.reduce((sum, metric) => sum + metric.score, 0) / breakdown.length,
  );
  return { score, classification: classifyHealth(score), breakdown };
}
