import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: LucideIcon;
  /** Visible label above the field. Without it, pass aria-label. */
  label?: string;
}

export const TextField: React.FC<TextFieldProps> = ({ icon: Icon, label, className = '', id, ...rest }) => {
  const autoId = React.useId();
  const fieldId = id ?? autoId;
  return (
    <div className={className}>
      {label && (
        <label htmlFor={fieldId} className="block text-label text-ink mb-sm">
          {label}
        </label>
      )}
      <div className="flex items-center gap-md min-h-[64px] px-lg bg-surface rounded-btn border-2 border-line focus-within:border-accent-deep focus-within:ring-4 focus-within:ring-accent/40">
        <Icon className="w-7 h-7 text-ink-muted flex-shrink-0" aria-hidden="true" />
        <input
          id={fieldId}
          {...rest}
          className="flex-1 min-w-0 bg-transparent text-body text-ink py-md focus:outline-none placeholder:text-ink-muted"
        />
      </div>
    </div>
  );
};
