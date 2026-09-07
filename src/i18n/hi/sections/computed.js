import { registerMessages } from '../../locale.js'

/**
 * Hindi — sentences the data layer builds at run time.
 *
 * Every entry here was, until recently, an interpolated template literal in
 * src/data. A computed sentence can never match a catalogue key, so it reached
 * an officer in English on a screen set to Hindi — and it did so invisibly:
 * coverage.mjs saw no t() call to score, prose.mjs saw no constant to look up,
 * and untranslated.mjs saw a value that had passed through t(). Only the
 * browser caught them. scripts/templates.mjs now fails the build on any new one.
 *
 * The {0} arguments are numbers, dates, financial years and section labels —
 * they arrive already formatted and are not re-ordered here, because the data
 * layer passes them positionally.
 */
registerMessages('hi', {
  /* == Command board — condition detail ================================= */
  'Departmental capacity is only {0}% used, but an unused officer-day in one division cannot be spent in another and an audit officer cannot take an investigation case. {1} of them have no eligible officer posted at all.':
    'विभागीय क्षमता का केवल {0}% प्रयोग हुआ है, पर एक संभाग का अप्रयुक्त अधिकारी-दिवस दूसरे संभाग में व्यय नहीं किया जा सकता और लेखापरीक्षा अधिकारी जाँच का प्रकरण नहीं ले सकता। उनमें से {1} प्रकरणों पर कोई पात्र अधिकारी तैनात ही नहीं है।',
  'Value decays continuously while a case sits unworked. This is the controllable half of the lag — the other {0} Cr is detection latency, which no amount of prioritisation shortens.':
    'प्रकरण पर काम न होते हुए मूल्य का क्षय निरंतर होता रहता है। यह विलंब का नियंत्रण-योग्य आधा भाग है — शेष {0} करोड़ पहचान विलंब है, जिसे कितनी भी प्राथमिकता छोटा नहीं करती।',
  '{0}. If the notifications fall, the extended deadline never existed and any order passed under it was void when made — including demand already collected.':
    '{0}. यदि अधिसूचनाएँ गिरती हैं तो विस्तारित समय-सीमा कभी थी ही नहीं और उसके अधीन पारित कोई भी आदेश पारित होते समय ही शून्य था — पहले से वसूली गई माँग सहित।',
  '{0} audits were closed with rules still live and {1} taxpayers never received a notice despite them. Only {2} carry a confirmed live limitation clock, so this is a review list rather than a recovery figure.':
    'नियम अब भी जीवित रहते हुए {0} लेखापरीक्षाएँ बंद कर दी गईं और उनके बावजूद {1} करदाताओं को कभी नोटिस नहीं मिला। केवल {2} पर पुष्ट जीवित परिसीमा घड़ी है, इसलिए यह वसूली का आँकड़ा नहीं बल्कि पुनर्विलोकन की सूची है।',

  /* == Case digital twin — next action ================================== */
  'Issue {0} before {1}': '{1} से पहले {0} जारी करें',
  '{0} days remain on the {1} clock. After that the demand is extinguished by operation of law.':
    '{1} घड़ी पर {0} दिन शेष हैं। उसके बाद विधि के प्रवर्तन से ही माँग समाप्त हो जाती है।',
  'The {0} deadline of {1} has passed. No demand can now be raised for this period.':
    '{1} की {0} समय-सीमा बीत चुकी है। इस अवधि के लिए अब कोई माँग नहीं उठाई जा सकती।',
  '₹{0} L of recoverable value is forecast to decay if this case is untouched for another seven days.':
    'यह प्रकरण सात दिन और अछूता रहा तो ₹{0} लाख वसूली-योग्य मूल्य के क्षय होने का पूर्वानुमान है।',

  /* == Statutory clock — how the deadline was computed ================== */
  '{0} years from the annual-return due date for {1} ({2}).':
    '{1} की वार्षिक विवरणी देय तिथि ({2}) से {0} वर्ष।',
  'Extended to {0} by notification, in place of the base {1}-year computation.':
    'मूल {1}-वर्षीय गणना के स्थान पर अधिसूचना द्वारा {0} तक विस्तारित।',
  'Notice must issue at least {0} months before the order deadline.':
    'आदेश की समय-सीमा से कम-से-कम {0} माह पूर्व नोटिस जारी होना चाहिए।',
  'Computed from the statute and the annual return due date for {0} under {1}. Date arithmetic, not a model.':
    '{1} के अंतर्गत {0} हेतु संविधि और वार्षिक विवरणी देय तिथि से परिकलित। यह तिथियों का अंकगणित है, प्रारूप नहीं।',

  /* == Priority queue — why a case moved ================================ */
  'Priority {0} — unchanged from its risk-score rank.':
    'प्राथमिकता {0} — उसके जोखिम-अंक क्रमांक जितनी ही, कोई परिवर्तन नहीं।',
  'Moved {0} from risk rank {1} to priority {2} on the combined weighting of exposure, recoverability and effort.':
    'जोखिम राशि, वसूली की संभावना और श्रम के संयुक्त भार पर जोखिम क्रमांक {1} से प्राथमिकता {2} तक {0} खिसका।',
  'Moved {0} from risk rank {1} to priority {2} because {3}.':
    '{3}, इसलिए जोखिम क्रमांक {1} से प्राथमिकता {2} तक {0} खिसका।',

  /* == Retrospective ==================================================== */
  'Identifying Section 73 cases that resemble Section 74 cases requires Section 74 cases to resemble. The register contains {0}. A resemblance model built on a single positive example is not weak — it is undefined, because there is no variation from which to learn what the pattern is.':
    'Section 74 जैसे दिखने वाले Section 73 प्रकरण पहचानने के लिए, जिनसे मिलते-जुलते हों वैसे Section 74 प्रकरणों का होना आवश्यक है। पंजी में {0} हैं। एक ही सकारात्मक उदाहरण पर बना समानता-प्रारूप दुर्बल नहीं होता — वह अपरिभाषित होता है, क्योंकि प्रतिरूप क्या है यह सीखने योग्य कोई विविधता ही नहीं होती।',
  'The case waited {0} days in the queue after the signal appeared.':
    'संकेत दिखने के बाद प्रकरण {0} दिन पंक्ति में प्रतीक्षा करता रहा।',

  /* == AI Copilot — output headings ===================================== */
  'AI Case Summary — {0}': 'AI प्रकरण सारांश — {0}',
  'AI-Generated Audit Checklist — {0}': 'AI-निर्मित लेखापरीक्षा जाँच-सूची — {0}',
  'AI-Drafted {0} — {1}': 'AI-प्रारूपित {0} — {1}',
  'AI-Generated Refund Verification Checklist — {0}':
    'AI-निर्मित प्रतिदाय सत्यापन जाँच-सूची — {0}',
  'AI Litigation Risk Summary — {0}': 'AI वाद जोखिम सारांश — {0}',
  'AI-Generated Taxpayer Outreach — {0}': 'AI-निर्मित करदाता संपर्क — {0}',
  'AI Similar Case Comparison — {0}': 'AI समान प्रकरण तुलना — {0}',
  'AI-Suggested Hearing Questions — {0}': 'AI-सुझाए गए सुनवाई प्रश्न — {0}',
  'Dear Taxpayer ({0}), our records indicate {1} for a recent return period. To avoid interest, late fee or further scrutiny, please review and file/correct your returns at the earliest. This is a system-generated compliance reminder and not a notice or demand.':
    'आदरणीय करदाता ({0}), हमारे अभिलेखों के अनुसार हाल की विवरणी अवधि हेतु {1} पाया गया है। ब्याज, विलंब शुल्क अथवा आगे की छानबीन से बचने के लिए कृपया अपनी विवरणियाँ शीघ्रातिशीघ्र देखें और दाखिल अथवा संशोधित करें। यह प्रणाली द्वारा उत्पन्न अनुपालन अनुस्मारक है — नोटिस अथवा माँग नहीं।',

  /* Command board — value label. */
  unrecoverable: 'वसूली-योग्य नहीं',

  /* == Top actions — what protects value this week ====================== */
  'Issue notice before {0}': '{0} से पहले नोटिस जारी करें',
  '{0} days remain under {1}. After that the demand is extinguished by operation of law and the full amount is lost.':
    '{1} के अंतर्गत {0} दिन शेष हैं। उसके बाद विधि के प्रवर्तन से ही माँग समाप्त हो जाती है और पूरी राशि खो जाती है।',
  'This is the value forecast to become unrecoverable if the case is untouched for a further seven days. The rest of the exposure is not at risk this week.':
    'यह प्रकरण सात दिन और अछूता रहा तो वसूली-योग्य न रहने का पूर्वानुमान जिस मूल्य पर है, वह यही है। शेष जोखिम राशि इस सप्ताह ख़तरे में नहीं है।',
  'Act on chain {0}': 'श्रृंखला {0} पर कार्रवाई करें',
  'Credit in this chain remains blockable, and this is the share of it forecast to be utilised over the next seven days. The chain is {0} days old, so the curve here is flatter than it would be on a fresh signal.':
    'इस श्रृंखला का श्रेय अब भी रोका जा सकता है, और अगले सात दिनों में उसका जितना अंश उपयोग हो जाने का पूर्वानुमान है वह यही है। श्रृंखला {0} दिन पुरानी है, इसलिए यहाँ का वक्र किसी ताज़े संकेत की तुलना में अधिक चपटा है।',
  'Schedule before {0}': '{0} से पहले नियत करें',
  '{0} days remain, so nothing is lost by not working it this week — but it must not slip past the window.':
    '{0} दिन शेष हैं, इसलिए इस सप्ताह काम न करने से कुछ नहीं खोता — पर वह कालपट से बाहर नहीं जाना चाहिए।',

  /* == Capacity residual — why a case could not be placed ================ */
  'Neither a deployment nor a volume problem. The case needs more than {0} days and is indivisible, so it can never be placed inside a one-week horizon however many officers are added. Requires a multi-week block or a two-officer team.':
    'यह न तैनाती की समस्या है, न कार्य-मात्रा की। प्रकरण को {0} दिनों से अधिक चाहिए और वह अविभाज्य है, इसलिए कितने भी अधिकारी जोड़ दिए जाएँ, उसे एक सप्ताह के कालपट में रखा ही नहीं जा सकता। इसके लिए कई सप्ताह का खंड अथवा दो-अधिकारी दल चाहिए।',

  /* == Precedent — the standing of the question ========================== */
  'Settled by {0}, which binds authorities in Maharashtra.':
    '{0} द्वारा निर्णीत, और वह महाराष्ट्र के प्राधिकारियों पर बाध्यकारी है।',

  /* == Closed vocabularies — signal-age and refund-intensity bands ======= */
  '0–30 days': '0–30 दिन',
  '31–90 days': '31–90 दिन',
  '91–180 days': '91–180 दिन',
  '181–365 days': '181–365 दिन',
  '1–2× benchmark': 'मानक का 1–2×',
  '2–3× benchmark': 'मानक का 2–3×',
  '3× benchmark and above': 'मानक का 3× और उससे अधिक',

  /* Forecast marker on a month axis. */
  '{0} (F)': '{0} (अनु)',

  /* Provenance line appended to every copied briefing note. */
  '— Simulated export from Maha GST Intelligence (demonstration environment). All figures are generated demonstration data as at {0}; they are not departmental records. Verify against the source system before circulation.':
    '— महा GST इंटेलिजेंस (प्रदर्शन वातावरण) से अनुकरण किया गया निर्यात। सभी आँकड़े {0} की स्थिति के उत्पन्न प्रदर्शन आँकड़े हैं; वे विभागीय अभिलेख नहीं हैं। परिचालन से पहले स्रोत प्रणाली से मिलान कर लें।',

  /* == Recommendations and notes declared beside the data they describe === */
  'Counted whether live or expired: if the notification falls, orders already passed under it were void when made.':
    'जीवित हो या कालातीत — दोनों गिने गए हैं: यदि अधिसूचना गिरती है, तो उसके अधीन पहले से पारित आदेश पारित होते समय ही शून्य थे।',
  'Cross-check the consignment record against the filed return for the same period before scrutiny is opened.':
    'छानबीन खोलने से पहले उसी अवधि की दाखिल विवरणी से खेप अभिलेख का मिलान करें।',
  'Reconcile the claimed credit against GSTR-2B for the trailing six periods before any further set-off is allowed.':
    'आगे कोई भी समायोजन स्वीकृत करने से पहले पिछली छह अवधियों के GSTR-2B से दावा किए गए श्रेय का मिलान करें।',

  /* == Comparability engine — why two cases are or are not alike ========= */
  'Both turn on {0}': 'दोनों {0} पर आधारित हैं',
  'Different questions of law — {0} against {1}':
    'भिन्न विधि-प्रश्न — {0} बनाम {1}',
  'Department position on both recorded as "{0}"':
    'दोनों पर विभाग की स्थिति "{0}" दर्ज है',
  'Department position differs — "{0}" against "{1}"':
    'विभाग की स्थिति भिन्न है — "{0}" बनाम "{1}"',
  'Shared risk rules: {0}': 'साझा जोखिम नियम: {0}',
  'The comparison case also triggered: {0}':
    'तुलना के प्रकरण में ये नियम भी लागू हुए: {0}',
  'Comparable ITC intensity — {0}% against {1}% of turnover':
    'तुलनीय ITC सघनता — कारोबार का {0}% बनाम {1}%',
  'ITC intensity differs materially — {0}% against {1}%':
    'ITC सघनता में महत्वपूर्ण अंतर — {0}% बनाम {1}%',
  'Both in {0} — noted, but sector does not decide outcomes':
    'दोनों {0} में — दर्ज किया गया, पर क्षेत्र परिणाम तय नहीं करता',

  /* == Bands, evidence lines and statutory notes declared as constants == */
  '1 April 2025':
    '1 अप्रैल 2025',
  '10 concluded outcomes across 7 questions of law — no question reaches 5.':
    '7 विधि-प्रश्नों पर मिलाकर 10 निपटे परिणाम — कोई भी प्रश्न 5 तक नहीं पहुँचता।',
  '10 concluded proceedings. Enough to retrieve comparables, nowhere near enough to learn from.':
    '10 निपटी कार्यवाहियाँ। तुलनीय प्रकरण निकालने भर पर्याप्त, पर उनसे सीखने के लिए कहीं कम।',
  '3.5 days':
    '3.5 दिन',
  '5.0 days':
    '5.0 दिन',
  '30 days or fewer':
    '30 अथवा उससे कम दिन',
  '31 to 60 days':
    '31 से 60 दिन',
  '61 to 90 days':
    '61 से 90 दिन',
  '365+ days':
    '365+ दिन',
  '90 – 365 days':
    '90 – 365 दिन',
  '42 months from the annual-return due date for the notice; 12 months from the notice for the order (extendable by 6 months on approval).':
    'नोटिस हेतु वार्षिक विवरणी देय तिथि से 42 माह; आदेश हेतु नोटिस से 12 माह (अनुमोदन पर 6 माह विस्तार-योग्य)।',
  '56 candidates, 2 closed with signals live and 54 never actioned.':
    '56 उम्मीदवार, उनमें से 2 संकेत जीवित रहते ही बंद और 54 पर कभी कार्रवाई नहीं हुई।',
  '58% of departmental capacity is used while 51 cases worth Rs 18.78 Cr cannot be reached — the finding aggregate utilisation hides.':
    'विभागीय क्षमता का 58% प्रयुक्त है, फिर भी 18.78 करोड़ रुपये के 51 प्रकरणों तक पहुँचा नहीं जा सकता — समग्र उपयोग जिस निष्कर्ष को छिपाता है, वह यही है।',
  '8 proceedings past their deadline at Rs 10.84 Cr; the verdict now propagates into the audit queue, where 7 open cases sat on dead periods.':
    '10.84 करोड़ रुपये की 8 कार्यवाहियाँ अपनी समय-सीमा पार कर चुकी हैं; यह निष्कर्ष अब लेखापरीक्षा पंक्ति तक भी पहुँचता है, जहाँ 7 लंबित प्रकरण मृत अवधियों पर बैठे थे।',
  '73, 74, 74A, or the relevant provision.':
    '73, 74, 74A, अथवा लागू प्रावधान।',

  /* == Case digital twin — timeline entries and the statutory verdict === */
  '{0} registered in {1}':
    '{1} में {0} पंजीकृत',
  '{0} issued':
    '{0} जारी की गई',
  'Status: {0}':
    'स्थिति: {0}',
  '{0} — stage {1}':
    '{0} — चरण {1}',
  '{0} deadline — {1}':
    '{0} समय-सीमा — {1}',
  'The {0} deadline of {1} for {2} under {3} passed {4} days ago. No demand can now be raised for this period.':
    '{2} हेतु {3} के अंतर्गत {1} की {0} समय-सीमा {4} दिन पूर्व बीत चुकी है। इस अवधि के लिए अब कोई माँग नहीं उठाई जा सकती।',
  '{0} days remain to the {1} deadline of {2} for {3} under {4}.':
    '{3} हेतु {4} के अंतर्गत {2} की {1} समय-सीमा में {0} दिन शेष हैं।',

  /* == Comparability engine — whether a rate may be stated at all ======= */
  '{0} of {1} concluded proceedings on the same question of law were confirmed in the department\'s favour.':
    'उसी विधि-प्रश्न पर निपटी {1} कार्यवाहियों में से {0} विभाग के पक्ष में कायम रहीं।',
  '{0} comparable proceedings found, of which {1} turn on the same question of law. Each outcome is shown individually and no rate is stated: a rate may only be computed across cases sharing the question that decides them, and {2} are needed before it means anything. A figure drawn from cases turning on different questions would read as evidence about this case and would not be.':
    '{0} तुलनीय कार्यवाहियाँ मिलीं, जिनमें से {1} उसी विधि-प्रश्न पर आधारित हैं। प्रत्येक परिणाम अलग-अलग दिखाया गया है और कोई दर नहीं बताई गई: दर केवल उन्हीं प्रकरणों पर परिकलित की जा सकती है जिनमें परिणाम तय करने वाला प्रश्न साझा हो, और उसके अर्थपूर्ण होने के लिए {2} प्रकरण चाहिए। भिन्न प्रश्नों पर आधारित प्रकरणों से निकाला गया आँकड़ा इस प्रकरण के बारे में प्रमाण-सा पढ़ा जाएगा, जबकि वह वैसा नहीं है।',

  /* == Column label and published figures carrying an Indian unit ======= */
  'Worst pool demand / supply': 'सर्वाधिक भार वाले समूह की माँग / आपूर्ति',
  '₹22.08 lakh Cr': '₹22.08 लाख करोड़',
  '₹17.4 lakh Cr': '₹17.4 लाख करोड़'
})
