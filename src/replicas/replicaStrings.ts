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
  /** Call screen controls (voice and video) */
  callSecure: string;
  callSpeaker: string;
  callMicOff: string;
  callOptions: string;
  callAddPeople: string;
  endCall: string;
  switchCamera: string;
  cameraOff: string;
  pauseRecording: string;
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

  // Phone home screen
  homeDate: string;
  appPhone: string;
  appWhatsApp: string;
  appGPay: string;

  // WhatsApp chat list
  search: string;
  chipAll: string;
  chipUnread: string;
  chipFavorites: string;
  chipGroups: string;
  tabChats: string;
  tabUpdates: string;
  tabCommunities: string;
  tabCalls: string;
  /** Other sample chats, top to bottom: Priya, family group, shop, doctor, temple, neighbours, walking group, pharmacy (Ramesh comes last) */
  chatListPriyaMsg: string;
  chatListFamily: string;
  chatListFamilyMsg: string;
  chatListShopMsg: string;
  chatListDoctor: string;
  chatListDoctorMsg: string;
  chatListTemple: string;
  chatListTempleMsg: string;
  chatListNeighbours: string;
  chatListNeighboursMsg: string;
  chatListWalking: string;
  chatListWalkingMsg: string;
  chatListPharmacy: string;
  chatListPharmacyMsg: string;

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
  /** Google Pay bottom bar (inert) */
  tabMain: string;
  tabBank: string;
  tabProfile: string;
  /** Google Pay home sections (inert) */
  sendToBank: string;
  sectionPeople: string;
  sectionShops: string;
  sectionBills: string;
  billPhone: string;
  billElectricity: string;
  billWater: string;
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
    callSecure: 'Secure call',
    callSpeaker: 'Loud speaker',
    callMicOff: 'Mic off',
    callOptions: 'Options',
    callAddPeople: 'Add people',
    endCall: 'End call',
    switchCamera: 'Switch camera',
    cameraOff: 'Camera off',
    pauseRecording: 'Pause recording',
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

    homeDate: 'Monday, 9 March',
    appPhone: 'Phone',
    appWhatsApp: 'WhatsApp',
    appGPay: 'Google Pay',

    search: 'Search',
    chipAll: 'All',
    chipUnread: 'Unread',
    chipFavorites: 'Favorites',
    chipGroups: 'Groups',
    tabChats: 'Chats',
    tabUpdates: 'Updates',
    tabCommunities: 'Communities',
    tabCalls: 'Calls',
    chatListPriyaMsg: 'Lunch is ready!',
    chatListFamily: 'Family Group',
    chatListFamilyMsg: 'Happy birthday!',
    chatListShopMsg: 'Your order is ready',
    chatListDoctor: 'Dr. Sharma',
    chatListDoctorMsg: 'Please come at 5 PM',
    chatListTemple: 'Temple Committee',
    chatListTempleMsg: 'Puja at 6 PM today',
    chatListNeighbours: 'Neighbours',
    chatListNeighboursMsg: 'No water supply on Sunday',
    chatListWalking: 'Walking Group',
    chatListWalkingMsg: 'See you at the park',
    chatListPharmacy: 'Pharmacy',
    chatListPharmacyMsg: 'Your medicines are ready',

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
    mockFooter: 'Mock Google Pay Replica • No real money is used',
    tabMain: 'Main',
    tabBank: 'My bank',
    tabProfile: 'Profile',
    sendToBank: 'Send to bank',
    sectionPeople: 'People',
    sectionShops: 'Shops',
    sectionBills: 'Pay bills',
    billPhone: 'Phone recharge',
    billElectricity: 'Electricity',
    billWater: 'Water'
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
    callSecure: 'सुरक्षित कॉल',
    callSpeaker: 'लाउड स्पीकर',
    callMicOff: 'माइक बंद',
    callOptions: 'विकल्प',
    callAddPeople: 'लोग जोड़ें',
    endCall: 'कॉल काटें',
    switchCamera: 'कैमरा बदलें',
    cameraOff: 'कैमरा बंद',
    pauseRecording: 'रिकॉर्डिंग रोकें',
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

    homeDate: 'सोमवार, 9 मार्च',
    appPhone: 'फ़ोन',
    appWhatsApp: 'व्हाट्सएप',
    appGPay: 'गूगल पे',

    search: 'खोजें',
    chipAll: 'सभी',
    chipUnread: 'बिना पढ़े',
    chipFavorites: 'पसंदीदा',
    chipGroups: 'ग्रुप',
    tabChats: 'चैट',
    tabUpdates: 'अपडेट',
    tabCommunities: 'कम्युनिटी',
    tabCalls: 'कॉल',
    chatListPriyaMsg: 'खाना तैयार है!',
    chatListFamily: 'परिवार ग्रुप',
    chatListFamilyMsg: 'जन्मदिन मुबारक हो!',
    chatListShopMsg: 'आपका सामान तैयार है',
    chatListDoctor: 'डॉ. शर्मा',
    chatListDoctorMsg: 'शाम 5 बजे आइए',
    chatListTemple: 'मंदिर समिति',
    chatListTempleMsg: 'आज शाम 6 बजे पूजा है',
    chatListNeighbours: 'पड़ोसी',
    chatListNeighboursMsg: 'रविवार को पानी नहीं आएगा',
    chatListWalking: 'सैर ग्रुप',
    chatListWalkingMsg: 'पार्क में मिलते हैं',
    chatListPharmacy: 'दवा की दुकान',
    chatListPharmacyMsg: 'आपकी दवाइयाँ तैयार हैं',

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
    mockFooter: 'डेमो गूगल पे • असली पैसे का उपयोग नहीं होता',
    tabMain: 'मुख्य',
    tabBank: 'मेरा बैंक',
    tabProfile: 'प्रोफ़ाइल',
    sendToBank: 'बैंक में भेजें',
    sectionPeople: 'लोग',
    sectionShops: 'दुकानें',
    sectionBills: 'बिल भरें',
    billPhone: 'फ़ोन रिचार्ज',
    billElectricity: 'बिजली',
    billWater: 'पानी'
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
    chatTyped: 'ഞാൻ സുഖമായി ഇരിക്കുന്നു...',
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
    callSecure: 'സുരക്ഷിത കോൾ',
    callSpeaker: 'ലൗഡ് സ്പീക്കർ',
    callMicOff: 'മൈക്ക് ഓഫ്',
    callOptions: 'ഓപ്ഷനുകൾ',
    callAddPeople: 'ആളെ ചേർക്കുക',
    endCall: 'കോൾ നിർത്തുക',
    switchCamera: 'ക്യാമറ മാറ്റുക',
    cameraOff: 'ക്യാമറ ഓഫ്',
    pauseRecording: 'റെക്കോർഡിംഗ് നിർത്തുക',
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

    homeDate: 'തിങ്കൾ, 9 മാർച്ച്',
    appPhone: 'ഫോൺ',
    appWhatsApp: 'വാട്ട്സ്ആപ്പ്',
    appGPay: 'ഗൂഗിൾ പേ',

    search: 'തിരയുക',
    chipAll: 'എല്ലാം',
    chipUnread: 'വായിക്കാത്തവ',
    chipFavorites: 'പ്രിയപ്പെട്ടവ',
    chipGroups: 'ഗ്രൂപ്പുകൾ',
    tabChats: 'ചാറ്റുകൾ',
    tabUpdates: 'അപ്ഡേറ്റുകൾ',
    tabCommunities: 'കമ്മ്യൂണിറ്റികൾ',
    tabCalls: 'കോളുകൾ',
    chatListPriyaMsg: 'ഊണ് തയ്യാർ!',
    chatListFamily: 'കുടുംബ ഗ്രൂപ്പ്',
    chatListFamilyMsg: 'ജന്മദിനാശംസകൾ!',
    chatListShopMsg: 'നിങ്ങളുടെ സാധനങ്ങൾ തയ്യാർ',
    chatListDoctor: 'ഡോ. ശർമ്മ',
    chatListDoctorMsg: 'വൈകുന്നേരം 5 മണിക്ക് വരൂ',
    chatListTemple: 'ക്ഷേത്ര കമ്മിറ്റി',
    chatListTempleMsg: 'ഇന്ന് വൈകുന്നേരം 6 മണിക്ക് പൂജ',
    chatListNeighbours: 'അയൽക്കാർ',
    chatListNeighboursMsg: 'ഞായറാഴ്ച വെള്ളം ഉണ്ടാകില്ല',
    chatListWalking: 'നടത്ത ഗ്രൂപ്പ്',
    chatListWalkingMsg: 'പാർക്കിൽ കാണാം',
    chatListPharmacy: 'മെഡിക്കൽ ഷോപ്പ്',
    chatListPharmacyMsg: 'നിങ്ങളുടെ മരുന്നുകൾ തയ്യാർ',

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
    mockFooter: 'മാതൃക ഗൂഗിൾ പേ • യഥാർത്ഥ പണം ഉപയോഗിക്കുന്നില്ല',
    tabMain: 'പ്രധാനം',
    tabBank: 'എന്റെ ബാങ്ക്',
    tabProfile: 'പ്രൊഫൈൽ',
    sendToBank: 'ബാങ്കിലേക്ക് അയയ്ക്കുക',
    sectionPeople: 'ആളുകൾ',
    sectionShops: 'കടകൾ',
    sectionBills: 'ബില്ലുകൾ അടയ്ക്കുക',
    billPhone: 'ഫോൺ റീചാർജ്',
    billElectricity: 'കറന്റ് ബിൽ',
    billWater: 'വെള്ളം'
  }
};
