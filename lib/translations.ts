export type Language = 'en' | 'hi' | 'ta' | 'te' | 'kn' | 'ml';

export interface TranslationDictionary {
  // Navigation
  dashboard: string;
  customers: string;
  billing: string;
  appointments: string;
  accounts: string;
  reminders: string;
  marketing: string;
  pricelist: string;
  team: string;
  reports: string;
  settings: string;
  overview: string;
  manage: string;

  // TopBar
  searchPlaceholder: string;
  notifications: string;
  themeToggle: string;
  signOut: string;

  // Common Actions
  save: string;
  cancel: string;
  edit: string;
  delete: string;
  close: string;
  confirm: string;
  view: string;
  add: string;
  exportExcel: string;
  generatePdf: string;
  inviteWhatsApp: string;

  // Dashboard & KPIs
  greetingMorning: string;
  greetingAfternoon: string;
  greetingEvening: string;
  totalRevenue: string;
  todayRevenue: string;
  todayAppointments: string;
  todayBills: string;
  pendingDues: string;
  bookAgain: string;
  newBooking: string;
  createBill: string;
  inChair: string;
  todaySchedule: string;
  recentBills: string;

  // Billing
  clientName: string;
  mobileNumber: string;
  selectServices: string;
  paymentMode: string;
  saveAndShare: string;
  printBill: string;
  discount: string;
  totalAmount: string;
  paidAmount: string;
  balanceDue: string;

  // Appointments
  newAppointment: string;
  bookingDate: string;
  timeSlot: string;
  assignStylist: string;
  clientNotes: string;
  confirmed: string;
  done: string;
  cancelled: string;
  history: string;

  // Expenses & Ledger
  addExpense: string;
  totalInflow: string;
  totalExpenses: string;
  netProfit: string;
  today: string;
  week: string;
  month: string;
  year: string;
  customRange: string;

  // Reports
  reportTab: string;
  summaryTab: string;
  invoicesTab: string;
  dayWiseBreakdown: string;
  stylistPerformance: string;
  servicePerformance: string;
  paymentSummary: string;
  chooseYear: string;
  chooseMonth: string;

  // Team
  addStylist: string;
  stylistRoster: string;
  active: string;
  invited: string;
  inactive: string;
  updateRating: string;
  permissions: string;

  // Settings
  shopProfile: string;
  invoiceSettings: string;
  subscriptionBilling: string;
  settingsHelp: string;
  appLanguage: string;
  changePhone: string;
  privacyPolicy: string;
  faq: string;
  deleteAccount: string;
}

export const translations: Record<Language, TranslationDictionary> = {
  en: {
    dashboard: 'Dashboard',
    customers: 'Customers',
    billing: 'Express Billing',
    appointments: 'Appointments',
    accounts: 'Expenses & Dues',
    reminders: 'Reminders',
    marketing: 'WhatsApp Marketing',
    pricelist: 'Services & Prices',
    team: 'Team',
    reports: 'Reports & Invoices',
    settings: 'Settings',
    overview: 'OVERVIEW',
    manage: 'MANAGE',

    searchPlaceholder: 'Search customers, bills, team...',
    notifications: 'Reminders & Notifications',
    themeToggle: 'Toggle Theme',
    signOut: 'Sign Out',

    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    close: 'Close',
    confirm: 'Confirm',
    view: 'View',
    add: '+ Add',
    exportExcel: 'Export Excel',
    generatePdf: 'Generate PDF',
    inviteWhatsApp: 'Invite via WhatsApp',

    greetingMorning: 'Good Morning',
    greetingAfternoon: 'Good Afternoon',
    greetingEvening: 'Good Evening',
    totalRevenue: 'Total Revenue',
    todayRevenue: 'Today Revenue',
    todayAppointments: 'Today Appointments',
    todayBills: 'Today Bills',
    pendingDues: 'Pending Dues',
    bookAgain: 'Book Again',
    newBooking: '+ New Booking',
    createBill: '+ Create Bill',
    inChair: 'In Chair',
    todaySchedule: "Today's Schedule",
    recentBills: 'Recent Bills',

    clientName: 'Client Name',
    mobileNumber: 'Mobile Number',
    selectServices: 'Select Services',
    paymentMode: 'Payment Mode',
    saveAndShare: 'Save & Share Bill on WhatsApp',
    printBill: 'Print Bill / Thermal Slip',
    discount: 'Discount',
    totalAmount: 'Total Amount',
    paidAmount: 'Paid Amount',
    balanceDue: 'Balance Due',

    newAppointment: 'New Salon Appointment',
    bookingDate: 'Booking Date',
    timeSlot: 'Time Slot',
    assignStylist: 'Assign Stylist',
    clientNotes: 'Client Preference / Special Instructions',
    confirmed: 'Confirmed',
    done: 'Done',
    cancelled: 'Cancelled',
    history: 'History',

    addExpense: 'Add Expense',
    totalInflow: 'Total Inflow',
    totalExpenses: 'Total Expenses',
    netProfit: 'Estimated Net Profit',
    today: 'Today',
    week: 'Week',
    month: 'Month',
    year: 'Year',
    customRange: 'Custom Range',

    reportTab: 'Report',
    summaryTab: 'Summary',
    invoicesTab: 'Invoices',
    dayWiseBreakdown: 'Day-Wise Breakdown',
    stylistPerformance: 'Stylist Performance',
    servicePerformance: 'Service Performance',
    paymentSummary: 'Payment Summary',
    chooseYear: 'Choose a Year',
    chooseMonth: 'Choose a Month',

    addStylist: '+ Add Stylist',
    stylistRoster: 'Stylist Performance Report',
    active: 'Active',
    invited: 'Invited',
    inactive: 'Inactive',
    updateRating: 'Update Rating',
    permissions: 'Stylist Permissions',

    shopProfile: 'Shop Profile',
    invoiceSettings: 'Invoice Settings',
    subscriptionBilling: 'Subscription & Billing',
    settingsHelp: 'Settings & Help',
    appLanguage: 'App Language',
    changePhone: 'Change Phone Number',
    privacyPolicy: 'Privacy Policy',
    faq: 'Salon FAQ',
    deleteAccount: 'Permanently Delete Account',
  },

  hi: {
    dashboard: 'डैशबोर्ड',
    customers: 'ग्राहक सूची',
    billing: 'एक्सप्रेस बिलिंग',
    appointments: 'नियुक्तियां',
    accounts: 'खर्च और बकाया',
    reminders: 'रिमाइंडर',
    marketing: 'व्हाट्सएप मार्केटिंग',
    pricelist: 'सेवाएं और दरें',
    team: 'स्टाइलिस्ट टीम',
    reports: 'रिपोर्ट और बिल',
    settings: 'सेटिंग्स',
    overview: 'अवलोकन',
    manage: 'प्रबंधन',

    searchPlaceholder: 'ग्राहक, बिल या टीम खोजें...',
    notifications: 'रिमाइंडर और सूचनाएं',
    themeToggle: 'थीम बदलें',
    signOut: 'साइन आउट',

    save: 'सहेजें',
    cancel: 'रद्द करें',
    edit: 'संपादित करें',
    delete: 'हटाएं',
    close: 'बंद करें',
    confirm: 'पुष्टि करें',
    view: 'देखें',
    add: '+ जोड़ें',
    exportExcel: 'एक्सेल निर्यात',
    generatePdf: 'पीडीएफ बनाएं',
    inviteWhatsApp: 'व्हाट्सएप पर आमंत्रित करें',

    greetingMorning: 'शुभ प्रभात',
    greetingAfternoon: 'शुभ दोपहर',
    greetingEvening: 'शुभ संध्या',
    totalRevenue: 'कुल राजस्व',
    todayRevenue: 'आज का राजस्व',
    todayAppointments: 'आज की नियुक्तियाँ',
    todayBills: 'आज के बिल',
    pendingDues: 'बकाया राशि',
    bookAgain: 'पुनः बुक करें',
    newBooking: '+ नई बुकिंग',
    createBill: '+ बिल बनाएं',
    inChair: 'चेयर में',
    todaySchedule: 'आज का कार्यक्रम',
    recentBills: 'हाल के बिल',

    clientName: 'ग्राहक का नाम',
    mobileNumber: 'मोबाइल नंबर',
    selectServices: 'सेवाएं चुनें',
    paymentMode: 'भुगतान का तरीका',
    saveAndShare: 'बिल सहेजें व व्हाट्सएप पर भेजें',
    printBill: 'बिल प्रिंट करें',
    discount: 'छूट',
    totalAmount: 'कुल राशि',
    paidAmount: 'भुगतान राशि',
    balanceDue: 'शेष बकाया',

    newAppointment: 'नई सैलून नियुक्ति',
    bookingDate: 'बुकिंग तिथि',
    timeSlot: 'समय स्लॉट',
    assignStylist: 'स्टाइलिस्ट चुनें',
    clientNotes: 'ग्राहक की प्राथमिकता / निर्देश',
    confirmed: 'पुष्ट',
    done: 'पूर्ण',
    cancelled: 'रद्द',
    history: 'इतिहास',

    addExpense: 'खर्च जोड़ें',
    totalInflow: 'कुल आय (इनफ्लो)',
    totalExpenses: 'कुल खर्च',
    netProfit: 'अनुमानित शुद्ध लाभ',
    today: 'आज',
    week: 'सप्ताह',
    month: 'महीना',
    year: 'वर्ष',
    customRange: 'कस्टम अवधि',

    reportTab: 'रिपोर्ट',
    summaryTab: 'वार्षिक सारांश',
    invoicesTab: 'बिल सूची',
    dayWiseBreakdown: 'दिन-वार विवरण',
    stylistPerformance: 'स्टाइलिस्ट प्रदर्शन',
    servicePerformance: 'सेवा प्रदर्शन',
    paymentSummary: 'भुगतान सारांश',
    chooseYear: 'वर्ष चुनें',
    chooseMonth: 'महीना चुनें',

    addStylist: '+ स्टाइलिस्ट जोड़ें',
    stylistRoster: 'स्टाइलिस्ट प्रदर्शन रिपोर्ट',
    active: 'सक्रिय',
    invited: 'आमंत्रित',
    inactive: 'निष्क्रिय',
    updateRating: 'रेटिंग बदलें',
    permissions: 'स्टाइलिस्ट अनुमतियां',

    shopProfile: 'सैलून प्रोफाइल',
    invoiceSettings: 'बिलिंग सेटिंग्स',
    subscriptionBilling: 'सदस्यता व भुगतान',
    settingsHelp: 'सेटिंग्स और सहायता',
    appLanguage: 'ऐप की भाषा',
    changePhone: 'फोन नंबर बदलें',
    privacyPolicy: 'गोपनीयता नीति',
    faq: 'सैलून सवाल-जवाब',
    deleteAccount: 'खाता स्थायी रूप से हटाएं',
  },

  ta: {
    dashboard: 'டாஷ்போர்டு',
    customers: 'வாடிக்கையாளர்கள்',
    billing: 'விரைவு பில்லிங்',
    appointments: 'முன்பதிவுகள்',
    accounts: 'செலவுகள் & நிலுவை',
    reminders: 'நினைவூட்டல்கள்',
    marketing: 'வாட்ஸ்அப் விளம்பரம்',
    pricelist: 'சேவைகள் & விலைகள்',
    team: 'ஸ்டைலிஸ்ட் குழு',
    reports: 'அறிக்கைகள் & பில்கள்',
    settings: 'அமைப்புகள்',
    overview: 'கண்ணோட்டம்',
    manage: 'மேலாண்மை',

    searchPlaceholder: 'வாடிக்கையாளர், பில், குழுவைத் தேடுங்கள்...',
    notifications: 'நினைவூட்டல்கள் & அறிவிப்புகள்',
    themeToggle: 'தீம் மாற்றவும்',
    signOut: 'வெளியேறு',

    save: 'சேமி',
    cancel: 'ரத்து செய்',
    edit: 'திருத்து',
    delete: 'நீக்கு',
    close: 'மூடு',
    confirm: 'உறுதி செய்',
    view: 'பார்வை',
    add: '+ சேர்',
    exportExcel: 'எக்செல் பதிவிறக்கம்',
    generatePdf: 'PDF உருவாக்கு',
    inviteWhatsApp: 'வாட்ஸ்அப்பில் அழைப்பு அனுப்பு',

    greetingMorning: 'காலை வணக்கம்',
    greetingAfternoon: 'மதிய வணக்கம்',
    greetingEvening: 'மாலை வணக்கம்',
    totalRevenue: 'மொத்த வருவாய்',
    todayRevenue: 'இன்றைய வருவாய்',
    todayAppointments: 'இன்றைய முன்பதிவுகள்',
    todayBills: 'இன்றைய பில்கள்',
    pendingDues: 'நிலுவைத் தொகை',
    bookAgain: 'மீண்டும் பதிவுசெய்',
    newBooking: '+ புதிய முன்பதிவு',
    createBill: '+ பில் உருவாக்கு',
    inChair: 'சேரில் உள்ளார்',
    todaySchedule: 'இன்றைய அட்டவணை',
    recentBills: 'சமீபத்திய பில்கள்',

    clientName: 'வாடிக்கையாளர் பெயர்',
    mobileNumber: 'தொலைபேசி எண்',
    selectServices: 'சேவைகளைத் தேர்ந்தெடுக்கவும்',
    paymentMode: 'பணம் செலுத்தும் முறை',
    saveAndShare: 'பில் சேமித்து வாட்ஸ்அப்பில் அனுப்பு',
    printBill: 'பில் அச்சிடு',
    discount: 'தள்ளுபடி',
    totalAmount: 'மொத்த தொகை',
    paidAmount: 'செலுத்தப்பட்ட தொகை',
    balanceDue: 'மீதி நிலுவை',

    newAppointment: 'புதிய சலூன் முன்பதிவு',
    bookingDate: 'முன்பதிவு தேதி',
    timeSlot: 'நேர இடைவெளி',
    assignStylist: 'ஸ்டைலிஸ்ட் தேர்வு',
    clientNotes: 'வாடிக்கையாளர் விருப்பம் / குறிப்புகள்',
    confirmed: 'உறுதியானது',
    done: 'முடிந்தது',
    cancelled: 'ரத்தானது',
    history: 'வரலாறு',

    addExpense: 'செலவு சேர்',
    totalInflow: 'மொத்த வரவு',
    totalExpenses: 'மொத்த செலவுகள்',
    netProfit: 'நிகர லாபம்',
    today: 'இன்று',
    week: 'வாரம்',
    month: 'மாதம்',
    year: 'ஆண்டு',
    customRange: 'விருப்பக் காலம்',

    reportTab: 'அறிக்கை',
    summaryTab: 'ஆண்டு சுருக்கம்',
    invoicesTab: 'பில் பட்டியல்',
    dayWiseBreakdown: 'நாள் வாரியான விவரம்',
    stylistPerformance: 'ஸ்டைலிஸ்ட் செயல்பாடு',
    servicePerformance: 'சேவை செயல்பாடு',
    paymentSummary: 'பணம் செலுத்திய சுருக்கம்',
    chooseYear: 'ஆண்டைத் தேர்ந்தெடுக்கவும்',
    chooseMonth: 'மாதத்தைத் தேர்ந்தெடுக்கவும்',

    addStylist: '+ ஸ்டைலிஸ்ட் சேர்',
    stylistRoster: 'ஸ்டைலிஸ்ட் செயல்திறன் அறிக்கை',
    active: 'செயலில்',
    invited: 'அழைக்கப்பட்டது',
    inactive: 'செயலற்றது',
    updateRating: 'மதிப்பீடு மாற்று',
    permissions: 'ஸ்டைலிஸ்ட் அனுமதிகள்',

    shopProfile: 'சலூன் விவரம்',
    invoiceSettings: 'பில் அமைப்புகள்',
    subscriptionBilling: 'சந்தா & கட்டணம்',
    settingsHelp: 'அமைப்புகள் & உதவி',
    appLanguage: 'பயன்பாட்டு மொழி',
    changePhone: 'எண் மாற்று',
    privacyPolicy: 'தனியுரிமைக் கொள்கை',
    faq: 'அடிக்கடி கேட்கப்படும் கேள்விகள்',
    deleteAccount: 'கணக்கை நிரந்தரமாக நீக்கு',
  },
  te: {
    dashboard: 'డ్యాష్‌బోర్డ్',
    customers: 'క్లయింట్లు',
    billing: 'ఎక్స్‌ప్రెస్ బిల్లింగ్',
    appointments: 'అపాయింట్‌మెంట్లు',
    accounts: 'ఖర్చుల లెడ్జర్',
    reminders: 'రిమైండర్లు',
    marketing: 'వాట్సాప్ మార్కెటింగ్',
    pricelist: 'సేవలు & ధరలు',
    team: 'స్టైలిస్ట్ టీమ్',
    reports: 'సెలూన్ ఇంటెలిజెన్స్',
    settings: 'సెట్టింగ్‌లు',
    overview: 'అవలోకనం',
    manage: 'నిర్వహణ',

    searchPlaceholder: 'క్లయింట్ లేదా బిల్ వెతకండి...',
    notifications: 'నోటిఫికేషన్లు',
    themeToggle: 'థీమ్ మార్చండి',
    signOut: 'లాగౌట్',

    save: 'సేవ్ చేయండి',
    cancel: 'రద్దు చేయండి',
    edit: 'సవరించండి',
    delete: 'తొలగించండి',
    close: 'మూసివేయండి',
    confirm: 'నిర్ధారించండి',
    view: 'చూడండి',
    add: '+ జోడించండి',
    exportExcel: 'ఎక్సెల్ డౌన్‌లోడ్',
    generatePdf: 'PDF నివేదిక',
    inviteWhatsApp: 'వాట్సాప్ ఆహ్వానం',

    greetingMorning: 'శుభోదయం',
    greetingAfternoon: 'శుభ మధ్యాహ్నం',
    greetingEvening: 'శుభ సాయంత్రం',
    totalRevenue: 'మొత్తం ఆదాయం',
    todayRevenue: 'నేటి ఆదాయం',
    todayAppointments: 'నేటి అపాయింట్‌మెంట్లు',
    todayBills: 'నేటి బిల్లులు',
    pendingDues: 'బాకీ మొత్తం',
    bookAgain: 'మళ్ళీ బుక్ చేయండి',
    newBooking: '+ కొత్త బుకింగ్',
    createBill: '+ బిల్ చేయండి',
    inChair: 'కుర్చీలో ఉన్నారు',
    todaySchedule: 'నేటి షెడ్యూల్',
    recentBills: 'ఇటీవలి బిల్లులు',

    clientName: 'క్లయింట్ పేరు',
    mobileNumber: 'మొబైల్ నంబర్',
    selectServices: 'సేవలను ఎంచుకోండి',
    paymentMode: 'చెల్లింపు విధానం',
    saveAndShare: 'సేవ్ & వాట్సాప్ షేర్',
    printBill: 'ప్రింట్ బిల్',
    discount: 'డిస్కౌంట్',
    totalAmount: 'మొత్తం',
    paidAmount: 'చెల్లించిన మొత్తం',
    balanceDue: 'బాకీ ఉన్నది',

    newAppointment: '+ కొత్త అపాయింట్‌మెంట్',
    bookingDate: 'తేదీ',
    timeSlot: 'సమయం',
    assignStylist: 'స్టైలిస్ట్‌ను కేటాయించండి',
    clientNotes: 'గమనికలు',
    confirmed: 'నిర్ధారించబడింది',
    done: 'పూర్తయింది',
    cancelled: 'రద్దు చేయబడింది',
    history: 'చరిత్ర',

    addExpense: 'ఖర్చు జోడించండి',
    totalInflow: 'మొత్తం రాబడి',
    totalExpenses: 'మొత్తం ఖర్చులు',
    netProfit: 'నికర లాభం',
    today: 'ఈ రోజు',
    week: 'ఈ వారం',
    month: 'ఈ నెల',
    year: 'ఈ సంవత్సరం',
    customRange: 'కస్టమ్ తేదీలు',

    reportTab: 'నివేదిక',
    summaryTab: 'వార్షిక సారాంశం',
    invoicesTab: 'బిల్లుల జాబితా',
    dayWiseBreakdown: 'రోజువారీ వివరాలు',
    stylistPerformance: 'స్టైలిస్ట్ పనితీరు',
    servicePerformance: 'సేవ పనితీరు',
    paymentSummary: 'చెల్లింపుల సారాంశం',
    chooseYear: 'సంవత్సరాన్ని ఎంచుకోండి',
    chooseMonth: 'నెలను ఎంచుకోండి',

    addStylist: '+ స్టైలిస్ట్‌ను జోడించండి',
    stylistRoster: 'స్టైలిస్ట్ జాబితా',
    active: 'క్రియాశీలం',
    invited: 'ఆహ్వానించబడ్డారు',
    inactive: 'నిష్క్రియం',
    updateRating: 'రేటింగ్ మార్చండి',
    permissions: 'అనుమతులు',

    shopProfile: 'షాప్ ప్రొఫైల్',
    invoiceSettings: 'ఇన్వాయిస్ సెట్టింగ్‌లు',
    subscriptionBilling: 'సభ్యత్వం & బిల్లింగ్',
    settingsHelp: 'సెట్టింగ్‌లు & సహాయం',
    appLanguage: 'యాప్ భాష',
    changePhone: 'ఫోన్ నంబర్ మార్చండి',
    privacyPolicy: 'గోప్యతా విధానం',
    faq: 'తరచుగా అడిగే ప్రశ్నలు',
    deleteAccount: 'ఖాతాను తొలగించండి',
  },
  kn: {
    dashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    customers: 'ಗ್ರಾಹಕರು',
    billing: 'ಎಕ್ಸ್‌ಪ್ರೆಸ್ ಬಿಲ್ಲಿಂಗ್',
    appointments: 'ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗಳು',
    accounts: 'ವೆಚ್ಚದ ಲೆಡ್ಜರ್',
    reminders: 'ಜ್ಞಾಪನೆಗಳು',
    marketing: 'ವಾಟ್ಸಾಪ್ ಮಾರ್ಕೆಟಿಂಗ್',
    pricelist: 'ಸೇವೆಗಳು ಮತ್ತು ದರಪಟ್ಟಿ',
    team: 'ಸ್ಟೈಲಿಸ್ಟ್ ತಂಡ',
    reports: 'ಸಲೂನ್ ಇಂಟೆಲಿಜೆನ್ಸ್',
    settings: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    overview: 'ಅವಲೋಕನ',
    manage: 'ನಿರ್ವಹಿಸಿ',

    searchPlaceholder: 'ಗ್ರಾಹಕ ಅಥವಾ ಬಿಲ್ ಹುಡುಕಿ...',
    notifications: 'ಅಧಿಸೂಚನೆಗಳು',
    themeToggle: 'ಥೀಮ್ ಬದಲಾಯಿಸಿ',
    signOut: 'ಲಾಗ್‌ಔಟ್',

    save: 'ಉಳಿಸಿ',
    cancel: 'ರದ್ದುಮಾಡಿ',
    edit: 'ತಿದ್ದಿ',
    delete: 'ಅಳಿಸಿ',
    close: 'ಮುಚ್ಚಿ',
    confirm: 'ಖಚಿತಪಡಿಸಿ',
    view: 'ವೀಕ್ಷಿಸಿ',
    add: '+ ಸೇರಿಸಿ',
    exportExcel: 'ಎಕ್ಸೆಲ್ ಡೌನ್‌ಲೋಡ್',
    generatePdf: 'PDF ವರದಿ',
    inviteWhatsApp: 'ವಾಟ್ಸಾಪ್ ಆಹ್ವಾನ',

    greetingMorning: 'ಶುಭೋದಯ',
    greetingAfternoon: 'ಶುಭ ಮಧ್ಯಾಹ್ನ',
    greetingEvening: 'ಶುಭ ಸಂಜೆ',
    totalRevenue: 'ಒಟ್ಟು ಆದಾಯ',
    todayRevenue: 'ಇಂದಿನ ಆದಾಯ',
    todayAppointments: 'ಇಂದಿನ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್‌ಗಳು',
    todayBills: 'ಇಂದಿನ ಬಿಲ್‌ಗಳು',
    pendingDues: 'ಬಾಕಿ ಮೊತ್ತ',
    bookAgain: 'ಮತ್ತೆ ಬುಕ್ ಮಾಡಿ',
    newBooking: '+ ಹೊಸ ಬುಕಿಂಗ್',
    createBill: '+ ಬಿಲ್ ಮಾಡಿ',
    inChair: 'ಕುರ್ಚಿಯಲ್ಲಿದ್ದಾರೆ',
    todaySchedule: 'ಇಂದಿನ ವೇಳಾಪಟ್ಟಿ',
    recentBills: 'ಇತ್ತೀಚಿನ ಬಿಲ್‌ಗಳು',

    clientName: 'ಗ್ರಾಹಕರ ಹೆಸರು',
    mobileNumber: 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ',
    selectServices: 'ಸೇವೆಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    paymentMode: 'ಪಾವತಿ ವಿಧಾನ',
    saveAndShare: 'ಉಳಿಸಿ & ವಾಟ್ಸಾಪ್ ಹಂಚಿಕೊಳ್ಳಿ',
    printBill: 'ಬಿಲ್ ಮುದ್ರಿಸಿ',
    discount: 'ರಿಯಾಯಿತಿ',
    totalAmount: 'ಒಟ್ಟು ಮೊತ್ತ',
    paidAmount: 'ಪಾವತಿಸಿದ ಮೊತ್ತ',
    balanceDue: 'ಉಳಿದ ಬಾಕಿ',

    newAppointment: '+ ಹೊಸ ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್',
    bookingDate: 'ದಿನಾಂಕ',
    timeSlot: 'ಸಮಯ',
    assignStylist: 'ಸ್ಟೈಲಿಸ್ಟ್ ನಿಯೋಜಿಸಿ',
    clientNotes: 'ಟಿಪ್ಪಣಿಗಳು',
    confirmed: 'ಖಚಿತಪಡಿಸಲಾಗಿದೆ',
    done: 'ಮುಗಿದಿದೆ',
    cancelled: 'ರದ್ದುಗೊಂಡಿದೆ',
    history: 'ಇತಿಹಾಸ',

    addExpense: 'ವೆಚ್ಚ ಸೇರಿಸಿ',
    totalInflow: 'ಒಟ್ಟು ಒಳಹರಿವು',
    totalExpenses: 'ಒಟ್ಟು ವೆಚ್ಚಗಳು',
    netProfit: 'ನಿವ್ವಳ ಲಾಭ',
    today: 'ಇಂದು',
    week: 'ಈ ವಾರ',
    month: 'ಈ ತಿಂಗಳು',
    year: 'ಈ ವರ್ಷ',
    customRange: 'ಕಸ್ಟಮ್ ಅವಧಿ',

    reportTab: 'ವರದಿ',
    summaryTab: 'ವಾರ್ಷಿಕ ಸಾರಾಂಶ',
    invoicesTab: 'ಬಿಲ್ ಪಟ್ಟಿ',
    dayWiseBreakdown: 'ದೈನಂದಿನ ವಿವರ',
    stylistPerformance: 'ಸ್ಟೈಲಿಸ್ಟ್ ಕಾರ್ಯಕ್ಷಮತೆ',
    servicePerformance: 'ಸೇವಾ ಕಾರ್ಯಕ್ಷಮತೆ',
    paymentSummary: 'ಪಾವತಿ ಸಾರಾಂಶ',
    chooseYear: 'ವರ್ಷ ಆಯ್ಕೆಮಾಡಿ',
    chooseMonth: 'ತಿಂಗಳು ಆಯ್ಕೆಮಾಡಿ',

    addStylist: '+ ಸ್ಟೈಲಿಸ್ಟ್ ಸೇರಿಸಿ',
    stylistRoster: 'ಸ್ಟೈಲಿಸ್ಟ್ ರೋಸ್ಟರ್',
    active: 'ಸಕ್ರಿಯ',
    invited: 'ಆಹ್ವಾನಿಸಲಾಗಿದೆ',
    inactive: 'ನಿಷ್ಕ್ರಿಯ',
    updateRating: 'ರೇಟಿಂಗ್ ಬದಲಾಯಿಸಿ',
    permissions: 'ಅನುಮತಿಗಳು',

    shopProfile: 'ಶಾಪ್ ಪ್ರೊಫೈಲ್',
    invoiceSettings: 'ಇನ್‌ವಾಯ್ಸ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    subscriptionBilling: 'ಚಂದಾದಾರಿಕೆ & ಬಿಲ್ಲಿಂಗ್',
    settingsHelp: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು & ಸಹಾಯ',
    appLanguage: 'ಆ್ಯಪ್ ಭಾಷೆ',
    changePhone: 'ಫೋನ್ ಸಂಖ್ಯೆ ಬದಲಾಯಿಸಿ',
    privacyPolicy: 'ಗೌಪ್ಯತಾ ನೀತಿ',
    faq: 'ಪದೇ ಪದೇ ಕೇಳಲಾಗುವ ಪ್ರಶ್ನೆಗಳು',
    deleteAccount: 'ಖಾತೆ ಅಳಿಸಿ',
  },
  ml: {
    dashboard: 'ഡാഷ്‌ബോർഡ്',
    customers: 'ഉപഭോക്താക്കൾ',
    billing: 'എക്‌സ്‌പ്രസ് ബില്ലിംഗ്',
    appointments: 'അപ്പോയിന്റ്‌മെന്റുകൾ',
    accounts: 'ചെലവ് കണക്കുകൾ',
    reminders: 'ഓർമ്മപ്പെടുത്തലുകൾ',
    marketing: 'വാട്ട്‌സ്ആപ്പ് മാർക്കറ്റിംഗ്',
    pricelist: 'സേവനങ്ങളും നിരക്കുകളും',
    team: 'സ്റ്റൈലിസ്റ്റ് ടീം',
    reports: 'സലൂൺ ഇന്റലിജൻസ്',
    settings: 'ക്രമീകരണങ്ങൾ',
    overview: 'അവലോകനം',
    manage: 'മാനേജ് ചെയ്യുക',

    searchPlaceholder: 'ഉപഭോക്താവിനെയോ ബില്ലോ തിരയുക...',
    notifications: 'അറിയിപ്പുകൾ',
    themeToggle: 'തീം മാറ്റുക',
    signOut: 'സൈൻ ഔട്ട്',

    save: 'സേവ് ചെയ്യുക',
    cancel: 'റദ്ദാക്കുക',
    edit: 'എഡിറ്റ് ചെയ്യുക',
    delete: 'ഡിലീറ്റ് ചെയ്യുക',
    close: 'അടയ്ക്കുക',
    confirm: 'സ്ഥിരീകരിക്കുക',
    view: 'കാണുക',
    add: '+ ചേർക്കുക',
    exportExcel: 'എക്സൽ ഡൗൺലോഡ്',
    generatePdf: 'PDF റിപ്പോർട്ട്',
    inviteWhatsApp: 'വാട്ട്‌സ്ആപ്പ് ക്ഷണം',

    greetingMorning: 'സുപ്രഭാതം',
    greetingAfternoon: 'ശുഭ ഉച്ചനേരം',
    greetingEvening: 'ശുഭ സായാഹ്നം',
    totalRevenue: 'ആകെ വരുമാനം',
    todayRevenue: 'ഇന്നത്തെ വരുമാനം',
    todayAppointments: 'ഇന്നത്തെ അപ്പോയിന്റ്‌മെന്റുകൾ',
    todayBills: 'ഇന്നത്തെ ബില്ലുകൾ',
    pendingDues: 'ബാക്കി കുടിശ്ശിക',
    bookAgain: 'വീണ്ടും ബുക്ക് ചെയ്യുക',
    newBooking: '+ പുതിയ ബുക്കിംഗ്',
    createBill: '+ ബിൽ തയ്യാറാക്കുക',
    inChair: 'ചെയറിൽ ഉണ്ട്',
    todaySchedule: 'ഇന്നത്തെ ഷെഡ്യൂൾ',
    recentBills: 'സമീപകാല ബില്ലുകൾ',

    clientName: 'ഉപഭോക്താവിന്റെ പേര്',
    mobileNumber: 'മൊബൈൽ നമ്പർ',
    selectServices: 'സേവനങ്ങൾ തിരഞ്ഞെടുക്കുക',
    paymentMode: 'പേയ്‌മെന്റ് രീതി',
    saveAndShare: 'സേവ് & വാട്ട്‌സ്ആപ്പ് ഷെയർ',
    printBill: 'ബിൽ പ്രിന്റ് ചെയ്യുക',
    discount: 'ഡിസ്കൗണ്ട്',
    totalAmount: 'ആകെ തുക',
    paidAmount: 'നൽകിയ തുക',
    balanceDue: 'ബാക്കി തുക',

    newAppointment: '+ പുതിയ അപ്പോയിന്റ്‌മെന്റ്',
    bookingDate: 'തീയതി',
    timeSlot: 'സമയം',
    assignStylist: 'സ്റ്റൈലിസ്റ്റിനെ ചുമതലപ്പെടുത്തുക',
    clientNotes: 'കുറിപ്പുകൾ',
    confirmed: 'സ്ഥിരീകരിച്ചു',
    done: 'പൂർത്തിയായി',
    cancelled: 'റദ്ദാക്കി',
    history: 'ചരിത്രം',

    addExpense: 'ചെലവ് ചേർക്കുക',
    totalInflow: 'ആകെ വരവ്',
    totalExpenses: 'ആകെ ചെലവുകൾ',
    netProfit: 'അറ്റാദായം',
    today: 'ഇന്ന്',
    week: 'ഈ ആഴ്ച',
    month: 'ഈ മാസം',
    year: 'ഈ വർഷം',
    customRange: 'പ്രത്യേക തീയതികൾ',

    reportTab: 'റിപ്പോർട്ട്',
    summaryTab: 'വാർഷിക സംഗ്രഹം',
    invoicesTab: 'ബിൽ പട്ടിക',
    dayWiseBreakdown: 'ദിവസേനയുള്ള കണക്കുകൾ',
    stylistPerformance: 'സ്റ്റൈലിസ്റ്റ് പ്രകടനം',
    servicePerformance: 'സേവന പ്രകടനം',
    paymentSummary: 'പേയ്‌മെന്റ് സംഗ്രഹം',
    chooseYear: 'വർഷം തിരഞ്ഞെടുക്കുക',
    chooseMonth: 'മാസം തിരഞ്ഞെടുക്കുക',

    addStylist: '+ സ്റ്റൈലിസ്റ്റിനെ ചേർക്കുക',
    stylistRoster: 'സ്റ്റൈലിസ്റ്റ് പട്ടിക',
    active: 'സജീവം',
    invited: 'ക്ഷണിച്ചു',
    inactive: 'നിഷ്‌ക്രിയം',
    updateRating: 'റേറ്റിംഗ് മാറ്റുക',
    permissions: 'അനുമതികൾ',

    shopProfile: 'ഷോപ്പ് പ്രൊഫൈൽ',
    invoiceSettings: 'ഇൻവോയ്സ് ക്രമീകരണങ്ങൾ',
    subscriptionBilling: 'സബ്‌സ്‌ക്രിപ്ഷൻ & ബില്ലിംഗ്',
    settingsHelp: 'സഹായവും ക്രമീകരണങ്ങളും',
    appLanguage: 'ആപ്പ് ഭാഷ',
    changePhone: 'ഫോൺ നമ്പർ മാറ്റുക',
    privacyPolicy: 'സ്വകാര്യതാ നയം',
    faq: 'പതിവുചോദ്യങ്ങൾ',
    deleteAccount: 'അക്കൗണ്ട് ഇല്ലാതാക്കുക',
  },
};

export function useTranslationHelper(language: Language) {
  return translations[language] || translations.en;
}
