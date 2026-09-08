import { SupportedLanguage } from '../types/task';

export interface STTListener {
  onTranscript: (text: string) => void;
  onError: (error: string) => void;
  onListeningChange: (isListening: boolean) => void;
}

export class STTService {
  private recognition: any = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private isListening: boolean = false;

  constructor() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
    }
  }

  public isSupported(): boolean {
    return !!(this.recognition || (navigator.mediaDevices && window.MediaRecorder));
  }

  public startListening(language: SupportedLanguage, listener: STTListener, apiKey?: string): void {
    if (this.isListening) return;

    if (this.recognition) {
      // Use Device Web Speech API (Fast, Free, Native on Android Chrome)
      if (language === 'hi') this.recognition.lang = 'hi-IN';
      else if (language === 'ml') this.recognition.lang = 'ml-IN';
      else this.recognition.lang = 'en-IN';

      this.recognition.onstart = () => {
        this.isListening = true;
        listener.onListeningChange(true);
      };

      this.recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        listener.onTranscript(transcript);
      };

      this.recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        listener.onError(event.error);
        this.isListening = false;
        listener.onListeningChange(false);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        listener.onListeningChange(false);
      };

      try {
        this.recognition.start();
      } catch (err) {
        console.warn('Recognition start failed:', err);
        listener.onError('Could not start microphone');
      }
      return;
    }

    // Fallback: If Whisper API key is provided, record audio using MediaRecorder
    if (navigator.mediaDevices && window.MediaRecorder && apiKey) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        this.audioChunks = [];
        this.mediaRecorder = new MediaRecorder(stream);
        this.mediaRecorder.ondataavailable = (e) => this.audioChunks.push(e.data);
        this.mediaRecorder.onstop = async () => {
          this.isListening = false;
          listener.onListeningChange(false);
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
          try {
            const transcript = await this.sendToWhisper(audioBlob, language, apiKey);
            listener.onTranscript(transcript);
          } catch (e: any) {
            listener.onError(e.message || 'Whisper transcription failed');
          }
        };

        this.mediaRecorder.start();
        this.isListening = true;
        listener.onListeningChange(true);
      }).catch(err => {
        listener.onError('Microphone access denied');
      });
    } else {
      listener.onError('Speech recognition not available on this browser');
    }
  }

  public stopListening(): void {
    if (this.recognition && this.isListening) {
      try { this.recognition.stop(); } catch(e){}
    }
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try { this.mediaRecorder.stop(); } catch(e){}
    }
    this.isListening = false;
  }

  private async sendToWhisper(audioBlob: Blob, language: SupportedLanguage, apiKey: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', language);

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      },
      body: formData
    });

    if (!res.ok) throw new Error('Whisper API transcription failed');
    const data = await res.json();
    return data.text || '';
  }
}
