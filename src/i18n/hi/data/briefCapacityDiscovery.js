import { registerMessages } from '../../locale.js'

/**
 * Hindi — the reasoning prose in actionBrief.js, capacity.js and discovery.js.
 *
 * These are the passages that state what the platform will not claim: the
 * outcome dimension left deliberately unstated, the residual reported as three
 * separate problems rather than one number, the negative discovery result kept
 * as a measured finding. Each is translated at full length — the value of these
 * sentences is entirely in their precision.
 *
 *   exposure          → जोखिम राशि
 *   decay curve       → क्षय वक्र
 *   corroborated      → पुष्ट
 *   greedy heuristic  → लोभी अनुमान
 *   integrality       → पूर्णांकता
 *   residual          → अवशेष
 *   median / MAD      → मध्यक / मध्यक निरपेक्ष विचलन
 *   modified z        → संशोधित z
 *   signature         → चिह्न
 *   norm              → प्रमाणक
 */
registerMessages('hi', {
  /* == Action brief — the four confidence dimensions ====================== */
  'Section 73': 'धारा 73',
  'Section 74': 'धारा 74',
  'Section 74A': 'धारा 74क',
  'Not stated': 'नहीं बताया गया',
  'Audit case': 'लेखापरीक्षा प्रकरण',
  Alert: 'सूचना',

  'Is the exposure figure right?': 'क्या जोखिम राशि का आँकड़ा सही है?',
  'Computed from returns and payment records the platform holds, not estimated. The recoverable share applies a published decay curve to the age of the signal.':
    'मंच के पास उपलब्ध विवरणियों और भुगतान अभिलेखों से परिकलित, अनुमानित नहीं। वसूली-योग्य अंश निकालते समय संकेत की आयु पर प्रकाशित क्षय वक्र लगाया जाता है।',
  'It is an assessment of what is owed, not an assessed demand. A hearing may change it.':
    'यह देय राशि का आकलन है, निर्धारित माँग नहीं। सुनवाई में यह बदल सकता है।',

  'Is the limitation position right?': 'क्या परिसीमा की स्थिति सही है?',
  'No limitation record exists for this taxpayer, so no statutory deadline has been computed.':
    'इस करदाता के लिए परिसीमा का कोई अभिलेख नहीं है, इसलिए कोई सांविधिक समय-सीमा परिकलित नहीं की गई।',
  'Absence of a record is not the same as absence of a deadline.':
    'अभिलेख का न होना समय-सीमा के न होने के बराबर नहीं है।',
  'The deadline depends on Notification 09/2023 or 56/2023. High Courts have divided on their validity and the Supreme Court has reserved judgment, so the applicable date is genuinely unsettled.':
    'यह समय-सीमा अधिसूचना 09/2023 अथवा 56/2023 पर निर्भर है। उनकी वैधता पर उच्च न्यायालयों में मतभेद है और उच्चतम न्यायालय ने निर्णय सुरक्षित रखा है, इसलिए लागू होने वाली तिथि वास्तव में अनिर्णीत है।',
  'If the notifications fall, the extended deadline never existed and an order passed under it was void when made.':
    'यदि ये अधिसूचनाएँ गिरती हैं तो बढ़ाई गई समय-सीमा कभी अस्तित्व में थी ही नहीं, और उसके अंतर्गत पारित आदेश बनाते समय ही शून्य था।',
  'Assumes the financial year on record is the correct period for the demand.':
    'यह मानकर चला गया है कि अभिलेख पर दर्ज वित्तीय वर्ष ही माँग हेतु सही अवधि है।',

  'Is the risk signal sound?': 'क्या जोखिम संकेत सुदृढ़ है?',
  'three or more is a pattern rather than a coincidence': 'तीन या अधिक संयोग नहीं, प्रतिरूप है',
  'fewer than three is suggestive rather than corroborated': 'तीन से कम पुष्ट नहीं, केवल संकेतात्मक है',
  'No encoded rule fired for this taxpayer.': 'इस करदाता पर कोई संकेतबद्ध नियम लागू नहीं हुआ।',
  'A rule firing is a reason to look, never a finding. Every one of them has innocent explanations.':
    'नियम का लागू होना देखने का कारण है, निष्कर्ष कभी नहीं। उनमें से प्रत्येक के निर्दोष स्पष्टीकरण हैं।',

  'Will this survive appeal and be recovered?': 'क्या यह अपील में टिककर वसूल होगा?',
  'The department does not yet hold enough concluded proceedings on any question of law to state an outcome rate. No number is offered rather than an unreliable one.':
    'परिणाम की दर बताने योग्य पर्याप्त निपटाई गई कार्यवाहियाँ विभाग के पास विधि के किसी भी प्रश्न पर अभी नहीं हैं। अविश्वसनीय आँकड़ा देने के बजाय कोई आँकड़ा नहीं दिया गया।',
  'This is the dimension a commercial product would fabricate. It is left empty deliberately, and it is the gap the pilot should close by capturing outcomes from case one.':
    'कोई व्यावसायिक उत्पाद यही आयाम गढ़ लेता। इसे जानबूझकर रिक्त छोड़ा गया है, और पहले ही प्रकरण से परिणाम दर्ज करके पायलट को यही कमी पूरी करनी चाहिए।',
  'no comparable precedent': 'कोई तुलनीय पूर्वनिर्णय नहीं',
  'No binding authority bears on this case, and the department has too few concluded proceedings on the question to state a departmental record. The order archive is not connected, so no citable precedent can be retrieved.':
    'इस प्रकरण पर कोई बाध्यकारी प्राधिकार लागू नहीं होता, और विभागीय अभिलेख बताने योग्य पर्याप्त निपटाई गई कार्यवाहियाँ इस प्रश्न पर विभाग के पास नहीं हैं। आदेश संग्रह जुड़ा हुआ नहीं है, इसलिए उद्धरण-योग्य कोई पूर्वनिर्णय प्राप्त नहीं किया जा सकता।',
  'Everything above is assembled from records this platform holds, and each element names the system it came from. Nothing is generated. Where an element cannot be grounded it is shown as unavailable with the reason, rather than filled in — an alert that looks complete but contains one invented element is more dangerous than one that visibly has a gap.':
    'ऊपर का सब कुछ मंच के पास उपलब्ध अभिलेखों से जोड़ा गया है, और प्रत्येक अंश बताता है कि वह किस प्रणाली से आया। कुछ भी निर्मित नहीं है। जिस अंश को अभिलेख का आधार नहीं दिया जा सकता, उसे भर देने के बजाय कारण सहित अनुपलब्ध दिखाया जाता है — पूर्ण दिखने वाली किंतु एक गढ़ा हुआ अंश रखने वाली सूचना, स्पष्ट कमी वाली सूचना से अधिक खतरनाक है।',
  'Confidence is reported against four separate questions rather than as one number, because they have four different answers and they imply different actions. A case that is certain on the arithmetic and unsettled on the law needs a legal view before it needs an officer-day, and a single blended figure would hide exactly that. The outcome dimension is deliberately left unstated: the department does not yet hold enough concluded proceedings to support a figure, and this is the dimension a system under commercial pressure would invent.':
    'विश्वास एक आँकड़े के बजाय चार पृथक प्रश्नों पर अलग-अलग दर्ज किया जाता है, क्योंकि उनके उत्तर चार भिन्न हैं और वे भिन्न कार्रवाइयाँ सुझाते हैं। जो प्रकरण अंकगणित पर निश्चित और विधि पर अनिर्णीत है, उसे अधिकारी-दिवस से पहले विधिक राय चाहिए, और एक मिश्रित आँकड़ा ठीक यही छिपा देता। परिणाम का आयाम जानबूझकर नहीं बताया गया: आँकड़े को सहारा देने योग्य पर्याप्त निपटाई गई कार्यवाहियाँ विभाग के पास अभी नहीं हैं, और व्यावसायिक दबाव में कोई प्रणाली यही आयाम गढ़ लेती।',

  /* == Capacity — policy inputs ========================================== */
  'Working days per officer per week': 'प्रति अधिकारी प्रति सप्ताह कार्य दिवस',
  'Standard working week.': 'मानक कार्य सप्ताह।',
  'Share spent on non-case work': 'प्रकरण से इतर कार्य पर लगने वाला अंश',
  'Hearings, correspondence, returns scrutiny administration and establishment work. Not available for case allocation.':
    'सुनवाइयाँ, पत्राचार, विवरणी संवीक्षा का प्रशासन और स्थापना संबंधी कार्य। प्रकरण आवंटन हेतु उपलब्ध नहीं।',
  'Net case capacity per officer per week': 'प्रति अधिकारी प्रति सप्ताह शुद्ध प्रकरण क्षमता',
  'The figure the allocation actually spends.': 'आवंटन वास्तव में यही आँकड़ा खर्च करता है।',
  'Limitation-critical threshold': 'परिसीमा की दृष्टि से निर्णायक देहली',
  'Inside this window a case is treated as mandatory, not as a high-scoring option.':
    'इस अवधि के भीतर प्रकरण उच्च अंक वाला विकल्प नहीं, अनिवार्य माना जाता है।',
  'Recoverability where no recovery record exists': 'वसूली का अभिलेख न होने पर वसूली-क्षमता',
  'The same base rate used by the priority engine, applied so the two modules cannot disagree about the value of the same case.':
    'वही आधार दर जो प्राथमिकता यंत्र प्रयोग करता है, ताकि एक ही प्रकरण के मूल्य पर दोनों मॉड्यूल असहमत न हो सकें।',
  Investigation: 'अन्वेषण',
  'A case with a counterparty chain to trace. Requires investigation powers; an audit officer cannot take it.':
    'ऐसा प्रकरण जिसमें प्रतिपक्ष शृंखला का पता लगाना है। इसके लिए अन्वेषण की शक्तियाँ आवश्यक; लेखापरीक्षा अधिकारी इसे नहीं ले सकता।',
  'Audit / scrutiny': 'लेखापरीक्षा / संवीक्षा',
  'Desk review and scrutiny of a single registration. Either an audit officer or the division officer may take it.':
    'एक ही पंजीयन की कार्यालयीन समीक्षा एवं संवीक्षा। इसे लेखापरीक्षा अधिकारी अथवा विभाग अधिकारी, कोई भी ले सकता है।',
  'where should the next officer go': 'अगला अधिकारी कहाँ तैनात हो',
  'This is a greedy heuristic on a bipartite assignment problem, not a solved optimum — generalised assignment is NP-hard and no claim of optimality is made. The comparison figure is an upper bound obtained by relaxing both eligibility and integrality, so it is unreachable by construction and the true optimum lies between the achieved value and the bound. Limitation-critical work is assigned before anything else competes for capacity, and is ordered by expiry rather than by value, because inside that window the only defensible ordering is which case dies first.':
    'यह द्विपक्षीय नियतन समस्या पर एक लोभी अनुमान है, हल किया हुआ अनुकूलतम नहीं — सामान्यीकृत नियतन NP-hard है और अनुकूलतम होने का कोई दावा नहीं किया गया। तुलना का आँकड़ा पात्रता और पूर्णांकता, दोनों शिथिल करके प्राप्त ऊपरी सीमा है, इसलिए वह रचना से ही अप्राप्य है और वास्तविक अनुकूलतम प्राप्त मूल्य तथा सीमा के बीच स्थित है। परिसीमा की दृष्टि से निर्णायक कार्य किसी और के क्षमता हेतु प्रतिस्पर्धा करने से पहले ही नियत कर दिया जाता है, और वह मूल्य के बजाय समाप्ति के क्रम में लगाया जाता है, क्योंकि उस अवधि के भीतर कौन-सा प्रकरण पहले मरता है, यही एकमात्र बचाव-योग्य क्रम है।',
  'No eligible officer in the division': 'विभाग में कोई पात्र अधिकारी नहीं',
  'A deployment problem. No scheduling change reaches these cases — there is nobody posted who may lawfully take them. Requires a posting or a jurisdictional reassignment.':
    'यह तैनाती की समस्या है। अनुसूचन का कोई परिवर्तन इन प्रकरणों तक नहीं पहुँचता — इन्हें विधिपूर्वक लेने वाला कोई तैनात ही नहीं है। इसके लिए तैनाती अथवा अधिकारिता का पुनर्निर्धारण आवश्यक है।',
  'Eligible officers fully committed': 'पात्र अधिकारी पूर्णतः व्यस्त',
  'A volume problem. Officers exist and may take the case, but the week is already spent. Responds to additional capacity in that specific pool — the marginal value of one officer-week is computed per pool below.':
    'यह मात्रा की समस्या है। अधिकारी मौजूद हैं और प्रकरण ले सकते हैं, पर सप्ताह पहले ही खर्च हो चुका है। यह उसी विशिष्ट संचय में अतिरिक्त क्षमता पर प्रतिक्रिया देती है — एक अधिकारी-सप्ताह का सीमांत मूल्य नीचे प्रत्येक संचय हेतु परिकलित है।',
  'Case larger than any single officer-week': 'किसी एक अधिकारी-सप्ताह से बड़ा प्रकरण',
  'The residual is the finding, not a failure of the allocation. Cases land here for three distinct reasons that call for three different remedies — a posting, more capacity in one specific pool, or a longer working block — and they are reported separately because conflating them produces the wrong decision. Aggregate utilisation is the figure to distrust: the department can sit well below full utilisation while a single division runs three times oversubscribed, because an unused officer-day in one division cannot be spent in another.':
    'अवशेष ही निष्कर्ष है, आवंटन की विफलता नहीं। प्रकरण यहाँ तीन भिन्न कारणों से आते हैं और उन्हें तीन भिन्न उपाय चाहिए — तैनाती, किसी एक विशिष्ट संचय में अधिक क्षमता, अथवा लंबा कार्य-खंड — और उन्हें अलग-अलग दर्ज किया जाता है क्योंकि उन्हें मिला देने से गलत निर्णय निकलता है। कुल उपयोग का आँकड़ा ही अविश्वसनीय है: एक ओर कोई एक विभाग तिगुना अधिभारित चल सकता है और फिर भी विभाग समग्र रूप से पूर्ण उपयोग से काफी नीचे बैठा रह सकता है, क्योंकि एक विभाग का अप्रयुक्त अधिकारी-दिवस दूसरे विभाग में खर्च नहीं हो सकता।',

  /* == Discovery — features, method and limits =========================== */
  'ITC claimed against turnover': 'कारोबार के सापेक्ष दावाकृत ITC',
  'Claiming materially more input credit per rupee of turnover than sector peers.':
    'क्षेत्र के समकक्षों की तुलना में प्रति रुपया कारोबार पर तात्त्विक रूप से अधिक इनपुट श्रेय का दावा कर रहा है।',
  'Claiming materially less input credit per rupee of turnover than sector peers.':
    'क्षेत्र के समकक्षों की तुलना में प्रति रुपया कारोबार पर तात्त्विक रूप से कम इनपुट श्रेय का दावा कर रहा है।',
  'Tax paid against turnover': 'कारोबार के सापेक्ष भुगतान किया गया कर',
  'Paying materially more tax per rupee of turnover than sector peers.':
    'क्षेत्र के समकक्षों की तुलना में प्रति रुपया कारोबार पर तात्त्विक रूप से अधिक कर दे रहा है।',
  'Paying materially less tax per rupee of turnover than sector peers — credit or exemption is absorbing the liability.':
    'क्षेत्र के समकक्षों की तुलना में प्रति रुपया कारोबार पर तात्त्विक रूप से कम कर दे रहा है — श्रेय अथवा छूट दायित्व को सोख रही है।',
  'E-way bill value against declared turnover': 'घोषित कारोबार के सापेक्ष ई-वे बिल मूल्य',
  'Moving materially more goods than the declared turnover accounts for.':
    'घोषित कारोबार में जितना बैठता है उससे तात्त्विक रूप से अधिक माल का परिवहन कर रहा है।',
  'Declaring turnover materially in excess of the goods movement recorded against it.':
    'उसके विरुद्ध दर्ज माल परिवहन से तात्त्विक रूप से अधिक कारोबार घोषित कर रहा है।',
  'Refund claimed against turnover': 'कारोबार के सापेक्ष दावाकृत प्रतिदाय',
  'Claiming refund at a rate materially above sector peers.':
    'क्षेत्र के समकक्षों से तात्त्विक रूप से अधिक दर पर प्रतिदाय का दावा कर रहा है।',
  ', and ': ', और ',
  'Each behavioural ratio is compared against the median of the taxpayer’s own sector, scaled by the median absolute deviation of that sector. Median and MAD are used rather than mean and standard deviation because the mean and SD are themselves pulled by the outliers being searched for — a handful of extreme entities inflate the spread until they no longer register as extreme, which would make this screen fail precisely on the cases it exists to find. The threshold is a modified z of 3.5, the conventional Iglewicz–Hoaglin cut. Sectors with fewer than 8 taxpayers are not normed at all: a peer median drawn from three businesses is not a norm, and taxpayers in those sectors are unassessed rather than cleared.':
    'प्रत्येक व्यवहार अनुपात की तुलना करदाता के अपने ही क्षेत्र के मध्यक से की जाती है, और उसे उस क्षेत्र के मध्यक निरपेक्ष विचलन से मापा जाता है। औसत और मानक विचलन के बजाय मध्यक और MAD इसलिए प्रयोग होते हैं क्योंकि औसत और मानक विचलन स्वयं उन्हीं बहिर्बिंदुओं से खिंच जाते हैं जिनकी खोज हो रही है — मुट्ठी भर चरम इकाइयाँ प्रसार को इतना फुला देती हैं कि वे स्वयं चरम के रूप में दर्ज ही नहीं होतीं, और इससे यह पर्दा ठीक उन्हीं प्रकरणों पर विफल हो जाता जिनके लिए वह बना है। देहली 3.5 का संशोधित z है, अर्थात परंपरागत इगलेविच–होगलिन सीमा। 8 से कम करदाताओं वाले क्षेत्रों का प्रमाणक निकाला ही नहीं जाता: तीन व्यवसायों से निकाला गया समकक्ष मध्यक प्रमाणक नहीं होता, और उन क्षेत्रों के करदाता निर्दोष घोषित नहीं, अनिर्धारित रहते हैं।',
  'Nothing here is an allegation. A legitimately unusual business is statistically indistinguishable from a suspicious one on ratio evidence alone — a genuine exporter, a firm in a bad quarter, or a business whose sector classification is simply wrong will all appear. These are review candidates, and the department should expect most of them to be explained rather than confirmed. The value is not that each one is a case; it is that a recurring signature across several of them may be a pattern the rulebook does not yet encode, and that is worth an analyst’s week.':
    'यहाँ कुछ भी आरोप नहीं है। केवल अनुपात के साक्ष्य पर वैध कारणों से असामान्य व्यवसाय और संदिग्ध व्यवसाय सांख्यिकीय रूप से अलग नहीं किए जा सकते — एक वास्तविक निर्यातक, खराब तिमाही से गुजरी फर्म, अथवा जिसका क्षेत्र वर्गीकरण ही गलत है ऐसा व्यवसाय, ये सब यहाँ दिखेंगे। ये समीक्षा उम्मीदवार हैं, और विभाग को अपेक्षा रखनी चाहिए कि इनमें से अधिकांश की पुष्टि नहीं, व्याख्या होगी। मूल्य यह नहीं कि इनमें से प्रत्येक एक प्रकरण है; मूल्य यह है कि इनमें से कई पर पुनरावृत्त होने वाला चिह्न ऐसा प्रतिरूप हो सकता है जिसे नियमपुस्तिका अब तक संकेतबद्ध नहीं करती, और उसके लिए विश्लेषक का एक सप्ताह देना उचित है।',
  'Detects deviation, not intent. No conclusion about evasion can be drawn from these features.':
    'यह विचलन पहचानता है, आशय नहीं। इन लक्षणों से अपवंचन के बारे में कोई निष्कर्ष नहीं निकाला जा सकता।',
  'Only sees what the returns contain. A taxpayer suppressing turnover consistently across every field looks perfectly ordinary here.':
    'इसे केवल वही दिखता है जो विवरणियों में है। हर स्तंभ में लगातार कारोबार छिपाने वाला करदाता यहाँ पूर्णतः सामान्य दिखता है।',
  'Sector is taken from the registration record. A misclassified taxpayer will be measured against the wrong peers and may appear anomalous for that reason alone.':
    'क्षेत्र पंजीयन अभिलेख से लिया जाता है। गलत वर्गीकृत करदाता गलत समकक्षों के सापेक्ष मापा जाएगा और केवल इसी कारण असामान्य दिख सकता है।',
  'Single-period ratios. A business with genuine seasonality will deviate in some periods without anything being wrong.':
    'एक ही अवधि के अनुपात। वास्तविक मौसमी उतार-चढ़ाव वाला व्यवसाय बिना किसी गड़बड़ी के भी कुछ अवधियों में विचलित दिखेगा।',
  'The population is small. On 156 taxpayers a recurring signature of two or three is suggestive, not established, and should be confirmed against a larger extract before any rule is encoded.':
    'संख्या छोटी है। 156 करदाताओं पर दो-तीन बार पुनरावृत्त चिह्न संकेतात्मक है, स्थापित नहीं, और कोई नियम संकेतबद्ध करने से पूर्व उसे बड़े एक्सट्रैक्ट पर पुष्ट करना चाहिए।',
  'no anomalies found': 'कोई असामान्यता नहीं मिली',
  'Every feature this screen measures is already encoded as a rule, so the extreme tail of each one has been removed from the unflagged population before the screen runs. The highest deviation surviving among unflagged taxpayers is below the outlier threshold on all four ratios, while flagged taxpayers reach well past it — which is the rulebook working, not the detector failing.':
    'यह पर्दा जिन लक्षणों को मापता है वे सब पहले से नियम के रूप में संकेतबद्ध हैं, इसलिए पर्दा चलने से पूर्व ही प्रत्येक का चरम सिरा अचिह्नित संख्या से निकल चुका होता है। अचिह्नित करदाताओं में बचा सर्वोच्च विचलन चारों अनुपातों पर बहिर्बिंदु देहली से नीचे है, जबकि चिह्नित करदाता उससे कहीं आगे पहुँचते हैं — यह नियमपुस्तिका के काम करने का लक्षण है, पहचान-तंत्र के विफल होने का नहीं।',
  'Compare the two columns below. On every ratio the flagged population reaches a materially higher deviation than any unflagged taxpayer attains.':
    'नीचे दिए दोनों स्तंभों की तुलना करें। प्रत्येक अनुपात पर चिह्नित संख्या किसी भी अचिह्नित करदाता से तात्त्विक रूप से अधिक विचलन तक पहुँचती है।',
  'Registration-identity linkage — shared premises, telephone, email, bank account or authorised signatory across registrations. The rulebook detects circular TRADING from invoice flow; it does not detect shared IDENTITY, so this is genuinely additive. It cannot be demonstrated on this dataset because contact details here are synthesised per taxpayer rather than shared.':
    'पंजीयन-पहचान संबंध — अनेक पंजीयनों में साझा परिसर, दूरभाष, ईमेल, बैंक खाता अथवा प्राधिकृत हस्ताक्षरकर्ता। नियमपुस्तिका बीजक प्रवाह से वर्तुलाकार व्यापार पहचानती है; वह साझा पहचान नहीं पहचानती, इसलिए यह वास्तव में अतिरिक्त है। इस आँकड़ा-समुच्चय पर इसे दिखाया नहीं जा सकता क्योंकि यहाँ संपर्क विवरण साझा नहीं, प्रत्येक करदाता हेतु अलग-अलग गढ़े गए हैं।',
  'Directorship and PAN linkage across entities, including to previously cancelled registrations.':
    'अनेक इकाइयों में निदेशकत्व एवं PAN का संबंध, जिसमें पूर्व में रद्द हुए पंजीयनों से संबंध भी सम्मिलित है।',
  'Invoice-level rather than period-aggregate returns, which would expose timing and counterparty structure that period totals conceal entirely.':
    'अवधि-योग के बजाय बीजक-स्तर की विवरणियाँ, जिनसे वह समय और प्रतिपक्ष संरचना उजागर होगी जिसे अवधि के योग पूर्णतः छिपा लेते हैं।',
  'Multi-period histories, allowing trajectory and volatility features rather than single-period ratios.':
    'अनेक अवधियों का इतिहास, जिससे एक ही अवधि के अनुपातों के बजाय गति-पथ और अस्थिरता के लक्षण प्रयोग किए जा सकें।',
  'Geospatial and premises data, which would make a shared-address screen possible.':
    'भू-स्थानिक एवं परिसर संबंधी आँकड़े, जिनसे साझा पते की छानबीन संभव होगी।',
  'The method is implemented and correct, and the negative result is evidence that it is calibrated rather than evidence that it works. It should be run against a real extract before any claim is made about what it can find.':
    'पद्धति लागू और सही है, और नकारात्मक परिणाम इस बात का साक्ष्य है कि वह अंशांकित है, इस बात का नहीं कि वह काम करती है। वह क्या खोज सकती है, इस पर कोई दावा करने से पूर्व उसे वास्तविक एक्सट्रैक्ट पर चलाया जाना चाहिए।'
})
