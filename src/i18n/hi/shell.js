import { registerMessages } from '../locale.js'

/**
 * Hindi — shell, navigation and every page title.
 *
 * This is the tier an officer reads first and reads constantly: the nav
 * sections, the name of every screen, the roles, and the controls around them.
 * It is translated in full.
 *
 * The dense statutory and statistical prose inside each screen is NOT here.
 * That text carries terms whose Hindi rendering has legal consequence —
 * "wilful misstatement", "suppression", "time-barred", "ultra vires" — and it
 * should be settled with the department rather than chosen by a translator
 * working alone. Until it is, those strings fall back to English, which is
 * visibly untranslated rather than confidently wrong.
 */
registerMessages('hi', {
  /* == Product and shell ================================================== */
  'Maha GST Intelligence': 'महा GST इंटेलिजेंस',
  'MAHA GST INTELLIGENCE': 'महा GST इंटेलिजेंस',
  'Revenue Assurance, Fraud Risk & Compliance Intelligence Infrastructure for Maharashtra GST':
    'महाराष्ट्र GST के लिए राजस्व आश्वासन, कपट जोखिम एवं अनुपालन आसूचना अवसंरचना',
  'Revenue Assurance & Compliance Intelligence Infrastructure': 'राजस्व आश्वासन एवं अनुपालन आसूचना अवसंरचना',
  'Officer Sign-In': 'अधिकारी साइन-इन',
  'Enter Secure Workspace': 'सुरक्षित कार्यक्षेत्र में प्रवेश',
  'Select your role, then enter the access code.': 'अपनी भूमिका चुनें, फिर एक्सेस कोड दर्ज करें।',
  'Select Role to Continue': 'जारी रखने के लिए भूमिका चुनें',
  'Officer Name (optional)': 'अधिकारी का नाम (वैकल्पिक)',
  'Demonstration access code': 'प्रदर्शन एक्सेस कोड',
  'Enter the access code': 'एक्सेस कोड दर्ज करें',
  'Access code not recognised.': 'एक्सेस कोड मान्य नहीं है।',
  'Show access code': 'एक्सेस कोड दिखाएँ',
  'Hide access code': 'एक्सेस कोड छिपाएँ',
  'Sections this role opens': 'यह भूमिका जो अनुभाग खोलती है',
  'All sections': 'सभी अनुभाग',
  'Sign out': 'साइन आउट',
  'Switch role': 'भूमिका बदलें',
  'Search GSTIN or trade name': 'GSTIN या व्यापार नाम खोजें',
  'Search this view...': 'इस दृश्य में खोजें...',
  'Export PDF': 'PDF निर्यात',
  'Export Excel': 'Excel निर्यात',
  'Copy Briefing Note': 'ब्रीफिंग नोट कॉपी करें',
  'POSITION AS AT': 'स्थिति दिनांक',
  'Demonstration Environment · Simulated data': 'प्रदर्शन वातावरण · अनुरूपित डेटा',
  'Demonstration environment · All figures are simulated': 'प्रदर्शन वातावरण · सभी आँकड़े अनुरूपित हैं',
  'and': 'और',
  'as at': 'दिनांक',
  'days': 'दिन',
  'cases': 'प्रकरण',
  'rules': 'नियम',

  /* == Navigation sections ================================================ */
  'Command Centre': 'नियंत्रण कक्ष',
  'Revenue at Risk': 'जोखिम में राजस्व',
  'Case Priority': 'प्रकरण प्राथमिकता',
  'Risk Discovery': 'जोखिम खोज',
  'Missed Revenue': 'छूटा हुआ राजस्व',
  'Legal Standing': 'विधिक स्थिति',
  Benchmarking: 'तुलनात्मक मूल्यांकन',
  'Data Resources': 'डेटा संसाधन',
  Governance: 'अभिशासन',

  /* == Every screen ======================================================= */
  'Executive Command Center': 'कार्यकारी नियंत्रण केंद्र',
  'Revenue Protection Command Centre': 'राजस्व संरक्षण नियंत्रण कक्ष',
  'Revenue Intelligence': 'राजस्व आसूचना',
  'Statutory Time Intelligence': 'सांविधिक समय आसूचना',
  'Revenue at Risk & Recovery': 'जोखिम में राजस्व एवं वसूली',
  'Case Priority Engine': 'प्रकरण प्राथमिकता इंजन',
  'Officer Capacity & Deployment': 'अधिकारी क्षमता एवं तैनाती',
  'Audit & Scrutiny Engine': 'लेखापरीक्षा एवं संवीक्षा इंजन',
  'Officer AI Copilot': 'अधिकारी AI सहायक',
  'Officer Copilot': 'अधिकारी सहायक',
  'Unknown Risk Discovery': 'अज्ञात जोखिम खोज',
  'Network Intelligence': 'नेटवर्क आसूचना',
  'ITC Risk Intelligence': 'ITC जोखिम आसूचना',
  'E-Way Bill Intelligence': 'ई-वे बिल आसूचना',
  'Compliance Early Warning': 'अनुपालन पूर्व चेतावनी',
  'Refund Risk Intelligence': 'रिफंड जोखिम आसूचना',
  'Case Digital Twin': 'प्रकरण डिजिटल ट्विन',
  'Missed Revenue Discovery': 'छूटे राजस्व की खोज',
  'Counterfactual Case Intelligence': 'प्रति-तथ्यात्मक प्रकरण आसूचना',
  'Precedent Intelligence': 'पूर्वनिर्णय आसूचना',
  'Litigation Intelligence': 'वाद आसूचना',
  'District & Division Performance': 'जिला एवं विभाग निष्पादन',
  'Sector Intelligence': 'क्षेत्र आसूचना',
  'Project Resources': 'परियोजना संसाधन',
  'Engine Stack & Data Readiness': 'इंजन स्टैक एवं डेटा तत्परता',
  'Pilot Extract Specification': 'पायलट एक्सट्रैक्ट विनिर्देश',
  'Official Statistics': 'आधिकारिक सांख्यिकी',
  'AI Governance & Security': 'AI अभिशासन एवं सुरक्षा',
  'Reports & Briefing Notes': 'रिपोर्ट एवं ब्रीफिंग नोट',

  /* == Roles ============================================================== */
  Commissioner: 'आयुक्त',
  'Joint Commissioner': 'संयुक्त आयुक्त',
  'Division Officer': 'विभागीय अधिकारी',
  'Audit Officer': 'लेखापरीक्षा अधिकारी',
  'Refund Officer': 'रिफंड अधिकारी',
  'Investigation Officer': 'अन्वेषण अधिकारी',
  'AI Governance Officer': 'AI अभिशासन अधिकारी',
  'Read-only Policy Viewer': 'केवल-पठन नीति दर्शक',
  'Guest Officer': 'अतिथि अधिकारी',
  'Restricted for your role': 'आपकी भूमिका के लिए प्रतिबंधित',

  /* == Filters ============================================================ */
  'All Districts': 'सभी जिले',
  'All Divisions': 'सभी विभाग',
  'All Sectors': 'सभी क्षेत्र',
  'All Types': 'सभी प्रकार',
  'All Risk Levels': 'सभी जोखिम स्तर',
  Low: 'निम्न',
  Medium: 'मध्यम',
  High: 'उच्च',
  Critical: 'अति गंभीर',
  'Last 3 Months': 'पिछले 3 माह',
  'Last 6 Months': 'पिछले 6 माह',
  'Last 12 Months': 'पिछले 12 माह',
  'Showing {0} of {1} {2}': '{1} में से {0} {2} दिखाए जा रहे हैं',
  'filtered to': 'फ़िल्टर',
  '{0} hidden by the filter': 'फ़िल्टर द्वारा {0} छिपाए गए',
  'The filter bar does not apply to this page.': 'फ़िल्टर बार इस पृष्ठ पर लागू नहीं होता।',

  /* == Recurring labels =================================================== */
  'Time-barred': 'कालातीत',
  '{0}d left': '{0} दिन शेष',
  '{0} days remain': '{0} दिन शेष',
  'Statutory period expired': 'सांविधिक अवधि समाप्त',
  'Statutory deadline approaching': 'सांविधिक समय-सीमा निकट',
  Decision: 'निर्णय',
  Evidence: 'साक्ष्य',
  Source: 'स्रोत',
  Method: 'पद्धति',
  Yes: 'हाँ',
  No: 'नहीं',
  Connected: 'संबद्ध',
  'Not integrated': 'एकीकृत नहीं',
  Binding: 'बाध्यकारी',
  'Not binding': 'बाध्यकारी नहीं',
  'Persuasive only': 'केवल अनुनयकारी',
  Taxpayer: 'करदाता',
  Division: 'विभाग',
  District: 'जिला',
  Sector: 'क्षेत्र',
  Exposure: 'जोखिम राशि',
  Risk: 'जोखिम',
  Stage: 'चरण'
})
