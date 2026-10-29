import { Thermometer, BatteryMedium, Sun, Zap, Radio, Fuel, ArrowDownUp } from 'lucide-react';

const icons = {
  temperature: Thermometer,
  battery: BatteryMedium,
  solarPower: Sun,
  voltage: Zap,
  signal: Radio,
  fuel: Fuel,
  dataRate: ArrowDownUp,
};

export default function TelemetryCard({ metric, value }) {
  const Icon = icons[metric.key];
  return (
    <article className="card panel metric-card">
      <div className="flex items-center justify-between gap-2">
        <h2>{metric.label}</h2>
        <Icon size={19} className="muted" />
      </div>
      <p className="metric-number mono">
        {value.toFixed(metric.decimals)}
        <span>{metric.unit}</span>
      </p>
      <p className="muted text-xs">{metric.note}</p>
      {metric.unit === '%' && (
        <progress
          className="progress progress-primary mt-4 h-1"
          value={value}
          max="100"
          aria-label={`${metric.label}: ${value.toFixed(metric.decimals)} percent`}
        />
      )}
    </article>
  );
}
