import { registerPlugin } from '@capacitor/core';

export interface VoiceDeviceInfo {
  manufacturer: string;
  model: string;
  sdkInt: number;
  release: string;
  /** The phone's default speech service (component name), "not set" or "not readable". */
  defaultVoiceService: string;
  googleApp: 'installed' | 'disabled' | 'missing';
}

interface VoiceHelperPlugin {
  /** handler: the package that shows the voice box, "" when none. */
  canShowVoiceDialog(): Promise<{ value: boolean; handler: string }>;
  getDeviceInfo(): Promise<VoiceDeviceInfo>;
}

/**
 * Android app only (android/app/src/main/java/com/olearn/app/VoiceHelperPlugin.java); the web never calls it.
 * Like every Capacitor plugin it must never be the value a promise resolves to: the proxy answers "then"
 * as if it were a native method, and that promise then waits forever.
 */
export const VoiceHelper = registerPlugin<VoiceHelperPlugin>('VoiceHelper');
