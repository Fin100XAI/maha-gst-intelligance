import { registerMessages } from '../../locale.js'

/**
 * Marathi — Revenue at Risk & Recovery, Unknown Risk Discovery, and the last
 * few strings on Audit, Litigation, Refund, Sector, Executive and Governance.
 *
 *   recovery half-life  → वसुलीचे अर्धायुष्य
 *   decay               → क्षय
 *   time-to-action      → कारवाईस लागणारा काळ
 *   recovery curve      → वसुली वक्र
 *   band                → पट्टा
 *   propagation         → प्रसार
 *   hop                 → टप्पा
 *   screening           → चाळणी
 *   peer group          → समकक्ष गट
 *   norm                → प्रमाणक
 *   deviation           → विचलन
 *   signature           → ठसा (a recurring deviation pattern)
 */
registerMessages('mr', {
  /* == Revenue at Risk & Recovery — header and root cause ================= */
  'Leadership · Root Cause': 'नेतृत्व · मूळ कारण',
  'Revenue Recovery Window': 'महसूल वसुली कालपट',
  'Every flagged rupee has a recovery half-life. This page measures the platform against the one variable that decides how much of it survives — the time between a signal firing and an officer acting on it.':
    'निदर्शनास आणलेल्या प्रत्येक रुपयाला वसुलीचे अर्धायुष्य असते. त्यातील किती टिकते हे ठरवणाऱ्या एकाच चलावर हे पान मंचाला मोजते — संकेत लागू होण्यापासून अधिकाऱ्याने त्यावर कारवाई करण्यापर्यंतचा काळ.',
  'The Root Cause': 'मूळ कारण',
  'Detection is not the constraint. Time-to-action is.': 'शोध ही मर्यादा नाही. कारवाईस लागणारा काळ ही आहे.',
  'The department already produces the signals. By the time a case is worked, the credit has moved downstream, been utilised, and the entity has often stopped trading. Of ₹{0} Cr currently flagged, ₹{1} Cr is still realistically recoverable — the remaining ₹{2} Cr has decayed while the case waited.':
    'विभाग हे संकेत आधीच तयार करतो. प्रकरण हाताळेपर्यंत श्रेय पुढे सरकलेले, वापरले गेलेले असते, आणि तो घटक अनेकदा व्यापारच बंद करून गेलेला असतो. सध्या निदर्शनास आणलेल्या ₹{0} कोटींपैकी ₹{1} कोटी अद्याप वास्तवात वसूलपात्र आहेत — उर्वरित ₹{2} कोटींचा प्रकरण वाट पाहत असतानाच क्षय झाला.',
  'Median signal age: {0} days': 'संकेताचे मध्यक वय: {0} दिवस',
  '{0}% of exposure past the blockable window': 'रोखता येण्याजोग्या कालपटाबाहेरील जोखीम रक्कम {0}%',
  'Fastest any signal can fire: {0} days': 'कोणताही संकेत लागू होण्याचा किमान कालावधी: {0} दिवस',

  /* == Revenue at Risk & Recovery — tiles ================================= */
  'Flagged Exposure': 'निदर्शनास आणलेली जोखीम रक्कम',
  'Recoverable Today': 'आज वसूलपात्र',
  'Already Lost To Lag': 'विलंबामुळे आधीच गमावलेले',
  'Cost Of One More Week': 'आणखी एका आठवड्याची किंमत',
  'Lead Signal': 'प्रमुख संकेत',
  'Signal Age': 'संकेताचे वय',
  recoverable: 'वसूलपात्र',
  'Recoverable Now': 'आता वसूलपात्र',
  'Lost If Untouched 7d': '७ दिवस न हाताळल्यास गमावले जाणारे',

  /* == Revenue at Risk & Recovery — the curve ============================= */
  'The Recovery Curve': 'वसुली वक्र',
  'Recoverability falls with signal age (line). Bars show where the department’s exposure is actually sitting.':
    'संकेताचे वय वाढेल तशी वसूलक्षमता घटते (रेषा). स्तंभ विभागाची जोखीम रक्कम प्रत्यक्षात कुठे आहे ते दाखवतात.',
  'The first band is empty, and that is the finding.': 'पहिला पट्टा रिकामा आहे, आणि तोच निष्कर्ष आहे.',
  'No case sits in the 0–30 day window because no signal in the current rule set can fire that fast — every one of them waits on a return being filed. The floor is {0} days before an officer can see anything at all. That is not a backlog problem; it is a design property of return-cycle-bound detection.':
    '० ते ३० दिवसांच्या कालपटात एकही प्रकरण नाही, कारण सध्याच्या नियम संचातील कोणताही संकेत इतक्या लवकर लागू होऊ शकत नाही — त्यांतील प्रत्येक विवरणपत्र दाखल होण्याची वाट पाहतो. अधिकाऱ्याला काहीही दिसण्यापूर्वीची किमान मर्यादा {0} दिवस आहे. ही थकबाकीची समस्या नाही; विवरणपत्र-चक्राशी बांधलेल्या शोधपद्धतीचा हा रचनात्मक गुणधर्म आहे.',
  'Where The Exposure Sits': 'जोखीम रक्कम कुठे आहे',
  'Each band states why recovery falls off across it — the percentages are a calibration of that reasoning, not a measurement.':
    'प्रत्येक पट्ट्यात वसुली का घटते हे तो पट्टा स्वतः सांगतो — टक्केवारी ही त्या तर्काची मांडणी आहे, मोजमाप नाही.',
  '{0} cases · {1}% recoverable': '{0} प्रकरणे · {1}% वसूलपात्र',

  /* == Revenue at Risk & Recovery — ordering comparison =================== */
  'Ordering — what the same week buys': 'क्रम — तोच आठवडा काय मिळवून देतो',
  'A like-for-like comparison of two orderings over one week of work — the only variable changed is the order cases are worked in. Establishment and eligibility are modelled properly in Officer Capacity & Deployment; this screen isolates the effect of ordering alone and should not be read as a capacity plan.':
    'एका आठवड्याच्या कामावर दोन क्रमांची समान तुलना — बदललेले एकमेव चल म्हणजे प्रकरणे कोणत्या क्रमाने हाताळली जातात. आस्थापना व पात्रता यांचे योग्य प्रारूप अधिकारी क्षमता व नियुक्ती मध्ये आहे; हा पडदा केवळ क्रमाचा परिणाम वेगळा काढतो आणि तो क्षमता आराखडा म्हणून वाचू नये.',
  'Ranked by risk score': 'जोखीम गुणांकानुसार क्रम',
  'What the platform did before': 'मंचाने पूर्वी काय केले',
  'Ranked by value at risk this week': 'या आठवड्यातील जोखमीतील मूल्यानुसार क्रम',
  'Decay-adjusted ordering': 'क्षय-समायोजित क्रम',
  'Same headcount, same hours, ₹{0} Cr difference in what is recovered — because a score-ordered queue keeps sending officers to high-score cases whose value has already gone flat, while steeply-decaying ones age past the window. Risk score answers "how wrong is this?". It does not answer "what is still left to save?".':
    'तेवढेच मनुष्यबळ, तेवढेच तास, आणि वसुलीत ₹{0} कोटींचा फरक — कारण गुणांकानुसार लावलेली रांग अधिकाऱ्यांना अशा उच्च-गुणांक प्रकरणांकडे पाठवत राहते ज्यांचे मूल्य आधीच सपाट झाले आहे, तर वेगाने क्षय होणारी प्रकरणे कालपटाबाहेर जुनी होतात. जोखीम गुणांक "हे किती चुकीचे आहे?" याचे उत्तर देतो. "अजून वाचवण्यासारखे काय शिल्लक आहे?" याचे उत्तर तो देत नाही.',
  'Queue ordering is advisory — case allocation remains an officer decision':
    'रांगेचा क्रम सल्लात्मक आहे — प्रकरण वाटप हा अधिकाऱ्याचाच निर्णय राहतो',
  'Cases A Score-Ranked Queue Leaves Behind': 'गुणांक-क्रमवारी रांग मागे सोडणारी प्रकरणे',
  'Largest positions gained when the queue is re-ordered by value at risk':
    'जोखमीतील मूल्यानुसार रांग पुन्हा लावल्यावर सर्वाधिक स्थाने मिळवणारी प्रकरणे',
  old: 'जुने',
  risk: 'जोखीम',
  'Decays/wk': 'क्षय/आठवडा',
  'Case Queue': 'प्रकरण रांग',
  'Respects the header filters — {0} of {1} cases': 'शीर्ष गाळण्या पाळते — {1} पैकी {0} प्रकरणे',
  'All {0} flagged cases in the recovery window': 'वसुली कालपटातील निदर्शनास आणलेली सर्व {0} प्रकरणे',
  'By value at risk': 'जोखमीतील मूल्यानुसार',
  'By risk score': 'जोखीम गुणांकानुसार',
  'Search the recovery queue...': 'वसुली रांगेत शोधा...',

  /* == Revenue at Risk & Recovery — chain propagation and registration ==== */
  'Why The Curve Falls — Chain Propagation': 'वक्र का घसरतो — साखळीतील प्रसार',
  'Exposure is never one taxpayer. Credit moves downstream and is utilised hop by hop; once utilised it can no longer be blocked, only recovered.':
    'जोखीम रक्कम कधीच एका करदात्यापुरती नसते. श्रेय पुढे सरकते आणि टप्प्याटप्प्याने वापरले जाते; एकदा वापरले गेल्यावर ते रोखता येत नाही, फक्त वसूल करता येते.',
  'Total chain flow': 'एकूण साखळी प्रवाह',
  'Already utilised': 'आधीच वापरलेले',
  '{0} entities · {1}d old · {2} hop(s) reached': '{0} घटक · {1} दि. जुने · {2} टप्पे गाठले',
  utilised: 'वापरलेले',
  'The Left Edge — Registration Screening': 'डावी कड — नोंदणी चाळणी',
  'The cheapest point on the curve. These indicators are checkable on the day of application rather than reconstructed from invoice flow a year later.':
    'वक्रावरील सर्वात स्वस्त बिंदू. हे निर्देशक वर्षभराने बीजक प्रवाहावरून पुन्हा उभे करण्याऐवजी अर्जाच्या दिवशीच तपासता येतात.',
  'New registrations': 'नवीन नोंदणी',
  '2+ indicators': '२+ निर्देशक',
  'Exposure at stake': 'पणाला लागलेली जोखीम रक्कम',
  'Highest-indicator registrations': 'सर्वाधिक निर्देशक असलेल्या नोंदणी',
  '{0} indicators': '{0} निर्देशक',
  'Why The Lag Exists': 'विलंब का आहे',
  'Each of these is structural — a property of how the return cycle and the case workflow are built, not a failure of effort or of detection.':
    'यांपैकी प्रत्येक रचनात्मक आहे — विवरणपत्र चक्र व प्रकरण कार्यप्रवाह कसे उभारले आहेत याचा गुणधर्म, श्रमाचे किंवा शोधाचे अपयश नव्हे.',
  Consequence: 'परिणाम',
  'What changes it': 'ते काय बदलेल',
  Proposed: 'प्रस्तावित',
  Recovered: 'वसूल',
  'Per officer-day': 'प्रति अधिकारी-दिवस',
  'Loss avoided': 'टाळलेले नुकसान',
  'Forfeited to lag': 'विलंबामुळे गमावलेले',

  /* == Unknown Risk Discovery ============================================= */
  'Fraud & Risk · Discovery': 'फसवणूक व जोखीम · शोध',
  'The nine encoded risk rules find what the department already knows to look for. This screen looks only at the taxpayers none of those rules touch, and asks whether any of them are statistically unlike their own sector peers — searching for patterns not yet in the rulebook rather than re-scoring the ones that are.':
    'संकेतबद्ध केलेले नऊ जोखीम नियम विभागाला आधीच माहीत असलेलेच शोधतात. हा पडदा फक्त अशा करदात्यांकडे पाहतो ज्यांना यांपैकी कोणताही नियम स्पर्श करत नाही, आणि त्यांपैकी कोणी आपल्याच क्षेत्रातील समकक्षांहून सांख्यिकीय दृष्ट्या वेगळा आहे का हे विचारतो — नियमपुस्तकात आधीच असलेल्यांना पुन्हा गुणांकित करण्याऐवजी अद्याप त्यात नसलेले नमुने शोधतो.',
  'Population screened': 'चाळलेली संख्या',
  'of {0} — trigger no encoded rule': '{0} पैकी — कोणताही संकेतबद्ध नियम लागू होत नाही',
  'Review candidates found': 'सापडलेले पुनर्विलोकन उमेदवार',
  '{0}% of those screened': 'चाळलेल्यांपैकी {0}%',
  'Recurring patterns': 'पुनरावृत्त नमुने',
  'candidate rules not yet encoded': 'अद्याप संकेतबद्ध न केलेले संभाव्य नियम',
  'Exposure carried': 'वाहून नेलेली जोखीम रक्कम',
  '₹ Cr across candidates': '₹ कोटी — सर्व उमेदवार मिळून',
  Method: 'पद्धत',
  'Peer coverage': 'समकक्ष व्याप्ती',
  'Norms computed for {0} sectors at a minimum peer group of {1}.':
    'किमान {1} समकक्षांच्या गटावर {0} क्षेत्रांसाठी प्रमाणके परिगणित.',
  '{0} are too small to norm, so taxpayers in them are unassessed rather than cleared: {1}.':
    '{0} इतकी लहान आहेत की त्यांचे प्रमाणक काढता येत नाही, त्यामुळे त्यांतील करदाते निर्दोष ठरवलेले नसून अनिर्धारित आहेत: {1}.',
  'What this cannot do': 'हे काय करू शकत नाही',
  'No review candidates on this dataset — and that is a measured result, not an empty screen.':
    'या डेटासंचावर एकही पुनर्विलोकन उमेदवार नाही — आणि हा मोजलेला निष्कर्ष आहे, रिकामा पडदा नाही.',
  'Why — the rulebook has already claimed the extreme tail':
    'का — नियमपुस्तकाने टोकाचे प्रकरण आधीच घेतले आहे',
  'Behavioural ratio': 'वर्तन गुणोत्तर',
  'Already an encoded rule?': 'आधीच संकेतबद्ध नियम आहे का?',
  'Highest deviation — unflagged': 'सर्वाधिक विचलन — निदर्शनास न आणलेले',
  'Highest deviation — already flagged': 'सर्वाधिक विचलन — आधीच निदर्शनास आणलेले',
  'The outlier threshold is {0}. No unflagged taxpayer reaches it on any ratio, while flagged taxpayers pass it comfortably. Three of these four ratios are themselves the basis of an encoded rule, so any taxpayer extreme enough to appear here has already tripped that rule and left the screened population by definition.':
    'बाह्यबिंदूचा उंबरठा {0} आहे. निदर्शनास न आणलेला एकही करदाता कोणत्याही गुणोत्तरावर तो गाठत नाही, तर निदर्शनास आणलेले करदाते तो सहज ओलांडतात. या चारपैकी तीन गुणोत्तरे स्वतःच एका संकेतबद्ध नियमाचा आधार आहेत, त्यामुळे इथे दिसण्याइतका टोकाचा कोणताही करदाता तो नियम आधीच लागू करून गेलेला असतो आणि व्याख्येनुसारच चाळलेल्या संख्येतून बाहेर पडलेला असतो.',
  'What would make this screen productive': 'हा पडदा फलदायी कशाने होईल',
  'The method is implemented and calibrated. What it lacks is a feature the rulebook does not already encode.':
    'पद्धत अंमलात आणलेली व मांडलेली आहे. तिच्याकडे नाही ते म्हणजे नियमपुस्तकात आधीच संकेतबद्ध नसलेले एखादे वैशिष्ट्य.',
  'The honest position': 'प्रामाणिक भूमिका',
  'Lowering the threshold until results appeared would have produced a populated screen out of ordinary variation — which is the precise failure this module warns about elsewhere. The threshold has been left where the statistics put it.':
    'निष्कर्ष दिसेपर्यंत उंबरठा खाली आणला असता तर सामान्य चढउतारातूनच भरलेला पडदा तयार झाला असता — हेच नेमके अपयश हे प्रारूप इतरत्र इशारा देऊन सांगते. उंबरठा सांख्यिकीने जिथे ठेवला तिथेच ठेवला आहे.',
  'Recurring patterns — candidate rules': 'पुनरावृत्त नमुने — संभाव्य नियम',
  'The same deviation signature across several unflagged taxpayers. This, rather than any individual case, is the discovery worth acting on.':
    'निदर्शनास न आणलेल्या अनेक करदात्यांवर तोच विचलनाचा ठसा. कोणत्याही एका प्रकरणापेक्षा हाच शोध कारवाईयोग्य आहे.',
  '{0} taxpayers': '{0} करदाते',
  'No signature recurs across enough taxpayers to be worth encoding as a rule.':
    'नियम म्हणून संकेतबद्ध करण्याइतक्या करदात्यांवर कोणताही ठसा पुनरावृत्त होत नाही.',
  'Individual review candidates': 'वैयक्तिक पुनर्विलोकन उमेदवार',
  '{0} taxpayers, each invisible to all nine encoded rules. {1} carry a signature seen only once, which is an anecdote rather than a pattern.':
    '{0} करदाते, प्रत्येक नऊही संकेतबद्ध नियमांना अदृश्य. {1} जणांवर केवळ एकदाच दिसलेला ठसा आहे, जो नमुना नसून एक सुटी घटना आहे.',
  'Strongest deviation': 'सर्वाधिक तीव्र विचलन',
  '{0}× the sector median (n={1})': 'क्षेत्रीय मध्यकाच्या {0} पट (n={1})',

  /* == Remaining strings on already-translated screens ==================== */
  'open audit cases': 'प्रलंबित लेखापरीक्षा प्रकरणे',
  'litigation cases': 'खटला प्रकरणे',
  '{0} of your {1} cases match the current filters': 'आपल्या {1} प्रकरणांपैकी {0} सध्याच्या गाळण्यांशी जुळतात',
  'Your role can access every case — showing {0} of {1} that match the current filters':
    'आपले पद प्रत्येक प्रकरण पाहू शकते — सध्याच्या गाळण्यांशी जुळणाऱ्या {1} पैकी {0} दाखवत आहे',
  '({0} of your {1} cases match the current filters)': '(आपल्या {1} प्रकरणांपैकी {0} सध्याच्या गाळण्यांशी जुळतात)',
  'Your role can access every refund case — showing {0} of {1} that match the current filters':
    'आपले पद प्रत्येक परतावा प्रकरण पाहू शकते — सध्याच्या गाळण्यांशी जुळणाऱ्या {1} पैकी {0} दाखवत आहे',
  'Move this case back one stage': 'हे प्रकरण एक टप्पा मागे न्या',
  'Advancing a case requires officer approval — opens the case for review':
    'प्रकरण पुढे नेण्यास अधिकाऱ्याची मान्यता आवश्यक — प्रकरण पुनर्विलोकनासाठी उघडते',
  'Amount Under Dispute': 'वादाधीन रक्कम',
  '> ₹50L': '> ₹५० लाख',
  'Official figures': 'अधिकृत आकडे',
  'Maharashtra has {0} registered SGST dealers (as at 1 April 2025). This demonstration models {1}. The cards below are generated data, not departmental collection figures.':
    'महाराष्ट्रात {0} नोंदणीकृत SGST व्यापारी आहेत (१ एप्रिल २०२५ रोजी). हे प्रात्यक्षिक {1} जणांचे प्रारूप मांडते. खालील कार्डे निर्माण केलेला डेटा आहेत, विभागाचे वसुलीचे आकडे नाहीत.',
  'View sources': 'स्रोत पहा',
  'GST Revenue Monitored': 'देखरेखीखालील GST महसूल',
  'Risk ranking within the current filtered view — click a row for the full Taxpayer 360 profile':
    'सध्याच्या गाळलेल्या दृश्यातील जोखीम क्रमवारी — संपूर्ण करदाता ३६० माहितीसाठी ओळीवर क्लिक करा',
  'vs cross-sector average': 'सर्व क्षेत्रांच्या सरासरीच्या तुलनेत',
  'Reference benchmark ratios as % of turnover — fixed reference values, not recomputed from the filtered taxpayer pool':
    'उलाढालीच्या टक्केवारीत संदर्भ तुलनात्मक गुणोत्तरे — ही निश्चित संदर्भ मूल्ये आहेत, गाळलेल्या करदाता संचावरून पुन्हा परिगणित केलेली नाहीत',
  'Tax-to-Turnover Benchmark': 'कर-उलाढाल तुलनात्मक मानक',
  'from the cross-sector average ({0}%). {1} taxpayers in this sector currently carry a High or Critical risk rating.':
    'सर्व क्षेत्रांच्या सरासरीपासून ({0}%). या क्षेत्रातील {1} करदात्यांना सध्या उच्च किंवा अत्यंत गंभीर जोखीम श्रेणी आहे.',
  'Reports Generated (This Month, illustrative)': 'तयार केलेले अहवाल (या महिन्यात, दर्शनार्थ)',
  'Most-Requested Report (illustrative)': 'सर्वाधिक मागणी असलेला अहवाल (दर्शनार्थ)',
  'Governance metrics on this screen describe the AI layer itself and are not narrowed by the taxpayer filters above; only the audit trail responds to the search box. Oversight console for AI-assisted decision support across the platform — model usage, human override rates, role-based access control, and audit trail integrity. AI systems here operate strictly in an advisory capacity under mandatory human review.':
    'या पडद्यावरील कारभार मापके AI स्तराचेच वर्णन करतात आणि वरील करदाता गाळण्यांनी ती मर्यादित होत नाहीत; केवळ लेखापरीक्षा नोंद शोध चौकटीला प्रतिसाद देते. संपूर्ण मंचावरील AI-सहाय्यित निर्णय सहाय्यासाठीचा हा देखरेख कक्ष — प्रारूप वापर, मानवी फेरबदलाचे प्रमाण, पदनिहाय प्रवेश नियंत्रण, आणि लेखापरीक्षा नोंदीची अखंडता. येथील AI प्रणाली अनिवार्य मानवी पुनर्विलोकनाखाली काटेकोरपणे केवळ सल्लात्मक भूमिकेत कार्य करतात.',
  'It shows system and model activity, which is logged against officers and actions rather than against taxpayers.':
    'हे प्रणाली व प्रारूपाची कार्यवाही दाखवते, जी करदात्यांच्या नावे नव्हे तर अधिकारी व कृतींच्या नावे नोंदवली जाते.',
  'This demonstration has no integrations and makes no network calls. Production requirement: route all AI Copilot and reporting integrations through the departmental secure gateway with mutual TLS, request signing and role-scoped API tokens, and transmit no taxpayer data to external, uncontrolled endpoints.':
    'या प्रात्यक्षिकात कोणतेही एकत्रीकरण नाही आणि कोणताही नेटवर्क संपर्क साधला जात नाही. प्रत्यक्ष अंमलबजावणीची आवश्यकता: सर्व AI सहवैमानिक व अहवाल एकत्रीकरणे विभागाच्या सुरक्षित प्रवेशद्वारातून परस्पर TLS, विनंती स्वाक्षरी व पदनिहाय API टोकनसह न्यावीत, आणि कोणताही करदाता डेटा बाह्य, अनियंत्रित स्रोतांकडे पाठवू नये.',
  'No real taxpayer data is present in this demonstration — every record is generated. Production requirement: process taxpayer personal and financial data strictly for stated revenue-assurance and compliance purposes, consistent with the Digital Personal Data Protection Act, 2023, with purpose limitation, access logging and retention controls.':
    'या प्रात्यक्षिकात कोणताही खरा करदाता डेटा नाही — प्रत्येक अभिलेख निर्माण केलेला आहे. प्रत्यक्ष अंमलबजावणीची आवश्यकता: करदात्यांचा वैयक्तिक व आर्थिक डेटा डिजिटल वैयक्तिक डेटा संरक्षण अधिनियम, २०२३ शी सुसंगत राहून केवळ नमूद केलेल्या महसूल आश्वासन व अनुपालन प्रयोजनांसाठीच वापरावा, आणि त्यासोबत प्रयोजन मर्यादा, प्रवेश नोंद व जतन नियंत्रणे लागू करावीत.',
  'No sampling programme runs in this demonstration; the rate shown above is an illustrative placeholder. Production requirement: sample AI-flagged cases continuously for officer review and track the confirmed false-positive rate to detect systemic bias or drift by sector and district.':
    'या प्रात्यक्षिकात कोणताही नमुना कार्यक्रम चालत नाही; वर दाखवलेले प्रमाण हे दर्शनार्थ ठेवलेले आहे. प्रत्यक्ष अंमलबजावणीची आवश्यकता: AI ने निदर्शनास आणलेल्या प्रकरणांचे अधिकारी पुनर्विलोकनासाठी सातत्याने नमुने घ्यावेत आणि क्षेत्र व जिल्हानिहाय पद्धतशीर पूर्वग्रह किंवा विचलन ओळखण्यासाठी निश्चित झालेल्या चुकीच्या निदर्शनाचे प्रमाण नोंदवत राहावे.'
})
