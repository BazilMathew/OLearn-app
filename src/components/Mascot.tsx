import React from 'react';

interface MascotProps {
  size?: number;
  className?: string;
}

// Mitra: OLearn's own helper, a round marigold pebble with a leaf sprout.
// Bob and blink are CSS-only (index.css) and stop under Reduce motion.
// Decorative only, so it is hidden from screen readers.
export const Mascot: React.FC<MascotProps> = ({ size = 96, className = '' }) => (
  <div className={`mitra-bob flex-shrink-0 ${className}`} style={{ width: size, height: size }} aria-hidden="true">
    <MitraSvg />
  </div>
);

export const MitraSvg: React.FC = () => (
  <svg viewBox="0 0 120 120" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    {/* sprout */}
    <path d="M60 30 C60 22 60 16 61 10" stroke="#3F7A3A" strokeWidth="4" strokeLinecap="round" fill="none" />
    <path d="M61 14 C66 4 80 4 84 8 C80 17 68 19 61 14 Z" fill="#5E9E4A" stroke="#3F7A3A" strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M59 18 C54 10 42 10 38 14 C43 22 53 23 59 18 Z" fill="#7DB65F" stroke="#3F7A3A" strokeWidth="2.5" strokeLinejoin="round" />
    {/* solid ground shadow */}
    <ellipse cx="60" cy="110" rx="34" ry="5" fill="#E4D9CB" />
    {/* body */}
    <path
      d="M60 28 C88 28 104 48 104 72 C104 94 86 106 60 106 C34 106 16 94 16 72 C16 48 32 28 60 28 Z"
      fill="#F7B733"
      stroke="#8A5207"
      strokeWidth="3"
    />
    {/* belly highlight */}
    <ellipse cx="60" cy="80" rx="28" ry="20" fill="#FCD27A" />
    {/* eyes */}
    <ellipse className="mitra-eye" cx="45" cy="62" rx="5" ry="7" fill="#2B2620" />
    <ellipse className="mitra-eye" cx="75" cy="62" rx="5" ry="7" fill="#2B2620" />
    <circle cx="47" cy="59" r="1.8" fill="#FFFDF9" />
    <circle cx="77" cy="59" r="1.8" fill="#FFFDF9" />
    {/* cheeks */}
    <ellipse cx="35" cy="76" rx="7" ry="4.5" fill="#F08A6C" opacity="0.7" />
    <ellipse cx="85" cy="76" rx="7" ry="4.5" fill="#F08A6C" opacity="0.7" />
    {/* smile */}
    <path d="M51 77 C55 83 65 83 69 77" stroke="#2B2620" strokeWidth="3.5" strokeLinecap="round" fill="none" />
  </svg>
);
