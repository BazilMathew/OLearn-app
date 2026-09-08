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
  apiKey?: string;
  firstLaunchCompleted: boolean;
}
