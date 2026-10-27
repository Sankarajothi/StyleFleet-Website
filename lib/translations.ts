export type Language = 'en' | 'hi' | 'ta';

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
};

export function useTranslationHelper(language: Language) {
  return translations[language] || translations.en;
}
