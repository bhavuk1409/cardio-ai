import React from 'react';
import { useCountUp } from '../hooks/useCountUp';

interface Props {
  label: string;
  value: number;
  format?: (n: number) => string;
  unit?: string;
  accent?: string;
  animate?: boolean;
  subtitle?: string;
}

export function StatReadout({
  label,
  value,
  format = (n) => n.toFixed(1),
  unit,
  accent,
  animate = true,
  subtitle,
}: Props) {
  const animated = useCountUp(value, 800);
  const shown = animate ? animated : value;

  return (
    <div className="stat">
      <span className="stat__label">{label}</span>
      <span className="stat__value" style={accent ? { color: accent } : undefined}>
        {format(shown)}
        {unit && <span className="stat__unit">{unit}</span>}
      </span>
      {subtitle && <span className="stat__sub">{subtitle}</span>}
    </div>
  );
}
