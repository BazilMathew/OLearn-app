import tasksData from '../config/tasks.json';
import { SupportedLanguage, TaskConfig } from '../types/task';
import { apiPost } from './apiClient';

export interface RouteResult {
  matched: boolean;
  taskId?: string;
  clarifyQuestion?: {
    text: string;
    options: Array<{ taskId: string; label: string }>;
  };
}

const TASKS = tasksData as TaskConfig[];

export const TaskRouterService = {
  /**
   * Routes user input (spoken or typed) to one of the 8 fixed tasks.
   * First asks the OLearn server, which classifies with an LLM.
   * When offline or the server is unavailable, uses a comprehensive multilingual
   * semantic classifier matching English, Hindi, and Malayalam natural language intents.
   */
  async routeQuery(query: string, language: SupportedLanguage): Promise<RouteResult> {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return { matched: false };
    }

    const remoteResult = await apiPost<RouteResult>('/api/route', {
      query,
      language,
      tasks: TASKS.map(t => ({ id: t.task_id, title: t.title.en }))
    });
    if (remoteResult && (remoteResult.taskId || remoteResult.clarifyQuestion)) {
      return remoteResult;
    }

    return this.localSemanticMatch(trimmed, language);
  },

  localSemanticMatch(query: string, language: SupportedLanguage): RouteResult {
    const q = query.toLowerCase();

    // Check for ambiguity first:
    // 1. Calling ambiguity (Voice vs Video Call)
    const callKeywords = ['call', 'कॉल', 'बात करनी', 'വിളിക്കുക', 'കോൾ'];
    const isCall = callKeywords.some(w => q.includes(w));
    const isVideoExplicit = ['video', 'वीडियो', 'വീഡിയോ', 'चेहरा', 'face'].some(w => q.includes(w));
    const isVoiceExplicit = ['voice', 'वॉइस', 'audio', 'ഓഡിയോ', 'സംസാരിക്കാൻ', 'फोन'].some(w => q.includes(w));

    if (isCall && !isVideoExplicit && !isVoiceExplicit) {
      // Ambiguous between Voice Call and Video Call
      return {
        matched: false,
        clarifyQuestion: {
          text: language === 'hi'
            ? 'क्या आप सामान्य वॉइस कॉल करना चाहते हैं या वीडियो कॉल?'
            : language === 'ml'
            ? 'നിങ്ങൾക്ക് സാധാരണ വോയ്സ് കോളാണോ അതോ വീഡിയോ കോളാണോ ചെയ്യേണ്ടത്?'
            : 'Would you like to make a regular Voice Call or a Video Call?',
          options: [
            {
              taskId: 'whatsapp_voice_call',
              label: language === 'hi' ? 'फ़ोन / वॉइस कॉल' : language === 'ml' ? 'വോയ്സ് കോൾ' : 'Voice Call'
            },
            {
              taskId: 'whatsapp_video_call',
              label: language === 'hi' ? 'वीडियो कॉल' : language === 'ml' ? 'വീഡിയോ കോൾ' : 'Video Call'
            }
          ]
        }
      };
    }

    if (isVideoExplicit || (isCall && q.includes('video'))) {
      return { matched: true, taskId: 'whatsapp_video_call' };
    }
    if (isVoiceExplicit || (isCall && !isVideoExplicit)) {
      return { matched: true, taskId: 'whatsapp_voice_call' };
    }

    // 2. Paying ambiguity: QR code vs Saved contact vs Check balance
    const payKeywords = ['pay', 'money', 'पैसे', 'रुपये', 'भेजने', 'പണം', 'രൂപ', 'അയക്കുക', 'നൽകുക'];
    const isPay = payKeywords.some(w => q.includes(w));
    const isQRExplicit = ['qr', 'scan', 'क्यूआर', 'स्कैन', 'दुकान', 'ബോർഡ്', 'ക്യുആർ', 'കോഡ്', 'സ്കാൻ'].some(w => q.includes(w));
    const isContactExplicit = ['son', 'contact', 'ramesh', 'बेटा', 'रमेश', 'संपर्क', 'മകൻ', 'രമേഷ്', 'കോൺടാക്റ്റ്'].some(w => q.includes(w));
    const isBalanceExplicit = ['balance', 'बैलेंस', 'खाता', 'रुपए कितने', 'രൂപ എത്ര', 'ബാലൻസ്', 'അക്കൗണ്ട്'].some(w => q.includes(w));
    const isHistoryExplicit = ['history', 'statement', 'receipt', 'इतिहास', 'पासबुक', 'രസീത്', 'ചരിത്രം', 'പഴയ'].some(w => q.includes(w));

    if (isBalanceExplicit) {
      return { matched: true, taskId: 'gpay_check_balance' };
    }
    if (isHistoryExplicit) {
      return { matched: true, taskId: 'gpay_transaction_history' };
    }
    if (isQRExplicit) {
      return { matched: true, taskId: 'gpay_scan_qr' };
    }
    if (isContactExplicit) {
      return { matched: true, taskId: 'gpay_send_contact' };
    }

    if (isPay) {
      // Ambiguous pay intent: Ask QR or Contact
      return {
        matched: false,
        clarifyQuestion: {
          text: language === 'hi'
            ? 'आप दुकान पर क्यूआर कोड से भुगतान करना चाहते हैं या किसी संपर्क को पैसे भेजना चाहते हैं?'
            : language === 'ml'
            ? 'കടയിൽ ക്യുആർ കോഡ് സ്കാൻ ചെയ്തോ അതോ കോൺടാക്റ്റിലുള്ള ആൾക്കോ പണം നൽകേണ്ടത്?'
            : 'Do you want to scan a shop QR code, or send money to a saved contact?',
          options: [
            {
              taskId: 'gpay_scan_qr',
              label: language === 'hi' ? 'दुकान पर क्यूआर कोड स्कैन' : language === 'ml' ? 'ക്യുആർ സ്കാൻ ചെയ്ത് നൽകുക' : 'Scan QR Code'
            },
            {
              taskId: 'gpay_send_contact',
              label: language === 'hi' ? 'संपर्क (बेटे) को पैसे भेजें' : language === 'ml' ? 'കുടുംബാംഗത്തിന് പണം അയക്കുക' : 'Send to Contact'
            }
          ]
        }
      };
    }

    // 3. Photo intent
    if (['photo', 'picture', 'image', 'फोटो', 'तस्वीर', 'ചിത്രം', 'ഫോട്ടോ'].some(w => q.includes(w))) {
      return { matched: true, taskId: 'whatsapp_send_photo' };
    }

    // 4. Voice note intent
    if (['voice note', 'बोलकर', 'audio message', 'വോയ്സ് നോട്ട്', 'ശബ്ദ സന്ദേശം'].some(w => q.includes(w))) {
      return { matched: true, taskId: 'whatsapp_voice_message' };
    }

    // 5. Text message intent
    if (['text', 'message', 'msg', 'मैसेज', 'संदेश', 'സന്ദേശം', 'മെസ്സേജ്'].some(w => q.includes(w))) {
      return { matched: true, taskId: 'whatsapp_send_text' };
    }

    // Default fallback: No clear match
    return {
      matched: false,
      clarifyQuestion: {
        text: language === 'hi'
          ? 'क्या आप व्हाट्सएप पर संदेश/कॉल सीखना चाहते हैं, या गूगल पे पर पैसे भेजना?'
          : language === 'ml'
          ? 'വാട്ട്‌സ്ആപ്പിൽ മെസ്സേജ് അയക്കാനാണോ, ഗൂഗിൾ പേയിൽ പണം അയക്കാനാണോ പഠിക്കേണ്ടത്?'
          : 'Would you like to learn WhatsApp messaging/calling, or Google Pay payments?',
        options: [
          {
            taskId: 'whatsapp_send_text',
            label: language === 'hi' ? 'व्हाट्सएप मैसेज भेजें' : language === 'ml' ? 'വാട്ട്സ്ആപ്പ് മെസ്സേജ്' : 'WhatsApp Message'
          },
          {
            taskId: 'gpay_scan_qr',
            label: language === 'hi' ? 'गूगल पे क्यूआर कोड स्कैन' : language === 'ml' ? 'ഗൂഗിൾ പേ ക്യുആർ' : 'Google Pay QR Scan'
          }
        ]
      }
    };
  }
};
