import { registerMessages } from '../../locale.js'

/**
 * Hindi — Officer Capacity & Deployment.
 *
 *   capacity      → क्षमता
 *   deployment    → तैनाती
 *   eligibility   → पात्रता
 *   allocation    → आवंटन
 *   officer-day   → अधिकारी-दिवस
 *   pool          → संचय
 *   residual      → अवशेष
 */
registerMessages('hi', {
  'Leadership · Deployment': 'नेतृत्व · तैनाती',
  'A week of officer capacity allocated against eligibility that is territorially and functionally binding, with limitation-critical work assigned before anything else competes for it. The finding is the residual — what nobody eligible can reach, and which specific constraint is responsible.':
    'एक सप्ताह की अधिकारी क्षमता, क्षेत्रीय एवं कार्यात्मक रूप से बाध्यकारी पात्रता के अनुसार आवंटित, तथा परिसीमा की दृष्टि से निर्णायक कार्य किसी और के प्रतिस्पर्धा करने से पहले नियत। निष्कर्ष अवशेष है — जहाँ कोई पात्र नहीं पहुँच सकता, और कौन-सी विशिष्ट बाधा इसके लिए उत्तरदायी है।',
  'The allocation is a single statewide optimisation under territorial and role eligibility. Narrowing its input would re-run it on a subset and change every figure — a different answer presented as the same one — so it is computed across all divisions and the division breakdown below is where a single division is read.':
    'यह आवंटन क्षेत्रीय एवं पद-आधारित पात्रता के अंतर्गत एक ही राज्यव्यापी अनुकूलन है। इसका निवेश सीमित करने पर यह उपसमुच्चय पर पुनः चलेगा और प्रत्येक आँकड़ा बदल देगा — एक भिन्न उत्तर उसी के रूप में प्रस्तुत होगा — इसलिए यह सभी विभागों पर परिकलित है और नीचे दिया विभागवार विश्लेषण ही एक विभाग पढ़ने का स्थान है।',
  '{0}% of departmental capacity is used, and {1} cases worth {2} still cannot be worked this week.':
    'विभागीय क्षमता का {0}% उपयोग होता है, फिर भी {2} मूल्य के {1} प्रकरण इस सप्ताह नहीं निपटाए जा सकते।',
  'These two facts are not in tension — they are the same fact. An unused officer-day in one division cannot be spent in another, and an audit officer cannot take an investigation case. Aggregate utilisation is the figure to distrust; the pools below are where the decision actually sits.':
    'ये दोनों तथ्य परस्पर विरोधी नहीं — ये एक ही तथ्य हैं। एक विभाग का अप्रयुक्त अधिकारी-दिवस दूसरे विभाग में खर्च नहीं हो सकता, और लेखापरीक्षा अधिकारी अन्वेषण प्रकरण नहीं ले सकता। कुल उपयोग का आँकड़ा ही अविश्वसनीय है; निर्णय वास्तव में नीचे दिए संचयों में है।',
  '{0} of them are inside the statutory window and will be time-barred if not reached.':
    'इनमें से {0} सांविधिक अवधि के भीतर हैं और उन तक न पहुँचने पर वे कालातीत हो जाएँगे।',
  'Field officers': 'क्षेत्रीय अधिकारी',
  '{0} case-days available': '{0} प्रकरण-दिवस उपलब्ध',
  'Cases placed': 'नियत प्रकरण',
  'of {0} workable': '{0} निपटाने-योग्य में से',
  'Capacity spent': 'प्रयुक्त क्षमता',
  'of {0} days': '{0} दिनों में से',
  'Recoverable value placed': 'नियत वसूली-योग्य मूल्य',
  '₹ Cr this week': '₹ करोड़ इस सप्ताह',
  'How good is this allocation?': 'यह आवंटन कितना अच्छा है?',
  'Generalised assignment is NP-hard. This is a greedy heuristic, and rather than assert optimality it is measured against a bound that is unreachable by construction.':
    'सामान्यीकृत नियतन NP-hard है। यह एक लोभी अनुमान है, और अनुकूलतम होने का दावा करने के बजाय इसे ऐसी सीमा से मापा जाता है जो रचना से ही अप्राप्य है।',
  'Achieved — this allocation': 'प्राप्त — यह आवंटन',
  'Real. Every case respects division, role and effort.': 'वास्तविक। प्रत्येक प्रकरण विभाग, पद और श्रम का पालन करता है।',
  'Relaxed upper bound': 'शिथिल ऊपरी सीमा',
  'Unreachable. Ignores eligibility and allows cases to be split.':
    'अप्राप्य। पात्रता की उपेक्षा करती है और प्रकरणों के विभाजन की अनुमति देती है।',
  'Share of the bound captured': 'सीमा का प्राप्त अंश',
  'The true optimum lies between the two figures.': 'वास्तविक अनुकूलतम इन दोनों आँकड़ों के बीच है।',
  'Allocation for the coming week': 'आगामी सप्ताह का आवंटन',
  'Limitation-critical cases were placed first and ordered by expiry date, not by value. Everything else competed for the capacity that survived, ranked by recoverable value per officer-day.':
    'परिसीमा की दृष्टि से निर्णायक प्रकरण पहले नियत किए गए और समाप्ति तिथि के क्रम में लगाए गए, मूल्य के क्रम में नहीं। शेष सभी ने बची हुई क्षमता के लिए प्रतिस्पर्धा की, प्रति अधिकारी-दिवस वसूली-योग्य मूल्य के क्रम में।',
  'Assigned to': 'किसे नियत',
  'Statutory — {0}d': 'सांविधिक — {0} दि.',
  'Value per day': 'प्रति दिवस मूल्य',
  Days: 'दिन',
  Recoverable: 'वसूली-योग्य',
  '{0} cases · {1} of recoverable value at stake': '{0} प्रकरण · {1} वसूली-योग्य मूल्य दाँव पर',
  'What would actually fix this': 'इसे वास्तव में क्या ठीक करेगा',
  '{0} of these are inside the statutory window and cannot be recovered once it closes.':
    'इनमें से {0} सांविधिक अवधि के भीतर हैं और वह समाप्त होने पर वसूल नहीं किए जा सकते।',
  'Days needed': 'आवश्यक दिन',
  'Days to deadline': 'समय-सीमा तक दिन',
  'Excluded before allocation — already time-barred': 'आवंटन से पूर्व बाहर — पहले से कालातीत',
  '{0} cases. Not a capacity problem and deliberately not competing for officer days: no demand can lawfully be raised, so an officer-day spent here returns nothing.':
    '{0} प्रकरण। यह क्षमता की समस्या नहीं है और जानबूझकर अधिकारी-दिवसों की प्रतिस्पर्धा में नहीं रखे गए: विधिपूर्वक कोई माँग खड़ी नहीं की जा सकती, इसलिए यहाँ लगाया गया अधिकारी-दिवस कुछ नहीं लौटाता।',
  'Deadline passed': 'समय-सीमा बीती',
  'Days overdue': 'समय-सीमा के बाद के दिन',
  'Exposure forgone': 'खोई हुई जोखिम राशि',
  'Deployment gaps — no eligible officer posted at all': 'तैनाती की रिक्तियाँ — कोई पात्र अधिकारी तैनात ही नहीं',
  '{0} division-and-case-type pools have caseload but nobody who may lawfully take it. Scheduling cannot reach these; only a posting or a jurisdictional reassignment can.':
    '{0} विभाग-एवं-प्रकरणप्रकार संचयों में कार्यभार है पर उसे विधिपूर्वक लेने वाला कोई नहीं। अनुसूचन इन तक नहीं पहुँच सकता; केवल तैनाती या अधिकारिता का पुनर्निर्धारण ही पहुँच सकता है।',
  'Cases unreachable': 'अगम्य प्रकरण',
  'Value at stake': 'दाँव पर लगा मूल्य',
  'Capacity pools, most oversubscribed first': 'क्षमता संचय, सर्वाधिक अधिभारित पहले',
  'Pooled by division and case type, because that is the granularity at which an officer-week can actually be moved. Subscription is demand-days divided by supply-days — above 1.00 the pool cannot clear its caseload however well it is scheduled.':
    'विभाग एवं प्रकरणप्रकार के अनुसार संचय बनाए गए हैं, क्योंकि उसी स्तर पर अधिकारी-सप्ताह वास्तव में स्थानांतरित होता है। अधिभार अर्थात माँग-दिवस बटा आपूर्ति-दिवस — 1.00 से ऊपर संचय कितने भी अच्छे अनुसूचन से अपना कार्यभार समाप्त नहीं कर सकता।',
  'Case type': 'प्रकरण प्रकार',
  Officers: 'अधिकारी',
  'Supply (days)': 'आपूर्ति (दिन)',
  'Demand (days)': 'माँग (दिन)',
  Subscription: 'अधिभार',
  'no officer': 'कोई अधिकारी नहीं',
  Utilisation: 'उपयोग',
  '+1 officer-week unlocks': '+1 अधिकारी-सप्ताह जो खोलता है',
  'Marginal value of the next officer-week': 'अगले अधिकारी-सप्ताह का सीमांत मूल्य',
  'Computed from the specific cases that would become reachable, best value-per-day first — not from a pool average. This is the figure that answers where the next posting should go.':
    'जो विशिष्ट प्रकरण पहुँच में आएँगे उन्हीं से परिकलित, सर्वोच्च प्रति-दिवस मूल्य पहले — संचय के औसत से नहीं। अगली तैनाती कहाँ हो, इस प्रश्न का उत्तर यही आँकड़ा देता है।',
  'Assumptions behind this allocation': 'इस आवंटन के पीछे की मान्यताएँ',
  'Policy inputs, not measurements. Each one changes the answer, so each is stated rather than embedded.':
    'ये नीतिगत निवेश हैं, माप नहीं। प्रत्येक मान्यता उत्तर बदलती है, इसलिए प्रत्येक को छिपाने के बजाय स्पष्ट रूप से बताया गया है।',
  'Eligibility rules': 'पात्रता नियम',
  'The hard constraint. Division is territorial and absolute; role determines the case type an officer may take.':
    'यह कठोर बाधा है। विभाग क्षेत्रीय एवं निरपवाद है; अधिकारी किस प्रकार का प्रकरण ले सकता है यह पद तय करता है।',
  'An officer-week is {0} case-days after non-case work is removed. A case needing more than that is indivisible and cannot be placed inside a one-week horizon at all, however many officers are added.':
    'प्रकरणेतर कार्य हटाने के बाद अधिकारी-सप्ताह अर्थात {0} प्रकरण-दिवस। इससे अधिक चाहने वाला प्रकरण अविभाज्य है और कितने भी अधिकारी जोड़े जाएँ, एक सप्ताह की सीमा में उसे रखा ही नहीं जा सकता।'
})
