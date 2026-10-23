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
    apiUp === null ? 'CONNECTING' : apiUp ? 'LIVE' : 'OFFLINE';
  const dotClass = apiUp === null ? 'dot--wait' : apiUp ? 'dot--live' : 'dot--off';

  return (
    <header className="masthead">
      <div className="masthead__brand">
        <svg className="mark" viewBox="0 0 32 32" aria-hidden="true">
          <circle cx="16" cy="16" r="13.5" fill="none" stroke="var(--red)" strokeWidth="2.5" />
          <path
            d="M5 16h5.5l2-5.5 3.5 11 3-7.5 2 4h6"
            fill="none"
            stroke="var(--text)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div>
          <h1 className="masthead__title">CARDIO AI</h1>
          <p className="masthead__sub">CLINICAL RISK PREDICTOR & COPILOT</p>
        </div>
      </div>

      <div className="masthead__right">
        <div className="status">
          <span className={`dot ${dotClass}`} />
          <span className="status__text">{statusText}</span>
        </div>

        <div className="seg">
          <button
            type="button"
            className={mode === 'predict' ? 'active' : ''}
            onClick={() => onMode('predict')}
          >
            Predictor
          </button>
          <button
            type="button"
            className={mode === 'assistant' ? 'active' : ''}
            onClick={() => onMode('assistant')}
          >
            Medical AI
          </button>
          <button
            type="button"
            className={mode === 'benchmark' ? 'active' : ''}
            onClick={() => onMode('benchmark')}
          >
            Benchmark
          </button>
        </div>
      </div>
    </header>
  );
}
