import { registerMessages } from '../../locale.js'

/**
 * Hindi — the prose carried by individual records: risk rules, the statutory
 * index, comparability dimensions, network lead indicators and the case twin's
 * source and recommendation vocabulary.
 *
 * Statutory citations stay in a form an officer can quote: the section and
 * notification numbers are written in Devanagari numerals where Hindi practice
 * does that, but the Act's short names (CGST/MGST) and the form names
 * (GSTR-1 / 3B / 2B) stay in Latin, because they are identifiers rather than
 * words. The sentence explaining what a provision covers is translated in full.
 *
 * Caveats are translated in full and never compressed. "This is a risk signal,
 * not evidence of evasion" is the sentence that keeps the platform lawful to
 * act on.
 *
 *   determinant     → निर्धारक
 *   evidential      → साक्ष्य-संबंधी
 *   Jaccard index   → जैकार्ड सूचकांक
 *   pass-through    → मध्यवर्ती
 *   dormant         → निष्क्रिय
 */
registerMessages('hi', {
  /* == Risk rule families ================================================= */
  'Filing Behaviour': 'विवरणी व्यवहार',
  'One or more return periods not filed within the statutory window.':
    'एक अथवा अधिक विवरणी अवधियाँ सांविधिक अवधि के भीतर दाखिल नहीं की गईं।',
  'Pattern of returns filed after due date across multiple periods.':
    'अनेक अवधियों में नियत तिथि के बाद विवरणी दाखिल करने की प्रवृत्ति।',
  'ITC Behaviour': 'ITC व्यवहार',
  'Input tax credit claimed materially exceeds trailing 6-month average.':
    'दावाकृत इनपुट कर श्रेय पिछले 6 माह के औसत से तात्त्विक रूप से अधिक है।',
  'Logistics Intelligence': 'माल परिवहन इंटेलिजेंस',
  'Declared e-way bill movement value is inconsistent with reported outward supply.':
    'घोषित ई-वे बिल परिवहन मूल्य दर्ज बहिर्गामी आपूर्ति से असंगत है।',
  'One or more upstream suppliers independently carry a High or Critical risk rating.':
    'एक अथवा अधिक पूर्ववर्ती आपूर्तिकर्ताओं पर स्वतंत्र रूप से उच्च अथवा अत्यंत गंभीर जोखिम श्रेणी है।',
  'Revenue Behaviour': 'राजस्व व्यवहार',
  'Tax payment has fallen sharply despite stable or rising turnover.':
    'कारोबार स्थिर अथवा बढ़ता रहने पर भी कर भुगतान तीव्रता से गिरा है।',
  'Refund Behaviour': 'प्रतिदाय व्यवहार',
  'Refund claimed as a proportion of turnover exceeds the sector benchmark band.':
    'कारोबार के अनुपात में दावाकृत प्रतिदाय क्षेत्रीय मानक वर्ग से अधिक है।',
  'Registration Behaviour': 'पंजीयन व्यवहार',
  'Entity registered within the last 12 months already transacting at high value.':
    'पिछले 12 माह में पंजीकृत इकाई अभी से उच्च मूल्य के लेनदेन कर रही है।',
  'Sector Behaviour': 'क्षेत्र व्यवहार',
  'Tax-to-turnover ratio deviates materially from peer sector median.':
    'कर-से-कारोबार अनुपात समकक्ष क्षेत्रीय मध्यक से तात्त्विक रूप से विचलित है।',
  'This score is a statistical risk signal derived from filing, payment and network patterns. It is not evidence of tax evasion and does not constitute an adverse finding. Verification by an authorised officer is mandatory before any action.':
    'यह अंक विवरणी, भुगतान और नेटवर्क प्रतिरूपों से निकाला गया सांख्यिकीय जोखिम संकेत है। यह कर अपवंचन का साक्ष्य नहीं है और न ही कोई प्रतिकूल निष्कर्ष है। किसी भी कार्रवाई से पूर्व प्राधिकृत अधिकारी द्वारा सत्यापन अनिवार्य है।',

  /* == Statutory index ==================================================== */
  'Section 73, CGST/MGST Act': 'धारा 73, CGST/MGST अधिनियम',
  'Tax not paid, short paid, or ITC wrongly availed — other than by fraud, wilful misstatement or suppression.':
    'कर का भुगतान न करना, कम करना, अथवा ITC का अनुचित उपयोग — कपट, जानबूझकर मिथ्या कथन अथवा तथ्य छिपाने के अतिरिक्त।',
  'Section 74, CGST/MGST Act': 'धारा 74, CGST/MGST अधिनियम',
  'Tax not paid, short paid, or ITC wrongly availed by reason of fraud, wilful misstatement or suppression of facts.':
    'कपट, जानबूझकर मिथ्या कथन अथवा तथ्यों को छिपाने के कारण कर का भुगतान न करना, कम करना, अथवा ITC का अनुचित उपयोग।',
  'Section 74A, CGST/MGST Act': 'धारा 74क, CGST/MGST अधिनियम',
  'Inserted by the Finance (No. 2) Act, 2024. Applies from FY 2024-25 and removes the fraud / non-fraud split for time limits.':
    'वित्त (सं. 2) अधिनियम, 2024 द्वारा अंतःस्थापित। वित्तीय वर्ष 2024-25 से लागू, और समय-सीमाओं हेतु कपट / कपट-रहित का विभाजन समाप्त करती है।',
  'Notification 09/2023-Central Tax, 31 March 2023': 'अधिसूचना 09/2023-केंद्रीय कर, 31 मार्च 2023',
  'Extended the s.73(10) order deadline for FY 2017-18, 2018-19 and 2019-20.':
    'वित्तीय वर्ष 2017-18, 2018-19 एवं 2019-20 हेतु धारा 73(10) के आदेश की समय-सीमा बढ़ाई।',
  'Notification 56/2023-Central Tax, 28 December 2023': 'अधिसूचना 56/2023-केंद्रीय कर, 28 दिसंबर 2023',
  'Further extended the s.73(10) order deadline for FY 2018-19 and 2019-20. HELD ULTRA VIRES s.168A by the Gauhati High Court and challenged elsewhere — a demand resting on this extension carries live litigation risk.':
    'वित्तीय वर्ष 2018-19 एवं 2019-20 हेतु धारा 73(10) के आदेश की समय-सीमा और बढ़ाई। गुवाहाटी उच्च न्यायालय ने इसे धारा 168क के परे घोषित किया है तथा अन्यत्र भी इसे चुनौती दी गई है — इस अवधि-विस्तार पर आधारित माँग पर जीवंत मुकदमे का जोखिम है।',
  Urgent: 'तत्काल',
  Watch: 'निगरानी',
  'In time': 'समय के भीतर',
  Order: 'आदेश',
  Notice: 'नोटिस',
  Unassigned: 'अनियत',

  /* == Comparability dimensions =========================================== */
  'similar risk patterns': 'समान जोखिम प्रतिरूप',
  'Order confirmed': 'आदेश पुष्ट',
  'Order reversed': 'आदेश निरस्त',
  'not assessable': 'निर्धारण-योग्य नहीं',
  'The single strongest determinant. Two cases turning on the same question are comparable however different the businesses are.':
    'यह अकेला सबसे प्रबल निर्धारक है। एक ही प्रश्न पर निर्भर दो प्रकरण, व्यवसाय चाहे कितने भी भिन्न हों, तुलनीय होते हैं।',
  'Department’s evidential position': 'विभाग की साक्ष्य-संबंधी स्थिति',
  'Recorded on the file at assessment. A case argued from a documentation gap behaves differently from one argued from a strong record, whatever the legal issue.':
    'निर्धारण के समय नस्ती पर दर्ज। दस्तावेजी कमी के आधार पर लड़ा गया प्रकरण, विधिक विषय चाहे कोई भी हो, सुदृढ़ अभिलेख के आधार पर लड़े गए प्रकरण से भिन्न व्यवहार करता है।',
  'Risk pattern': 'जोखिम प्रतिरूप',
  'Overlap of the encoded rules that fired, measured as a Jaccard index. Shapes how a case is evidenced without deciding it.':
    'लागू हुए संकेतबद्ध नियमों का पारस्परिक अतिव्यापन, जैकार्ड सूचकांक से मापा गया। प्रकरण का निर्णय किए बिना यह तय करता है कि वह किन साक्ष्यों पर खड़ा होता है।',
  'ITC behaviour': 'ITC व्यवहार',
  'Input credit claimed per rupee of turnover. Two cases with similar credit behaviour tend to raise similar evidential questions.':
    'प्रति रुपया कारोबार पर दावाकृत इनपुट श्रेय। समान श्रेय व्यवहार वाले दो प्रकरण प्रायः समान साक्ष्य-संबंधी प्रश्न उठाते हैं।',
  'Scale of the demand': 'माँग का परिमाण',
  'Order of magnitude of the amount in dispute. Affects the forum and the effort a taxpayer will spend defending, not the merits.':
    'विवादाधीन राशि का घातांक-स्तर। इससे न्यायमंच और करदाता बचाव में कितना श्रम लगाएगा यह तय होता है, गुण-दोष नहीं।',
  'Demands differ by more than two orders of magnitude': 'माँगों में दो घातांक-स्तर से अधिक का अंतर है',
  'Deliberately weighted low. Sector is the dimension that looks most relevant and predicts outcome least — it was the sole basis of an earlier version of this feature, which is why that version was removed. Kept visible so it can be seen to have been considered and discounted.':
    'जानबूझकर कम भार दिया गया। क्षेत्र वह आयाम है जो सर्वाधिक प्रासंगिक दिखता है और परिणाम की सबसे कम भविष्यवाणी करता है — इस सुविधा के पूर्व संस्करण का यही एकमात्र आधार था, और इसीलिए वह संस्करण हटा दिया गया। इसे दृश्य रखा गया है ताकि दिखे कि उस पर विचार करके उसे छोड़ा गया है।',
  'No concluded proceeding in the department’s record is comparable to this case on the dimensions that decide outcomes. Cases sharing only a sector are not comparable and are not offered as though they were.':
    'परिणाम तय करने वाले आयामों पर विभाग के अभिलेख की कोई भी निपटाई गई कार्यवाही इस प्रकरण से तुलनीय नहीं है। केवल क्षेत्र समान होने वाले प्रकरण तुलनीय नहीं होते और उन्हें ऐसा होने के रूप में प्रस्तुत नहीं किया जाता।',
  'Comparability is scored on the dimensions that can actually move an outcome, not on overall resemblance. The question of law and the department’s evidential position carry most of the weight; risk pattern, ITC behaviour and scale shape how a case is argued without deciding it; sector is kept at a deliberately small weight because it is the dimension that looks most relevant and predicts least. Every dimension’s contribution is shown, so the score can be disagreed with rather than merely trusted.':
    'तुलनीयता का अंकन समग्र समानता पर नहीं, बल्कि उन आयामों पर होता है जो वास्तव में परिणाम बदल सकते हैं। विधि का प्रश्न और विभाग की साक्ष्य-संबंधी स्थिति सर्वाधिक भार वहन करते हैं; जोखिम प्रतिरूप, ITC व्यवहार और परिमाण यह तय करते हैं कि प्रकरण कैसे लड़ा जाएगा, उसका निर्णय नहीं करते; क्षेत्र को जानबूझकर अल्प भार पर रखा गया है क्योंकि वह सर्वाधिक प्रासंगिक दिखने वाला और सबसे कम भविष्यवाणी करने वाला आयाम है। प्रत्येक आयाम का योगदान दिखाया गया है, ताकि अंक पर केवल भरोसा करने के बजाय उससे असहमत भी हुआ जा सके।',
  'These are what happened in prior proceedings, not a prediction about this one. Facts differ between cases sharing a question of law, and the distinguishing factors listed against each comparison are the reason the outcome there may not be the outcome here. Where too few comparable proceedings exist to support a rate, the individual outcomes are shown and no rate is given.':
    'ये पूर्ववर्ती कार्यवाहियों में जो हुआ वह है, इस प्रकरण के बारे में भविष्यवाणी नहीं। विधि का एक ही प्रश्न रखने वाले प्रकरणों में भी तथ्य भिन्न होते हैं, और प्रत्येक तुलना के सामने दिए भेद स्थापित करने वाले कारक ही वह कारण हैं कि वहाँ का परिणाम यहाँ वैसा न हो। जहाँ दर देने योग्य पर्याप्त तुलनीय कार्यवाहियाँ नहीं हैं, वहाँ अलग-अलग परिणाम दिखाए जाते हैं और कोई दर नहीं दी जाती।',

  /* == Network lead indicators ============================================ */
  'network intelligence': 'नेटवर्क इंटेलिजेंस',
  'Acts as the hub of the chain': 'शृंखला के केंद्र के रूप में कार्य करती है',
  'Sits at the centre of the invoice flow rather than at its edge.':
    'बीजक प्रवाह के छोर पर नहीं, बल्कि उसके केंद्र में है।',
  'Registered address shared across the cluster': 'समूह भर में पंजीकृत पता साझा',
  'Common premises across supposedly independent entities.':
    'कथित रूप से स्वतंत्र इकाइयों का परिसर एक ही।',
  'Contact details shared across the cluster': 'समूह भर में संपर्क विवरण साझा',
  'Common telephone or email across the cluster.': 'समूह में एक ही दूरभाष अथवा ईमेल।',
  'Dormant while invoicing': 'बीजक जारी करते हुए भी निष्क्रिय',
  'No filing activity in a period during which invoices were issued.':
    'जिस अवधि में बीजक जारी हुए, उसमें कोई विवरणी गतिविधि नहीं।',
  'Pass-through pattern — credit in, credit out, no value added':
    'मध्यवर्ती प्रतिरूप — श्रेय भीतर, श्रेय बाहर, कोई मूल्यवर्धन नहीं',
  'Inward and outward supply match closely with negligible tax paid in cash.':
    'आवक एवं जावक आपूर्ति निकटता से मेल खाती है और नकद में भुगतान किया गया कर नगण्य है।',
  'Whether a node is worth acting against is decided by re-running directed cycle detection on the chain with that node removed — not by a centrality score. Where a chord bypasses a node, the circulation survives its removal, so acting there spends the department’s one element of surprise on an entity whose absence changes nothing. Among the nodes whose removal does stop the chain, the ordering weights the value on their incident edges by lead strength, because a strong lead on a smaller node is a better opening than a weak one on a larger node that will not survive appeal.':
    'किसी इकाई पर कार्रवाई करने योग्य है या नहीं, यह केंद्रीयता अंक से नहीं, बल्कि उस इकाई को हटाकर शृंखला पर दिशिक चक्र पहचान पुनः चलाकर तय किया जाता है। जहाँ कोई आड़ी कड़ी उस इकाई को बगल से निकल जाती है, वहाँ उसे हटाने पर भी परिचलन बचा रहता है, इसलिए वहाँ कार्रवाई करने से विभाग का आकस्मिकता का एकमात्र लाभ ऐसी इकाई पर व्यर्थ जाता है जिसकी अनुपस्थिति से कुछ नहीं बदलता। जिन इकाइयों के हटने से शृंखला वास्तव में रुकती है, उनमें क्रम लगाते समय उनकी कड़ियों पर के मूल्य को सुराग की प्रबलता से भारित किया जाता है, क्योंकि छोटी इकाई पर प्रबल सुराग, अपील में न टिकने वाली बड़ी इकाई पर दुर्बल सुराग से बेहतर शुरुआत है।',
  'A chain is one economic unit and several jurisdictional ones. Every division a cluster touches needs an officer empowered to act, on the same date, because the first action warns the rest. Where a division in the span has no investigation officer posted, the cluster cannot be closed simultaneously at all — that is a deployment fact, not a scheduling one, and it is reported separately from the clusters that are merely hard to arrange.':
    'शृंखला आर्थिक रूप से एक इकाई है और अधिकारिता की दृष्टि से अनेक। समूह जिन-जिन विभागों को छूता है, वहाँ कार्रवाई हेतु सशक्त अधिकारी, वह भी एक ही तिथि पर, आवश्यक है — क्योंकि पहली कार्रवाई शेष को सचेत कर देती है। व्याप्ति के जिस विभाग में कोई अन्वेषण अधिकारी तैनात नहीं है, वहाँ वह समूह एक साथ बंद किया ही नहीं जा सकता — यह तैनाती का तथ्य है, अनुसूचन का नहीं, और इसे केवल व्यवस्था करने में कठिन समूहों से अलग दर्ज किया जाता है।',
  'Lead strength is a prioritisation aid built from linkage indicators this platform holds — shared premises, shared contact details, dormancy, position in the flow. It is not evidence and it is not a finding of fraud. Circular flow has innocent explanations, including genuine reciprocal trading between related businesses. Every entry here is a reason to investigate and must be substantiated independently before any action issues.':
    'सुराग की प्रबलता, मंच के पास उपलब्ध संबंध संकेतकों — साझा परिसर, साझा संपर्क विवरण, निष्क्रियता, प्रवाह में स्थान — से बनी प्राथमिकता-सहायता है। यह न साक्ष्य है और न कपट का निष्कर्ष। वर्तुलाकार प्रवाह के निर्दोष स्पष्टीकरण होते हैं, जिनमें संबंधित व्यवसायों के बीच वास्तविक पारस्परिक व्यापार भी सम्मिलित है। यहाँ की प्रत्येक प्रविष्टि अन्वेषण का कारण है और किसी भी कार्रवाई के जारी होने से पूर्व उसे स्वतंत्र रूप से प्रमाणित करना आवश्यक है।',

  /* == Case twin — sources, events and recommendations =================== */
  'GST Registration': 'GST पंजीयन',
  'GSTN Returns (GSTR-1 / 3B / 2B)': 'GSTN विवरणियाँ (GSTR-1 / 3B / 2B)',
  'e-Way Bill': 'ई-वे बिल',
  'GSTN Back Office — notices & orders': 'GSTN बैक ऑफिस — नोटिस एवं आदेश',
  'Departmental ERP': 'विभागीय ERP',
  'File movement & approvals': 'नस्ती संचलन एवं अनुमोदन',
  'NIC e-Office': 'NIC ई-ऑफिस',
  'Derived by this platform': 'इस मंच द्वारा निकाला गया',
  'GST registration granted': 'GST पंजीयन प्रदान',
  'Audit case opened': 'लेखापरीक्षा प्रकरण खोला गया',
  'Refund claim filed': 'प्रतिदाय दावा दाखिल',
  'Appeal filed': 'अपील दाखिल',
  'Compliance alert raised': 'अनुपालन सूचना उठाई गई',
  'Section ': 'धारा ',
  'Review for closure — statutory period has expired':
    'निपटान हेतु समीक्षा करें — सांविधिक अवधि समाप्त हो चुकी है',
  'Prioritise for officer review this week': 'इस सप्ताह अधिकारी समीक्षा हेतु प्राथमिकता दें',
  'Continue existing audit proceeding': 'चल रही लेखापरीक्षा कार्यवाही जारी रखें',
  'An audit case is already open and within its statutory window.':
    'लेखापरीक्षा प्रकरण पहले से खुला है और अपनी सांविधिक अवधि के भीतर है।',
  'No action required this cycle': 'इस चक्र में कोई कार्रवाई आवश्यक नहीं',
  'No statutory deadline is near and no signal currently exceeds the review threshold.':
    'कोई सांविधिक समय-सीमा निकट नहीं है और इस समय कोई संकेत समीक्षा देहली से अधिक नहीं है।'
})
