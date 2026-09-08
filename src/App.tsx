import React, { useState, useEffect } from 'react';
import tasksData from './config/tasks.json';
import { SupportedLanguage, TaskConfig } from './types/task';
import { StorageService } from './services/StorageService';
import { I18N } from './config/i18n';
import { HomeScreen } from './screens/HomeScreen';
import { TaskListScreen } from './screens/TaskListScreen';
import { TaskEngine } from './engine/TaskEngine';
import { AskMeScreen } from './screens/AskMeScreen';
import { LanguageSelectScreen } from './screens/LanguageSelectScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { Home, Settings, Smartphone, Maximize2, Wifi, Battery, Signal } from 'lucide-react';

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

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center p-0 sm:p-4 bg-slate-950 text-slate-100 font-sans">
      {/* Desktop Helper Bar: Switch between Android Frame & Fullscreen */}
      <div className="w-full max-w-md hidden sm:flex items-center justify-between py-2 px-4 mb-2 text-sm text-slate-400">
        <span className="font-semibold tracking-wide">OLearn Senior Trainer</span>
        <button
          onClick={() => setUsePhoneFrame(!usePhoneFrame)}
          className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1 rounded-full text-xs font-bold border border-slate-700"
        >
          {usePhoneFrame ? <Maximize2 className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
          <span>{usePhoneFrame ? t.fullscreen : t.deviceFrame}</span>
        </button>
      </div>

      {/* Android Device Shell Container */}
      <div
        className={`w-full bg-black overflow-hidden relative flex flex-col justify-between transition-all duration-300 ${
          usePhoneFrame
            ? 'max-w-[430px] h-[92vh] max-h-[890px] rounded-[48px] phone-shell border-[10px] border-slate-800'
            : 'w-full h-screen rounded-none'
        }`}
      >
        {/* Mock Android Status Bar */}
        <div className="w-full bg-slate-900 text-white px-6 py-2 flex items-center justify-between text-xs font-bold z-40 select-none border-b border-slate-800/80">
          <span>10:30</span>
          <div className="w-24 h-4 bg-black rounded-full mx-auto" /> {/* Camera Pill Notch */}
          <div className="flex items-center space-x-2">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4" />
          </div>
        </div>

        {/* Dynamic App Content Screen */}
        <div className="flex-1 overflow-hidden relative bg-white">
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
              onExit={handleTutorialExit}
            />
          )}

          {screenState === 'ask_me' && (
            <AskMeScreen
              language={language}
              apiKey={profile.apiKey}
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
              onClose={() => setScreenState('home')}
            />
          )}
        </div>

        {/* Bottom Navigation (Max 2 icons: Home and Settings with explicit text labels) */}
        {screenState !== 'tutorial' && screenState !== 'first_launch' && (
          <div className="w-full bg-slate-900 border-t-2 border-slate-800 px-6 py-3 flex items-center justify-around z-30 select-none">
            <button
              onClick={() => setScreenState('home')}
              className={`flex flex-col items-center space-y-1 py-1 px-5 rounded-2xl transition-colors min-h-[56px] justify-center ${
                screenState === 'home' || screenState === 'task_list'
                  ? 'text-amber-400 bg-slate-800/80'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Home className="w-7 h-7" />
              <span className="text-base font-bold">{t.home}</span>
            </button>

            <button
              onClick={() => setScreenState('settings')}
              className={`flex flex-col items-center space-y-1 py-1 px-5 rounded-2xl transition-colors min-h-[56px] justify-center ${
                screenState === 'settings'
                  ? 'text-amber-400 bg-slate-800/80'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Settings className="w-7 h-7" />
              <span className="text-base font-bold">{t.settings}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
