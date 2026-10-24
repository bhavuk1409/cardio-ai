import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

export type AppMode = 'predict' | 'assistant' | 'benchmark';

interface Props {
  mode: AppMode;
  onMode: (m: AppMode) => void;
}

export function Header({ mode, onMode }: Props) {
  const [apiUp, setApiUp] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    const check = async () => {
      try {
        const res = await api.health();
        if (active) setApiUp(res.status === 'ok');
      } catch {
        if (active) setApiUp(false);
      }
    };
    check();
    const timer = setInterval(check, 8000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const statusText =
    apiUp === null ? 'CONNECTING' : apiUp ? 'ONLINE' : 'OFFLINE';
  const dotClass = apiUp === null ? 'dot--wait' : apiUp ? 'dot--live' : 'dot--off';

  const MODES: { id: AppMode; label: string }[] = [
    { id: 'predict', label: 'Predictor' },
    { id: 'assistant', label: 'Copilot' },
    { id: 'benchmark', label: 'Benchmark' },
  ];

  return (
    <header className="masthead">
      <div className="masthead__brand">
        {/* Diamond + ECG pulse mark — cardiology AI identity */}
        <svg className="mark" viewBox="0 0 40 40" aria-hidden="true">
          {/* Rotated square / diamond frame */}
          <polygon
            points="20,2 38,20 20,38 2,20"
            fill="none"
            stroke="var(--red)"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          {/* Subtle inner diamond */}
          <polygon
            points="20,9 31,20 20,31 9,20"
            fill="none"
            stroke="var(--red)"
            strokeWidth="0.6"
            strokeLinejoin="round"
            opacity="0.3"
          />
          {/* ECG / heartbeat pulse line */}
          <polyline
            points="7,20 12,20 14.5,12.5 17,27.5 20,11 23,27.5 25.5,20 33,20"
            fill="none"
            stroke="var(--text)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Accent dot at peak */}
          <circle cx="20" cy="11" r="1.2" fill="var(--red)" />
        </svg>
        <div>
          <h1 className="masthead__title">CARDIO AI</h1>
          <p className="masthead__sub">CLINICAL RISK · COPILOT · BENCHMARK</p>
        </div>
      </div>

      <div className="masthead__right">
        <div className="seg">
          {MODES.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className={mode === id ? 'active' : ''}
              onClick={() => onMode(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
