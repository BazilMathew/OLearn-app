import React, { useState } from 'react';

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

let nextId = 0;

const motionReduced = () =>
  document.documentElement.classList.contains('reduce-motion') ||
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Tap ripple for pressable surfaces. The element needs the "pressable" class (relative + overflow hidden).
export const useRipple = () => {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const onPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (motionReduced()) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const ripple = { id: nextId++, x: e.clientX - rect.left - size / 2, y: e.clientY - rect.top - size / 2, size };
    setRipples((list) => [...list, ripple]);
    setTimeout(() => setRipples((list) => list.filter((r) => r.id !== ripple.id)), 450);
  };

  const rippleNodes = ripples.map((r) => (
    <span
      key={r.id}
      className="ripple"
      style={{ left: r.x, top: r.y, width: r.size, height: r.size }}
      aria-hidden="true"
    />
  ));

  return { onPointerDown, rippleNodes };
};
