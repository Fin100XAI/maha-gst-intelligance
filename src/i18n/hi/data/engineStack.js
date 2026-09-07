import { registerMessages } from '../../locale.js'

/**
 * Hindi — engineStack.js: the fifteen engines, the graph spine hop by hop, the
 * four pilot requirements, and the two closing notes on architecture and
 * generative AI.
 *
 * Every engine entry is a verdict backed by something checkable, and the
 * checkable part is usually a number inside a sentence — "0 of 5 features reach
 * an effect size of 0.5", "3.47 against a 3.5 threshold", "contrast class is 2
 * proceedings". Those figures are the evidence, so each sentence keeps them
 * exactly where the English put them rather than paraphrasing around them.
 *
 *   spine              → रीढ़
 *   hop                → चरण
 *   traversal          → भ्रमण
 *   centrality         → केंद्रीयता
 *   labelled           → अंकित
 *   propagation        → प्रसार
 *   economic substance → आर्थिक सारवत्ता
 *   snapshot           → क्षणचित्र
 *   trajectory         → गति-पथ
 *   artefact           → कृत्रिम परिणाम
 */
registerMessages('hi', {
  /* == Technique classes ================================================= */
  'is this deteriorating': 'क्या यह बिगड़ रहा है',
  'Rule Engine': 'नियम यंत्र',
  'Deterministic, auditable, defensible in appeal. The default where the law or a policy already states the logic.':
    'निश्चयात्मक, लेखापरीक्षा-योग्य, अपील में बचाव-योग्य। जहाँ विधि अथवा नीति तर्क पहले ही बता देती है, वहाँ यही मूल विकल्प।',
  'Legal Engine': 'विधि यंत्र',
  'Statute and notifications encoded as computation. Not a model — arithmetic on legal rules, which is why it can be relied on.':
    'अधिनियम एवं अधिसूचनाएँ संगणना के रूप में संकेतबद्ध। यह प्रारूप नहीं — विधिक नियमों पर अंकगणित है, इसीलिए उस पर भरोसा किया जा सकता है।',
  'Graph AI': 'आरेख AI',
  'Traversal, cycle detection and centrality over an entity network. Needs edges that exist.':
    'इकाई नेटवर्क पर भ्रमण, चक्र पहचान एवं केंद्रीयता। इसके लिए वास्तव में मौजूद कड़ियाँ चाहिए।',
  'Supervised learning from labelled outcomes. Needs labels, and enough of them to separate.':
    'अंकित परिणामों से पर्यवेक्षित अधिगम। इसके लिए अंक चाहिए, और इतने कि पृथक्करण हो सके।',
  Unsupervised: 'अपर्यवेक्षित',
  'Anomaly and structure discovery without labels. Needs features the rulebook does not already encode.':
    'अंकों के बिना असामान्यता एवं संरचना की खोज। इसके लिए ऐसे लक्षण चाहिए जिन्हें नियमपुस्तिका पहले से संकेतबद्ध न करती हो।',
  Hybrid: 'मिश्रित',
  'Rule or legal core with a model or graph component layered on it.':
    'नियम अथवा विधि आधार, और उस पर प्रारूप या आरेख घटक की परत।',
  'Running in this platform against the current data.': 'वर्तमान आँकड़ों पर इस मंच में कार्यरत।',
  'The part the data supports is built; the rest is named and blocked.':
    'आँकड़े जिस भाग को सहारा देते हैं वह बना है; शेष नाम सहित दर्ज कर अवरुद्ध रखा गया है।',
  'Cannot be built on the data available. The missing input is stated, not the modelling effort.':
    'उपलब्ध आँकड़ों पर यह नहीं बनाया जा सकता। कौन-सा निवेश अनुपलब्ध है यह बताया गया है, प्रारूपण का श्रम नहीं।',

  /* == Graph spine — hop availability ==================================== */
  'Present on every record and the join key throughout.':
    'प्रत्येक अभिलेख पर उपलब्ध, और सर्वत्र जोड़ने की कुंजी यही।',
  'Absent. Without it registrations cannot be grouped to a common holder.':
    'अनुपस्थित। इसके बिना पंजीयनों को एक ही धारक के अंतर्गत समूहबद्ध नहीं किया जा सकता।',
  'Date, status and district present.': 'तिथि, स्थिति एवं जिला उपलब्ध।',
  'Director / Proprietor': 'निदेशक / स्वामी',
  'Absent. This is the single most valuable missing hop — it is how shell networks are actually identified.':
    'अनुपस्थित। अनुपलब्ध चरणों में यही सर्वाधिक मूल्यवान — दिखावटी नेटवर्क वास्तव में इसी मार्ग से पहचाने जाते हैं।',
  'Present, but synthesised per taxpayer here so collisions are not meaningful in this build.':
    'उपलब्ध, किंतु यहाँ प्रत्येक करदाता हेतु अलग-अलग गढ़ा गया, इसलिए इस निर्माण में मेल सार्थक नहीं हैं।',
  'Bank / account signals': 'बैंक / खाता संकेत',
  'Absent, and lawfully constrained. Should be scoped explicitly rather than assumed.':
    'अनुपस्थित, और विधि द्वारा सीमित। इसकी व्याप्ति मान लेने के बजाय स्पष्ट रूप से तय की जानी चाहिए।',
  Invoice: 'बीजक',
  'Absent. Only period aggregates are held.': 'अनुपस्थित। केवल अवधि के समेकित आँकड़े रखे गए हैं।',
  'Claimed amount per period, not per invoice or counterparty.':
    'दावाकृत राशि अवधि के अनुसार, बीजक अथवा प्रतिपक्ष के अनुसार नहीं।',
  'Supplier / Recipient': 'आपूर्तिकर्ता / प्राप्तकर्ता',
  'Cluster edges only, with a value and no invoice identity.':
    'केवल समूह की कड़ियाँ, मूल्य सहित किंतु बीजक की पहचान के बिना।',
  'E-way Bill': 'ई-वे बिल',
  'Present with value, distance, route and a return-match flag.':
    'मूल्य, दूरी, मार्ग एवं विवरणी-मेल चिह्न सहित उपलब्ध।',
  Return: 'विवरणी',
  'Filing status and period aggregates; no line items.':
    'विवरणी स्थिति एवं अवधि के समेकित आँकड़े; पंक्ति-स्तर की प्रविष्टियाँ नहीं।',
  'Type, issue date, due date and status.': 'प्रकार, जारी तिथि, नियत तिथि एवं स्थिति।',
  'Audit and litigation cases with stage and exposure.':
    'चरण एवं जोखिम राशि सहित लेखापरीक्षा एवं मुकदमा प्रकरण।',
  'Absent. No document or transaction artefacts are held against a case.':
    'अनुपस्थित। प्रकरण के विरुद्ध कोई दस्तावेज अथवा लेनदेन संबंधी साक्ष्य नहीं रखा गया।',
  'Outcome stage only — no order text, ground of decision, or evidence relied on.':
    'केवल परिणाम का चरण — आदेश का पाठ, निर्णय का आधार, अथवा जिस साक्ष्य पर भरोसा किया गया, वह नहीं।',
  Appeal: 'अपील',
  'Stage and ageing present.': 'चरण एवं लंबन उपलब्ध।',
  'Modelled from a stated decay curve, not observed.':
    'बताए गए क्षय वक्र से प्रारूपित, अवलोकन से नहीं।',
  Outcome: 'परिणाम',

  /* == The fifteen engines ============================================== */
  'ITC-Network Risk Engine': 'ITC-नेटवर्क जोखिम यंत्र',
  'Where is suspicious ITC originating, propagating and ultimately being consumed across multiple GSTIN layers?':
    'संदिग्ध ITC कहाँ उत्पन्न होता है, कैसे फैलता है और अनेक GSTIN स्तरों में अंततः कहाँ उपयोग होता है?',
  'Cluster edges with a rupee value, supplier and buyer risk scalars, and a hop-utilisation model that estimates how much credit has already been consumed downstream.':
    'रुपये में मूल्य रखने वाली समूह कड़ियाँ, आपूर्तिकर्ता एवं क्रेता के जोखिम अंक, और ऐसा चरण-उपयोग प्रारूप जो आकलन करता है कि आगे के चरणों में कितना श्रेय पहले ही उपयोग हो चुका है।',
  'Invoice-level GSTR-2A/2B flow. Propagation is modelled between clusters, not traced between GSTIN layers, so "which layer consumed it" cannot be answered.':
    'बीजक-स्तर का GSTR-2A/2B प्रवाह। प्रसार का प्रारूप समूहों के बीच बनाया गया है, GSTIN स्तरों के बीच उसका पता नहीं लगाया गया, इसलिए "किस स्तर ने उसे उपयोग किया" का उत्तर नहीं दिया जा सकता।',
  'Chain exposure runs over 3 clusters and 10 entities; edges carry from, to and value only.':
    'शृंखला की जोखिम राशि 3 समूहों एवं 10 इकाइयों में फैली है; कड़ियों पर केवल किससे, किसको और मूल्य ही है।',

  'Circular-Trading Indicator Engine': 'वर्तुलाकार व्यापार संकेतक यंत्र',
  'Are invoices moving through an entity network in circular patterns without economic substance?':
    'क्या बीजक इकाई नेटवर्क में आर्थिक सारवत्ता के बिना वर्तुलाकार प्रतिरूपों में घूम रहे हैं?',
  'Directed cycle detection, run per node to test whether removing it actually stops the circulation — which is how the decoy nodes were found.':
    'दिशिक चक्र पहचान, प्रत्येक इकाई हेतु अलग चलाकर यह परखा जाता है कि उसे हटाने से परिचलन वास्तव में रुकता है या नहीं — इसी मार्ग से भ्रामक इकाइयाँ मिलीं।',
  'Economic substance indicators. Nothing in the data speaks to assets, employees, power consumption or transport capacity, so circularity is detected but substance cannot be tested against it.':
    'आर्थिक सारवत्ता के संकेतक। आँकड़ों में संपत्ति, कर्मचारी, विद्युत खपत अथवा परिवहन क्षमता के बारे में कुछ नहीं है, इसलिए वर्तुलाकारिता पहचानी जाती है पर उसके सापेक्ष सारवत्ता परखी नहीं जा सकती।',
  'Cycle detection is implemented and found 1 node whose removal leaves the chain running.':
    'चक्र पहचान लागू है और उसने ऐसी 1 इकाई पाई जिसे हटाने पर भी शृंखला चलती रहती है।',

  'Registration-Risk Engine': 'पंजीयन जोखिम यंत्र',
  'Which registrations show shell indicators, and which connected registrations inherit that exposure?':
    'कौन-से पंजीयन दिखावटी होने के संकेतक दिखाते हैं, और कौन-से जुड़े पंजीयन वह जोखिम विरासत में लेते हैं?',
  'Day-0 registration indicators as a stated rule set, checkable at registration rather than reconstructed a year later.':
    'पंजीयन के दिन के संकेतक स्पष्ट नियम समुच्चय के रूप में, जो वर्ष भर बाद पुनः जोड़ने के बजाय पंजीयन के समय ही जाँचे जा सकते हैं।',
  'The inheritance half entirely. Without PAN, director or proprietor there is no edge along which exposure can be inherited between registrations.':
    'विरासत वाला पूरा भाग। PAN, निदेशक अथवा स्वामी के बिना ऐसी कोई कड़ी नहीं जिससे पंजीयनों के बीच जोखिम विरासत में जा सके।',
  'Tested: contact details here are synthesised per taxpayer, so apparent shared-email groups are a trade-name artefact rather than a linkage signal.':
    'परखा गया: यहाँ संपर्क विवरण प्रत्येक करदाता हेतु अलग गढ़े गए हैं, इसलिए साझा ईमेल वाले प्रतीत होते समूह संबंध का संकेत नहीं, व्यापारिक नामों से उपजा कृत्रिम परिणाम हैं।',

  'Revenue-Risk Engine': 'राजस्व जोखिम यंत्र',
  'Where is revenue exposed, how much is at risk, and what drives the estimate?':
    'राजस्व कहाँ जोखिम में है, कितना जोखिम में है, और यह आकलन किस पर आधारित है?',
  'Exposure deduplicated across five mechanisms so the same rupee is counted once, a decay curve over 0–365 days, and a limitation cliff applied on top of it.':
    'वही रुपया एक ही बार गिना जाए इसलिए पाँच तंत्रों की जोखिम राशि से दोहरी प्रविष्टि हटाई गई, 0 से 365 दिनों का क्षय वक्र, और उस पर लगाया गया परिसीमा का कगार।',
  'Nothing blocking. The decay curve is a stated assumption rather than an observed rate — see engine 13.':
    'कुछ भी अवरुद्ध नहीं करता। क्षय वक्र अवलोकित दर नहीं, बताई गई मान्यता है — यंत्र 13 देखें।',
  'Rs 43.16 Cr protectable against a naive mechanism sum of Rs 59.61 Cr; the Rs 16.45 Cr gap is the double-count avoided.':
    'तंत्रों के सरल योग ₹59.61 करोड़ के सापेक्ष ₹43.16 करोड़ संरक्षण-योग्य; ₹16.45 करोड़ का अंतर टाली गई दोहरी गणना है।',

  'Compliance Deterioration Engine': 'अनुपालन ह्रास यंत्र',
  'Which currently compliant taxpayers are starting to deteriorate, before a threshold is breached?':
    'देहली पार होने से पूर्व ही, इस समय अनुपालनशील कौन-से करदाताओं की स्थिति बिगड़ने लगी है?',
  'Threshold-based early warning — non-filing, sharp revenue drop, sector deviation. That is the conventional version, which fires after the line is crossed.':
    'देहली-आधारित पूर्वसूचना — विवरणी न भरना, राजस्व में तीव्र गिरावट, क्षेत्रीय विचलन। यह परंपरागत संस्करण है, जो रेखा पार होने के बाद ही लागू होता है।',
  'Multi-period behavioural history. Deterioration is a trajectory, and each taxpayer here is a single snapshot, so there is no slope to measure.':
    'अनेक अवधियों का व्यवहार-इतिहास। ह्रास एक गति-पथ है, और यहाँ प्रत्येक करदाता एक ही क्षणचित्र है, इसलिए मापने योग्य कोई ढलान ही नहीं।',
  'No per-taxpayer time series exists in the data; revenueDropPct is a single scalar, not a series.':
    'आँकड़ों में प्रत्येक करदाता हेतु कालक्रमिक शृंखला नहीं है; revenueDropPct एक ही अंक है, शृंखला नहीं।',

  'Network Anomaly Engine': 'नेटवर्क असामान्यता यंत्र',
  'What unusual relationships exist that the predefined rules are not looking for?':
    'पूर्वनिर्धारित नियम जिन्हें नहीं खोजते, ऐसे कौन-से असामान्य संबंध मौजूद हैं?',
  'Peer-relative anomaly detection over behavioural ratios, using median and MAD so the outliers being hunted do not inflate the spread they are measured against.':
    'व्यवहार अनुपातों पर समकक्षों के सापेक्ष असामान्यता पहचान, जिसमें मध्यक एवं MAD का प्रयोग होता है ताकि जिन बहिर्बिंदुओं की खोज है वे स्वयं उस प्रसार को न फुलाएँ जिसके सापेक्ष उन्हें मापा जाता है।',
  'The graph half. Structural anomaly needs the linkage edges that are absent.':
    'आरेख वाला भाग। संरचनात्मक असामान्यता हेतु जो संबंध-कड़ियाँ चाहिए वे अनुपस्थित हैं।',
  'Runs and returns nothing, provably: three of the nine encoded rules are computed from the same ratios, so no unflagged taxpayer reaches the outlier threshold on any of them.':
    'यह चलता है और प्रमाणित रूप से कुछ नहीं लौटाता: नौ संकेतबद्ध नियमों में से तीन इन्हीं अनुपातों से परिकलित होते हैं, इसलिए कोई भी अचिह्नित करदाता उनमें से किसी पर भी बहिर्बिंदु देहली तक नहीं पहुँचता।',

  'Case-Priority Engine': 'प्रकरण प्राथमिकता यंत्र',
  'Which cases should officers examine first, on evidence, exposure, urgency, recoverability and capacity?':
    'साक्ष्य, जोखिम राशि, तात्कालिकता, वसूली-क्षमता एवं क्षमता के आधार पर अधिकारी कौन-से प्रकरण पहले देखें?',
  'Six-factor ranking by recoverable value per officer-day, with capacity modelled as a constrained assignment under hard territorial and role eligibility.':
    'प्रति अधिकारी-दिवस वसूली-योग्य मूल्य के अनुसार छह कारकों का क्रम, और कठोर क्षेत्रीय एवं पद-आधारित पात्रता के अधीन बाधित नियतन के रूप में क्षमता का प्रारूप।',
  'Nothing blocking.': 'कुछ भी अवरुद्ध नहीं करता।',

  'Investigation Evidence Engine': 'अन्वेषण साक्ष्य यंत्र',
  'What transactions, counterparties, timelines and anomalies support the officer’s hypothesis?':
    'अधिकारी की परिकल्पना को कौन-से लेनदेन, प्रतिपक्ष, कालक्रम एवं असामान्यताएँ सहारा देते हैं?',
  'A seven-element evidence-to-action brief per case: signals with weights, provision engaged, precedent, exposure, decomposed confidence, limitation and next step — each naming the system it came from.':
    'प्रत्येक प्रकरण हेतु सात अंशों की साक्ष्य-से-कार्रवाई टिप्पणी: भार सहित संकेत, लागू उपधारा, पूर्वनिर्णय, जोखिम राशि, घटकों में बँटा विश्वास, परिसीमा एवं अगला कदम — और प्रत्येक अंश बताता है कि वह किस प्रणाली से आया।',
  'Documents and transactions. No artefact is held against a case, so the brief assembles metadata about evidence rather than the evidence.':
    'दस्तावेज एवं लेनदेन। प्रकरण के विरुद्ध कोई साक्ष्य नहीं रखा गया, इसलिए टिप्पणी साक्ष्य नहीं, साक्ष्य के बारे में जानकारी जोड़ती है।',
  'The Evidence hop of the graph spine is absent entirely.':
    'आरेख रीढ़ का साक्ष्य वाला चरण पूर्णतः अनुपस्थित है।',

  'Historical Case Outcome Engine': 'ऐतिहासिक प्रकरण परिणाम यंत्र',
  'What happened to historically similar cases?': 'पूर्व के समान प्रकरणों का क्या हुआ?',
  'Comparability scored on the dimensions that decide outcomes — question of law and evidential position carry 60% of the weight, sector deliberately 5% — with individual outcomes shown and distinguishers beside every match.':
    'परिणाम तय करने वाले आयामों पर तुलनीयता का अंकन — विधि के प्रश्न एवं साक्ष्य-संबंधी स्थिति को 60% भार, क्षेत्र को जानबूझकर 5% — और प्रत्येक मेल के साथ अलग-अलग परिणाम तथा भेद स्थापित करने वाले कारक दिखाए गए।',
  'Five to ten years of history. Ten concluded proceedings support retrieval of comparables; they do not support a rate, and the module refuses to state one where fewer than five share the question of law.':
    'पाँच से दस वर्ष का इतिहास। दस निपटाई गई कार्यवाहियाँ तुलनीय प्रकरण निकालने हेतु पर्याप्त हैं; वे दर देने हेतु पर्याप्त नहीं, और जिस विधिक प्रश्न पर पाँच से कम प्रकरण हों वहाँ मॉड्यूल दर बताने से इनकार करता है।',

  'Missed Revenue Discovery Engine': 'छूटे राजस्व की खोज यंत्र',
  'What revenue exposure was never surfaced or escalated by the existing workflow?':
    'वर्तमान कार्यप्रवाह ने कौन-सी राजस्व जोखिम राशि कभी सामने नहीं लाई अथवा वरिष्ठ स्तर पर नहीं भेजी?',
  'Cases put down while signals were still live — audits closed with rules firing, taxpayers never noticed despite them — each with the signals, what the department did, comparable concluded proceedings, and the checks required before reopening.':
    'संकेत सक्रिय रहते हुए अलग रखे गए प्रकरण — नियम लागू रहते बंद की गई लेखापरीक्षाएँ, उनके बावजूद कभी नोटिस न पाए करदाता — और प्रत्येक के साथ संकेत, विभाग ने क्या किया, तुलनीय निपटाई गई कार्यवाहियाँ, तथा पुनः खोलने से पूर्व आवश्यक जाँचें।',
  'Nothing blocking, but only 4 of 56 carry a confirmed live limitation clock, so the figure is what they represent rather than what is recoverable.':
    'कुछ भी अवरुद्ध नहीं करता, किंतु 56 में से केवल 4 पर पुष्ट रूप से सक्रिय परिसीमा घड़ी है, इसलिए यह आँकड़ा वसूली-योग्य राशि का नहीं, बल्कि वे प्रकरण क्या दर्शाते हैं इसका है।',

  'Fraud / Suppression Review Intelligence': 'कपट / तथ्य-छिपाव समीक्षा इंटेलिजेंस',
  'Which cases resemble historically established suppression, for officer and legal review?':
    'अधिकारी एवं विधिक समीक्षा हेतु, कौन-से प्रकरण पूर्व में स्थापित तथ्य-छिपाव से समानता रखते हैं?',
  'The refusal, measured. And the review-candidate half, which does not depend on the label.':
    'मापकर दिया गया इनकार। और समीक्षा-उम्मीदवार वाला भाग, जो अंक पर निर्भर नहीं है।',
  'A positive class that separates. Section 74 gives one example; substituting "sustained on appeal" gives eight, and those eight are statistically indistinguishable from litigation in general.':
    'पृथक्करण करने वाला सकारात्मक वर्ग। धारा 74 एक ही उदाहरण देती है; उसके स्थान पर "अपील में टिके" लेने पर आठ मिलते हैं, और वे आठ सामान्य मुकदमों से सांख्यिकीय रूप से अलग नहीं किए जा सकते।',
  'Separation test: 0 of 5 features reach an effect size of 0.5. Risk rules firing come out at exactly 0.00 — cases the department won fire the same number of rules as cases in general.':
    'पृथक्करण परीक्षण: 5 में से 0 लक्षण 0.5 का प्रभाव आकार छूते हैं। लागू होते जोखिम नियम ठीक 0.00 पर आते हैं — विभाग के जीते प्रकरणों में उतने ही नियम लागू होते हैं जितने सामान्य प्रकरणों में।',

  'Limitation & Time-Barring Engine': 'परिसीमा एवं कालातीतता यंत्र',
  'What is the case-specific statutory deadline, and what exposure is approaching it?':
    'प्रत्येक प्रकरण की सांविधिक समय-सीमा क्या है, और कौन-सी जोखिम राशि उसके निकट आ रही है?',
  'Sections 73, 74 and 74A computed per case in UTC from the annual return due date, with Notifications 09/2023 and 56/2023 applied and flagged as contested.':
    'वार्षिक विवरणी की नियत तिथि से UTC में प्रत्येक प्रकरण हेतु परिकलित धाराएँ 73, 74 एवं 74क, और उन पर अधिसूचनाएँ 09/2023 तथा 56/2023 लगाकर उन्हें विवादित के रूप में चिह्नित किया गया।',
  'Nothing. This is arithmetic on statute, not a model, which is why it can be relied on in a notice.':
    'कुछ नहीं। यह अधिनियम पर अंकगणित है, प्रारूप नहीं, इसीलिए नोटिस में उस पर भरोसा किया जा सकता है।',

  'Revenue Recovery Probability Engine': 'राजस्व वसूली प्रायिकता यंत्र',
  'What is likely to be recovered, rather than what was demanded?':
    'माँग कितनी की गई इसके बजाय वास्तव में कितनी वसूली की संभावना है?',
  'A continuous decay curve with interpolation between anchors, plus transparent recovery proxies — still filing, non-filer, in appeal — applied as stated adjustments.':
    'आधार-बिंदुओं के बीच अंतर्वेशन सहित सतत क्षय वक्र, और साथ में पारदर्शी वसूली निर्देशक — अब भी विवरणी भरने वाला, न भरने वाला, अपीलाधीन — बताए गए समायोजनों के रूप में लागू।',
  'The curve is asserted, not learned. Turning it into a probability model needs observed recovery against demand across closed cases, which the data does not carry.':
    'वक्र दृढ़तापूर्वक रखा गया है, सीखा हुआ नहीं। उसे प्रायिकता प्रारूप में बदलने के लिए निपटाए गए प्रकरणों में माँग के सापेक्ष अवलोकित वसूली चाहिए, जो आँकड़ों में नहीं है।',
  'Recovery is modelled from stated anchors; the Recovery hop of the graph spine is modelled rather than observed.':
    'वसूली का प्रारूप बताए गए आधार-बिंदुओं से बना है; आरेख रीढ़ का वसूली वाला चरण अवलोकित नहीं, प्रारूपित है।',

  'Case Outcome Prediction Engine': 'प्रकरण परिणाम पूर्वानुमान यंत्र',
  'What is the likely adjudication and recovery outcome, with the evidence behind it?':
    'न्यायनिर्णयन एवं वसूली का संभावित परिणाम क्या है, और उसके पीछे का साक्ष्य क्या है?',
  'The comparables and their real outcomes, shown individually — which is retrieval, not prediction.':
    'तुलनीय प्रकरण और उनके वास्तविक परिणाम, अलग-अलग दिखाए गए — यह जानकारी लाना है, पूर्वानुमान नहीं।',
  'Features that predict. The same separation test that blocks engine 11 blocks this: the features available describe a taxpayer, not why a demand held up.':
    'पूर्वानुमान करने वाले लक्षण। यंत्र 11 को अवरुद्ध करने वाला वही पृथक्करण परीक्षण इसे भी अवरुद्ध करता है: उपलब्ध लक्षण करदाता का वर्णन करते हैं, यह नहीं कि माँग क्यों टिकी।',
  'Contrast class is 2 proceedings. A model trained on wins alone learns what cases look like, not what winning looks like.':
    'विरोधी वर्ग में 2 कार्यवाहियाँ हैं। केवल जीतों पर प्रशिक्षित प्रारूप यह सीखता है कि प्रकरण कैसे दिखते हैं, यह नहीं कि जीत कैसी दिखती है।',

  'Unknown-Risk Discovery Engine': 'अज्ञात जोखिम खोज यंत्र',
  'What emerging structures exist that today’s risk parameters do not contain?':
    'आज के जोखिम मानदंडों में जो नहीं हैं, ऐसी कौन-सी उभरती संरचनाएँ मौजूद हैं?',
  'Screens only the 66 taxpayers no encoded rule touches, peer-relative and robust, with the rulebook-overlap proof of why it is silent.':
    'केवल उन 66 करदाताओं की छानबीन जिन्हें कोई संकेतबद्ध नियम नहीं छूता, समकक्षों के सापेक्ष एवं सुदृढ़ रीति से, और वह मौन क्यों है इसके नियमपुस्तिका-अतिव्यापन प्रमाण सहित।',
  'Features the rulebook does not already encode — which in practice means the linkage fields.':
    'ऐसे लक्षण जिन्हें नियमपुस्तिका पहले से संकेतबद्ध नहीं करती — अर्थात व्यवहार में संबंध दर्शाने वाले स्तंभ।',
  'Highest deviation among unflagged taxpayers is 3.47 against a 3.5 threshold; flagged taxpayers reach 6.85.':
    'अचिह्नित करदाताओं में सर्वोच्च विचलन 3.5 की देहली के सापेक्ष 3.47 है; चिह्नित करदाता 6.85 तक पहुँचते हैं।',

  /* == Pilot requirements =============================================== */
  'PAN, director/proprietor, authorised signatory per registration':
    'प्रत्येक पंजीयन हेतु PAN, निदेशक/स्वामी, प्राधिकृत हस्ताक्षरकर्ता',
  'Engines 1, 3, 6 and 15 — every "connected entity" capability in the stack':
    'यंत्र 1, 3, 6 एवं 15 — संचय की प्रत्येक "जुड़ी इकाई" क्षमता',
  'The rulebook detects circular trading from invoice flow. It does not detect shared identity, which is how shell networks are actually found. This is five columns, not a modelling programme.':
    'नियमपुस्तिका बीजक प्रवाह से वर्तुलाकार व्यापार पहचानती है। वह साझा पहचान नहीं पहचानती, और दिखावटी नेटवर्क वास्तव में इसी से मिलते हैं। यह पाँच स्तंभों की बात है, प्रारूपण कार्यक्रम की नहीं।',
  'Adjudication outcome per closed case, with the ground of decision and the evidence relied on':
    'प्रत्येक निपटाए गए प्रकरण का न्यायनिर्णयन परिणाम, निर्णय के आधार एवं जिस साक्ष्य पर भरोसा किया गया उसके साथ',
  'Engines 9, 11, 13 and 14 — the entire outcome-learning tier':
    'यंत्र 9, 11, 13 एवं 14 — परिणामों से सीखने वाला संपूर्ण स्तर',
  'Outcomes must distinguish fraud sustained from fraud alleged, and merits decisions from limitation and procedural ones. Without the ground of decision a model trains on two different questions at once.':
    'परिणामों में टिके कपट और केवल आरोपित कपट का भेद होना चाहिए, तथा गुण-दोष पर हुए निर्णय परिसीमा एवं प्रक्रियागत निर्णयों से अलग होने चाहिए। निर्णय के आधार के बिना प्रारूप एक साथ दो भिन्न प्रश्नों पर सीखता है।',
  'Multi-period returns per taxpayer, not a single snapshot':
    'प्रत्येक करदाता हेतु अनेक अवधियों की विवरणियाँ, एक ही क्षणचित्र नहीं',
  'Engine 5, and materially improves 4 and 13': 'यंत्र 5, और 4 तथा 13 में तात्त्विक सुधार',
  'Deterioration is a trajectory. A snapshot cannot show one, so today the platform can only fire after a threshold is crossed.':
    'ह्रास एक गति-पथ है। क्षणचित्र उसे नहीं दिखा सकता, इसलिए आज मंच केवल देहली पार होने के बाद ही सूचना दे सकता है।',
  'Invoice-level GSTR-1 / 2B rather than period aggregates':
    'अवधि के समेकित आँकड़ों के बजाय बीजक-स्तर के GSTR-1 / 2B',
  'Engines 1, 2 and 8': 'यंत्र 1, 2 एवं 8',
  'Propagation between GSTIN layers, economic-substance testing, and evidence that names a transaction rather than a period.':
    'GSTIN स्तरों के बीच प्रसार, आर्थिक सारवत्ता की परख, और ऐसा साक्ष्य जो अवधि के बजाय किसी विशिष्ट लेनदेन का नाम ले।',

  /* == Closing notes ==================================================== */
  'The stack is not fifteen dashboards here, and should not become them. Limitation, recovery, capacity, similarity and the case object are each computed once and consumed by every screen that needs them — which is why the command centre can deduplicate exposure across five mechanisms rather than adding five module totals together, and why a statutory verdict computed in one place now appears in the audit queue. What does not yet exist is the entity graph beneath that: the case object is assembled per taxpayer, not traversed between them, and it cannot be traversed while the linkage hops are missing.':
    'यह संचय यहाँ पंद्रह अलग डैशबोर्ड नहीं है, और उसे वैसा बनना भी नहीं चाहिए। परिसीमा, वसूली, क्षमता, समानता एवं प्रकरण-घटक प्रत्येक एक ही बार परिकलित होते हैं और जिस भी पर्दे को वे चाहिए वह उन्हीं का उपयोग करता है — इसीलिए नियंत्रण कक्ष पाँच मॉड्यूल के योग जोड़ने के बजाय पाँच तंत्रों की जोखिम राशि से दोहरी प्रविष्टि हटा पाता है, और इसीलिए एक स्थान पर परिकलित सांविधिक निष्कर्ष अब लेखापरीक्षा पंक्ति में भी दिखता है। अभी जो मौजूद नहीं है वह उसके नीचे का इकाई आरेख है: प्रकरण-घटक प्रत्येक करदाता हेतु अलग जोड़ा जाता है, उनके बीच भ्रमण नहीं होता, और जब तक संबंध-चरण अनुपलब्ध हैं तब तक वह भ्रमण हो भी नहीं सकता।',
  'None of the fifteen uses generative AI, and none should. The copilot is retrieval-only by deliberate design: it cites a record the platform holds or it declines and names the feed that would answer. Generation belongs nowhere near a statutory determination, and an earlier version of that copilot which invented a taxpayer reply is the reason this is stated as a rule rather than a preference.':
    'इन पंद्रह में से कोई भी जनरेटिव AI का उपयोग नहीं करता, और करना भी नहीं चाहिए। सहप्रचालक जानबूझकर केवल जानकारी लाने वाले के रूप में ही बनाया गया है: वह मंच के पास उपलब्ध अभिलेख का संदर्भ देता है, अन्यथा इनकार करता है और बताता है कि उत्तर कौन-सा स्रोत दे सकता। सांविधिक निर्धारण के आसपास भी निर्मिति का स्थान नहीं है, और उसी सहप्रचालक के पूर्व संस्करण ने करदाता का उत्तर गढ़ दिया था — इसीलिए यह वरीयता नहीं, नियम के रूप में कहा गया है।'
})
