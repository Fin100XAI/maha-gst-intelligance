import { registerMessages } from '../../locale.js'

/**
 * Marathi — engineStack.js: the fifteen engines, the graph spine hop by hop,
 * the four pilot requirements, and the two closing notes on architecture and
 * generative AI.
 *
 * Every engine entry is a verdict backed by something checkable, and the
 * checkable part is usually a number in a sentence — "0 of 5 features reach an
 * effect size of 0.5", "3.47 against a 3.5 threshold", "contrast class is 2
 * proceedings". Those figures are the evidence, so each sentence keeps them
 * exactly where the English put them rather than being paraphrased around them.
 *
 * Technique names stay recognisable: Graph AI, Supervised, Unsupervised and
 * Hybrid are classifications an officer will meet again in any procurement
 * document, so the Marathi names them and keeps the English term alongside
 * where the transliteration alone would not identify it.
 *
 *   spine            → कणा
 *   hop              → टप्पा
 *   traversal        → भ्रमण
 *   centrality       → केंद्रस्थता
 *   labelled         → चिन्हांकित
 *   propagation      → प्रसार
 *   economic substance → आर्थिक सारभूतता
 *   snapshot         → क्षणचित्र
 *   trajectory       → वाटचाल
 *   artefact         → कृत्रिम परिणाम
 */
registerMessages('mr', {
  /* == Technique classes ================================================= */
  'is this deteriorating': 'हे ढासळत आहे का',
  'Rule Engine': 'नियम यंत्रणा',
  'Deterministic, auditable, defensible in appeal. The default where the law or a policy already states the logic.':
    'निश्चित, तपासण्याजोगी, अपिलात समर्थनीय. जिथे कायदा किंवा धोरण तर्क आधीच सांगते तिथे हाच मूलभूत पर्याय.',
  'Legal Engine': 'विधी यंत्रणा',
  'Statute and notifications encoded as computation. Not a model — arithmetic on legal rules, which is why it can be relied on.':
    'कायदा व अधिसूचना परिगणना म्हणून संकेतबद्ध. हे प्रारूप नाही — विधी नियमांवरील अंकगणित आहे, म्हणूनच त्यावर विसंबता येते.',
  'Graph AI': 'आलेख AI',
  'Traversal, cycle detection and centrality over an entity network. Needs edges that exist.':
    'घटक जाळ्यावरील भ्रमण, चक्र शोध व केंद्रस्थता. यास प्रत्यक्षात अस्तित्वात असलेल्या कड्या लागतात.',
  'Supervised learning from labelled outcomes. Needs labels, and enough of them to separate.':
    'चिन्हांकित निष्कर्षांवरून पर्यवेक्षित शिक्षण. यास चिन्हे लागतात, आणि पृथक्करण होईल इतक्या संख्येने लागतात.',
  Unsupervised: 'अपर्यवेक्षित',
  'Anomaly and structure discovery without labels. Needs features the rulebook does not already encode.':
    'चिन्हांशिवाय असामान्यता व रचनेचा शोध. यास नियमपुस्तकात आधीच संकेतबद्ध नसलेली वैशिष्ट्ये लागतात.',
  Hybrid: 'संमिश्र',
  'Rule or legal core with a model or graph component layered on it.':
    'नियम किंवा विधी गाभा, आणि त्यावर प्रारूप किंवा आलेख घटकाचा थर.',
  'Running in this platform against the current data.': 'सध्याच्या माहितीवर या मंचात कार्यरत.',
  'The part the data supports is built; the rest is named and blocked.':
    'माहिती ज्या भागाला आधार देते तो बांधलेला आहे; उरलेला नावासह नोंदवून अडलेला ठेवला आहे.',
  'Cannot be built on the data available. The missing input is stated, not the modelling effort.':
    'उपलब्ध माहितीवर हे बांधता येत नाही. गहाळ माहिती कोणती ते सांगितले आहे, प्रारूपणाचे श्रम नव्हे.',

  /* == Graph spine — hop availability ==================================== */
  'Present on every record and the join key throughout.':
    'प्रत्येक अभिलेखावर उपलब्ध, आणि सर्वत्र जोडणीची किल्ली हीच.',
  'Absent. Without it registrations cannot be grouped to a common holder.':
    'अनुपस्थित. याशिवाय नोंदण्या एकाच धारकाखाली गटबद्ध करता येत नाहीत.',
  'Date, status and district present.': 'तारीख, स्थिती व जिल्हा उपलब्ध.',
  'Director / Proprietor': 'संचालक / मालक',
  'Absent. This is the single most valuable missing hop — it is how shell networks are actually identified.':
    'अनुपस्थित. गहाळ टप्प्यांपैकी हाच सर्वात मौल्यवान — बनावट जाळी प्रत्यक्षात याच मार्गाने ओळखली जातात.',
  'Present, but synthesised per taxpayer here so collisions are not meaningful in this build.':
    'उपलब्ध, पण इथे प्रत्येक करदात्यासाठी स्वतंत्रपणे तयार केलेले, त्यामुळे या बांधणीत जुळणी अर्थपूर्ण नाहीत.',
  'Bank / account signals': 'बँक / खाते संकेत',
  'Absent, and lawfully constrained. Should be scoped explicitly rather than assumed.':
    'अनुपस्थित, आणि कायद्याने मर्यादित. याची व्याप्ती गृहीत धरण्याऐवजी स्पष्टपणे ठरवावी.',
  Invoice: 'बीजक',
  'Absent. Only period aggregates are held.': 'अनुपस्थित. केवळ कालावधीचे एकत्रित आकडे ठेवलेले आहेत.',
  'Claimed amount per period, not per invoice or counterparty.':
    'दावा केलेली रक्कम कालावधीनुसार, बीजकानुसार किंवा प्रतिपक्षानुसार नाही.',
  'Supplier / Recipient': 'पुरवठादार / प्राप्तकर्ता',
  'Cluster edges only, with a value and no invoice identity.':
    'केवळ गटाच्या कड्या, मूल्यासह पण बीजकाच्या ओळखीशिवाय.',
  'E-way Bill': 'ई-वे बिल',
  'Present with value, distance, route and a return-match flag.':
    'मूल्य, अंतर, मार्ग व विवरणपत्र-जुळणी निदर्शकासह उपलब्ध.',
  Return: 'विवरणपत्र',
  'Filing status and period aggregates; no line items.':
    'विवरणपत्र स्थिती व कालावधीचे एकत्रित आकडे; ओळ-पातळीवरील नोंदी नाहीत.',
  'Type, issue date, due date and status.': 'प्रकार, जारी तारीख, देय तारीख व स्थिती.',
  'Audit and litigation cases with stage and exposure.':
    'टप्पा व जोखीम रकमेसह लेखापरीक्षा व खटला प्रकरणे.',
  'Absent. No document or transaction artefacts are held against a case.':
    'अनुपस्थित. प्रकरणाविरुद्ध कोणतेही कागदपत्र किंवा व्यवहाराचे पुरावे ठेवलेले नाहीत.',
  'Outcome stage only — no order text, ground of decision, or evidence relied on.':
    'केवळ निष्कर्षाचा टप्पा — आदेशाचा मजकूर, निर्णयाचा आधार, किंवा ज्यावर विसंबले तो पुरावा नाही.',
  Appeal: 'अपील',
  'Stage and ageing present.': 'टप्पा व वय उपलब्ध.',
  'Modelled from a stated decay curve, not observed.':
    'नमूद केलेल्या क्षय वक्रावरून प्रारूपित, निरीक्षणातून नव्हे.',
  Outcome: 'निष्कर्ष',

  /* == The fifteen engines ============================================== */
  'ITC-Network Risk Engine': 'ITC-नेटवर्क जोखीम यंत्रणा',
  'Where is suspicious ITC originating, propagating and ultimately being consumed across multiple GSTIN layers?':
    'संशयास्पद ITC कुठे उगम पावते, कसे पसरते आणि अनेक GSTIN स्तरांतून अखेरीस कुठे वापरले जाते?',
  'Cluster edges with a rupee value, supplier and buyer risk scalars, and a hop-utilisation model that estimates how much credit has already been consumed downstream.':
    'रुपयातील मूल्य असलेल्या गट कड्या, पुरवठादार व खरेदीदाराचे जोखीम अंक, आणि पुढील टप्प्यांत किती श्रेय आधीच वापरले गेले याचा अंदाज देणारे टप्पा-वापर प्रारूप.',
  'Invoice-level GSTR-2A/2B flow. Propagation is modelled between clusters, not traced between GSTIN layers, so "which layer consumed it" cannot be answered.':
    'बीजक-पातळीवरील GSTR-2A/2B प्रवाह. प्रसाराचे प्रारूप गटांदरम्यान मांडले आहे, GSTIN स्तरांदरम्यान त्याचा माग काढलेला नाही, त्यामुळे "कोणत्या स्तराने ते वापरले" याचे उत्तर देता येत नाही.',
  'Chain exposure runs over 3 clusters and 10 entities; edges carry from, to and value only.':
    'साखळीची जोखीम रक्कम ३ गट व १० घटकांत पसरलेली आहे; कड्यांवर केवळ कोणाकडून, कोणाकडे व मूल्य एवढेच आहे.',

  'Circular-Trading Indicator Engine': 'वर्तुळाकार व्यापार निर्देशक यंत्रणा',
  'Are invoices moving through an entity network in circular patterns without economic substance?':
    'बीजके घटक जाळ्यातून आर्थिक सारभूततेशिवाय वर्तुळाकार नमुन्यांत फिरत आहेत का?',
  'Directed cycle detection, run per node to test whether removing it actually stops the circulation — which is how the decoy nodes were found.':
    'दिशाबद्ध चक्र शोध, प्रत्येक घटकासाठी स्वतंत्रपणे चालवून तो काढल्याने परिचलन प्रत्यक्षात थांबते का हे तपासले जाते — याच मार्गाने भुलवणारे घटक सापडले.',
  'Economic substance indicators. Nothing in the data speaks to assets, employees, power consumption or transport capacity, so circularity is detected but substance cannot be tested against it.':
    'आर्थिक सारभूततेचे निर्देशक. माहितीत मालमत्ता, कर्मचारी, वीज वापर किंवा वाहतूक क्षमता यांविषयी काहीही नाही, त्यामुळे वर्तुळाकारपणा शोधला जातो पण त्याविरुद्ध सारभूतता तपासता येत नाही.',
  'Cycle detection is implemented and found 1 node whose removal leaves the chain running.':
    'चक्र शोध अंमलात आणलेला असून त्याने असा १ घटक शोधला ज्याला काढल्यावरही साखळी चालूच राहते.',

  'Registration-Risk Engine': 'नोंदणी जोखीम यंत्रणा',
  'Which registrations show shell indicators, and which connected registrations inherit that exposure?':
    'कोणत्या नोंदण्या बनावट असल्याचे निर्देशक दाखवतात, आणि कोणत्या जोडलेल्या नोंदण्या ती जोखीम वारशाने घेतात?',
  'Day-0 registration indicators as a stated rule set, checkable at registration rather than reconstructed a year later.':
    'नोंदणीच्या दिवशीचे निर्देशक स्पष्ट नियम संच म्हणून, जे वर्षभराने पुन्हा उभे करण्याऐवजी नोंदणीच्या वेळीच तपासता येतात.',
  'The inheritance half entirely. Without PAN, director or proprietor there is no edge along which exposure can be inherited between registrations.':
    'वारशाचा संपूर्ण भाग. PAN, संचालक किंवा मालक याशिवाय नोंदण्यांदरम्यान जोखीम वारशाने जाईल अशी कोणतीही कडी नाही.',
  'Tested: contact details here are synthesised per taxpayer, so apparent shared-email groups are a trade-name artefact rather than a linkage signal.':
    'तपासले: इथले संपर्क तपशील प्रत्येक करदात्यासाठी स्वतंत्रपणे तयार केलेले आहेत, त्यामुळे समान ईमेल असल्यासारखे दिसणारे गट हे संबंधाचा संकेत नसून व्यापारी नावांमुळे आलेला कृत्रिम परिणाम आहेत.',

  'Revenue-Risk Engine': 'महसूल जोखीम यंत्रणा',
  'Where is revenue exposed, how much is at risk, and what drives the estimate?':
    'महसूल कुठे जोखमीत आहे, किती जोखमीत आहे, आणि हा अंदाज कशावरून येतो?',
  'Exposure deduplicated across five mechanisms so the same rupee is counted once, a decay curve over 0–365 days, and a limitation cliff applied on top of it.':
    'तोच रुपया एकदाच मोजला जावा म्हणून पाच यंत्रणांतील जोखीम रकमेतील दुहेरी नोंद वगळलेली, ० ते ३६५ दिवसांचा क्षय वक्र, आणि त्यावर लावलेला मुदतीचा कडा.',
  'Nothing blocking. The decay curve is a stated assumption rather than an observed rate — see engine 13.':
    'काहीही अडवत नाही. क्षय वक्र हा निरीक्षण केलेला दर नसून नमूद केलेले गृहीतक आहे — यंत्रणा १३ पहा.',
  'Rs 43.16 Cr protectable against a naive mechanism sum of Rs 59.61 Cr; the Rs 16.45 Cr gap is the double-count avoided.':
    'यंत्रणांच्या साध्या बेरजेच्या ₹५९.६१ कोटींच्या तुलनेत ₹४३.१६ कोटी संरक्षणयोग्य; ₹१६.४५ कोटींची तफावत म्हणजे टाळलेली दुहेरी मोजणी.',

  'Compliance Deterioration Engine': 'अनुपालन ऱ्हास यंत्रणा',
  'Which currently compliant taxpayers are starting to deteriorate, before a threshold is breached?':
    'उंबरठा ओलांडण्यापूर्वीच सध्या नियमपालन करणाऱ्या कोणत्या करदात्यांची स्थिती ढासळू लागली आहे?',
  'Threshold-based early warning — non-filing, sharp revenue drop, sector deviation. That is the conventional version, which fires after the line is crossed.':
    'उंबरठ्यावर आधारित पूर्वसूचना — विवरणपत्र न भरणे, महसुलात तीव्र घट, क्षेत्रीय विचलन. ही रूढ आवृत्ती आहे, जी रेषा ओलांडल्यानंतरच लागू होते.',
  'Multi-period behavioural history. Deterioration is a trajectory, and each taxpayer here is a single snapshot, so there is no slope to measure.':
    'अनेक कालावधींचा वर्तन इतिहास. ऱ्हास ही वाटचाल असते, आणि इथला प्रत्येक करदाता हे एकच क्षणचित्र आहे, त्यामुळे मोजण्यासारखा उतारच नाही.',
  'No per-taxpayer time series exists in the data; revenueDropPct is a single scalar, not a series.':
    'माहितीत प्रत्येक करदात्यासाठी कालक्रमिक मालिका नाही; revenueDropPct हा एकच अंक आहे, मालिका नाही.',

  'Network Anomaly Engine': 'नेटवर्क असामान्यता यंत्रणा',
  'What unusual relationships exist that the predefined rules are not looking for?':
    'पूर्वनिर्धारित नियम ज्यांचा शोध घेत नाहीत असे कोणते असामान्य संबंध अस्तित्वात आहेत?',
  'Peer-relative anomaly detection over behavioural ratios, using median and MAD so the outliers being hunted do not inflate the spread they are measured against.':
    'वर्तन गुणोत्तरांवर समकक्षांच्या तुलनेत असामान्यता शोध, आणि त्यासाठी मध्यक व MAD वापरले जातात जेणेकरून ज्या बाह्यबिंदूंचा शोध घ्यायचा तेच ज्या पसरणीच्या तुलनेत मोजले जातात ती पसरण फुगवू नयेत.',
  'The graph half. Structural anomaly needs the linkage edges that are absent.':
    'आलेखाचा भाग. रचनात्मक असामान्यतेसाठी ज्या संबंध कड्या लागतात त्या अनुपस्थित आहेत.',
  'Runs and returns nothing, provably: three of the nine encoded rules are computed from the same ratios, so no unflagged taxpayer reaches the outlier threshold on any of them.':
    'ती चालते आणि सिद्धपणे काहीही परत देत नाही: नऊ संकेतबद्ध नियमांपैकी तीन याच गुणोत्तरांवरून परिगणित होतात, त्यामुळे निदर्शनास न आणलेला एकही करदाता त्यांपैकी कोणत्याही गुणोत्तरावर बाह्यबिंदूचा उंबरठा गाठत नाही.',

  'Case-Priority Engine': 'प्रकरण प्राधान्य यंत्रणा',
  'Which cases should officers examine first, on evidence, exposure, urgency, recoverability and capacity?':
    'पुरावा, जोखीम रक्कम, निकड, वसूलक्षमता व क्षमता यांवरून अधिकाऱ्यांनी कोणती प्रकरणे प्रथम तपासावीत?',
  'Six-factor ranking by recoverable value per officer-day, with capacity modelled as a constrained assignment under hard territorial and role eligibility.':
    'प्रति अधिकारी-दिवस वसूलपात्र मूल्यानुसार सहा घटकांची क्रमवारी, आणि कठोर प्रादेशिक व पदनिहाय पात्रतेखालील मर्यादित नेमणूक म्हणून क्षमतेचे प्रारूप.',
  'Nothing blocking.': 'काहीही अडवत नाही.',

  'Investigation Evidence Engine': 'तपास पुरावा यंत्रणा',
  'What transactions, counterparties, timelines and anomalies support the officer’s hypothesis?':
    'अधिकाऱ्याच्या गृहीतकाला कोणते व्यवहार, प्रतिपक्ष, कालरेषा व असामान्यता आधार देतात?',
  'A seven-element evidence-to-action brief per case: signals with weights, provision engaged, precedent, exposure, decomposed confidence, limitation and next step — each naming the system it came from.':
    'प्रत्येक प्रकरणासाठी सात घटकांचे पुरावा-ते-कृती टिपण: भारमानासह संकेत, लागू केलेली तरतूद, पूर्वनिर्णय, जोखीम रक्कम, घटकांत विभागलेला विश्वास, मुदत व पुढील पाऊल — आणि प्रत्येक घटक तो कोणत्या प्रणालीतून आला हे नमूद करतो.',
  'Documents and transactions. No artefact is held against a case, so the brief assembles metadata about evidence rather than the evidence.':
    'कागदपत्रे व व्यवहार. प्रकरणाविरुद्ध कोणताही पुरावा ठेवलेला नाही, त्यामुळे टिपण पुरावा नव्हे तर पुराव्याविषयीची माहिती जुळवते.',
  'The Evidence hop of the graph spine is absent entirely.':
    'आलेख कण्यातील पुरावा हा टप्पा पूर्णपणे अनुपस्थित आहे.',

  'Historical Case Outcome Engine': 'ऐतिहासिक प्रकरण निष्कर्ष यंत्रणा',
  'What happened to historically similar cases?': 'पूर्वीच्या सारख्या प्रकरणांचे काय झाले?',
  'Comparability scored on the dimensions that decide outcomes — question of law and evidential position carry 60% of the weight, sector deliberately 5% — with individual outcomes shown and distinguishers beside every match.':
    'निष्कर्ष ठरवणाऱ्या परिमाणांवर तुलनात्मकतेचे गुणांकन — विधी प्रश्न व पुराव्याविषयक स्थिती यांना ६०% भारमान, क्षेत्राला जाणीवपूर्वक ५% — आणि प्रत्येक जुळणीशेजारी वैयक्तिक निष्कर्ष व भेद दर्शवणारे घटक दाखवलेले.',
  'Five to ten years of history. Ten concluded proceedings support retrieval of comparables; they do not support a rate, and the module refuses to state one where fewer than five share the question of law.':
    'पाच ते दहा वर्षांचा इतिहास. दहा निकाली कार्यवाही तुलनात्मक प्रकरणे मिळवण्यास पुरेशा आहेत; त्या प्रमाण देण्यास पुरेशा नाहीत, आणि ज्या विधी प्रश्नावर पाचांहून कमी प्रकरणे आहेत तिथे प्रारूप प्रमाण सांगण्यास नकार देते.',

  'Missed Revenue Discovery Engine': 'निसटलेल्या महसुलाचा शोध यंत्रणा',
  'What revenue exposure was never surfaced or escalated by the existing workflow?':
    'सध्याच्या कार्यप्रवाहाने कोणती महसूल जोखीम रक्कम कधीही समोर आणली नाही किंवा वरिष्ठांकडे नेली नाही?',
  'Cases put down while signals were still live — audits closed with rules firing, taxpayers never noticed despite them — each with the signals, what the department did, comparable concluded proceedings, and the checks required before reopening.':
    'संकेत अद्याप कार्यरत असतानाच बाजूला ठेवलेली प्रकरणे — नियम लागू असताना बंद केलेल्या लेखापरीक्षा, ते असूनही कधीही नोटीस न मिळालेले करदाते — आणि प्रत्येकासोबत संकेत, विभागाने काय केले, तुलनात्मक निकाली कार्यवाही, व पुन्हा उघडण्यापूर्वी आवश्यक तपासण्या.',
  'Nothing blocking, but only 4 of 56 carry a confirmed live limitation clock, so the figure is what they represent rather than what is recoverable.':
    'काहीही अडवत नाही, पण ५६ पैकी केवळ ४ प्रकरणांवर निश्चितपणे कार्यरत मुदत घड्याळ आहे, त्यामुळे हा आकडा वसूलपात्र रकमेचा नसून ती प्रकरणे काय दर्शवतात याचा आहे.',

  'Fraud / Suppression Review Intelligence': 'फसवणूक / माहिती दडवणे पुनर्विलोकन इंटेलिजन्स',
  'Which cases resemble historically established suppression, for officer and legal review?':
    'अधिकारी व विधी पुनर्विलोकनासाठी, कोणती प्रकरणे पूर्वी सिद्ध झालेल्या माहिती दडवण्याशी साम्य दाखवतात?',
  'The refusal, measured. And the review-candidate half, which does not depend on the label.':
    'मोजून दिलेला नकार. आणि पुनर्विलोकन उमेदवारांचा भाग, जो चिन्हावर अवलंबून नाही.',
  'A positive class that separates. Section 74 gives one example; substituting "sustained on appeal" gives eight, and those eight are statistically indistinguishable from litigation in general.':
    'पृथक्करण करणारा सकारात्मक वर्ग. कलम ७४ एकच उदाहरण देते; त्याऐवजी "अपिलात टिकून राहिलेले" घेतल्यास आठ मिळतात, आणि ते आठ सर्वसाधारण खटल्यांहून सांख्यिकीय दृष्ट्या वेगळे ओळखता येत नाहीत.',
  'Separation test: 0 of 5 features reach an effect size of 0.5. Risk rules firing come out at exactly 0.00 — cases the department won fire the same number of rules as cases in general.':
    'पृथक्करण चाचणी: ५ पैकी ० वैशिष्ट्ये ०.५ इतका परिणाम आकार गाठतात. लागू होणारे जोखीम नियम नेमके ०.०० वर येतात — विभागाने जिंकलेल्या प्रकरणांत सर्वसाधारण प्रकरणांइतकेच नियम लागू होतात.',

  'Limitation & Time-Barring Engine': 'मुदत व मुदतबाह्यता यंत्रणा',
  'What is the case-specific statutory deadline, and what exposure is approaching it?':
    'प्रत्येक प्रकरणाची सांविधिक मुदत काय आहे, आणि कोणती जोखीम रक्कम तिच्याजवळ येत आहे?',
  'Sections 73, 74 and 74A computed per case in UTC from the annual return due date, with Notifications 09/2023 and 56/2023 applied and flagged as contested.':
    'वार्षिक विवरणपत्राच्या देय तारखेपासून UTC मध्ये प्रत्येक प्रकरणासाठी परिगणित कलम ७३, ७४ व ७४अ, आणि त्यावर अधिसूचना ०९/२०२३ व ५६/२०२३ लावून त्या वादग्रस्त म्हणून चिन्हांकित केलेल्या.',
  'Nothing. This is arithmetic on statute, not a model, which is why it can be relied on in a notice.':
    'काहीही नाही. हे कायद्यावरील अंकगणित आहे, प्रारूप नाही, म्हणूनच नोटिशीत त्यावर विसंबता येते.',

  'Revenue Recovery Probability Engine': 'महसूल वसुली संभाव्यता यंत्रणा',
  'What is likely to be recovered, rather than what was demanded?':
    'मागणी किती केली यापेक्षा प्रत्यक्षात किती वसूल होण्याची शक्यता आहे?',
  'A continuous decay curve with interpolation between anchors, plus transparent recovery proxies — still filing, non-filer, in appeal — applied as stated adjustments.':
    'आधारबिंदूंदरम्यान अंतर्वेशनासह सलग क्षय वक्र, आणि त्यासोबत पारदर्शक वसुली निर्देशक — अद्याप विवरणपत्रे भरणारा, न भरणारा, अपिलाधीन — नमूद केलेल्या समायोजनांच्या स्वरूपात लावलेले.',
  'The curve is asserted, not learned. Turning it into a probability model needs observed recovery against demand across closed cases, which the data does not carry.':
    'वक्र हा ठामपणे मांडलेला आहे, शिकून काढलेला नाही. त्याचे संभाव्यता प्रारूपात रूपांतर करण्यासाठी निकाली प्रकरणांतील मागणीच्या तुलनेत प्रत्यक्ष वसुली लागते, जी माहितीत नाही.',
  'Recovery is modelled from stated anchors; the Recovery hop of the graph spine is modelled rather than observed.':
    'वसुलीचे प्रारूप नमूद केलेल्या आधारबिंदूंवरून मांडले आहे; आलेख कण्यातील वसुली हा टप्पा निरीक्षित नसून प्रारूपित आहे.',

  'Case Outcome Prediction Engine': 'प्रकरण निष्कर्ष भाकीत यंत्रणा',
  'What is the likely adjudication and recovery outcome, with the evidence behind it?':
    'न्यायनिर्णयन व वसुलीचा संभाव्य निष्कर्ष काय, आणि त्यामागील पुरावा कोणता?',
  'The comparables and their real outcomes, shown individually — which is retrieval, not prediction.':
    'तुलनात्मक प्रकरणे व त्यांचे खरे निष्कर्ष, वैयक्तिकरीत्या दाखवलेले — हे माहिती मिळवणे आहे, भाकीत नाही.',
  'Features that predict. The same separation test that blocks engine 11 blocks this: the features available describe a taxpayer, not why a demand held up.':
    'भाकीत करणारी वैशिष्ट्ये. यंत्रणा ११ ला अडवणारी तीच पृथक्करण चाचणी हिलाही अडवते: उपलब्ध वैशिष्ट्ये करदात्याचे वर्णन करतात, मागणी का टिकली याचे नाही.',
  'Contrast class is 2 proceedings. A model trained on wins alone learns what cases look like, not what winning looks like.':
    'विरोधी वर्गात २ कार्यवाही आहेत. केवळ यशांवर शिकवलेले प्रारूप प्रकरणे कशी दिसतात हे शिकते, जिंकणे कसे दिसते हे नाही.',

  'Unknown-Risk Discovery Engine': 'अज्ञात जोखीम शोध यंत्रणा',
  'What emerging structures exist that today’s risk parameters do not contain?':
    'आजच्या जोखीम मापदंडांत नसलेल्या कोणत्या नव्या रचना उदयास येत आहेत?',
  'Screens only the 66 taxpayers no encoded rule touches, peer-relative and robust, with the rulebook-overlap proof of why it is silent.':
    'कोणताही संकेतबद्ध नियम स्पर्श करत नाही अशा केवळ ६६ करदात्यांची चाळणी, समकक्षांच्या तुलनेत व सक्षम पद्धतीने, आणि ती शांत का आहे याच्या नियमपुस्तक-आच्छादन पुराव्यासह.',
  'Features the rulebook does not already encode — which in practice means the linkage fields.':
    'नियमपुस्तकात आधीच संकेतबद्ध नसलेली वैशिष्ट्ये — म्हणजे प्रत्यक्षात संबंध दर्शवणारी क्षेत्रे.',
  'Highest deviation among unflagged taxpayers is 3.47 against a 3.5 threshold; flagged taxpayers reach 6.85.':
    'निदर्शनास न आणलेल्या करदात्यांतील सर्वाधिक विचलन ३.५ च्या उंबरठ्याविरुद्ध ३.४७ आहे; निदर्शनास आणलेले करदाते ६.८५ पर्यंत पोहोचतात.',

  /* == Pilot requirements =============================================== */
  'PAN, director/proprietor, authorised signatory per registration':
    'प्रत्येक नोंदणीसाठी PAN, संचालक/मालक, अधिकृत स्वाक्षरीकर्ता',
  'Engines 1, 3, 6 and 15 — every "connected entity" capability in the stack':
    'यंत्रणा १, ३, ६ व १५ — संचातील प्रत्येक "जोडलेला घटक" क्षमता',
  'The rulebook detects circular trading from invoice flow. It does not detect shared identity, which is how shell networks are actually found. This is five columns, not a modelling programme.':
    'नियमपुस्तक बीजक प्रवाहावरून वर्तुळाकार व्यापार शोधते. ते समान ओळख शोधत नाही, आणि बनावट जाळी प्रत्यक्षात याच मार्गाने सापडतात. ही पाच स्तंभांची बाब आहे, प्रारूपण कार्यक्रमाची नाही.',
  'Adjudication outcome per closed case, with the ground of decision and the evidence relied on':
    'प्रत्येक निकाली प्रकरणाचा न्यायनिर्णयन निष्कर्ष, निर्णयाच्या आधारासह व ज्यावर विसंबले त्या पुराव्यासह',
  'Engines 9, 11, 13 and 14 — the entire outcome-learning tier':
    'यंत्रणा ९, ११, १३ व १४ — निष्कर्षांतून शिकणारा संपूर्ण स्तर',
  'Outcomes must distinguish fraud sustained from fraud alleged, and merits decisions from limitation and procedural ones. Without the ground of decision a model trains on two different questions at once.':
    'निष्कर्षांनी टिकून राहिलेली फसवणूक व केवळ आरोप ठेवलेली फसवणूक यांत भेद केला पाहिजे, आणि गुणवत्तेवरील निर्णय मुदत व कार्यपद्धतीवरील निर्णयांपासून वेगळे केले पाहिजेत. निर्णयाच्या आधाराशिवाय प्रारूप एकाच वेळी दोन वेगळ्या प्रश्नांवर शिकते.',
  'Multi-period returns per taxpayer, not a single snapshot':
    'प्रत्येक करदात्यासाठी अनेक कालावधींची विवरणपत्रे, एकच क्षणचित्र नव्हे',
  'Engine 5, and materially improves 4 and 13': 'यंत्रणा ५, आणि ४ व १३ यांत लक्षणीय सुधारणा',
  'Deterioration is a trajectory. A snapshot cannot show one, so today the platform can only fire after a threshold is crossed.':
    'ऱ्हास ही वाटचाल असते. क्षणचित्र ती दाखवू शकत नाही, त्यामुळे आज मंच केवळ उंबरठा ओलांडल्यावरच सूचना देऊ शकतो.',
  'Invoice-level GSTR-1 / 2B rather than period aggregates':
    'कालावधीच्या एकत्रित आकड्यांऐवजी बीजक-पातळीवरील GSTR-1 / 2B',
  'Engines 1, 2 and 8': 'यंत्रणा १, २ व ८',
  'Propagation between GSTIN layers, economic-substance testing, and evidence that names a transaction rather than a period.':
    'GSTIN स्तरांदरम्यानचा प्रसार, आर्थिक सारभूततेची चाचणी, आणि कालावधीऐवजी विशिष्ट व्यवहाराचे नाव घेणारा पुरावा.',

  /* == Closing notes ==================================================== */
  'The stack is not fifteen dashboards here, and should not become them. Limitation, recovery, capacity, similarity and the case object are each computed once and consumed by every screen that needs them — which is why the command centre can deduplicate exposure across five mechanisms rather than adding five module totals together, and why a statutory verdict computed in one place now appears in the audit queue. What does not yet exist is the entity graph beneath that: the case object is assembled per taxpayer, not traversed between them, and it cannot be traversed while the linkage hops are missing.':
    'हा संच इथे पंधरा स्वतंत्र फलक नाही, आणि तो तसा होताही कामा नये. मुदत, वसुली, क्षमता, साम्य व प्रकरण घटक हे प्रत्येकी एकदाच परिगणित होतात आणि ज्या प्रत्येक पडद्याला ते लागतात तो त्यांचाच वापर करतो — म्हणूनच सूत्र केंद्र पाच प्रारूपांच्या बेरजा जोडण्याऐवजी पाच यंत्रणांतील जोखीम रकमेतील दुहेरी नोंद वगळू शकते, आणि म्हणूनच एका ठिकाणी परिगणित केलेला सांविधिक निष्कर्ष आता लेखापरीक्षा रांगेतही दिसतो. अद्याप अस्तित्वात नाही ते त्याखालचे घटक आलेख: प्रकरण घटक प्रत्येक करदात्यासाठी स्वतंत्रपणे जुळवला जातो, त्यांच्यादरम्यान भ्रमण होत नाही, आणि संबंध टप्पे गहाळ असेपर्यंत ते भ्रमण होऊही शकत नाही.',
  'None of the fifteen uses generative AI, and none should. The copilot is retrieval-only by deliberate design: it cites a record the platform holds or it declines and names the feed that would answer. Generation belongs nowhere near a statutory determination, and an earlier version of that copilot which invented a taxpayer reply is the reason this is stated as a rule rather than a preference.':
    'या पंधरांपैकी एकही जनरेटिव्ह AI वापरत नाही, आणि वापरूही नये. सहवैमानिक जाणीवपूर्वक केवळ माहिती मिळवणारा म्हणूनच रचलेला आहे: तो मंचाकडे असलेल्या अभिलेखाचा संदर्भ देतो, अन्यथा नकार देतो आणि उत्तर देऊ शकणारा स्रोत कोणता ते सांगतो. सांविधिक निर्धारणाच्या जवळपासही निर्मितीचे स्थान नाही, आणि त्या सहवैमानिकाच्या आधीच्या आवृत्तीने करदात्याचे उत्तर रचून काढले होते, म्हणूनच हे प्राधान्य म्हणून नव्हे तर नियम म्हणून नमूद केले आहे.'
})
