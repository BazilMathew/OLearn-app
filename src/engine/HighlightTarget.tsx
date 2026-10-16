import React, { useEffect, useRef } from 'react';

interface HighlightTargetProps {
  elementId: string;
  activeHighlightId: string;
  onCorrectTap: () => void;
  onWrongTap: () => void;
  /** Goes up by one on every wrong tap; the highlighted target answers with one gentle wobble. */
  nudgeKey?: number;
  className?: string;
  children: React.ReactNode;
}

const motionReduced = () =>
  document.documentElement.classList.contains('reduce-motion') ||
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Small sideways wobble, 300ms, once (transform only)
const WOBBLE: Keyframe[] = [
  { transform: 'translateX(0)' },
  { transform: 'translateX(-5px)' },
  { transform: 'translateX(5px)' },
  { transform: 'translateX(-3px)' },
  { transform: 'translateX(0)' }
];

/**
 * HighlightTarget wraps a screen component.
 * If its elementId matches the active step's highlight_element, it renders with a thick,
 * high-contrast outline, a soft pulsing ring and a pointer icon, and routes clicks to onCorrectTap.
 * If it is inert, clicking it triggers a gentle nudge (toast + sound) without penalty.
 */
export const HighlightTarget: React.FC<HighlightTargetProps> = ({
  elementId,
  activeHighlightId,
  onCorrectTap,
  onWrongTap,
  nudgeKey = 0,
  className = '',
  children
}) => {
  const isHighlighted = elementId === activeHighlightId;
  const ref = useRef<HTMLDivElement>(null);

  // When this becomes the step's target (or its screen appears), bring it fully into view if it is not.
  // Waits for the 250ms screen-enter slide so the measurement is final.
  useEffect(() => {
    if (!isHighlighted) return;
    const timer = setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const margin = 16; // room for the soft ring
      for (let p = el.parentElement; p; p = p.parentElement) {
        if (!/auto|scroll/.test(getComputedStyle(p).overflowY)) continue;
        const pr = p.getBoundingClientRect();
        if (r.top - margin < pr.top || r.bottom + margin > pr.bottom) {
          el.scrollIntoView({ block: 'center', behavior: motionReduced() ? 'auto' : 'smooth' });
          return;
        }
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [isHighlighted]);

  useEffect(() => {
    if (!isHighlighted || nudgeKey === 0 || motionReduced()) return;
    ref.current?.animate?.(WOBBLE, { duration: 300, easing: 'ease-in-out' });
  }, [nudgeKey]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isHighlighted) {
      onCorrectTap();
    } else {
      onWrongTap();
    }
  };

  // Circular targets pass rounded-full; everything else gets a soft rounded ring
  const radius = /(^|\s)rounded-/.test(className) ? '' : 'rounded-2xl';

  return (
    <div
      ref={ref}
      onClick={handleClick}
      className={`relative select-none cursor-pointer ${radius} ${isHighlighted ? 'highlight-active' : ''} ${className}`}
      data-element-id={elementId}
    >
      {children}
      {isHighlighted && (
        <div className="absolute -top-4 -right-4 z-40 bg-accent text-ink p-1.5 rounded-full border-2 border-ink pointer-events-none flex items-center justify-center" aria-hidden="true">
          <svg className="w-6 h-6 text-ink fill-current" viewBox="0 0 24 24">
            <path d="M9 11.24V7.5a2.5 2.5 0 0 1 5 0v3.74c1.21-.81 2-2.18 2-3.74a4.5 4.5 0 0 0-9 0c0 1.56.79 2.93 2 3.74zm9.84 4.63l-4.54-2.26c-.17-.09-.37-.14-.56-.14H13v-6a1 1 0 0 0-2 0v7.61l-3.32-.7a1.99 1.99 0 0 0-1.74.52l-.84.84 5.09 5.09c.56.56 1.33.88 2.13.88h5.36c1.54 0 2.83-1.16 2.98-2.69l.43-4.32a1.8 1.8 0 0 0-.75-1.83z" />
          </svg>
        </div>
      )}
    </div>
  );
};
