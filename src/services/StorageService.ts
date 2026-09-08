import { AppProfile, SupportedLanguage } from '../types/task';

const STORAGE_KEY = 'olearn_user_profile_v1';

const DEFAULT_PROFILE: AppProfile = {
  name: 'User',
  language: 'en',
  completedTasks: [],
  firstLaunchCompleted: false
};

export const StorageService = {
  getProfile(): AppProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return { ...DEFAULT_PROFILE, ...JSON.parse(data) };
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

  resetProgress(): void {
    const profile = this.getProfile();
    profile.completedTasks = [];
    this.saveProfile(profile);
  },

  setApiKey(key: string): void {
    const profile = this.getProfile();
    profile.apiKey = key.trim();
    this.saveProfile(profile);
  }
};
