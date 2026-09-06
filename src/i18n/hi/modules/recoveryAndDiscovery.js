import { registerMessages } from '../../locale.js'

/**
 * Hindi — Revenue at Risk & Recovery, and Unknown Risk Discovery.
 *
 *   recovery half-life  → वसूली का अर्धायु
 *   decay               → क्षय
 *   time-to-action      → कार्रवाई तक का समय
 *   recovery curve      → वसूली वक्र
 *   band                → पट्टी
 *   propagation         → प्रसार
 *   hop                 → चरण
 *   screening           → छानबीन
 *   peer group          → समकक्ष समूह
 *   norm                → प्रमाणक
 *   deviation           → विचलन
 *   signature           → चिह्न (a recurring deviation pattern)
 */
registerMessages('hi', {
  /* == Revenue at Risk & Recovery — header and root cause ================ */
  'Leadership · Root Cause': 'नेतृत्व · मूल कारण',
  'Revenue Recovery Window': 'राजस्व वसूली कालपट',
  'Every flagged rupee has a recovery half-life. This page measures the platform against the one variable that decides how much of it survives — the time between a signal firing and an officer acting on it.':
    'चिह्नित प्रत्येक रुपये का एक वसूली अर्धायु होता है। यह पृष्ठ मंच को उसी एक चर पर मापता है जो तय करता है कि उसमें से कितना बचता है — संकेत लागू होने और अधिकारी द्वारा उस पर कार्रवाई करने के बीच का समय।',
  'The Root Cause': 'मूल कारण',
  'Detection is not the constraint. Time-to-action is.': 'बाधा पहचान नहीं है। कार्रवाई तक का समय है।',
  'The department already produces the signals. By the time a case is worked, the credit has moved downstream, been utilised, and the entity has often stopped trading. Of ₹{0} Cr currently flagged, ₹{1} Cr is still realistically recoverable — the remaining ₹{2} Cr has decayed while the case waited.':
    'विभाग ये संकेत पहले से ही उत्पन्न करता है। प्रकरण निपटने तक श्रेय आगे बढ़ चुका, उपयोग हो चुका होता है, और वह इकाई प्रायः व्यापार ही बंद कर चुकी होती है। इस समय चिह्नित ₹{0} करोड़ में से ₹{1} करोड़ अब भी वास्तविक रूप से वसूली-योग्य है — शेष ₹{2} करोड़ का प्रकरण की प्रतीक्षा में ही क्षय हो गया।',
  'Median signal age: {0} days': 'संकेत की मध्यक आयु: {0} दिन',
  '{0}% of exposure past the blockable window': 'रोकने-योग्य कालपट से बाहर की जोखिम राशि {0}%',
  'Fastest any signal can fire: {0} days': 'कोई भी संकेत लागू होने का न्यूनतम समय: {0} दिन',

  /* == Revenue at Risk & Recovery — tiles ================================ */
  'Flagged Exposure': 'चिह्नित जोखिम राशि',
  'Recoverable Today': 'आज वसूली-योग्य',
  'Already Lost To Lag': 'विलंब से पहले ही खोया',
  'Cost Of One More Week': 'एक और सप्ताह की कीमत',
  'Signal Age': 'संकेत की आयु',
  recoverable: 'वसूली-योग्य',
  'Recoverable Now': 'अभी वसूली-योग्य',
  'Lost If Untouched 7d': '7 दिन अछूता रहने पर खोया',

  /* == Revenue at Risk & Recovery — the curve ============================ */
  'The Recovery Curve': 'वसूली वक्र',
  'Recoverability falls with signal age (line). Bars show where the department’s exposure is actually sitting.':
    'संकेत की आयु बढ़ने के साथ वसूली-क्षमता घटती है (रेखा)। स्तंभ दिखाते हैं कि विभाग की जोखिम राशि वास्तव में कहाँ पड़ी है।',
  'The first band is empty, and that is the finding.': 'पहली पट्टी रिक्त है, और यही निष्कर्ष है।',
  'No case sits in the 0–30 day window because no signal in the current rule set can fire that fast — every one of them waits on a return being filed. The floor is {0} days before an officer can see anything at all. That is not a backlog problem; it is a design property of return-cycle-bound detection.':
    '0 से 30 दिन के कालपट में कोई प्रकरण नहीं है क्योंकि वर्तमान नियम समुच्चय का कोई संकेत इतनी शीघ्र लागू ही नहीं हो सकता — उनमें से प्रत्येक विवरणी दाखिल होने की प्रतीक्षा करता है। अधिकारी को कुछ भी दिखने से पहले की न्यूनतम सीमा {0} दिन है। यह लंबित कार्य की समस्या नहीं; विवरणी-चक्र से बँधी पहचान-पद्धति का अभिकल्पगत गुण है।',
  'Where The Exposure Sits': 'जोखिम राशि कहाँ है',
  'Each band states why recovery falls off across it — the percentages are a calibration of that reasoning, not a measurement.':
    'प्रत्येक पट्टी स्वयं बताती है कि उसमें वसूली क्यों घटती है — प्रतिशत उसी तर्क का अंशांकन हैं, माप नहीं।',
  '{0} cases · {1}% recoverable': '{0} प्रकरण · {1}% वसूली-योग्य',

  /* == Revenue at Risk & Recovery — ordering comparison ================== */
  'Ordering — what the same week buys': 'क्रम — वही सप्ताह क्या दिलाता है',
  'A like-for-like comparison of two orderings over one week of work — the only variable changed is the order cases are worked in. Establishment and eligibility are modelled properly in Officer Capacity & Deployment; this screen isolates the effect of ordering alone and should not be read as a capacity plan.':
    'एक सप्ताह के कार्य पर दो क्रमों की समरूप तुलना — बदला गया एकमात्र चर यह है कि प्रकरण किस क्रम में निपटाए जाते हैं। स्थापना एवं पात्रता का उचित प्रारूप अधिकारी क्षमता एवं तैनाती में है; यह पर्दा केवल क्रम का प्रभाव अलग करके दिखाता है और इसे क्षमता योजना के रूप में नहीं पढ़ा जाना चाहिए।',
  'Ranked by risk score': 'जोखिम अंक के अनुसार क्रम',
  'What the platform did before': 'मंच पहले क्या करता था',
  'Ranked by value at risk this week': 'इस सप्ताह की जोखिमग्रस्त राशि के अनुसार क्रम',
  'Decay-adjusted ordering': 'क्षय-समायोजित क्रम',
  'Same headcount, same hours, ₹{0} Cr difference in what is recovered — because a score-ordered queue keeps sending officers to high-score cases whose value has already gone flat, while steeply-decaying ones age past the window. Risk score answers "how wrong is this?". It does not answer "what is still left to save?".':
    'वही जनशक्ति, वही घंटे, और वसूली में ₹{0} करोड़ का अंतर — क्योंकि अंक के क्रम में लगी पंक्ति अधिकारियों को ऐसे उच्च-अंक प्रकरणों की ओर भेजती रहती है जिनका मूल्य पहले ही समतल हो चुका है, जबकि तेज़ी से क्षय होते प्रकरण कालपट से बाहर पुराने पड़ जाते हैं। जोखिम अंक "यह कितना गलत है?" का उत्तर देता है। "अब भी बचाने योग्य क्या शेष है?" का उत्तर वह नहीं देता।',
  'Queue ordering is advisory — case allocation remains an officer decision':
    'पंक्ति का क्रम सलाहकारी है — प्रकरण आवंटन अधिकारी का ही निर्णय रहता है',
  'Cases A Score-Ranked Queue Leaves Behind': 'अंक-क्रम पंक्ति जिन प्रकरणों को पीछे छोड़ देती है',
  'Largest positions gained when the queue is re-ordered by value at risk':
    'जोखिमग्रस्त राशि के अनुसार पंक्ति पुनः क्रमबद्ध करने पर सर्वाधिक स्थान पाने वाले प्रकरण',
  old: 'पुराना',
  risk: 'जोखिम',
  'Decays/wk': 'क्षय/सप्ताह',
  'Case Queue': 'प्रकरण पंक्ति',
  'Respects the header filters — {0} of {1} cases':
    'शीर्ष फ़िल्टर का पालन करती है — {1} में से {0} प्रकरण',
  'All {0} flagged cases in the recovery window': 'वसूली कालपट के सभी {0} चिह्नित प्रकरण',
  'By value at risk': 'जोखिमग्रस्त राशि के अनुसार',
  'By risk score': 'जोखिम अंक के अनुसार',
  'Search the recovery queue...': 'वसूली पंक्ति में खोजें...',

  /* == Revenue at Risk & Recovery — propagation and registration ========= */
  'Why The Curve Falls — Chain Propagation': 'वक्र क्यों गिरता है — शृंखला में प्रसार',
  'Exposure is never one taxpayer. Credit moves downstream and is utilised hop by hop; once utilised it can no longer be blocked, only recovered.':
    'जोखिम राशि कभी एक करदाता तक सीमित नहीं होती। श्रेय आगे बढ़ता है और चरण-दर-चरण उपयोग होता जाता है; एक बार उपयोग हो जाने पर उसे रोका नहीं जा सकता, केवल वसूला जा सकता है।',
  'Total chain flow': 'कुल शृंखला प्रवाह',
  'Already utilised': 'पहले ही उपयोग किया गया',
  '{0} entities · {1}d old · {2} hop(s) reached': '{0} इकाइयाँ · {1} दि. पुराना · {2} चरण तक पहुँचा',
  utilised: 'उपयोग किया गया',
  'The Left Edge — Registration Screening': 'बायाँ छोर — पंजीयन छानबीन',
  'The cheapest point on the curve. These indicators are checkable on the day of application rather than reconstructed from invoice flow a year later.':
    'वक्र पर सबसे सस्ता बिंदु। ये संकेतक वर्ष भर बाद बीजक प्रवाह से पुनः जोड़ने के बजाय आवेदन के दिन ही जाँचे जा सकते हैं।',
  'New registrations': 'नए पंजीयन',
  '2+ indicators': '2+ संकेतक',
  'Exposure at stake': 'दाँव पर जोखिम राशि',
  'Highest-indicator registrations': 'सर्वाधिक संकेतक वाले पंजीयन',
  '{0} indicators': '{0} संकेतक',
  'Why The Lag Exists': 'विलंब क्यों है',
  'Each of these is structural — a property of how the return cycle and the case workflow are built, not a failure of effort or of detection.':
    'इनमें से प्रत्येक संरचनागत है — विवरणी चक्र और प्रकरण कार्यप्रवाह किस प्रकार बने हैं इसका गुण, श्रम अथवा पहचान की विफलता नहीं।',
  Consequence: 'परिणाम',
  'What changes it': 'इसे क्या बदलेगा',
  Proposed: 'प्रस्तावित',
  Recovered: 'वसूल',
  'Per officer-day': 'प्रति अधिकारी-दिवस',
  'Loss avoided': 'टाली गई हानि',
  'Forfeited to lag': 'विलंब में गँवाया',

  /* == Unknown Risk Discovery ============================================ */
  'Fraud & Risk · Discovery': 'कपट एवं जोखिम · अन्वेषण',
  'The nine encoded risk rules find what the department already knows to look for. This screen looks only at the taxpayers none of those rules touch, and asks whether any of them are statistically unlike their own sector peers — searching for patterns not yet in the rulebook rather than re-scoring the ones that are.':
    'संकेतबद्ध नौ जोखिम नियम वही खोजते हैं जिसे खोजना विभाग पहले से जानता है। यह पर्दा केवल उन करदाताओं को देखता है जिन्हें इनमें से कोई नियम छूता ही नहीं, और पूछता है कि क्या उनमें से कोई सांख्यिकीय रूप से अपने ही क्षेत्र के समकक्षों से भिन्न है — नियमपुस्तिका में पहले से मौजूद प्रतिरूपों को पुनः अंकित करने के बजाय उनमें अब तक अनुपस्थित प्रतिरूप खोजता है।',
  'Population screened': 'छानी गई संख्या',
  'of {0} — trigger no encoded rule': '{0} में से — कोई संकेतबद्ध नियम लागू नहीं होता',
  'Review candidates found': 'पाए गए समीक्षा उम्मीदवार',
  'review candidates': 'समीक्षा उम्मीदवार',
  '{0}% of those screened': 'छाने गए में से {0}%',
  'Recurring patterns': 'पुनरावृत्त प्रतिरूप',
  'candidate rules not yet encoded': 'अब तक संकेतबद्ध न किए गए संभावित नियम',
  'Exposure carried': 'वहन की गई जोखिम राशि',
  '₹ Cr across candidates': '₹ करोड़ — सभी उम्मीदवारों में',
  Method: 'पद्धति',
  'Peer coverage': 'समकक्ष व्याप्ति',
  'Norms computed for {0} sectors at a minimum peer group of {1}.':
    'न्यूनतम {1} समकक्षों के समूह पर {0} क्षेत्रों हेतु प्रमाणक परिकलित।',
  '{0} are too small to norm, so taxpayers in them are unassessed rather than cleared: {1}.':
    '{0} इतने छोटे हैं कि उनका प्रमाणक नहीं निकाला जा सकता, इसलिए उनके करदाता निर्दोष घोषित नहीं, अनिर्धारित हैं: {1}।',
  'What this cannot do': 'यह क्या नहीं कर सकता',
  'No review candidates on this dataset — and that is a measured result, not an empty screen.':
    'इस आँकड़ा-समुच्चय पर कोई समीक्षा उम्मीदवार नहीं — और यह मापा गया परिणाम है, रिक्त पर्दा नहीं।',
  'Why — the rulebook has already claimed the extreme tail':
    'क्यों — नियमपुस्तिका चरम सिरा पहले ही ले चुकी है',
  'Behavioural ratio': 'व्यवहार अनुपात',
  'Already an encoded rule?': 'क्या पहले से संकेतबद्ध नियम है?',
  'Highest deviation — unflagged': 'सर्वाधिक विचलन — अचिह्नित',
  'Highest deviation — already flagged': 'सर्वाधिक विचलन — पहले से चिह्नित',
  'The outlier threshold is {0}. No unflagged taxpayer reaches it on any ratio, while flagged taxpayers pass it comfortably. Three of these four ratios are themselves the basis of an encoded rule, so any taxpayer extreme enough to appear here has already tripped that rule and left the screened population by definition.':
    'बहिर्बिंदु की देहली {0} है। कोई भी अचिह्नित करदाता किसी अनुपात पर उस तक नहीं पहुँचता, जबकि चिह्नित करदाता उसे सहज ही पार कर जाते हैं। इन चार अनुपातों में से तीन स्वयं किसी संकेतबद्ध नियम का आधार हैं, इसलिए यहाँ दिखने योग्य चरम कोई भी करदाता वह नियम पहले ही लागू कर चुका होता है और परिभाषा से ही छानी गई संख्या से बाहर हो जाता है।',
  'What would make this screen productive': 'यह पर्दा फलदायी किससे होगा',
  'The method is implemented and calibrated. What it lacks is a feature the rulebook does not already encode.':
    'पद्धति लागू एवं अंशांकित है। उसमें जिसकी कमी है वह ऐसा लक्षण है जिसे नियमपुस्तिका पहले से संकेतबद्ध न करती हो।',
  'The honest position': 'प्रामाणिक स्थिति',
  'Lowering the threshold until results appeared would have produced a populated screen out of ordinary variation — which is the precise failure this module warns about elsewhere. The threshold has been left where the statistics put it.':
    'परिणाम दिखने तक देहली नीचे लाने से सामान्य उतार-चढ़ाव से ही भरा हुआ पर्दा बन जाता — यही वह चूक है जिसके विरुद्ध यह मॉड्यूल अन्यत्र चेतावनी देता है। देहली वहीं छोड़ी गई है जहाँ सांख्यिकी ने उसे रखा।',
  'Recurring patterns — candidate rules': 'पुनरावृत्त प्रतिरूप — संभावित नियम',
  'The same deviation signature across several unflagged taxpayers. This, rather than any individual case, is the discovery worth acting on.':
    'अनेक अचिह्नित करदाताओं पर वही विचलन चिह्न। किसी एकल प्रकरण के बजाय यही वह खोज है जिस पर कार्रवाई योग्य है।',
  '{0} taxpayers': '{0} करदाता',
  'No signature recurs across enough taxpayers to be worth encoding as a rule.':
    'नियम के रूप में संकेतबद्ध करने योग्य पर्याप्त करदाताओं पर कोई चिह्न पुनरावृत्त नहीं होता।',
  'Individual review candidates': 'एकल समीक्षा उम्मीदवार',
  '{0} taxpayers, each invisible to all nine encoded rules. {1} carry a signature seen only once, which is an anecdote rather than a pattern.':
    '{0} करदाता, प्रत्येक नौ संकेतबद्ध नियमों में से किसी को भी दिखाई नहीं देता। {1} पर ऐसा चिह्न है जो केवल एक बार दिखा, जो प्रतिरूप नहीं बल्कि एक अलग-थलग घटना है।',
  'Strongest deviation': 'सर्वाधिक प्रबल विचलन',
  '{0}× the sector median (n={1})': 'क्षेत्रीय मध्यक का {0} गुना (n={1})'
})
