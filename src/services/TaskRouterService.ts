import tasksData from '../config/tasks.json';
import { I18N } from '../config/i18n';
import { SupportedLanguage, TaskConfig } from '../types/task';
import { apiPost } from './apiClient';

export interface RouteResult {
  matched: boolean;
  taskId?: string;
  clarifyQuestion?: {
    text: string;
    options: Array<{ taskId: string; label: string }>;
  };
  // Nothing scored high enough: show "I didn't understand" and the task list.
  notUnderstood?: boolean;
}

const TASKS = tasksData as TaskConfig[];

// Weights: 3-5 = names this task clearly, 2 = intent shared by a few tasks,
// 1 = generic word (app names, send, check, code) that can never decide alone.
// Keywords of all three languages are used together, since speech is often code-mixed.
// "word*" matches any word starting with "word". Malayalam words ending in ്, ം or a chillu
// also match their inflected forms (കോഡ് → കോഡിൽ, ബാലൻസ് → ബാലൻസിൽ, കോൾ → കോളിൽ).
const WHATSAPP_APP = ['whatsapp', 'whats app', 'watsapp', 'व्हाट्सएप', 'व्हाट्सऐप', 'वॉट्सऐप', 'वाट्सएप', 'വാട്സ്ആപ്പ്', 'വാട്ട്സ്ആപ്പ്', 'വാട്സാപ്പ്', 'വാട്സ് ആപ്പ്'];
const GPAY_APP = ['gpay', 'g pay', 'google pay', 'googlepay', 'phonepe', 'paytm', 'upi', 'गूगल पे', 'जीपे', 'जी पे', 'यूपीआई', 'ജിപേ', 'ജി പേ', 'ഗൂഗിൾ പേ', 'ഗൂഗിൾപേ', 'യുപിഐ'];
const SEND = ['send*', 'भेज*', 'അയക്ക*', 'അയച്ച*'];
const PAY = ['pay', 'paying', 'payment*', 'money', 'पैसे', 'पैसा', 'रुपये', 'रुपए', 'भुगतान', 'पेमेंट', 'പണം', 'പൈസ', 'രൂപ', 'പേ', 'പേയ്മെന്റ്', 'പെയ്മെന്റ്', 'അടയ്ക്ക*', 'കൊടുക്ക*', 'നൽക*'];
const CALL = ['call*', 'कॉल', 'काल', 'कॉलिंग', 'കോൾ', 'കാൾ', 'വിളി*'];
const VOICE = ['voice', 'वॉइस', 'वॉयस', 'वाइस', 'വോയ്സ്', 'വോയിസ്'];

const w = (weight: number, words: string[]): Array<[string, number]> => words.map(word => [word, weight]);

const KEYWORDS: Record<string, Array<[string, number]>> = {
  whatsapp_send_text: [
    ...w(3, ['text*', 'message*', 'msg', 'sms', 'मैसेज', 'मेसेज', 'मसेज', 'संदेश', 'सन्देश', 'टेक्स्ट', 'एसएमएस', 'സന്ദേശം', 'മെസ്സേജ്', 'മെസേജ്', 'ടെക്സ്റ്റ്']),
    ...w(2, ['type*', 'typing', 'chat*', 'write', 'लिख*', 'टाइप', 'चैट', 'എഴുത*', 'ടൈപ്പ്', 'ചാറ്റ്']),
    ...w(1, [...SEND, ...WHATSAPP_APP])
  ],
  whatsapp_send_photo: [
    ...w(3, ['photo*', 'pic', 'pics', 'picture*', 'image*', 'gallery', 'selfie', 'फोटो', 'तस्वीर*', 'चित्र', 'इमेज', 'गैलरी', 'पिक्चर', 'ഫോട്ടോ*', 'ചിത്രം', 'പടം', 'പടങ്ങൾ', 'ഗാലറി', 'ഗ്യാലറി', 'ഇമേജ്', 'സെൽഫി']),
    ...w(1, [...SEND, ...WHATSAPP_APP])
  ],
  whatsapp_voice_call: [
    ...w(5, ['voice call*', 'audio call*', 'phone call*', 'वॉइस कॉल', 'वॉयस कॉल', 'वाइस कॉल', 'ऑडियो कॉल', 'फोन कॉल', 'വോയ്സ് കോൾ', 'വോയിസ് കോൾ', 'ഓഡിയോ കോൾ', 'ഫോൺ കോൾ', 'ഫോൺ വിളി*']),
    ...w(2, [...CALL, ...VOICE, 'ring', 'talk*', 'फोन', 'बात', 'സംസാരി*']),
    ...w(1, ['phone', 'ഫോൺ', ...WHATSAPP_APP])
  ],
  whatsapp_video_call: [
    ...w(5, ['video call*', 'वीडियो कॉल', 'विडियो कॉल', 'വീഡിയോ കോൾ', 'വിഡിയോ കോൾ']),
    ...w(3, ['video*', 'वीडियो', 'विडियो', 'വീഡിയോ', 'വിഡിയോ']),
    ...w(2, [...CALL, 'talk*', 'बात', 'സംസാരി*', 'face', 'चेहरा', 'चेहरे', 'देखकर', 'മുഖം']),
    ...w(1, WHATSAPP_APP)
  ],
  whatsapp_voice_message: [
    ...w(5, ['voice message*', 'voice note*', 'voice msg', 'audio message*', 'वॉइस मैसेज', 'वॉयस मैसेज', 'वाइस मैसेज', 'ऑडियो मैसेज', 'वॉइस नोट', 'आवाज संदेश', 'बोलकर संदेश', 'बोलकर मैसेज', 'വോയ്സ് മെസ്സേജ്', 'വോയ്സ് മെസേജ്', 'വോയിസ് മെസ്സേജ്', 'വോയ്സ് നോട്ട്', 'ഓഡിയോ മെസ്സേജ്', 'ശബ്ദ സന്ദേശം', 'ശബ്ദസന്ദേശം']),
    ...w(4, ['आवाज में']),
    ...w(3, ['record*', 'बोलकर', 'बोल कर', 'रिकॉर्ड*', 'रिकार्ड*', 'റെക്കോർഡ്', 'റെക്കോഡ്']),
    ...w(2, [...VOICE, 'audio', 'speaking', 'आवाज', 'ऑडियो', 'ശബ്ദം', 'ഓഡിയോ', 'പറഞ്ഞ്']),
    ...w(1, [...SEND, ...WHATSAPP_APP])
  ],
  whatsapp_search_contact: [
    ...w(5, ['search contact*', 'find contact*', 'find a contact*', 'संपर्क खोज*', 'संपर्क ढूंढ*', 'नंबर ढूंढ*', 'കോൺടാക്റ്റ് തിരയ*', 'ആളെ കണ്ടെത്ത*']),
    ...w(4, ['search*', 'find*', 'look for', 'खोज*', 'ढूंढ*', 'सर्च', 'तलाश*', 'തിരയ*', 'സെർച്ച്', 'കണ്ടെത്ത*', 'കണ്ടുപിടിക്ക*']),
    ...w(2, ['contact*', 'person', 'someone', 'name', 'number', 'संपर्क', 'कॉन्टैक्ट', 'नाम', 'नंबर', 'व्यक्ति', 'कोई', 'കോൺടാക്റ്റ്', 'ആളെ', 'ഒരാളെ', 'പേര്', 'നമ്പർ']),
    ...w(1, WHATSAPP_APP)
  ],
  whatsapp_send_document: [
    // "photo as a document" names this task, not the photo task: the phrase covers its "photo" word
    ...w(6, ['photo as document*', 'photo as a document*', 'photos as document*', 'फोटो को डॉक्यूमेंट*', 'फोटो डॉक्यूमेंट*', 'ഫോട്ടോ ഡോക്യുമെന്റ്']),
    ...w(5, ['document*', 'doc', 'docs', 'डॉक्यूमेंट*', 'डाक्यूमेंट*', 'दस्तावेज*', 'ഡോക്യുമെന്റ്', 'ഡോക്യുമെൻറ്', 'രേഖ*']),
    ...w(4, ['file*', 'pdf', 'full quality', 'original quality', 'फाइल*', 'पीडीएफ', 'पूरी क्वालिटी', 'ഫയൽ', 'പിഡിഎഫ്']),
    ...w(2, ['quality', 'क्वालिटी', 'ക്വാളിറ്റി', 'ഗുണമേന്മ*']),
    ...w(1, [...SEND, 'share*', ...WHATSAPP_APP])
  ],
  whatsapp_share_location: [
    ...w(5, ['location*', 'live location', 'लोकेशन', 'लोकेसन', 'लोकेशन*', 'ലൊക്കേഷൻ', 'ലോക്കേഷൻ']),
    ...w(4, ['where i am', 'where am i', 'कहां हूं', 'कहां हैं', 'എവിടെ*']),
    ...w(3, ['address', 'map*', 'place', 'पता बताना', 'नक्शा', 'मैप', 'जगह', 'സ്ഥലം', 'വിലാസം', 'അഡ്രസ്', 'മാപ്പ്']),
    ...w(1, [...SEND, 'share*', 'शेयर', 'ഷെയർ', ...WHATSAPP_APP])
  ],
  whatsapp_add_status: [
    // "photo status" names this task, not the photo task: the phrase covers its "photo" word
    ...w(6, ['photo status*', 'फोटो स्टेटस', 'ഫോട്ടോ സ്റ്റാറ്റസ്']),
    ...w(5, ['status*', 'story', 'stories', 'स्टेटस', 'स्टेट्स', 'സ്റ്റാറ്റസ്']),
    ...w(2, ['update*', 'post*', 'अपडेट', 'पोस्ट', 'അപ്ഡേറ്റ്*', 'പോസ്റ്റ്']),
    ...w(1, WHATSAPP_APP)
  ],
  whatsapp_block_number: [
    // "unknown number" and "scam message" name this task: the phrases cover "number" (a search word) and
    // "message" (a text word)
    ...w(6, ['unknown number*', 'अनजान नंबर', 'അറിയാത്ത നമ്പർ', 'അജ്ഞാത നമ്പർ']),
    ...w(6, ['scam message*', 'spam message*', 'fraud message*', 'फ्रॉड मैसेज', 'स्पैम मैसेज', 'തട്ടിപ്പ് മെസ്സേജ്*']),
    ...w(5, ['block*', 'ब्लॉक*', 'ब्लाक', 'ബ്ലോക്ക്*']),
    ...w(4, ['spam', 'scam*', 'fraud*', 'स्पैम', 'फ्रॉड', 'धोखा*', 'ठग*', 'തട്ടിപ്പ്*', 'സ്പാം']),
    ...w(2, ['stranger*', 'अनजान', 'അറിയാത്ത', 'തടയ*']),
    ...w(1, WHATSAPP_APP)
  ],
  whatsapp_forward_message: [
    // The phrases cover "message" and "send", words of the text task
    ...w(6, ['forward message*', 'forward a message*', 'मैसेज फॉरवर्ड*', 'മെസ്സേജ് ഫോർവേഡ്*', 'आगे भेज*']),
    ...w(5, ['forward*', 'फॉरवर्ड*', 'फारवर्ड*', 'ഫോർവേഡ്*', 'ഫോർവാർഡ്*', 'ഫോർവേർഡ്*']),
    ...w(1, WHATSAPP_APP)
  ],
  gpay_check_balance: [
    ...w(4, ['bank balance', 'account balance', 'how much money', 'कितने पैसे', 'कितना पैसा', 'कितने रुपये', 'कितने रुपए', 'पैसे कितने', 'रुपये कितने', 'रुपए कितने', 'എത്ര രൂപ', 'രൂപ എത്ര', 'എത്ര പണം', 'പണം എത്ര', 'എത്ര പൈസ', 'പൈസ എത്ര']),
    ...w(3, ['balance*', 'बैलेंस', 'बैलेन्स', 'बैलन्स', 'बेलेंस', 'शेष', 'बकाया', 'ബാലൻസ്', 'ബാലെൻസ്', 'ബാക്കി']),
    ...w(2, ['account*', 'how much', 'remaining', 'खाता', 'खाते', 'अकाउंट', 'അക്കൗണ്ട്', 'അക്കൌണ്ട്', 'എത്ര']),
    ...w(1, ['check*', 'चेक', 'जांच*', 'देख*', 'ചെക്ക്', 'നോക്ക*', ...GPAY_APP])
  ],
  gpay_scan_qr: [
    ...w(4, ['qr code', 'qrcode', 'क्यूआर कोड', 'ക്യൂആർ കോഡ്', 'ക്യുആർ കോഡ്']),
    ...w(3, ['qr', 'q r', 'scan*', 'barcode', 'क्यूआर', 'क्युआर', 'क्यू आर', 'स्कैन*', 'स्केन*', 'ക്യൂആർ', 'ക്യുആർ', 'ക്യൂ ആർ', 'ക്യു ആർ', 'സ്കാൻ', 'സ്ക്കാൻ']),
    ...w(2, [...PAY, 'shop*', 'store', 'दुकान*', 'കട', 'കടയിൽ', 'കടക്കാര*', 'ഷോപ്പ്']),
    ...w(1, ['code', 'कोड', 'കോഡ്', ...GPAY_APP])
  ],
  gpay_send_contact: [
    ...w(4, ['send money', 'पैसे भेज*', 'पैसा भेज*', 'रुपये भेज*', 'रुपए भेज*', 'പണം അയക്ക*', 'പൈസ അയക്ക*', 'രൂപ അയക്ക*', 'പണമയക്ക*']),
    ...w(3, ['transfer*', 'contact*', 'ट्रांसफर', 'संपर्क', 'कॉन्टैक्ट', 'ട്രാൻസ്ഫർ', 'കോൺടാക്റ്റ്', 'കോണ്ടാക്ട്']),
    ...w(2, PAY),
    ...w(1, ['son', 'daughter', 'ramesh', 'family', 'बेटा', 'बेटे', 'बेटी', 'रमेश', 'മകൻ', 'മകൾ', 'രമേഷ്', ...SEND, ...GPAY_APP])
  ],
  gpay_pay_upi_or_phone: [
    // Specific phrases only: a bare "phone number" belongs to the WhatsApp search. The phrases cover "send money"
    // (the send-money task) and "number" (a search word).
    ...w(6, ['pay anyone', 'upi id*', 'pay phone number*', 'pay a phone number*', 'pay to phone number*', 'pay to a phone number*',
      'send money to phone number*', 'send money to a phone number*', 'money to a phone number*', 'money to phone number*',
      'यूपीआई आईडी', 'फोन नंबर पर पैसे*', 'नंबर पर पैसे भेज*', 'फोन नंबर पर भुगतान*', 'किसी को भी पैसे*',
      'യുപിഐ ഐഡി*', 'നമ്പറിലേക്ക് പണം*', 'ഫോൺ നമ്പറിലേക്ക്*', 'ആർക്കും പണം*']),
    ...w(1, GPAY_APP)
  ],
  gpay_recharge_mobile: [
    ...w(8, ['recharge*', 'top up', 'topup', 'रिचार्ज*', 'रीचार्ज*', 'റീചാർജ്*', 'റിചാർജ്*']),
    ...w(3, ['prepaid', 'plan*', 'talktime', 'प्रीपेड', 'प्लान', 'टॉकटाइम', 'പ്രീപെയ്ഡ്', 'പ്ലാൻ*']),
    ...w(1, ['mobile', 'मोबाइल', 'മൊബൈൽ', ...GPAY_APP])
  ],
  gpay_bank_transfer: [
    // "bank transfer" covers "transfer" (a send-money word). A plain "bank account" is left out: it is a balance request.
    ...w(6, ['bank transfer*', 'to bank account*', 'to a bank account*', 'to my bank account*', 'into bank account*', 'account number*', 'ifsc*',
      'बैंक ट्रांसफर', 'बैंक खाते में पैसे भेज*', 'बैंक खाते में भेज*', 'खाता नंबर', 'अकाउंट नंबर', 'आईएफएससी',
      'ബാങ്ക് ട്രാൻസ്ഫർ', 'ബാങ്ക് അക്കൗണ്ടിലേക്ക്*', 'അക്കൗണ്ട് നമ്പർ*', 'ഐഎഫ്എസ്സി']),
    ...w(1, ['bank', 'बैंक', 'ബാങ്ക്', ...GPAY_APP])
  ],
  gpay_transaction_history: [
    ...w(4, ['money received', 'received money', 'पैसे मिले', 'ലഭിച്ച പണം']),
    ...w(4, ['past payment*', 'old payment*', 'previous payment*', 'payment record*', 'पुराने भुगतान', 'पुराने पेमेंट', 'പഴയ പേയ്മെന്റ്']),
    ...w(4, ['history', 'transaction*', 'statement*', 'receipt*', 'passbook', 'इतिहास', 'हिस्ट्री', 'लेनदेन', 'लेन देन', 'ट्रांजैक्शन', 'ट्रांजेक्शन', 'स्टेटमेंट', 'पासबुक', 'हिसाब', 'रसीद', 'ചരിത്രം', 'ഹിസ്റ്ററി', 'ഇടപാട്', 'ട്രാൻസാക്ഷൻ', 'സ്റ്റേറ്റ്മെന്റ്', 'രസീത്', 'പാസ്ബുക്ക്', 'കണക്ക്']),
    ...w(2, ['previous', 'past', 'spent', 'पुराने', 'पिछले', 'खर्च*', 'പഴയ', 'മുമ്പ*', 'മുൻപ്', 'ചെലവ*']),
    ...w(1, GPAY_APP)
  ]
};

// Route only when the best task scores at least MIN_SCORE and leads the runner-up by MARGIN.
const MIN_SCORE = 2;
const MARGIN = 2;

const CHILLU: Record<string, string> = { 'ണ': 'ൺ', 'ന': 'ൻ', 'ര': 'ർ', 'ല': 'ൽ', 'ള': 'ൾ', 'ക': 'ൿ' };
const CHILLU_BASE: Record<string, string> = { 'ൺ': 'ണ', 'ൻ': 'ന', 'ർ': 'ര', 'ൽ': 'ല', 'ൾ': 'ള', 'ൿ': 'ക' };

/** Lowercase, unify Unicode spellings, drop punctuation and Latin accents, collapse spaces. */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/([A-Za-z])[̀-ͯ]+/g, '$1') // Latin accents only; Indic vowel signs stay
    .normalize('NFC')
    .toLowerCase()
    .replace(/([ണനരലളക])്‍/g, (_, c: string) => CHILLU[c]) // old-style chillu → atomic
    .replace(/[​-‍﻿]/g, '') // zero-width joiners
    .replace(/़/g, '') // Hindi nukta: फ़ → फ
    .replace(/ँ/g, 'ं') // chandrabindu → anusvara
    .replace(/[\p{P}\p{S}]+/gu, ' ')
    .replace(/([a-z0-9])(?=[^\sa-z0-9])/g, '$1 ') // split "QRകോഡ്" → "qr കോഡ്"
    .replace(/([^\sa-z0-9])(?=[a-z0-9])/g, '$1 ')
    .replace(/\s+/g, ' ')
    .trim();
}

interface TokenMatcher { exact: string; prefix?: string }
interface CompiledKeyword { tokens: TokenMatcher[]; weight: number }

function compileToken(token: string): TokenMatcher {
  if (token.endsWith('*')) return { exact: token.slice(0, -1), prefix: token.slice(0, -1) };
  const last = token.slice(-1);
  let stem: string | undefined;
  if (last === '്' || last === 'ം') stem = token.slice(0, -1);
  else if (CHILLU_BASE[last]) stem = token.slice(0, -1) + CHILLU_BASE[last];
  return { exact: token, prefix: stem && [...stem].length >= 3 ? stem : undefined };
}

const COMPILED: Record<string, CompiledKeyword[]> = Object.fromEntries(
  Object.entries(KEYWORDS).map(([taskId, list]) => [
    taskId,
    list.map(([phrase, weight]) => ({
      weight,
      tokens: phrase.split(' ').flatMap(word => {
        const parts = normalizeText(word).split(' ');
        if (word.endsWith('*')) parts[parts.length - 1] += '*';
        return parts;
      }).map(compileToken)
    }))
  ])
);

const tokenMatches = (word: string, m: TokenMatcher) =>
  word === m.exact || (m.prefix !== undefined && word.startsWith(m.prefix));

/** Scores every task. A word inside a longer matched phrase only counts for that phrase. */
export function scoreTasks(normalized: string): Record<string, number> {
  const words = normalized ? normalized.split(' ') : [];
  const hits: Array<{ taskId: string; key: number; start: number; len: number; weight: number }> = [];
  for (const [taskId, keywords] of Object.entries(COMPILED)) {
    keywords.forEach((kw, key) => {
      for (let start = 0; start + kw.tokens.length <= words.length; start++) {
        if (kw.tokens.every((m, i) => tokenMatches(words[start + i], m))) {
          hits.push({ taskId, key, start, len: kw.tokens.length, weight: kw.weight });
        }
      }
    });
  }

  hits.sort((a, b) => b.len - a.len);
  const accepted: typeof hits = [];
  for (const hit of hits) {
    const covered = accepted.some(a => a.len > hit.len && hit.start < a.start + a.len && a.start < hit.start + hit.len);
    if (!covered) accepted.push(hit);
  }

  const scores: Record<string, number> = Object.fromEntries(Object.keys(COMPILED).map(id => [id, 0]));
  const counted = new Set<string>();
  for (const hit of accepted) {
    const id = `${hit.taskId}:${hit.key}`;
    if (counted.has(id)) continue;
    counted.add(id);
    scores[hit.taskId] += hit.weight;
  }
  return scores;
}

const pick = (language: SupportedLanguage, en: string, hi: string, ml: string) =>
  language === 'hi' ? hi : language === 'ml' ? ml : en;

function clarifyBetween(a: string, b: string, language: SupportedLanguage): RouteResult['clarifyQuestion'] {
  const pair = [a, b].sort().join('|');
  if (pair === 'whatsapp_video_call|whatsapp_voice_call') {
    return {
      text: pick(language,
        'Would you like to make a regular Voice Call or a Video Call?',
        'क्या आप सामान्य वॉइस कॉल करना चाहते हैं या वीडियो कॉल?',
        'നിങ്ങൾക്ക് സാധാരണ വോയ്സ് കോളാണോ അതോ വീഡിയോ കോളാണോ ചെയ്യേണ്ടത്?'),
      options: [
        { taskId: 'whatsapp_voice_call', label: pick(language, 'Voice Call', 'फ़ोन / वॉइस कॉल', 'വോയ്സ് കോൾ') },
        { taskId: 'whatsapp_video_call', label: pick(language, 'Video Call', 'वीडियो कॉल', 'വീഡിയോ കോൾ') }
      ]
    };
  }
  if (pair === 'gpay_scan_qr|gpay_send_contact') {
    return {
      text: pick(language,
        'Do you want to scan a shop QR code, or send money to a saved contact?',
        'आप दुकान पर क्यूआर कोड से भुगतान करना चाहते हैं या किसी संपर्क को पैसे भेजना चाहते हैं?',
        'കടയിൽ ക്യുആർ കോഡ് സ്കാൻ ചെയ്തോ അതോ കോൺടാക്റ്റിലുള്ള ആൾക്കോ പണം നൽകേണ്ടത്?'),
      options: [
        { taskId: 'gpay_scan_qr', label: pick(language, 'Scan QR Code', 'दुकान पर क्यूआर कोड स्कैन', 'ക്യുആർ സ്കാൻ ചെയ്ത് നൽകുക') },
        { taskId: 'gpay_send_contact', label: pick(language, 'Send to Contact', 'संपर्क (बेटे) को पैसे भेजें', 'കുടുംബാംഗത്തിന് പണം അയക്കുക') }
      ]
    };
  }
  const title = (id: string) => TASKS.find(t => t.task_id === id)?.title[language] ?? id;
  return {
    text: (I18N[language] || I18N.en).clarifyTitle,
    options: [a, b].map(taskId => ({ taskId, label: title(taskId) }))
  };
}

export const TaskRouterService = {
  /**
   * Routes user input (spoken or typed) to one of the fixed tasks.
   * First asks the OLearn server, which classifies with an LLM.
   * When offline or the server is unavailable, scores the text against
   * English, Hindi and Malayalam keywords on the device.
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
    const normalized = normalizeText(query);
    const scores = scoreTasks(normalized);

    const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const [[topId, top], [secondId, second]] = ranked;

    if (top < MIN_SCORE) {
      return { matched: false, notUnderstood: true };
    }
    if (top - second < MARGIN) {
      return { matched: false, clarifyQuestion: clarifyBetween(topId, secondId, language) };
    }
    return { matched: true, taskId: topId };
  }
};
