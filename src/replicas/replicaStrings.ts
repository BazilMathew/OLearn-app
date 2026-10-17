import { SupportedLanguage } from '../types/task';

// Labels shown INSIDE the mock WhatsApp and Google Pay screens.
// Separate from OLearn's own interface strings (config/i18n.ts): the replicas follow the
// "Practice screens" setting (English, or the learner's language), the OLearn chrome never does.
// Sample data (bank names, UPI reference numbers, amounts, times, phone numbers) stays in the screens.
export interface ReplicaStrings {
  // People and the shop
  rameshSon: string;
  ramesh: string;
  rameshInitial: string;
  son: string;
  priya: string;
  priyaInitial: string;
  daughter: string;
  shopName: string;
  shopInitial: string;

  // WhatsApp
  online: string;
  today: string;
  chatReceived: string;
  chatSent: string;
  chatTyped: string;
  messagePlaceholder: string;
  shareContent: string;
  gallery: string;
  camera: string;
  document: string;
  cancel: string;
  voiceCallQuestion: string;
  call: string;
  videoCallQuestion: string;
  startCall: string;
  recordingNote: string;
  voiceCallInProgress: string;
  you: string;
  photoPreview: string;
  beautifulFlower: string;
  familyPhoto: string;
  addCaption: string;
  allPhotos: string;
  flower: string;
  temple: string;
  grandchild: string;
  birthday: string;

  // Google Pay
  scanShopQr: string;
  pointCamera: string;
  sandboxFooter: string;
  bankingNameVerified: string;
  payingAmount: string;
  proceedToPay: (amount: string) => string;
  upiPin: string;
  enterUpiPin: string;
  neverSharePin: string;
  paidSuccessfully: string;
  upiRef: string;
  debitedFrom: string;
  doneSuccess: string;
  selectContact: string;
  secureTransfer: string;
  payMoney: string;
  request: string;
  accountBalance: string;
  availableBalance: string;
  doneBalance: string;
  transactionHistory: string;
  paymentReceipt: string;
  completed: string;
  upiRefNo: string;
  paymentMode: string;
  mockData: string;
  scanAnyQr: string;
  payContacts: string;
  checkBalance: string;
  seeHistory: string;
  mockFooter: string;
}

export const REPLICA_STRINGS: Record<SupportedLanguage, ReplicaStrings> = {
  en: {
    rameshSon: 'Ramesh (Son)',
    ramesh: 'Ramesh',
    rameshInitial: 'R',
    son: 'Son',
    priya: 'Priya',
    priyaInitial: 'P',
    daughter: 'Daughter',
    shopName: 'Sharma Groceries',
    shopInitial: 'S',

    online: 'online',
    today: 'Today',
    chatReceived: 'Hello! How are you doing today?',
    chatSent: 'I am doing well son, all good!',
    chatTyped: 'I am doing well son...',
    messagePlaceholder: 'Message',
    shareContent: 'Share Content',
    gallery: 'Gallery',
    camera: 'Camera',
    document: 'Document',
    cancel: 'Cancel',
    voiceCallQuestion: 'Voice Call Ramesh?',
    call: 'Call',
    videoCallQuestion: 'Start Video Call?',
    startCall: 'Start Call',
    recordingNote: 'Recording audio note...',
    voiceCallInProgress: 'WhatsApp Voice Call in progress',
    you: 'You',
    photoPreview: 'Photo Preview',
    beautifulFlower: 'Beautiful Flower',
    familyPhoto: 'Family Photo 1',
    addCaption: 'Add a caption...',
    allPhotos: 'All Photos (Gallery)',
    flower: 'Flower',
    temple: 'Temple',
    grandchild: 'Grandchild',
    birthday: 'Birthday',

    scanShopQr: 'Scan Shop QR',
    pointCamera: 'Point camera at shop QR code',
    sandboxFooter: 'Google Pay UPI Sandbox',
    bankingNameVerified: 'Banking Name Verified',
    payingAmount: 'Paying Amount',
    proceedToPay: (amount) => `Proceed to Pay (${amount})`,
    upiPin: 'UPI PIN',
    enterUpiPin: 'Enter 4-Digit Secret UPI PIN',
    neverSharePin: 'Never share your UPI PIN with anyone',
    paidSuccessfully: 'Paid Successfully!',
    upiRef: 'UPI Ref',
    debitedFrom: 'DEBITED FROM',
    doneSuccess: 'Done',
    selectContact: 'Select Contact',
    secureTransfer: 'Secure UPI Direct Transfer',
    payMoney: 'Pay Money',
    request: 'Request',
    accountBalance: 'Account Balance',
    availableBalance: 'Available Balance',
    doneBalance: 'Done',
    transactionHistory: 'Transaction History',
    paymentReceipt: 'Payment Receipt',
    completed: 'Completed',
    upiRefNo: 'UPI Ref No',
    paymentMode: 'Payment Mode',
    mockData: 'OLearn Sandboxed Mock Data',
    scanAnyQr: 'Scan any QR code',
    payContacts: 'Pay contacts',
    checkBalance: 'Check bank balance',
    seeHistory: 'See transaction history',
    mockFooter: 'Mock Google Pay Replica • No real money is used'
  },
  hi: {
    rameshSon: 'रमेश (बेटा)',
    ramesh: 'रमेश',
    rameshInitial: 'र',
    son: 'बेटा',
    priya: 'प्रिया',
    priyaInitial: 'प',
    daughter: 'बेटी',
    shopName: 'शर्मा किराना',
    shopInitial: 'श',

    online: 'ऑनलाइन',
    today: 'आज',
    chatReceived: 'नमस्ते माँ / पिताजी! आप कैसे हैं?',
    chatSent: 'मैं ठीक हूँ बेटा, सब कुशल है।',
    chatTyped: 'मैं ठीक हूँ बेटा...',
    messagePlaceholder: 'संदेश लिखें',
    shareContent: 'अटैच करें',
    gallery: 'गैलरी',
    camera: 'कैमरा',
    document: 'डॉक्यूमेंट',
    cancel: 'रद्द करें',
    voiceCallQuestion: 'रमेश को वॉइस कॉल करें?',
    call: 'कॉल करें',
    videoCallQuestion: 'रमेश को वीडियो कॉल करें?',
    startCall: 'शुरू करें',
    recordingNote: 'आवाज़ रिकॉर्ड हो रही है...',
    voiceCallInProgress: 'व्हाट्सएप वॉइस कॉल जारी है',
    you: 'आप',
    photoPreview: 'फोटो पूर्वावलोकन',
    beautifulFlower: 'सुंदर फूल',
    familyPhoto: 'परिवार फोटो 1',
    addCaption: 'कैप्शन जोड़ें...',
    allPhotos: 'सभी तस्वीरें (गैलरी)',
    flower: 'फूल',
    temple: 'मंदिर',
    grandchild: 'पोता-पोती',
    birthday: 'जन्मदिन',

    scanShopQr: 'दुकान का क्यूआर स्कैन करें',
    pointCamera: 'कैमरा क्यूआर कोड के सामने रखें',
    sandboxFooter: 'अभ्यास के लिए डेमो स्क्रीन',
    bankingNameVerified: 'बैंकिंग नाम सत्यापित',
    payingAmount: 'भुगतान राशि',
    proceedToPay: (amount) => `भुगतान करें (${amount})`,
    upiPin: 'यूपीआई पिन',
    enterUpiPin: 'अपना 4-अंकों का गुप्त यूपीआई पिन डालें',
    neverSharePin: 'यूपीआई पिन कभी किसी को न बताएं',
    paidSuccessfully: 'भुगतान सफल रहा!',
    upiRef: 'यूपीआई रेफ़',
    debitedFrom: 'इस खाते से कटे',
    doneSuccess: 'समाप्त (डन)',
    selectContact: 'संपर्क चुनें',
    secureTransfer: 'सुरक्षित यूपीआई भुगतान',
    payMoney: 'पैसे भेजें (पे)',
    request: 'अनुरोध करें',
    accountBalance: 'बैंक बैलेंस',
    availableBalance: 'उपलब्ध शेष राशि',
    doneBalance: 'पूर्ण (डन)',
    transactionHistory: 'लेन-देन इतिहास',
    paymentReceipt: 'भुगतान रसीद',
    completed: 'सफल भुगतान',
    upiRefNo: 'यूपीआई रेफ़ नंबर',
    paymentMode: 'भुगतान का तरीका',
    mockData: 'OLearn अभ्यास डेटा',
    scanAnyQr: 'कोई भी क्यूआर स्कैन करें',
    payContacts: 'संपर्कों को पैसे भेजें',
    checkBalance: 'बैंक बैलेंस चेक करें',
    seeHistory: 'लेन-देन का इतिहास देखें',
    mockFooter: 'डेमो गूगल पे • असली पैसे का उपयोग नहीं होता'
  },
  ml: {
    rameshSon: 'രമേഷ് (മകൻ)',
    ramesh: 'രമേഷ്',
    rameshInitial: 'ര',
    son: 'മകൻ',
    priya: 'പ്രിയ',
    priyaInitial: 'പ',
    daughter: 'മകൾ',
    shopName: 'ശർമ്മ പലചരക്ക്',
    shopInitial: 'ശ',

    online: 'ഓൺലൈൻ',
    today: 'ഇന്ന്',
    chatReceived: 'നമസ്കാരം, സുഖമാണോ?',
    chatSent: 'ഞാൻ ഇവിടെ സുഖമായിരിക്കുന്നു മകനേ.',
    chatTyped: 'ഞാൻ സുഖമായിരിക്കുന്നു...',
    messagePlaceholder: 'സന്ദേശം എഴുതുക',
    shareContent: 'തിരഞ്ഞെടുക്കുക',
    gallery: 'ഗ്യാലറി',
    camera: 'ക്യാമറ',
    document: 'ഡോക്യുമെന്റ്',
    cancel: 'റദ്ദാക്കുക',
    voiceCallQuestion: 'രമേഷിനെ കോൾ ചെയ്യണോ?',
    call: 'കോൾ',
    videoCallQuestion: 'വീഡിയോ കോൾ ചെയ്യണോ?',
    startCall: 'തുടങ്ങുക',
    recordingNote: 'ശബ്ദം റെക്കോർഡ് ചെയ്യുന്നു...',
    voiceCallInProgress: 'വോയ്സ് കോൾ നടക്കുന്നു',
    you: 'നിങ്ങൾ',
    photoPreview: 'ഫോട്ടോ കാഴ്ച്ച',
    beautifulFlower: 'സുന്ദരമായ പൂവ്',
    familyPhoto: 'കുടുംബ ഫോട്ടോ 1',
    addCaption: 'വിവരണം നൽകുക...',
    allPhotos: 'എല്ലാ ഫോട്ടോകളും',
    flower: 'പൂവ്',
    temple: 'ക്ഷേത്രം',
    grandchild: 'പേരക്കുട്ടി',
    birthday: 'ജന്മദിനം',

    scanShopQr: 'ക്യുആർ സ്കാൻ ചെയ്യുക',
    pointCamera: 'ക്യാമറ ക്യുആർ കോഡിന് നേരെ പിടിക്കുക',
    sandboxFooter: 'പരിശീലനത്തിനുള്ള മാതൃക സ്ക്രീൻ',
    bankingNameVerified: 'ബാങ്കിങ് പേര് സ്ഥിരീകരിച്ചു',
    payingAmount: 'നൽകേണ്ട തുക',
    proceedToPay: (amount) => `പണം നൽകുക (${amount})`,
    upiPin: 'യുപിഐ പിൻ',
    enterUpiPin: 'നിങ്ങളുടെ 4 അക്ക യുപിഐ പിൻ നൽകുക',
    neverSharePin: 'യുപിഐ പിൻ ആരുമായും പങ്കിടരുത്',
    paidSuccessfully: 'പേയ്മെന്റ് വിജയകരം!',
    upiRef: 'യുപിഐ റഫ്',
    debitedFrom: 'ഈ അക്കൗണ്ടിൽ നിന്ന്',
    doneSuccess: 'പൂർത്തിയായി (ഡൺ)',
    selectContact: 'കോൺടാക്റ്റ് തിരഞ്ഞെടുക്കുക',
    secureTransfer: 'സുരക്ഷിത യുപിഐ പേയ്മെന്റ്',
    payMoney: 'പണം അയക്കുക (പേ)',
    request: 'അഭ്യർത്ഥിക്കുക',
    accountBalance: 'ബാങ്ക് ബാലൻസ്',
    availableBalance: 'ലഭ്യമായ ബാലൻസ്',
    doneBalance: 'മടങ്ങുക (ഡൺ)',
    transactionHistory: 'ഇടപാട് ചരിത്രം',
    paymentReceipt: 'പേയ്മെന്റ് രസീത്',
    completed: 'വിജയകരം',
    upiRefNo: 'യുപിഐ റഫ് നമ്പർ',
    paymentMode: 'പേയ്മെന്റ് രീതി',
    mockData: 'OLearn പരിശീലന ഡാറ്റ',
    scanAnyQr: 'ഏതെങ്കിലും ക്യുആർ സ്കാൻ ചെയ്യുക',
    payContacts: 'കോൺടാക്റ്റുകൾക്ക് പണം നൽകുക',
    checkBalance: 'ബാങ്ക് ബാലൻസ് പരിശോധിക്കുക',
    seeHistory: 'ഇടപാട് ചരിത്രം കാണുക',
    mockFooter: 'മാതൃക ഗൂഗിൾ പേ • യഥാർത്ഥ പണം ഉപയോഗിക്കുന്നില്ല'
  }
};
