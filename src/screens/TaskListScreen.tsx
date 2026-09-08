import React from 'react';
import { SupportedLanguage, TaskConfig } from '../types/task';
import { I18N } from '../config/i18n';
import { ArrowLeft, CheckCircle, Play } from 'lucide-react';

interface TaskListScreenProps {
  app: 'whatsapp' | 'gpay';
  tasks: TaskConfig[];
  completedTaskIds: string[];
  language: SupportedLanguage;
  onSelectTask: (task: TaskConfig) => void;
  onBack: () => void;
}

export const TaskListScreen: React.FC<TaskListScreenProps> = ({
  app,
  tasks,
  completedTaskIds,
  language,
  onSelectTask,
  onBack
}) => {
  const t = I18N[language] || I18N.en;
  const filteredTasks = tasks.filter(t => t.app === app);
  const isWhatsApp = app === 'whatsapp';

  return (
    <div className="h-full w-full bg-slate-50 flex flex-col justify-between p-4 select-none animate-fade-in">
      {/* App Specific Header */}
      <div className="pb-3 border-b-2 border-gray-200">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2.5 bg-gray-200 hover:bg-gray-300 rounded-2xl text-gray-900 active:bg-gray-400"
          >
            <ArrowLeft className="w-8 h-8" />
          </button>
          <div>
            <h1 className={`text-3xl font-black ${isWhatsApp ? 'text-[#075E54]' : 'text-[#1A73E8]'}`}>
              {isWhatsApp ? t.whatsAppTitle : t.gpayTitle}
            </h1>
            <p className="text-lg font-bold text-gray-600">
              {filteredTasks.length} {t.tasksAvailable}
            </p>
          </div>
        </div>
      </div>

      {/* Task List: Vertically stacked full-width buttons, minimum 64dp height */}
      <div className="flex-1 overflow-y-auto space-y-4 py-4">
        {filteredTasks.map((task, index) => {
          const isDone = completedTaskIds.includes(task.task_id);
          return (
            <button
              key={task.task_id}
              onClick={() => onSelectTask(task)}
              className={`w-full min-h-[84px] text-left p-4 rounded-3xl border-3 shadow-md flex items-center justify-between transition-all duration-150 active:scale-[0.98] ${
                isDone
                  ? 'bg-emerald-50 border-emerald-500 hover:bg-emerald-100'
                  : 'bg-white border-gray-300 hover:border-amber-500 hover:bg-amber-50/50'
              }`}
            >
              <div className="flex items-center space-x-4 flex-1 pr-2">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-black flex-shrink-0 shadow-sm ${
                    isDone
                      ? 'bg-emerald-600 text-white'
                      : isWhatsApp
                      ? 'bg-emerald-100 text-[#075E54]'
                      : 'bg-blue-100 text-[#1A73E8]'
                  }`}
                >
                  {isDone ? <CheckCircle className="w-7 h-7" /> : index + 1}
                </div>

                <div>
                  <div className="text-2xl font-black text-gray-900 leading-tight">
                    {task.title[language] || task.title.en}
                  </div>
                  <div className="text-lg text-gray-600 font-semibold mt-0.5 line-clamp-1">
                    {task.description[language] || task.description.en}
                  </div>
                </div>
              </div>

              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                  isDone ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-400 text-slate-950'
                }`}
              >
                <Play className="w-6 h-6 fill-current ml-0.5" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Back Button */}
      <div className="pt-2">
        <button
          onClick={onBack}
          className="w-full min-h-[64px] bg-slate-800 hover:bg-slate-900 text-white text-xl font-bold rounded-2xl shadow-md flex items-center justify-center space-x-2"
        >
          <ArrowLeft className="w-6 h-6" />
          <span>{t.back}</span>
        </button>
      </div>
    </div>
  );
};
