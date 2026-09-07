import { registerMessages } from '../../locale.js'

/**
 * Hindi — Case Priority Engine, Officer Capacity & Deployment,
 * Audit & Scrutiny, and the Officer AI Copilot.
 *
 *   officer-day          → अधिकारी-दिवस
 *   deployable capacity  → तैनाती-योग्य क्षमता
 *   unspent              → अव्ययित
 *   limitation-critical  → परिसीमा-निर्णायक
 *   time-barred          → कालातीत
 *   recoverable          → वसूली-योग्य
 *   exposure             → जोखिम राशि
 *   decay                → क्षय
 *   idle                 → निष्क्रिय
 *   bottleneck           → अवरोध
 *   risk score           → जोखिम अंक
 *
 * “Case” stays प्रकरण throughout; “ranked” is क्रमांकित, so the queue reads
 * the same on every screen.
 */
registerMessages('hi', {
  /* == Case Priority Engine — the ranking itself ======================== */
  'Six factors, divided by the officer-days a case would take. Risk score answers how wrong something is; this answers what deserves an officer’s week — and whether anyone eligible will actually reach it.':
    'छह घटक, प्रकरण में लगने वाले अधिकारी-दिवसों से विभाजित। जोखिम अंक बताता है कि कुछ कितना गलत है; यह बताता है कि किस प्रकरण को अधिकारी का सप्ताह मिलना चाहिए — और कोई पात्र अधिकारी वहाँ वास्तव में पहुँचेगा भी या नहीं।',
  'The denominator is what makes this different from a sorted spreadsheet: {0} of the {1} cases in view sit at least ten places from their risk rank. That gap is the officer-days and the statutory clock doing their work.':
    'इसे क्रमबद्ध तालिका से अलग करने वाला अंश हर ही है: दृश्य के {1} में से {0} प्रकरण अपने जोखिम क्रमांक से कम-से-कम दस स्थान दूर बैठे हैं। वह अंतर अधिकारी-दिवसों और सांविधिक घड़ी के अपना काम करने का प्रमाण है।',
  'ranked cases': 'क्रमांकित प्रकरण',
  'Reached this week': 'इस सप्ताह पहुँचे',
  'of {0} in view · {1} officer-days': 'दृश्य के {0} में से · {1} अधिकारी-दिवस',
  'Ranked but not reached': 'क्रमांकित, पर अछूते',
  'holding {0} recoverable': '{0} वसूली-योग्य राशि धारण किए',
  'Decays before it is reached': 'पहुँचने से पहले ही क्षय',
  '₹ L lost over seven days': 'सात दिनों में खोए ₹ लाख',
  '{0} that can no longer be demanded': '{0}, जिनकी अब माँग नहीं की जा सकती',
  '{0} of the state’s {1} officer-days this week fall on cases in this view. The “reached this week” column is read from the statewide allocation and is not narrowed by the filter bar. Click any row for the factor breakdown, the statutory position, and why it moved.':
    'इस सप्ताह के राज्य के {1} अधिकारी-दिवसों में से {0} इस दृश्य के प्रकरणों पर पड़ते हैं। “इस सप्ताह पहुँचे” स्तंभ राज्यव्यापी आवंटन से पढ़ा जाता है और फ़िल्टर पट्टी से सीमित नहीं होता। घटकवार विभाजन, सांविधिक स्थिति और प्रकरण के हिलने का कारण देखने हेतु किसी भी पंक्ति पर क्लिक करें।',
  'Sorted by risk score, descending. Risk decides the order; the statutory clock decides whether the order is worth working — sort on it to see which cases the calendar is about to close.':
    'जोखिम अंक के अनुसार अवरोही क्रम में। जोखिम क्रम तय करता है; वह क्रम काम करने योग्य है या नहीं यह सांविधिक घड़ी तय करती है — कैलेंडर कौन-से प्रकरण बंद करने वाला है, यह देखने हेतु उसी पर क्रम लगाएँ।',
  'of {0} exposure': '{0} जोखिम राशि में से',
  '{0} exposure': '{0} जोखिम राशि',
  'Exposure assessed': 'निर्धारित जोखिम राशि',
  'Exposure / recoverable': 'जोखिम राशि / वसूली-योग्य',
  '{0} recoverable': '{0} वसूली-योग्य',
  'cost of waiting': 'प्रतीक्षा की लागत',
  'the denominator': 'हर',
  'Officer-Days Estimated': 'अनुमानित अधिकारी-दिवस',
  'Still Recoverable': 'अब भी वसूली-योग्य',
  'Decays in 7 Days': '7 दिनों में क्षय',
  'cost of leaving this case another week': 'यह प्रकरण एक और सप्ताह छोड़ने की लागत',
  'No recovery record': 'वसूली का कोई अभिलेख नहीं',
  'no recovery record': 'वसूली का कोई अभिलेख नहीं',
  'the decay curve holds no entry for this GSTIN': 'क्षय वक्र में इस GSTIN की कोई प्रविष्टि नहीं',
  'signal age {0} days': 'संकेत की आयु {0} दिन',
  'Not ranked': 'क्रमांकित नहीं',
  'priority #{0} of {1} ranked cases': '{1} क्रमांकित प्रकरणों में प्राथमिकता क्रमांक {0}',
  'no entry in the priority queue': 'प्राथमिकता पंक्ति में कोई प्रविष्टि नहीं',
  'Share of the {0} cases at the head of the queue — the number a week of departmental capacity actually places — against share of all scored cases':
    'पंक्ति के शीर्ष पर स्थित {0} प्रकरणों में अंश — विभागीय क्षमता का एक सप्ताह वास्तव में जितने प्रकरण रख पाता है — बनाम सभी अंकित प्रकरणों में अंश',

  /* == Case Priority Engine — statutory position ======================== */
  'Statutory position': 'सांविधिक स्थिति',
  'No limitation record': 'परिसीमा का कोई अभिलेख नहीं',
  'No limitation record for this taxpayer': 'इस करदाता हेतु परिसीमा का कोई अभिलेख नहीं',
  'No limitation record exists for this taxpayer, so the statutory clock contributed its neutral value to the ranking. Absence of a record is not the same as absence of a deadline.':
    'इस करदाता हेतु परिसीमा का कोई अभिलेख नहीं है, इसलिए सांविधिक घड़ी ने क्रमांकन में अपना तटस्थ मान दिया। अभिलेख का न होना समय-सीमा के न होने के बराबर नहीं है।',
  'Placed as limitation-critical work, before anything discretionary competed for the week.':
    'परिसीमा-निर्णायक कार्य के रूप में रखा गया — सप्ताह हेतु कोई भी विवेकाधीन कार्य प्रतिस्पर्धा में आने से पहले ही।',
  'Placed on recoverable value per officer-day, on the capacity that survived limitation-critical work.':
    'परिसीमा-निर्णायक कार्य के बाद बची क्षमता पर, प्रति अधिकारी-दिवस वसूली-योग्य मूल्य के आधार पर रखा गया।',
  'Excluded — time-barred': 'बाहर रखा — कालातीत',
  'Excluded from the allocation before it ran: the statutory period has expired, so an officer-day spent here cannot produce a demand.':
    'आवंटन चलने से पहले ही उससे बाहर: सांविधिक अवधि समाप्त हो चुकी है, इसलिए यहाँ व्यय किया गया अधिकारी-दिवस कोई माँग उत्पन्न नहीं कर सकता।',
  'Nearest statutory deadline first': 'निकटतम सांविधिक समय-सीमा पहले',
  'Inside 30 days of the deadline': 'समय-सीमा के 30 दिनों के भीतर',
  'open cases · {0} extinguished if the notice is late':
    'लंबित प्रकरण · नोटिस विलंबित हुआ तो {0} समाप्त',
  '{0}d over': '{0} दिन बीते',

  /* == Officer Capacity & Deployment ==================================== */
  'Deployable capacity': 'तैनाती-योग्य क्षमता',
  'case-days · {0} officers at {1} net days': 'प्रकरण-दिवस · {1} निवल दिनों पर {0} अधिकारी',
  'of {0} workable · {1} days spent': 'कार्य-योग्य {0} में से · {1} दिन व्यय',
  'Committed by statute': 'कानून द्वारा प्रतिबद्ध',
  'days · {0}% of the week, {1} cases, before anything else competed':
    'दिन · सप्ताह का {0}%, {1} प्रकरण, अन्य कुछ भी प्रतिस्पर्धा में आने से पहले',
  '₹ Cr · {0} left unreachable': '₹ करोड़ · {0} तक पहुँचा नहीं जा सका',
  'Where the unspent capacity sits': 'अव्ययित क्षमता कहाँ पड़ी है',
  '{0} of {1} officer-days went unspent while {2} cases could not be worked. An unspent day is not a spare day: it either sits in a division with no waiting caseload, or is shorter than the smallest case still waiting in its pool.':
    '{1} में से {0} अधिकारी-दिवस अव्ययित रह गए जबकि {2} प्रकरणों पर काम नहीं हो सका। अव्ययित दिन अतिरिक्त दिन नहीं है: वह या तो ऐसे विभाग में पड़ा है जहाँ प्रतीक्षारत कार्यभार नहीं, या अपने समूह में प्रतीक्षारत सबसे छोटे प्रकरण से भी छोटा है।',
  '{0} of {1} field officers were assigned no case at all. Before that is read as spare capacity, check the division and role: an officer with a free week and no eligible case in their own division cannot be lent to a pool that is oversubscribed.':
    '{1} में से {0} क्षेत्रीय अधिकारियों को एक भी प्रकरण नहीं दिया गया। इसे अतिरिक्त क्षमता पढ़ने से पहले विभाग और भूमिका जाँचें: खाली सप्ताह वाला पर अपने ही विभाग में कोई पात्र प्रकरण न रखने वाला अधिकारी, अधिक भार वाले समूह को उधार नहीं दिया जा सकता।',
  'Days used': 'प्रयुक्त दिन',
  'Days unspent': 'अव्ययित दिन',
  'Days idle': 'निष्क्रिय दिन',
  'Recoverable placed': 'रखी गई वसूली-योग्य राशि',
  'Recoverable per day': 'प्रति दिन वसूली-योग्य',
  'Search officers...': 'अधिकारी खोजें...',
  '{0} of the {1} unreachable cases · {2} of recoverable value at stake · {3} officer-days would be needed to clear them':
    'जिन {1} प्रकरणों तक नहीं पहुँचा जा सका उनमें से {0} · दाँव पर लगा {2} वसूली-योग्य मूल्य · उन्हें निपटाने में {3} अधिकारी-दिवस लगेंगे',
  'Largest free block': 'सबसे बड़ा खाली खंड',
  'No eligible officer is posted, so no block exists to measure':
    'कोई पात्र अधिकारी तैनात नहीं है, इसलिए मापने योग्य कोई खंड ही नहीं',
  'Nothing waiting here fits inside one more officer-week':
    'यहाँ प्रतीक्षारत कुछ भी एक और अधिकारी-सप्ताह में नहीं समाता',
  '{0} cases carrying {1} of exposure, and {2} officer-days of work that was released to live cases. Not a capacity problem and deliberately not competing for officer days: no demand can lawfully be raised, so an officer-day spent here returns nothing.':
    '{1} जोखिम राशि वहन करने वाले {0} प्रकरण, और जीवित प्रकरणों के लिए मुक्त किया गया {2} अधिकारी-दिवसों का कार्य। यह क्षमता की समस्या नहीं है और जानबूझकर अधिकारी-दिवसों की प्रतिस्पर्धा में नहीं है: विधितः कोई माँग उठाई ही नहीं जा सकती, इसलिए यहाँ व्यय किया गया अधिकारी-दिवस कुछ भी नहीं लौटाता।',
  'Officer-days released': 'मुक्त हुए अधिकारी-दिवस',
  '{0} time-critical': '{0} समय-निर्णायक',

  /* == Audit & Scrutiny ================================================= */
  'audit cases': 'लेखापरीक्षा प्रकरण',
  'case records': 'प्रकरण अभिलेख',
  'Open cases': 'लंबित प्रकरण',
  'of {0} in view · {1} closed': 'दृश्य के {0} में से · {1} निपटे',
  'open {0}d': '{0} दिनों से लंबित',
  '₹ Cr of {0} exposure — {1}%': '{0} जोखिम राशि में से ₹ करोड़ — {1}%',
  'No action for {0}+ days': '{0}+ दिनों से कोई कार्रवाई नहीं',
  'of {0} open · median {1} days idle': 'लंबित {0} में से · मध्यक {1} दिन निष्क्रिय',
  '{0} days since the last recorded action': 'अंतिम दर्ज कार्रवाई को {0} दिन',
  'Stage tracking with what each stage is holding. A column is a bottleneck when value and expiring cases accumulate in it — a case count on its own cannot show that.':
    'प्रत्येक चरण क्या धारण किए है, इसके साथ चरणों का अनुसरण। जिस स्तंभ में मूल्य और समाप्त होते प्रकरण जमा होते हैं वही अवरोध है — केवल प्रकरणों की संख्या यह नहीं दिखा सकती।',
  'The recoverable figure covers the {0} of {1} cases in view that carry a record in the recovery engine. The remainder are shown at exposure only — the decay curve is not extrapolated over cases it does not hold.':
    'वसूली-योग्य आँकड़ा दृश्य के {1} में से केवल उन {0} प्रकरणों को समेटता है जिनका वसूली यंत्र में अभिलेख है। शेष केवल जोखिम राशि पर दिखाए गए हैं — क्षय वक्र जिन प्रकरणों को नहीं रखता, उन पर उसे खींचा नहीं गया।',
  'Showing {0} of {1} matching cases — narrow the search to reach the rest.':
    'मेल खाते {1} में से {0} प्रकरण दिखाए जा रहे हैं — शेष तक पहुँचने हेतु खोज सँकरी करें।',
  '{0} matching cases': '{0} मेल खाते प्रकरण',

  /* == Officer AI Copilot =============================================== */
  '{0} of {1} questions can be answered from the record as the platform is connected today; {2} of {3} source systems are live in this environment. The rest are declined, and the refusal names the feed that would answer them.':
    'मंच आज जिस रूप में जुड़ा है उसके अनुसार {1} में से {0} प्रश्नों के उत्तर अभिलेख से दिए जा सकते हैं; इस वातावरण में {3} में से {2} स्रोत प्रणालियाँ जीवित हैं। शेष अस्वीकार किए जाते हैं, और अस्वीकृति उस स्रोत का नाम देती है जो उनका उत्तर दे सकता।',
  '{0} statement(s) citing {1} system(s), of which {2} are live feeds in this environment — the rest are demonstration records.':
    '{1} प्रणालियों का हवाला देते {0} कथन, जिनमें से {2} इस वातावरण में जीवित स्रोत हैं — शेष प्रदर्शन अभिलेख हैं।',
  'This is the integration decision the question turns into: until that feed is connected, no answer here can be grounded, and the platform will keep declining rather than approximating one.':
    'यह प्रश्न जिस एकीकरण निर्णय में बदलता है वह यही है: जब तक वह स्रोत नहीं जुड़ता, यहाँ का कोई उत्तर आधारित नहीं हो सकता, और मंच अनुमान लगाने के बजाय अस्वीकार करता रहेगा।',

  /* == Capacity — short lines ============================ */
  'One week of capacity, against binding territorial and functional eligibility.':
    'एक सप्ताह की क्षमता, बाध्यकारी प्रादेशिक एवं कार्यात्मक पात्रता के सापेक्ष।',
  'Not a contradiction — an unused day in one division cannot move to another.':
    'यह विरोधाभास नहीं — एक संभाग का अप्रयुक्त दिन दूसरे संभाग में नहीं जा सकता।',
  'An unspent day is not a spare day.':
    'अव्ययित दिन अतिरिक्त दिन नहीं है।',
  'Check division and role before reading an idle officer as spare capacity.':
    'निष्क्रिय अधिकारी को अतिरिक्त क्षमता मानने से पहले संभाग और भूमिका जाँचें।',
  'A greedy heuristic, measured against a bound rather than claimed optimal.':
    'लोभी अनुमान-पद्धति, इष्टतम होने का दावा किए बिना सीमा के सापेक्ष मापी गई।',
  'Limitation-critical work was placed first, by expiry date, not by value.':
    'परिसीमा-निर्णायक कार्य पहले रखा गया, समाप्ति तिथि के अनुसार, मूल्य के अनुसार नहीं।',
  'Time-barred: no demand can be raised, so an officer-day here returns nothing.':
    'कालातीत: कोई माँग नहीं उठाई जा सकती, इसलिए यहाँ का अधिकारी-दिवस कुछ नहीं लौटाता।',
  'Scheduling cannot reach these — only a posting or a jurisdictional change.':
    'समय-सारणी से इन तक नहीं पहुँचा जा सकता — केवल तैनाती अथवा अधिकार-क्षेत्र परिवर्तन से।',
  'Pooled at the level an officer-week can actually be moved.':
    'अधिकारी-सप्ताह वास्तव में जिस स्तर पर हिलाया जा सकता है, उसी स्तर पर संचित।',
  'Computed from the cases that would actually become reachable, not an average.':
    'वास्तव में पहुँच में आने वाले प्रकरणों से परिकलित, औसत से नहीं।',
  'A case larger than one officer-week is indivisible and cannot be placed.':
    'एक अधिकारी-सप्ताह से बड़ा प्रकरण अविभाज्य है और उसे रखा नहीं जा सकता।',

  /* == Case priority — short lines ============================ */
  'Six factors, divided by the officer-days a case would take.':
    'छह घटक, प्रकरण में लगने वाले अधिकारी-दिवसों से विभाजित।',
  'Only the statutory clock is not a judgement — it comes from law.':
    'केवल सांविधिक घड़ी कोई राय नहीं — वह विधि से आती है।',
  'The denominator is what separates this from a sorted spreadsheet.':
    'इसे क्रमबद्ध तालिका से अलग करने वाला अंश हर है।',
  'Click any row for the factors, the statutory position, and why it moved.':
    'घटक, सांविधिक स्थिति और प्रकरण क्यों हिला यह देखने हेतु किसी भी पंक्ति पर क्लिक करें।',
  'No record is not the same as no deadline.':
    'अभिलेख का न होना समय-सीमा के न होने के बराबर नहीं।',
  'No sector or district is picked at more than twice its share.':
    'कोई क्षेत्र अथवा ज़िला अपने अंश के दोगुने से अधिक नहीं चुना गया।',
  'Without a control arm, any gain cannot be attributed to the platform.':
    'नियंत्रण समूह के बिना किसी भी लाभ का श्रेय मंच को नहीं दिया जा सकता।',

  /* == Audit and copilot — short lines ============================ */
  'Audit cases ranked by risk, from identification through to recovery.':
    'जोखिम के अनुसार क्रमबद्ध लेखापरीक्षा प्रकरण, पहचान से वसूली तक।',
  'Risk decides the order; the statutory clock decides whether it is worth working.':
    'जोखिम क्रम तय करती है; वह क्रम काम करने योग्य है या नहीं यह सांविधिक घड़ी तय करती है।',
  'A stage is a bottleneck when value and expiring cases pile up in it.':
    'जिस चरण में मूल्य और समाप्त होते प्रकरण जमा होते हैं वही चरण अवरोध है।',
  'Answers drawn from the record, not generated. Every statement cites its source.':
    'अभिलेख से निकाले गए उत्तर, गढ़े हुए नहीं। प्रत्येक कथन अपना स्रोत बताता है।',
  'The rest are declined, naming the feed that would answer them.':
    'शेष अस्वीकार किए जाते हैं, और उनका उत्तर दे सकने वाले स्रोत का नाम दिया जाता है।',
  'Until that feed is connected, no answer here can be grounded.':
    'जब तक वह स्रोत नहीं जुड़ता, यहाँ का कोई उत्तर आधारित नहीं हो सकता।',

  /* == Remaining explainers — short lines ============================ */
  'The rest are shown at exposure only — the decay curve is not extrapolated.':
    'शेष केवल जोखिम राशि पर दिखाए गए हैं — क्षय वक्र उन पर खींचा नहीं गया।',
  'A positive gap on few taxpayers is variance, not a finding.':
    'कम करदाताओं पर धनात्मक अंतर उतार-चढ़ाव है, निष्कर्ष नहीं।',
  'The headline follows the filter; the four figures beside it do not.':
    'मुख्य आँकड़ा फ़िल्टर मानता है; उसके बगल के चार आँकड़े नहीं मानते।',
  'Districts with very few records swing to 0% or 100% for reasons that are not risk.':
    'बहुत कम अभिलेख वाले ज़िले जोखिम के अलावा अन्य कारणों से 0% या 100% पर चले जाते हैं।'
})
