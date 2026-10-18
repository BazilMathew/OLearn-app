export type SupportedLanguage = 'en' | 'hi' | 'ml';

export interface LocalizedString {
  en: string;
  hi: string;
  ml: string;
  [key: string]: string; // Extensible to 4th language
}

export interface TaskStep {
  screen: string;
  highlight_element: string;
  audio_en: string;
  audio_hi: string;
  audio_ml: string;
  hint_text: LocalizedString;
  /** Last step only: practice screen shown for a moment after the final tap (e.g. the sent message). */
  result_screen?: string;
  [key: string]: any; // Extensible for extra language audio e.g. audio_ta
}

export interface TaskConfig {
  task_id: string;
  app: 'whatsapp' | 'gpay';
  title: LocalizedString;
  description: LocalizedString;
  steps: TaskStep[];
}

export interface AppProfile {
  name: string;
  language: SupportedLanguage;
  completedTasks: string[];
  firstLaunchCompleted: boolean;
  reduceMotion: boolean;
  /** Language of the mock WhatsApp / Google Pay screens: English, or follow the learner's language. */
  replicaLanguage: 'en' | 'follow';
  /** Text size of OLearn's own screens (not the practice screens): 1, 1.15, 1.3 or 1.5. */
  textScale: TextScale;
}

export const TEXT_SCALES = [1, 1.15, 1.3, 1.5] as const;
export type TextScale = (typeof TEXT_SCALES)[number];
