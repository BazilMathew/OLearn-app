import React, { useEffect, useRef, useState } from 'react';
import { SupportedLanguage } from '../types/task';
import { I18N } from '../config/i18n';
import { STTService, STTState, VoiceReport } from '../services/STTService';
import { VoiceHelper, VoiceDeviceInfo } from '../services/VoiceHelper';
import { Mic, Square, Copy, Check, Loader2 } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ScreenHeader } from '../components/ScreenHeader';

interface VoiceCheckScreenProps {
  language: SupportedLanguage;
  onClose: () => void;
}

// Technical values stay in English, so reports from every phone read the same.
const ROUTE_MEANING: Record<string, string> = {
  A: 'in-app recognizer',
  B: 'Google voice box',
  'A→B': 'in-app recognizer failed, then Google voice box',
  'A→C': 'in-app recognizer failed, no voice box',
  C: 'nothing on this phone can listen',
  '-': 'did not start'
};

const routeText = (route: string) => (route ? `${route} (${ROUTE_MEANING[route] ?? '?'})` : 'running');

/** Puts text on the clipboard; older Android WebViews only support the classic copy command. */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {}
  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  } catch {
    return false;
  }
}

/**
 * Android app: tries voice input once (route A first) and shows what happened, for colleagues to send in.
 * Nothing is stored or sent; the report exists only on screen and in the copied text.
 */
export const VoiceCheckScreen: React.FC<VoiceCheckScreenProps> = ({ language, onClose }) => {
  const t = I18N[language] || I18N.en;
  const sttRef = useRef<STTService | null>(null);
  if (!sttRef.current) sttRef.current = new STTService();
  const stt = sttRef.current;

  const [running, setRunning] = useState<boolean>(false);
  const [voiceState, setVoiceState] = useState<STTState>('idle');
  const [report, setReport] = useState<VoiceReport | null>(null);
  const [device, setDevice] = useState<VoiceDeviceInfo | null>(null);
  const [deviceError, setDeviceError] = useState<string>('');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');

  useEffect(() => {
    let live = true;
    VoiceHelper.getDeviceInfo()
      .then((info) => live && setDevice(info))
      .catch((err) => live && setDeviceError(String(err?.message ?? err)));
    return () => {
      live = false;
      stt.cancel();
    };
  }, [stt]);

  const handleTry = () => {
    if (voiceState === 'listening') {
      stt.stopListening();
      return;
    }
    if (running) return;
    setCopyStatus('idle');
    setRunning(true);
    // Always test the in-app recognizer first, even where it failed before.
    STTService.forgetVoiceBoxFirst();
    stt.startListening(language, {
      onInterim: () => {},
      onFinal: () => setReport(stt.getReport()),
      onError: () => setReport(stt.getReport()),
      onStateChange: (state) => {
        setVoiceState(state);
        if (state === 'idle') setRunning(false);
      },
      onReport: (r) => setReport(r)
    });
  };

  const phoneRows: Array<[string, string]> = device
    ? [
        ['Phone', `${device.manufacturer} ${device.model}`],
        ['Android', `${device.release} (SDK ${device.sdkInt})`],
        ['Google app', device.googleApp],
        ['Default voice service', device.defaultVoiceService]
      ]
    : [['Phone', deviceError ? `unknown (${deviceError})` : '…']];
  const factRows = report ? Object.entries(report.facts) : [];

  const buildReport = (): string => {
    const lines = ['OLearn voice check', `Time: ${new Date().toISOString()}`];
    phoneRows.forEach(([name, value]) => lines.push(`${name}: ${value}`));
    if (!report) {
      lines.push('Not tried yet');
    } else {
      lines.push(
        `Language: ${report.language}`,
        `Route: ${routeText(report.route)}`,
        `Why: ${report.reason || '-'}`,
        `Result: ${report.outcome || '-'}`,
        `Heard: ${report.heard ? `"${report.heard}"` : '-'}`
      );
      factRows.forEach(([name, value]) => lines.push(`${name}: ${value}`));
      lines.push('Events:', ...report.events);
    }
    return lines.join('\n');
  };

  const handleCopy = async () => {
    setCopyStatus((await copyText(buildReport())) ? 'copied' : 'failed');
  };

  const row = ([name, value]: [string, string]) => (
    <div key={name}>
      <dt className="text-label text-ink-muted">{name}</dt>
      <dd className="text-body text-ink break-words">{value}</dd>
    </div>
  );

  const tryLabel = voiceState === 'listening' ? t.voiceCheckStop : running ? t.voiceWorking : t.voiceCheckTry;

  return (
    <div className="h-full w-full bg-canvas flex flex-col p-lg overflow-y-auto">
      <ScreenHeader title={t.voiceCheck} onBack={onClose} backLabel={t.back} />

      <div className="space-y-xl pb-lg">
        <p className="text-body text-ink">{t.voiceCheckIntro}</p>

        <div className="space-y-sm">
          <Button
            icon={voiceState === 'listening' ? Square : running ? Loader2 : Mic}
            label={tryLabel}
            variant={voiceState === 'listening' ? 'danger' : 'primary'}
            fullWidth
            disabled={running && voiceState !== 'listening'}
            onClick={handleTry}
          />
          <p className="text-title text-ink text-center" role="status" aria-live="polite">
            {voiceState === 'listening' ? t.listening : voiceState === 'transcribing' ? t.voiceWorking : ''}
          </p>
        </div>

        <Card className="space-y-md">
          <h2 className="text-title text-ink">{t.voiceCheckResult}</h2>
          {report ? (
            <dl className="space-y-md">
              {row([t.voiceCheckRoute, routeText(report.route)])}
              {row([t.voiceCheckReason, report.reason || '-'])}
              {row([t.voiceCheckResult, report.outcome || '-'])}
              {row([t.voiceCheckHeard, report.heard ? `"${report.heard}"` : '-'])}
            </dl>
          ) : (
            <p className="text-body text-ink-muted">{t.voiceCheckNotRun}</p>
          )}
        </Card>

        <Card className="space-y-md">
          <h2 className="text-title text-ink">{t.voiceCheckPhone}</h2>
          <dl className="space-y-md">
            {phoneRows.map(row)}
            {factRows.map(row)}
          </dl>
        </Card>

        {report && report.events.length > 0 && (
          <Card className="space-y-md">
            <h2 className="text-title text-ink">{t.voiceCheckEvents}</h2>
            <ol className="space-y-xs text-label text-ink font-mono break-words">
              {report.events.map((event, i) => (
                <li key={i}>{event}</li>
              ))}
            </ol>
          </Card>
        )}

        <div className="space-y-sm">
          <Button icon={copyStatus === 'copied' ? Check : Copy} label={t.voiceCheckCopy} fullWidth onClick={handleCopy} />
          <p className="text-body font-bold text-center text-ink" aria-live="polite">
            {copyStatus === 'copied' ? t.voiceCheckCopied : copyStatus === 'failed' ? t.voiceCheckCopyFailed : ''}
          </p>
        </div>
      </div>
    </div>
  );
};
