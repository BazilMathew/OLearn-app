import React from 'react';
import { useRipple } from './useRipple';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** Solid shadow colour; defaults to the warm line colour. */
  shade?: string;
  /** When set, the card is a pressable button. */
  onClick?: () => void;
  ariaPressed?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', style, shade, onClick, ariaPressed }) => {
  const { onPointerDown, rippleNodes } = useRipple();
  const shadeStyle = { ['--shade' as string]: shade ?? '#E4D9CB', ...style };
  // Callers may pass their own background; otherwise the card sits on the warm surface colour.
  const bg = /(^|\s)bg-/.test(className) ? '' : 'bg-surface';

  if (!onClick) {
    return (
      <div
        style={{ boxShadow: `0 4px 0 0 ${shade ?? '#E4D9CB'}`, ...style }}
        className={`${bg} shrink-0 rounded-card border-2 border-line p-lg ${className}`}
      >
        {children}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={onPointerDown}
      aria-pressed={ariaPressed}
      style={shadeStyle}
      className={`pressable shrink-0 w-full text-left ${bg} rounded-card border-2 p-lg ${className}`}
    >
      {children}
      {rippleNodes}
    </button>
  );
};
