import React from 'react';
import { ArrowLeft, type LucideIcon } from 'lucide-react';
import { Button } from './Button';

interface ScreenHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  titleClassName?: string;
  onBack: () => void;
  backLabel: string;
  backIcon?: LucideIcon;
  /** Shown to the right of the back button (e.g. the Mitra helper). */
  aside?: React.ReactNode;
}

// Back button on its own row so long Hindi/Malayalam titles never get squeezed.
export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  titleClassName = 'text-ink',
  onBack,
  backLabel,
  backIcon = ArrowLeft,
  aside
}) => (
  <header className="space-y-md pb-lg">
    <div className="flex items-center justify-between gap-md">
      <Button icon={backIcon} label={backLabel} onClick={onBack} />
      {aside}
    </div>
    <div>
      <h1 className={`text-display ${titleClassName}`}>{title}</h1>
      {subtitle && <p className="text-label text-ink-muted mt-xs">{subtitle}</p>}
    </div>
  </header>
);
