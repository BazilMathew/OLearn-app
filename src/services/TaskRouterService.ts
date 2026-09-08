import tasksData from '../config/tasks.json';
import { SupportedLanguage, TaskConfig } from '../types/task';

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
   * If an API key is available, queries OpenAI GPT API with a strict system prompt.
   * Otherwise uses a comprehensive multilingual semantic classifier matching
   * English, Hindi, and Malayalam natural language intents.
   */
  async routeQuery(query: string, language: SupportedLanguage, apiKey?: string): Promise<RouteResult> {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return { matched: false };
    }

    if (apiKey) {
      try {
        const llmResult = await this.callLLMClassifier(query, language, apiKey);
        if (llmResult) return llmResult;
      } catch (err) {
        console.warn('LLM Router failed, falling back to local semantic matcher:', err);
      }
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
  },

  async callLLMClassifier(query: string, language: SupportedLanguage, apiKey: string): Promise<RouteResult | null> {
    const systemPrompt = `You are the task router for OLearn, an elderly digital literacy assistant in India.
The user is requesting assistance in English, Hindi, or Malayalam.
Match their request to EXACTLY ONE of the following 8 task IDs:
1. whatsapp_send_text: Send text message on WhatsApp
2. whatsapp_send_photo: Send a photo or picture on WhatsApp
3. whatsapp_voice_call: Make a voice phone call on WhatsApp
4. whatsapp_video_call: Make a face-to-face video call on WhatsApp
5. gpay_check_balance: Check bank account balance in Google Pay
6. gpay_scan_qr: Scan QR code at a shop to pay money in Google Pay
7. gpay_send_contact: Send money to a saved contact / family member in Google Pay
8. gpay_transaction_history: View previous payment history / passbook receipts in Google Pay

Return a valid JSON object ONLY with one of these structures:
If matched with confidence:
{"task_id": "one_of_the_8_ids"}

If ambiguous or unclear:
{"no_match": true, "clarify_question": "in-language clarifying question for elderly user", "options": [{"task_id": "id1", "label": "label1"}, {"task_id": "id2", "label": "label2"}]}`;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      })
    });

    if (!res.ok) throw new Error(`LLM call failed with status ${res.status}`);
    const data = await res.json();
    const parsed = JSON.parse(data.choices[0].message.content);

    if (parsed.task_id && TASKS.some(t => t.task_id === parsed.task_id)) {
      return { matched: true, taskId: parsed.task_id };
    }
    if (parsed.no_match) {
      return {
        matched: false,
        clarifyQuestion: {
          text: parsed.clarify_question || 'Please select one of the following:',
          options: parsed.options || []
        }
      };
    }
    return null;
  }
};
