// Checks offline Ask Me routing. Run: npx tsx scripts/test-matching.ts
import { TaskRouterService } from '../src/services/TaskRouterService';
import { SupportedLanguage } from '../src/types/task';

// Expected: a task id, "clarify:<id>|<id>" (either order) or "none" (didn't understand).
const CASES: Record<string, Record<SupportedLanguage, string[]>> = {
  whatsapp_send_text: {
    en: ['send a text message', 'how to send message on whatsapp', 'I want to type a message to my son', 'send SMS', 'texting'],
    hi: ['मैसेज कैसे भेजें', 'व्हाट्सएप पर संदेश भेजना है', 'टेक्स्ट मैसेज भेजो', 'बेटे को मैसेज लिखना है'],
    ml: ['മെസ്സേജ് അയക്കണം', 'വാട്ട്സ്ആപ്പിൽ സന്ദേശം അയക്കുന്നത് എങ്ങനെ', 'ടെക്സ്റ്റ് മെസേജ് അയക്കാൻ', 'മകന് ഒരു സന്ദേശം എഴുതണം']
  },
  whatsapp_send_photo: {
    en: ['send a photo', 'how do I share pictures on WhatsApp', 'send image from gallery', 'send my selfie to Ramesh'],
    hi: ['फोटो भेजना है', 'फ़ोटो कैसे भेजें', 'तस्वीर भेजो', 'गैलरी से फोटो भेजना'],
    ml: ['ഫോട്ടോ അയക്കണം', 'ചിത്രം അയക്കുന്നത് എങ്ങനെ', 'ഗ്യാലറിയിൽ നിന്ന് ഫോട്ടോ അയക്കാൻ', 'പടം അയക്കണം']
  },
  whatsapp_voice_call: {
    en: ['make a voice call', 'WhatsApp voice call', 'audio call my son', 'phone call on whatsapp'],
    hi: ['वॉइस कॉल करना है', 'व्हाट्सएप पर वॉयस कॉल', 'फोन कॉल कैसे करें', 'ऑडियो कॉल करना'],
    ml: ['വോയ്സ് കോൾ ചെയ്യണം', 'വാട്ട്സ്ആപ്പിൽ വോയിസ് കോൾ', 'ഫോൺ വിളിക്കാൻ', 'ഓഡിയോ കോൾ ചെയ്യുന്നത് എങ്ങനെ']
  },
  whatsapp_video_call: {
    en: ['make a video call', 'video calling on whatsapp', 'I want to see my son on video', 'video call Ramesh'],
    hi: ['वीडियो कॉल करना है', 'वीडियो कॉल कैसे करें', 'विडियो कॉल', 'बेटे से वीडियो पर बात'],
    ml: ['വീഡിയോ കോൾ ചെയ്യണം', 'വീഡിയോ കോൾ ചെയ്യുന്നത് എങ്ങനെ', 'മകനെ വീഡിയോ കോളിൽ വിളിക്കാൻ', 'വിഡിയോ കോൾ']
  },
  whatsapp_voice_message: {
    en: ['send a voice message', 'record a voice note', 'send audio message', 'how to record and send voice'],
    hi: ['वॉइस मैसेज भेजना है', 'बोलकर संदेश भेजना', 'आवाज संदेश भेजो', 'रिकॉर्ड करके भेजना'],
    ml: ['വോയ്സ് മെസ്സേജ് അയക്കണം', 'ശബ്ദ സന്ദേശം അയക്കാൻ', 'വോയ്സ് നോട്ട് അയക്കുന്നത് എങ്ങനെ', 'റെക്കോർഡ് ചെയ്ത് അയക്കണം']
  },
  whatsapp_search_contact: {
    en: ['search contact', 'find a person on whatsapp', 'how to search for a chat', 'find a contact by name'],
    hi: ['संपर्क खोजना है', 'किसी का नंबर ढूंढना है', 'व्हाट्सएप पर नाम सर्च करना'],
    ml: ['കോൺടാക്റ്റ് തിരയണം', 'ഒരാളെ കണ്ടെത്താൻ', 'പേര് സെർച്ച് ചെയ്യുന്നത് എങ്ങനെ']
  },
  whatsapp_send_document: {
    en: ['send a photo as a document', 'photo as document', 'send a file on whatsapp', 'send a PDF', 'share a document'],
    hi: ['फोटो को डॉक्यूमेंट की तरह भेजना', 'फ़ाइल भेजनी है', 'डॉक्यूमेंट कैसे भेजें'],
    ml: ['ഫോട്ടോ ഡോക്യുമെന്റായി അയക്കണം', 'ഫയൽ അയക്കുന്നത് എങ്ങനെ', 'പിഡിഎഫ് അയക്കാൻ']
  },
  whatsapp_share_location: {
    en: ['share location', 'send my location', 'send my location to my son', 'how to tell where I am', 'send address on whatsapp'],
    hi: ['लोकेशन भेजनी है', 'मैं कहाँ हूँ यह भेजना', 'अपनी लोकेशन शेयर करें'],
    ml: ['ലൊക്കേഷൻ അയക്കണം', 'ഞാൻ എവിടെയാണെന്ന് അയക്കാൻ', 'സ്ഥലം ഷെയർ ചെയ്യുന്നത് എങ്ങനെ']
  },
  whatsapp_add_status: {
    en: ['add a status', 'how to put a whatsapp status', 'post a story'],
    hi: ['स्टेटस लगाना है', 'व्हाट्सएप पर स्टेटस कैसे डालें', 'अपना स्टेटस अपडेट करना'],
    ml: ['സ്റ്റാറ്റസ് ഇടണം', 'വാട്ട്സ്ആപ്പിൽ സ്റ്റാറ്റസ് ഇടുന്നത് എങ്ങനെ', 'സ്റ്റാറ്റസ് അപ്ഡേറ്റ് ചെയ്യാൻ']
  },
  whatsapp_block_number: {
    en: ['block a number', 'how to block someone', 'stop scam messages', 'block unknown number'],
    hi: ['नंबर ब्लॉक करना है', 'अनजान नंबर को ब्लॉक करें', 'फ्रॉड मैसेज रोकना'],
    ml: ['നമ്പർ ബ്ലോക്ക് ചെയ്യണം', 'അറിയാത്ത നമ്പർ ബ്ലോക്ക് ചെയ്യുന്നത് എങ്ങനെ', 'തട്ടിപ്പ് മെസ്സേജ് തടയാൻ']
  },
  whatsapp_forward_message: {
    en: ['forward a message', 'how to forward on whatsapp', 'forward this message to my daughter'],
    hi: ['मैसेज फॉरवर्ड करना है', 'मैसेज आगे भेजना', 'फॉरवर्ड कैसे करें'],
    ml: ['മെസ്സേജ് ഫോർവേഡ് ചെയ്യണം', 'ഫോർവേഡ് ചെയ്യുന്നത് എങ്ങനെ', 'ഈ സന്ദേശം ഫോർവേഡ് ചെയ്യാൻ']
  },
  gpay_check_balance: {
    en: ['check balance', 'check my bank balance', 'how much money do I have', 'show account balance in google pay'],
    hi: ['बैलेंस चेक करना है', 'मेरे खाते में कितने पैसे हैं', 'बैंक बैलेंस देखना', 'गूगल पे में बैलेंस'],
    ml: ['ബാലൻസ് നോക്കണം', 'അക്കൗണ്ടിൽ എത്ര രൂപ ഉണ്ട്', 'ബാങ്ക് ബാലൻസ് ചെക്ക് ചെയ്യാൻ', 'എന്റെ ബാക്കി തുക എത്ര']
  },
  gpay_scan_qr: {
    en: ['scan QR code', 'pay at the shop with QR', 'how to scan and pay', 'scan the code in gpay'],
    hi: ['क्यूआर कोड स्कैन करना है', 'दुकान पर क्यूआर से भुगतान', 'QR code स्कैन करके पैसे देना', 'स्कैन करके पेमेंट'],
    ml: ['ക്യൂആർ കോഡ് സ്കാൻ ചെയ്യുക', 'ക്യു ആർ കോഡ് സ്കാൻ ചെയ്യണം', 'കടയിൽ ക്യുആർ സ്കാൻ ചെയ്ത് പണം അടയ്ക്കാൻ', 'QR കോഡ് സ്കാൻ ചെയ്ത് പേ ചെയ്യാൻ', 'ജിപേയിൽ സ്കാൻ ചെയ്യുന്നത് എങ്ങനെ', 'ക്യുആര്‍ കോഡ് സ്‌കാന്‍ ചെയ്യുക']
  },
  gpay_send_contact: {
    en: ['send money to my son', 'transfer money to Ramesh', 'pay a contact', 'send money on google pay'],
    hi: ['बेटे को पैसे भेजने हैं', 'रमेश को पैसे भेजो', 'पैसे ट्रांसफर करना', 'संपर्क को पैसे भेजना'],
    ml: ['മകന് പണം അയക്കണം', 'രമേഷിന് പൈസ അയക്കാൻ', 'കോൺടാക്റ്റിലേക്ക് പണം അയക്കുന്നത് എങ്ങനെ', 'പണം ട്രാൻസ്ഫർ ചെയ്യണം']
  },
  gpay_transaction_history: {
    en: ['see transaction history', 'show my past payments', 'where is my payment receipt', 'check old transactions'],
    hi: ['लेनदेन का इतिहास देखना है', 'पुराने भुगतान देखें', 'ट्रांजैक्शन हिस्ट्री', 'पैसे का हिसाब देखना'],
    ml: ['ഇടപാടുകളുടെ ചരിത്രം കാണണം', 'പഴയ പേയ്മെന്റ് നോക്കാൻ', 'ട്രാൻസാക്ഷൻ ഹിസ്റ്ററി', 'രസീത് കാണണം']
  },
  gpay_pay_upi_or_phone: {
    en: ['pay a UPI ID', 'how to pay anyone on google pay', 'send money to a phone number', 'pay a phone number'],
    hi: ['यूपीआई आईडी पर पैसे भेजने हैं', 'फ़ोन नंबर पर पैसे भेजना', 'नंबर पर पैसे भेजो'],
    ml: ['യുപിഐ ഐഡിയിലേക്ക് പണം അയക്കണം', 'ഫോൺ നമ്പറിലേക്ക് പണം അയക്കാൻ', 'നമ്പറിലേക്ക് പണം അയക്കുന്നത് എങ്ങനെ']
  },
  gpay_recharge_mobile: {
    en: ['recharge my phone', 'mobile recharge', 'how to top up my mobile', 'buy a prepaid plan recharge'],
    hi: ['मोबाइल रिचार्ज करना है', 'फ़ोन रिचार्ज कैसे करें', 'रिचार्ज करो'],
    ml: ['മൊബൈൽ റീചാർജ് ചെയ്യണം', 'ഫോൺ റീചാർജ് ചെയ്യുന്നത് എങ്ങനെ', 'റീചാർജ് ചെയ്യാൻ']
  },
  gpay_bank_transfer: {
    en: ['bank transfer', 'send money to a bank account', 'pay using account number and IFSC', 'how to do a bank transfer'],
    hi: ['बैंक ट्रांसफर करना है', 'बैंक खाते में पैसे भेजने हैं', 'खाता नंबर से पैसे भेजना'],
    ml: ['ബാങ്ക് ട്രാൻസ്ഫർ ചെയ്യണം', 'ബാങ്ക് അക്കൗണ്ടിലേക്ക് പണം അയക്കാൻ', 'അക്കൗണ്ട് നമ്പർ ഉപയോഗിച്ച് പണം അയക്കുന്നത് എങ്ങനെ']
  }
};

const EXTRA: Array<[SupportedLanguage, string, string]> = [
  ['en', 'make a call', 'clarify:whatsapp_voice_call|whatsapp_video_call'],
  ['hi', 'बेटे को कॉल करना है', 'clarify:whatsapp_voice_call|whatsapp_video_call'],
  ['ml', 'മകനെ വിളിക്കണം', 'clarify:whatsapp_voice_call|whatsapp_video_call'],
  ['en', 'pay money', 'clarify:gpay_scan_qr|gpay_send_contact'],
  ['hi', 'पैसे देने हैं', 'clarify:gpay_scan_qr|gpay_send_contact'],
  ['ml', 'പണം കൊടുക്കണം', 'clarify:gpay_scan_qr|gpay_send_contact'],
  // A plain photo request stays with the photo task (not captured by the document task)
  ['en', 'send a photo to Ramesh', 'whatsapp_send_photo'],
  ['hi', 'बेटे को फोटो भेजो', 'whatsapp_send_photo'],
  ['ml', 'മകന് ഫോട്ടോ അയക്കണം', 'whatsapp_send_photo'],
  // The new tasks take only their own requests: a photo status, a forwarded photo and a blocked number are theirs,
  // while plain photo, message, search and location requests stay where they were
  ['en', 'post a photo status', 'whatsapp_add_status'],
  ['en', 'forward a photo', 'whatsapp_forward_message'],
  ['en', 'block an unknown number', 'whatsapp_block_number'],
  ['en', 'find a number', 'whatsapp_search_contact'],
  ['en', 'search', 'whatsapp_search_contact'],
  ['en', 'send a message', 'whatsapp_send_text'],
  ['hi', 'मैसेज भेजना है', 'whatsapp_send_text'],
  ['en', 'send location', 'whatsapp_share_location'],
  ['ml', 'സ്റ്റാറ്റസ് ഫോട്ടോ ഇടണം', 'whatsapp_add_status'],
  // The new Google Pay tasks take only their own requests: a phone number to find stays with the WhatsApp search,
  // plain "send money" with send-money, a balance question with the balance task
  ['en', 'search a phone number', 'whatsapp_search_contact'],
  ['en', 'type a phone number to find a chat', 'whatsapp_search_contact'],
  ['hi', 'फ़ोन नंबर खोजना है', 'whatsapp_search_contact'],
  ['hi', 'चैट ढूंढने के लिए फ़ोन नंबर टाइप करना', 'whatsapp_search_contact'],
  ['ml', 'ഫോൺ നമ്പർ തിരയണം', 'whatsapp_search_contact'],
  ['ml', 'ചാറ്റ് കണ്ടെത്താൻ നമ്പർ ടൈപ്പ് ചെയ്യുക', 'whatsapp_search_contact'],
  ['en', 'send money', 'gpay_send_contact'],
  ['hi', 'पैसे भेजने हैं', 'gpay_send_contact'],
  ['ml', 'പണം അയക്കണം', 'gpay_send_contact'],
  ['en', 'check bank account balance', 'gpay_check_balance'],
  ['en', 'how much money is in my bank account', 'gpay_check_balance'],
  ['hi', 'बैंक खाते में कितने पैसे हैं', 'gpay_check_balance'],
  ['en', 'recharge my phone number', 'gpay_recharge_mobile'],
  ['en', 'money received', 'gpay_transaction_history'],
  ['en', 'transfer money to my son', 'gpay_send_contact'],
  ['en', 'whatsapp', 'none'],
  ['ml', 'ജിപേ', 'none'],
  ['hi', 'नमस्ते', 'none'],
  ['en', 'what is the weather', 'none']
];

const describe = (r: ReturnType<typeof TaskRouterService.localSemanticMatch>) =>
  r.matched ? r.taskId! : r.clarifyQuestion ? `clarify:${r.clarifyQuestion.options.map(o => o.taskId).join('|')}` : 'none';

const sameOutcome = (got: string, want: string) =>
  got === want || (want.startsWith('clarify:') && got.startsWith('clarify:') &&
    got.slice(8).split('|').sort().join('|') === want.slice(8).split('|').sort().join('|'));

const all: Array<[SupportedLanguage, string, string]> = [...EXTRA];
for (const [taskId, byLang] of Object.entries(CASES)) {
  for (const [lang, phrases] of Object.entries(byLang)) {
    for (const phrase of phrases) all.push([lang as SupportedLanguage, phrase, taskId]);
  }
}

let failed = 0;
for (const [lang, phrase, want] of all) {
  const got = describe(TaskRouterService.localSemanticMatch(phrase.toLowerCase(), lang));
  if (!sameOutcome(got, want)) {
    failed++;
    console.log(`FAIL [${lang}] "${phrase}" → ${got} (expected ${want})`);
  }
}
console.log(`${all.length - failed}/${all.length} passed`);
if (failed) process.exit(1);
