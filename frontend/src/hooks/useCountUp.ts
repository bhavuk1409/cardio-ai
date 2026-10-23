import { useEffect, useRef, useState } from 'react';

/** Animate a number from its previous value to `target` over `duration` ms. */
export function useCountUp(target: number, duration = 800): number {
  const safeTarget = Number.isFinite(target) ? target : 0;
  const [value, setValue] = useState(safeTarget);
  const fromRef = useRef(safeTarget);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const from = fromRef.current;
    const start = performance.now();
    const delta = safeTarget - from;

    if (Math.abs(delta) < 0.0001) {
      setValue(safeTarget);
      fromRef.current = safeTarget;
      return;
    }

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      // easeOutExpo
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setValue(from + delta * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = safeTarget;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      fromRef.current = safeTarget;
    };
  }, [safeTarget, duration]);

  return value;
}
