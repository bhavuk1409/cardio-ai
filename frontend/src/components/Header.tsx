import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { api } from '../services/api';

export function Header() {
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
    apiUp === null ? 'INITIALIZING' : apiUp ? 'TELEMETRY LIVE' : 'BACKEND OFFLINE';
  const dotClass = apiUp === null ? 'dot--wait' : apiUp ? 'dot--live' : 'dot--off';

  const navItems = [
    { to: '/', label: 'Overview' },
    { to: '/predict', label: 'Risk Console' },
    { to: '/explain', label: 'SHAP Attribution' },
    { to: '/models', label: 'Benchmark' },
    { to: '/assistant', label: 'Medical AI (RAG)' },
    { to: '/sources', label: 'Knowledge Base' },
    { to: '/about', label: 'M1–M5 Rubric' },
  ];

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
          <h1 className="masthead__title">CLINICAL AI</h1>
          <p className="masthead__sub">CARDIOVASCULAR TELEMETRY · SHAP · GROQ RAG</p>
        </div>
      </div>

      <div className="masthead__right">
        <span className="badge badge--approx">
          SESSION 2026–2027 · CSET343
        </span>

        <div className="status">
          <span className={`dot ${dotClass}`} />
          <span className="status__text">{statusText}</span>
        </div>

        <nav className="seg">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
