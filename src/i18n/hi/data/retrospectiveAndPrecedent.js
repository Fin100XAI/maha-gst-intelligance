import { registerMessages } from '../../locale.js'

/**
 * Hindi — retrospective.js and precedent.js.
 *
 * Court names, case names and SLP numbers stay exactly as published. "M/s
 * Barkataki Print and Media Services v. Union of India" and "SLP (C) No. 4240
 * of 2025" are the citation an officer puts in a notice; a translated version
 * of either would not find the judgment. Authority ids (AUTH-001) are record
 * keys, not words.
 *
 * The holdings are translated, because that is what the officer reads to decide
 * whether the authority helps. Where a holding could be confirmed but the case
 * name could not, the sentence saying so is translated in full — the refusal to
 * invent a citation is itself part of what the screen asserts.
 *
 *   holding            → निर्णय-सार
 *   ultra vires        → अधिकारातीत
 *   quashed            → अभिखंडित
 *   set aside          → अपास्त
 *   reserved           → सुरक्षित
 *   adjudication       → न्यायनिर्णयन
 *   contrast class     → विरोधी वर्ग
 *   separation         → पृथक्करण
 *   ground of decision → निर्णय का आधार
 */
registerMessages('hi', {
  /* == Retrospective — framing ========================================== */
  'What if this case had been handled differently': 'यदि यह प्रकरण भिन्न ढंग से निपटाया गया होता',
  'resembles fraud': 'कपट से समानता',
  'this was put down while something was still live in it':
    'इसमें कुछ अब भी जीवित रहते हुए ही इसे अलग रख दिया गया',
  'This is the recovery curve evaluated at a different day, not a judgement about anybody’s decisions. It says what the same action taken earlier would have been worth, which is arithmetic. It does not say what a different action would have been worth — escalation to a different section, a provisional attachment, a different forum — because that is a causal claim about a route never taken, and answering it needs outcome histories across comparable cases where each route was actually followed.':
    'यह भिन्न दिन पर मापा गया वसूली वक्र है, किसी के निर्णयों पर राय नहीं। यह केवल इतना बताता है कि वही कार्रवाई पहले की गई होती तो उसका मूल्य कितना होता, और यह अंकगणित है। भिन्न कार्रवाई का मूल्य कितना होता — किसी और धारा के अंतर्गत कार्यवाही, अनंतिम कुर्की, भिन्न न्यायमंच — यह वह नहीं बताता, क्योंकि वह कभी न लिए गए मार्ग के बारे में कारण-संबंधी दावा है, और उसका उत्तर देने के लिए ऐसे तुलनीय प्रकरणों के परिणाम-इतिहास चाहिए जिनमें प्रत्येक मार्ग वास्तव में अपनाया गया हो।',
  'The lag is reported in two parts because they have different owners and different fixes. Detection latency is how long before the signal could first be seen at all, and it is a data-feed problem — no amount of prioritisation shortens it. Queue dwell is how long the case then sat unworked, and it is a capacity and prioritisation problem, which is the part controllable this quarter. A single blended "average lag" figure hides which of the two to spend money on.':
    'विलंब दो भागों में दर्ज किया जाता है क्योंकि उनके उत्तरदायी भिन्न हैं और उपाय भी भिन्न। पहचान-विलंब यह है कि संकेत पहली बार दिखने में कितना समय लगता है, और यह स्रोत की समस्या है — कितनी भी प्राथमिकता उसे कम नहीं करती। पंक्ति का ठहराव यह है कि उसके बाद प्रकरण कितने समय बिना निपटे पड़ा रहा, और यह क्षमता एवं प्राथमिकता की समस्या है, अर्थात इसी तिमाही में नियंत्रण-योग्य भाग। एक मिश्रित "औसत विलंब" का आँकड़ा यह छिपा देता है कि दोनों में से किस पर धन लगाना है।',

  /* == Retrospective — revisit candidates =============================== */
  'Audit closed while risk rules were still firing':
    'जोखिम नियम लागू रहते हुए ही लेखापरीक्षा बंद',
  'No notice ever issued despite risk rules firing':
    'जोखिम नियम लागू होने पर भी कभी कोई नोटिस जारी नहीं',
  'These are cases put down while something in them was still live — an audit closed with risk rules still firing, or a taxpayer against whom no notice ever issued despite them. It is not an allegation and not a finding that anything was done wrongly: rules fire on behaviour that frequently has an innocent explanation, and an officer who closed one of these may well have had a reason that is not on the system. Time-barred periods are excluded, because revisiting them recovers nothing.':
    'ये ऐसे प्रकरण हैं जिन्हें उनमें कुछ अब भी जीवित रहते हुए अलग रख दिया गया — जोखिम नियम लागू रहते हुए बंद की गई लेखापरीक्षा, अथवा वह करदाता जिसके विरुद्ध उन नियमों के बावजूद कभी नोटिस जारी नहीं हुआ। यह न आरोप है और न यह निष्कर्ष कि कुछ गलत किया गया: नियम ऐसे व्यवहार पर लागू होते हैं जिसका प्रायः निर्दोष स्पष्टीकरण होता है, और इनमें से कोई प्रकरण बंद करने वाले अधिकारी के पास ऐसा कारण भी हो सकता है जो प्रणाली पर नहीं है। कालातीत अवधियाँ बाहर रखी गई हैं, क्योंकि उन्हें दोबारा देखने से कुछ वसूल नहीं होता।',
  'An audit case was opened and closed while these rules were still firing.':
    'ये नियम लागू रहते हुए ही लेखापरीक्षा प्रकरण खोला और बंद किया गया।',
  'No notice was ever issued against this taxpayer despite these rules firing.':
    'इन नियमों के लागू होने पर भी इस करदाता के विरुद्ध कभी नोटिस जारी नहीं हुआ।',
  'This is a review candidate, not a classification. Nothing here proposes Section 74 treatment: the department holds one concluded Section 74 proceeding, and no resemblance model can be built on a single example. Reclassification carries a longer limitation period and a heavier penalty and must be decided by an officer on the evidence, not suggested by a screen.':
    'यह समीक्षा उम्मीदवार है, वर्गीकरण नहीं। यहाँ कहीं भी धारा 74 के अंतर्गत निपटान नहीं सुझाया गया: विभाग के पास धारा 74 की एक ही निपटाई गई कार्यवाही है, और एक ही उदाहरण पर समानता का प्रारूप नहीं बनाया जा सकता। पुनर्वर्गीकरण के साथ लंबी परिसीमा अवधि और भारी शास्ति आती है, और उसे साक्ष्य के आधार पर अधिकारी को तय करना होता है, पर्दे को सुझाना नहीं।',

  /* == Retrospective — before reopening ================================= */
  'how much': 'कितना',
  'Establish the tax period and applicable section': 'कर अवधि एवं लागू धारा निश्चित करें',
  'Nothing can be reopened until the period is fixed, and the section decides how long there is to do it.':
    'अवधि निश्चित हुए बिना कुछ भी पुनः नहीं खोला जा सकता, और उसे करने के लिए कितना समय है यह धारा तय करती है।',
  'Compute the limitation date for that period': 'उस अवधि हेतु परिसीमा तिथि परिकलित करें',
  'A period already expired cannot be revisited whatever the evidence shows.':
    'जो अवधि पहले ही समाप्त हो चुकी है, साक्ष्य चाहे कुछ भी दिखाए, उसे दोबारा नहीं देखा जा सकता।',
  'Retrieve the evidence the closure rested on': 'जिस साक्ष्य पर प्रकरण बंद हुआ वह प्राप्त करें',
  'The officer who closed it may have had a reason that never reached the system.':
    'उसे बंद करने वाले अधिकारी के पास ऐसा कारण हो सकता है जो प्रणाली तक कभी पहुँचा ही नहीं।',
  'Re-quantify the exposure against current returns':
    'वर्तमान विवरणियों के सापेक्ष जोखिम राशि पुनः आँकें',
  'The figure below is a risk-model estimate, not an assessed demand.':
    'नीचे दिया आँकड़ा जोखिम प्रारूप का आकलन है, निर्धारित माँग नहीं।',

  /* == Retrospective — the Section 74 refusal ========================== */
  'Reclassification under Section 74 carries a longer limitation period and a substantially heavier penalty, and must be sustained on evidence of suppression or wilful misstatement. A model proposing it has to be defensible in appeal. On one example it would not survive the first hearing.':
    'धारा 74 के अंतर्गत पुनर्वर्गीकरण के साथ लंबी परिसीमा अवधि और काफी भारी शास्ति आती है, और उसे तथ्य छिपाने अथवा जानबूझकर मिथ्या कथन के साक्ष्य पर टिकना होता है। उसे सुझाने वाला प्रारूप अपील में बचाव-योग्य होना चाहिए। एक ही उदाहरण पर वह पहली सुनवाई भी नहीं झेलेगा।',
  'At least five concluded Section 74 proceedings, and ideally several times that, so the pattern has variation to learn from rather than a single case to memorise.':
    'धारा 74 की कम से कम पाँच निपटाई गई कार्यवाहियाँ, और आदर्शतः उससे कई गुना, ताकि प्रारूप को रटने हेतु एक ही प्रकरण न मिलकर सीखने हेतु विविधता मिले।',
  'The adjudication outcome on each, so the model learns from cases that were SUSTAINED as fraud rather than merely alleged as fraud — those are different populations and conflating them would train it to reproduce the department’s charging habits rather than its wins.':
    'प्रत्येक पर न्यायनिर्णयन का परिणाम, ताकि प्रारूप केवल कपट के रूप में आरोपित नहीं, बल्कि कपट के रूप में टिके प्रकरणों से सीखे — ये भिन्न समुच्चय हैं और उन्हें मिलाने पर प्रारूप विभाग की जीतों के बजाय उसकी आरोप लगाने की आदतों की पुनरावृत्ति करना सीखेगा।',
  'The evidence actually relied on in each order, not just the section quoted, so resemblance is measured on what proved the case rather than on how it was labelled.':
    'प्रत्येक आदेश में वास्तव में जिस साक्ष्य पर भरोसा किया गया वह, केवल उद्धृत धारा नहीं, ताकि समानता इस पर मापी जाए कि प्रकरण किससे सिद्ध हुआ, न कि उस पर क्या लेबल लगा।',
  'This is the capability most worth having and the one furthest from being possible. It is left unbuilt rather than approximated, because an approximate version would produce confident Section 74 review candidates from noise, and an officer would act on them.':
    'यह सर्वाधिक वांछनीय क्षमता है और संभव होने से सबसे दूर भी वही है। उसे अनुमान से बनाने के बजाय अनिर्मित छोड़ा गया है, क्योंकि अनुमानित संस्करण शोर से आत्मविश्वासपूर्ण धारा 74 समीक्षा उम्मीदवार गढ़ देगा, और अधिकारी उन पर कार्रवाई कर देगा।',

  /* == Retrospective — the separation test ============================= */
  'charged as fraud': 'कपट के रूप में आरोपित',
  'SUSTAINED on appeal': 'अपील में टिके',
  'resembles a case we won': 'हमारे जीते प्रकरण से समानता',
  'Risk rules firing': 'लागू होते जोखिम नियम',
  'ITC claimed / turnover': 'दावाकृत ITC / कारोबार',
  'Tax paid / turnover': 'भुगतान किया गया कर / कारोबार',
  'Member of a detected chain': 'पहचानी गई शृंखला का सदस्य',
  'The features do not separate. Cases the department won look like cases in general on every feature measured, so a model asking "does this resemble a case we won" would answer yes to nearly everything and rank the rest by noise.':
    'लक्षण पृथक्करण नहीं करते। मापे गए प्रत्येक लक्षण पर विभाग के जीते प्रकरण सामान्य प्रकरणों जैसे ही दिखते हैं, इसलिए "क्या यह हमारे जीते प्रकरण जैसा है" पूछने वाला प्रारूप लगभग हर चीज़ को हाँ कहेगा और शेष का क्रम शोर से लगाएगा।',
  'A weak separation would be a sample-size problem and more cases would fix it. No separation is a feature problem, and a thousand cases described by these same fields would still look alike. The fields describe a taxpayer; they do not describe why a demand held up.':
    'दुर्बल पृथक्करण नमूने के आकार की समस्या होती और अधिक प्रकरणों से सुलझ जाती। पृथक्करण का बिल्कुल न होना लक्षणों की समस्या है, और इन्हीं स्तंभों से वर्णित हज़ार प्रकरण भी एक जैसे ही दिखेंगे। ये स्तंभ करदाता का वर्णन करते हैं; वे यह वर्णन नहीं करते कि माँग क्यों टिकी।',
  'The evidence relied on in each order — what was produced, what was accepted, and what the taxpayer could not explain. This is the only field that describes why a demand held up rather than who the taxpayer was.':
    'प्रत्येक आदेश में जिस साक्ष्य पर भरोसा किया गया वह — क्या प्रस्तुत हुआ, क्या स्वीकार हुआ, और करदाता क्या स्पष्ट नहीं कर सका। करदाता कौन था, इसके बजाय माँग क्यों टिकी, यह वर्णन करने वाला यही एकमात्र स्तंभ है।',
  'A contrast class of comparable size. Wins alone cannot teach discrimination; the reversals and remands are where the signal about what fails actually lives.':
    'तुलनीय आकार का विरोधी वर्ग। केवल जीतों से भेद करना नहीं सिखाया जा सकता; क्या विफल होता है इसका संकेत वास्तव में निरस्त और पुनर्विचार हेतु प्रतिप्रेषित प्रकरणों में बसता है।',
  'The ground on which each case was decided, so outcomes turning on limitation or procedure are separated from those decided on merits. Mixing them trains the model on two different questions at once.':
    'प्रत्येक प्रकरण जिस आधार पर तय हुआ वह, ताकि परिसीमा अथवा प्रक्रिया पर निर्भर परिणाम, गुण-दोष पर तय हुए परिणामों से अलग रहें। उन्हें मिलाने पर प्रारूप एक साथ दो भिन्न प्रश्नों पर सीखता है।',

  /* == Retrospective — the four scenarios ============================== */
  'Acted the day the behaviour occurred': 'जिस दिन व्यवहार हुआ उसी दिन कार्रवाई',
  'Not achievable — the return that reveals it has not been filed yet. Shown as the ceiling.':
    'प्राप्य नहीं — उसे उजागर करने वाली विवरणी अभी दाखिल ही नहीं हुई। अधिकतम सीमा के रूप में दिखाया गया।',
  'Acted the day the signal first became visible': 'जिस दिन संकेत पहली बार दिखा उसी दिन कार्रवाई',
  'The earliest the department could have known. This is the realistic best case.':
    'विभाग को जितनी जल्दी पता चल सकता था। यही यथार्थवादी सर्वोत्तम स्थिति है।',
  'Acted within 30 days of the signal': 'संकेत के 30 दिनों के भीतर कार्रवाई',
  'A service standard the department could set and staff to.':
    'ऐसा सेवा मानक जो विभाग निर्धारित कर सकता है और जिसके अनुसार कर्मचारी लगा सकता है।',
  'What actually happened': 'वास्तव में क्या हुआ',
  'Every scenario above is the same action taken on a different day. None of them models a different action — escalation to another section, a provisional attachment, a different forum — because that is a causal claim about a route never taken, and it needs outcome histories across comparable cases where each route was actually followed.':
    'ऊपर की प्रत्येक स्थिति वही कार्रवाई है, भिन्न दिन पर की गई। इनमें से कोई भी भिन्न कार्रवाई का प्रारूप नहीं बनाता — किसी और धारा के अंतर्गत कार्यवाही, अनंतिम कुर्की, भिन्न न्यायमंच — क्योंकि वह कभी न लिए गए मार्ग के बारे में कारण-संबंधी दावा है, और उसके लिए ऐसे तुलनीय प्रकरणों के परिणाम-इतिहास चाहिए जिनमें प्रत्येक मार्ग वास्तव में अपनाया गया हो।',

  /* == Precedent — forums ============================================== */
  'Supreme Court of India': 'भारत का उच्चतम न्यायालय',
  'Binds every court and authority in India under Article 141.':
    'अनुच्छेद 141 के अंतर्गत भारत के प्रत्येक न्यायालय एवं प्राधिकारी पर बाध्यकारी।',
  'Bombay High Court': 'बंबई उच्च न्यायालय',
  'The jurisdictional High Court for Maharashtra. Binding on all authorities within the state.':
    'महाराष्ट्र हेतु अधिकारिता वाला उच्च न्यायालय। राज्य के सभी प्राधिकारियों पर बाध्यकारी।',
  'High Court (other State)': 'उच्च न्यायालय (अन्य राज्य)',
  'Persuasive only. May be relied on in argument but does not bind a Maharashtra authority.':
    'केवल मार्गदर्शक। तर्क में उस पर भरोसा किया जा सकता है, किंतु वह महाराष्ट्र के प्राधिकारी पर बाध्यकारी नहीं।',
  'Appellate Tribunal': 'अपीलीय अधिकरण',
  'Persuasive at adjudication level; binding on subordinate authorities within its own jurisdiction.':
    'न्यायनिर्णयन स्तर पर मार्गदर्शक; अपनी अधिकारिता के भीतर अधीनस्थ प्राधिकारियों पर बाध्यकारी।',
  'Departmental Appellate Authority': 'विभागीय अपीलीय प्राधिकारी',
  'Not precedent. Useful as departmental practice, not as authority.':
    'पूर्वनिर्णय नहीं। विभागीय प्रथा के रूप में उपयोगी, प्राधिकार के रूप में नहीं।',
  'Adjudication order': 'न्यायनिर्णयन आदेश',
  'Not precedent in any sense. Records how one case was decided on its own facts.':
    'किसी भी अर्थ में पूर्वनिर्णय नहीं। एक प्रकरण अपने ही तथ्यों पर कैसे तय हुआ, इसका अभिलेख।',

  /* == Precedent — status ============================================== */
  Stands: 'टिका हुआ',
  'No known challenge. May be relied on subject to the usual forum rules.':
    'कोई ज्ञात चुनौती नहीं। न्यायमंच के सामान्य नियमों के अधीन उस पर भरोसा किया जा सकता है।',
  'Under challenge': 'चुनौती के अधीन',
  'The question is before a higher forum. Relying on this creates exposure if the decision goes the other way.':
    'यह प्रश्न उच्चतर न्यायमंच के समक्ष है। निर्णय विपरीत जाने पर इस पर भरोसा करने से जोखिम बनता है।',
  'Conflicting authority': 'परस्पर विरोधी प्राधिकार',
  'Other courts of equal rank have decided the opposite. The question is unsettled.':
    'समान स्तर के अन्य न्यायालयों ने इसके विपरीत निर्णय दिया है। प्रश्न अनिर्णीत है।',
  'Reversed / set aside': 'निरस्त / अपास्त',
  'No longer good law. Must not be relied on.': 'यह अब प्रमाण विधि नहीं है। इस पर भरोसा नहीं करना चाहिए।',

  /* == Precedent — the verified authorities ============================= */
  'Gauhati High Court': 'गुवाहाटी उच्च न्यायालय',
  'Patna High Court': 'पटना उच्च न्यायालय',
  'Allahabad High Court': 'इलाहाबाद उच्च न्यायालय',
  'Notification 56/2023-CT is ultra vires Section 168A of the CGST Act, having been issued without the mandatory prior recommendation of the GST Council. Orders passed beyond the unextended limitation period were quashed.':
    'GST परिषद की अनिवार्य पूर्व सिफारिश के बिना जारी होने के कारण अधिसूचना 56/2023-CT, CGST अधिनियम की धारा 168क के अधिकारातीत है। न बढ़ाई गई परिसीमा अवधि के बाद पारित आदेश अभिखंडित किए गए।',
  'Case name and holding confirmed from published reports.':
    'प्रकरण का नाम एवं निर्णय-सार प्रकाशित वृत्तांतों से पुष्ट।',
  'Upheld the validity of Notification 56/2023-CT, taking the opposite view to the Gauhati High Court on the same question.':
    'अधिसूचना 56/2023-CT की वैधता कायम रखी, और उसी प्रश्न पर गुवाहाटी उच्च न्यायालय से विपरीत मत लिया।',
  'Holding confirmed from published reports; case name and date not established, and are deliberately not stated.':
    'निर्णय-सार प्रकाशित वृत्तांतों से पुष्ट; प्रकरण का नाम एवं तिथि निश्चित नहीं हो सकी, और उन्हें जानबूझकर नहीं बताया गया।',
  'Upheld the validity of Notification 09/2023-CT extending the limitation period under Section 73.':
    'धारा 73 के अंतर्गत परिसीमा अवधि बढ़ाने वाली अधिसूचना 09/2023-CT की वैधता कायम रखी।',
  'Judgment reserved on whether the adjudication time limit under Section 73 may be extended by notification under Section 168A. Will settle the conflict between the High Courts and bind all authorities once delivered.':
    'धारा 73 के अंतर्गत न्यायनिर्णयन की समय-सीमा धारा 168क के अंतर्गत अधिसूचना द्वारा बढ़ाई जा सकती है या नहीं, इस पर निर्णय सुरक्षित है। निर्णय आने पर वह उच्च न्यायालयों का मतभेद सुलझाएगा और सभी प्राधिकारियों पर बाध्यकारी होगा।',
  'SLP number, parties and reserved status confirmed from published reports.':
    'SLP क्रमांक, पक्षकार एवं निर्णय सुरक्षित होने की स्थिति प्रकाशित वृत्तांतों से पुष्ट।',

  /* == Precedent — the question and its consequences ==================== */
  'May the adjudication time limit under Section 73 be extended by notification under Section 168A?':
    'क्या धारा 73 के अंतर्गत न्यायनिर्णयन की समय-सीमा धारा 168क के अंतर्गत अधिसूचना द्वारा बढ़ाई जा सकती है?',
  'Every proceeding whose limitation date rests on Notification 09/2023-CT or 56/2023-CT.':
    'प्रत्येक ऐसी कार्यवाही जिसकी परिसीमा तिथि अधिसूचना 09/2023-CT अथवा 56/2023-CT पर आधारित है।',
  'If the notifications fall, the extended deadlines fall with them and any order passed after the unextended date is void. The exposure is not a risk of losing on merits — it is a risk of the demand never having been validly raised.':
    'यदि ये अधिसूचनाएँ गिरती हैं तो बढ़ाई गई समय-सीमाएँ भी उनके साथ गिरती हैं और न बढ़ाई गई तिथि के बाद पारित कोई भी आदेश शून्य हो जाता है। यह जोखिम गुण-दोष पर हारने का नहीं — यह जोखिम इस बात का है कि माँग कभी विधिमान्य रूप से खड़ी ही नहीं हुई थी।',
  'Unsettled — before the Supreme Court': 'अनिर्णीत — उच्चतम न्यायालय के समक्ष',
  'No binding authority applies in Maharashtra, High Courts have taken opposite views, and the Supreme Court has reserved judgment. Proceedings that depend on this question carry live risk until it is delivered.':
    'महाराष्ट्र में कोई बाध्यकारी प्राधिकार लागू नहीं होता, उच्च न्यायालयों ने विपरीत मत लिए हैं, और उच्चतम न्यायालय ने निर्णय सुरक्षित रखा है। इस प्रश्न पर निर्भर कार्यवाहियों पर निर्णय आने तक जीवंत जोखिम बना रहता है।',
  'Unsettled — conflicting authority': 'अनिर्णीत — परस्पर विरोधी प्राधिकार',
  'High Courts of equal rank have decided the question both ways and none of them binds Maharashtra.':
    'समान स्तर के उच्च न्यायालयों ने इस प्रश्न को दोनों तरह से तय किया है और उनमें से कोई भी महाराष्ट्र पर बाध्यकारी नहीं है।',
  'Authority exists but none of it binds a Maharashtra authority.':
    'प्राधिकार मौजूद है किंतु उनमें से कोई भी महाराष्ट्र के प्राधिकारी पर बाध्यकारी नहीं है।',
  'The extended deadline never existed. Any order passed after the unextended date was void when made, and demand already collected under it is liable to be refunded.':
    'बढ़ाई गई समय-सीमा कभी अस्तित्व में थी ही नहीं। न बढ़ाई गई तिथि के बाद पारित कोई भी आदेश बनाते समय ही शून्य था, और उसके अंतर्गत पहले से वसूली गई माँग प्रतिदेय है।',
  'The extension stands and these proceedings were validly within time.':
    'अवधि-विस्तार टिकता है और ये कार्यवाहियाँ विधिमान्य रूप से समय के भीतर थीं।',

  /* == Precedent — the limits of what is shown ========================= */
  'match score': 'मेल अंक',
  'Facts differ between proceedings on the same issue; a matching legal question is not a matching case.':
    'एक ही विषय की कार्यवाहियों में भी तथ्य भिन्न होते हैं; विधिक प्रश्न का मेल खाना प्रकरण का मेल खाना नहीं है।',
  'Departmental outcomes reflect how these cases were argued and evidenced, not what a court would hold on different facts.':
    'विभागीय परिणाम यह दर्शाते हैं कि ये प्रकरण कैसे लड़े गए और उनका साक्ष्य क्या था, न कि यह कि भिन्न तथ्यों पर न्यायालय क्या तय करेगा।',
  'None of the entries below is judicial authority. They are this department’s own decisions.':
    'नीचे की कोई भी प्रविष्टि न्यायिक प्राधिकार नहीं है। ये इसी विभाग के अपने निर्णय हैं।',
  'Departmental order and appellate archive': 'विभागीय आदेश एवं अपीलीय संग्रह',
  'Real precedent retrieval requires the department’s order corpus — adjudication orders, appellate decisions and their subsequent history — indexed and citable to paragraph. That archive is not connected to this build. What is shown below is (a) this department’s own concluded proceedings, which is institutional memory rather than authority, and (b) a small set of externally verified judgments included to demonstrate how authority is weighted. Matching cases on sector or on text similarity is not precedent and is not offered.':
    'वास्तविक पूर्वनिर्णय प्राप्ति के लिए विभाग का आदेश संग्रह — न्यायनिर्णयन आदेश, अपीलीय निर्णय एवं उनका आगे का इतिहास — अनुक्रमित और अनुच्छेद तक उद्धरण-योग्य होना चाहिए। वह संग्रह इस निर्माण से जुड़ा नहीं है। नीचे जो दिखाया गया है वह है (क) इसी विभाग की अपनी निपटाई गई कार्यवाहियाँ, जो प्राधिकार नहीं बल्कि संस्थागत स्मृति हैं, और (ख) प्राधिकार का भार कैसे तय होता है यह दिखाने हेतु सम्मिलित बाहर से सत्यापित कुछ निर्णय। क्षेत्र अथवा पाठ की समानता पर प्रकरण मिलाना पूर्वनिर्णय नहीं है और वह यहाँ नहीं दिया गया।'
})
