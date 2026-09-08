import { SupportedLanguage } from '../types/task';

class AudioServiceClass {
  private currentAudio: HTMLAudioElement | null = null;
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;
  private speechRate: number = 0.9; // Elderly-friendly slightly slower pace

  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public setSpeechRate(rate: number) {
    this.speechRate = rate;
  }

  public getSpeechRate(): number {
    return this.speechRate;
  }

  public stopAudio(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  /**
   * Plays the narration for a task step.
   * Priority:
   * 1. Pre-recorded bundled local MP3 file
   * 2. Malayalam fallback: Google Translate's public TTS endpoint
   *    NOTE: Per PRD decision log, Google Translate's public TTS endpoint is an unofficial
   *    and free endpoint (https://translate.google.com/translate_tts?ie=UTF-8&tl=ml&client=tw-ob&q=...)
   *    used for high quality Malayalam narration without billing. In case of downtime,
   *    the service falls back to device SpeechSynthesis.
   * 3. Fallback: Browser/Device Web Speech Synthesis
   */
  public async playNarration(
    audioPath: string,
    language: SupportedLanguage,
    fallbackText?: string,
    onEnded?: () => void
  ): Promise<void> {
    this.stopAudio();

    // 1. Try playing pre-recorded audio from public path
    const resolvedPath = audioPath.startsWith('/') ? audioPath : '/' + audioPath;
    try {
      const audio = new Audio(resolvedPath);
      audio.playbackRate = this.speechRate;
      this.currentAudio = audio;

      audio.onended = () => {
        this.currentAudio = null;
        if (onEnded) onEnded();
      };

      audio.onerror = (e) => {
        console.warn(`Local audio failed for ${resolvedPath}, falling back to dynamic TTS:`, e);
        this.currentAudio = null;
        if (fallbackText) {
          this.playDynamicTTS(fallbackText, language, onEnded);
        }
      };

      await audio.play();
      return;
    } catch (err) {
      console.warn('Audio play threw error, using TTS fallback:', err);
      if (fallbackText) {
        this.playDynamicTTS(fallbackText, language, onEnded);
      }
    }
  }

  /**
   * Plays dynamic or fallback text.
   * For Malayalam: Uses Google Translate's public TTS endpoint directly.
   * For English & Hindi: Uses device speech synthesis.
   */
  public playDynamicTTS(text: string, language: SupportedLanguage, onEnded?: () => void): void {
    this.stopAudio();

    if (language === 'ml') {
      // Unofficial Google Translate TTS endpoint for Malayalam narration
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ml&client=tw-ob&q=${encodeURIComponent(text)}`;
      const audio = new Audio(url);
      audio.playbackRate = this.speechRate;
      this.currentAudio = audio;
      audio.onended = () => {
        this.currentAudio = null;
        if (onEnded) onEnded();
      };
      audio.onerror = () => {
        this.deviceSpeechFallback(text, 'ml', onEnded);
      };
      audio.play().catch(() => {
        this.deviceSpeechFallback(text, 'ml', onEnded);
      });
      return;
    }

    this.deviceSpeechFallback(text, language, onEnded);
  }

  private deviceSpeechFallback(text: string, language: SupportedLanguage, onEnded?: () => void): void {
    if (!('speechSynthesis' in window)) {
      if (onEnded) onEnded();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = this.speechRate;
    if (language === 'hi') utterance.lang = 'hi-IN';
    else if (language === 'ml') utterance.lang = 'ml-IN';
    else utterance.lang = 'en-IN';

    utterance.onend = () => {
      if (onEnded) onEnded();
    };
    utterance.onerror = () => {
      if (onEnded) onEnded();
    };

    window.speechSynthesis.speak(utterance);
  }

  // --- Sound Effects using Web Audio API ---
  public playCorrectSound(): void {
    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.18); // A5

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {
      console.warn('AudioContext SFX error:', e);
    }
  }

  public playNudgeSound(): void {
    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(330, ctx.currentTime); // E4
      osc.frequency.setValueAtTime(260, ctx.currentTime + 0.1); // C4

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } catch (e) {
      console.warn('AudioContext SFX error:', e);
    }
  }

  public playCelebrationSound(): void {
    try {
      const ctx = this.getAudioContext();
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = ctx.currentTime + idx * 0.12;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.25, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.35);
      });
    } catch (e) {
      console.warn('AudioContext celebration error:', e);
    }
  }
}

export const AudioService = new AudioServiceClass();
