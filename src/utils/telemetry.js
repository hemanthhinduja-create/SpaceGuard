import { clamp } from './healthScore.js';

export const METRICS = [
  {
    key: 'temperature',
    label: 'Temperature',
    unit: '°C',
    decimals: 1,
    min: -10,
    max: 70,
    step: 0.6,
    note: 'Demo nominal · 10–40 °C',
  },
  {
    key: 'battery',
    label: 'Battery',
    unit: '%',
    decimals: 0,
    min: 10,
    max: 100,
    step: 0.7,
    note: 'Simulated state of charge',
  },
  {
    key: 'solarPower',
    label: 'Solar Power',
    unit: '%',
    decimals: 0,
    min: 5,
    max: 100,
    step: 1.2,
    note: 'Relative to demo capacity',
  },
  {
    key: 'voltage',
    label: 'Voltage',
    unit: 'V',
    decimals: 2,
    min: 9,
    max: 16,
    step: 0.04,
    note: 'Demo nominal · 12–14 V',
  },
  {
    key: 'signal',
    label: 'Signal Strength',
    unit: '%',
    decimals: 0,
    min: 5,
    max: 100,
    step: 1,
    note: 'Simulated link quality',
  },
  {
    key: 'fuel',
    label: 'Propellant',
    unit: '%',
    decimals: 1,
    min: 0,
    max: 100,
    step: 0.01,
    note: 'Illustrative remaining reserve',
  },
  {
    key: 'dataRate',
    label: 'Data Rate',
    unit: 'Mbps',
    decimals: 2,
    min: 0.1,
    max: 12,
    step: 0.16,
    note: 'Simulated downlink throughput',
  },
];

export function initialTelemetry(id) {
  const offset = [...id].reduce((sum, letter) => sum + letter.charCodeAt(0), 0) % 7;
  return {
    temperature: 30 + offset,
    battery: 87 + offset,
    solarPower: 82 + offset,
    voltage: 13.2 + offset * 0.02,
    signal: 94 - offset,
    fuel: 76 + offset,
    dataRate: 4.2 + offset * 0.3,
  };
}

export function nextTelemetry(previous, random = Math.random) {
  return Object.fromEntries(
    METRICS.map((metric) => {
      const change =
        metric.key === 'fuel' ? -random() * metric.step : (random() * 2 - 1) * metric.step;
      return [
        metric.key,
        Number(clamp(previous[metric.key] + change, metric.min, metric.max).toFixed(3)),
      ];
    }),
  );
}
