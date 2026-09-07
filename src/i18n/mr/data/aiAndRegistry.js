import { registerMessages } from '../../locale.js'

/**
 * Marathi — ai.js, copilot.js and engineRegistry.js: the generated-draft
 * scaffolding, the copilot's grounded questions and its refusals, and the
 * engine registry where each engine states the one question it owns.
 *
 * Return and form identifiers stay in Latin throughout — GSTR-1, GSTR-3B,
 * GSTR-2B, GSTR-2A, RFD-01. An officer reconciling returns works from those
 * codes, and a translated form name would not match anything on the portal.
 *
 * The copilot's refusals matter as much as its answers, so each is translated
 * in full along with the feed that would be needed to lift it. The note that an
 * earlier version generated a plausible reply and that the output was removed
 * is kept intact: it records a decision, not a limitation.
 *
 *   grounded      → अभिलेखाधारित
 *   corpus        → संग्रह
 *   granularity   → सूक्ष्मता
 *   aggregate     → एकत्रित आकडा
 *   deduplication → दुहेरी नोंद वगळणे
 *   cut-point     → छेद बिंदू
 */
registerMessages('mr', {
  /* == Generated drafts — evidence lists ================================= */
  'Commissioner Daily Brief — AI-Generated Draft': 'आयुक्त दैनिक टिपण — AI-निर्मित मसुदा',
  'State revenue trend (24 months)': 'राज्य महसूल कल (२४ महिने)',
  'Taxpayer risk register': 'करदाता जोखीम नोंदवही',
  'District-wise audit recovery pipeline': 'जिल्हानिहाय लेखापरीक्षा वसुली शृंखला',
  'Compliance early-warning feed': 'अनुपालन पूर्वसूचना प्रवाह',
  'Case risk profile': 'प्रकरण जोखीम माहिती',
  'Triggered risk rules for this taxpayer': 'या करदात्यासाठी लागू झालेले जोखीम नियम',
  'refer to case risk summary': 'प्रकरण जोखीम सारांश पहा',
  'Case risk explanation': 'प्रकरण जोखीम स्पष्टीकरण',
  'Statutory time computation for this tax period': 'या कर कालावधीसाठी सांविधिक मुदत गणना',
  'Case filing record': 'प्रकरण दाखल नोंद',
  'Stage and disputed amount on this appeal': 'या अपिलाचा टप्पा व वादाधीन रक्कम',
  'Compliance early-warning signal': 'अनुपालन पूर्वसूचना संकेत',
  '[English Summary]': '[इंग्रजी सारांश]',
  'SMS + Email': 'SMS + ईमेल',

  /* == Audit checklist =================================================== */
  'Verify GSTR-1 vs GSTR-3B reconciliation for the disputed period(s)':
    'वादाधीन कालावधीसाठी GSTR-1 व GSTR-3B यांचा ताळमेळ पडताळा',
  'Cross-check ITC claimed against supplier GSTR-2B / GSTR-2A':
    'दावा केलेले ITC पुरवठादाराच्या GSTR-2B / GSTR-2A शी तपासून पहा',
  'Review e-way bill movement against declared outward supply value':
    'घोषित बाह्य पुरवठा मूल्याच्या तुलनेत ई-वे बिल वाहतुकीचे पुनर्विलोकन करा',
  'Examine bank statements for payment trail consistency':
    'भरण्याच्या नोंदींतील सुसंगतीसाठी बँक विवरणे तपासा',
  'Confirm principal place of business through field/desk verification':
    'क्षेत्रीय / कार्यालयीन पडताळणीद्वारे व्यवसायाचे मुख्य ठिकाण निश्चित करा',
  'Trace top 5 counterparties for common ownership, address or contact indicators':
    'समान मालकी, पत्ता किंवा संपर्क निर्देशकांसाठी पहिल्या ५ प्रतिपक्षांचा माग काढा',
  'Request stock/inventory register where applicable to validate supply chain':
    'पुरवठा साखळी पडताळण्यासाठी लागू असेल तिथे साठा / मालसूची नोंदवही मागवा',

  /* == Refund checklist ================================================== */
  'Verify refund application (RFD-01) against GSTR-1/3B filed for the claim period':
    'दाव्याच्या कालावधीसाठी दाखल केलेल्या GSTR-1/3B च्या तुलनेत परतावा अर्ज (RFD-01) पडताळा',
  'Reconcile ITC accumulation with eligible input tax credit ledger':
    'साठलेल्या ITC चा पात्र इनपुट कर श्रेय खातेवहीशी ताळमेळ घाला',
  'Cross-verify export/zero-rated supply documentation where applicable':
    'लागू असेल तिथे निर्यात / शून्य-दराच्या पुरवठ्याची कागदपत्रे तपासून पहा',
  'Check supplier-chain risk rating for top ITC-contributing counterparties':
    'सर्वाधिक ITC देणाऱ्या प्रतिपक्षांसाठी पुरवठा-साखळी जोखीम श्रेणी तपासा',
  'Validate bank account and previous refund disbursal history':
    'बँक खाते व पूर्वीच्या परतावा वितरणाचा इतिहास पडताळा',
  'Refer for pre-refund physical/desk verification prior to sanction':
    'मंजुरीपूर्वी परतावा-पूर्व प्रत्यक्ष / कार्यालयीन पडताळणीसाठी पाठवा',
  'Refund-to-turnover ratio': 'परतावा-उलाढाल गुणोत्तर',
  'Sector refund benchmark': 'क्षेत्रीय परतावा मानक',
  'Supplier risk profile': 'पुरवठादार जोखीम माहिती',
  ' The system does not auto-reject or auto-sanction any refund claim.':
    ' ही प्रणाली कोणताही परतावा दावा स्वयंचलितपणे नाकारत नाही किंवा मंजूरही करत नाही.',

  /* == Litigation summary =============================================== */
  Weak: 'कमकुवत',
  'Recommend strengthening documentary evidence and legal reasoning before next hearing.':
    'पुढील सुनावणीपूर्वी कागदोपत्री पुरावा व विधी युक्तिवाद अधिक भक्कम करण्याची शिफारस.',
  'Current documentation and legal position appear adequately supported.':
    'सध्याची कागदपत्रे व विधी स्थिती पुरेशा आधारावर असल्याचे दिसते.',

  /* == Suggested questions to the taxpayer ============================== */
  'Please explain the basis for the input tax credit claimed in excess of the sector-typical range.':
    'क्षेत्रासाठी नेहमीच्या मर्यादेपेक्षा अधिक इनपुट कर श्रेय कोणत्या आधारावर दावा केले, हे कृपया स्पष्ट करा.',
  'Provide a reconciliation of e-way bill movement value against declared outward supply for the period in question.':
    'संबंधित कालावधीसाठी घोषित बाह्य पुरवठ्याच्या तुलनेत ई-वे बिल वाहतूक मूल्याचा ताळमेळ सादर करा.',
  'Clarify the relationship, if any, with counterparty entities flagged under linked-risk review.':
    'संबंधित-जोखीम पुनर्विलोकनाखाली निदर्शनास आणलेल्या प्रतिपक्ष घटकांशी काही संबंध असल्यास तो स्पष्ट करा.',
  'Explain the reason for the variance between turnover growth and corresponding tax payment trend.':
    'उलाढालीतील वाढ व त्यानुसार अपेक्षित कर भरण्याचा कल यांतील तफावतीचे कारण स्पष्ट करा.',
  'No closely comparable cases found in the current dataset.':
    'सध्याच्या डेटासंचात जवळून तुलनात्मक असे कोणतेही प्रकरण आढळले नाही.',

  /* == Copilot — the grounded questions ================================= */
  '), cited corpora that do not exist (': '), अस्तित्वात नसलेले संग्रह उद्धृत केले (',
  'What is this taxpayer’s current position?': 'या करदात्याची सध्याची स्थिती काय आहे?',
  'Why is this case a priority?': 'हे प्रकरण प्राधान्याचे का आहे?',
  'What actions remain pending?': 'कोणत्या कृती प्रलंबित आहेत?',
  'What has happened on this case?': 'या प्रकरणात आतापर्यंत काय घडले आहे?',
  'Is this taxpayer linked to others?': 'हा करदाता इतरांशी जोडलेला आहे का?',
  'What contradictions exist between GSTR-1, GSTR-3B and 2B?':
    'GSTR-1, GSTR-3B व 2B यांच्यात कोणते विरोधाभास आहेत?',
  'Show comparable previous orders': 'तुलनात्मक पूर्वीचे आदेश दाखवा',
  'Summarise the taxpayer’s reply': 'करदात्याच्या उत्तराचा सारांश द्या',
  'not available': 'उपलब्ध नाही',

  /* == Copilot — the refusals and what each would need ================== */
  'This requires return data at line-item level — outward supplies from GSTR-1, tax paid from GSTR-3B, and auto-populated credit from GSTR-2B for each tax period.':
    'यासाठी ओळ-पातळीवरील विवरणपत्र माहिती आवश्यक आहे — प्रत्येक कर कालावधीसाठी GSTR-1 मधील बाह्य पुरवठा, GSTR-3B मधील भरलेला कर, आणि GSTR-2B मधील आपोआप भरलेले श्रेय.',
  'A GSTN returns feed at invoice or line-item granularity. The platform currently holds only period aggregates, which cannot evidence a specific contradiction.':
    'बीजक किंवा ओळ पातळीवरील सूक्ष्मता असलेला GSTN विवरणपत्र स्रोत. मंचाकडे सध्या केवळ कालावधीचे एकत्रित आकडे आहेत, आणि त्यांवरून विशिष्ट विरोधाभास सिद्ध करता येत नाही.',
  'This requires the departmental archive of previous orders, appellate decisions and their outcomes.':
    'यासाठी पूर्वीचे आदेश, अपील निर्णय व त्यांचे निष्कर्ष असलेला विभागीय संग्रह आवश्यक आहे.',
  'The order and appeal corpus, indexed and retrievable to paragraph. Matching on sector alone — which is all the current data supports — is not comparable precedent and must not be presented as one. The brief above already carries what can be grounded without that corpus: any binding or persuasive authority on a question of law this case turns on, and the department’s own record on the same question where enough proceedings have concluded to state one.':
    'आदेश व अपील संग्रह, अनुक्रमणिकाबद्ध आणि परिच्छेदापर्यंत मिळवता येण्याजोगा. केवळ क्षेत्रावरून जुळवणे — आणि सध्याची माहिती एवढेच शक्य करते — हा तुलनात्मक पूर्वनिर्णय नाही आणि तो तसा सादर करता कामा नये. त्या संग्रहाशिवाय ज्याला अभिलेखाचा आधार देता येतो ते वरील टिपणात आधीच आहे: हे प्रकरण ज्या विधी प्रश्नावर अवलंबून आहे त्यावरील कोणताही बंधनकारक किंवा मार्गदर्शक प्राधिकार, आणि त्याच प्रश्नावर पुरेशा कार्यवाही निकाली निघाल्या असतील तिथे विभागाचा स्वतःचा अभिलेख.',
  'No reply document is held against this case. The platform has the notice and its status, but not the taxpayer’s submission or its annexures.':
    'या प्रकरणाविरुद्ध कोणतेही उत्तर कागदपत्र ठेवलेले नाही. मंचाकडे नोटीस व तिची स्थिती आहे, पण करदात्याचे निवेदन किंवा त्याची जोडपत्रे नाहीत.',
  'Reply documents and correspondence from the Back Office case file. An earlier version of this copilot generated a plausible reply here; that output has been removed.':
    'बॅक ऑफिस प्रकरण नस्तीतील उत्तर कागदपत्रे व पत्रव्यवहार. या सहवैमानिकाच्या आधीच्या आवृत्तीने इथे खरे वाटणारे उत्तर तयार केले होते; तो निष्कर्ष काढून टाकला आहे.',

  /* == Copilot — citation sources and the closing note ================== */
  'Filing record': 'विवरणपत्र नोंद',
  'Risk computation': 'जोखीम गणना',
  'Recovery model': 'वसुली प्रारूप',
  'Risk rule set': 'जोखीम नियम संच',
  'No risk rule currently fires for this taxpayer.':
    'या करदात्यासाठी सध्या कोणताही जोखीम नियम लागू होत नाही.',
  'No open proceeding is recorded against this taxpayer.':
    'या करदात्याविरुद्ध कोणतीही प्रलंबित कार्यवाही नोंदलेली नाही.',
  'Case record': 'प्रकरण अभिलेख',
  'This taxpayer is not a member of any flagged network cluster in the current dataset.':
    'सध्याच्या डेटासंचातील कोणत्याही निदर्शनास आणलेल्या नेटवर्क गटाचा हा करदाता सदस्य नाही.',
  'Network cluster index': 'नेटवर्क गट अनुक्रमणिका',
  'Cluster membership is a statistical signal derived from linkage indicators. It is not evidence of fraud and requires verification by the Investigation Team.':
    'गटातील सदस्यत्व हा संबंध निर्देशकांवरून काढलेला सांख्यिकीय संकेत आहे. तो फसवणुकीचा पुरावा नाही आणि त्यास तपास पथकाकडून पडताळणी आवश्यक आहे.',
  'Limitation note': 'मुदतीविषयी टीप',
  'This copilot retrieves from the case record. It does not generate legal content, and every statement above cites the record and source system behind it. Questions it cannot ground are declined rather than answered approximately.':
    'हा सहवैमानिक प्रकरणाच्या अभिलेखातून माहिती मिळवतो. तो विधी मजकूर निर्माण करत नाही, आणि वरील प्रत्येक विधान त्यामागील अभिलेख व मूळ प्रणालीचा संदर्भ देते. ज्या प्रश्नांना अभिलेखाचा आधार देता येत नाही ते अंदाजाने उत्तरे देण्याऐवजी नाकारले जातात.',

  /* == Engine registry — one question per engine ======================== */
  'what can a week of officer work buy': 'अधिकाऱ्याच्या एका आठवड्याच्या कामातून काय मिळू शकते',
  'What is the statutory deadline for this proceeding, and what has passed it?':
    'या कार्यवाहीची सांविधिक मुदत काय आहे, आणि कोणती प्रकरणे ती ओलांडून गेली आहेत?',
  'Sections 73/74/74A computed in UTC from the annual return due date. The only place limitation is decided.':
    'वार्षिक विवरणपत्राच्या देय तारखेपासून UTC मध्ये परिगणित कलम ७३/७४/७४अ. मुदत ठरवली जाणारी हीच एकमेव जागा.',
  'How much of a demand is still collectable, and how fast does that fall with age?':
    'मागणीपैकी किती अद्याप वसूल होऊ शकते, आणि वयानुसार ते किती वेगाने घटते?',
  'The decay curve. Anything that needs a recoverable value asks here rather than modelling its own.':
    'क्षय वक्र. ज्याला वसूलपात्र मूल्य हवे ते स्वतःचे प्रारूप मांडण्याऐवजी इथेच विचारते.',
  'How much officer capacity exists, who is eligible for what, and what can a week absorb?':
    'अधिकारी क्षमता किती आहे, कोण कशासाठी पात्र आहे, आणि एक आठवडा किती सामावून घेऊ शकतो?',
  'The establishment and the constrained assignment. Recovery once stated its own officer count and contradicted this; it no longer does.':
    'आस्थापना व मर्यादांखालील नेमणूक. वसुली प्रारूपाने एकदा स्वतःचा अधिकारी आकडा सांगून याच्याशी विरोध निर्माण केला होता; आता तसे होत नाही.',
  'In what order should cases be worked?': 'प्रकरणे कोणत्या क्रमाने हाताळावीत?',
  'Six-factor ranking by recoverable value per officer-day, and the effort estimate every other engine spends.':
    'प्रति अधिकारी-दिवस वसूलपात्र मूल्यानुसार सहा घटकांची क्रमवारी, आणि इतर प्रत्येक यंत्रणा वापरते तो श्रमाचा अंदाज.',
  'What does the department hold on one taxpayer, and where did each fact come from?':
    'एका करदात्याबाबत विभागाकडे काय आहे, आणि प्रत्येक तथ्य कुठून आले?',
  'The assembled case object. Screens read it rather than re-joining the underlying arrays.':
    'जुळवलेला प्रकरण घटक. पडदे मूळ सूची पुन्हा जोडण्याऐवजी हाच वाचतात.',
  'Which concluded proceedings are comparable to this case, and what happened in them?':
    'कोणत्या निकाली कार्यवाही या प्रकरणाशी तुलनात्मक आहेत, आणि त्यांत काय घडले?',
  'Comparability weighted by what decides outcomes. The only place a comparable is defined.':
    'निष्कर्ष ठरवणाऱ्या गोष्टींनुसार भारित तुलनात्मकता. "तुलनात्मक" म्हणजे काय हे ठरवणारी एकमेव जागा.',
  'What authority bears on a question of law, and does it bind here?':
    'विधी प्रश्नावर कोणता प्राधिकार लागू होतो, आणि तो इथे बंधनकारक आहे का?',
  'Forum hierarchy and still-good-law status. Not similarity — that is the similarity engine.':
    'न्यायमंच उतरंड आणि निर्णय अद्याप प्रमाण आहे का ही स्थिती. साम्य नव्हे — ते साम्य यंत्रणेचे काम.',
  'Where does acting on a chain actually stop it, and can the department execute that?':
    'साखळीवर कुठे कारवाई केल्याने ती प्रत्यक्षात थांबते, आणि विभाग ती कारवाई करू शकतो का?',
  'Cut-point and coordination. Detection of the chain itself belongs to the cluster data.':
    'छेद बिंदू व समन्वय. साखळीचा शोध घेणे हे गट माहितीचे काम.',
  'What is anomalous among taxpayers the encoded rules do not touch?':
    'संकेतबद्ध नियम ज्या करदात्यांना स्पर्श करत नाहीत त्यांच्यात असामान्य काय आहे?',
  'Unsupervised, peer-relative. Deliberately screens only the population the rulebook misses.':
    'पर्यवेक्षणाशिवाय, समकक्षांच्या तुलनेत. नियमपुस्तक ज्यांना चुकवते केवळ त्यांचीच जाणीवपूर्वक चाळणी करते.',
  'What would earlier action have been worth, and which cases were put down while live?':
    'आधी कारवाई केली असती तर तिचे मूल्य किती झाले असते, आणि कोणती प्रकरणे जिवंत असतानाच बाजूला ठेवली गेली?',
  'Timing counterfactual and revisit candidates. Uses the recovery curve rather than restating it.':
    'वेळेचा प्रति-तथ्य व फेरविचाराचे उमेदवार. वसुली वक्र पुन्हा मांडण्याऐवजी तोच वापरते.',
  'What is the total protectable exposure, counted once across every mechanism?':
    'प्रत्येक यंत्रणेत मिळून एकदाच मोजलेली एकूण संरक्षणयोग्य जोखीम रक्कम किती?',
  'The deduplication. Exists precisely so no screen sums mechanism totals.':
    'दुहेरी नोंद वगळणे. कोणताही पडदा यंत्रणांच्या बेरजा जोडू नये म्हणूनच ती अस्तित्वात आहे.',
  'Which conditions need a decision now, and who takes it?':
    'कोणत्या परिस्थितींवर आत्ता निर्णय आवश्यक आहे, आणि तो कोण घेतो?',
  'Reads every other engine. Computes no exposure of its own.':
    'इतर प्रत्येक यंत्रणा वाचते. स्वतःची कोणतीही जोखीम रक्कम परिगणित करत नाही.',
  'What does an officer need in front of them before acting on one alert?':
    'एका सूचनेवर कारवाई करण्यापूर्वी अधिकाऱ्यासमोर काय असले पाहिजे?',
  'Assembles from the other engines. Confidence is decomposed, never blended into one number.':
    'इतर यंत्रणांतून जुळवते. विश्वास हा घटकांत विभागलेला असतो, एका आकड्यात कधीही मिसळला जात नाही.',
  'Before adding an engine, add its entry here. If the question is already owned, extend that engine instead of writing a second one — a second engine answering the same question will disagree with the first eventually, and the disagreement will surface in front of a Commissioner rather than in a test.':
    'नवीन यंत्रणा जोडण्यापूर्वी तिची नोंद इथे करा. तो प्रश्न आधीच कोणाच्या मालकीचा असेल, तर दुसरी यंत्रणा लिहिण्याऐवजी तीच वाढवा — त्याच प्रश्नाचे उत्तर देणारी दुसरी यंत्रणा कधी ना कधी पहिलीशी विरोध करेलच, आणि तो विरोध चाचणीत नव्हे तर आयुक्तांसमोर उघड होईल.'
})
