import { registerMessages } from '../../locale.js'

/**
 * Marathi — the last of the indirect prose: tab labels, the comparability
 * weight classes, chart axis labels, toast messages, accessibility labels and
 * the officer note in the taxpayer drilldown.
 *
 * These reach the screen through t() as a variable rather than written at the
 * render site, which is why they surfaced only once scripts/prose.mjs existed.
 *
 * "Marathi Summary" is the control on the reports screen that attaches a
 * Marathi rendering to a briefing note. It stays named for the language it
 * produces, in every locale.
 *
 *   determinative → निर्णायक
 *   contextual    → संदर्भात्मक
 *   descriptive   → वर्णनात्मक
 */
registerMessages('mr', {
  /* == Tab and section labels ========================================== */
  'This week’s allocation': 'या आठवड्याचे वाटप',
  'What cannot be worked': 'जे हाताळता येत नाही',
  'Where the constraint binds': 'मर्यादा कुठे बांधते',
  'Required by statute': 'कायद्याने आवश्यक',
  'Model recommendation': 'प्रारूपाची शिफारस',
  'From the case record': 'प्रकरणाच्या अभिलेखातून',
  'Engine feasibility': 'यंत्रणेची व्यवहार्यता',
  'Intelligence graph': 'इंटेलिजन्स आलेख',
  'What the pilot extract must carry': 'पायलट एक्सट्रॅक्टमध्ये काय असले पाहिजे',
  'Priority 1': 'प्राधान्य १',
  'Priority 2': 'प्राधान्य २',
  'Priority 3': 'प्राधान्य ३',
  'Priority 4': 'प्राधान्य ४',
  Required: 'आवश्यक',
  'Current Officer': 'सध्याचा अधिकारी',
  'Div. Officer — S. Patil': 'विभाग अधिकारी — स. पाटील',
  'Preliminary desk review completed. Awaiting GSTR-2B reconciliation.':
    'प्राथमिक कार्यालयीन पुनर्विलोकन पूर्ण. GSTR-2B ताळमेळाची प्रतीक्षा.',

  /* == Comparability weight classes ==================================== */
  Determinative: 'निर्णायक',
  'Decides outcomes.': 'निष्कर्ष ठरवते.',
  Contextual: 'संदर्भात्मक',
  'Shapes how a case is argued.': 'प्रकरण कसे लढवले जाते ते घडवते.',
  Descriptive: 'वर्णनात्मक',
  'Decides nothing.': 'काहीही ठरवत नाही.',

  /* == Chart labels ==================================================== */
  'Exposure sitting here (₹ Cr)': 'येथे असलेली जोखीम रक्कम (₹ कोटी)',
  'Recoverable (%)': 'वसूलपात्र (%)',
  Today: 'आज',

  /* == Toasts and export messages ====================================== */
  Done: 'झाले',
  Copied: 'प्रत घेतली',
  'Not available in demo': 'प्रात्यक्षिकात उपलब्ध नाही',
  'Export (PDF) requested — not implemented in demonstration build':
    'निर्यात (PDF) मागवले — प्रात्यक्षिक आवृत्तीत अंमलात नाही',
  'Export (Excel) requested — not implemented in demonstration build':
    'निर्यात (Excel) मागवले — प्रात्यक्षिक आवृत्तीत अंमलात नाही',
  'Copied Briefing Note to Clipboard': 'माहिती टिपणाची प्रत क्लिपबोर्डवर घेतली',
  'Viewed Network Cluster': 'नेटवर्क गट पाहिला',
  'Switched role': 'पद बदलले',
  'Signed out': 'बाहेर पडलात',
  Unauthenticated: 'अप्रमाणित',

  /* == Accessibility labels ============================================ */
  'Open navigation': 'नेव्हिगेशन उघडा',
  'Close navigation': 'नेव्हिगेशन बंद करा',
  'Primary navigation': 'प्राथमिक नेव्हिगेशन',
  'cases assigned to me': 'मला नेमून दिलेली प्रकरणे',

  /* == The last of the indirect prose =================================== */
  Case: 'प्रकरण',
  'Departmental record': 'विभागाचा अभिलेख',
  'Questions of law': 'विधी प्रश्न',
  'How authority is weighted': 'प्राधिकाराचे भारमान कसे ठरते',
  'Law & judicial authority': 'कायदा व न्यायिक प्राधिकार',
  'Favours the department': 'विभागाला अनुकूल',
  'Favours the assessee': 'करनिर्धारितीला अनुकूल',
  Undecided: 'अनिर्णीत',
  'Detected chains': 'शोधलेल्या साखळ्या',
  'Where to act': 'कारवाई कुठे करावी',
  'Whether we can act': 'आपण कारवाई करू शकतो का',
  'Method and limits': 'पद्धत व मर्यादा',
  'Why no Section 74 classification': 'कलम ७४ खाली वर्गीकरण का नाही',
  'What is real, what is simulated': 'काय खरे आहे, काय अनुरूपित आहे',
  'Marathi Summary': 'मराठी सारांश',
  'Hide Marathi Summary': 'मराठी सारांश लपवा',
  'No districts in scope.': 'व्याप्तीत कोणताही जिल्हा नाही.',
  'No districts match the current filters.': 'सध्याच्या गाळण्यांशी कोणताही जिल्हा जुळत नाही.',
  'No taxpayers in scope.': 'व्याप्तीत कोणताही करदाता नाही.',
  'No decided matters in scope.': 'व्याप्तीत कोणताही निर्णीत विषय नाही.',
  'No alerts in scope.': 'व्याप्तीत कोणतीही सूचना नाही.',
  'No preview data available for this report type.':
    'या अहवाल प्रकारासाठी कोणतीही पूर्वावलोकन माहिती उपलब्ध नाही.',
  '₹22.08 lakh Cr': '₹२२.०८ लाख कोटी',
  '₹17.4 lakh Cr': '₹१७.४ लाख कोटी',
  'This access code is compiled into the page and can be read by anyone who opens developer tools. It keeps the demonstration from being wandered into; it is not authentication and must never be treated as such.':
    'हा प्रवेश संकेतांक पानातच संकलित केलेला आहे आणि डेव्हलपर टूल्स उघडणाऱ्या कोणालाही तो वाचता येतो. प्रात्यक्षिकात कोणी सहजच भरकटू नये एवढेच तो करतो; ते प्रमाणीकरण नाही आणि तसे कधीही मानले जाऊ नये.',
  'Div. Officer — S. Patil': 'विभाग अधिकारी — स. पाटील'
})
