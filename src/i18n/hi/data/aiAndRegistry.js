import { registerMessages } from '../../locale.js'

/**
 * Hindi — ai.js, copilot.js and engineRegistry.js: the generated-draft
 * scaffolding, the copilot's grounded questions and its refusals, and the
 * engine registry where each engine states the one question it owns.
 *
 * Return and form identifiers stay in Latin throughout — GSTR-1, GSTR-3B,
 * GSTR-2B, GSTR-2A, RFD-01. An officer reconciling returns works from those
 * codes, and a translated form name would not match anything on the portal.
 *
 * The copilot's refusals are translated in full along with the feed that would
 * be needed to lift each one. The note that an earlier version generated a
 * plausible reply and that the output was removed is kept intact: it records a
 * decision, not a limitation.
 *
 *   grounded      → अभिलेख-आधारित
 *   corpus        → संग्रह
 *   granularity   → सूक्ष्मता
 *   aggregate     → समेकित आँकड़ा
 *   deduplication → दोहरी प्रविष्टि हटाना
 *   cut-point     → छेदन बिंदु
 */
registerMessages('hi', {
  /* == Generated drafts — evidence lists ================================= */
  'Commissioner Daily Brief — AI-Generated Draft': 'आयुक्त दैनिक टिप्पणी — AI-निर्मित प्रारूप',
  'State revenue trend (24 months)': 'राज्य राजस्व प्रवृत्ति (24 माह)',
  'Taxpayer risk register': 'करदाता जोखिम पंजी',
  'District-wise audit recovery pipeline': 'जिलावार लेखापरीक्षा वसूली शृंखला',
  'Compliance early-warning feed': 'अनुपालन पूर्वसूचना प्रवाह',
  'Case risk profile': 'प्रकरण जोखिम विवरण',
  'Triggered risk rules for this taxpayer': 'इस करदाता पर लागू हुए जोखिम नियम',
  'refer to case risk summary': 'प्रकरण जोखिम सारांश देखें',
  'Case risk explanation': 'प्रकरण जोखिम स्पष्टीकरण',
  'Statutory time computation for this tax period': 'इस कर अवधि हेतु सांविधिक समय गणना',
  'Case filing record': 'प्रकरण दाखिल अभिलेख',
  'Stage and disputed amount on this appeal': 'इस अपील का चरण एवं विवादित राशि',
  'Compliance early-warning signal': 'अनुपालन पूर्वसूचना संकेत',
  '[English Summary]': '[अंग्रेज़ी सारांश]',
  'SMS + Email': 'SMS + ईमेल',

  /* == Audit checklist =================================================== */
  'Verify GSTR-1 vs GSTR-3B reconciliation for the disputed period(s)':
    'विवादित अवधि हेतु GSTR-1 और GSTR-3B का मिलान सत्यापित करें',
  'Cross-check ITC claimed against supplier GSTR-2B / GSTR-2A':
    'दावाकृत ITC को आपूर्तिकर्ता के GSTR-2B / GSTR-2A से मिलाकर जाँचें',
  'Review e-way bill movement against declared outward supply value':
    'घोषित बहिर्गामी आपूर्ति मूल्य के सापेक्ष ई-वे बिल परिवहन की समीक्षा करें',
  'Examine bank statements for payment trail consistency':
    'भुगतान शृंखला की संगति हेतु बैंक विवरण जाँचें',
  'Confirm principal place of business through field/desk verification':
    'क्षेत्रीय / कार्यालयीन सत्यापन से व्यवसाय का मुख्य स्थान पुष्ट करें',
  'Trace top 5 counterparties for common ownership, address or contact indicators':
    'साझा स्वामित्व, पते अथवा संपर्क संकेतकों हेतु शीर्ष 5 प्रतिपक्षों का पता लगाएँ',
  'Request stock/inventory register where applicable to validate supply chain':
    'आपूर्ति शृंखला की पुष्टि हेतु जहाँ लागू हो वहाँ स्टॉक / माल-सूची पंजी माँगें',

  /* == Refund checklist ================================================== */
  'Verify refund application (RFD-01) against GSTR-1/3B filed for the claim period':
    'दावा अवधि हेतु दाखिल GSTR-1/3B के सापेक्ष प्रतिदाय आवेदन (RFD-01) सत्यापित करें',
  'Reconcile ITC accumulation with eligible input tax credit ledger':
    'संचित ITC का पात्र इनपुट कर श्रेय बहीखाते से मिलान करें',
  'Cross-verify export/zero-rated supply documentation where applicable':
    'जहाँ लागू हो वहाँ निर्यात / शून्य-दर आपूर्ति के दस्तावेज मिलाकर सत्यापित करें',
  'Check supplier-chain risk rating for top ITC-contributing counterparties':
    'सर्वाधिक ITC देने वाले प्रतिपक्षों हेतु आपूर्ति-शृंखला जोखिम श्रेणी जाँचें',
  'Validate bank account and previous refund disbursal history':
    'बैंक खाता एवं पूर्व प्रतिदाय संवितरण का इतिहास सत्यापित करें',
  'Refer for pre-refund physical/desk verification prior to sanction':
    'मंजूरी से पूर्व प्रतिदाय-पूर्व भौतिक / कार्यालयीन सत्यापन हेतु भेजें',
  'Refund-to-turnover ratio': 'प्रतिदाय-से-कारोबार अनुपात',
  'Sector refund benchmark': 'क्षेत्रीय प्रतिदाय मानक',
  'Supplier risk profile': 'आपूर्तिकर्ता जोखिम विवरण',
  ' The system does not auto-reject or auto-sanction any refund claim.':
    ' यह प्रणाली किसी भी प्रतिदाय दावे को स्वतः अस्वीकृत अथवा स्वतः मंजूर नहीं करती।',

  /* == Litigation summary =============================================== */
  Weak: 'कमजोर',
  'Recommend strengthening documentary evidence and legal reasoning before next hearing.':
    'अगली सुनवाई से पूर्व दस्तावेजी साक्ष्य एवं विधिक तर्क सुदृढ़ करने की सिफारिश।',
  'Current documentation and legal position appear adequately supported.':
    'वर्तमान दस्तावेजीकरण एवं विधिक स्थिति पर्याप्त रूप से समर्थित प्रतीत होती है।',

  /* == Suggested questions to the taxpayer ============================== */
  'Please explain the basis for the input tax credit claimed in excess of the sector-typical range.':
    'क्षेत्र की सामान्य सीमा से अधिक इनपुट कर श्रेय किस आधार पर दावा किया गया, कृपया स्पष्ट करें।',
  'Provide a reconciliation of e-way bill movement value against declared outward supply for the period in question.':
    'संबंधित अवधि हेतु घोषित बहिर्गामी आपूर्ति के सापेक्ष ई-वे बिल परिवहन मूल्य का मिलान प्रस्तुत करें।',
  'Clarify the relationship, if any, with counterparty entities flagged under linked-risk review.':
    'संबद्ध-जोखिम समीक्षा में चिह्नित प्रतिपक्ष इकाइयों से कोई संबंध हो तो उसे स्पष्ट करें।',
  'Explain the reason for the variance between turnover growth and corresponding tax payment trend.':
    'कारोबार की वृद्धि और तदनुरूप कर भुगतान की प्रवृत्ति के बीच अंतर का कारण स्पष्ट करें।',
  'No closely comparable cases found in the current dataset.':
    'वर्तमान आँकड़ा-समुच्चय में निकटता से तुलनीय कोई प्रकरण नहीं मिला।',

  /* == Copilot — the grounded questions ================================= */
  '), cited corpora that do not exist (': '), अस्तित्वहीन संग्रह उद्धृत किए (',
  'What is this taxpayer’s current position?': 'इस करदाता की वर्तमान स्थिति क्या है?',
  'Why is this case a priority?': 'यह प्रकरण प्राथमिकता में क्यों है?',
  'What actions remain pending?': 'कौन-सी कार्रवाइयाँ लंबित हैं?',
  'What has happened on this case?': 'इस प्रकरण में अब तक क्या हुआ है?',
  'Is this taxpayer linked to others?': 'क्या यह करदाता अन्य से जुड़ा है?',
  'What contradictions exist between GSTR-1, GSTR-3B and 2B?':
    'GSTR-1, GSTR-3B और 2B के बीच कौन-से विरोधाभास हैं?',
  'Show comparable previous orders': 'तुलनीय पूर्व आदेश दिखाएँ',
  'Summarise the taxpayer’s reply': 'करदाता के उत्तर का सारांश दें',
  'not available': 'उपलब्ध नहीं',

  /* == Copilot — the refusals and what each would need ================== */
  'This requires return data at line-item level — outward supplies from GSTR-1, tax paid from GSTR-3B, and auto-populated credit from GSTR-2B for each tax period.':
    'इसके लिए पंक्ति-स्तर की विवरणी आँकड़े चाहिए — प्रत्येक कर अवधि हेतु GSTR-1 से बहिर्गामी आपूर्ति, GSTR-3B से भुगतान किया गया कर, और GSTR-2B से स्वतः भरा गया श्रेय।',
  'A GSTN returns feed at invoice or line-item granularity. The platform currently holds only period aggregates, which cannot evidence a specific contradiction.':
    'बीजक अथवा पंक्ति-स्तर की सूक्ष्मता वाला GSTN विवरणी स्रोत। मंच के पास इस समय केवल अवधि के समेकित आँकड़े हैं, जिनसे किसी विशिष्ट विरोधाभास को प्रमाणित नहीं किया जा सकता।',
  'This requires the departmental archive of previous orders, appellate decisions and their outcomes.':
    'इसके लिए पूर्व आदेशों, अपीलीय निर्णयों एवं उनके परिणामों का विभागीय संग्रह चाहिए।',
  'The order and appeal corpus, indexed and retrievable to paragraph. Matching on sector alone — which is all the current data supports — is not comparable precedent and must not be presented as one. The brief above already carries what can be grounded without that corpus: any binding or persuasive authority on a question of law this case turns on, and the department’s own record on the same question where enough proceedings have concluded to state one.':
    'आदेश एवं अपील संग्रह, अनुक्रमित और अनुच्छेद तक प्राप्य। केवल क्षेत्र पर मिलान — और वर्तमान आँकड़े इतना ही संभव करते हैं — तुलनीय पूर्वनिर्णय नहीं है और उसे वैसा प्रस्तुत नहीं किया जाना चाहिए। उस संग्रह के बिना जिसे अभिलेख का आधार दिया जा सकता है, वह ऊपर की टिप्पणी में पहले से है: यह प्रकरण विधि के जिस प्रश्न पर निर्भर है उस पर कोई भी बाध्यकारी अथवा मार्गदर्शक प्राधिकार, और उसी प्रश्न पर पर्याप्त कार्यवाहियाँ निपटी हों तो विभाग का अपना अभिलेख।',
  'No reply document is held against this case. The platform has the notice and its status, but not the taxpayer’s submission or its annexures.':
    'इस प्रकरण के विरुद्ध कोई उत्तर दस्तावेज नहीं रखा गया है। मंच के पास नोटिस और उसकी स्थिति है, किंतु करदाता का अभ्यावेदन अथवा उसके संलग्नक नहीं।',
  'Reply documents and correspondence from the Back Office case file. An earlier version of this copilot generated a plausible reply here; that output has been removed.':
    'बैक ऑफिस प्रकरण नस्ती से उत्तर दस्तावेज एवं पत्राचार। इस सहप्रचालक के पूर्व संस्करण ने यहाँ विश्वसनीय प्रतीत होने वाला उत्तर गढ़ दिया था; वह निर्गम हटा दिया गया है।',

  /* == Copilot — citation sources and the closing note ================== */
  'Filing record': 'विवरणी अभिलेख',
  'Risk computation': 'जोखिम गणना',
  'Recovery model': 'वसूली प्रारूप',
  'Risk rule set': 'जोखिम नियम समुच्चय',
  'No risk rule currently fires for this taxpayer.':
    'इस करदाता पर इस समय कोई जोखिम नियम लागू नहीं होता।',
  'No open proceeding is recorded against this taxpayer.':
    'इस करदाता के विरुद्ध कोई लंबित कार्यवाही दर्ज नहीं है।',
  'Case record': 'प्रकरण अभिलेख',
  'This taxpayer is not a member of any flagged network cluster in the current dataset.':
    'वर्तमान आँकड़ा-समुच्चय के किसी भी चिह्नित नेटवर्क समूह का यह करदाता सदस्य नहीं है।',
  'Network cluster index': 'नेटवर्क समूह अनुक्रमणिका',
  'Cluster membership is a statistical signal derived from linkage indicators. It is not evidence of fraud and requires verification by the Investigation Team.':
    'समूह की सदस्यता संबंध संकेतकों से निकाला गया सांख्यिकीय संकेत है। यह कपट का साक्ष्य नहीं है और इसके लिए अन्वेषण दल द्वारा सत्यापन आवश्यक है।',
  'Limitation note': 'परिसीमा संबंधी टिप्पणी',
  'This copilot retrieves from the case record. It does not generate legal content, and every statement above cites the record and source system behind it. Questions it cannot ground are declined rather than answered approximately.':
    'यह सहप्रचालक प्रकरण अभिलेख से जानकारी लाता है। यह विधिक विषय-वस्तु नहीं गढ़ता, और ऊपर का प्रत्येक कथन उसके पीछे के अभिलेख एवं स्रोत प्रणाली का संदर्भ देता है। जिन प्रश्नों को अभिलेख का आधार नहीं दिया जा सकता, उन्हें अनुमान से उत्तर देने के बजाय अस्वीकार कर दिया जाता है।',

  /* == Engine registry — one question per engine ======================== */
  'what can a week of officer work buy': 'अधिकारी के एक सप्ताह के काम से क्या मिल सकता है',
  'What is the statutory deadline for this proceeding, and what has passed it?':
    'इस कार्यवाही की सांविधिक समय-सीमा क्या है, और कौन-से प्रकरण उसे पार कर चुके हैं?',
  'Sections 73/74/74A computed in UTC from the annual return due date. The only place limitation is decided.':
    'वार्षिक विवरणी की नियत तिथि से UTC में परिकलित धाराएँ 73/74/74क। परिसीमा तय होने का यही एकमात्र स्थान।',
  'How much of a demand is still collectable, and how fast does that fall with age?':
    'माँग का कितना भाग अब भी वसूली-योग्य है, और आयु के साथ वह कितनी तेज़ी से घटता है?',
  'The decay curve. Anything that needs a recoverable value asks here rather than modelling its own.':
    'क्षय वक्र। जिसे वसूली-योग्य मूल्य चाहिए वह अपना प्रारूप बनाने के बजाय यहीं पूछता है।',
  'How much officer capacity exists, who is eligible for what, and what can a week absorb?':
    'अधिकारी क्षमता कितनी है, कौन किसके लिए पात्र है, और एक सप्ताह कितना समा सकता है?',
  'The establishment and the constrained assignment. Recovery once stated its own officer count and contradicted this; it no longer does.':
    'स्थापना और बाधाओं के अधीन नियतन। वसूली प्रारूप ने एक बार अपना अधिकारी आँकड़ा बताकर इससे विरोध किया था; अब वह ऐसा नहीं करता।',
  'In what order should cases be worked?': 'प्रकरण किस क्रम में निपटाए जाएँ?',
  'Six-factor ranking by recoverable value per officer-day, and the effort estimate every other engine spends.':
    'प्रति अधिकारी-दिवस वसूली-योग्य मूल्य के अनुसार छह कारकों का क्रम, और वह श्रम-आकलन जिसे हर दूसरा यंत्र प्रयोग करता है।',
  'What does the department hold on one taxpayer, and where did each fact come from?':
    'एक करदाता के बारे में विभाग के पास क्या है, और प्रत्येक तथ्य कहाँ से आया?',
  'The assembled case object. Screens read it rather than re-joining the underlying arrays.':
    'जोड़ा हुआ प्रकरण-घटक। पर्दे मूल सूचियाँ दोबारा जोड़ने के बजाय इसी को पढ़ते हैं।',
  'Which concluded proceedings are comparable to this case, and what happened in them?':
    'कौन-सी निपटाई गई कार्यवाहियाँ इस प्रकरण से तुलनीय हैं, और उनमें क्या हुआ?',
  'Comparability weighted by what decides outcomes. The only place a comparable is defined.':
    'परिणाम तय करने वाली बातों से भारित तुलनीयता। "तुलनीय" की परिभाषा तय करने वाला एकमात्र स्थान।',
  'What authority bears on a question of law, and does it bind here?':
    'विधि के प्रश्न पर कौन-सा प्राधिकार लागू होता है, और क्या वह यहाँ बाध्यकारी है?',
  'Forum hierarchy and still-good-law status. Not similarity — that is the similarity engine.':
    'न्यायमंच अनुक्रम और निर्णय अब भी प्रमाण विधि है या नहीं, यह स्थिति। समानता नहीं — वह समानता यंत्र का काम है।',
  'Where does acting on a chain actually stop it, and can the department execute that?':
    'शृंखला पर कहाँ कार्रवाई करने से वह वास्तव में रुकती है, और क्या विभाग वह कार्रवाई कर सकता है?',
  'Cut-point and coordination. Detection of the chain itself belongs to the cluster data.':
    'छेदन बिंदु एवं समन्वय। शृंखला की पहचान समूह आँकड़ों का काम है।',
  'What is anomalous among taxpayers the encoded rules do not touch?':
    'संकेतबद्ध नियम जिन करदाताओं को नहीं छूते, उनमें असामान्य क्या है?',
  'Unsupervised, peer-relative. Deliberately screens only the population the rulebook misses.':
    'बिना पर्यवेक्षण, समकक्षों के सापेक्ष। नियमपुस्तिका जिन्हें चूकती है केवल उन्हीं की जानबूझकर छानबीन करता है।',
  'What would earlier action have been worth, and which cases were put down while live?':
    'पहले कार्रवाई करने पर उसका मूल्य कितना होता, और कौन-से प्रकरण जीवित रहते हुए अलग रख दिए गए?',
  'Timing counterfactual and revisit candidates. Uses the recovery curve rather than restating it.':
    'समय का प्रति-तथ्य एवं पुनर्विचार उम्मीदवार। वसूली वक्र को दोहराने के बजाय उसी का उपयोग करता है।',
  'What is the total protectable exposure, counted once across every mechanism?':
    'प्रत्येक तंत्र में मिलाकर एक ही बार गिनी गई कुल संरक्षण-योग्य जोखिम राशि कितनी है?',
  'The deduplication. Exists precisely so no screen sums mechanism totals.':
    'दोहरी प्रविष्टि हटाना। कोई पर्दा तंत्रों के योग न जोड़े, ठीक इसीलिए यह मौजूद है।',
  'Which conditions need a decision now, and who takes it?':
    'किन स्थितियों पर अभी निर्णय आवश्यक है, और वह कौन लेता है?',
  'Reads every other engine. Computes no exposure of its own.':
    'हर दूसरे यंत्र को पढ़ता है। अपनी कोई जोखिम राशि परिकलित नहीं करता।',
  'What does an officer need in front of them before acting on one alert?':
    'एक सूचना पर कार्रवाई से पूर्व अधिकारी के सामने क्या होना चाहिए?',
  'Assembles from the other engines. Confidence is decomposed, never blended into one number.':
    'अन्य यंत्रों से जोड़ता है। विश्वास घटकों में बँटा रहता है, एक आँकड़े में कभी नहीं मिलाया जाता।',
  'Before adding an engine, add its entry here. If the question is already owned, extend that engine instead of writing a second one — a second engine answering the same question will disagree with the first eventually, and the disagreement will surface in front of a Commissioner rather than in a test.':
    'कोई यंत्र जोड़ने से पूर्व उसकी प्रविष्टि यहाँ जोड़ें। यदि वह प्रश्न पहले से किसी के अधीन है, तो दूसरा यंत्र लिखने के बजाय उसी को विस्तारित करें — उसी प्रश्न का उत्तर देने वाला दूसरा यंत्र कभी न कभी पहले से असहमत होगा ही, और वह असहमति परीक्षण में नहीं, आयुक्त के सामने उजागर होगी।'
})
