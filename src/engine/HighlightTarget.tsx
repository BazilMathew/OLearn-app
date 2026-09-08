import React from 'react';

interface HighlightTargetProps {
  elementId: string;
  activeHighlightId: string;
  onCorrectTap: () => void;
  onWrongTap: () => void;
  className?: string;
  children: React.ReactNode;
}

/**
 * HighlightTarget wraps a screen component.
 * If its elementId matches the active step's highlight_element, it renders with a prominent,
 * high-contrast pulsing border and pointer icon, and routes clicks to onCorrectTap.
 * If it is inert, clicking it triggers a gentle nudge (toast + sound) without penalty.
 */
export const HighlightTarget: React.FC<HighlightTargetProps> = ({
  elementId,
  activeHighlightId,
  onCorrectTap,
  onWrongTap,
  className = '',
  children
}) => {
  const isHighlighted = elementId === activeHighlightId;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isHighlighted) {
      onCorrectTap();
    } else {
      onWrongTap();
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`relative transition-all duration-200 select-none cursor-pointer ${
        isHighlighted
          ? 'highlight-active z-30 ring-4 ring-amber-400 ring-offset-2 rounded-xl'
          : 'opacity-95 hover:opacity-90'
      } ${className}`}
      data-element-id={elementId}
    >
      {children}
      {isHighlighted && (
        <div className="absolute -top-3 -right-3 z-40 bg-amber-500 text-black p-1.5 rounded-full shadow-lg border-2 border-white pointer-events-none animate-bounce flex items-center justify-center">
          <svg className="w-6 h-6 text-black fill-current" viewBox="0 0 24 24">
            <path d="M9 11.24V7.5a2.5 2.5 0 0 1 5 0v3.74c1.21-.81 2-2.18 2-3.74a4.5 4.5 0 0 0-9 0c0 1.56.79 2.93 2 3.74zm9.84 4.63l-4.54-2.26c-.17-.09-.37-.14-.56-.14H13v-6a1 1 0 0 0-2 0v7.61l-3.32-.7a1.99 1.99 0 0 0-1.74.52l-.84.84 5.09 5.09c.56.56 1.33.88 2.13.88h5.36c1.54 0 2.83-1.16 2.98-2.69l.43-4.32a1.8 1.8 0 0 0-.75-1.83z" />
          </svg>
        </div>
      )}
    </div>
  );
};
