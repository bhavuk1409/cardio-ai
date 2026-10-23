import React from 'react';

export function Colophon() {
  return (
    <footer className="colophon">
      <div>
        <span>CARDIO AI · CLINICAL RISK & RAG</span>
        <span className="ml-3 faint">SESSION 2026–2027</span>
      </div>

      <div className="faint text-center max-w-md hidden md:block">
        Educational Decision-Support Demo · Not a Medical Device
      </div>

      <div className="flex items-center gap-3">
        <span className="badge badge--trained">FASTAPI + REACT + GROQ</span>
        <span className="faint">BHAVUK AGRAWAL · GOYAL ANNAYAN</span>
      </div>
    </footer>
  );
}
