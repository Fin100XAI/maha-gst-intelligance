import { registerMessages } from '../../locale.js'

/**
 * Hindi — AI Governance & Security and Reports / Briefing Notes.
 *
 *   control (register)   → नियंत्रण (नियंत्रण पंजी)
 *   maker-checker        → कर्ता-परीक्षक
 *   human-in-the-loop    → मानवीय हस्तक्षेप अनिवार्य
 *   audit trail          → लेखापरीक्षा अनुक्रम
 *   override             → अधिक्रमण
 *   disposition          → निपटान
 *   confidence band      → विश्वास पट्टी
 *   false positive       → मिथ्या सकारात्मक निष्कर्ष
 *   illustrative placeholder → दृष्टांत हेतु अस्थायी आँकड़ा
 *   append-only          → केवल जोड़-योग्य
 *   tamper-evident       → छेड़छाड़ उजागर करने वाला
 *   drift                → अपसरण
 *   sign-off             → हस्ताक्षर-अनुमोदन
 *
 * Statute and standard names stay in Latin — CERT-In, VAPT, mutual TLS,
 * Digital Personal Data Protection Act, 2023.
 */
registerMessages('hi', {
  /* == Control register — states ======================================== */
  '…': '…',
  taxpayers: 'करदाता',
  Taxpayers: 'करदाता',
  Revenue: 'राजस्व',
  English: 'अंग्रेज़ी',
  'Implemented in this build': 'इस संस्करण में लागू',
  'Not in place': 'अस्तित्व में नहीं',
  'Not applicable to this build': 'इस संस्करण पर लागू नहीं',
  '{0} implemented': '{0} लागू',
  '{0} not in place': '{0} अस्तित्व में नहीं',
  '{0} not applicable': '{0} लागू नहीं',
  State: 'स्थिति',
  'Current state and production requirement': 'वर्तमान स्थिति एवं उत्पादन-स्तरीय आवश्यकता',
  Owner: 'स्वामी',

  /* == Control register — the controls ================================== */
  'Maker-checker / human-in-the-loop': 'कर्ता-परीक्षक / मानवीय हस्तक्षेप अनिवार्य',
  'The AI system only ever occupies the maker / draft role and cannot independently execute an enforcement action. Every AI output is advisory and passes through an authorised officer who verifies the evidence and approves or rejects it. Visible in the workflow strip below and in the Human Approval step of the Audit & Scrutiny Engine.':
    'AI प्रणाली सदैव केवल कर्ता / प्रारूप की भूमिका में रहती है और स्वतंत्र रूप से कोई प्रवर्तन कार्रवाई नहीं कर सकती। प्रत्येक AI निष्कर्ष सलाहकारी है और उस प्राधिकृत अधिकारी से होकर जाता है जो प्रमाण सत्यापित कर उसे स्वीकृत या अस्वीकृत करता है। यह नीचे की कार्यप्रवाह पट्टी में और लेखापरीक्षा एवं छानबीन यंत्र के मानवीय स्वीकृति चरण में दिखता है।',
  "Production requirement: bind the approval to the officer's authenticated identity in the departmental system of record, so the approval cannot be replayed or attributed to the wrong officer.":
    'उत्पादन-स्तरीय आवश्यकता: स्वीकृति को विभागीय अभिलेख प्रणाली में अधिकारी की प्रमाणित पहचान से बाँधें, ताकि वह दोहराई न जा सके और गलत अधिकारी के नाम न चढ़े।',
  'Every risk score is fully attributable to a discrete set of weighted, transparent rules — there is no black-box scoring. An officer can trace any rating back to the exact triggered indicators and their weight contribution through the "Why flagged?" panel used app-wide.':
    'प्रत्येक जोखिम अंक भारित एवं पारदर्शी नियमों के एक निश्चित समुच्चय से पूरी तरह जोड़ा जा सकता है — यहाँ कोई अपारदर्शी अंकन नहीं है। पूरे अनुप्रयोग में प्रयुक्त "क्यों चिह्नित?" पटल से अधिकारी किसी भी मानांकन का सूत्र ठीक उन्हीं लागू हुए संकेतकों और उनके भार-योगदान तक जोड़ सकता है।',
  'Production requirement: hold the rule set and its weights under version control with change approval, so a score can be reconstructed as it stood on the date the officer acted.':
    'उत्पादन-स्तरीय आवश्यकता: नियम समुच्चय और उसके भार परिवर्तन-अनुमोदन सहित संस्करण नियंत्रण में रखें, ताकि अधिकारी ने जिस तिथि को कार्रवाई की उस दिन का अंक वैसा ही पुनः खड़ा किया जा सके।',
  'Access is decided per role at section level and then again at module level. The matrix below is generated from that configuration at render time rather than described alongside it, so it cannot drift from what the platform actually enforces.':
    'पहुँच प्रत्येक भूमिका हेतु पहले अनुभाग स्तर पर और फिर मॉड्यूल स्तर पर तय होती है। नीचे की सारणी उसी विन्यास से पर्दा बनाते समय ही उत्पन्न होती है, उसका अलग वर्णन नहीं लिखा गया — इसलिए मंच वास्तव में जो लागू करता है उससे वह दूर नहीं जा सकती।',
  'Production requirement: enforce the same matrix server-side against an authenticated session. The check in this build runs in the browser and a client-side check is not access control.':
    'उत्पादन-स्तरीय आवश्यकता: यही सारणी प्रमाणित सत्र के सापेक्ष सर्वर पर लागू करें। इस संस्करण की जाँच ब्राउज़र में चलती है, और क्लाइंट-पक्ष की जाँच पहुँच नियंत्रण नहीं है।',
  'Audit trail capture': 'लेखापरीक्षा अनुक्रम का अंकन',
  'Every officer action is recorded with user, role, action, module, case reference, IP, device and outcome, including denied attempts. Entries from this session are marked Live in the trail below.':
    'प्रत्येक अधिकारी कार्रवाई उपयोक्ता, भूमिका, कार्रवाई, मॉड्यूल, प्रकरण संदर्भ, IP, उपकरण और परिणाम सहित दर्ज होती है — अस्वीकृत प्रयास भी सम्मिलित। इस सत्र की प्रविष्टियाँ नीचे के अनुक्रम में "जीवित" अंकित हैं।',
  'Production requirement: append-only, tamper-evident storage with a defined retention period and an integrity check. This build holds the trail in browser memory and loses it on reload, so it evidences the capture, not the preservation.':
    'उत्पादन-स्तरीय आवश्यकता: निर्धारित प्रतिधारण अवधि और अखंडता जाँच सहित केवल जोड़-योग्य, छेड़छाड़ उजागर करने वाला भंडारण। यह संस्करण अनुक्रम ब्राउज़र की स्मृति में रखता है और पृष्ठ पुनः लोड होते ही खो देता है, इसलिए वह अंकन का प्रमाण देता है, परिरक्षण का नहीं।',
  'AI Copilot usage logging': 'AI सहायक के उपयोग की लॉगिंग',
  'Each draft, summary, checklist or translation the Copilot produces is logged separately from the general system trail: the fact of the generation, the officer, the case and the time. Prompt and output content are deliberately not persisted.':
    'सहायक द्वारा बनाया गया प्रत्येक प्रारूप, सारांश, जाँच-सूची अथवा अनुवाद सामान्य प्रणाली अनुक्रम से अलग दर्ज होता है: निर्माण हुआ यह तथ्य, अधिकारी, प्रकरण और समय। संकेत-पाठ और निष्कर्ष-पाठ जानबूझकर संचित नहीं किए जाते।',
  'Production requirement: retain the same usage record server-side, and decide the retention period for generated content explicitly rather than by omission.':
    'उत्पादन-स्तरीय आवश्यकता: यही उपयोग अभिलेख सर्वर पर रखें, और उत्पन्न सामग्री की प्रतिधारण अवधि चूक से नहीं, स्पष्ट रूप से तय करें।',
  'Data minimisation / PII masking': 'आँकड़ों का न्यूनीकरण / व्यक्तिगत पहचान सूचना ढँकना',
  'Encryption at rest and in transit': 'भंडारण में एवं संचरण में कूटलेखन',
  'Adversarial / red-team testing': 'प्रतिकूल / रेड-टीम परीक्षण',
  'This demonstration has no integrations and makes no network calls, so there is no gateway, no token and no external endpoint to assess.':
    'इस प्रदर्शन में कोई एकीकरण नहीं है और यह कोई नेटवर्क कॉल नहीं करता, इसलिए मूल्यांकन योग्य कोई द्वार, टोकन अथवा बाह्य एंडपॉइंट है ही नहीं।',
  'Production requirement: route every AI Copilot and reporting integration through the departmental secure gateway with mutual TLS, request signing and role-scoped API tokens, and transmit no taxpayer data to external, uncontrolled endpoints.':
    'उत्पादन-स्तरीय आवश्यकता: प्रत्येक AI सहायक एवं रिपोर्टिंग एकीकरण mutual TLS, अनुरोध हस्ताक्षर और भूमिका-सीमित API टोकन सहित विभागीय सुरक्षित द्वार से ही ले जाएँ, और बाह्य, अनियंत्रित एंडपॉइंट को कोई करदाता आँकड़ा न भेजें।',
  'No real taxpayer data is present in this demonstration — every record on the platform is generated. No purpose-limitation, retention or consent control has therefore been exercised against real personal data.':
    'इस प्रदर्शन में कोई वास्तविक करदाता आँकड़ा नहीं है — मंच का प्रत्येक अभिलेख उत्पन्न किया गया है। इसलिए वास्तविक व्यक्तिगत आँकड़ों पर प्रयोजन-सीमा, प्रतिधारण अथवा सहमति में से कोई नियंत्रण प्रयोग नहीं किया गया।',
  'Production requirement: process taxpayer personal and financial data strictly for stated revenue-assurance and compliance purposes under the Digital Personal Data Protection Act, 2023, with purpose limitation, access logging and retention controls evidenced.':
    'उत्पादन-स्तरीय आवश्यकता: करदाता के व्यक्तिगत एवं वित्तीय आँकड़े Digital Personal Data Protection Act, 2023 के अंतर्गत केवल घोषित राजस्व-आश्वासन एवं अनुपालन प्रयोजनों हेतु ही संसाधित करें, तथा प्रयोजन-सीमा, पहुँच लॉगिंग और प्रतिधारण नियंत्रणों का प्रमाण रखें।',
  'No sampling programme runs in this demonstration. The false-positive rate shown on this screen is an illustrative placeholder and measures nothing.':
    'इस प्रदर्शन में कोई प्रतिचयन कार्यक्रम नहीं चलता। इस पर्दे पर दिखाई गई मिथ्या सकारात्मक निष्कर्षों की दर दृष्टांत हेतु अस्थायी आँकड़ा है और वह कुछ भी नहीं मापती।',
  'Production requirement: sample AI-flagged cases continuously for officer review and track the confirmed false-positive rate by sector and district, to detect systemic bias or drift.':
    'उत्पादन-स्तरीय आवश्यकता: AI द्वारा चिह्नित प्रकरणों के अधिकारी पुनर्विलोकन हेतु निरंतर प्रतिचयन करें और पुष्ट मिथ्या सकारात्मक दर क्षेत्रवार एवं ज़िलावार अनुसरित करें, ताकि प्रणालीगत पक्षपात अथवा अपसरण पकड़ा जा सके।',

  /* == Governance — headline ============================================ */
  'Governance metrics on this screen describe the AI layer itself and are not narrowed by the taxpayer filters above; only the audit trail responds to the search box. Oversight console for AI-assisted decision support across the platform — the control register and its evidence, role-based access as the platform actually enforces it, officer override history, and audit trail integrity. AI systems here operate strictly in an advisory capacity under mandatory human review.':
    'इस पर्दे के शासन-मापक AI परत का ही वर्णन करते हैं और ऊपर के करदाता फ़िल्टर से सीमित नहीं होते; केवल लेखापरीक्षा अनुक्रम खोज-पेटी पर प्रतिक्रिया देता है। पूरे मंच पर AI-सहायित निर्णय समर्थन हेतु यह पर्यवेक्षण कक्ष है — नियंत्रण पंजी और उसका प्रमाण, मंच वास्तव में जैसा लागू करता है वैसी भूमिका-आधारित पहुँच, अधिकारी अधिक्रमण का इतिहास, और लेखापरीक्षा अनुक्रम की अखंडता। यहाँ की AI प्रणालियाँ अनिवार्य मानवीय पुनर्विलोकन के अधीन कड़ाई से केवल सलाहकारी क्षमता में कार्य करती हैं।',
  'Controls in Register': 'पंजी के नियंत्रण',
  'Implemented in This Build': 'इस संस्करण में लागू',
  'Controls Not in Place': 'अस्तित्व में न रहे नियंत्रण',
  'External Certifications Held': 'धारित बाह्य प्रमाणपत्र',
  'none claimed': 'किसी का दावा नहीं',
  'Read this page as a control position, not as an assurance. "Implemented in this build" means an assessor can watch the control work in this demonstration; it is not an accreditation, a certification or an independent assessment, and the platform holds none of those. Every model figure on this screen — recommendation counts, confidence bands and the false-positive rate — is an illustrative placeholder: there is no model, no gateway and no scheduled audit behind them. The audit trail, the access matrix and the translation coverage below are the only figures on this page counted from something that actually exists.':
    'इस पृष्ठ को नियंत्रण की स्थिति के रूप में पढ़ें, आश्वासन के रूप में नहीं। "इस संस्करण में लागू" का अर्थ है कि मूल्यांकनकर्ता इस प्रदर्शन में उस नियंत्रण को काम करते देख सकता है; वह मान्यता, प्रमाणपत्र या स्वतंत्र मूल्यांकन नहीं है, और मंच के पास इनमें से कुछ भी नहीं। इस पर्दे का प्रत्येक प्रारूप-आँकड़ा — संस्तुतियों की संख्या, विश्वास पट्टियाँ और मिथ्या सकारात्मक दर — दृष्टांत हेतु अस्थायी आँकड़ा है: उनके पीछे न कोई प्रारूप है, न द्वार, न कोई नियोजित लेखापरीक्षा। लेखापरीक्षा अनुक्रम, पहुँच सारणी और नीचे की अनुवाद व्याप्ति ही इस पृष्ठ के वे एकमात्र आँकड़े हैं जो वास्तव में विद्यमान किसी वस्तु से गिने गए हैं।',
  'AI Control Register': 'AI नियंत्रण पंजी',
  'What each control is, its state in this build, what production would require, and who owns it':
    'प्रत्येक नियंत्रण क्या है, इस संस्करण में उसकी स्थिति, उत्पादन स्तर पर क्या चाहिए, और उसका स्वामी कौन',
  'Roles configured for this console ({0} listed below)':
    'इस कक्ष हेतु विन्यस्त भूमिकाएँ (नीचे {0} सूचीबद्ध)',
  'Not assigned — this build holds no control-owner register':
    'नियत नहीं — इस संस्करण में नियंत्रण-स्वामियों की कोई पंजी नहीं',
  'Ownership is derived from the access configuration, which is the only ownership statement this build can evidence: the roles that can open this console are {0}. No separate control-owner register exists, so the infrastructure controls above have no named accountable owner. Production requirement: name an accountable owner and a review cycle for every row before go-live.':
    'स्वामित्व पहुँच विन्यास से निकाला गया है, क्योंकि यह संस्करण स्वामित्व का इतना ही एक कथन प्रमाणित कर सकता है: इस कक्ष को खोल सकने वाली भूमिकाएँ {0} हैं। नियंत्रण-स्वामियों की कोई पृथक पंजी नहीं है, इसलिए ऊपर के अवसंरचना नियंत्रणों का कोई नामित उत्तरदायी स्वामी नहीं। उत्पादन-स्तरीय आवश्यकता: प्रत्यक्ष प्रारंभ से पहले प्रत्येक पंक्ति हेतु उत्तरदायी स्वामी और पुनर्विलोकन चक्र नामित करें।',
  'CERT-In / VAPT Readiness Checklist': 'CERT-In / VAPT तैयारी जाँच-सूची',
  'Controls a production deployment must evidence — none has been carried out against this build':
    'उत्पादन-स्तरीय तैनाती को जिन नियंत्रणों का प्रमाण देना होगा — इनमें से एक भी इस संस्करण पर नहीं किया गया',
  '0 of {0} completed': '{0} में से 0 पूर्ण',
  'No step in this platform bypasses the officer. There is no configuration, threshold or confidence band at which an AI output executes on its own.':
    'इस मंच का कोई चरण अधिकारी को छोड़कर नहीं जाता। ऐसा कोई विन्यास, सीमा अथवा विश्वास पट्टी है ही नहीं जिस पर AI निष्कर्ष स्वयं क्रियान्वित हो जाए।',

  /* == Governance — access matrix ======================================= */
  'Role-Based Access Control — as enforced': 'भूमिका-आधारित पहुँच नियंत्रण — जैसा लागू है',
  'Generated from the platform access configuration at render time, not described alongside it':
    'पर्दा बनाते समय ही मंच के पहुँच विन्यास से उत्पन्न, उसका अलग वर्णन लिखकर नहीं',
  '{0} roles · {1} modules': '{0} भूमिकाएँ · {1} मॉड्यूल',
  'Sections granted': 'दिए गए अनुभाग',
  'Modules reachable': 'पहुँच योग्य मॉड्यूल',
  'Denied at module level despite section access':
    'अनुभाग पहुँच होते हुए भी मॉड्यूल स्तर पर अस्वीकृत',
  'Opens this console': 'यह कक्ष खोलता है',
  'Module counts include the Officer AI Copilot, which is reachable but not listed in the navigation menu. A role with a section is not automatically given every module inside it — the fourth column is that second layer on its own.':
    'मॉड्यूल संख्याओं में अधिकारी AI सहायक सम्मिलित है, जहाँ तक पहुँचा जा सकता है पर वह नेविगेशन मेन्यू में सूचीबद्ध नहीं। किसी भूमिका को अनुभाग मिलने भर से उसके भीतर का प्रत्येक मॉड्यूल स्वतः नहीं मिलता — चौथा स्तंभ वही दूसरी परत है, स्वतंत्र रूप से।',

  /* == Governance — overrides and activity ============================== */
  'Officer Override & Disposition History': 'अधिकारी अधिक्रमण एवं निपटान इतिहास',
  'Every logged instance of an officer overriding, rejecting or approving an AI-assisted output — the maker-checker control as it appears in the trail':
    'अधिकारी द्वारा AI-सहायित निष्कर्ष को अधिक्रमित, अस्वीकृत अथवा स्वीकृत करने की प्रत्येक दर्ज घटना — कर्ता-परीक्षक नियंत्रण जैसा अनुक्रम में दिखता है',
  '{0} of {1} trail entries': '{1} अनुक्रम प्रविष्टियों में से {0}',
  'Search override history...': 'अधिक्रमण इतिहास खोजें...',
  'No override or disposition entries in the current trail. Overriding an AI risk flag or marking a false positive anywhere in the platform records an entry here.':
    'वर्तमान अनुक्रम में अधिक्रमण अथवा निपटान की कोई प्रविष्टि नहीं। मंच पर कहीं भी AI जोखिम चिह्न अधिक्रमित करने या मिथ्या सकारात्मक अंकित करने पर यहाँ प्रविष्टि दर्ज होती है।',
  'Officer decision': 'अधिकारी का निर्णय',
  'An override is an officer disagreeing with the platform, which is the outcome the maker-checker control exists to make possible. A trail with no overrides in it would be a warning sign, not a good result.':
    'अधिक्रमण अर्थात् अधिकारी का मंच से असहमत होना, और कर्ता-परीक्षक नियंत्रण जिस परिणाम को संभव बनाने के लिए है वह यही है। जिस अनुक्रम में एक भी अधिक्रमण न हो, वह अच्छा परिणाम नहीं, चेतावनी होगी।',
  'AI Decision-Support Activity': 'AI निर्णय-समर्थन गतिविधि',
  'Illustrative placeholder figures — nothing below is measured':
    'दृष्टांत हेतु अस्थायी आँकड़े — नीचे कुछ भी मापा नहीं गया',
  'Illustrative placeholder': 'दृष्टांत हेतु अस्थायी आँकड़ा',
  'Recommendations generated': 'उत्पन्न संस्तुतियाँ',
  'Officer-approved': 'अधिकारी द्वारा स्वीकृत',
  '{0}% of generated': 'उत्पन्न में से {0}%',
  'Rejected by officer': 'अधिकारी द्वारा अस्वीकृत',
  'Pending governance review': 'शासन पुनर्विलोकन लंबित',
  'Disposition check: approved plus rejected plus pending accounts for {0} of {1} recommendations, leaving {2} unexplained. The three figures are presented as an exhaustive split, so a non-zero remainder would mean the split is wrong. {3}% of generated recommendations have been disposed of one way or the other.':
    'निपटान जाँच: स्वीकृत, अस्वीकृत और लंबित मिलाकर {1} संस्तुतियों में से {0} बनते हैं, और {2} अस्पष्ट रह जाते हैं। ये तीनों आँकड़े संपूर्ण विभाजन के रूप में रखे गए हैं, इसलिए शून्येतर शेष का अर्थ है कि विभाजन ही गलत है। उत्पन्न संस्तुतियों में से {3}% किसी न किसी रूप में निपट चुकी हैं।',
  'Share of AI outputs by confidence band — illustrative placeholder':
    'विश्वास पट्टी के अनुसार AI निष्कर्षों का अंश — दृष्टांत हेतु अस्थायी आँकड़ा',
  'Bands total {0}%': 'पट्टियों का योग {0}%',
  'Confidence is a property of the output, not a permission. A "Very High" band does not shorten the officer review path — every band goes through the same maker-checker step.':
    'विश्वास निष्कर्ष का गुण है, अनुमति नहीं। "अत्युच्च" पट्टी से अधिकारी पुनर्विलोकन का मार्ग छोटा नहीं होता — प्रत्येक पट्टी उसी कर्ता-परीक्षक चरण से गुज़रती है।',
  'Human-in-the-loop review outcomes for AI-flagged cases — illustrative placeholder':
    'AI द्वारा चिह्नित प्रकरणों में मानवीय पुनर्विलोकन के परिणाम — दृष्टांत हेतु अस्थायी आँकड़ा',
  'Not measured': 'मापा नहीं गया',
  'Of {0} AI-generated risk flags submitted for officer review, {1} were confirmed as false positives ({2}%). No sampling programme produced these numbers — they are illustrative. Production requirement: track this rate continuously by sector and district to monitor model precision; it must never by itself trigger an automated model change.':
    'अधिकारी पुनर्विलोकन हेतु प्रस्तुत {0} AI-उत्पन्न जोखिम चिह्नों में से {1} मिथ्या सकारात्मक के रूप में पुष्ट हुए ({2}%)। ये संख्याएँ किसी प्रतिचयन कार्यक्रम से नहीं आईं — वे दृष्टांत हेतु हैं। उत्पादन-स्तरीय आवश्यकता: प्रारूप की परिशुद्धता पर दृष्टि रखने हेतु यह दर क्षेत्रवार एवं ज़िलावार निरंतर अनुसरित करें; इससे स्वयं कभी कोई स्वचालित प्रारूप परिवर्तन न हो।',

  /* == Governance — trail integrity and language ======================== */
  'Audit Trail Integrity': 'लेखापरीक्षा अनुक्रम की अखंडता',
  "Properties counted off the trail below, including this session's own entries":
    'नीचे के अनुक्रम से गिने गए गुण, इस सत्र की अपनी प्रविष्टियों सहित',
  'Entries held': 'रखी गई प्रविष्टियाँ',
  '{0} live this session': 'इस सत्र में {0} जीवित',
  'Denied attempts': 'अस्वीकृत प्रयास',
  '{0}% of entries': 'प्रविष्टियों का {0}%',
  'Distinct officers': 'भिन्न अधिकारी',
  'across {0} roles': '{0} भूमिकाओं में',
  'Modules covered': 'समाहित मॉड्यूल',
  'Entries with a case reference': 'प्रकरण संदर्भ वाली प्रविष्टियाँ',
  'Coverage window': 'व्याप्ति का कालपट',
  'to {0}': '{0} तक',
  'Denied attempts are kept in the trail deliberately: a log that records only what succeeded cannot evidence that access control refused anything. The trail is held in browser memory for this session and is lost on reload — it evidences capture, not preservation, and production requires append-only, tamper-evident storage with a defined retention period.':
    'अस्वीकृत प्रयास अनुक्रम में जानबूझकर रखे गए हैं: जो लॉग केवल सफल हुए को दर्ज करता है वह यह प्रमाणित नहीं कर सकता कि पहुँच नियंत्रण ने कुछ अस्वीकार भी किया। यह अनुक्रम इस सत्र भर ब्राउज़र की स्मृति में रहता है और पृष्ठ पुनः लोड होते ही खो जाता है — वह अंकन का प्रमाण देता है, परिरक्षण का नहीं, और उत्पादन स्तर पर निर्धारित प्रतिधारण अवधि सहित केवल जोड़-योग्य, छेड़छाड़ उजागर करने वाला भंडारण चाहिए।',
  'Official-Language Coverage': 'राजभाषा व्याप्ति',
  'Strings that fell back to English in this browser session, and the size of each catalogue':
    'इस ब्राउज़र सत्र में अंग्रेज़ी पर लौट गए वाक्य, और प्रत्येक संचिका का आकार',
  '{0} untranslated strings observed': 'अनूदित न हुए {0} वाक्य देखे गए',
  'Active language': 'सक्रिय भाषा',
  '{0} catalogue entries': '{0} संचिका प्रविष्टियाँ',
  'Fallback occurrences': 'लौटने की घटनाएँ',
  '{0} distinct strings': '{0} भिन्न वाक्य',
  'String with no catalogue entry': 'संचिका में प्रविष्टि रहित वाक्य',
  'Times shown': 'कितनी बार दिखा',
  'This counts only what this browser has rendered since the page loaded, in the currently selected language — it is a live gap indicator, not a coverage audit, and it reads zero in English because English is the source language. A string listed here reaches an officer in English on a screen they have set to Marathi or Hindi. Production requirement: drive this to zero for every officer-facing string before an official-language deployment.':
    'पृष्ठ लोड होने के बाद से इस ब्राउज़र ने वर्तमान चयनित भाषा में जो बनाया, केवल उसी की गिनती इसमें है — यह जीवित कमी-संकेतक है, व्याप्ति की लेखापरीक्षा नहीं, और अंग्रेज़ी में यह शून्य दिखाता है क्योंकि अंग्रेज़ी ही स्रोत भाषा है। यहाँ सूचीबद्ध वाक्य, अधिकारी द्वारा मराठी या हिंदी चुने गए पर्दे पर भी उस तक अंग्रेज़ी में ही पहुँचता है। उत्पादन-स्तरीय आवश्यकता: राजभाषा तैनाती से पहले अधिकारी के सामने आने वाले प्रत्येक वाक्य के लिए इसे शून्य पर लाएँ।',

  /* == Reports — scope descriptors ====================================== */
  'Follows the header filters': 'शीर्ष फ़िल्टर मानता है',
  'Partly statewide — stated in the draft': 'आंशिक रूप से राज्यव्यापी — प्रारूप में उल्लिखित',
  'Platform-wide — taxpayer filters do not apply':
    'पूरे मंच पर — करदाता फ़िल्टर लागू नहीं होते',
  'Taxpayer register, district revenue, compliance alerts':
    'करदाता पंजी, ज़िला राजस्व, अनुपालन चेतावनियाँ',
  'Statewide monthly revenue trend, taxpayer register, refund pipeline':
    'राज्यव्यापी मासिक राजस्व प्रवृत्ति, करदाता पंजी, प्रतिदाय शृंखला',
  districts: 'ज़िले',
  'District revenue, targets and officer workload': 'ज़िला राजस्व, लक्ष्य और अधिकारी कार्यभार',
  sectors: 'क्षेत्र',
  'Fixed sector benchmarks and the taxpayer register': 'नियत क्षेत्रीय मानक और करदाता पंजी',
  'Taxpayer register — ITC spike and circular-trading signals':
    'करदाता पंजी — ITC उछाल और वर्तुल व्यापार के संकेत',
  'refund cases': 'प्रतिदाय प्रकरण',
  'Refund case pipeline': 'प्रतिदाय प्रकरण शृंखला',
  'Audit case pipeline': 'लेखापरीक्षा प्रकरण शृंखला',
  'Litigation and appeal register': 'वाद एवं अपील पंजी',
  alerts: 'चेतावनियाँ',
  'Compliance early-warning alerts': 'अनुपालन पूर्व-चेतावनियाँ',
  'AI governance metrics (illustrative placeholders)':
    'AI शासन मापक (दृष्टांत हेतु अस्थायी आँकड़े)',
  '{0} ({1})': '{0} ({1})',
  'Scope: {0}.': 'दायरा: {0}.',

  /* == Reports — draft bodies =========================================== */
  'GST revenue modelled: ₹{0} Cr across {1} taxpayers in scope.':
    'प्रारूपित GST राजस्व: दायरे के {1} करदाताओं में मिलाकर ₹{0} करोड़।',
  'Estimated high-risk revenue exposure: ₹{0} Cr ({1} Critical, {2} High risk entities).':
    'अनुमानित उच्च-जोखिम राजस्व राशि: ₹{0} करोड़ ({1} गंभीर, {2} उच्च जोखिम इकाइयाँ)।',
  'Highest risk-taxpayer concentration: {0}.': 'सर्वाधिक जोखिम-करदाता संकेंद्रण: {0}.',
  '{0} compliance early-warning alerts in scope; {1} currently open.':
    'दायरे में {0} अनुपालन पूर्व-चेतावनियाँ; वर्तमान में {1} लंबित।',
  'Audit recovery pipeline: ₹{0} Cr; {1} non-filers in scope.':
    'लेखापरीक्षा वसूली शृंखला: ₹{0} करोड़; दायरे में {1} विवरणी न भरने वाले।',
  'Latest month ({0}) statewide collection: ₹{1} Cr against a target of ₹{2} Cr ({3} Cr variance). The monthly trend series is statewide and is not narrowed by district or sector filters.':
    'नवीनतम माह ({0}) की राज्यव्यापी वसूली: ₹{2} करोड़ के लक्ष्य के सापेक्ष ₹{1} करोड़ ({3} करोड़ विचलन)। मासिक प्रवृत्ति शृंखला राज्यव्यापी है और ज़िला अथवा क्षेत्र फ़िल्टर से सीमित नहीं होती।',
  'Estimated high-risk revenue exposure in scope: ₹{0} Cr.':
    'दायरे की अनुमानित उच्च-जोखिम राजस्व राशि: ₹{0} करोड़।',
  '{0} taxpayers in scope flagged for elevated ITC risk indicators.':
    'दायरे के {0} करदाता बढ़े हुए ITC जोखिम संकेतकों हेतु चिह्नित।',
  '{0} refund cases in scope remain under active risk review.':
    'दायरे के {0} प्रतिदाय प्रकरण अब भी सक्रिय जोखिम पुनर्विलोकन में हैं।',
  '{0} district(s) assessed against monthly revenue targets.':
    'मासिक राजस्व लक्ष्यों के सापेक्ष {0} ज़िलों का मूल्यांकन।',
  'Largest shortfall: {0} at {1}% gap (target ₹{2} Cr vs actual ₹{3} Cr).':
    'सबसे बड़ी कमी: {0}, {1}% अंतर (लक्ष्य ₹{2} करोड़ बनाम वास्तविक ₹{3} करोड़)।',
  'Strongest performance: {0} at {1}% against target.':
    'सर्वोत्तम प्रदर्शन: {0}, लक्ष्य के सापेक्ष {1}%।',
  'Highest officer workload: {0} at {1}% officer utilisation (average case ageing {2} days).':
    'सर्वाधिक अधिकारी कार्यभार: {0}, {1}% अधिकारी उपयोग (औसत प्रकरण आयु {2} दिन)।',
  'Combined risk-taxpayer count across districts in scope: {0}.':
    'दायरे के ज़िलों में मिलाकर जोखिम-करदाताओं की संयुक्त संख्या: {0}.',
  '{0} sector(s) benchmarked for tax ratio, ITC ratio and refund ratio deviation.':
    'कर अनुपात, ITC अनुपात और प्रतिदाय अनुपात के विचलन हेतु {0} क्षेत्रों का मानकीकरण।',
  'Highest concentration of high/critical-risk taxpayers: {0}.':
    'उच्च/गंभीर जोखिम वाले करदाताओं का सर्वाधिक संकेंद्रण: {0}.',
  'No sector in scope currently carries a high or critical-risk taxpayer.':
    'दायरे के किसी क्षेत्र में इस समय उच्च अथवा गंभीर जोखिम का करदाता नहीं है।',
  'Taxpayer count in scope: {0}.': 'दायरे में करदाताओं की संख्या: {0}.',
  'Benchmark ratios are fixed departmental reference values and do not vary with the header filters.':
    'मानक अनुपात विभाग के नियत संदर्भ मान हैं और शीर्ष फ़िल्टर के अनुसार नहीं बदलते।',
  '{0} taxpayers in scope flagged for ITC-related risk indicators (abnormal spike and/or circular trading signal).':
    'दायरे के {0} करदाता ITC-संबंधी जोखिम संकेतकों हेतु चिह्नित (असामान्य उछाल और/या वर्तुल व्यापार संकेत)।',
  'Abnormal ITC spike signal present in {0} records; circular trading signal in {1} records.':
    'असामान्य ITC उछाल का संकेत {0} अभिलेखों में; वर्तुल व्यापार का संकेत {1} अभिलेखों में।',
  'Top estimated revenue exposure: {0}.': 'सर्वाधिक अनुमानित राजस्व जोखिम राशि: {0}.',
  '{0} (₹{1}L)': '{0} (₹{1} लाख)',
  'All figures represent statistical risk signals for officer-led verification, not confirmed evasion.':
    'सभी आँकड़े अधिकारी द्वारा सत्यापन हेतु सांख्यिकीय जोखिम संकेत हैं, पुष्ट कर-अपवंचन नहीं।',
  '{0} refund case(s) in scope in the risk-ranked pipeline.':
    'जोखिम-क्रमबद्ध शृंखला में दायरे के {0} प्रतिदाय प्रकरण।',
  '{0} require officer review; {1} recommended for escalated scrutiny.':
    '{0} को अधिकारी पुनर्विलोकन चाहिए; {1} बढ़ी हुई छानबीन हेतु संस्तुत।',
  'Total claimed refund value in scope: ₹{0} Lakh.':
    'दायरे में दावा किया गया कुल प्रतिदाय मूल्य: ₹{0} लाख।',
  'Export-linked claims: {0} of {1}.': 'निर्यात-संबद्ध दावे: {1} में से {0}.',
  '{0} case(s) in scope in the risk-ranked audit pipeline.':
    'जोखिम-क्रमबद्ध लेखापरीक्षा शृंखला में दायरे के {0} प्रकरण।',
  '{0} Critical-risk and {1} High-risk cases recommended for priority scoping.':
    'प्राथमिकता से दायरा तय करने हेतु {0} गंभीर-जोखिम और {1} उच्च-जोखिम प्रकरण संस्तुत।',
  'Combined estimated revenue exposure in scope: ₹{0} Cr.':
    'दायरे की संयुक्त अनुमानित राजस्व जोखिम राशि: ₹{0} करोड़।',
  'Cases span {0} district(s) and {1} sector(s).':
    'प्रकरण {0} ज़िलों और {1} क्षेत्रों में फैले हैं।',
  '{0} active appeal/litigation case(s) in scope.':
    'दायरे में {0} सक्रिय अपील/वाद प्रकरण।',
  'Department success rate on decided matters in scope: {0}% ({1} of {2} decided).':
    'दायरे के निर्णीत मामलों पर विभाग की सफलता दर: {0}% (निर्णीत {2} में से {1})।',
  '{0} orders reversed; {1} cases exceed ₹50 Lakh in disputed value.':
    '{0} आदेश निरस्त; {1} प्रकरणों का विवादित मूल्य ₹50 लाख से अधिक।',
  'Total amount under dispute in scope: ₹{0} Cr. This is value under appeal, not value recovered.':
    'दायरे में कुल विवादित राशि: ₹{0} करोड़। यह अपील में लंबित मूल्य है, वसूला गया मूल्य नहीं।',
  '{0} compliance early-warning alert(s) in scope; {1} currently open.':
    'दायरे में {0} अनुपालन पूर्व-चेतावनियाँ; वर्तमान में {1} लंबित।',
  'Leading alert types: {0}.': 'प्रमुख चेतावनी प्रकार: {0}.',
  'Recommended actions range from automated reminders to officer review queue escalation.':
    'संस्तुत कार्रवाइयाँ स्वचालित अनुस्मारकों से लेकर अधिकारी पुनर्विलोकन पंक्ति में बढ़ी हुई प्राथमिकता तक हैं।',
  'Early-warning outreach is informational only and does not constitute a formal notice.':
    'पूर्व-चेतावनी का संपर्क केवल सूचनात्मक है और वह औपचारिक नोटिस नहीं बनता।',
  'Scope: platform-wide. Governance metrics describe the AI layer itself and are not narrowed by taxpayer filters.':
    'दायरा: पूरा मंच। शासन-मापक AI परत का ही वर्णन करते हैं और करदाता फ़िल्टर से सीमित नहीं होते।',
  'Every figure in this report is an illustrative placeholder. There is no model, no gateway and no scheduled audit behind them, and no value below has been measured.':
    'इस रिपोर्ट का प्रत्येक आँकड़ा दृष्टांत हेतु अस्थायी है। उनके पीछे न कोई प्रारूप है, न द्वार, न कोई नियोजित लेखापरीक्षा, और नीचे का कोई मान मापा नहीं गया है।',
  '{0} AI recommendations generated to date; {1}% officer-approved.':
    'अब तक {0} AI संस्तुतियाँ उत्पन्न; {1}% अधिकारी द्वारा स्वीकृत।',
  '{0} suggestions rejected by officers; {1} pending governance review.':
    'अधिकारियों ने {0} सुझाव अस्वीकृत किए; {1} शासन पुनर्विलोकन लंबित।',
  'False-positive confirmation rate: {0} of {1} reviewed flags.':
    'मिथ्या सकारात्मक पुष्टि दर: पुनर्विलोकित {1} चिह्नों में से {0}.',
  'Model drift monitoring: {0}': 'प्रारूप अपसरण निगरानी: {0}',
  'Red-team testing: {0}': 'रेड-टीम परीक्षण: {0}',
  'CERT-In / VAPT readiness: {0}': 'CERT-In / VAPT तैयारी: {0}',
  'Maker-checker remains absolute: the AI system only ever occupies the maker / draft role and cannot independently execute an enforcement action.':
    'कर्ता-परीक्षक सिद्धांत निरपवाद रहता है: AI प्रणाली सदैव केवल कर्ता / प्रारूप की भूमिका में रहती है और स्वतंत्र रूप से कोई प्रवर्तन कार्रवाई नहीं कर सकती।',

  /* == Reports — screen chrome ========================================== */
  '{0} risk': '{0} जोखिम',
  'search "{0}"': 'खोज "{0}"',
  'whole modelled book, {0}': 'संपूर्ण प्रारूपित संग्रह, {0}',
  'Previewed report: {0}': 'पूर्वावलोकित रिपोर्ट: {0}',
  'Generate structured briefing notes and reports for the Commissioner, senior officers and audit/refund/investigation teams. Every report preview is a simulated AI-assisted draft assembled from current platform data for demonstration purposes only. It is not an official departmental record and requires review and sign-off by an authorised officer before circulation or filing. Each report states its own scope: most narrow with the header filters, and the ones that do not say so on the card and again in the draft.':
    'आयुक्त, वरिष्ठ अधिकारियों तथा लेखापरीक्षा/प्रतिदाय/जाँच दलों हेतु संरचित टिप्पणियाँ एवं रिपोर्ट बनाएँ। प्रत्येक रिपोर्ट पूर्वावलोकन वर्तमान मंच आँकड़ों से केवल प्रदर्शन हेतु जोड़ा गया, अनुकरण किया हुआ AI-सहायित प्रारूप है। वह आधिकारिक विभागीय अभिलेख नहीं है और परिचालन अथवा दाखिल करने से पहले प्राधिकृत अधिकारी का पुनर्विलोकन एवं हस्ताक्षर-अनुमोदन आवश्यक है। प्रत्येक रिपोर्ट अपना दायरा स्वयं बताती है: अधिकांश शीर्ष फ़िल्टर से सिमटती हैं, और जो नहीं सिमटतीं वे कार्ड पर और फिर प्रारूप में यह कहती हैं।',
  'Filter-Responsive Report Types': 'फ़िल्टर पर प्रतिक्रिया देने वाले रिपोर्ट प्रकार',
  'rest state their own scope': 'शेष अपना दायरा स्वयं बताती हैं',
  'Report Actions Logged This Session': 'इस सत्र में दर्ज रिपोर्ट कार्रवाइयाँ',
  'previews, export requests and copies': 'पूर्वावलोकन, निर्यात अनुरोध और प्रतियाँ',
  'Records in Current Scope': 'वर्तमान दायरे के अभिलेख',
  'taxpayers, filters applied': 'करदाता, फ़िल्टर लागू',
  'taxpayers, whole modelled book': 'करदाता, संपूर्ण प्रारूपित संग्रह',
  'Nothing on this page is a departmental record. Every draft below is assembled from demonstration data and is unsigned until an authorised officer reviews and signs it. The session figures above are counted from the audit trail on the AI Governance & Security screen; no report-generation history is kept beyond this session, and this page does not claim one. Most-handled report this session: {0}.':
    'इस पृष्ठ का कुछ भी विभागीय अभिलेख नहीं है। नीचे का प्रत्येक प्रारूप प्रदर्शन आँकड़ों से जोड़ा गया है और जब तक प्राधिकृत अधिकारी उसका पुनर्विलोकन कर हस्ताक्षर न करे, वह अहस्ताक्षरित ही रहता है। ऊपर के सत्र आँकड़े AI शासन एवं सुरक्षा पर्दे के लेखापरीक्षा अनुक्रम से गिने गए हैं; इस सत्र से आगे रिपोर्ट-निर्माण का कोई इतिहास नहीं रखा जाता, और यह पृष्ठ ऐसा दावा भी नहीं करता। इस सत्र में सर्वाधिक संभाली गई रिपोर्ट: {0}.',
  '{0} ({1} actions)': '{0} ({1} कार्रवाइयाँ)',
  'none yet': 'अभी एक भी नहीं',
  'Not scoped by taxpayer': 'करदाता के अनुसार दायरा नहीं',
  '0 {0} in scope': 'दायरे में 0 {0}',
  '{0} {1} in scope': 'दायरे में {0} {1}',
  'Drawn from: {0}': 'इससे लिया गया: {0}',
  'Draft — unsigned': 'प्रारूप — अहस्ताक्षरित',
  'Generated on': 'बनने की तिथि',
  'Scope covered': 'समाहित दायरा',
  'Drawn from': 'इससे लिया गया',
  'Records in scope': 'दायरे के अभिलेख',
  'Not scoped by taxpayer — describes the AI layer itself':
    'करदाता के अनुसार दायरा नहीं — यह AI परत का ही वर्णन करता है',
  '{0} {1}': '{0} {1}',
  'Prepared by (this session)': 'तैयार करने वाले (इस सत्र में)',
  '{0} · {1}': '{0} · {1}',
  'Officer sign-off': 'अधिकारी का हस्ताक्षर-अनुमोदन',
  'Not signed — required before circulation or filing':
    'हस्ताक्षरित नहीं — परिचालन अथवा दाखिल करने से पहले आवश्यक',
  'No records fall inside the current filters, so this draft has nothing to report on. Widen the header filters before circulating it — an empty brief reads as "nothing found" rather than "nothing selected".':
    'वर्तमान फ़िल्टर में कोई अभिलेख नहीं आता, इसलिए इस प्रारूप के पास बताने को कुछ नहीं है। परिचालन से पहले शीर्ष फ़िल्टर चौड़े करें — रिक्त टिप्पणी "कुछ चुना नहीं गया" नहीं, बल्कि "कुछ मिला नहीं" पढ़ी जाती है।',
  'Hide official-language summary': 'राजभाषा सारांश छिपाएँ',
  'Official-language summary': 'राजभाषा सारांश',
  'The body above is the draft as rendered in the language currently selected in the masthead. Any sentence with no entry in that language catalogue stays in English and is counted in the untranslated-string report on the AI Governance & Security screen.':
    'ऊपर का पाठ शीर्ष-पट्टी में इस समय चयनित भाषा में बना प्रारूप है। उस भाषा की संचिका में प्रविष्टि रहित कोई भी वाक्य अंग्रेज़ी में ही रहता है और AI शासन एवं सुरक्षा पर्दे की अनूदित-न-हुए-वाक्यों की रिपोर्ट में गिना जाता है।',
  '{0} — {1}': '{0} — {1}',
  'Prepared by (this session): {0} · {1}. Officer sign-off: not signed.':
    'तैयार करने वाले (इस सत्र में): {0} · {1}. अधिकारी का हस्ताक्षर-अनुमोदन: हस्ताक्षरित नहीं।',
  'This report preview is a simulated, AI-assisted draft generated from platform data for demonstration purposes only. It is not an official departmental record and requires review and sign-off by an authorised officer before circulation or filing. Nothing in it has been actioned, and no figure in it may be treated as a finding.':
    'यह रिपोर्ट पूर्वावलोकन मंच आँकड़ों से केवल प्रदर्शन हेतु बनाया गया, अनुकरण किया हुआ AI-सहायित प्रारूप है। वह आधिकारिक विभागीय अभिलेख नहीं है और परिचालन अथवा दाखिल करने से पहले प्राधिकृत अधिकारी का पुनर्विलोकन एवं हस्ताक्षर-अनुमोदन आवश्यक है। उसमें किसी बात पर कार्रवाई नहीं हुई है, और उसका कोई आँकड़ा निष्कर्ष नहीं माना जा सकता।',

  /* == Short lines — the reasoning sits behind them ============================ */
  'How this is computed':
    'यह कैसे परिकलित है',
  'Hide the basis for this':
    'इसका आधार छिपाएँ',
  'AI here is advisory only, under mandatory human review.':
    'यहाँ AI केवल सलाहकारी है, अनिवार्य मानवीय पुनर्विलोकन के अधीन।',
  'A control position, not an assurance — the platform holds no certification.':
    'यह नियंत्रण की स्थिति है, आश्वासन नहीं — मंच के पास कोई प्रमाणपत्र नहीं है।',
  'Ownership is read from the access configuration; no owner register exists.':
    'स्वामित्व पहुँच विन्यास से पढ़ा जाता है; स्वामियों की कोई पंजी नहीं।',
  'The AI only ever drafts. An officer approves or rejects every output.':
    'AI केवल प्रारूप बनाता है। प्रत्येक निष्कर्ष अधिकारी स्वीकृत या अस्वीकृत करता है।',
  'A role with a section is not automatically given every module in it.':
    'अनुभाग पाने वाली भूमिका को उसका प्रत्येक मॉड्यूल स्वतः नहीं मिलता।',
  'A trail with no overrides would be a warning sign, not a good result.':
    'एक भी अधिक्रमण रहित अनुक्रम चेतावनी होगा, अच्छा परिणाम नहीं।',
  'Approved, rejected and pending are an exhaustive split of what was generated.':
    'स्वीकृत, अस्वीकृत और लंबित मिलकर उत्पन्न सभी का संपूर्ण विभाजन बनाते हैं।',
  'Confidence is a property of the output, not a permission.':
    'विश्वास निष्कर्ष का गुण है, अनुमति नहीं।',
  'Illustrative only — no sampling programme produced this rate.':
    'केवल दृष्टांत हेतु — यह दर किसी प्रतिचयन कार्यक्रम से नहीं आया।',
  'Denied attempts are kept deliberately; the trail is session-only.':
    'अस्वीकृत प्रयास जानबूझकर रखे गए हैं; अनुक्रम केवल इसी सत्र भर है।',
  'Only the fact of a generation is logged — never the prompt or the output.':
    'केवल निर्माण हुआ इतना ही दर्ज होता है — संकेत अथवा निष्कर्ष कभी नहीं।',
  'A live gap indicator for this session, not a coverage audit.':
    'इस सत्र भर का जीवित कमी-संकेतक, व्याप्ति की लेखापरीक्षा नहीं।',

  /* == Control register — one line per control ============================ */
  'The AI drafts; an authorised officer approves or rejects.':
    'AI प्रारूप बनाता है; प्राधिकृत अधिकारी स्वीकृत या अस्वीकृत करता है।',
  'Every score traces back to the rules that fired and their weights.':
    'प्रत्येक अंक का सूत्र लागू हुए नियमों और उनके भारों तक जोड़ा जा सकता है।',
  'Access is decided per role at section level, then again per module.':
    'पहुँच प्रत्येक भूमिका हेतु पहले अनुभाग स्तर पर, फिर मॉड्यूलवार तय होती है।',
  'Every officer action is recorded, including denied attempts.':
    'प्रत्येक अधिकारी कार्रवाई दर्ज होती है — अस्वीकृत प्रयास भी सम्मिलित।',
  'The fact of each generation is logged; the content is not.':
    'प्रत्येक निर्माण हुआ इतना ही दर्ज होता है; सामग्री नहीं।',
  'No real taxpayer data is present, so no control has been exercised.':
    'वास्तविक करदाता आँकड़ा नहीं है, इसलिए कोई नियंत्रण प्रयोग नहीं हुआ।',
  'Not assessed — this build stores nothing and transmits nothing.':
    'मूल्यांकन नहीं — यह संस्करण न कुछ संचित करता है, न कुछ भेजता है।',
  'Not measured. No model and no sampling programme exist here.':
    'मापा नहीं गया। यहाँ न कोई प्रारूप है, न प्रतिचयन कार्यक्रम।',
  'Not carried out against this build.':
    'इस संस्करण पर नहीं किया गया।',
  'No integrations and no network calls, so there is nothing to assess.':
    'कोई एकीकरण नहीं और कोई नेटवर्क कॉल नहीं, इसलिए मूल्यांकन योग्य कुछ नहीं।',
  'No real personal data, so purpose limitation has not been exercised.':
    'वास्तविक व्यक्तिगत आँकड़ा नहीं, इसलिए प्रयोजन-सीमा प्रयोग नहीं हुई।',

  /* == Control register — bias monitoring ============================ */
  'No sampling programme runs, so the false-positive rate measures nothing.':
    'कोई प्रतिचयन कार्यक्रम नहीं चलता, इसलिए मिथ्या सकारात्मक दर कुछ भी नहीं मापती।',

  /* == Reports — short lines ============================ */
  'Structured briefing notes for the Commissioner and senior officers.':
    'आयुक्त एवं वरिष्ठ अधिकारियों हेतु संरचित टिप्पणियाँ।',
  'Nothing here is a departmental record until an officer signs it.':
    'अधिकारी के हस्ताक्षर तक यहाँ का कुछ भी विभागीय अभिलेख नहीं है।',
  'Nothing selected, not nothing found — widen the filters before circulating.':
    'कुछ चुना नहीं गया, कुछ मिला नहीं ऐसा नहीं — परिचालन से पहले फ़िल्टर चौड़े करें।',
  'A simulated draft. Requires officer review and sign-off before use.':
    'अनुकरण किया गया प्रारूप। प्रयोग से पहले अधिकारी पुनर्विलोकन एवं हस्ताक्षर आवश्यक।'
})
