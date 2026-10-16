import React, { useState, useEffect } from 'react';
import { SupportedLanguage, TaskConfig } from '../types/task';
import { I18N } from '../config/i18n';
import { STTService } from '../services/STTService';
import { TaskRouterService, RouteResult } from '../services/TaskRouterService';
import { Mic, X, Send, HelpCircle, Loader2 } from 'lucide-react';

interface AskMeScreenProps {
  language: SupportedLanguage;
  tasks: TaskConfig[];
  onSelectTask: (task: TaskConfig) => void;
  onClose: () => void;
}

export const AskMeScreen: React.FC<AskMeScreenProps> = ({
  language,
  tasks,
  onSelectTask,
  onClose
}) => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [typedInput, setTypedInput] = useState<string>('');
  const [isRouting, setIsRouting] = useState<boolean>(false);
  const [clarifyData, setClarifyData] = useState<RouteResult['clarifyQuestion'] | null>(null);

  const t = I18N[language] || I18N.en;
  const stt = new STTService();

  const handleToggleMic = () => {
    if (isListening) {
      stt.stopListening();
      setIsListening(false);
      if (transcript.trim()) {
        processQuery(transcript);
      }
    } else {
      setClarifyData(null);
      setTranscript('');
      stt.startListening(
        language,
        {
          onTranscript: (text) => {
            setTranscript(text);
          },
          onError: (err) => {
            console.warn('STT Error:', err);
            setIsListening(false);
          },
          onListeningChange: (state) => {
            setIsListening(state);
          }
        }
      );
    }
  };

  const processQuery = async (queryText: string) => {
    if (!queryText.trim()) return;
    setIsRouting(true);
    setClarifyData(null);

    const result = await TaskRouterService.routeQuery(queryText, language);
    setIsRouting(false);

    if (result.matched && result.taskId) {
      const found = tasks.find(t => t.task_id === result.taskId);
      if (found) {
        onSelectTask(found);
        return;
      }
    }

    if (result.clarifyQuestion) {
      setClarifyData(result.clarifyQuestion);
    }
  };

  const handleTypedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (typedInput.trim()) {
      processQuery(typedInput);
      setTypedInput('');
    }
  };

  return (
    <div className="h-full w-full bg-slate-900 text-white flex flex-col justify-between p-6 select-none animate-fade-in relative">
      {/* Top Bar with Cancel / X */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="text-2xl font-black text-amber-400">{t.askMe}</div>
        <button
          onClick={() => {
            stt.stopListening();
            onClose();
          }}
          className="w-14 h-14 bg-slate-800 hover:bg-slate-700 rounded-2xl flex items-center justify-center text-white border-2 border-slate-600 active:bg-slate-600"
          title={t.cancel}
        >
          <X className="w-8 h-8" />
        </button>
      </div>

      {/* Main Interaction Zone */}
      <div className="flex-1 flex flex-col items-center justify-center my-auto space-y-6 text-center">
        <p className="text-2xl font-bold text-slate-200 max-w-sm">
          {t.askMeSubtitle}
        </p>

        {/* Large Centered Mic Button with Simple Pulsing Circle (No confusing waveforms) */}
        <div className="relative flex items-center justify-center py-4">
          {isListening && (
            <div className="absolute w-44 h-44 rounded-full bg-amber-400/30 animate-ping pointer-events-none" />
          )}
          <button
            onClick={handleToggleMic}
            className={`w-32 h-32 rounded-full flex items-center justify-center shadow-2xl border-4 transition-all duration-200 active:scale-95 ${
              isListening
                ? 'bg-rose-600 hover:bg-rose-700 border-white ring-8 ring-rose-500/40'
                : 'bg-amber-500 hover:bg-amber-400 border-amber-300 ring-8 ring-amber-400/30'
            }`}
          >
            <Mic className={`w-16 h-16 ${isListening ? 'text-white' : 'text-slate-950'}`} />
          </button>
        </div>

        {/* Persistent Large Text Label Beneath Mic Button AT ALL TIMES */}
        <div className="space-y-2">
          <div className="text-2xl font-extrabold text-amber-300">
            {isListening ? t.listening : t.tapAndSpeak}
          </div>
          {transcript && (
            <div className="bg-slate-800 border border-slate-700 p-3.5 rounded-2xl text-xl text-emerald-300 font-semibold max-w-xs mx-auto">
              "{transcript}"
            </div>
          )}
        </div>

        {isRouting && (
          <div className="flex items-center space-x-2 text-amber-400 text-xl font-bold">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Finding matching tutorial...</span>
          </div>
        )}

        {/* Clarifying Question Modal if ambiguous */}
        {clarifyData && (
          <div className="w-full bg-slate-800 border-2 border-amber-400 rounded-3xl p-5 text-left space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-start space-x-3">
              <HelpCircle className="w-7 h-7 text-amber-400 flex-shrink-0 mt-1" />
              <div className="text-xl font-bold text-white">
                {clarifyData.text}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {clarifyData.options.map((opt) => (
                <button
                  key={opt.taskId}
                  onClick={() => {
                    const found = tasks.find(t => t.task_id === opt.taskId);
                    if (found) onSelectTask(found);
                  }}
                  className="w-full min-h-[58px] bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xl rounded-2xl px-4 py-2 text-left flex items-center justify-between shadow-md"
                >
                  <span>{opt.label}</span>
                  <span>→</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Typed Input Fallback */}
      <form onSubmit={handleTypedSubmit} className="pt-2">
        <div className="flex items-center space-x-2 bg-slate-800 p-2 rounded-2xl border-2 border-slate-700">
          <input
            type="text"
            value={typedInput}
            onChange={(e) => setTypedInput(e.target.value)}
            placeholder={t.typePlaceholder}
            className="flex-1 bg-transparent text-white px-3 py-2 text-xl font-medium focus:outline-none placeholder-slate-400"
          />
          <button
            type="submit"
            className="w-14 h-14 bg-amber-500 hover:bg-amber-600 rounded-xl flex items-center justify-center text-slate-950 flex-shrink-0 font-bold"
          >
            <Send className="w-7 h-7" />
          </button>
        </div>
      </form>
    </div>
  );
};
