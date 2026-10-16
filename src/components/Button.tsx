import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { useRipple } from './useRipple';

type Variant = 'primary' | 'dark' | 'secondary' | 'danger';

// Each variant pairs a fill with a darker solid "shade" used for the offset shadow.
const VARIANTS: Record<Variant, { className: string; shade: string }> = {
  primary: { className: 'bg-accent text-ink border-accent-deep active:bg-[#E59A2A]', shade: '#8A5207' },
  dark: { className: 'bg-ink text-surface border-ink active:bg-black', shade: '#000000' },
  secondary: { className: 'bg-surface text-ink border-line active:bg-canvas', shade: '#E4D9CB' },
  danger: { className: 'bg-danger-soft text-danger border-[#E8B4AE] active:bg-[#F6D5D1]', shade: '#E8B4AE' }
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label: React.ReactNode;
  variant?: Variant;
  fullWidth?: boolean;
  /** Puts the icon after the label (e.g. "Continue →"). */
  iconEnd?: boolean;
  /** Selected state for choice buttons (language, speed). */
  selected?: boolean;
  /** Content alignment; choice lists read better left-aligned. */
  align?: 'center' | 'start';
}

export const Button: React.FC<ButtonProps> = ({
  icon: Icon,
  label,
  variant = 'secondary',
  fullWidth = false,
  iconEnd = false,
  selected,
  align = 'center',
  className = '',
  style,
  onPointerDown,
  ...rest
}) => {
  const { onPointerDown: ripple, rippleNodes } = useRipple();
  const v = selected
    ? { className: 'bg-accent-soft text-ink border-accent-deep active:bg-[#F8DDB0]', shade: '#8A5207' }
    : VARIANTS[variant];

  return (
    <button
      type="button"
      {...rest}
      aria-pressed={selected}
      onPointerDown={(e) => {
        ripple(e);
        onPointerDown?.(e);
      }}
      style={{ ['--shade' as string]: v.shade, ...style }}
      className={`pressable shrink-0 min-h-[64px] px-xl py-md rounded-btn border-2 font-bold text-body flex items-center gap-md ${align === 'start' ? 'justify-start text-left' : 'justify-center'} ${
        fullWidth ? 'w-full' : ''
      } ${iconEnd ? 'flex-row-reverse' : ''} ${v.className} ${className}`}
    >
      <Icon className="w-7 h-7 flex-shrink-0" strokeWidth={2.5} aria-hidden="true" />
      <span className="min-w-0">{label}</span>
      {rippleNodes}
    </button>
  );
};
