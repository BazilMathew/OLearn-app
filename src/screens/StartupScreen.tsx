import React, { useEffect, useRef } from 'react';
import { MitraSvg } from '../components/Mascot';

// How long the screen stays (the animation in index.css ends exactly then), with and without Reduce motion.
const DURATION_MS = 2500;
const REDUCED_MS = 1500;

interface StartupScreenProps {
  reduceMotion: boolean;
  onDone: () => void;
}

// Once per session: Mitra pops in, bounces, waves its sprout and blinks, then the name fades in.
// Tap anywhere to skip. Fixed sizes (ts-fixed): the Text size setting does not apply here.
export const StartupScreen: React.FC<StartupScreenProps> = ({ reduceMotion, onDone }) => {
  const doneRef = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDoneRef.current();
  };

  useEffect(() => {
    const systemReduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const timer = setTimeout(finish, reduceMotion || systemReduce ? REDUCED_MS : DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <button
      type="button"
      onClick={finish}
      aria-label="OLearn"
      className="startup ts-fixed absolute inset-0 z-50 w-full h-full bg-canvas flex flex-col items-center justify-center gap-lg select-none"
    >
      <div className="startup-pop" style={{ width: 160, height: 160 }}>
        <div className="startup-bounce w-full h-full">
          <MitraSvg />
        </div>
      </div>
      <span className="startup-name font-extrabold text-ink" style={{ fontSize: 44, lineHeight: 1.2 }}>
        OLearn
      </span>
    </button>
  );
};
