import { registerMessages } from '../../locale.js'

/**
 * Hindi — Executive Command Center and Revenue Protection Command Centre.
 *
 * Terminology follows what the earlier Hindi catalogues settled, so a term does
 * not change meaning between screens:
 *
 *   exposure            → जोखिम राशि
 *   assessed exposure   → निर्धारित जोखिम राशि
 *   recoverable         → वसूली-योग्य
 *   limitation          → परिसीमा     time-barred → कालातीत
 *   decay               → क्षय
 *   officer-day/week    → अधिकारी-दिवस / अधिकारी-सप्ताह
 *   capacity            → क्षमता      deployment → तैनाती
 *   residual            → अवशेष       pool → संचय
 *   oversubscribed      → अधिभारित
 *   binding date        → बाध्यकारी तिथि
 *   composite           → संयुक्त अंक
 *   union / dedup       → संघ / दोहरी गणना हटाना
 */
registerMessages('hi', {
  /* == The decision strip ================================================ */
  'What needs a decision today': 'आज किस पर निर्णय आवश्यक है',
  'Ordered by what needs a decision today, not by what is easiest to display. The irreversible position comes first, then whether the department can act on it, then the performance picture that explains how it arose.':
    'क्रम इस आधार पर है कि आज किस पर निर्णय आवश्यक है, न कि किसे दिखाना सबसे आसान है। पहले अपरिवर्तनीय स्थिति, फिर यह कि विभाग उस पर कार्रवाई कर सकता है या नहीं, और अंत में वह निष्पादन-चित्र जो बताता है कि यह स्थिति कैसे बनी।',
  '{0} of {1} active conditions need a decision at Commissioner level. Each figure below is read from the engine that owns the question, carries the base it is measured against, and states the decision it demands.':
    '{1} में से {0} सक्रिय स्थितियों पर आयुक्त स्तर पर निर्णय आवश्यक है। नीचे का प्रत्येक आँकड़ा उस यंत्र से लिया गया है जिसके अधीन वह प्रश्न है, वह किस आधार के सापेक्ष मापा गया यह बताता है, और वह कौन-सा निर्णय माँगता है यह कहता है।',
  '{0} of {1} proceedings on the limitation register. No action available to the department recovers this.':
    'परिसीमा पंजी की {1} में से {0} कार्यवाहियाँ। विभाग को उपलब्ध किसी भी कार्रवाई से यह राशि वसूल नहीं होती।',
  'Close them formally and record why each was missed.':
    'उन्हें औपचारिक रूप से निपटाएँ और दर्ज करें कि प्रत्येक क्यों छूटा।',
  'Expires within 30 days': '30 दिनों में समाप्त',
  '{0} proceedings, of which {1} have no eligible officer available this week.':
    '{0} कार्यवाहियाँ, जिनमें से {1} हेतु इस सप्ताह कोई पात्र अधिकारी उपलब्ध नहीं।',
  'Issue the notice, or second an officer from an adjacent division.':
    'नोटिस जारी करें, अथवा निकटवर्ती विभाग से एक अधिकारी अस्थायी रूप से भेजें।',
  'Still protectable': 'अब भी संरक्षण-योग्य',
  '{0} cases, each counted once however many mechanisms flag it — {1}× overlap removed.':
    '{0} प्रकरण, कितने भी तंत्र चिह्नित करें, प्रत्येक एक ही बार गिना गया — {1}× अतिव्यापन हटाया गया।',
  'Rank the week by what an action protects, not by the size of the case.':
    'सप्ताह का क्रम प्रकरण के आकार से नहीं, बल्कि कार्रवाई क्या बचाती है इससे लगाएँ।',
  'Of ₹{0} Cr still recoverable today. This stops being blockable by next Monday.':
    'आज वसूली-योग्य ₹{0} करोड़ में से। अगले सोमवार तक यह रोकने-योग्य नहीं रह जाएगा।',
  '₹{0} Cr not workable this week · {1} have no eligible officer posted at all.':
    'इस सप्ताह ₹{0} करोड़ निपटाए नहीं जा सकते · {1} हेतु कोई पात्र अधिकारी तैनात ही नहीं।',
  'A posting decision where nobody is eligible; a prioritisation decision for the rest.':
    'जहाँ कोई पात्र नहीं वहाँ यह तैनाती का निर्णय है; शेष के लिए प्राथमिकता का।',
  'No proceeding on record': 'अभिलेख पर कोई कार्यवाही नहीं',
  'Lost if untouched 7 days': '7 दिन अछूता रहने पर खोया',
  'Not in the recovery window': 'वसूली कालपट में नहीं',
  'Statewide — not narrowed by the filter bar': 'राज्यव्यापी — फ़िल्टर पट्टी से सीमित नहीं',

  /* == Can the department act? =========================================== */
  'Can the department act on what it has found?': 'जो मिला है उस पर विभाग कार्रवाई कर सकता है?',
  'A finding nobody can work is not a finding. Establishment, allocation and residual are read from the capacity engine — an unused officer-day in one division cannot be spent in another, so aggregate utilisation is the figure to distrust.':
    'जिस पर कोई काम ही न कर सके, वह निष्कर्ष नहीं है। स्थापना, आवंटन और अवशेष क्षमता यंत्र से लिए गए हैं — एक विभाग का अप्रयुक्त अधिकारी-दिवस दूसरे विभाग में खर्च नहीं हो सकता, इसलिए कुल उपयोग का आँकड़ा ही अविश्वसनीय है।',
  'Open capacity & deployment': 'क्षमता एवं तैनाती खोलें',
  '{0} net officer-days this week after overhead': 'अतिरिक्त कार्य घटाकर इस सप्ताह {0} शुद्ध अधिकारी-दिवस',
  'Week committed': 'सप्ताह प्रतिबद्ध',
  '{0} of {1} days placed on {2} cases': '{1} में से {0} दिन {2} प्रकरणों पर नियत',
  'Not workable this week': 'इस सप्ताह निपटाने योग्य नहीं',
  '{0} cases · {1} of them inside the 30-day statutory window':
    '{0} प्रकरण · उनमें से {1} 30 दिन की सांविधिक अवधि के भीतर',
  'Share of the achievable captured': 'प्राप्य में से प्राप्त अंश',
  'Not computable': 'परिकलित नहीं किया जा सकता',
  'Against an upper bound that relaxes both eligibility and indivisibility, so it is unreachable by construction.':
    'ऐसी ऊपरी सीमा के सापेक्ष जो पात्रता और अविभाज्यता दोनों शिथिल करती है, इसलिए वह रचना से ही अप्राप्य है।',
  'The relaxed upper bound is zero on this week’s demand, so no share can be stated.':
    'इस सप्ताह की माँग पर शिथिल ऊपरी सीमा शून्य है, इसलिए कोई अंश नहीं बताया जा सकता।',
  'Of the {0} cases nobody can work: {1} have no eligible officer posted in that division at all, which is a posting decision; {2} have eligible officers whose week is already spent, which is a volume decision; and {3} need more than one officer-week and cannot be placed inside a seven-day horizon however many officers are added.':
    'जिन {0} प्रकरणों पर कोई काम नहीं कर सकता उनमें से: {1} हेतु उस विभाग में कोई पात्र अधिकारी तैनात ही नहीं — यह तैनाती का निर्णय है; {2} हेतु पात्र अधिकारी हैं पर उनका सप्ताह पहले ही खर्च हो चुका है — यह मात्रा का निर्णय है; और {3} को एक अधिकारी-सप्ताह से अधिक चाहिए, इसलिए कितने भी अधिकारी जोड़े जाएँ, वे सात दिन की सीमा में नहीं रखे जा सकते।',
  'Every case in this week’s demand was placed with an eligible officer.':
    'इस सप्ताह की माँग का प्रत्येक प्रकरण किसी पात्र अधिकारी को नियत किया गया।',
  '{0} division-and-case-type pools are oversubscribed this week. Which one the next officer-week should go to, and what it would protect, is answered on the Revenue Protection Command Centre.':
    'इस सप्ताह {0} विभाग-एवं-प्रकरणप्रकार संचय अधिभारित हैं। अगला अधिकारी-सप्ताह किसे मिले और उससे क्या बचेगा, इसका उत्तर राजस्व संरक्षण नियंत्रण केंद्र पर है।',
  'No division-and-case-type pool is oversubscribed this week.':
    'इस सप्ताह कोई विभाग-एवं-प्रकरणप्रकार संचय अधिभारित नहीं है।',
  'Open revenue protection': 'राजस्व संरक्षण खोलें',

  /* == Revenue and finance =============================================== */
  'vs {0}': '{0} के सापेक्ष',
  'Latest month across {0} districts in scope. No per-district monthly series exists, so the year-on-year comparator is not shown rather than borrowed from the statewide figure.':
    'दायरे के {0} जिलों का नवीनतम माह। जिलावार मासिक शृंखला मौजूद नहीं है, इसलिए राज्यव्यापी आँकड़े से उधार लेने के बजाय वार्षिक तुलनात्मक आँकड़ा दिखाया ही नहीं गया।',
  '{0} months to {1}, against a {2} target.': '{1} तक के {0} माह, {2} लक्ष्य के सापेक्ष।',
  '{0}% of ₹{1} Cr assessed exposure in scope, held by {2} entities.':
    'दायरे की ₹{1} करोड़ निर्धारित जोखिम राशि का {0}%, {2} इकाइयों के पास।',
  '{0}% of the {1} taxpayers in scope carry an ITC spike or a circular-trading signal.':
    'दायरे के {1} करदाताओं में से {0}% पर ITC उछाल अथवा वर्तुलाकार व्यापार का संकेत है।',
  'Of {0} claims in scope, together claiming ₹{1} Cr.':
    'दायरे के {0} दावों में से, जिनका संयुक्त दावा ₹{1} करोड़ है।',
  'Covers {0}% of the high-risk exposure alongside it.':
    'साथ की उच्च जोखिम राशि का {0}% पूरा करता है।',
  'No high-risk exposure in scope to measure this against.':
    'इसकी तुलना हेतु दायरे में कोई उच्च जोखिम राशि नहीं।',
  'Of {0} raised in scope, on {1} distinct taxpayers carrying ₹{2} Cr of exposure counted once.':
    'दायरे में उठाई गई {0} में से, {1} पृथक करदाताओं पर, जिनकी एक ही बार गिनी गई जोखिम राशि ₹{2} करोड़ है।',
  'Collection realisation against target, the district book behind it, and exposure locked in non-filing':
    'लक्ष्य के सापेक्ष वसूली प्राप्ति, उसके पीछे का जिला लेखा, और विवरणी न भरने में फँसी जोखिम राशि',
  'Statewide collection is {0}% against the same month a year earlier ({1}).':
    'एक वर्ष पूर्व के इसी माह के सापेक्ष ({1}) राज्यव्यापी वसूली {0}% है।',
  'The series does not yet hold a full year before this month, so no year-on-year comparator is stated.':
    'इस माह से पहले का पूरा वर्ष शृंखला में अभी नहीं है, इसलिए कोई वार्षिक तुलनात्मक आँकड़ा नहीं दिया गया।',
  'Collection gap — latest month': 'वसूली अंतर — नवीनतम माह',
  '{0} of {1} districts in scope are below target ({2}%).':
    'दायरे के {1} में से {0} जिले लक्ष्य से नीचे हैं ({2}%)।',
  'Widest district shortfall': 'सर्वाधिक जिला कमी',
  'No district in scope': 'दायरे में कोई जिला नहीं',
  '{0} — ₹{1} Cr against a ₹{2} Cr target.': '{0} — ₹{2} करोड़ लक्ष्य के सापेक्ष ₹{1} करोड़।',
  'Widen the filter to compare formations.': 'संरचनाओं की तुलना हेतु फ़िल्टर चौड़ा करें।',
  '{0} non-filers of {1} taxpayers in scope.':
    'दायरे के {1} करदाताओं में से {0} विवरणी न भरने वाले।',
  'Booked across {0} districts in scope.': 'दायरे के {0} जिलों में दर्ज।',
  'Across {0} cases in scope.': 'दायरे के {0} प्रकरणों में।',
  '{0}% of the queue.': 'पंक्ति का {0}%।',
  'No cases in scope.': 'दायरे में कोई प्रकरण नहीं।',
  '{0}% still open past six months.': 'छह माह बाद भी {0}% लंबित।',

  /* == Health index and lists =========================================== */
  'Weighted composite across six indicators — the single number leadership tracks period to period, with the component carrying the largest drag named rather than left to be found.':
    'छह संकेतकों का भारित संयुक्त अंक — वह एक आँकड़ा जिसे नेतृत्व अवधि-दर-अवधि देखता है, और सर्वाधिक भार डालने वाला घटक ढूँढ़ने के लिए छोड़ने के बजाय नाम सहित दिया गया।',
  'Largest drag: {0}, scoring {1}. It costs the composite {2} points — more than any other component, because weight and shortfall both count.':
    'सर्वाधिक भार: {0}, अंक {1}। यह संयुक्त अंक को {2} अंक की हानि देता है — किसी भी अन्य घटक से अधिक, क्योंकि भार और कमी दोनों गिने जाते हैं।',
  'The {0} highest-scoring of {1} open alerts, each carrying the action it recommends':
    '{1} खुली सूचनाओं में से सर्वोच्च अंक वाली {0}, प्रत्येक के साथ उसकी अनुशंसित कार्रवाई',
  'Shaded by count of High/Critical-risk taxpayers, with each district’s collection gap beneath — click a district for detail':
    'उच्च/अत्यंत गंभीर जोखिम करदाताओं की संख्या के अनुसार छायांकित, नीचे प्रत्येक जिले का वसूली अंतर — विवरण हेतु जिले पर क्लिक करें',
  'No district matches the current filters.': 'वर्तमान फ़िल्टर से कोई जिला मेल नहीं खाता।',
  'Risk rank is not work order. The statutory clock and the value lost by waiting a week are shown beside the score, because a high score with eighty days on the clock can wait and a lower one expiring on Friday cannot.':
    'जोखिम क्रम कार्य-क्रम नहीं है। अंक के साथ सांविधिक घड़ी और एक सप्ताह प्रतीक्षा से खोया मूल्य दिखाया गया है, क्योंकि घड़ी पर अस्सी दिन रखने वाला उच्च अंक प्रतीक्षा कर सकता है और शुक्रवार को समाप्त होने वाला निम्न अंक नहीं।',
  'Open work order': 'कार्य-क्रम खोलें',

  /* == Revenue Protection Command Centre ================================= */
  '{0}% of the ₹{1} Cr assessed exposure is still recoverable at all — the rest went to detection lag before this week began.':
    '₹{1} करोड़ निर्धारित जोखिम राशि में से {0}% अब भी मूलतः वसूली-योग्य है — शेष इस सप्ताह के आरंभ से पहले ही पहचान-विलंब में चला गया।',
  'The headline follows the filter. The four figures beside it do not: limitation, decay and capacity are computed across the whole establishment, and narrowing them here would mean re-running engines this screen does not own.':
    'मुख्य आँकड़ा फ़िल्टर का पालन करता है। उसके साथ के चार आँकड़े नहीं: परिसीमा, क्षय और क्षमता पूरी स्थापना पर परिकलित होते हैं, और उन्हें यहाँ सीमित करना अर्थात ऐसे यंत्र पुनः चलाना जिनका स्वामी यह पर्दा नहीं है।',
  'When the statutory clock runs out': 'जब सांविधिक घड़ी समाप्त होती है',
  'Counted against the BINDING date — the notice date where no notice has issued, which falls months before the order deadline and is the one most often missed.':
    'बाध्यकारी तिथि के सापेक्ष गिना गया — जहाँ नोटिस जारी नहीं हुआ वहाँ नोटिस की तिथि, जो आदेश की समय-सीमा से कई माह पहले आती है और वही सर्वाधिक बार चूकती है।',
  'Already past the binding date': 'बाध्यकारी तिथि पहले ही बीत चुकी',
  'Binding date within 30 days': 'बाध्यकारी तिथि 30 दिनों में',
  '{0} of {1}': '{1} में से {0}',
  'Extinguished by operation of law. Excluded from the opportunity above, whatever the merits.':
    'विधि के प्रवर्तन से समाप्त। गुण-दोष चाहे जो हों, ऊपर के अवसर से बाहर रखा गया।',
  'A notice has to issue inside this window. Nothing else on this screen outranks it.':
    'इस अवधि के भीतर नोटिस जारी होना ही चाहिए। इस पर्दे पर और कुछ भी इससे ऊपर नहीं है।',
  'Cumulative — contains the 30-day band above. Still schedulable, not yet urgent.':
    'संचयी — ऊपर की 30-दिन पट्टी इसमें सम्मिलित है। अब भी अनुसूचित करने योग्य, तत्काल नहीं।',
  'Cumulative. This is the planning horizon, not the acting one.':
    'संचयी। यह नियोजन की सीमा है, कार्रवाई की नहीं।',
  'These are ASSESSED EXPOSURE against the deadline, not the recoverable value in the headline above. The two answer different questions — what a period is worth if the demand stands, against what is realistically collectable after decay — and adding them together, or comparing them directly, would be wrong. The bands are cumulative, so they do not sum either.':
    'ये समय-सीमा के सापेक्ष निर्धारित जोखिम राशि हैं, ऊपर के मुख्य आँकड़े का वसूली-योग्य मूल्य नहीं। दोनों भिन्न प्रश्नों के उत्तर देते हैं — माँग टिकने पर अवधि का मूल्य क्या, और क्षय के बाद वास्तव में कितना वसूली-योग्य — और उन्हें जोड़ना या सीधे तुलना करना गलत होगा। पट्टियाँ संचयी हैं, इसलिए उनका योग भी नहीं बनता।',
  '{0} cases · {1}% of the union': '{0} प्रकरण · संघ का {1}%',
  'What unblocks the unreachable share': 'अगम्य अंश किससे खुलता है',
  '{0} cases worth {1} cannot be worked this week. They land there for three distinct reasons calling for three different remedies, and conflating them produces the wrong decision.':
    '{1} मूल्य के {0} प्रकरण इस सप्ताह निपटाए नहीं जा सकते। वे वहाँ तीन भिन्न कारणों से पहुँचते हैं और उन्हें तीन भिन्न उपाय चाहिए; उन्हें मिला देने पर गलत निर्णय निकलता है।',
  '{0} of them are inside the 30-day statutory window.':
    'उनमें से {0} 30 दिन की सांविधिक अवधि के भीतर हैं।',
  'If nothing changes the period expires and the demand is extinguished by operation of law. Second an officer from an adjacent division, or accept the loss explicitly — those are the only two outcomes available.':
    'यदि कुछ नहीं बदला तो अवधि समाप्त हो जाएगी और विधि के प्रवर्तन से माँग समाप्त हो जाएगी। निकटवर्ती विभाग से अधिकारी अस्थायी रूप से भेजें, अथवा इस हानि को स्पष्ट रूप से स्वीकार करें — उपलब्ध परिणाम यही दो हैं।',
  'Where the next officer-week protects most': 'अगला अधिकारी-सप्ताह कहाँ सर्वाधिक बचाता है',
  '{0}× oversubscribed · {1} of {2} officer-days demanded':
    '{0}× अधिभारित · {2} में से {1} अधिकारी-दिवसों की माँग',
  '₹{0} L across {1} cases': '{1} प्रकरणों में मिलाकर ₹{0} लाख',
  'The marginal figure is computed from the cases actually left unreachable in that pool, taken best-density-first up to one officer-week — not an average, and not asserted. Capacity is pooled by division and case type because that is the granularity at which an officer-week can actually be moved: aggregate slack is meaningless if it sits in the wrong pool.':
    'सीमांत आँकड़ा उस संचय में वास्तव में अगम्य रह गए प्रकरणों से परिकलित है, सर्वोच्च घनत्व के क्रम में एक अधिकारी-सप्ताह तक — यह औसत नहीं है, और न ही दृढ़ दावा। क्षमता विभाग एवं प्रकरणप्रकार के अनुसार संचित है क्योंकि उसी स्तर पर अधिकारी-सप्ताह वास्तव में स्थानांतरित होता है: गलत संचय में पड़ी कुल ढील निरर्थक है।',
  'Officer-days this list costs': 'यह सूची कितने अधिकारी-दिवस माँगती है',
  '{0}% of the {1} net officer-days the state has this week — but capacity is pooled by division, so a statewide share is a floor on the difficulty, not a plan.':
    'इस सप्ताह राज्य के पास उपलब्ध {1} शुद्ध अधिकारी-दिवसों का {0}% — किंतु क्षमता विभागवार संचित है, इसलिए राज्यव्यापी अंश कठिनाई की न्यूनतम सीमा है, योजना नहीं।',
  'The establishment reports no net officer-days this week, so no share can be stated.':
    'स्थापना इस सप्ताह कोई शुद्ध अधिकारी-दिवस दर्ज नहीं करती, इसलिए कोई अंश नहीं बताया जा सकता।',
  'Protected by taking them': 'उन्हें लेने से बचा',
  'The reachable actions only, and only what they protect within seven days. This is the funnel’s last step, not a separate estimate.':
    'केवल पहुँच-योग्य कार्रवाइयाँ, और केवल वे सात दिनों में जो बचाती हैं। यह छननी का अंतिम चरण है, अलग आकलन नहीं।',
  'Blocked for want of an officer': 'अधिकारी के अभाव में अवरुद्ध',
  'Correctly ranked, and unworkable. This is a deployment decision, not a scheduling one.':
    'क्रम सही, किंतु निपटाने योग्य नहीं। यह तैनाती का निर्णय है, अनुसूचन का नहीं।',
  '{0} of these {1} actions carry no officer-day estimate. The priority engine prices effort only for taxpayers with a triggered rule and non-zero exposure, so the cost of those cases is left unstated rather than filled with an average — the officer-day total above is therefore a lower bound.':
    'इन {1} कार्रवाइयों में से {0} हेतु अधिकारी-दिवस का कोई आकलन नहीं है। प्राथमिकता यंत्र केवल उन्हीं करदाताओं हेतु श्रम का मूल्य आँकता है जिन पर नियम लागू हुआ हो और जिनकी जोखिम राशि शून्य न हो, इसलिए उन प्रकरणों की लागत औसत से भरने के बजाय बताई ही नहीं गई — अतः ऊपर का अधिकारी-दिवस योग एक न्यूनतम सीमा है।',
  '{0} officer-days': '{0} अधिकारी-दिवस',
  'Effort not priced': 'श्रम का मूल्य नहीं आँका गया',
  '{0}% of the {1} case': '{1} प्रकरण का {0}%',
  'case value not stated': 'प्रकरण का मूल्य नहीं बताया गया',

  /* == Shared small units =============================================== */
  '{0}%': '{0}%',
  '₹{0} Cr': '₹{0} करोड़',
  '₹{0} L': '₹{0} लाख',

  /* Constant-declared limitation band labels passed to t(variable). */
  'Within 90 days': '90 दिनों में',
  'Within 180 days': '180 दिनों में',

  /* == Short lines — reasoning behind the disclosure ============================ */
  'Ordered by what needs a decision today, not by what displays easily.':
    'आज किस पर निर्णय चाहिए उसी क्रम में, जो सहज दिखता है उसके अनुसार नहीं।',
  'Official dealer figures, against what this demonstration models.':
    'आधिकारिक व्यापारी आँकड़े, इस प्रदर्शन की प्रारूपित संख्या के सापेक्ष।',
  'Each figure is read from the engine that owns the question.':
    'प्रत्येक आँकड़ा उसी यंत्र से पढ़ा जाता है जिसके पास वह प्रश्न है।',
  'Establishment, allocation and residual are read from the capacity engine.':
    'स्थापना, आवंटन और शेष क्षमता यंत्र से पढ़े जाते हैं।',
  'Weighted composite across six indicators, with the largest drag named.':
    'छह संकेतकों पर भारित संयुक्त अंक, सबसे बड़ा अवरोधक नाम सहित।',
  'Risk rank is not work order — the statutory clock decides.':
    'जोखिम क्रमांक कार्य-क्रम नहीं — सांविधिक घड़ी तय करती है।',

  /* == Revenue protection — short lines ============================ */
  'What is about to be lost, what can still be protected, and what to do.':
    'क्या खोने वाला है, क्या अब भी बचाया जा सकता है, और क्या करना है।',
  'Assessed exposure against the deadline — not the recoverable headline.':
    'समय-सीमा के सापेक्ष निर्धारित जोखिम राशि — ऊपर का वसूली-योग्य आँकड़ा नहीं।',
  'Three reasons, three different remedies — they are not conflated.':
    'तीन कारण, तीन भिन्न उपाय — उनकी मिलावट नहीं की गई।',
  'Computed best-density-first on the cases actually left, not an average.':
    'वास्तव में बचे प्रकरणों पर सर्वाधिक घनत्व के क्रम में परिकलित, औसत नहीं।',
  'Effort is priced only where a rule fired and exposure is non-zero.':
    'श्रम की कीमत वहीं आँकी जाती है जहाँ नियम लागू हुआ हो और जोखिम राशि शून्येतर हो।'
})
