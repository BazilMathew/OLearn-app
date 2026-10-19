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
  /** Line under the gallery title: how many photos and videos are shown */
  galleryRecent: string;
  flower: string;
  temple: string;
  grandchild: string;
  birthday: string;
  /** Attach sheet pills (Gallery and Document above) */
  location: string;
  contact: string;
  poll: string;
  payment: string;
  event: string;
  aiImages: string;
  /** Chat search: filter chips before and after typing, and the empty result */
  chipPhotos: string;
  chipVideos: string;
  chipLinks: string;
  chipDocuments: string;
  chipStickers: string;
  noResults: string;
  noResultsHelp: string;
  clearSearch: string;
  /** Document picker */
  recent: string;
  chipImages: string;
  chipAudio: string;
  browseOtherApps: string;
  recentFiles: string;
  jpgImage: string;
  /** Send location screen and the location message (invented places) */
  sendLocation: string;
  shareLiveLocation: string;
  nearbyPlaces: string;
  sendCurrentLocation: string;
  accurateTo: string;
  myLocation: string;
  placeBusStop: string;
  placePostOffice: string;
  addrMainRoad: string;
  addrStation: string;
  addrTemple: string;
  /** Updates tab and posting a text status */
  statusTitle: string;
  addStatus: string;
  channels: string;
  explore: string;
  statusText: string;
  statusMusic: string;
  statusLayout: string;
  statusVoice: string;
  recents: string;
  typeStatus: string;
  statusAudience: string;
  myStatus: string;
  justNow: string;
  /** Unknown-number chat (invented scam message), the block confirmation and the blocked chat */
  notAContact: string;
  safetyTools: string;
  block: string;
  add: string;
  scamMsg: string;
  blockQuestion: (number: string) => string;
  blockBody: string;
  reportTo: string;
  reportBody: string;
  youBlocked: string;
  /** Forwarding a message: the extra practice message, the Forward to list and the forwarded label */
  fwdMsg: string;
  forwardTo: string;
  nSelected: (n: number) => string;
  frequentlyContacted: string;
  recentChats: string;
  addMessage: string;
  forwarded: string;

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
  /** Send-money amount screen and payment-method sheet (contact flow) */
  payingRamesh: string;
  bankingName: (name: string) => string;
  upiId: (id: string) => string;
  addNote: string;
  keyNext: string;
  selectPaymentMethod: string;
  balanceLabel: string;
  checkNow: string;
  payAmount: (amount: string) => string;
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
  completed: string;
  upiRefNo: string;
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
  /** Google Pay home sections */
  payAnyone: string;
  bankTransfer: string;
  sectionPeople: string;
  sectionShops: string;
  sectionBills: string;
  mobileRecharge: string;
  billElectricity: string;
  billWater: string;
  sectionMoney: string;
  moneyReceived: string;
  choosePhoto: string;
  /** Amount screen header for any payee (the contact flow keeps payingRamesh) */
  paying: (name: string) => string;
  /** Pay anyone: the text field, the practice line and the results */
  payAnyoneField: string;
  payAnyonePractice: string;
  payAnyoneResults: string;
  payAnyoneNoMatch: string;
  clearField: string;
  /** Mobile recharge */
  enterMobileNumber: string;
  myRecharges: string;
  mobileOperators: string;
  prepaid: (operator: string) => string;
  myNumber: string;
  recommendedPlans: string;
  planBasic: string;
  planValue: string;
  planLong: string;
  planDetails: (days: number, gbPerDay: string) => string;
  /** Bank transfer */
  toOthers: string;
  toSelf: string;
  receiver: string;
  accountNumberField: string;
  ifscField: string;
  searchIfsc: string;
  continueLabel: string;
  bankPracticeNote: string;
  chooseBank: string;
  searchBank: string;
  /** Transaction history: every row says in words which way the money went */
  paidTo: (name: string) => string;
  receivedFrom: (name: string) => string;
  historyNote: string;
  gotIt: string;
  payAgain: string;
  share: string;
  havingIssues: string;
  paidFrom: string;
  creditedTo: string;
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
    galleryRecent: 'Recent · 5 photos, 1 video',
    flower: 'Flower',
    temple: 'Temple',
    grandchild: 'Grandchild',
    birthday: 'Birthday',
    location: 'Location',
    contact: 'Contact',
    poll: 'Poll',
    payment: 'Payment',
    event: 'Event',
    aiImages: 'AI images',
    chipPhotos: 'Photos',
    chipVideos: 'Videos',
    chipLinks: 'Links',
    chipDocuments: 'Documents',
    chipStickers: 'Stickers',
    noResults: 'No chats found',
    noResultsHelp: 'Tap ✕ to clear the box, then type another name, like Priya.',
    clearSearch: 'Clear',
    recent: 'Recent',
    chipImages: 'Images',
    chipAudio: 'Audio',
    browseOtherApps: 'Browse files in other apps',
    recentFiles: 'Recent files',
    jpgImage: 'JPG image',
    sendLocation: 'Send location',
    shareLiveLocation: 'Share live location',
    nearbyPlaces: 'Nearby places',
    sendCurrentLocation: 'Send your current location',
    accurateTo: 'Accurate to 20 meters',
    myLocation: 'My location',
    placeBusStop: 'Bus Stop',
    placePostOffice: 'Post Office',
    addrMainRoad: 'Main Road, Practice Town',
    addrStation: 'Station Road, Practice Town',
    addrTemple: 'Temple Street, Practice Town',
    statusTitle: 'Status',
    addStatus: 'Add status',
    channels: 'Channels',
    explore: 'Explore',
    statusText: 'Text',
    statusMusic: 'Music',
    statusLayout: 'Layout',
    statusVoice: 'Voice',
    recents: 'Recents',
    typeStatus: 'Type a status',
    statusAudience: 'Status (Contacts)',
    myStatus: 'My status',
    justNow: 'Just now',
    notAContact: 'Not a contact • No common groups',
    safetyTools: 'Safety tools',
    block: 'Block',
    add: 'Add',
    scamMsg: 'Congratulations! You have won a prize of ₹25,00,000. Send your bank details to claim it today.',
    blockQuestion: (number) => `Block ${number}?`,
    blockBody: "This person won't be able to message or call you. They won't know you blocked them.",
    reportTo: 'Report to WhatsApp',
    reportBody: 'The last 5 messages in this chat will be sent to WhatsApp.',
    youBlocked: 'You blocked this contact. Tap to unblock.',
    fwdMsg: 'Temple festival on Sunday at 6 PM. Please come!',
    forwardTo: 'Forward to…',
    nSelected: (n) => `${n} selected`,
    frequentlyContacted: 'Frequently contacted',
    recentChats: 'Recent chats',
    addMessage: 'Add a message…',
    forwarded: 'Forwarded',

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
    payingRamesh: 'Paying Ramesh',
    bankingName: (name) => `Banking name: ${name}`,
    upiId: (id) => `UPI ID: ${id}`,
    addNote: 'Add note',
    keyNext: 'Next',
    selectPaymentMethod: 'Select payment method',
    balanceLabel: 'Balance:',
    checkNow: 'Check now',
    payAmount: (amount) => `Pay ${amount}`,
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
    completed: 'Completed',
    upiRefNo: 'UPI Ref No',
    mockData: 'OLearn Sandboxed Mock Data',
    scanAnyQr: 'Scan any QR code',
    payContacts: 'Pay contacts',
    checkBalance: 'Check bank balance',
    seeHistory: 'See transaction history',
    mockFooter: 'Mock Google Pay Replica • No real money is used',
    tabMain: 'Main',
    tabBank: 'My bank',
    tabProfile: 'Profile',
    payAnyone: 'Pay anyone',
    bankTransfer: 'Bank transfer',
    sectionPeople: 'People',
    sectionShops: 'Shops',
    sectionBills: 'Pay bills',
    mobileRecharge: 'Mobile recharge',
    billElectricity: 'Electricity',
    billWater: 'Water',
    sectionMoney: 'Your money',
    moneyReceived: 'Money received',
    choosePhoto: 'Choose from photos',
    paying: (name) => `Paying ${name}`,
    payAnyoneField: 'Enter UPI ID or phone number',
    payAnyonePractice: 'Practice: any name or number will do.',
    payAnyoneResults: 'Results',
    payAnyoneNoMatch: 'No match. Practice names:',
    clearField: 'Clear',
    enterMobileNumber: 'Enter mobile number',
    myRecharges: 'My recharges',
    mobileOperators: 'Mobile operators',
    prepaid: (operator) => `${operator} Prepaid`,
    myNumber: 'My number',
    recommendedPlans: 'Recommended plans',
    planBasic: 'Basic pack',
    planValue: 'Value pack',
    planLong: 'Long pack',
    planDetails: (days, gb) => `${days} days • ${gb} GB/day • Unlimited calls`,
    toOthers: 'To others',
    toSelf: 'To self',
    receiver: 'Receiver',
    accountNumberField: 'Bank account number',
    ifscField: 'IFSC code',
    searchIfsc: 'Search for IFSC',
    continueLabel: 'Continue',
    bankPracticeNote: 'Practice details only. Nothing is saved.',
    chooseBank: 'Choose bank',
    searchBank: 'Search bank name',
    paidTo: (name) => `Paid to ${name}`,
    receivedFrom: (name) => `Received from ${name}`,
    historyNote: 'Received from means money came to you. Paid to means you paid. Receiving money never needs your UPI PIN.',
    gotIt: 'Got it',
    payAgain: 'Pay again',
    share: 'Share',
    havingIssues: 'Having issues?',
    paidFrom: 'Paid from',
    creditedTo: 'Credited to'
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
    galleryRecent: 'हाल ही में · 5 फोटो, 1 वीडियो',
    flower: 'फूल',
    temple: 'मंदिर',
    grandchild: 'पोता-पोती',
    birthday: 'जन्मदिन',
    location: 'लोकेशन',
    contact: 'संपर्क',
    poll: 'पोल',
    payment: 'पेमेंट',
    event: 'इवेंट',
    aiImages: 'AI तस्वीरें',
    chipPhotos: 'फ़ोटो',
    chipVideos: 'वीडियो',
    chipLinks: 'लिंक',
    chipDocuments: 'डॉक्यूमेंट',
    chipStickers: 'स्टिकर',
    noResults: 'कोई चैट नहीं मिली',
    noResultsHelp: '✕ दबाकर बॉक्स खाली करें, फिर कोई दूसरा नाम लिखें, जैसे प्रिया।',
    clearSearch: 'साफ़ करें',
    recent: 'हाल ही में',
    chipImages: 'इमेज',
    chipAudio: 'ऑडियो',
    browseOtherApps: 'दूसरे ऐप में फ़ाइलें देखें',
    recentFiles: 'हाल की फ़ाइलें',
    jpgImage: 'JPG इमेज',
    sendLocation: 'लोकेशन भेजें',
    shareLiveLocation: 'लाइव लोकेशन शेयर करें',
    nearbyPlaces: 'आस-पास की जगहें',
    sendCurrentLocation: 'अपनी मौजूदा लोकेशन भेजें',
    accurateTo: '20 मीटर तक सटीक',
    myLocation: 'मेरी लोकेशन',
    placeBusStop: 'बस स्टॉप',
    placePostOffice: 'डाकघर',
    addrMainRoad: 'मेन रोड, अभ्यास नगर',
    addrStation: 'स्टेशन रोड, अभ्यास नगर',
    addrTemple: 'मंदिर मार्ग, अभ्यास नगर',
    statusTitle: 'स्टेटस',
    addStatus: 'स्टेटस जोड़ें',
    channels: 'चैनल',
    explore: 'एक्सप्लोर',
    statusText: 'टेक्स्ट',
    statusMusic: 'संगीत',
    statusLayout: 'लेआउट',
    statusVoice: 'आवाज़',
    recents: 'हाल के',
    typeStatus: 'स्टेटस लिखें',
    statusAudience: 'स्टेटस (संपर्क)',
    myStatus: 'मेरा स्टेटस',
    justNow: 'अभी',
    notAContact: 'संपर्क में नहीं • कोई साझा ग्रुप नहीं',
    safetyTools: 'सुरक्षा टूल',
    block: 'ब्लॉक',
    add: 'जोड़ें',
    scamMsg: 'बधाई हो! आपने ₹25,00,000 का इनाम जीता है। इनाम पाने के लिए आज ही अपने बैंक की जानकारी भेजें।',
    blockQuestion: (number) => `${number} को ब्लॉक करें?`,
    blockBody: 'यह व्यक्ति आपको मैसेज या कॉल नहीं कर पाएगा। उसे पता नहीं चलेगा कि आपने ब्लॉक किया है।',
    reportTo: 'व्हाट्सएप को रिपोर्ट करें',
    reportBody: 'इस चैट के आखिरी 5 मैसेज व्हाट्सएप को भेजे जाएँगे।',
    youBlocked: 'आपने इस संपर्क को ब्लॉक किया है। अनब्लॉक करने के लिए टैप करें।',
    fwdMsg: 'रविवार शाम 6 बजे मंदिर में उत्सव है। ज़रूर आइए!',
    forwardTo: 'इसे भेजें…',
    nSelected: (n) => `${n} चुना गया`,
    frequentlyContacted: 'अक्सर संपर्क किए गए',
    recentChats: 'हाल की चैट',
    addMessage: 'मैसेज जोड़ें…',
    forwarded: 'फॉरवर्ड किया गया',

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
    payingRamesh: 'रमेश को भुगतान',
    bankingName: (name) => `बैंकिंग नाम: ${name}`,
    upiId: (id) => `UPI आईडी: ${id}`,
    addNote: 'नोट जोड़ें',
    keyNext: 'आगे',
    selectPaymentMethod: 'भुगतान का तरीका चुनें',
    balanceLabel: 'बैलेंस:',
    checkNow: 'अभी देखें',
    payAmount: (amount) => `${amount} का भुगतान करें`,
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
    completed: 'सफल भुगतान',
    upiRefNo: 'यूपीआई रेफ़ नंबर',
    mockData: 'OLearn अभ्यास डेटा',
    scanAnyQr: 'कोई भी क्यूआर स्कैन करें',
    payContacts: 'संपर्कों को पैसे भेजें',
    checkBalance: 'बैंक बैलेंस चेक करें',
    seeHistory: 'लेन-देन का इतिहास देखें',
    mockFooter: 'डेमो गूगल पे • असली पैसे का उपयोग नहीं होता',
    tabMain: 'मुख्य',
    tabBank: 'मेरा बैंक',
    tabProfile: 'प्रोफ़ाइल',
    payAnyone: 'किसी को भी पैसे भेजें',
    bankTransfer: 'बैंक ट्रांसफर',
    sectionPeople: 'लोग',
    sectionShops: 'दुकानें',
    sectionBills: 'बिल भरें',
    mobileRecharge: 'मोबाइल रिचार्ज',
    billElectricity: 'बिजली',
    billWater: 'पानी',
    sectionMoney: 'आपका पैसा',
    moneyReceived: 'पैसे मिले',
    choosePhoto: 'फ़ोटो से चुनें',
    paying: (name) => `${name} को भुगतान`,
    payAnyoneField: 'यूपीआई आईडी या फ़ोन नंबर डालें',
    payAnyonePractice: 'अभ्यास: कोई भी नाम या नंबर चलेगा।',
    payAnyoneResults: 'नतीजे',
    payAnyoneNoMatch: 'कोई मेल नहीं। अभ्यास के नाम:',
    clearField: 'मिटाएं',
    enterMobileNumber: 'मोबाइल नंबर डालें',
    myRecharges: 'मेरे रिचार्ज',
    mobileOperators: 'मोबाइल ऑपरेटर',
    prepaid: (operator) => `${operator} प्रीपेड`,
    myNumber: 'मेरा नंबर',
    recommendedPlans: 'सुझाए गए प्लान',
    planBasic: 'बेसिक पैक',
    planValue: 'वैल्यू पैक',
    planLong: 'लंबा पैक',
    planDetails: (days, gb) => `${days} दिन • ${gb} GB/दिन • अनलिमिटेड कॉल`,
    toOthers: 'दूसरों को',
    toSelf: 'अपने खाते में',
    receiver: 'पाने वाला',
    accountNumberField: 'बैंक अकाउंट नंबर',
    ifscField: 'IFSC कोड',
    searchIfsc: 'IFSC खोजें',
    continueLabel: 'आगे बढ़ें',
    bankPracticeNote: 'केवल अभ्यास विवरण। कुछ भी सेव नहीं होता।',
    chooseBank: 'बैंक चुनें',
    searchBank: 'बैंक का नाम खोजें',
    paidTo: (name) => `${name} को भुगतान किया`,
    receivedFrom: (name) => `${name} से प्राप्त हुआ`,
    historyNote: 'प्राप्त हुआ = आपको पैसे मिले। भुगतान किया = आपने पैसे दिए। पैसे पाने के लिए यूपीआई पिन कभी नहीं चाहिए।',
    gotIt: 'ठीक है',
    payAgain: 'फिर से भुगतान करें',
    share: 'शेयर करें',
    havingIssues: 'कोई समस्या?',
    paidFrom: 'इस खाते से',
    creditedTo: 'इस खाते में'
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
    galleryRecent: 'അടുത്തിടെ · 5 ഫോട്ടോ, 1 വീഡിയോ',
    flower: 'പൂവ്',
    temple: 'ക്ഷേത്രം',
    grandchild: 'പേരക്കുട്ടി',
    birthday: 'ജന്മദിനം',
    location: 'ലൊക്കേഷൻ',
    contact: 'കോൺടാക്റ്റ്',
    poll: 'പോൾ',
    payment: 'പേയ്മെന്റ്',
    event: 'ഇവന്റ്',
    aiImages: 'AI ചിത്രങ്ങൾ',
    chipPhotos: 'ഫോട്ടോകൾ',
    chipVideos: 'വീഡിയോകൾ',
    chipLinks: 'ലിങ്കുകൾ',
    chipDocuments: 'ഡോക്യുമെന്റുകൾ',
    chipStickers: 'സ്റ്റിക്കറുകൾ',
    noResults: 'ചാറ്റുകളൊന്നും കണ്ടെത്തിയില്ല',
    noResultsHelp: '✕ തൊട്ട് ബോക്സ് മായ്ക്കുക, എന്നിട്ട് പ്രിയ പോലെ മറ്റൊരു പേര് എഴുതുക.',
    clearSearch: 'മായ്ക്കുക',
    recent: 'അടുത്തിടെ',
    chipImages: 'ചിത്രങ്ങൾ',
    chipAudio: 'ഓഡിയോ',
    browseOtherApps: 'മറ്റ് ആപ്പുകളിലെ ഫയലുകൾ കാണുക',
    recentFiles: 'അടുത്തിടെയുള്ള ഫയലുകൾ',
    jpgImage: 'JPG ചിത്രം',
    sendLocation: 'ലൊക്കേഷൻ അയക്കുക',
    shareLiveLocation: 'ലൈവ് ലൊക്കേഷൻ പങ്കിടുക',
    nearbyPlaces: 'സമീപത്തുള്ള സ്ഥലങ്ങൾ',
    sendCurrentLocation: 'നിലവിലെ ലൊക്കേഷൻ അയക്കുക',
    accurateTo: '20 മീറ്റർ വരെ കൃത്യം',
    myLocation: 'എന്റെ ലൊക്കേഷൻ',
    placeBusStop: 'ബസ് സ്റ്റോപ്പ്',
    placePostOffice: 'പോസ്റ്റ് ഓഫീസ്',
    addrMainRoad: 'മെയിൻ റോഡ്, പരിശീലന നഗരം',
    addrStation: 'സ്റ്റേഷൻ റോഡ്, പരിശീലന നഗരം',
    addrTemple: 'ക്ഷേത്ര റോഡ്, പരിശീലന നഗരം',
    statusTitle: 'സ്റ്റാറ്റസ്',
    addStatus: 'സ്റ്റാറ്റസ് ചേർക്കുക',
    channels: 'ചാനലുകൾ',
    explore: 'എക്സ്പ്ലോർ',
    statusText: 'ടെക്സ്റ്റ്',
    statusMusic: 'സംഗീതം',
    statusLayout: 'ലേഔട്ട്',
    statusVoice: 'വോയ്സ്',
    recents: 'സമീപകാലം',
    typeStatus: 'സ്റ്റാറ്റസ് ടൈപ്പ് ചെയ്യുക',
    statusAudience: 'സ്റ്റാറ്റസ് (കോൺടാക്റ്റുകൾ)',
    myStatus: 'എന്റെ സ്റ്റാറ്റസ്',
    justNow: 'ഇപ്പോൾ',
    notAContact: 'കോൺടാക്റ്റിൽ ഇല്ല • പൊതു ഗ്രൂപ്പുകൾ ഇല്ല',
    safetyTools: 'സുരക്ഷാ ടൂളുകൾ',
    block: 'ബ്ലോക്ക്',
    add: 'ചേർക്കുക',
    scamMsg: 'അഭിനന്ദനങ്ങൾ! നിങ്ങൾക്ക് ₹25,00,000 സമ്മാനം ലഭിച്ചു. അത് നേടാൻ ഇന്നുതന്നെ ബാങ്ക് വിവരങ്ങൾ അയക്കുക.',
    blockQuestion: (number) => `${number} ബ്ലോക്ക് ചെയ്യണോ?`,
    blockBody: 'ഈ ആൾക്ക് നിങ്ങൾക്ക് മെസ്സേജ് അയക്കാനോ വിളിക്കാനോ കഴിയില്ല. ബ്ലോക്ക് ചെയ്തത് അവർ അറിയില്ല.',
    reportTo: 'വാട്ട്സ്ആപ്പിൽ റിപ്പോർട്ട് ചെയ്യുക',
    reportBody: 'ഈ ചാറ്റിലെ അവസാന 5 മെസ്സേജുകൾ വാട്ട്സ്ആപ്പിന് അയക്കും.',
    youBlocked: 'നിങ്ങൾ ഈ കോൺടാക്റ്റ് ബ്ലോക്ക് ചെയ്തു. അൺബ്ലോക്ക് ചെയ്യാൻ തൊടുക.',
    fwdMsg: 'ഞായറാഴ്ച വൈകിട്ട് 6 മണിക്ക് ക്ഷേത്രോത്സവം. വരണേ!',
    forwardTo: 'ഫോർവേഡ് ചെയ്യുക…',
    nSelected: (n) => `${n} തിരഞ്ഞെടുത്തു`,
    frequentlyContacted: 'പതിവായി ബന്ധപ്പെടുന്നവർ',
    recentChats: 'സമീപകാല ചാറ്റുകൾ',
    addMessage: 'മെസ്സേജ് ചേർക്കുക…',
    forwarded: 'ഫോർവേഡ് ചെയ്തത്',

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
    payingRamesh: 'രമേഷിന് പണം നൽകുന്നു',
    bankingName: (name) => `ബാങ്കിലെ പേര്: ${name}`,
    upiId: (id) => `UPI ഐഡി: ${id}`,
    addNote: 'കുറിപ്പ് ചേർക്കുക',
    keyNext: 'തുടരുക',
    selectPaymentMethod: 'പണമടയ്ക്കൽ രീതി തിരഞ്ഞെടുക്കുക',
    balanceLabel: 'ബാലൻസ്:',
    checkNow: 'ഇപ്പോൾ നോക്കുക',
    payAmount: (amount) => `${amount} നൽകുക`,
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
    completed: 'വിജയകരം',
    upiRefNo: 'യുപിഐ റഫ് നമ്പർ',
    mockData: 'OLearn പരിശീലന ഡാറ്റ',
    scanAnyQr: 'ഏതെങ്കിലും ക്യുആർ സ്കാൻ ചെയ്യുക',
    payContacts: 'കോൺടാക്റ്റുകൾക്ക് പണം നൽകുക',
    checkBalance: 'ബാങ്ക് ബാലൻസ് പരിശോധിക്കുക',
    seeHistory: 'ഇടപാട് ചരിത്രം കാണുക',
    mockFooter: 'മാതൃക ഗൂഗിൾ പേ • യഥാർത്ഥ പണം ഉപയോഗിക്കുന്നില്ല',
    tabMain: 'പ്രധാനം',
    tabBank: 'എന്റെ ബാങ്ക്',
    tabProfile: 'പ്രൊഫൈൽ',
    payAnyone: 'ആർക്കും പണം നൽകുക',
    bankTransfer: 'ബാങ്ക് ട്രാൻസ്ഫർ',
    sectionPeople: 'ആളുകൾ',
    sectionShops: 'കടകൾ',
    sectionBills: 'ബില്ലുകൾ അടയ്ക്കുക',
    mobileRecharge: 'മൊബൈൽ റീചാർജ്',
    billElectricity: 'കറന്റ് ബിൽ',
    billWater: 'വെള്ളം',
    sectionMoney: 'നിങ്ങളുടെ പണം',
    moneyReceived: 'പണം ലഭിച്ചു',
    choosePhoto: 'ഫോട്ടോയിൽ നിന്ന് തിരഞ്ഞെടുക്കുക',
    paying: (name) => `പണം നൽകുന്നത്: ${name}`,
    payAnyoneField: 'യുപിഐ ഐഡി അല്ലെങ്കിൽ ഫോൺ നമ്പർ',
    payAnyonePractice: 'പരിശീലനം: ഏത് പേരും നമ്പറും മതി.',
    payAnyoneResults: 'ഫലങ്ങൾ',
    payAnyoneNoMatch: 'പൊരുത്തമില്ല. പരിശീലന പേരുകൾ:',
    clearField: 'മായ്ക്കുക',
    enterMobileNumber: 'മൊബൈൽ നമ്പർ നൽകുക',
    myRecharges: 'എന്റെ റീചാർജുകൾ',
    mobileOperators: 'മൊബൈൽ ഓപ്പറേറ്റർമാർ',
    prepaid: (operator) => `${operator} പ്രീപെയ്ഡ്`,
    myNumber: 'എന്റെ നമ്പർ',
    recommendedPlans: 'നിർദ്ദേശിച്ച പ്ലാനുകൾ',
    planBasic: 'ബേസിക് പായ്ക്ക്',
    planValue: 'വാല്യൂ പായ്ക്ക്',
    planLong: 'ലോങ് പായ്ക്ക്',
    planDetails: (days, gb) => `${days} ദിവസം • ${gb} GB/ദിവസം • അൺലിമിറ്റഡ് കോൾ`,
    toOthers: 'മറ്റുള്ളവർക്ക്',
    toSelf: 'സ്വന്തം അക്കൗണ്ടിലേക്ക്',
    receiver: 'സ്വീകർത്താവ്',
    accountNumberField: 'ബാങ്ക് അക്കൗണ്ട് നമ്പർ',
    ifscField: 'IFSC കോഡ്',
    searchIfsc: 'IFSC തിരയുക',
    continueLabel: 'തുടരുക',
    bankPracticeNote: 'പരിശീലന വിവരങ്ങൾ മാത്രം. ഒന്നും സേവ് ചെയ്യില്ല.',
    chooseBank: 'ബാങ്ക് തിരഞ്ഞെടുക്കുക',
    searchBank: 'ബാങ്കിന്റെ പേര് തിരയുക',
    paidTo: (name) => `നൽകിയത്: ${name}`,
    receivedFrom: (name) => `ലഭിച്ചത്: ${name}`,
    historyNote: 'ലഭിച്ചത് = നിങ്ങൾക്ക് വന്ന പണം. നൽകിയത് = നിങ്ങൾ നൽകിയ പണം. പണം ലഭിക്കാൻ യുപിഐ പിൻ ഒരിക്കലും വേണ്ട.',
    gotIt: 'ശരി',
    payAgain: 'വീണ്ടും നൽകുക',
    share: 'ഷെയർ ചെയ്യുക',
    havingIssues: 'പ്രശ്നമുണ്ടോ?',
    paidFrom: 'ഈ അക്കൗണ്ടിൽ നിന്ന്',
    creditedTo: 'ഈ അക്കൗണ്ടിലേക്ക്'
  }
};
