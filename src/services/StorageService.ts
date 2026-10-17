import { AppProfile, SupportedLanguage } from '../types/task';

const STORAGE_KEY = 'olearn_user_profile_v1';

const DEFAULT_PROFILE: AppProfile = {
  name: 'User',
  language: 'en',
  completedTasks: [],
  firstLaunchCompleted: false,
  reduceMotion: false,
  replicaLanguage: 'en'
};

export const StorageService = {
  getProfile(): AppProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const merged = { ...DEFAULT_PROFILE, ...JSON.parse(data) };
        // Keep only known fields. This also deletes the OpenAI key older versions stored here.
        const profile: AppProfile = {
          name: merged.name,
          language: merged.language,
          completedTasks: merged.completedTasks,
          firstLaunchCompleted: merged.firstLaunchCompleted,
          reduceMotion: merged.reduceMotion === true,
          // Older profiles have no field: practice screens stay in English
          replicaLanguage: merged.replicaLanguage === 'follow' ? 'follow' : 'en'
        };
        if (Object.keys(merged).length !== Object.keys(profile).length) {
          this.saveProfile(profile);
        }
        return profile;
      }
    } catch (e) {
      console.warn('Failed to read profile from localStorage:', e);
    }
    return DEFAULT_PROFILE;
  },

  saveProfile(profile: AppProfile): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.error('Failed to save profile to localStorage:', e);
    }
  },

  setLanguage(lang: SupportedLanguage): void {
    const profile = this.getProfile();
    profile.language = lang;
    profile.firstLaunchCompleted = true;
    this.saveProfile(profile);
  },

  markTaskCompleted(taskId: string): void {
    const profile = this.getProfile();
    if (!profile.completedTasks.includes(taskId)) {
      profile.completedTasks.push(taskId);
      this.saveProfile(profile);
    }
  },

  setReduceMotion(on: boolean): void {
    const profile = this.getProfile();
    profile.reduceMotion = on;
    this.saveProfile(profile);
  },

  setReplicaLanguage(mode: 'en' | 'follow'): void {
    const profile = this.getProfile();
    profile.replicaLanguage = mode;
    this.saveProfile(profile);
  },

  resetProgress(): void {
    const profile = this.getProfile();
    profile.completedTasks = [];
    this.saveProfile(profile);
  }
};
