import React, { useState, useEffect, lazy, Suspense } from 'react';
import tasksData from './config/tasks.json';
import { SupportedLanguage, TaskConfig } from './types/task';
import { StorageService } from './services/StorageService';
import { I18N } from './config/i18n';
import { Home, Settings, Smartphone, Maximize2, Wifi, Battery, Signal } from 'lucide-react';

// Screens load on demand so the first download stays small on low-end phones.
const HomeScreen = lazy(() => import('./screens/HomeScreen').then((m) => ({ default: m.HomeScreen })));
const TaskListScreen = lazy(() => import('./screens/TaskListScreen').then((m) => ({ default: m.TaskListScreen })));
const TaskEngine = lazy(() => import('./engine/TaskEngine').then((m) => ({ default: m.TaskEngine })));
const AskMeScreen = lazy(() => import('./screens/AskMeScreen').then((m) => ({ default: m.AskMeScreen })));
const LanguageSelectScreen = lazy(() =>
  import('./screens/LanguageSelectScreen').then((m) => ({ default: m.LanguageSelectScreen }))
);
const SettingsScreen = lazy(() => import('./screens/SettingsScreen').then((m) => ({ default: m.SettingsScreen })));

type ScreenState = 'first_launch' | 'home' | 'task_list' | 'tutorial' | 'ask_me' | 'settings';

export const App: React.FC = () => {
  const [profile, setProfile] = useState(StorageService.getProfile());
  const [screenState, setScreenState] = useState<ScreenState>(() => {
    return profile.firstLaunchCompleted ? 'home' : 'first_launch';
  });
  const [selectedApp, setSelectedApp] = useState<'whatsapp' | 'gpay'>('whatsapp');
  const [activeTask, setActiveTask] = useState<TaskConfig | null>(null);
  const [usePhoneFrame, setUsePhoneFrame] = useState<boolean>(true);

  const tasks = tasksData as TaskConfig[];
  const language = profile.language;
  const t = I18N[language] || I18N.en;

  // In-app Reduce motion: a class on <html> switches off every animation (see index.css)
  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', profile.reduceMotion);
  }, [profile.reduceMotion]);

  // Sync profile state when storage changes
  const reloadProfile = () => {
    setProfile(StorageService.getProfile());
  };

  const handleLanguageSelect = (newLang: SupportedLanguage) => {
    StorageService.setLanguage(newLang);
    reloadProfile();
    setScreenState('home');
  };

  const handleOpenAppTasks = (app: 'whatsapp' | 'gpay') => {
    setSelectedApp(app);
    setScreenState('task_list');
  };

  const handleSelectTask = (task: TaskConfig) => {
    setActiveTask(task);
    setScreenState('tutorial');
  };

  const handleTutorialExit = () => {
    reloadProfile();
    setActiveTask(null);
    setScreenState('task_list');
  };

  const navItemClass = (active: boolean) =>
    `pressable flex-1 max-w-[180px] min-h-[64px] flex flex-col items-center justify-center gap-xs px-lg rounded-btn border-2 ${
      active ? 'bg-accent-soft border-accent-deep text-ink' : 'bg-surface border-line text-ink-muted active:bg-canvas'
    }`;

  return (
    <div className="w-full min-h-[100dvh] flex flex-col items-center justify-center sm:p-lg font-sans">
      {/* Desktop Helper Bar: Switch between Android Frame & Fullscreen (640px and up only) */}
      <div className="w-full max-w-md hidden sm:flex items-center justify-between py-sm px-lg mb-sm text-label text-slate-300">
        <span className="font-semibold tracking-wide">OLearn Senior Trainer</span>
        <button
          onClick={() => setUsePhoneFrame(!usePhoneFrame)}
          className="min-h-[64px] flex items-center gap-sm bg-slate-800 hover:bg-slate-700 text-slate-100 px-lg rounded-full text-label font-bold border border-slate-600"
        >
          {usePhoneFrame ? <Maximize2 className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
          <span>{usePhoneFrame ? t.fullscreen : t.deviceFrame}</span>
        </button>
      </div>

      {/* App shell: full-bleed on phones, device frame from 640px up */}
      <div
        className={`safe-area w-full h-[100dvh] bg-canvas overflow-hidden relative flex flex-col ${
          usePhoneFrame
            ? 'sm:max-w-[430px] sm:h-[calc(100dvh-120px)] sm:max-h-[890px] sm:rounded-[48px] phone-shell sm:border-[10px] sm:border-slate-800'
            : 'sm:h-screen'
        }`}
      >
        {/* Mock Android Status Bar (desktop frame only; a real phone has its own) */}
        <div className="w-full bg-slate-900 text-white px-xl py-sm hidden sm:flex items-center justify-between text-label font-bold z-40 select-none">
          <span>10:30</span>
          <div className="w-24 h-4 bg-black rounded-full mx-auto" /> {/* Camera Pill Notch */}
          <div className="flex items-center gap-sm">
            <Signal className="w-4 h-4" />
            <Wifi className="w-4 h-4" />
            <Battery className="w-5 h-5" />
          </div>
        </div>

        {/* Dynamic App Content Screen */}
        <div className="flex-1 overflow-hidden relative bg-canvas text-ink">
          <Suspense fallback={<div className="h-full w-full bg-canvas" />}>
            <div key={screenState} className="screen-enter h-full w-full">
              {screenState === 'first_launch' && (
                <LanguageSelectScreen
                  currentLanguage={language}
                  onSelectLanguage={handleLanguageSelect}
                  isFirstLaunch={true}
                />
              )}

              {screenState === 'home' && (
                <HomeScreen
                  language={language}
                  onSelectApp={handleOpenAppTasks}
                  onOpenAskMe={() => setScreenState('ask_me')}
                />
              )}

              {screenState === 'task_list' && (
                <TaskListScreen
                  app={selectedApp}
                  tasks={tasks}
                  completedTaskIds={profile.completedTasks}
                  language={language}
                  onSelectTask={handleSelectTask}
                  onBack={() => setScreenState('home')}
                />
              )}

              {screenState === 'tutorial' && activeTask && (
                <TaskEngine
                  task={activeTask}
                  language={language}
                  replicaLanguage={profile.replicaLanguage}
                  onExit={handleTutorialExit}
                />
              )}

              {screenState === 'ask_me' && (
                <AskMeScreen
                  language={language}
                  tasks={tasks}
                  onSelectTask={handleSelectTask}
                  onClose={() => setScreenState('home')}
                />
              )}

              {screenState === 'settings' && (
                <SettingsScreen
                  language={language}
                  onLanguageChange={(newLang) => {
                    StorageService.setLanguage(newLang);
                    reloadProfile();
                  }}
                  reduceMotion={profile.reduceMotion}
                  onReduceMotionChange={(on) => {
                    StorageService.setReduceMotion(on);
                    reloadProfile();
                  }}
                  replicaLanguage={profile.replicaLanguage}
                  onReplicaLanguageChange={(mode) => {
                    StorageService.setReplicaLanguage(mode);
                    reloadProfile();
                  }}
                  onClose={() => setScreenState('home')}
                />
              )}
            </div>
          </Suspense>
        </div>

        {/* Bottom Navigation (Max 2 icons: Home and Settings with explicit text labels) */}
        {screenState !== 'tutorial' && screenState !== 'first_launch' && (
          <nav className="w-full bg-surface border-t-2 border-line px-lg py-sm flex items-center justify-around gap-lg z-30 select-none">
            <button
              onClick={() => setScreenState('home')}
              className={navItemClass(screenState === 'home' || screenState === 'task_list')}
            >
              <Home className="w-7 h-7" strokeWidth={2.5} />
              <span className="text-label font-bold">{t.home}</span>
            </button>

            <button
              onClick={() => setScreenState('settings')}
              className={navItemClass(screenState === 'settings')}
            >
              <Settings className="w-7 h-7" strokeWidth={2.5} />
              <span className="text-label font-bold">{t.settings}</span>
            </button>
          </nav>
        )}
      </div>
    </div>
  );
};
