import { registerMessages } from '../../locale.js'

/**
 * Hindi — the last of the indirect prose: role access summaries, security
 * assurance items, tab and band labels, chart axis labels, toast messages and
 * the leakage indicators with their recommended actions.
 *
 * Marathi already carried these; they surfaced only once scripts/prose.mjs
 * started reporting strings passed to t() as a variable rather than written at
 * the render site.
 *
 * "Marathi Summary" is a control on the reports screen, not a description of
 * this file — it names the Marathi rendering an officer can attach to a
 * briefing note, so it stays "मराठी सारांश" in Hindi too.
 *
 *   determinative → निर्धारक
 *   contextual    → प्रासंगिक
 *   descriptive   → वर्णनात्मक
 *   containment   → नियंत्रण
 *   band          → पट्टी
 */
registerMessages('hi', {
  /* == Role access summaries ============================================ */
  'Full access to all modules, including Executive Command Center and AI Governance & Security.':
    'सभी मॉड्यूल तक पूर्ण पहुँच, जिसमें कार्यकारी नियंत्रण केंद्र तथा AI शासन एवं सुरक्षा सम्मिलित हैं।',
  'Access to all modules except AI Governance & Security; includes Audit & Scrutiny and Refund Risk.':
    'AI शासन एवं सुरक्षा को छोड़कर सभी मॉड्यूल तक पहुँच; लेखापरीक्षा एवं संवीक्षा तथा प्रतिदाय जोखिम सम्मिलित।',
  'Access to all modules except Executive Command Center and AI Governance & Security; includes Audit & Scrutiny Engine.':
    'कार्यकारी नियंत्रण केंद्र तथा AI शासन एवं सुरक्षा को छोड़कर सभी मॉड्यूल तक पहुँच; लेखापरीक्षा एवं संवीक्षा यंत्र सम्मिलित।',
  'Access to all modules except Executive Command Center and AI Governance & Security; includes Refund Risk Intelligence.':
    'कार्यकारी नियंत्रण केंद्र तथा AI शासन एवं सुरक्षा को छोड़कर सभी मॉड्यूल तक पहुँच; प्रतिदाय जोखिम इंटेलिजेंस सम्मिलित।',
  'Access to all modules except Executive Command Center; primary oversight of AI Governance & Security.':
    'कार्यकारी नियंत्रण केंद्र को छोड़कर सभी मॉड्यूल तक पहुँच; AI शासन एवं सुरक्षा का प्रमुख पर्यवेक्षण।',
  'Restricted to Reports & Briefing Notes only, in read-only capacity.':
    'केवल प्रतिवेदन एवं टिप्पणियों तक सीमित, केवल-पठन क्षमता में।',
  'Reports & Briefing Notes (read-only)': 'प्रतिवेदन एवं टिप्पणियाँ (केवल-पठन)',
  'Full state-wide access. Executive command center, all intelligence modules and AI governance.':
    'पूर्ण राज्यव्यापी पहुँच। कार्यकारी नियंत्रण केंद्र, सभी इंटेलिजेंस मॉड्यूल एवं AI शासन।',
  'Full state-wide access with divisional oversight responsibilities.':
    'विभागीय पर्यवेक्षण उत्तरदायित्वों सहित पूर्ण राज्यव्यापी पहुँच।',
  'Division-level revenue, audit and refund intelligence for assigned territory.':
    'नियत क्षेत्र हेतु विभाग-स्तरीय राजस्व, लेखापरीक्षा एवं प्रतिदाय इंटेलिजेंस।',
  'Access to assigned audit and scrutiny cases and case-level intelligence.':
    'नियत लेखापरीक्षा एवं संवीक्षा प्रकरणों तथा प्रकरण-स्तरीय इंटेलिजेंस तक पहुँच।',
  'Access to refund risk intelligence and assigned refund cases.':
    'प्रतिदाय जोखिम इंटेलिजेंस एवं नियत प्रतिदाय प्रकरणों तक पहुँच।',
  'Access to fake invoice network, ITC risk and audit case intelligence.':
    'फर्जी बीजक नेटवर्क, ITC जोखिम एवं लेखापरीक्षा प्रकरण इंटेलिजेंस तक पहुँच।',
  'Access to AI governance dashboard, model logs and override review.':
    'AI शासन डैशबोर्ड, प्रारूप अभिलेख एवं अधिक्रमण समीक्षा तक पहुँच।',
  'Read-only access to reports and briefing notes only.':
    'केवल प्रतिवेदन एवं टिप्पणियों तक केवल-पठन पहुँच।',
  'cases assigned to me': 'मुझे नियत प्रकरण',

  /* == Security assurance items ========================================= */
  Complete: 'पूर्ण',
  Required: 'आवश्यक',
  'Access control review': 'पहुँच नियंत्रण समीक्षा',
  'Data encryption audit': 'आँकड़ा कूटलेखन लेखापरीक्षा',
  'Penetration testing': 'भेदन परीक्षण',
  'Incident response drill': 'घटना प्रतिक्रिया अभ्यास',
  'Third-party API security assessment': 'तृतीय-पक्ष API सुरक्षा आकलन',
  'AI cannot issue penalty': 'AI शास्ति नहीं लगा सकता',
  'AI cannot block taxpayer': 'AI करदाता को अवरुद्ध नहीं कर सकता',
  'AI cannot reject refund': 'AI प्रतिदाय अस्वीकृत नहीं कर सकता',
  'AI only supports authorised officer decision-making':
    'AI केवल प्राधिकृत अधिकारी के निर्णय में सहायता करता है',
  'AI does not take enforcement decisions. All outputs are advisory risk signals subject to authorised officer verification and approval.':
    'AI प्रवर्तन संबंधी निर्णय नहीं लेता। सभी निर्गम सलाहकारी जोखिम संकेत हैं जो प्राधिकृत अधिकारी के सत्यापन एवं अनुमोदन के अधीन हैं।',
  'AI-generated output is a decision-support draft based on available filing and transaction data. It does not constitute a legal finding, penalty, or enforcement action. Authorised officer verification and approval is mandatory before any action is taken.':
    'AI-निर्मित निर्गम उपलब्ध विवरणी एवं लेनदेन आँकड़ों पर आधारित निर्णय-सहायक प्रारूप है। यह न विधिक निष्कर्ष है, न शास्ति, न प्रवर्तन कार्रवाई। कोई भी कार्रवाई करने से पूर्व प्राधिकृत अधिकारी का सत्यापन एवं अनुमोदन अनिवार्य है।',
  'Automated nudges are informational only. They do not constitute a legal notice and do not trigger any adverse action.':
    'स्वचालित स्मरण केवल सूचनार्थ हैं। वे न विधिक नोटिस हैं और न किसी प्रतिकूल कार्रवाई को जन्म देते हैं।',
  'Human Review Required': 'मानवीय समीक्षा आवश्यक',

  /* == Tab and section labels ========================================== */
  'This week’s allocation': 'इस सप्ताह का आवंटन',
  'What cannot be worked': 'जो निपटाया नहीं जा सकता',
  'Where the constraint binds': 'बाधा कहाँ बाँधती है',
  'Required by statute': 'अधिनियम द्वारा अपेक्षित',
  'Model recommendation': 'प्रारूप की अनुशंसा',
  'From the case record': 'प्रकरण अभिलेख से',
  'Engine feasibility': 'यंत्र की व्यवहार्यता',
  'Intelligence graph': 'इंटेलिजेंस आरेख',
  'What the pilot extract must carry': 'पायलट एक्सट्रैक्ट में क्या होना चाहिए',
  'Detected chains': 'पहचानी गई शृंखलाएँ',
  'Where to act': 'कार्रवाई कहाँ करें',
  'Whether we can act': 'क्या हम कार्रवाई कर सकते हैं',
  'Method and limits': 'पद्धति एवं सीमाएँ',
  'Why no Section 74 classification': 'धारा 74 का वर्गीकरण क्यों नहीं',
  'What is real, what is simulated': 'क्या वास्तविक है, क्या अनुरूपित',
  'Law & judicial authority': 'विधि एवं न्यायिक प्राधिकार',
  Overview: 'अवलोकन',
  'Filing & ITC': 'विवरणी एवं ITC',
  'E-Way & Refund': 'ई-वे एवं प्रतिदाय',
  'Timeline & Notes': 'कालक्रम एवं टिप्पणियाँ',
  'AI Summary': 'AI सारांश',
  'Current Officer': 'वर्तमान अधिकारी',
  'Preliminary desk review completed. Awaiting GSTR-2B reconciliation.':
    'प्रारंभिक कार्यालयीन समीक्षा पूर्ण। GSTR-2B मिलान की प्रतीक्षा।',

  /* == Severity and status bands ======================================= */
  Severe: 'गंभीर',
  Elevated: 'बढ़ा हुआ',
  Stable: 'स्थिर',
  'Severe deficit': 'गंभीर घाटा',
  'High deficit': 'उच्च घाटा',
  'Mild deficit': 'मामूली घाटा',
  'On/above target': 'लक्ष्य पर/लक्ष्य से ऊपर',
  Healthy: 'स्वस्थ',
  Degraded: 'क्षीण',
  Undecided: 'अनिर्णीत',
  'Priority 1': 'प्राथमिकता 1',
  'Priority 2': 'प्राथमिकता 2',
  'Priority 3': 'प्राथमिकता 3',
  'Priority 4': 'प्राथमिकता 4',
  Determinative: 'निर्धारक',
  'Decides outcomes.': 'परिणाम तय करता है।',
  Contextual: 'प्रासंगिक',
  'Shapes how a case is argued.': 'प्रकरण कैसे लड़ा जाएगा, यह तय करता है।',
  Descriptive: 'वर्णनात्मक',
  'Decides nothing.': 'कुछ तय नहीं करता।',

  /* == Executive command centre health components ====================== */
  'ITC Risk Containment': 'ITC जोखिम नियंत्रण',
  'Refund Risk Containment': 'प्रतिदाय जोखिम नियंत्रण',
  'Audit Closure Rate': 'लेखापरीक्षा निपटान दर',
  'Litigation Position': 'मुकदमा स्थिति',
  'Recovery Locked': 'रुकी हुई वसूली',

  /* == ITC anomaly categories ========================================== */
  'Input tax credit claimed materially exceeds trailing average / sector norm.':
    'दावाकृत इनपुट कर श्रेय पिछले औसत / क्षेत्रीय प्रमाणक से तात्त्विक रूप से अधिक है।',
  'Supplier Mismatch': 'आपूर्तिकर्ता विसंगति',
  'Upstream supplier independently carries a High risk rating, or a supplier-risk signal is triggered.':
    'पूर्ववर्ती आपूर्तिकर्ता पर स्वतंत्र रूप से उच्च जोखिम श्रेणी है, अथवा आपूर्तिकर्ता-जोखिम संकेत लागू है।',
  'Circular ITC Suspicion': 'वर्तुलाकार ITC का संदेह',
  'Invoice flow pattern consistent with circular trading among linked counterparties.':
    'बीजक प्रवाह का प्रतिरूप जुड़े प्रतिपक्षों के बीच वर्तुलाकार व्यापार से संगत है।',
  'ITC Without Corresponding Supply Pattern': 'तदनुरूप आपूर्ति प्रतिरूप के बिना ITC',
  'E-way bill movement value is inconsistent with declared outward supply — credit claimed without matching movement.':
    'ई-वे बिल परिवहन मूल्य घोषित बहिर्गामी आपूर्ति से असंगत है — मेल खाते परिवहन के बिना श्रेय का दावा।',
  'Sector Deviation': 'क्षेत्रीय विचलन',
  'Deviation from Sector Benchmark': 'क्षेत्रीय मानक से विचलन',
  'Tax-to-turnover ratio deviates materially from the peer sector benchmark.':
    'कर-से-कारोबार अनुपात समकक्ष क्षेत्रीय मानक से तात्त्विक रूप से विचलित है।',

  /* == Revenue leakage indicators and their actions ==================== */
  'Sudden Fall in Tax Payment': 'कर भुगतान में अचानक गिरावट',
  'Recommend desk review of last 3 filed returns and comparison against sector trend.':
    'अंतिम 3 दाखिल विवरणियों की कार्यालयीन समीक्षा और क्षेत्रीय प्रवृत्ति से तुलना की सिफारिश।',
  'Turnover Growth, Tax Decline': 'कारोबार में वृद्धि, कर में गिरावट',
  'Recommend reconciliation of turnover growth against tax payment trend; verify for possible under-reporting of taxable value.':
    'कारोबार की वृद्धि का कर भुगतान प्रवृत्ति से मिलान करने की सिफारिश; करयोग्य मूल्य संभवतः कम घोषित किया गया है या नहीं, सत्यापित करें।',
  'Nil-Return / Non-Filer Risk': 'शून्य विवरणी / विवरणी न भरने का जोखिम',
  'Recommend automated reminder escalation to Division Officer; consider provisional assessment if non-filing persists beyond statutory window.':
    'स्वचालित स्मरण के साथ विभाग अधिकारी तक भेजने की सिफारिश; सांविधिक अवधि के बाद भी विवरणी न भरने पर अनंतिम निर्धारण पर विचार करें।',
  'Late Filing Impact': 'विलंबित विवरणी का प्रभाव',
  'Recommend monitoring for chronic late-filing pattern; flag for compliance nudge and interest/late-fee computation review.':
    'लगातार विलंब से विवरणी भरने की प्रवृत्ति पर निगरानी की सिफारिश; अनुपालन स्मरण एवं ब्याज / विलंब शुल्क गणना की समीक्षा हेतु चिह्नित करें।',
  'Review amended registration fields (address/authorised signatory/bank) for consistency with filing history':
    'संशोधित पंजीयन स्तंभ (पता / प्राधिकृत हस्ताक्षरकर्ता / बैंक) विवरणी इतिहास से संगत हैं या नहीं, इसकी समीक्षा करें',
  'Possible circular transaction chain detected based on invoice flow, ITC pass-through, low tax payment, and linked counterparty risk.':
    'बीजक प्रवाह, ITC मध्यवर्ती हस्तांतरण, कम कर भुगतान और जुड़े प्रतिपक्ष के जोखिम के आधार पर संभावित वर्तुलाकार लेनदेन शृंखला पाई गई।',

  /* == Empty states on the reports screen ============================== */
  'No districts in scope.': 'दायरे में कोई जिला नहीं।',
  'No districts match the current filters.': 'वर्तमान फ़िल्टर से कोई जिला मेल नहीं खाता।',
  'No sector in scope currently carries a high or critical-risk taxpayer.':
    'दायरे के किसी क्षेत्र में इस समय उच्च अथवा अत्यंत गंभीर जोखिम वाला करदाता नहीं है।',
  'No taxpayers in scope.': 'दायरे में कोई करदाता नहीं।',
  'No decided matters in scope.': 'दायरे में कोई निर्णीत विषय नहीं।',
  'No alerts in scope.': 'दायरे में कोई सूचना नहीं।',
  'Scope: platform-wide. Governance metrics describe the AI layer itself and are not narrowed by taxpayer filters.':
    'दायरा: संपूर्ण मंच। शासन मापक स्वयं AI स्तर का वर्णन करते हैं और करदाता फ़िल्टर से सीमित नहीं होते।',
  'No preview data available for this report type.':
    'इस प्रतिवेदन प्रकार हेतु कोई पूर्वावलोकन आँकड़ा उपलब्ध नहीं।',
  'Marathi Summary': 'मराठी सारांश',
  'Hide Marathi Summary': 'मराठी सारांश छिपाएँ',
  'No anomalies found': 'कोई असामान्यता नहीं मिली',
  'No records match the current filters.': 'वर्तमान फ़िल्टर से कोई अभिलेख मेल नहीं खाता।',
  'All Statuses': 'सभी स्थितियाँ',
  'All Alert Types': 'सभी सूचना प्रकार',
  'Search...': 'खोजें...',

  /* == Chrome, chart labels and toasts ================================= */
  'Open navigation': 'नेविगेशन खोलें',
  'Close navigation': 'नेविगेशन बंद करें',
  'Primary navigation': 'प्राथमिक नेविगेशन',
  'Interface language': 'अंतरापृष्ठ भाषा',
  'Switched role': 'पद बदला गया',
  'Signed out': 'साइन आउट',
  Light: 'उजला',
  Dark: 'गहरा',
  'Viewed Network Cluster': 'नेटवर्क समूह देखा',
  'Fake Invoice Network': 'फर्जी बीजक नेटवर्क',
  'Exposure sitting here (₹ Cr)': 'यहाँ स्थित जोखिम राशि (₹ करोड़)',
  'Recoverable (%)': 'वसूली-योग्य (%)',
  Today: 'आज',
  Done: 'हो गया',
  Copied: 'प्रतिलिपि बनाई',
  'Not available in demo': 'प्रदर्शन में उपलब्ध नहीं',
  'Export (PDF) requested — not implemented in demonstration build':
    'निर्यात (PDF) माँगा गया — प्रदर्शन संस्करण में लागू नहीं',
  'Export (Excel) requested — not implemented in demonstration build':
    'निर्यात (Excel) माँगा गया — प्रदर्शन संस्करण में लागू नहीं',
  'Copied Briefing Note to Clipboard': 'टिप्पणी क्लिपबोर्ड पर प्रतिलिपित',
  Unauthenticated: 'अप्रमाणित',

  /* == The last of the indirect prose =================================== */
  Case: 'प्रकरण',
  'Departmental record': 'विभागीय अभिलेख',
  'Questions of law': 'विधि के प्रश्न',
  'How authority is weighted': 'प्राधिकार का भार कैसे तय होता है',
  'Law & judicial authority': 'विधि एवं न्यायिक प्राधिकार',
  'Favours the department': 'विभाग के अनुकूल',
  'Favours the assessee': 'करनिर्धारिती के अनुकूल',
  'Detected chains': 'पहचानी गई शृंखलाएँ',
  'Where to act': 'कार्रवाई कहाँ करें',
  'Whether we can act': 'क्या हम कार्रवाई कर सकते हैं',
  'Method and limits': 'पद्धति एवं सीमाएँ',
  'Why no Section 74 classification': 'धारा 74 का वर्गीकरण क्यों नहीं',
  'What is real, what is simulated': 'क्या वास्तविक है, क्या अनुरूपित',
  'No districts in scope.': 'दायरे में कोई जिला नहीं।',
  '₹22.08 lakh Cr': '₹22.08 लाख करोड़',
  '₹17.4 lakh Cr': '₹17.4 लाख करोड़',
  'This access code is compiled into the page and can be read by anyone who opens developer tools. It keeps the demonstration from being wandered into; it is not authentication and must never be treated as such.':
    'यह प्रवेश संकेतांक पृष्ठ में ही संकलित है और डेवलपर टूल्स खोलने वाला कोई भी इसे पढ़ सकता है। यह केवल इतना करता है कि प्रदर्शन में कोई अनजाने भटक न जाए; यह प्रमाणीकरण नहीं है और इसे कभी वैसा नहीं माना जाना चाहिए।',
  'Div. Officer — S. Patil': 'विभाग अधिकारी — एस. पाटील',
  /* == Command board conditions — templates, so the count interpolates ==== */
  '{0} proceedings are past their limitation date': '{0} कार्यवाहियाँ अपनी परिसीमा पार कर चुकी हैं',
  '{0} of the open audit queue sit on periods already time-barred':
    'लंबित लेखापरीक्षा पंक्ति के {0} प्रकरण पहले ही कालातीत हो चुकी अवधियों पर हैं',
  '{0} case inside the 30-day statutory window has no officer available':
    '30 दिन की सांविधिक अवधि के भीतर के {0} प्रकरण हेतु कोई अधिकारी उपलब्ध नहीं',
  '{0} cases inside the 30-day statutory window have no officer available':
    '30 दिन की सांविधिक अवधि के भीतर के {0} प्रकरणों हेतु कोई अधिकारी उपलब्ध नहीं',
  '{0} cases cannot be reached by any eligible officer this week':
    'इस सप्ताह {0} प्रकरणों तक कोई पात्र अधिकारी नहीं पहुँच सकता',
  'Cases wait a median {0} days between a signal appearing and being worked':
    'संकेत दिखने से प्रकरण निपटने तक प्रकरण मध्यक {0} दिन प्रतीक्षा करते हैं',
  '₹{0} Cr of recoverable value decays if untouched for seven days':
    'सात दिन अछूता रहने पर ₹{0} करोड़ वसूली-योग्य मूल्य का क्षय होता है',
  '{0} chain cannot be closed simultaneously across the divisions it crosses':
    '{0} शृंखला जिन विभागों से गुजरती है, वहाँ एक साथ बंद नहीं की जा सकती',
  '{0} chains cannot be closed simultaneously across the divisions they cross':
    '{0} शृंखलाएँ जिन विभागों से गुजरती हैं, वहाँ एक साथ बंद नहीं की जा सकतीं',
  '{0} proceedings rest on notifications whose validity is before the Supreme Court':
    '{0} कार्यवाहियाँ ऐसी अधिसूचनाओं पर आधारित हैं जिनकी वैधता उच्चतम न्यायालय के समक्ष है',
  '{0} cases were put down while risk signals were still firing':
    'जोखिम संकेत सक्रिय रहते हुए ही {0} प्रकरण अलग रख दिए गए',
  '{0} Short-Life Entity': '{0} अल्पजीवी इकाई',
  '{0} Short-Life Entities': '{0} अल्पजीवी इकाइयाँ',
  '< 90 days': '< 90 दिन'
})
