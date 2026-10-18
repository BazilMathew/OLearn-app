import { SupportedLanguage } from '../types/task';

export interface TranslationDictionary {
  appName: string;
  tagline: string;
  chooseLanguage: string;
  selectLanguageTitle: string;
  selectLanguageSubtitle: string;
  continueBtn: string;
  home: string;
  settings: string;
  askMe: string;
  askMeSubtitle: string;
  listening: string;
  tapAndSpeak: string;
  /** Start button on the Home screen's Ask card */
  askStart: string;
  voiceNoSpeech: string;
  voiceMicDenied: string;
  voiceInsecure: string;
  voiceOffline: string;
  voiceUnavailable: string;
  voiceWorking: string;
  typePlaceholder: string;
  send: string;
  cancel: string;
  clarifyTitle: string;
  didNotUnderstand: string;
  practiceAgain: string;
  backToMenu: string;
  taskCompleted: string;
  taskCompletedSubtitle: string;
  gentleNudge: string;
  whatsAppTitle: string;
  gpayTitle: string;
  tasksAvailable: string;
  completedBadge: string;
  startPractice: string;
  stepOf: string;
  stepXofY: string;
  practiceMode: string;
  back: string;
  exitTutorial: string;
  replayAudio: string;
  swipeUp: string;
  showMe: string;
  scrollNudge: string;
  soundPlaying: string;
  deviceFrame: string;
  fullscreen: string;
  offlineNotice: string;
  save: string;
  resetProgress: string;
  resetConfirmTitle: string;
  resetConfirmBody: string;
  resetConfirmYes: string;
  resetConfirmNo: string;
  resetDone: string;
  soundSpeed: string;
  normalSpeed: string;
  slowSpeed: string;
  reduceMotion: string;
  practiceScreens: string;
  practiceScreensEnglish: string;
  practiceScreensMine: string;
  textSize: string;
  textSizeNormal: string;
  textSizeLarge: string;
  textSizeLarger: string;
  textSizeLargest: string;
  textSizePreview: string;
  /** Android app, Ask Me: after "didn't catch that" */
  voiceTryVoiceBox: string;
  /** Android app: Settings › Voice check */
  voiceCheck: string;
  voiceCheckIntro: string;
  voiceCheckTry: string;
  voiceCheckStop: string;
  voiceCheckResult: string;
  voiceCheckRoute: string;
  voiceCheckReason: string;
  voiceCheckHeard: string;
  voiceCheckPhone: string;
  voiceCheckEvents: string;
  voiceCheckNotRun: string;
  voiceCheckCopy: string;
  voiceCheckCopied: string;
  voiceCheckCopyFailed: string;
  languages: {
    en: string;
    hi: string;
    ml: string;
  };
}

export const I18N: Record<SupportedLanguage, TranslationDictionary> = {
  en: {
    appName: 'OLearn',
    tagline: 'Step-by-step smartphone trainer for seniors',
    chooseLanguage: 'Select Language',
    selectLanguageTitle: 'Choose Your Language',
    selectLanguageSubtitle: 'All tutorials and voice instructions will play in this language.',
    continueBtn: 'Continue',
    home: 'Home',
    settings: 'Settings',
    askMe: 'Ask Me',
    askMeSubtitle: 'Tell me what you want to learn in WhatsApp or Google Pay',
    listening: 'Listening...',
    tapAndSpeak: 'Tap and speak',
    askStart: 'Start',
    voiceNoSpeech: 'Didn’t catch that, tap and try again',
    voiceMicDenied: 'Please allow the microphone',
    voiceInsecure: 'Voice needs a secure connection, please type instead',
    voiceOffline: 'No internet, please type',
    voiceUnavailable: 'Voice isn’t available here, please type your question',
    voiceWorking: 'One moment...',
    typePlaceholder: 'Or type what you want to learn...',
    send: 'Ask',
    cancel: 'Cancel',
    clarifyTitle: 'Which of these would you like to do?',
    didNotUnderstand: "I didn't understand, please try again or choose a task",
    practiceAgain: 'Practice Again',
    backToMenu: 'Back to Menu',
    taskCompleted: 'Well Done! Task Completed!',
    taskCompletedSubtitle: 'You did it! Repeat to build your confidence or return to menu.',
    gentleNudge: 'Try tapping the highlighted button with the yellow border.',
    whatsAppTitle: 'WhatsApp',
    gpayTitle: 'Google Pay',
    tasksAvailable: 'tutorials available',
    completedBadge: 'Completed',
    startPractice: 'Start Tutorial',
    stepOf: 'Step',
    stepXofY: 'Step {n} of {total}',
    practiceMode: 'Practice mode',
    back: 'Back',
    exitTutorial: 'Exit',
    replayAudio: 'Repeat Voice',
    swipeUp: 'Swipe up',
    showMe: 'Show me',
    scrollNudge: "Swipe up on the list to find Ramesh's chat.",
    soundPlaying: 'Playing instruction...',
    deviceFrame: 'Mobile View',
    fullscreen: 'Fullscreen',
    offlineNotice: 'Offline Mode: Voice narration & mock apps work without internet',
    save: 'Save',
    resetProgress: 'Reset Progress',
    resetConfirmTitle: 'Clear your progress?',
    resetConfirmBody: 'The ticks on finished tutorials will be removed. Your settings stay the same.',
    resetConfirmYes: 'Yes, clear',
    resetConfirmNo: 'No, keep it',
    resetDone: 'Progress cleared.',
    soundSpeed: 'Narration Speed',
    normalSpeed: 'Normal',
    slowSpeed: 'Slow & Clear',
    reduceMotion: 'Reduce motion',
    practiceScreens: 'Practice screens',
    practiceScreensEnglish: 'English',
    practiceScreensMine: 'My language',
    textSize: 'Text size',
    textSizeNormal: 'Normal',
    textSizeLarge: 'Large',
    textSizeLarger: 'Larger',
    textSizeLargest: 'Largest',
    textSizePreview: 'This is how your text will look.',
    voiceTryVoiceBox: 'Try the Google voice box',
    voiceCheck: 'Voice check',
    voiceCheckIntro: 'Tap "Try it" and say a few words. This shows how voice input works on this phone.',
    voiceCheckTry: 'Try it',
    voiceCheckStop: 'Stop',
    voiceCheckResult: 'Result',
    voiceCheckRoute: 'Route',
    voiceCheckReason: 'Why',
    voiceCheckHeard: 'Heard',
    voiceCheckPhone: 'This phone',
    voiceCheckEvents: 'Events',
    voiceCheckNotRun: 'Not tried yet',
    voiceCheckCopy: 'Copy report',
    voiceCheckCopied: 'Report copied. Paste it in WhatsApp.',
    voiceCheckCopyFailed: 'Could not copy. Please take a screenshot.',
    languages: {
      en: 'English',
      hi: 'हिन्दी',
      ml: 'മലയാളം'
    }
  },
  hi: {
    appName: 'ओ-लर्न',
    tagline: 'बुजुर्गों के लिए आसान स्मार्टफोन ट्रेनर',
    chooseLanguage: 'भाषा चुनें',
    selectLanguageTitle: 'अपनी भाषा चुनें',
    selectLanguageSubtitle: 'सभी ट्यूटोरियल और आवाज़ के निर्देश इस भाषा में सुनाए जाएंगे।',
    continueBtn: 'आगे बढ़ें',
    home: 'होम',
    settings: 'सेटिंग्स',
    askMe: 'मुझसे पूछें',
    askMeSubtitle: 'व्हाट्सएप या गूगल पे पर आप क्या सीखना चाहते हैं, बोलकर बताएं',
    listening: 'सुन रहा हूँ...',
    tapAndSpeak: 'बोलने के लिए दबाएं',
    askStart: 'पूछें',
    voiceNoSpeech: 'समझ नहीं आया, फिर से दबाकर बोलें',
    voiceMicDenied: 'कृपया माइक्रोफ़ोन की अनुमति दें',
    voiceInsecure: 'आवाज़ के लिए सुरक्षित कनेक्शन चाहिए, कृपया टाइप करें',
    voiceOffline: 'इंटरनेट नहीं है, कृपया टाइप करें',
    voiceUnavailable: 'यहाँ आवाज़ उपलब्ध नहीं है, कृपया अपना सवाल टाइप करें',
    voiceWorking: 'एक पल रुकिए...',
    typePlaceholder: 'या यहाँ टाइप करके पूछें...',
    send: 'पूछें',
    cancel: 'रद्द करें',
    clarifyTitle: 'आप इनमें से क्या करना चाहते हैं?',
    didNotUnderstand: 'मैं समझ नहीं पाया, कृपया फिर से कोशिश करें या कोई काम चुनें',
    practiceAgain: 'फिर से अभ्यास करें',
    backToMenu: 'मेनू पर वापस जाएं',
    taskCompleted: 'बहुत बढ़िया! अभ्यास पूरा हुआ!',
    taskCompletedSubtitle: 'आपने इसे आसानी से सीख लिया! आत्मविश्वास बढ़ाने के लिए दोबारा करें।',
    gentleNudge: 'कृपया पीले बॉर्डर वाले हाइलाइट किए गए बटन को दबाएं।',
    whatsAppTitle: 'व्हाट्सएप',
    gpayTitle: 'गूगल पे',
    tasksAvailable: 'ट्यूटोरियल उपलब्ध',
    completedBadge: 'सफलतापूर्वक सीखा',
    startPractice: 'अभ्यास शुरू करें',
    stepOf: 'कदम',
    stepXofY: 'कदम {n} (कुल {total} में से)',
    practiceMode: 'अभ्यास मोड',
    back: 'पीछे',
    exitTutorial: 'बाहर जाएं',
    replayAudio: 'आवाज़ दोबारा सुनें',
    swipeUp: 'ऊपर की ओर स्वाइप करें',
    showMe: 'मुझे दिखाएं',
    scrollNudge: 'रमेश की चैट ढूँढने के लिए सूची पर ऊपर की ओर स्वाइप करें।',
    soundPlaying: 'निर्देश सुनाया जा रहा है...',
    deviceFrame: 'फ़ोन व्यू',
    fullscreen: 'फुल स्क्रीन',
    offlineNotice: 'ऑफ़लाइन मोड: वॉइस और मॉक ऐप बिना इंटरनेट काम करते हैं',
    save: 'सहेजें',
    resetProgress: 'प्रगति रीसेट करें',
    resetConfirmTitle: 'अपनी प्रगति मिटाएँ?',
    resetConfirmBody: 'पूरे किए गए ट्यूटोरियल के टिक हट जाएँगे। आपकी सेटिंग्स वैसी ही रहेंगी।',
    resetConfirmYes: 'हाँ, मिटाएँ',
    resetConfirmNo: 'नहीं, रहने दें',
    resetDone: 'प्रगति मिटा दी गई।',
    soundSpeed: 'बोलने की गति',
    normalSpeed: 'सामान्य',
    slowSpeed: 'धीमी और स्पष्ट',
    reduceMotion: 'हलचल कम करें',
    practiceScreens: 'अभ्यास स्क्रीन',
    practiceScreensEnglish: 'अंग्रेज़ी',
    practiceScreensMine: 'मेरी भाषा',
    textSize: 'अक्षरों का आकार',
    textSizeNormal: 'सामान्य',
    textSizeLarge: 'बड़ा',
    textSizeLarger: 'और बड़ा',
    textSizeLargest: 'सबसे बड़ा',
    textSizePreview: 'आपके अक्षर ऐसे दिखेंगे।',
    voiceTryVoiceBox: 'Google वॉइस बॉक्स आज़माएँ',
    voiceCheck: 'आवाज़ जाँच',
    voiceCheckIntro: '"आज़माएँ" दबाएँ और कुछ शब्द बोलें। इससे पता चलता है कि इस फ़ोन पर आवाज़ से लिखना कैसे काम करता है।',
    voiceCheckTry: 'आज़माएँ',
    voiceCheckStop: 'रोकें',
    voiceCheckResult: 'नतीजा',
    voiceCheckRoute: 'तरीका',
    voiceCheckReason: 'क्यों',
    voiceCheckHeard: 'सुना गया',
    voiceCheckPhone: 'यह फ़ोन',
    voiceCheckEvents: 'घटनाएँ',
    voiceCheckNotRun: 'अभी आज़माया नहीं',
    voiceCheckCopy: 'रिपोर्ट कॉपी करें',
    voiceCheckCopied: 'रिपोर्ट कॉपी हो गई। इसे WhatsApp में पेस्ट करें।',
    voiceCheckCopyFailed: 'कॉपी नहीं हो सका। कृपया स्क्रीनशॉट लें।',
    languages: {
      en: 'English',
      hi: 'हिन्दी',
      ml: 'മലയാളം'
    }
  },
  ml: {
    appName: 'ഓലേൺ',
    tagline: 'മുതിർന്നവർക്കായി സ്മാർട്ട്ഫോൺ പരിശീലനം',
    chooseLanguage: 'ഭാഷ തിരഞ്ഞെടുക്കുക',
    selectLanguageTitle: 'നിങ്ങളുടെ ഭാഷ തിരഞ്ഞെടുക്കൂ',
    selectLanguageSubtitle: 'എല്ലാ ട്യൂട്ടോറിയലുകളും ശബ്ദ നിർദ്ദേശങ്ങളും ഈ ഭാഷയിൽ കേൾക്കാം.',
    continueBtn: 'തുടങ്ങുക',
    home: 'ഹോം',
    settings: 'സെറ്റിങ്സ്',
    askMe: 'ചോദിക്കൂ',
    askMeSubtitle: 'വാട്ട്‌സ്ആപ്പിലോ ഗൂഗിൾ പേയിലോ എന്ത് ചെയ്യാനാണ് പഠിക്കേണ്ടത് എന്ന് പറയൂ',
    listening: 'കേൾക്കുന്നു...',
    tapAndSpeak: 'സംസാരിക്കാൻ തൊടുക',
    askStart: 'തുടങ്ങുക',
    voiceNoSpeech: 'മനസ്സിലായില്ല, വീണ്ടും തൊട്ട് സംസാരിക്കുക',
    voiceMicDenied: 'ദയവായി മൈക്രോഫോൺ അനുവദിക്കുക',
    voiceInsecure: 'ശബ്ദത്തിന് സുരക്ഷിത കണക്ഷൻ വേണം, ദയവായി ടൈപ്പ് ചെയ്യുക',
    voiceOffline: 'ഇന്റർനെറ്റ് ഇല്ല, ദയവായി ടൈപ്പ് ചെയ്യുക',
    voiceUnavailable: 'ഇവിടെ ശബ്ദം ലഭ്യമല്ല, ദയവായി നിങ്ങളുടെ ചോദ്യം ടൈപ്പ് ചെയ്യുക',
    voiceWorking: 'ഒരു നിമിഷം...',
    typePlaceholder: 'അല്ലെങ്കിൽ ഇവിടെ ടൈപ്പ് ചെയ്യുക...',
    send: 'ചോദിക്കുക',
    cancel: 'റദ്ദാക്കുക',
    clarifyTitle: 'ഇതിൽ ഏതാണ് താങ്കൾ ചെയ്യാൻ ആഗ്രഹിക്കുന്നത്?',
    didNotUnderstand: 'എനിക്ക് മനസ്സിലായില്ല, ദയവായി വീണ്ടും ശ്രമിക്കുക അല്ലെങ്കിൽ ഒരു പാഠം തിരഞ്ഞെടുക്കുക',
    practiceAgain: 'വീണ്ടും പരിശീലിക്കുക',
    backToMenu: 'മെനുവിലേക്ക് മടങ്ങുക',
    taskCompleted: 'വളരെ നന്ന്! പാഠം പൂർത്തിയായി!',
    taskCompletedSubtitle: 'നിങ്ങൾ ഇത് വിജയകരമായി പഠിച്ചു! ഉറപ്പുണ്ടാക്കാൻ വീണ്ടും ചെയ്യാം.',
    gentleNudge: 'മഞ്ഞ വരയുള്ള ഹൈലൈറ്റ് ചെയ്ത ബട്ടണിൽ തൊടുക.',
    whatsAppTitle: 'വാട്ട്സ്ആപ്പ്',
    gpayTitle: 'ഗൂഗിൾ പേ',
    tasksAvailable: 'പാഠങ്ങൾ ലഭ്യമാണ്',
    completedBadge: 'പഠിച്ചു കഴിഞ്ഞു',
    startPractice: 'പരിശീലനം തുടങ്ങുക',
    stepOf: 'ഘട്ടം',
    stepXofY: 'ഘട്ടം {n} ({total}-ൽ)',
    practiceMode: 'പരിശീലന മോഡ്',
    back: 'മടങ്ങുക',
    exitTutorial: 'പുറത്ത് കടക്കുക',
    replayAudio: 'ശബ്ദം വീണ്ടും കേൾക്കുക',
    swipeUp: 'മുകളിലേക്ക് സ്വൈപ്പ് ചെയ്യുക',
    showMe: 'കാണിച്ചു തരൂ',
    scrollNudge: 'രമേഷിന്റെ ചാറ്റ് കണ്ടെത്താൻ ലിസ്റ്റിൽ മുകളിലേക്ക് സ്വൈപ്പ് ചെയ്യുക.',
    soundPlaying: 'നിർദ്ദേശം കേൾപ്പിക്കുന്നു...',
    deviceFrame: 'ഫോൺ കാഴ്ച',
    fullscreen: 'പൂർണ്ണ സ്ക്രീൻ',
    offlineNotice: 'ഓഫ്‌ലൈൻ: ഇന്റർനെറ്റ് ഇല്ലാതെ പ്രവർത്തിക്കുന്നു',
    save: 'സേവ് ചെയ്യുക',
    resetProgress: 'പുരോഗതി റീസെറ്റ് ചെയ്യുക',
    resetConfirmTitle: 'പുരോഗതി മായ്ക്കണോ?',
    resetConfirmBody: 'പൂർത്തിയാക്കിയ പാഠങ്ങളിലെ ശരി അടയാളങ്ങൾ നീക്കും. നിങ്ങളുടെ സെറ്റിങ്സ് മാറില്ല.',
    resetConfirmYes: 'അതെ, മായ്ക്കുക',
    resetConfirmNo: 'വേണ്ട',
    resetDone: 'പുരോഗതി മായ്ച്ചു.',
    soundSpeed: 'ശബ്ദ വേഗത',
    normalSpeed: 'സാധാരണ',
    slowSpeed: 'പതുക്കെ & വ്യക്തമായി',
    reduceMotion: 'ചലനം കുറയ്ക്കുക',
    practiceScreens: 'പരിശീലന സ്ക്രീനുകൾ',
    practiceScreensEnglish: 'ഇംഗ്ലീഷ്',
    practiceScreensMine: 'എന്റെ ഭാഷ',
    textSize: 'അക്ഷര വലുപ്പം',
    textSizeNormal: 'സാധാരണ',
    textSizeLarge: 'വലുത്',
    textSizeLarger: 'കൂടുതൽ വലുത്',
    textSizeLargest: 'ഏറ്റവും വലുത്',
    textSizePreview: 'നിങ്ങളുടെ അക്ഷരങ്ങൾ ഇങ്ങനെ കാണപ്പെടും.',
    voiceTryVoiceBox: 'Google വോയ്‌സ് ബോക്സ് പരീക്ഷിക്കുക',
    voiceCheck: 'ശബ്ദ പരിശോധന',
    voiceCheckIntro: '"പരീക്ഷിക്കുക" തൊട്ട് കുറച്ച് വാക്കുകൾ പറയുക. ഈ ഫോണിൽ ശബ്ദം കൊണ്ട് എഴുതുന്നത് എങ്ങനെ പ്രവർത്തിക്കുന്നു എന്ന് ഇത് കാണിക്കും.',
    voiceCheckTry: 'പരീക്ഷിക്കുക',
    voiceCheckStop: 'നിർത്തുക',
    voiceCheckResult: 'ഫലം',
    voiceCheckRoute: 'വഴി',
    voiceCheckReason: 'കാരണം',
    voiceCheckHeard: 'കേട്ടത്',
    voiceCheckPhone: 'ഈ ഫോൺ',
    voiceCheckEvents: 'സംഭവങ്ങൾ',
    voiceCheckNotRun: 'ഇതുവരെ പരീക്ഷിച്ചിട്ടില്ല',
    voiceCheckCopy: 'റിപ്പോർട്ട് പകർത്തുക',
    voiceCheckCopied: 'റിപ്പോർട്ട് പകർത്തി. ഇത് WhatsApp-ൽ ഒട്ടിക്കുക.',
    voiceCheckCopyFailed: 'പകർത്താനായില്ല. ദയവായി സ്ക്രീൻഷോട്ട് എടുക്കുക.',
    languages: {
      en: 'English',
      hi: 'हिन्दी',
      ml: 'മലയാളം'
    }
  }
};
