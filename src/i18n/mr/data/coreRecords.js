import { registerMessages } from '../../locale.js'

/**
 * Marathi — the prose carried by individual records: risk rules, the statutory
 * index, comparability dimensions, network lead indicators and the case twin's
 * source and recommendation vocabulary.
 *
 * These live in src/data and reach the screen through t(variable), never as
 * t('…') at the render site, which is why they need scripts/prose.mjs to be
 * seen at all.
 *
 * Two rules govern this file:
 *
 *   Statutory citations are not translated. "Section 73, CGST/MGST Act",
 *   "Notification 09/2023-Central Tax" and the form names GSTR-1 / 3B / 2B are
 *   what an officer writes into a notice; translating them would make the
 *   citation unusable. The sentence explaining what the provision covers is
 *   translated, because that is what the officer reads.
 *
 *   A caveat is translated in full, never shortened. "This is a risk signal,
 *   not evidence of evasion" is the sentence that keeps the platform lawful to
 *   act on; a compressed rendering would weaken it.
 *
 *   determinant     → निर्णायक घटक
 *   evidential      → पुराव्याविषयक
 *   Jaccard index   → जॅकार्ड निर्देशांक (transliterated — it names a method)
 *   pass-through    → मध्यस्थ
 *   dormant         → निष्क्रिय
 */
registerMessages('mr', {
  /* == Risk rule families ================================================= */
  'Filing Behaviour': 'विवरणपत्र वर्तन',
  'One or more return periods not filed within the statutory window.':
    'एक किंवा अधिक विवरणपत्र कालावधी सांविधिक मुदतीत दाखल केलेले नाहीत.',
  'Pattern of returns filed after due date across multiple periods.':
    'अनेक कालावधींत देय तारखेनंतर विवरणपत्रे दाखल करण्याचा कल.',
  'ITC Behaviour': 'ITC वर्तन',
  'Input tax credit claimed materially exceeds trailing 6-month average.':
    'दावा केलेले इनपुट कर श्रेय मागील ६ महिन्यांच्या सरासरीपेक्षा लक्षणीयरीत्या अधिक आहे.',
  'Logistics Intelligence': 'मालवाहतूक इंटेलिजन्स',
  'Declared e-way bill movement value is inconsistent with reported outward supply.':
    'घोषित ई-वे बिल वाहतूक मूल्य नोंदवलेल्या बाह्य पुरवठ्याशी विसंगत आहे.',
  'One or more upstream suppliers independently carry a High or Critical risk rating.':
    'एक किंवा अधिक पूर्ववर्ती पुरवठादारांना स्वतंत्रपणे उच्च किंवा अत्यंत गंभीर जोखीम श्रेणी आहे.',
  'Revenue Behaviour': 'महसूल वर्तन',
  'Tax payment has fallen sharply despite stable or rising turnover.':
    'उलाढाल स्थिर किंवा वाढत असतानाही कर भरणा तीव्रपणे घटला आहे.',
  'Refund Behaviour': 'परतावा वर्तन',
  'Refund claimed as a proportion of turnover exceeds the sector benchmark band.':
    'उलाढालीच्या प्रमाणात दावा केलेला परतावा क्षेत्रीय मानक पट्ट्यापेक्षा अधिक आहे.',
  'Registration Behaviour': 'नोंदणी वर्तन',
  'Entity registered within the last 12 months already transacting at high value.':
    'गेल्या १२ महिन्यांत नोंदणी झालेला घटक आताच उच्च मूल्याचे व्यवहार करत आहे.',
  'Sector Behaviour': 'क्षेत्र वर्तन',
  'Tax-to-turnover ratio deviates materially from peer sector median.':
    'कर-उलाढाल गुणोत्तर समकक्ष क्षेत्रीय मध्यकापासून लक्षणीयरीत्या विचलित आहे.',
  'This score is a statistical risk signal derived from filing, payment and network patterns. It is not evidence of tax evasion and does not constitute an adverse finding. Verification by an authorised officer is mandatory before any action.':
    'हा गुणांक विवरणपत्र, भरणा व नेटवर्क नमुन्यांवरून काढलेला सांख्यिकीय जोखीम संकेत आहे. तो कर चुकवेगिरीचा पुरावा नाही आणि कोणताही प्रतिकूल निष्कर्ष नाही. कोणतीही कारवाई करण्यापूर्वी अधिकृत अधिकाऱ्याकडून पडताळणी अनिवार्य आहे.',

  /* == Statutory index — citations stay in Latin ========================== */
  'Section 73, CGST/MGST Act': 'कलम ७३, CGST/MGST अधिनियम',
  'Tax not paid, short paid, or ITC wrongly availed — other than by fraud, wilful misstatement or suppression.':
    'कर न भरणे, कमी भरणे, किंवा ITC चुकीच्या प्रकारे घेणे — फसवणूक, जाणीवपूर्वक चुकीचे कथन किंवा माहिती दडवणे यांव्यतिरिक्त.',
  'Section 74, CGST/MGST Act': 'कलम ७४, CGST/MGST अधिनियम',
  'Tax not paid, short paid, or ITC wrongly availed by reason of fraud, wilful misstatement or suppression of facts.':
    'फसवणूक, जाणीवपूर्वक चुकीचे कथन किंवा तथ्ये दडवणे या कारणाने कर न भरणे, कमी भरणे, किंवा ITC चुकीच्या प्रकारे घेणे.',
  'Section 74A, CGST/MGST Act': 'कलम ७४अ, CGST/MGST अधिनियम',
  'Inserted by the Finance (No. 2) Act, 2024. Applies from FY 2024-25 and removes the fraud / non-fraud split for time limits.':
    'वित्त (क्र. २) अधिनियम, २०२४ द्वारे समाविष्ट. आर्थिक वर्ष २०२४-२५ पासून लागू, आणि मुदतींसाठीचा फसवणूक / फसवणूक-नसलेली हा भेद रद्द करते.',
  'Notification 09/2023-Central Tax, 31 March 2023': 'अधिसूचना ०९/२०२३-केंद्रीय कर, ३१ मार्च २०२३',
  'Extended the s.73(10) order deadline for FY 2017-18, 2018-19 and 2019-20.':
    'आर्थिक वर्ष २०१७-१८, २०१८-१९ व २०१९-२० साठी कलम ७३(१०) खालील आदेशाची मुदत वाढवली.',
  'Notification 56/2023-Central Tax, 28 December 2023': 'अधिसूचना ५६/२०२३-केंद्रीय कर, २८ डिसेंबर २०२३',
  'Further extended the s.73(10) order deadline for FY 2018-19 and 2019-20. HELD ULTRA VIRES s.168A by the Gauhati High Court and challenged elsewhere — a demand resting on this extension carries live litigation risk.':
    'आर्थिक वर्ष २०१८-१९ व २०१९-२० साठी कलम ७३(१०) खालील आदेशाची मुदत आणखी वाढवली. गुवाहाटी उच्च न्यायालयाने ती कलम १६८अ च्या कक्षेबाहेरची ठरवली असून इतरत्रही तिला आव्हान दिले आहे — या मुदतवाढीवर आधारलेल्या मागणीवर जिवंत खटल्याची जोखीम आहे.',
  Urgent: 'तातडीचे',
  Watch: 'लक्ष ठेवा',
  'In time': 'मुदतीत',
  Order: 'आदेश',
  Notice: 'नोटीस',
  Unassigned: 'नेमून दिलेले नाही',

  /* == Comparability dimensions =========================================== */
  'similar risk patterns': 'सारखे जोखीम नमुने',
  'Order confirmed': 'आदेश कायम',
  'Order reversed': 'आदेश रद्द',
  'not assessable': 'निर्धारण करता येत नाही',
  'The single strongest determinant. Two cases turning on the same question are comparable however different the businesses are.':
    'हा एकमेव सर्वात प्रबळ निर्णायक घटक. एकाच प्रश्नावर अवलंबून असलेली दोन प्रकरणे, व्यवसाय कितीही वेगळे असले तरी, तुलनात्मक असतात.',
  'Department’s evidential position': 'विभागाची पुराव्याविषयक स्थिती',
  'Recorded on the file at assessment. A case argued from a documentation gap behaves differently from one argued from a strong record, whatever the legal issue.':
    'करनिर्धारणाच्या वेळी नस्तीवर नोंदवलेली. कागदपत्रांच्या त्रुटीवरून लढवलेले प्रकरण, विधी प्रश्न कोणताही असो, भक्कम अभिलेखावरून लढवलेल्या प्रकरणापेक्षा वेगळे वागते.',
  'Risk pattern': 'जोखीम नमुना',
  'Overlap of the encoded rules that fired, measured as a Jaccard index. Shapes how a case is evidenced without deciding it.':
    'लागू झालेल्या संकेतबद्ध नियमांचा एकमेकांशी असलेला आच्छादन, जॅकार्ड निर्देशांकाने मोजलेला. प्रकरणाचा निर्णय न ठरवता ते कोणत्या पुराव्यांवर उभे राहते हे तो घडवतो.',
  'ITC behaviour': 'ITC वर्तन',
  'Input credit claimed per rupee of turnover. Two cases with similar credit behaviour tend to raise similar evidential questions.':
    'प्रति रुपया उलाढालीमागे दावा केलेले इनपुट श्रेय. सारखे श्रेय वर्तन असलेली दोन प्रकरणे साधारणपणे सारखेच पुराव्याविषयक प्रश्न उपस्थित करतात.',
  'Scale of the demand': 'मागणीचे प्रमाण',
  'Order of magnitude of the amount in dispute. Affects the forum and the effort a taxpayer will spend defending, not the merits.':
    'वादाधीन रकमेचा पट. यावरून न्यायमंच व करदाता बचावासाठी किती श्रम खर्च करेल हे ठरते, गुणवत्ता नव्हे.',
  'Demands differ by more than two orders of magnitude': 'मागण्यांमध्ये दोन पटींहून अधिक फरक आहे',
  'Deliberately weighted low. Sector is the dimension that looks most relevant and predicts outcome least — it was the sole basis of an earlier version of this feature, which is why that version was removed. Kept visible so it can be seen to have been considered and discounted.':
    'जाणीवपूर्वक कमी भारमान दिलेले. क्षेत्र हे असे परिमाण आहे जे सर्वाधिक समर्पक दिसते आणि निष्कर्षाचे सर्वात कमी भाकीत करते — या वैशिष्ट्याच्या आधीच्या आवृत्तीचा तोच एकमेव आधार होता, म्हणूनच ती आवृत्ती काढून टाकली. त्याचा विचार करून तो बाजूला ठेवला हे दिसावे म्हणून ते दृश्य ठेवले आहे.',
  'No concluded proceeding in the department’s record is comparable to this case on the dimensions that decide outcomes. Cases sharing only a sector are not comparable and are not offered as though they were.':
    'निष्कर्ष ठरवणाऱ्या परिमाणांवर विभागाच्या अभिलेखातील एकही निकाली कार्यवाही या प्रकरणाशी तुलनात्मक नाही. केवळ क्षेत्र समान असलेली प्रकरणे तुलनात्मक नसतात आणि ती तशी असल्यासारखी सादर केली जात नाहीत.',
  'Comparability is scored on the dimensions that can actually move an outcome, not on overall resemblance. The question of law and the department’s evidential position carry most of the weight; risk pattern, ITC behaviour and scale shape how a case is argued without deciding it; sector is kept at a deliberately small weight because it is the dimension that looks most relevant and predicts least. Every dimension’s contribution is shown, so the score can be disagreed with rather than merely trusted.':
    'तुलनात्मकतेचे गुणांकन एकूण साम्यावर नव्हे तर प्रत्यक्षात निष्कर्ष बदलू शकणाऱ्या परिमाणांवर केले जाते. विधी प्रश्न व विभागाची पुराव्याविषयक स्थिती यांना सर्वाधिक भारमान आहे; जोखीम नमुना, ITC वर्तन व प्रमाण हे प्रकरण कसे लढवले जाते ते घडवतात, निर्णय ठरवत नाहीत; क्षेत्राला जाणीवपूर्वक अल्प भारमान ठेवले आहे कारण ते सर्वाधिक समर्पक दिसणारे आणि सर्वात कमी भाकीत करणारे परिमाण आहे. प्रत्येक परिमाणाचे योगदान दाखवले आहे, जेणेकरून गुणांकावर केवळ विश्वास ठेवण्याऐवजी त्याच्याशी असहमतही होता येईल.',
  'These are what happened in prior proceedings, not a prediction about this one. Facts differ between cases sharing a question of law, and the distinguishing factors listed against each comparison are the reason the outcome there may not be the outcome here. Where too few comparable proceedings exist to support a rate, the individual outcomes are shown and no rate is given.':
    'हे पूर्वीच्या कार्यवाहींत काय घडले ते आहे, या प्रकरणाबद्दलचे भाकीत नाही. एकच विधी प्रश्न असलेल्या प्रकरणांतही तथ्ये वेगळी असतात, आणि प्रत्येक तुलनेसमोर दिलेले भेद दर्शवणारे घटक हेच कारण आहे की तिथला निष्कर्ष इथे तसाच असेलच असे नाही. प्रमाण देण्याइतक्या तुलनात्मक कार्यवाही नसतील तिथे वैयक्तिक निष्कर्ष दाखवले जातात आणि कोणतेही प्रमाण दिले जात नाही.',

  /* == Network lead indicators ============================================ */
  'network intelligence': 'नेटवर्क इंटेलिजन्स',
  'Acts as the hub of the chain': 'साखळीचे केंद्र म्हणून कार्य करते',
  'Sits at the centre of the invoice flow rather than at its edge.':
    'बीजक प्रवाहाच्या कडेला नव्हे तर मध्यभागी आहे.',
  'Registered address shared across the cluster': 'गटातील सर्वांचा नोंदणीकृत पत्ता समान',
  'Common premises across supposedly independent entities.':
    'कथितरीत्या स्वतंत्र असलेल्या घटकांची जागा समान.',
  'Contact details shared across the cluster': 'गटातील सर्वांचे संपर्क तपशील समान',
  'Common telephone or email across the cluster.': 'गटात समान दूरध्वनी क्रमांक किंवा ईमेल.',
  'Dormant while invoicing': 'बीजके देत असताना निष्क्रिय',
  'No filing activity in a period during which invoices were issued.':
    'ज्या कालावधीत बीजके दिली गेली त्या कालावधीत कोणतीही विवरणपत्र नोंद नाही.',
  'Pass-through pattern — credit in, credit out, no value added':
    'मध्यस्थ नमुना — श्रेय आत, श्रेय बाहेर, कोणतीही मूल्यवृद्धी नाही',
  'Inward and outward supply match closely with negligible tax paid in cash.':
    'आवक व जावक पुरवठा जवळपास तंतोतंत जुळतो आणि रोखीने भरलेला कर नगण्य आहे.',
  'Whether a node is worth acting against is decided by re-running directed cycle detection on the chain with that node removed — not by a centrality score. Where a chord bypasses a node, the circulation survives its removal, so acting there spends the department’s one element of surprise on an entity whose absence changes nothing. Among the nodes whose removal does stop the chain, the ordering weights the value on their incident edges by lead strength, because a strong lead on a smaller node is a better opening than a weak one on a larger node that will not survive appeal.':
    'एखाद्या घटकावर कारवाई करण्यासारखी आहे का हे केंद्रस्थता गुणांकाने नव्हे, तर तो घटक वगळून साखळीवर दिशाबद्ध चक्र शोध पुन्हा चालवून ठरवले जाते. जिथे एखादी आडवी कडी त्या घटकाला बगल देते, तिथे तो काढल्यावरही परिचलन टिकते, त्यामुळे तिथे कारवाई केल्याने विभागाचा अनपेक्षिततेचा एकमेव फायदा अशा घटकावर वाया जातो ज्याच्या अनुपस्थितीने काहीही बदलत नाही. ज्या घटकांच्या काढण्याने साखळी खरोखर थांबते, त्यांच्यामध्ये क्रम लावताना त्यांच्या कड्यांवरील मूल्य सुगाव्याच्या तीव्रतेने भारित केले जाते, कारण लहान घटकावरील भक्कम सुगावा हा अपिलात न टिकणाऱ्या मोठ्या घटकावरील दुर्बळ सुगाव्यापेक्षा चांगली सुरुवात असतो.',
  'A chain is one economic unit and several jurisdictional ones. Every division a cluster touches needs an officer empowered to act, on the same date, because the first action warns the rest. Where a division in the span has no investigation officer posted, the cluster cannot be closed simultaneously at all — that is a deployment fact, not a scheduling one, and it is reported separately from the clusters that are merely hard to arrange.':
    'साखळी ही आर्थिक दृष्ट्या एकच घटक असते आणि अधिकारक्षेत्रीय दृष्ट्या अनेक. गट ज्या प्रत्येक विभागाला स्पर्श करतो तिथे कारवाईचे अधिकार असलेला अधिकारी, तोही त्याच तारखेला, आवश्यक असतो — कारण पहिलीच कारवाई उरलेल्यांना सावध करते. व्याप्तीतील ज्या विभागात कोणताही तपास अधिकारी नियुक्त नाही, तिथे तो गट एकाच वेळी बंद करताच येत नाही — हे नियुक्तीचे वास्तव आहे, नियोजनाचे नव्हे, आणि केवळ जुळवणीस अवघड असलेल्या गटांपासून वेगळे नोंदवले जाते.',
  'Lead strength is a prioritisation aid built from linkage indicators this platform holds — shared premises, shared contact details, dormancy, position in the flow. It is not evidence and it is not a finding of fraud. Circular flow has innocent explanations, including genuine reciprocal trading between related businesses. Every entry here is a reason to investigate and must be substantiated independently before any action issues.':
    'सुगाव्याची तीव्रता हे मंचाकडे असलेल्या संबंध निर्देशकांवरून — समान जागा, समान संपर्क तपशील, निष्क्रियता, प्रवाहातील स्थान — उभारलेले प्राधान्यक्रम सहाय्य आहे. तो पुरावा नाही आणि फसवणुकीचा निष्कर्षही नाही. वर्तुळाकार प्रवाहाला निर्दोष स्पष्टीकरणे असतात, ज्यात संबंधित व्यवसायांमधील खराखुरा परस्पर व्यापारही येतो. येथील प्रत्येक नोंद ही तपास करण्याचे कारण आहे, आणि कोणतीही कारवाई जारी होण्यापूर्वी तिची स्वतंत्रपणे सिद्धता करावी लागते.',

  /* == Case twin — sources, events and recommendations =================== */
  'GST Registration': 'GST नोंदणी',
  'GSTN Returns (GSTR-1 / 3B / 2B)': 'GSTN विवरणपत्रे (GSTR-1 / 3B / 2B)',
  'e-Way Bill': 'ई-वे बिल',
  'GSTN Back Office — notices & orders': 'GSTN बॅक ऑफिस — नोटिसा व आदेश',
  'Departmental ERP': 'विभागीय ERP',
  'File movement & approvals': 'नस्ती हालचाल व मान्यता',
  'NIC e-Office': 'NIC ई-ऑफिस',
  'Derived by this platform': 'या मंचाने काढलेले',
  'GST registration granted': 'GST नोंदणी मंजूर',
  'Audit case opened': 'लेखापरीक्षा प्रकरण उघडले',
  'Refund claim filed': 'परतावा दावा दाखल',
  'Appeal filed': 'अपील दाखल',
  'Compliance alert raised': 'अनुपालन सूचना उठवली',
  'Section ': 'कलम ',
  'Review for closure — statutory period has expired':
    'निकालात काढण्यासाठी तपासा — सांविधिक मुदत संपली आहे',
  'Prioritise for officer review this week': 'या आठवड्यात अधिकारी पुनर्विलोकनासाठी प्राधान्य द्या',
  'Continue existing audit proceeding': 'सुरू असलेली लेखापरीक्षा कार्यवाही चालू ठेवा',
  'An audit case is already open and within its statutory window.':
    'लेखापरीक्षा प्रकरण आधीच उघडे असून सांविधिक मुदतीच्या आत आहे.',
  'No action required this cycle': 'या चक्रात कोणतीही कारवाई आवश्यक नाही',
  'No statutory deadline is near and no signal currently exceeds the review threshold.':
    'कोणतीही सांविधिक मुदत जवळ नाही आणि सध्या कोणताही संकेत पुनर्विलोकन उंबरठा ओलांडत नाही.'
})
