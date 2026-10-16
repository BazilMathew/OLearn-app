import React from 'react';
import { SupportedLanguage, TaskConfig } from '../types/task';
import { I18N } from '../config/i18n';
import { ArrowLeft, CheckCircle, Play } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ScreenHeader } from '../components/ScreenHeader';

interface TaskListScreenProps {
  app: 'whatsapp' | 'gpay';
  tasks: TaskConfig[];
  completedTaskIds: string[];
  language: SupportedLanguage;
  onSelectTask: (task: TaskConfig) => void;
  onBack: () => void;
}

// Only the first few cards animate in; the rest appear at once.
const STAGGERED_CARDS = 6;
const STAGGER_MS = 40;

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
    <div className="h-full w-full bg-canvas flex flex-col p-lg select-none">
      {/* App Specific Header */}
      <ScreenHeader
        title={isWhatsApp ? t.whatsAppTitle : t.gpayTitle}
        titleClassName={isWhatsApp ? 'text-[#075E54]' : 'text-gpay-dark-blue'}
        subtitle={`${filteredTasks.length} ${t.tasksAvailable}`}
        onBack={onBack}
        backLabel={t.back}
      />

      {/* Task List: Vertically stacked full-width buttons, minimum 64dp height */}
      <div className="flex-1 overflow-y-auto space-y-lg pt-xs pb-lg -mx-xs px-xs">
        {filteredTasks.map((task, index) => {
          const isDone = completedTaskIds.includes(task.task_id);
          const staggered = index < STAGGERED_CARDS;
          return (
            <div
              key={task.task_id}
              className={staggered ? 'fade-up' : undefined}
              style={staggered ? { animationDelay: `${index * STAGGER_MS}ms` } : undefined}
            >
              <Card
                onClick={() => onSelectTask(task)}
                shade={isDone ? '#276B43' : undefined}
                className={`min-h-[88px] flex items-center gap-md ${
                  isDone ? 'bg-success-soft border-success active:bg-[#D2EADB]' : 'border-line active:bg-canvas'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-btn flex items-center justify-center text-title font-black flex-shrink-0 ${
                    isDone
                      ? 'bg-success text-white'
                      : isWhatsApp
                      ? 'bg-emerald-100 text-[#075E54]'
                      : 'bg-blue-100 text-gpay-dark-blue'
                  }`}
                >
                  {isDone ? <CheckCircle className="w-7 h-7" strokeWidth={2.5} /> : index + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-body font-extrabold text-ink">
                    {task.title[language] || task.title.en}
                  </div>
                  <div className="text-label font-medium text-ink-muted mt-xs line-clamp-1">
                    {task.description[language] || task.description.en}
                  </div>
                </div>

                <div
                  className={`w-12 h-12 rounded-btn flex items-center justify-center flex-shrink-0 ${
                    isDone ? 'bg-[#C6E3CF] text-success' : 'bg-accent text-ink'
                  }`}
                >
                  <Play className="w-6 h-6 fill-current ml-0.5" />
                </div>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Back Button */}
      <div className="pt-sm">
        <Button icon={ArrowLeft} label={t.back} variant="dark" fullWidth onClick={onBack} />
      </div>
    </div>
  );
};
