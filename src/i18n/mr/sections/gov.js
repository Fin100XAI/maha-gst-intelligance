import { registerMessages } from '../../locale.js'

/**
 * Marathi — AI Governance & Security and Reports / Briefing Notes.
 *
 *   control (register)   → नियंत्रण (नियंत्रण नोंदवही)
 *   maker-checker        → कर्ता-पडताळणीकर्ता
 *   human-in-the-loop    → मानवी हस्तक्षेप अनिवार्य
 *   audit trail          → लेखापरीक्षण माग
 *   override             → अधिक्रमण
 *   disposition          → निपटारा
 *   confidence band      → विश्वास पट्टा
 *   false positive       → चुकीचा सकारात्मक निष्कर्ष
 *   illustrative placeholder → दृष्टांतापुरता तात्पुरता आकडा
 *   append-only          → केवळ जोड-योग्य
 *   tamper-evident       → छेडछाड उघड करणारा
 *   drift                → अपसरण
 *   sign-off             → स्वाक्षरी-मंजुरी
 *
 * Statute and standard names stay in Latin — CERT-In, VAPT, mutual TLS,
 * Digital Personal Data Protection Act, 2023.
 */
registerMessages('mr', {
  /* == Control register — states ======================================== */
  '…': '…',
  'Implemented in this build': 'या आवृत्तीत अंमलात',
  'Not in place': 'अस्तित्वात नाही',
  'Not applicable to this build': 'या आवृत्तीला लागू नाही',
  '{0} implemented': '{0} अंमलात',
  '{0} not in place': '{0} अस्तित्वात नाही',
  '{0} not applicable': '{0} लागू नाही',
  State: 'स्थिती',
  'Current state and production requirement': 'सध्याची स्थिती आणि उत्पादन-स्तरीय आवश्यकता',
  Owner: 'मालक',

  /* == Control register — the controls ================================== */
  'Maker-checker / human-in-the-loop': 'कर्ता-पडताळणीकर्ता / मानवी हस्तक्षेप अनिवार्य',
  'The AI system only ever occupies the maker / draft role and cannot independently execute an enforcement action. Every AI output is advisory and passes through an authorised officer who verifies the evidence and approves or rejects it. Visible in the workflow strip below and in the Human Approval step of the Audit & Scrutiny Engine.':
    'AI प्रणाली केवळ कर्ता / मसुदा या भूमिकेतच असते आणि स्वतंत्रपणे कोणतीही अंमलबजावणी कारवाई करू शकत नाही. प्रत्येक AI निष्कर्ष सल्लागार स्वरूपाचा असून तो पुरावा पडताळून मंजूर वा नामंजूर करणाऱ्या अधिकृत अधिकाऱ्यामार्फतच जातो. हे खालील कार्यप्रवाह पट्टीत आणि लेखापरीक्षण व छाननी यंत्रातील मानवी मंजुरी पायरीत दिसते.',
  "Production requirement: bind the approval to the officer's authenticated identity in the departmental system of record, so the approval cannot be replayed or attributed to the wrong officer.":
    'उत्पादन-स्तरीय आवश्यकता: मंजुरी ही विभागाच्या अधिकृत अभिलेख प्रणालीतील अधिकाऱ्याच्या प्रमाणित ओळखीशी बांधावी, जेणेकरून ती पुन्हा वापरता येणार नाही किंवा चुकीच्या अधिकाऱ्याच्या नावावर जाणार नाही.',
  'Every risk score is fully attributable to a discrete set of weighted, transparent rules — there is no black-box scoring. An officer can trace any rating back to the exact triggered indicators and their weight contribution through the "Why flagged?" panel used app-wide.':
    'प्रत्येक जोखीम गुण हा भारित व पारदर्शक नियमांच्या ठराविक संचावर पूर्णपणे जोडता येतो — इथे कोणतेही अपारदर्शक गुणांकन नाही. संपूर्ण अनुप्रयोगात वापरल्या जाणाऱ्या "का चिन्हांकित?" पटलामार्फत अधिकारी कोणत्याही मानांकनाचा माग नेमक्या लागू झालेल्या निर्देशकांपर्यंत आणि त्यांच्या वजनातील योगदानापर्यंत काढू शकतो.',
  'Production requirement: hold the rule set and its weights under version control with change approval, so a score can be reconstructed as it stood on the date the officer acted.':
    'उत्पादन-स्तरीय आवश्यकता: नियम संच आणि त्यांची वजने बदल-मंजुरीसह आवृत्ती नियंत्रणाखाली ठेवावीत, जेणेकरून अधिकाऱ्याने कारवाई केली त्या तारखेला गुण जसे होते तसे पुन्हा उभे करता येतील.',
  'Access is decided per role at section level and then again at module level. The matrix below is generated from that configuration at render time rather than described alongside it, so it cannot drift from what the platform actually enforces.':
    'प्रवेश हा प्रत्येक भूमिकेसाठी आधी विभाग पातळीवर आणि नंतर पुन्हा घटक पातळीवर ठरवला जातो. खालील जाळी त्या संरचनेवरून पडदा रचतानाच तयार केली जाते — तिचे वेगळे वर्णन लिहिलेले नाही, त्यामुळे मंच प्रत्यक्षात जे लागू करतो त्यापासून ती दूर जाऊ शकत नाही.',
  'Production requirement: enforce the same matrix server-side against an authenticated session. The check in this build runs in the browser and a client-side check is not access control.':
    'उत्पादन-स्तरीय आवश्यकता: हीच जाळी प्रमाणित सत्राच्या तुलनेत सर्व्हरवर लागू करावी. या आवृत्तीतील तपासणी ब्राउझरमध्ये चालते, आणि ग्राहक-बाजूची तपासणी म्हणजे प्रवेश नियंत्रण नव्हे.',
  'Audit trail capture': 'लेखापरीक्षण माग नोंदवणे',
  'Every officer action is recorded with user, role, action, module, case reference, IP, device and outcome, including denied attempts. Entries from this session are marked Live in the trail below.':
    'प्रत्येक अधिकारी कृती ही वापरकर्ता, भूमिका, कृती, घटक, प्रकरण संदर्भ, IP, उपकरण आणि निष्पत्ती यांसह नोंदवली जाते — नाकारलेले प्रयत्नही धरून. या सत्रातील नोंदी खालील मागात "जिवंत" अशा खुणावल्या आहेत.',
  'Production requirement: append-only, tamper-evident storage with a defined retention period and an integrity check. This build holds the trail in browser memory and loses it on reload, so it evidences the capture, not the preservation.':
    'उत्पादन-स्तरीय आवश्यकता: ठराविक जतन कालावधी आणि अखंडता तपासणीसह केवळ जोड-योग्य, छेडछाड उघड करणारा साठा. ही आवृत्ती माग ब्राउझरच्या स्मृतीत ठेवते आणि पान पुन्हा उघडताच तो नाहीसा होतो, त्यामुळे ती नोंद घेण्याचा पुरावा देते, जतनाचा नाही.',
  'AI Copilot usage logging': 'AI सहायक वापराची नोंद',
  'Each draft, summary, checklist or translation the Copilot produces is logged separately from the general system trail: the fact of the generation, the officer, the case and the time. Prompt and output content are deliberately not persisted.':
    'सहायक तयार करणारा प्रत्येक मसुदा, सारांश, तपासयादी किंवा भाषांतर सर्वसाधारण प्रणाली मागापेक्षा स्वतंत्रपणे नोंदवला जातो: निर्मिती झाली ही वस्तुस्थिती, अधिकारी, प्रकरण आणि वेळ. सूचना-मजकूर व निष्कर्ष-मजकूर जाणीवपूर्वक जतन केला जात नाही.',
  'Production requirement: retain the same usage record server-side, and decide the retention period for generated content explicitly rather than by omission.':
    'उत्पादन-स्तरीय आवश्यकता: हीच वापर नोंद सर्व्हरवर ठेवावी, आणि तयार झालेल्या मजकुराचा जतन कालावधी वगळून नव्हे तर स्पष्टपणे ठरवावा.',
  'Data minimisation / PII masking': 'माहितीचे किमानीकरण / वैयक्तिक ओळख माहिती झाकणे',
  'Encryption at rest and in transit': 'साठवणुकीत आणि वहनात कूटबद्धता',
  'Adversarial / red-team testing': 'प्रतिकूल / रेड-टीम चाचणी',
  'This demonstration has no integrations and makes no network calls, so there is no gateway, no token and no external endpoint to assess.':
    'या प्रात्यक्षिकात कोणतेही एकात्मीकरण नाही आणि ते कोणताही नेटवर्क कॉल करत नाही, त्यामुळे मूल्यमापन करण्यासारखे कोणतेही प्रवेशद्वार, टोकन किंवा बाह्य पत्ता अस्तित्वातच नाही.',
  'Production requirement: route every AI Copilot and reporting integration through the departmental secure gateway with mutual TLS, request signing and role-scoped API tokens, and transmit no taxpayer data to external, uncontrolled endpoints.':
    'उत्पादन-स्तरीय आवश्यकता: प्रत्येक AI सहायक व अहवाल एकात्मीकरण हे mutual TLS, विनंती स्वाक्षरी आणि भूमिकानिहाय मर्यादित API टोकन यांसह विभागाच्या सुरक्षित प्रवेशद्वारामार्फतच न्यावे, आणि बाह्य, अनियंत्रित पत्त्यांना कोणतीही करदाता माहिती पाठवू नये.',
  'No real taxpayer data is present in this demonstration — every record on the platform is generated. No purpose-limitation, retention or consent control has therefore been exercised against real personal data.':
    'या प्रात्यक्षिकात कोणतीही खरी करदाता माहिती नाही — मंचावरील प्रत्येक नोंद तयार केलेली आहे. त्यामुळे खऱ्या वैयक्तिक माहितीवर प्रयोजन-मर्यादा, जतन किंवा संमती यांपैकी कोणतेही नियंत्रण वापरलेले नाही.',
  'Production requirement: process taxpayer personal and financial data strictly for stated revenue-assurance and compliance purposes under the Digital Personal Data Protection Act, 2023, with purpose limitation, access logging and retention controls evidenced.':
    'उत्पादन-स्तरीय आवश्यकता: करदात्याची वैयक्तिक व आर्थिक माहिती Digital Personal Data Protection Act, 2023 अंतर्गत केवळ जाहीर केलेल्या महसूल-हमी व अनुपालन प्रयोजनांसाठीच हाताळावी, आणि प्रयोजन-मर्यादा, प्रवेश नोंदी व जतन नियंत्रणे यांचा पुरावा ठेवावा.',
  'No sampling programme runs in this demonstration. The false-positive rate shown on this screen is an illustrative placeholder and measures nothing.':
    'या प्रात्यक्षिकात कोणताही नमुना कार्यक्रम चालत नाही. या पडद्यावर दाखवलेला चुकीच्या सकारात्मक निष्कर्षांचा दर हा दृष्टांतापुरता तात्पुरता आकडा असून तो काहीही मोजत नाही.',
  'Production requirement: sample AI-flagged cases continuously for officer review and track the confirmed false-positive rate by sector and district, to detect systemic bias or drift.':
    'उत्पादन-स्तरीय आवश्यकता: AI ने चिन्हांकित केलेल्या प्रकरणांचे अधिकारी पुनर्विलोकनासाठी सतत नमुने घ्यावेत आणि निश्चित झालेल्या चुकीच्या सकारात्मक निष्कर्षांचा दर क्षेत्र व जिल्हानिहाय नोंदवावा, जेणेकरून प्रणालीगत पूर्वग्रह किंवा अपसरण ओळखता येईल.',

  /* == Governance — headline ============================================ */
  'Governance metrics on this screen describe the AI layer itself and are not narrowed by the taxpayer filters above; only the audit trail responds to the search box. Oversight console for AI-assisted decision support across the platform — the control register and its evidence, role-based access as the platform actually enforces it, officer override history, and audit trail integrity. AI systems here operate strictly in an advisory capacity under mandatory human review.':
    'या पडद्यावरील प्रशासन मापके AI स्तराचेच वर्णन करतात आणि वरील करदाता गाळण्यांनी ती मर्यादित होत नाहीत; केवळ लेखापरीक्षण माग शोध पेटीला प्रतिसाद देतो. संपूर्ण मंचावरील AI-सहाय्यित निर्णय आधारासाठीचा हा देखरेख कक्ष — नियंत्रण नोंदवही आणि तिचा पुरावा, मंच प्रत्यक्षात लागू करतो तसे भूमिका-आधारित प्रवेश, अधिकारी अधिक्रमणाचा इतिहास, आणि लेखापरीक्षण मागाची अखंडता. इथल्या AI प्रणाली अनिवार्य मानवी पुनर्विलोकनाखाली केवळ सल्लागार क्षमतेतच चालतात.',
  'Controls in Register': 'नोंदवहीतील नियंत्रणे',
  'Implemented in This Build': 'या आवृत्तीत अंमलात असलेली',
  'Controls Not in Place': 'अस्तित्वात नसलेली नियंत्रणे',
  'External Certifications Held': 'धारण केलेली बाह्य प्रमाणपत्रे',
  'none claimed': 'एकाचाही दावा नाही',
  'Read this page as a control position, not as an assurance. "Implemented in this build" means an assessor can watch the control work in this demonstration; it is not an accreditation, a certification or an independent assessment, and the platform holds none of those. Every model figure on this screen — recommendation counts, confidence bands and the false-positive rate — is an illustrative placeholder: there is no model, no gateway and no scheduled audit behind them. The audit trail, the access matrix and the translation coverage below are the only figures on this page counted from something that actually exists.':
    'हे पान नियंत्रणाची स्थिती म्हणून वाचा, हमी म्हणून नव्हे. "या आवृत्तीत अंमलात" याचा अर्थ मूल्यमापकाला हे नियंत्रण या प्रात्यक्षिकात चालताना पाहता येते; ती मान्यता, प्रमाणपत्र किंवा स्वतंत्र मूल्यमापन नव्हे, आणि मंचाकडे यांपैकी काहीही नाही. या पडद्यावरील प्रत्येक प्रारूप आकडा — शिफारशींची संख्या, विश्वास पट्टे आणि चुकीच्या सकारात्मक निष्कर्षांचा दर — दृष्टांतापुरता तात्पुरता आकडा आहे: त्यांच्यामागे कोणतेही प्रारूप, प्रवेशद्वार किंवा नियोजित लेखापरीक्षण नाही. लेखापरीक्षण माग, प्रवेश जाळी आणि खालील भाषांतर व्याप्ती हेच या पानावरील प्रत्यक्षात अस्तित्वात असलेल्या गोष्टींवरून मोजलेले एकमेव आकडे आहेत.',
  'AI Control Register': 'AI नियंत्रण नोंदवही',
  'What each control is, its state in this build, what production would require, and who owns it':
    'प्रत्येक नियंत्रण काय आहे, या आवृत्तीतील त्याची स्थिती, उत्पादन स्तरावर काय लागेल, आणि त्याचा मालक कोण',
  'Roles configured for this console ({0} listed below)':
    'या कक्षासाठी निश्चित केलेल्या भूमिका (खाली {0} दिल्या आहेत)',
  'Not assigned — this build holds no control-owner register':
    'नेमलेले नाही — या आवृत्तीत नियंत्रण-मालकांची नोंदवही नाही',
  'Ownership is derived from the access configuration, which is the only ownership statement this build can evidence: the roles that can open this console are {0}. No separate control-owner register exists, so the infrastructure controls above have no named accountable owner. Production requirement: name an accountable owner and a review cycle for every row before go-live.':
    'मालकी प्रवेश संरचनेवरून काढली आहे, कारण या आवृत्तीत पुरावा देता येईल असे मालकीचे तेवढेच एक विधान आहे: हा कक्ष उघडू शकणाऱ्या भूमिका {0} या आहेत. नियंत्रण-मालकांची स्वतंत्र नोंदवही नाही, त्यामुळे वरील पायाभूत नियंत्रणांना नावानिशी जबाबदार मालक नाही. उत्पादन-स्तरीय आवश्यकता: प्रत्यक्ष सुरुवातीपूर्वी प्रत्येक ओळीसाठी जबाबदार मालक आणि पुनर्विलोकन चक्र नेमावे.',
  'CERT-In / VAPT Readiness Checklist': 'CERT-In / VAPT सज्जता तपासयादी',
  'Controls a production deployment must evidence — none has been carried out against this build':
    'उत्पादन-स्तरीय तैनातीने ज्यांचा पुरावा द्यावा लागेल अशी नियंत्रणे — यांपैकी एकही या आवृत्तीवर पार पाडलेले नाही',
  '0 of {0} completed': '{0} पैकी 0 पूर्ण',
  'No step in this platform bypasses the officer. There is no configuration, threshold or confidence band at which an AI output executes on its own.':
    'या मंचावरील कोणतीही पायरी अधिकाऱ्याला वगळून जात नाही. AI निष्कर्ष स्वतःहून अंमलात येईल अशी कोणतीही संरचना, उंबरठा किंवा विश्वास पट्टा अस्तित्वात नाही.',

  /* == Governance — access matrix ======================================= */
  'Role-Based Access Control — as enforced': 'भूमिका-आधारित प्रवेश नियंत्रण — जसे लागू आहे',
  'Generated from the platform access configuration at render time, not described alongside it':
    'पडदा रचतानाच मंचाच्या प्रवेश संरचनेवरून तयार केलेले, तिचे वेगळे वर्णन लिहून नव्हे',
  '{0} roles · {1} modules': '{0} भूमिका · {1} घटक',
  'Sections granted': 'दिलेले विभाग',
  'Modules reachable': 'पोहोचता येणारे घटक',
  'Denied at module level despite section access':
    'विभाग प्रवेश असूनही घटक पातळीवर नाकारलेले',
  'Opens this console': 'हा कक्ष उघडतो',
  'Module counts include the Officer AI Copilot, which is reachable but not listed in the navigation menu. A role with a section is not automatically given every module inside it — the fourth column is that second layer on its own.':
    'घटकांच्या संख्येत अधिकारी AI सहायकाचा समावेश आहे, ज्यापर्यंत पोहोचता येते पण तो दिशादर्शक मेनूत दिलेला नाही. एखाद्या भूमिकेला विभाग मिळाला म्हणून त्यातील प्रत्येक घटक आपोआप मिळत नाही — चौथा स्तंभ म्हणजे तोच दुसरा स्तर, स्वतंत्रपणे.',

  /* == Governance — overrides and activity ============================== */
  'Officer Override & Disposition History': 'अधिकारी अधिक्रमण व निपटारा इतिहास',
  'Every logged instance of an officer overriding, rejecting or approving an AI-assisted output — the maker-checker control as it appears in the trail':
    'अधिकाऱ्याने AI-सहाय्यित निष्कर्ष अधिक्रमित, नामंजूर किंवा मंजूर केल्याची प्रत्येक नोंदलेली घटना — कर्ता-पडताळणीकर्ता नियंत्रण मागात जसे दिसते तसे',
  '{0} of {1} trail entries': '{1} माग नोंदींपैकी {0}',
  'Search override history...': 'अधिक्रमण इतिहास शोधा...',
  'No override or disposition entries in the current trail. Overriding an AI risk flag or marking a false positive anywhere in the platform records an entry here.':
    'सध्याच्या मागात अधिक्रमण किंवा निपटाऱ्याची एकही नोंद नाही. मंचावर कुठेही AI जोखीम खूण अधिक्रमित केल्यास किंवा चुकीचा सकारात्मक निष्कर्ष म्हणून खुणावल्यास इथे नोंद होते.',
  'Officer decision': 'अधिकाऱ्याचा निर्णय',
  'An override is an officer disagreeing with the platform, which is the outcome the maker-checker control exists to make possible. A trail with no overrides in it would be a warning sign, not a good result.':
    'अधिक्रमण म्हणजे अधिकाऱ्याचे मंचाशी असहमत होणे, आणि कर्ता-पडताळणीकर्ता नियंत्रण ज्या निष्पत्तीसाठी अस्तित्वात आहे तीच ही आहे. एकही अधिक्रमण नसलेला माग हा चांगला निकाल नव्हे, इशारा असेल.',
  'AI Decision-Support Activity': 'AI निर्णय-आधार कार्यवाही',
  'Illustrative placeholder figures — nothing below is measured':
    'दृष्टांतापुरते तात्पुरते आकडे — खालील काहीही मोजलेले नाही',
  'Illustrative placeholder': 'दृष्टांतापुरता तात्पुरता आकडा',
  'Recommendations generated': 'तयार झालेल्या शिफारशी',
  'Officer-approved': 'अधिकाऱ्याने मंजूर',
  '{0}% of generated': 'तयार झालेल्यांपैकी {0}%',
  'Rejected by officer': 'अधिकाऱ्याने नामंजूर',
  'Pending governance review': 'प्रशासन पुनर्विलोकन प्रलंबित',
  'Disposition check: approved plus rejected plus pending accounts for {0} of {1} recommendations, leaving {2} unexplained. The three figures are presented as an exhaustive split, so a non-zero remainder would mean the split is wrong. {3}% of generated recommendations have been disposed of one way or the other.':
    'निपटारा तपासणी: मंजूर अधिक नामंजूर अधिक प्रलंबित मिळून {1} शिफारशींपैकी {0} भरतात, आणि {2} अस्पष्ट राहतात. हे तीन आकडे संपूर्ण विभागणी म्हणून मांडले आहेत, त्यामुळे शून्येतर शिल्लक म्हणजे विभागणीच चुकीची असल्याचे लक्षण. तयार झालेल्या शिफारशींपैकी {3}% कोणत्या ना कोणत्या मार्गाने निकाली निघाल्या आहेत.',
  'Share of AI outputs by confidence band — illustrative placeholder':
    'विश्वास पट्ट्यानुसार AI निष्कर्षांचा वाटा — दृष्टांतापुरता तात्पुरता आकडा',
  'Bands total {0}%': 'पट्ट्यांची बेरीज {0}%',
  'Confidence is a property of the output, not a permission. A "Very High" band does not shorten the officer review path — every band goes through the same maker-checker step.':
    'विश्वास हा निष्कर्षाचा गुणधर्म आहे, परवानगी नव्हे. "अत्युच्च" पट्ट्यामुळे अधिकारी पुनर्विलोकनाचा मार्ग आखूड होत नाही — प्रत्येक पट्टा त्याच कर्ता-पडताळणीकर्ता पायरीतून जातो.',
  'Human-in-the-loop review outcomes for AI-flagged cases — illustrative placeholder':
    'AI ने चिन्हांकित केलेल्या प्रकरणांतील मानवी पुनर्विलोकनाच्या निष्पत्ती — दृष्टांतापुरता तात्पुरता आकडा',
  'Not measured': 'मोजलेले नाही',
  'Of {0} AI-generated risk flags submitted for officer review, {1} were confirmed as false positives ({2}%). No sampling programme produced these numbers — they are illustrative. Production requirement: track this rate continuously by sector and district to monitor model precision; it must never by itself trigger an automated model change.':
    'अधिकारी पुनर्विलोकनासाठी सादर केलेल्या {0} AI-निर्मित जोखीम खुणांपैकी {1} चुकीचे सकारात्मक निष्कर्ष म्हणून निश्चित झाल्या ({2}%). हे आकडे कोणत्याही नमुना कार्यक्रमातून आलेले नाहीत — ते दृष्टांतापुरते आहेत. उत्पादन-स्तरीय आवश्यकता: प्रारूपाची अचूकता तपासण्यासाठी हा दर क्षेत्र व जिल्हानिहाय सतत नोंदवावा; त्याने स्वतःहून कधीही प्रारूपात स्वयंचलित बदल घडवू नये.',

  /* == Governance — trail integrity and language ======================== */
  'Audit Trail Integrity': 'लेखापरीक्षण मागाची अखंडता',
  "Properties counted off the trail below, including this session's own entries":
    'खालील मागावरून मोजलेले गुणधर्म, या सत्राच्या स्वतःच्या नोंदींसह',
  'Entries held': 'ठेवलेल्या नोंदी',
  '{0} live this session': 'या सत्रात {0} जिवंत',
  'Denied attempts': 'नाकारलेले प्रयत्न',
  '{0}% of entries': 'नोंदींपैकी {0}%',
  'Distinct officers': 'वेगवेगळे अधिकारी',
  'across {0} roles': '{0} भूमिकांमध्ये',
  'Modules covered': 'व्यापलेले घटक',
  'Entries with a case reference': 'प्रकरण संदर्भ असलेल्या नोंदी',
  'Coverage window': 'व्याप्तीचा कालपट',
  'to {0}': '{0} पर्यंत',
  'Denied attempts are kept in the trail deliberately: a log that records only what succeeded cannot evidence that access control refused anything. The trail is held in browser memory for this session and is lost on reload — it evidences capture, not preservation, and production requires append-only, tamper-evident storage with a defined retention period.':
    'नाकारलेले प्रयत्न मागात जाणीवपूर्वक ठेवले आहेत: जी नोंदवही केवळ यशस्वी झालेलेच नोंदवते ती प्रवेश नियंत्रणाने काही नाकारले याचा पुरावा देऊ शकत नाही. हा माग या सत्रापुरता ब्राउझरच्या स्मृतीत ठेवला जातो आणि पान पुन्हा उघडताच नाहीसा होतो — तो नोंद घेण्याचा पुरावा देतो, जतनाचा नाही, आणि उत्पादन स्तरावर ठराविक जतन कालावधीसह केवळ जोड-योग्य, छेडछाड उघड करणारा साठा लागतो.',
  'Official-Language Coverage': 'राजभाषा व्याप्ती',
  'Strings that fell back to English in this browser session, and the size of each catalogue':
    'या ब्राउझर सत्रात इंग्रजीवर परत गेलेली वाक्ये, आणि प्रत्येक संचिकेचा आकार',
  '{0} untranslated strings observed': 'भाषांतर न झालेली {0} वाक्ये आढळली',
  'Active language': 'सुरू असलेली भाषा',
  '{0} catalogue entries': '{0} संचिका नोंदी',
  'Fallback occurrences': 'परत जाण्याच्या घटना',
  '{0} distinct strings': '{0} वेगवेगळी वाक्ये',
  'String with no catalogue entry': 'संचिकेत नोंद नसलेले वाक्य',
  'Times shown': 'किती वेळा दिसले',
  'This counts only what this browser has rendered since the page loaded, in the currently selected language — it is a live gap indicator, not a coverage audit, and it reads zero in English because English is the source language. A string listed here reaches an officer in English on a screen they have set to Marathi or Hindi. Production requirement: drive this to zero for every officer-facing string before an official-language deployment.':
    'पान उघडल्यापासून या ब्राउझरने सध्या निवडलेल्या भाषेत जे रचले तेवढेच यात मोजले जाते — हा जिवंत त्रुटी निर्देशक आहे, व्याप्तीचे लेखापरीक्षण नव्हे, आणि इंग्रजीत तो शून्य दाखवतो कारण इंग्रजी हीच स्रोत भाषा आहे. इथे दिलेले वाक्य, अधिकाऱ्याने मराठी किंवा हिंदी निवडलेल्या पडद्यावरही त्याच्यापर्यंत इंग्रजीतच पोहोचते. उत्पादन-स्तरीय आवश्यकता: राजभाषेतील तैनातीपूर्वी अधिकाऱ्यासमोर येणाऱ्या प्रत्येक वाक्यासाठी हा आकडा शून्यावर आणावा.',

  /* == Reports — scope descriptors ====================================== */
  'Follows the header filters': 'शीर्ष गाळण्या पाळतो',
  'Partly statewide — stated in the draft': 'अंशतः राज्यव्यापी — मसुद्यात नमूद',
  'Platform-wide — taxpayer filters do not apply':
    'संपूर्ण मंचावर — करदाता गाळण्या लागू होत नाहीत',
  'Taxpayer register, district revenue, compliance alerts':
    'करदाता नोंदवही, जिल्हा महसूल, अनुपालन सूचना',
  'Statewide monthly revenue trend, taxpayer register, refund pipeline':
    'राज्यव्यापी मासिक महसूल कल, करदाता नोंदवही, परतावा मालिका',
  districts: 'जिल्हे',
  'District revenue, targets and officer workload': 'जिल्हा महसूल, लक्ष्ये आणि अधिकारी कामाचा भार',
  sectors: 'क्षेत्रे',
  'Fixed sector benchmarks and the taxpayer register':
    'निश्चित क्षेत्रीय मानके आणि करदाता नोंदवही',
  'Taxpayer register — ITC spike and circular-trading signals':
    'करदाता नोंदवही — ITC उसळी आणि वर्तुळाकार व्यापाराचे संकेत',
  'refund cases': 'परतावा प्रकरणे',
  'Refund case pipeline': 'परतावा प्रकरण मालिका',
  'Audit case pipeline': 'लेखापरीक्षण प्रकरण मालिका',
  'Litigation and appeal register': 'न्यायालयीन व अपील नोंदवही',
  alerts: 'सूचना',
  'Compliance early-warning alerts': 'अनुपालन पूर्वसूचना',
  'AI governance metrics (illustrative placeholders)':
    'AI प्रशासन मापके (दृष्टांतापुरते तात्पुरते आकडे)',
  '{0} ({1})': '{0} ({1})',
  'Scope: {0}.': 'व्याप्ती: {0}.',

  /* == Reports — draft bodies =========================================== */
  'GST revenue modelled: ₹{0} Cr across {1} taxpayers in scope.':
    'प्रारूपित GST महसूल: व्याप्तीतील {1} करदात्यांमध्ये मिळून ₹{0} कोटी.',
  'Estimated high-risk revenue exposure: ₹{0} Cr ({1} Critical, {2} High risk entities).':
    'अंदाजित उच्च-जोखीम महसूल रक्कम: ₹{0} कोटी ({1} अतिगंभीर, {2} उच्च जोखमीच्या संस्था).',
  'Highest risk-taxpayer concentration: {0}.': 'सर्वाधिक जोखीम-करदाता संकेंद्रण: {0}.',
  '{0} compliance early-warning alerts in scope; {1} currently open.':
    'व्याप्तीत {0} अनुपालन पूर्वसूचना; सध्या {1} प्रलंबित.',
  'Audit recovery pipeline: ₹{0} Cr; {1} non-filers in scope.':
    'लेखापरीक्षण वसुली मालिका: ₹{0} कोटी; व्याप्तीत {1} विवरण न भरणारे.',
  'Latest month ({0}) statewide collection: ₹{1} Cr against a target of ₹{2} Cr ({3} Cr variance). The monthly trend series is statewide and is not narrowed by district or sector filters.':
    'ताज्या महिन्यातील ({0}) राज्यव्यापी वसुली: ₹{2} कोटी लक्ष्याच्या तुलनेत ₹{1} कोटी ({3} कोटी विचलन). मासिक कल मालिका राज्यव्यापी असून जिल्हा किंवा क्षेत्र गाळण्यांनी ती मर्यादित होत नाही.',
  'Estimated high-risk revenue exposure in scope: ₹{0} Cr.':
    'व्याप्तीतील अंदाजित उच्च-जोखीम महसूल रक्कम: ₹{0} कोटी.',
  '{0} taxpayers in scope flagged for elevated ITC risk indicators.':
    'व्याप्तीतील {0} करदाते वाढीव ITC जोखीम निर्देशकांसाठी चिन्हांकित.',
  '{0} refund cases in scope remain under active risk review.':
    'व्याप्तीतील {0} परतावा प्रकरणे अजूनही सक्रिय जोखीम पुनर्विलोकनाखाली आहेत.',
  '{0} district(s) assessed against monthly revenue targets.':
    'मासिक महसूल लक्ष्यांच्या तुलनेत {0} जिल्ह्यांचे मूल्यमापन.',
  'Largest shortfall: {0} at {1}% gap (target ₹{2} Cr vs actual ₹{3} Cr).':
    'सर्वात मोठी तूट: {0}, {1}% अंतर (लक्ष्य ₹{2} कोटी विरुद्ध प्रत्यक्ष ₹{3} कोटी).',
  'Strongest performance: {0} at {1}% against target.':
    'सर्वोत्तम कामगिरी: {0}, लक्ष्याच्या तुलनेत {1}%.',
  'Highest officer workload: {0} at {1}% officer utilisation (average case ageing {2} days).':
    'सर्वाधिक अधिकारी कामाचा भार: {0}, {1}% अधिकारी वापर (सरासरी प्रकरण वय {2} दिवस).',
  'Combined risk-taxpayer count across districts in scope: {0}.':
    'व्याप्तीतील जिल्ह्यांमध्ये मिळून जोखीम-करदात्यांची एकत्रित संख्या: {0}.',
  '{0} sector(s) benchmarked for tax ratio, ITC ratio and refund ratio deviation.':
    'कर गुणोत्तर, ITC गुणोत्तर आणि परतावा गुणोत्तरातील विचलनासाठी {0} क्षेत्रांचे मानकांकन.',
  'Highest concentration of high/critical-risk taxpayers: {0}.':
    'उच्च/अतिगंभीर जोखमीच्या करदात्यांचे सर्वाधिक संकेंद्रण: {0}.',
  'No sector in scope currently carries a high or critical-risk taxpayer.':
    'व्याप्तीतील कोणत्याही क्षेत्रात सध्या उच्च किंवा अतिगंभीर जोखमीचा करदाता नाही.',
  'Taxpayer count in scope: {0}.': 'व्याप्तीतील करदात्यांची संख्या: {0}.',
  'Benchmark ratios are fixed departmental reference values and do not vary with the header filters.':
    'मानक गुणोत्तरे ही विभागाची निश्चित संदर्भ मूल्ये असून ती शीर्ष गाळण्यांनुसार बदलत नाहीत.',
  '{0} taxpayers in scope flagged for ITC-related risk indicators (abnormal spike and/or circular trading signal).':
    'व्याप्तीतील {0} करदाते ITC-संबंधित जोखीम निर्देशकांसाठी चिन्हांकित (असामान्य उसळी आणि/किंवा वर्तुळाकार व्यापाराचा संकेत).',
  'Abnormal ITC spike signal present in {0} records; circular trading signal in {1} records.':
    'असामान्य ITC उसळीचा संकेत {0} नोंदींत; वर्तुळाकार व्यापाराचा संकेत {1} नोंदींत.',
  'Top estimated revenue exposure: {0}.': 'सर्वाधिक अंदाजित महसूल जोखीम रक्कम: {0}.',
  '{0} (₹{1}L)': '{0} (₹{1} लाख)',
  'All figures represent statistical risk signals for officer-led verification, not confirmed evasion.':
    'सर्व आकडे हे अधिकाऱ्याने पडताळणी करण्यासाठीचे सांख्यिकीय जोखीम संकेत आहेत, निश्चित झालेली करचुकवेगिरी नव्हे.',
  '{0} refund case(s) in scope in the risk-ranked pipeline.':
    'जोखीम-क्रमवार मालिकेत व्याप्तीतील {0} परतावा प्रकरणे.',
  '{0} require officer review; {1} recommended for escalated scrutiny.':
    '{0} प्रकरणांना अधिकारी पुनर्विलोकन आवश्यक; {1} प्रकरणे वाढीव छाननीसाठी शिफारस केलेली.',
  'Total claimed refund value in scope: ₹{0} Lakh.':
    'व्याप्तीत दावा केलेले एकूण परतावा मूल्य: ₹{0} लाख.',
  'Export-linked claims: {0} of {1}.': 'निर्यात-संबंधित दावे: {1} पैकी {0}.',
  '{0} case(s) in scope in the risk-ranked audit pipeline.':
    'जोखीम-क्रमवार लेखापरीक्षण मालिकेत व्याप्तीतील {0} प्रकरणे.',
  '{0} Critical-risk and {1} High-risk cases recommended for priority scoping.':
    'प्राधान्याने व्याप्ती ठरवण्यासाठी {0} अतिगंभीर-जोखीम आणि {1} उच्च-जोखीम प्रकरणे शिफारस केलेली.',
  'Combined estimated revenue exposure in scope: ₹{0} Cr.':
    'व्याप्तीतील एकत्रित अंदाजित महसूल जोखीम रक्कम: ₹{0} कोटी.',
  'Cases span {0} district(s) and {1} sector(s).':
    'प्रकरणे {0} जिल्हे आणि {1} क्षेत्रे व्यापतात.',
  '{0} active appeal/litigation case(s) in scope.':
    'व्याप्तीत {0} सक्रिय अपील/न्यायालयीन प्रकरणे.',
  'Department success rate on decided matters in scope: {0}% ({1} of {2} decided).':
    'व्याप्तीतील निर्णीत प्रकरणांवरील विभागाचा यशाचा दर: {0}% (निर्णीत {2} पैकी {1}).',
  '{0} orders reversed; {1} cases exceed ₹50 Lakh in disputed value.':
    '{0} आदेश रद्द; {1} प्रकरणांतील वादग्रस्त मूल्य ₹50 लाखांहून अधिक.',
  'Total amount under dispute in scope: ₹{0} Cr. This is value under appeal, not value recovered.':
    'व्याप्तीतील एकूण वादग्रस्त रक्कम: ₹{0} कोटी. ही अपिलाखालील रक्कम आहे, वसूल झालेली नव्हे.',
  '{0} compliance early-warning alert(s) in scope; {1} currently open.':
    'व्याप्तीत {0} अनुपालन पूर्वसूचना; सध्या {1} प्रलंबित.',
  'Leading alert types: {0}.': 'प्रमुख सूचना प्रकार: {0}.',
  'Recommended actions range from automated reminders to officer review queue escalation.':
    'शिफारस केलेल्या कार्यवाही स्वयंचलित स्मरणपत्रांपासून ते अधिकारी पुनर्विलोकन रांगेत वाढीव प्राधान्यापर्यंत आहेत.',
  'Early-warning outreach is informational only and does not constitute a formal notice.':
    'पूर्वसूचनेचा संपर्क केवळ माहितीपुरता असून ती औपचारिक नोटीस ठरत नाही.',
  'Scope: platform-wide. Governance metrics describe the AI layer itself and are not narrowed by taxpayer filters.':
    'व्याप्ती: संपूर्ण मंच. प्रशासन मापके AI स्तराचेच वर्णन करतात आणि करदाता गाळण्यांनी ती मर्यादित होत नाहीत.',
  'Every figure in this report is an illustrative placeholder. There is no model, no gateway and no scheduled audit behind them, and no value below has been measured.':
    'या अहवालातील प्रत्येक आकडा दृष्टांतापुरता तात्पुरता आहे. त्यांच्यामागे कोणतेही प्रारूप, प्रवेशद्वार किंवा नियोजित लेखापरीक्षण नाही, आणि खालील एकही मूल्य मोजलेले नाही.',
  '{0} AI recommendations generated to date; {1}% officer-approved.':
    'आजवर {0} AI शिफारशी तयार; {1}% अधिकाऱ्याने मंजूर.',
  '{0} suggestions rejected by officers; {1} pending governance review.':
    'अधिकाऱ्यांनी {0} सूचना नामंजूर केल्या; {1} प्रशासन पुनर्विलोकन प्रलंबित.',
  'False-positive confirmation rate: {0} of {1} reviewed flags.':
    'चुकीच्या सकारात्मक निष्कर्षांचा निश्चिती दर: पुनर्विलोकित {1} खुणांपैकी {0}.',
  'Model drift monitoring: {0}': 'प्रारूप अपसरण देखरेख: {0}',
  'Red-team testing: {0}': 'रेड-टीम चाचणी: {0}',
  'CERT-In / VAPT readiness: {0}': 'CERT-In / VAPT सज्जता: {0}',
  'Maker-checker remains absolute: the AI system only ever occupies the maker / draft role and cannot independently execute an enforcement action.':
    'कर्ता-पडताळणीकर्ता तत्त्व निरपवाद राहते: AI प्रणाली केवळ कर्ता / मसुदा भूमिकेतच असते आणि स्वतंत्रपणे कोणतीही अंमलबजावणी कारवाई करू शकत नाही.',

  /* == Reports — screen chrome ========================================== */
  '{0} risk': '{0} जोखीम',
  'search "{0}"': 'शोध "{0}"',
  'whole modelled book, {0}': 'संपूर्ण प्रारूपित संच, {0}',
  'Previewed report: {0}': 'पूर्वावलोकन केलेला अहवाल: {0}',
  'Generate structured briefing notes and reports for the Commissioner, senior officers and audit/refund/investigation teams. Every report preview is a simulated AI-assisted draft assembled from current platform data for demonstration purposes only. It is not an official departmental record and requires review and sign-off by an authorised officer before circulation or filing. Each report states its own scope: most narrow with the header filters, and the ones that do not say so on the card and again in the draft.':
    'आयुक्त, वरिष्ठ अधिकारी आणि लेखापरीक्षण/परतावा/तपास पथकांसाठी संरचित टिपणे व अहवाल तयार करा. प्रत्येक अहवाल पूर्वावलोकन हा सध्याच्या मंच माहितीवरून केवळ प्रात्यक्षिकासाठी जुळवलेला, नक्कल केलेला AI-सहाय्यित मसुदा आहे. तो अधिकृत विभागीय अभिलेख नाही आणि वितरण किंवा दाखल करण्यापूर्वी अधिकृत अधिकाऱ्याचे पुनर्विलोकन व स्वाक्षरी-मंजुरी आवश्यक आहे. प्रत्येक अहवाल स्वतःची व्याप्ती सांगतो: बहुतांश शीर्ष गाळण्यांनुसार मर्यादित होतात, आणि जे होत नाहीत ते कार्डावर आणि पुन्हा मसुद्यात तसे नमूद करतात.',
  'Filter-Responsive Report Types': 'गाळण्यांना प्रतिसाद देणारे अहवाल प्रकार',
  'rest state their own scope': 'उर्वरित स्वतःची व्याप्ती स्वतः सांगतात',
  'Report Actions Logged This Session': 'या सत्रात नोंदलेल्या अहवाल कृती',
  'previews, export requests and copies': 'पूर्वावलोकने, निर्यात विनंत्या आणि प्रती',
  'Records in Current Scope': 'सध्याच्या व्याप्तीतील नोंदी',
  'taxpayers, filters applied': 'करदाते, गाळण्या लागू',
  'taxpayers, whole modelled book': 'करदाते, संपूर्ण प्रारूपित संच',
  'Nothing on this page is a departmental record. Every draft below is assembled from demonstration data and is unsigned until an authorised officer reviews and signs it. The session figures above are counted from the audit trail on the AI Governance & Security screen; no report-generation history is kept beyond this session, and this page does not claim one. Most-handled report this session: {0}.':
    'या पानावरील काहीही विभागीय अभिलेख नाही. खालील प्रत्येक मसुदा प्रात्यक्षिक माहितीवरून जुळवलेला असून, अधिकृत अधिकारी त्याचे पुनर्विलोकन करून स्वाक्षरी करेपर्यंत तो अस्वाक्षरितच राहतो. वरील सत्र आकडे AI प्रशासन व सुरक्षा पडद्यावरील लेखापरीक्षण मागावरून मोजले आहेत; या सत्रापलीकडे अहवाल निर्मितीचा कोणताही इतिहास ठेवला जात नाही, आणि हे पान तसा दावाही करत नाही. या सत्रात सर्वाधिक हाताळलेला अहवाल: {0}.',
  '{0} ({1} actions)': '{0} ({1} कृती)',
  'none yet': 'अद्याप एकही नाही',
  'Not scoped by taxpayer': 'करदात्यानुसार व्याप्ती नाही',
  '0 {0} in scope': 'व्याप्तीत 0 {0}',
  '{0} {1} in scope': 'व्याप्तीत {0} {1}',
  'Drawn from: {0}': 'यावरून घेतलेले: {0}',
  'Draft — unsigned': 'मसुदा — अस्वाक्षरित',
  'Generated on': 'तयार झाल्याची तारीख',
  'Scope covered': 'व्यापलेली व्याप्ती',
  'Drawn from': 'यावरून घेतलेले',
  'Records in scope': 'व्याप्तीतील नोंदी',
  'Not scoped by taxpayer — describes the AI layer itself':
    'करदात्यानुसार व्याप्ती नाही — हे AI स्तराचेच वर्णन करते',
  '{0} {1}': '{0} {1}',
  'Prepared by (this session)': 'तयार करणारे (या सत्रात)',
  '{0} · {1}': '{0} · {1}',
  'Officer sign-off': 'अधिकाऱ्याची स्वाक्षरी-मंजुरी',
  'Not signed — required before circulation or filing':
    'स्वाक्षरी नाही — वितरण किंवा दाखल करण्यापूर्वी आवश्यक',
  'No records fall inside the current filters, so this draft has nothing to report on. Widen the header filters before circulating it — an empty brief reads as "nothing found" rather than "nothing selected".':
    'सध्याच्या गाळण्यांत एकही नोंद येत नाही, त्यामुळे या मसुद्याकडे सांगण्यासारखे काहीही नाही. वितरणापूर्वी शीर्ष गाळण्या रुंद करा — रिकामे टिपण "काहीही निवडले नाही" असे नव्हे, तर "काहीही आढळले नाही" असे वाचले जाते.',
  'Hide official-language summary': 'राजभाषेतील सारांश लपवा',
  'Official-language summary': 'राजभाषेतील सारांश',
  'The body above is the draft as rendered in the language currently selected in the masthead. Any sentence with no entry in that language catalogue stays in English and is counted in the untranslated-string report on the AI Governance & Security screen.':
    'वरील मजकूर म्हणजे शीर्षपट्टीत सध्या निवडलेल्या भाषेत रचलेला मसुदा. त्या भाषेच्या संचिकेत नोंद नसलेले कोणतेही वाक्य इंग्रजीतच राहते आणि AI प्रशासन व सुरक्षा पडद्यावरील भाषांतर न झालेल्या वाक्यांच्या अहवालात मोजले जाते.',
  '{0} — {1}': '{0} — {1}',
  'Prepared by (this session): {0} · {1}. Officer sign-off: not signed.':
    'तयार करणारे (या सत्रात): {0} · {1}. अधिकाऱ्याची स्वाक्षरी-मंजुरी: स्वाक्षरी नाही.',
  'This report preview is a simulated, AI-assisted draft generated from platform data for demonstration purposes only. It is not an official departmental record and requires review and sign-off by an authorised officer before circulation or filing. Nothing in it has been actioned, and no figure in it may be treated as a finding.':
    'हे अहवाल पूर्वावलोकन म्हणजे मंच माहितीवरून केवळ प्रात्यक्षिकासाठी तयार केलेला, नक्कल केलेला AI-सहाय्यित मसुदा आहे. तो अधिकृत विभागीय अभिलेख नाही आणि वितरण किंवा दाखल करण्यापूर्वी अधिकृत अधिकाऱ्याचे पुनर्विलोकन व स्वाक्षरी-मंजुरी आवश्यक आहे. त्यातील कशावरही कार्यवाही झालेली नाही, आणि त्यातील कोणताही आकडा निष्कर्ष म्हणून वापरता येणार नाही.',

  /* == Short lines — the reasoning sits behind them ============================ */
  'How this is computed':
    'हे कसे मोजले जाते',
  'Hide the basis for this':
    'याचा आधार लपवा',
  'AI here is advisory only, under mandatory human review.':
    'इथे AI केवळ सल्लागार आहे, अनिवार्य मानवी पुनर्विलोकनाखाली.',
  'A control position, not an assurance — the platform holds no certification.':
    'ही नियंत्रणाची स्थिती आहे, हमी नव्हे — मंचाकडे कोणतेही प्रमाणपत्र नाही.',
  'Ownership is read from the access configuration; no owner register exists.':
    'मालकी प्रवेश संरचनेवरून वाचली जाते; मालकांची नोंदवही नाही.',
  'The AI only ever drafts. An officer approves or rejects every output.':
    'AI केवळ मसुदा तयार करते. प्रत्येक निष्कर्ष अधिकारी मंजूर वा नामंजूर करतो.',
  'A role with a section is not automatically given every module in it.':
    'विभाग मिळालेल्या भूमिकेला त्यातील प्रत्येक घटक आपोआप मिळत नाही.',
  'A trail with no overrides would be a warning sign, not a good result.':
    'एकही अधिक्रमण नसलेला माग हा इशारा असेल, चांगला निकाल नव्हे.',
  'Approved, rejected and pending are an exhaustive split of what was generated.':
    'मंजूर, नामंजूर आणि प्रलंबित मिळून तयार झालेल्या सर्वांची संपूर्ण विभागणी होते.',
  'Confidence is a property of the output, not a permission.':
    'विश्वास हा निष्कर्षाचा गुणधर्म आहे, परवानगी नव्हे.',
  'Illustrative only — no sampling programme produced this rate.':
    'केवळ दृष्टांतापुरते — हा दर कोणत्याही नमुना कार्यक्रमातून आलेला नाही.',
  'Denied attempts are kept deliberately; the trail is session-only.':
    'नाकारलेले प्रयत्न जाणीवपूर्वक ठेवले आहेत; माग फक्त या सत्रापुरता आहे.',
  'Only the fact of a generation is logged — never the prompt or the output.':
    'केवळ निर्मिती झाली एवढेच नोंदवले जाते — सूचना किंवा निष्कर्ष कधीही नाही.',
  'A live gap indicator for this session, not a coverage audit.':
    'या सत्रापुरता जिवंत त्रुटी निर्देशक, व्याप्तीचे लेखापरीक्षण नव्हे.',

  /* == Control register — one line per control ============================ */
  'The AI drafts; an authorised officer approves or rejects.':
    'AI मसुदा तयार करते; अधिकृत अधिकारी मंजूर वा नामंजूर करतो.',
  'Every score traces back to the rules that fired and their weights.':
    'प्रत्येक गुणाचा माग लागू झालेल्या नियमांपर्यंत आणि त्यांच्या वजनांपर्यंत काढता येतो.',
  'Access is decided per role at section level, then again per module.':
    'प्रवेश प्रत्येक भूमिकेसाठी आधी विभाग पातळीवर, नंतर पुन्हा घटकनिहाय ठरतो.',
  'Every officer action is recorded, including denied attempts.':
    'प्रत्येक अधिकारी कृती नोंदवली जाते — नाकारलेले प्रयत्नही धरून.',
  'The fact of each generation is logged; the content is not.':
    'प्रत्येक निर्मिती झाली एवढेच नोंदवले जाते; मजकूर नाही.',
  'No real taxpayer data is present, so no control has been exercised.':
    'खरी करदाता माहिती नाही, त्यामुळे कोणतेही नियंत्रण वापरलेले नाही.',
  'Not assessed — this build stores nothing and transmits nothing.':
    'मूल्यमापन नाही — ही आवृत्ती काहीही साठवत नाही आणि काहीही पाठवत नाही.',
  'Not measured. No model and no sampling programme exist here.':
    'मोजलेले नाही. इथे कोणतेही प्रारूप किंवा नमुना कार्यक्रम अस्तित्वात नाही.',
  'Not carried out against this build.':
    'या आवृत्तीवर पार पाडलेले नाही.',
  'No integrations and no network calls, so there is nothing to assess.':
    'कोणतेही एकात्मीकरण नाही आणि नेटवर्क कॉलही नाहीत, त्यामुळे मूल्यमापन करण्यासारखे काही नाही.',
  'No real personal data, so purpose limitation has not been exercised.':
    'खरी वैयक्तिक माहिती नाही, त्यामुळे प्रयोजन-मर्यादा वापरलेली नाही.',

  /* == Control register — bias monitoring ============================ */
  'No sampling programme runs, so the false-positive rate measures nothing.':
    'कोणताही नमुना कार्यक्रम चालत नाही, त्यामुळे चुकीच्या सकारात्मक निष्कर्षांचा दर काहीही मोजत नाही.',

  /* == Reports — short lines ============================ */
  'Structured briefing notes for the Commissioner and senior officers.':
    'आयुक्त व वरिष्ठ अधिकाऱ्यांसाठी संरचित टिपणे.',
  'Nothing here is a departmental record until an officer signs it.':
    'अधिकारी स्वाक्षरी करेपर्यंत इथले काहीही विभागीय अभिलेख नाही.',
  'Nothing selected, not nothing found — widen the filters before circulating.':
    'काहीही निवडलेले नाही, काहीही आढळले नाही असे नव्हे — वितरणापूर्वी गाळण्या रुंद करा.',
  'A simulated draft. Requires officer review and sign-off before use.':
    'नक्कल केलेला मसुदा. वापरण्यापूर्वी अधिकारी पुनर्विलोकन व स्वाक्षरी आवश्यक.'
})
