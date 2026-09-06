import { registerMessages } from '../locale.js'

/**
 * Hindi — the chrome and the shared panels: masthead, header, context bar,
 * landing page, role gate, and the components every screen renders.
 *
 *   limitation        → परिसीमा
 *   time-barred       → कालातीत
 *   exposure          → जोखिम राशि
 *   binding           → बाध्यकारी
 *   persuasive        → मार्गदर्शक
 *   cluster           → समूह
 *   irreversible      → अपरिवर्तनीय
 *   simulated         → अनुरूपित
 *   provenance        → उद्गम
 *
 * Form and statute identifiers stay in Latin. So do GSTIN, ITC and AI, which
 * an officer reads as codes rather than as words.
 */
registerMessages('hi', {
  /* == Masthead, header, context bar ====================================== */
  'Position as at': 'स्थिति इस तिथि तक',
  Session: 'सत्र',
  'Search GSTIN, trade name, legal name...': 'GSTIN, व्यापारिक नाम, विधिक नाम खोजें...',
  Copilot: 'सहप्रचालक',
  Notifications: 'सूचनाएँ',
  'Role-based access': 'पद-आधारित पहुँच',
  '{0} of {1} modules': '{1} मॉड्यूल में से {0}',
  'Restricted: {0}': 'प्रतिबंधित: {0}',
  Context: 'संदर्भ',
  'Acting as {0}': '{0} के रूप में कार्यरत',
  Filters: 'फ़िल्टर',
  'Text size': 'अक्षर आकार',
  'Text size: {0}': 'अक्षर आकार: {0}',
  'Colour theme': 'रंग योजना',
  'Colour theme: {0}': 'रंग योजना: {0}',

  /* == Landing page ======================================================= */
  'Revenue Assurance, Fraud Risk': 'राजस्व आश्वासन, कपट जोखिम',
  ' & Compliance Intelligence Infrastructure for Maharashtra GST':
    ' एवं अनुपालन इंटेलिजेंस अवसंरचना — महाराष्ट्र GST हेतु',
  'A unified intelligence platform for the Commissioner, senior officers, audit teams and refund teams — turning filings, payments, ITC claims, e-way bills and litigation into explainable, action-ready risk signals. Built for revenue protection and taxpayer fairness alike.':
    'आयुक्त, वरिष्ठ अधिकारियों, लेखापरीक्षा दलों एवं प्रतिदाय दलों के लिए एक एकीकृत इंटेलिजेंस मंच — जो विवरणियों, भुगतानों, ITC दावों, ई-वे बिलों और मुकदमों को स्पष्टीकरण-योग्य, कार्रवाई-योग्य जोखिम संकेतों में बदलता है। राजस्व संरक्षण और करदाता के प्रति निष्पक्षता, दोनों के लिए बनाया गया।',
  'View Platform Capabilities': 'मंच की क्षमताएँ देखें',
  'What This Platform Does': 'यह मंच क्या करता है',
  'Intelligence infrastructure, not another dashboard': 'इंटेलिजेंस अवसंरचना, एक और डैशबोर्ड नहीं',
  'Every module is built around one principle: officers get explainable signals, never black-box decisions.':
    'प्रत्येक मॉड्यूल एक ही सिद्धांत पर बना है: अधिकारियों को स्पष्टीकरण-योग्य संकेत मिलें, कभी भी अपारदर्शी निर्णय नहीं।',
  'Behind The Sign-In': 'साइन-इन के पीछे',
  'The intelligence pages behind this platform': 'इस मंच के पीछे के इंटेलिजेंस पृष्ठ',
  'This page is the storefront. After sign-in, these same figures are laid out in the pages officers actually decide from — one for every area the department runs.':
    'यह पृष्ठ दुकान का मुख है। साइन-इन के बाद यही आँकड़े उन पृष्ठों में रखे मिलते हैं जिनसे अधिकारी वास्तव में निर्णय लेते हैं — विभाग जिस-जिस क्षेत्र में कार्य करता है, प्रत्येक के लिए एक।',
  'Coverage In This Demonstration': 'इस प्रदर्शन की व्याप्ति',
  '{0} districts modelled, one consolidated view': '{0} जिलों का प्रारूप, एक समेकित दृश्य',
  'This demonstration models {0} of Maharashtra’s 36 districts. The consolidated view is designed to take all 36 without change — what is shown here is a representative subset, not statewide coverage.':
    'यह प्रदर्शन महाराष्ट्र के 36 में से {0} जिलों का प्रारूप प्रस्तुत करता है। समेकित दृश्य बिना किसी परिवर्तन के तीनों छत्तीस जिले समाहित करने के लिए बनाया गया है — यहाँ जो दिखाया गया है वह एक प्रतिनिधि उपसमुच्चय है, राज्यव्यापी व्याप्ति नहीं।',
  Assurance: 'आश्वासन',
  'Built to be accountable': 'उत्तरदायी होने के लिए बनाया गया',
  'A decision an officer cannot account for is worse than no decision at all. These four properties hold on every page behind this one, and each can be checked from inside the platform.':
    'जिस निर्णय का हिसाब अधिकारी न दे सके, वह कोई निर्णय न होने से भी बुरा है। ये चारों गुण इस पृष्ठ के पीछे के प्रत्येक पृष्ठ पर लागू हैं, और प्रत्येक की जाँच मंच के भीतर से ही की जा सकती है।',
  'Ready to enter the secure workspace?': 'सुरक्षित कार्यक्षेत्र में प्रवेश के लिए तैयार हैं?',
  'Sign in with your officer role to access risk intelligence, case workflows and the AI copilot — all subject to role-based access control and mandatory human approval.':
    'जोखिम इंटेलिजेंस, प्रकरण कार्यप्रवाह और AI सहप्रचालक तक पहुँच के लिए अपने अधिकारी पद से साइन इन करें — ये सभी पद-आधारित पहुँच नियंत्रण और अनिवार्य मानवीय अनुमोदन के अधीन हैं।',
  'Last reviewed and updated': 'अंतिम समीक्षा एवं अद्यतन',
  'Visitors today (simulated)': 'आज के आगंतुक (अनुरूपित)',
  'Built in line with GIGW, W3C and WCAG 2.1 accessibility guidelines':
    'GIGW, W3C एवं WCAG 2.1 सुगम्यता दिशानिर्देशों के अनुरूप निर्मित',
  Simulated: 'अनुरूपित',
  '{0} compliance alerts currently open for officer review':
    'अधिकारी समीक्षा हेतु इस समय {0} अनुपालन सूचनाएँ खुली हैं',
  '{0} ITC risk cases flagged this cycle': 'इस चक्र में {0} ITC जोखिम प्रकरण चिह्नित',
  '{0} refund cases awaiting officer sanction': '{0} प्रतिदाय प्रकरण अधिकारी की मंजूरी की प्रतीक्षा में',
  '₹{0} Cr in exposure currently flagged as high-risk':
    '₹{0} करोड़ की जोखिम राशि इस समय उच्च जोखिम के रूप में चिह्नित',

  /* == Role gate ========================================================== */
  'Access follows the role held, and every action is logged against the officer who took it.':
    'पहुँच धारित पद के अनुसार मिलती है, और प्रत्येक कार्रवाई उसे करने वाले अधिकारी के नाम दर्ज होती है।',
  'Every figure states the system it came from and whether it is simulated.':
    'प्रत्येक आँकड़ा बताता है कि वह किस प्रणाली से आया और वह अनुरूपित है या नहीं।',
  'The platform makes no call to the open internet for its figures, models or maps.':
    'यह मंच अपने आँकड़ों, प्रारूपों या मानचित्रों के लिए खुले इंटरनेट से कोई संपर्क नहीं करता।',
  'Demonstration environment. Every taxpayer, return, notice and case in this platform is simulated; the statute, notifications and published collection figures are real.':
    'प्रदर्शन वातावरण। इस मंच का प्रत्येक करदाता, विवरणी, नोटिस और प्रकरण अनुरूपित है; अधिनियम, अधिसूचनाएँ और प्रकाशित संग्रह आँकड़े वास्तविक हैं।',
  'Demonstration environment using simulated data. Role-based section access, maker-checker workflow and audit logging run throughout the platform.':
    'अनुरूपित आँकड़ों पर चलने वाला प्रदर्शन वातावरण। पद-आधारित अनुभाग पहुँच, कर्ता-परीक्षक कार्यप्रवाह और लेखापरीक्षा अभिलेखन पूरे मंच पर कार्यरत हैं।',
  'e.g. Rohan Deshmukh': 'उदा. रोहन देशमुख',
  'You are signing in as': 'आप इस रूप में साइन इन कर रहे हैं',
  'Select your officer record…': 'अपना अधिकारी अभिलेख चुनें…',
  'assigned cases': 'नियत प्रकरण',
  'This role is scoped to cases assigned to you specifically — pick your officer record so that scoping resolves correctly.':
    'यह पद विशेष रूप से आपको नियत प्रकरणों तक सीमित है — अपना अधिकारी अभिलेख चुनें ताकि यह परिसीमन सही ढंग से लागू हो।',

  /* == Evidence-to-action brief =========================================== */
  'Evidence-to-action brief': 'साक्ष्य-से-कार्रवाई टिप्पणी',
  'Evidence on record': 'अभिलेख पर उपलब्ध साक्ष्य',
  'No encoded risk rule fires for this taxpayer.': 'इस करदाता पर कोई संकेतबद्ध जोखिम नियम लागू नहीं होता।',
  'Filing status: {0} · compliance history on record: {1}':
    'विवरणी स्थिति: {0} · अभिलेख पर अनुपालन इतिहास: {1}',
  'Provision engaged': 'लागू की गई उपधारा',
  'Rests on a contested notification': 'विवादित अधिसूचना पर आधारित',
  'No limitation record exists for this taxpayer, so no provision has been engaged by the platform.':
    'इस करदाता के लिए परिसीमा का कोई अभिलेख नहीं है, इसलिए मंच ने कोई उपधारा लागू नहीं की है।',
  'Precedent bearing on this case': 'इस प्रकरण पर प्रभाव डालने वाला पूर्वनिर्णय',
  Persuasive: 'मार्गदर्शक',
  Favours: 'अनुकूल',
  'the department': 'विभाग के',
  'the assessee': 'करनिर्धारिती के',
  undecided: 'अनिर्णीत',
  'Departmental record on {0}: {1} concluded proceedings, {2}% confirmed. Institutional memory, not judicial authority.':
    '{0} पर विभागीय अभिलेख: {1} निपटाई गई कार्यवाहियाँ, {2}% पुष्ट। यह संस्थागत स्मृति है, न्यायिक प्राधिकार नहीं।',
  'What is at stake': 'दाँव पर क्या है',
  'Assessed exposure': 'निर्धारित जोखिम राशि',
  'Decays within 7 days': '7 दिनों में क्षय',
  'Confidence — reported against four separate questions': 'विश्वास — चार पृथक प्रश्नों पर अलग-अलग दर्ज',
  'Limitation position': 'परिसीमा की स्थिति',
  '{0} days past the deadline': 'समय-सीमा के {0} दिन बाद',
  'No limitation record. Absence of a record is not the same as absence of a deadline.':
    'परिसीमा का कोई अभिलेख नहीं। अभिलेख का न होना समय-सीमा के न होने के बराबर नहीं है।',
  'Recommended next step': 'अनुशंसित अगला कदम',
  'Basis: {0}': 'आधार: {0}',
  'Requires officer approval before anything issues.': 'कुछ भी जारी होने से पूर्व अधिकारी का अनुमोदन आवश्यक।',

  /* == Cluster detection ================================================== */
  'Cluster ID': 'समूह पहचान',
  Entities: 'इकाइयाँ',
  '{0} entities': '{0} इकाइयाँ',
  'Shared Address?': 'साझा पता?',
  'Shared Contact?': 'साझा संपर्क?',
  'Short-Life Entities': 'अल्पजीवी इकाइयाँ',
  '{0} short-life': '{0} अल्पजीवी',
  'Total Flow Value': 'कुल प्रवाह मूल्य',
  'View Network': 'नेटवर्क देखें',
  'No circular-trading network clusters found.': 'वर्तुलाकार व्यापार का कोई नेटवर्क समूह नहीं मिला।',
  'Clusters Detected': 'पाए गए समूह',
  'Detected Clusters': 'पाए गए समूह',
  'Entities Involved': 'सम्मिलित इकाइयाँ',
  'Clusters w/ Shared Address / Contact': 'साझा पता / संपर्क वाले समूह',
  'Total Estimated Flow Value': 'कुल अनुमानित प्रवाह मूल्य',
  Lakh: 'लाख',
  Dormant: 'निष्क्रिय',
  'Dormant / Inactive': 'निष्क्रिय / अक्रियाशील',
  'Medium Risk': 'मध्यम जोखिम',
  'High Risk': 'उच्च जोखिम',
  'Critical Risk': 'अत्यंत गंभीर जोखिम',
  'Network intelligence is a statistical signal derived from invoice flow, ITC pass-through and linked-entity patterns. It is':
    'नेटवर्क इंटेलिजेंस बीजक प्रवाह, ITC के आगे बढ़ने और जुड़ी हुई इकाइयों के प्रतिरूपों से निकाला गया सांख्यिकीय संकेत है। यह',
  'not a finding of fraud': 'कपट का निष्कर्ष नहीं है',
  ' — every cluster listed here requires verification by the Investigation Team before any enforcement action.':
    ' — यहाँ सूचीबद्ध प्रत्येक समूह की, किसी भी प्रवर्तन कार्रवाई से पूर्व, अन्वेषण दल द्वारा पुष्टि आवश्यक है।',
  'Select a cluster to view its network.': 'नेटवर्क देखने के लिए कोई समूह चुनें।',
  '₹{0} L estimated flow': '₹{0} लाख अनुमानित प्रवाह',
  'Shared Addr.': 'साझा पता',
  'Shared Contact': 'साझा संपर्क',
  'Shared Registered Address': 'साझा पंजीकृत पता',
  'Shared Contact Details': 'साझा संपर्क विवरण',
  'Network Graph — {0}': 'नेटवर्क आरेख — {0}',
  'Arrows indicate direction of invoice flow. Click a node to open the taxpayer\'s full profile.':
    'तीर बीजक प्रवाह की दिशा दर्शाते हैं। करदाता का पूरा विवरण खोलने के लिए किसी बिंदु पर क्लिक करें।',
  'Intelligence Brief': 'इंटेलिजेंस टिप्पणी',
  'No clusters match your current header filters': 'आपकी वर्तमान शीर्ष फ़िल्टर से कोई समूह मेल नहीं खाता',
  'The cluster list and summary below are therefore empty. The graph still shows the last selected cluster, which is outside your current filters — clear or widen the filters to see matching clusters.':
    'इसलिए नीचे दी समूह सूची और सारांश रिक्त हैं। आरेख अब भी अंतिम चयनित समूह दिखा रहा है, जो आपकी वर्तमान फ़िल्टर से बाहर है — मेल खाते समूह देखने के लिए फ़िल्टर हटाएँ या चौड़े करें।',
  'This cluster doesn\'t match your current header filters':
    'यह समूह आपकी वर्तमान शीर्ष फ़िल्टर से मेल नहीं खाता',
  'Dismiss filter mismatch note': 'फ़िल्टर बेमेल टिप्पणी हटाएँ',
  'Invoice Flow — Edge Detail': 'बीजक प्रवाह — कड़ी विवरण',
  From: 'से',
  To: 'को',
  'Estimated Value': 'अनुमानित मूल्य',
  'Entities in this Cluster': 'इस समूह की इकाइयाँ',
  'Flagged Clusters': 'चिह्नित समूह',
  'Consolidated summary across the {0} cluster(s) matching the current filters.':
    'वर्तमान फ़िल्टर से मेल खाते {0} समूहों का समेकित सारांश।',
  'Search clusters...': 'समूह खोजें...',

  /* == Command board ====================================================== */
  'Active conditions': 'सक्रिय स्थितियाँ',
  'Grouped by irreversibility, not by value. {0} of the {1} need a decision at Commissioner level.':
    'अपरिवर्तनीयता के अनुसार समूहबद्ध, मूल्य के अनुसार नहीं। {1} में से {0} पर आयुक्त स्तर पर निर्णय आवश्यक है।',
  'Irreversible — {0}% of the total': 'अपरिवर्तनीय — कुल का {0}%',
  'Still in play': 'अब भी परिवर्तनीय',

  /* == Comparable cases =================================================== */
  'Comparable concluded proceedings': 'तुलनीय निपटाई गई कार्यवाहियाँ',
  'Drawn from the {0} proceedings in the department’s record that have actually concluded and carry an outcome.':
    'विभाग के अभिलेख की उन {0} कार्यवाहियों से लिया गया जो वास्तव में निपट चुकी हैं और जिनका परिणाम दर्ज है।',
  Comparability: 'तुलनीयता',
  Position: 'स्थिति',
  '{0} days': '{0} दिन',
  'Why it is comparable': 'यह तुलनीय क्यों है',
  'No positive match beyond the score.': 'अंक से आगे कोई सकारात्मक मेल नहीं।',
  'How it differs — read before relying on it': 'यह किसमें भिन्न है — इस पर निर्भर होने से पूर्व पढ़ें',
  'No material difference detected on the assessed dimensions.':
    'जाँचे गए आयामों पर कोई तात्त्विक अंतर नहीं मिला।',
  'Dimensions and their weight': 'आयाम एवं उनका भार',

  /* == Taxpayer drilldown ================================================= */
  'Risk signal only': 'केवल जोखिम संकेत',
  'Officer verification required': 'अधिकारी द्वारा पुष्टि आवश्यक',
  'No automated adverse action': 'कोई स्वचालित प्रतिकूल कार्रवाई नहीं',
  'District / Division': 'जिला / विभाग',
  Registered: 'पंजीकृत',
  Contact: 'संपर्क',
  Email: 'ईमेल',
  Address: 'पता',
  'Monthly Turnover': 'मासिक कारोबार',
  'Tax Paid': 'भुगतान किया गया कर',
  'ITC Claimed': 'दावाकृत ITC',
  'Filing Status': 'विवरणी स्थिति',
  'Audit Status': 'लेखापरीक्षा स्थिति',
  'Appeal Status': 'अपील स्थिति',
  'Tax Paid vs ITC Claimed (12 months)': 'भुगतान किया गया कर बनाम दावाकृत ITC (12 माह)',
  'Tax Paid (₹)': 'भुगतान किया गया कर (₹)',
  'ITC Claimed (₹)': 'दावाकृत ITC (₹)',
  'ITC-to-Turnover': 'ITC-से-कारोबार',
  'Sector Benchmark ITC': 'क्षेत्र मानक ITC',
  Deviation: 'विचलन',
  'Refund Claim Trend (₹)': 'प्रतिदाय दावा प्रवृत्ति (₹)',
  'Refund Claimed': 'दावाकृत प्रतिदाय',
  'E-Way Bill Movement Value (₹)': 'ई-वे बिल परिवहन मूल्य (₹)',
  'E-Way Value': 'ई-वे मूल्य',
  'Linked Suppliers': 'जुड़े आपूर्तिकर्ता',
  'Linked Buyers': 'जुड़े क्रेता',
  'Compliance Timeline': 'अनुपालन कालक्रम',
  'GST Registration granted': 'GST पंजीयन प्रदान',
  '{0} issued — status: {1}': '{0} जारी — स्थिति: {1}',
  'Current compliance history: {0}': 'वर्तमान अनुपालन इतिहास: {0}',
  'Officer Notes': 'अधिकारी टिप्पणियाँ',
  'Add an officer note...': 'अधिकारी टिप्पणी जोड़ें...',
  'Add Note': 'टिप्पणी जोड़ें',
  'Generated by Officer AI Copilot': 'अधिकारी AI सहप्रचालक द्वारा निर्मित',

  /* == Small shared components ============================================ */
  'AI Copilot — simulated output': 'AI सहप्रचालक — अनुरूपित निर्गम',
  'Confidence: {0}': 'विश्वास: {0}',
  'Evidence Used': 'प्रयुक्त साक्ष्य',
  'Informational only': 'केवल सूचनार्थ',
  'Every figure on this screen is generated demonstration data. No live departmental system is connected.':
    'इस पर्दे का प्रत्येक आँकड़ा निर्मित प्रदर्शन आँकड़ा है। कोई सजीव विभागीय प्रणाली जुड़ी हुई नहीं है।',
  'Illustrative data': 'दृष्टांत आँकड़े',
  '{0} of {1} records': '{1} अभिलेखों में से {0}',
  'Page {0} of {1}': 'पृष्ठ {0}, कुल {1}',
  Prev: 'पिछला',
  Next: 'अगला',
  Close: 'बंद करें',
  'of 100': '100 में से',
  'Copy failed': 'प्रतिलिपि विफल',
  'The filter is currently set to': 'फ़िल्टर इस समय इस पर लगी है',
  'nothing on this page is narrowed by it.': 'इस पृष्ठ पर उससे कुछ भी सीमित नहीं होता।',
  'Why flagged?': 'चिह्नित क्यों?',
  'No risk rules triggered. Behaviour is within expected parameters for this taxpayer profile.':
    'कोई जोखिम नियम लागू नहीं हुआ। व्यवहार इस करदाता के प्रारूप हेतु अपेक्षित सीमाओं के भीतर है।',
  'Routine monitoring — no escalation required': 'सामान्य निगरानी — वरिष्ठ स्तर पर भेजने की आवश्यकता नहीं',

  /* == Statutory flag ===================================================== */
  '{0}d': '{0} दि.',
  '{0}d overdue': '{0} दि. विलंब',
  '{0} of these {1} are on periods that are already time-barred — {2} of exposure that can no longer be demanded.':
    'इनमें से {0} {1} ऐसी अवधियों पर हैं जो पहले ही कालातीत हो चुकी हैं — {2} की जोखिम राशि जिसकी अब माँग नहीं की जा सकती।',
  'The limitation period has expired, so no demand can lawfully be raised for these periods however the case is worked. They should be reviewed for closure rather than advanced, and the officer-days they hold released to cases that are still live.':
    'परिसीमा अवधि समाप्त हो चुकी है, इसलिए प्रकरण चाहे जैसे भी निपटाया जाए, इन अवधियों के लिए विधिपूर्वक कोई माँग खड़ी नहीं की जा सकती। इन्हें आगे बढ़ाने के बजाय निपटान हेतु समीक्षित किया जाना चाहिए, और इनमें फँसे अधिकारी-दिवस उन प्रकरणों के लिए मुक्त किए जाने चाहिए जो अब भी जीवित हैं।',
  '{0} more expire within 30 days': '{0} और 30 दिनों में समाप्त होते हैं',
  '{0} of these {1} expire within 30 days': 'इनमें से {0} {1} 30 दिनों में समाप्त होते हैं',
  ' — {0} of exposure that will be extinguished by operation of law if the notice does not issue in time.':
    ' — {0} की जोखिम राशि, जो नोटिस समय पर जारी न होने पर विधि के प्रवर्तन से समाप्त हो जाएगी।',
  'Advancing this case cannot produce a recoverable demand. Review it for closure.':
    'इस प्रकरण को आगे बढ़ाने से वसूली-योग्य माँग नहीं बन सकती। इसे निपटान हेतु समीक्षित करें।',
  'This deadline rests on a notification whose validity is reserved before the Supreme Court — see Precedent Intelligence.':
    'यह समय-सीमा ऐसी अधिसूचना पर आधारित है जिसकी वैधता उच्चतम न्यायालय के समक्ष सुरक्षित रखी गई है — पूर्वनिर्णय इंटेलिजेंस देखें।'
})
