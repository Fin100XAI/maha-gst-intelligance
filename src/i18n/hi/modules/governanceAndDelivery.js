import { registerMessages } from '../../locale.js'

/**
 * Hindi — AI Governance & Security, Reports & Briefing Notes, Engine Stack,
 * Pilot Extract Specification, Official Statistics, Project Resources.
 *
 *   oversight        → पर्यवेक्षण
 *   maker-checker    → कर्ता-परीक्षक
 *   human-in-the-loop → मानव-सम्मिलित
 *   explainability   → स्पष्टीकरण-योग्यता
 *   data minimisation → आँकड़ा न्यूनीकरण
 *   drift            → विचलन (of a model over time)
 *   audit trail      → लेखापरीक्षा अनुक्रम
 *   provenance       → उद्गम
 *   engine           → यंत्र
 *   hop              → चरण
 *   spine            → रीढ़
 *
 * Statutory and technical identifiers stay in Latin: DPDP, CERT-In, VAPT, TLS,
 * API, GSTN, NIC, HTTP 403, and the Act's own name where it is cited in full.
 */
registerMessages('hi', {
  /* == AI Governance & Security — header and tiles ======================= */
  'Governance · AI Oversight & Security': 'शासन · AI पर्यवेक्षण एवं सुरक्षा',
  'Governance metrics on this screen describe the AI layer itself and are not narrowed by the taxpayer filters above; only the audit trail responds to the search box. Oversight console for AI-assisted decision support across the platform — model usage, human override rates, role-based access control, and audit trail integrity. AI systems here operate strictly in an advisory capacity under mandatory human review.':
    'इस पर्दे के शासन मापक स्वयं AI स्तर का वर्णन करते हैं और ऊपर के करदाता फ़िल्टर से सीमित नहीं होते; केवल लेखापरीक्षा अनुक्रम खोज पेटी पर प्रतिक्रिया देता है। यह पूरे मंच पर AI-सहायित निर्णय-सहायता का पर्यवेक्षण कक्ष है — प्रारूप उपयोग, मानवीय अधिक्रमण दर, पद-आधारित पहुँच नियंत्रण, और लेखापरीक्षा अनुक्रम की अखंडता। यहाँ AI प्रणालियाँ अनिवार्य मानवीय समीक्षा के अधीन कड़ाई से केवल सलाहकारी भूमिका में कार्य करती हैं।',
  'It shows system and model activity, which is logged against officers and actions rather than against taxpayers.':
    'यह प्रणाली एवं प्रारूप की गतिविधि दिखाता है, जो करदाताओं के नाम नहीं बल्कि अधिकारियों और कार्रवाइयों के नाम दर्ज होती है।',
  'Mandatory Governance Boundaries': 'अनिवार्य शासन सीमाएँ',
  'AI Recommendations Generated': 'निर्मित AI अनुशंसाएँ',
  'Officer-Approved Actions': 'अधिकारी-अनुमोदित कार्रवाइयाँ',
  'Rejected AI Suggestions': 'अस्वीकृत AI सुझाव',
  'Pending Governance Review': 'लंबित शासन समीक्षा',
  'Model Confidence Distribution': 'प्रारूप विश्वास वितरण',
  'Share of AI outputs by confidence band': 'विश्वास वर्ग के अनुसार AI निर्गमों का हिस्सा',

  /* == AI Governance & Security — false positives ======================== */
  'False Positive Review': 'मिथ्या-सकारात्मक समीक्षा',
  'Human-in-the-loop review outcomes for AI-flagged cases':
    'AI-चिह्नित प्रकरणों की मानव-सम्मिलित समीक्षा के परिणाम',
  'Flags Reviewed': 'समीक्षित चिह्न',
  'Confirmed False Positives': 'पुष्ट मिथ्या-सकारात्मक',
  'Confirmed false-positive rate': 'पुष्ट मिथ्या-सकारात्मक दर',
  'Of {0} AI-generated risk flags submitted for officer review, {1} were confirmed as false positives ({2}%). This rate is tracked continuously to monitor model precision and inform periodic recalibration; it does not by itself trigger any automated model change.':
    'अधिकारी समीक्षा हेतु प्रस्तुत {0} AI-निर्मित जोखिम चिह्नों में से {1} मिथ्या-सकारात्मक पुष्ट हुए ({2}%)। प्रारूप की परिशुद्धता पर दृष्टि रखने और समय-समय पर पुनः अंशांकन को दिशा देने हेतु यह दर निरंतर देखी जाती है; यह स्वयं किसी स्वचालित प्रारूप परिवर्तन को जन्म नहीं देती।',

  /* == AI Governance & Security — access control and maker-checker ======= */
  'Role-Based Access Control': 'पद-आधारित पहुँच नियंत्रण',
  'Module access permissions by officer role': 'अधिकारी पद के अनुसार मॉड्यूल पहुँच अनुमतियाँ',
  Role: 'पद',
  'Access Summary': 'पहुँच सारांश',
  'Restricted / Focus Modules': 'प्रतिबंधित / केंद्रित मॉड्यूल',
  'Maker-Checker / Human-in-the-Loop Workflow': 'कर्ता-परीक्षक / मानव-सम्मिलित कार्यप्रवाह',
  'Every AI-generated notice or audit action requires officer approval before execution':
    'प्रत्येक AI-निर्मित नोटिस अथवा लेखापरीक्षा कार्रवाई हेतु निष्पादन से पूर्व अधिकारी का अनुमोदन आवश्यक',
  'The platform enforces a maker-checker control on every AI-assisted output. The AI system only ever occupies the "maker / draft" role — it cannot independently execute an enforcement action. This mirrors the Human Approval step already built into the Audit & Scrutiny Engine workflow, and applies uniformly across notice drafting, audit scoping, refund checklists and taxpayer outreach.':
    'मंच प्रत्येक AI-सहायित निर्गम पर कर्ता-परीक्षक नियंत्रण लागू करता है। AI प्रणाली सदैव केवल "कर्ता / प्रारूपकार" की भूमिका में रहती है — वह स्वतंत्र रूप से कोई प्रवर्तन कार्रवाई नहीं कर सकती। यह वही मानवीय अनुमोदन चरण है जो लेखापरीक्षा एवं संवीक्षा यंत्र के कार्यप्रवाह में पहले से निर्मित है, और यह नोटिस प्रारूपण, लेखापरीक्षा दायरा निर्धारण, प्रतिदाय जाँच-सूची तथा करदाता संपर्क, सभी पर समान रूप से लागू होता है।',
  'AI generates draft': 'AI प्रारूप बनाता है',
  'Notice / checklist / summary / briefing': 'नोटिस / जाँच-सूची / सारांश / टिप्पणी',
  'Officer reviews': 'अधिकारी समीक्षा करता है',
  'Verifies evidence, edits content': 'साक्ष्य की पुष्टि करता है, विषय-वस्तु संपादित करता है',
  'Officer approves or rejects': 'अधिकारी अनुमोदित या अस्वीकृत करता है',
  'Maker-checker control point': 'कर्ता-परीक्षक नियंत्रण बिंदु',
  'Action executed & logged': 'कार्रवाई निष्पादित एवं दर्ज',
  'Recorded in audit trail': 'लेखापरीक्षा अनुक्रम में दर्ज',

  /* == AI Governance & Security — the logs ============================== */
  'Audit Log': 'लेखापरीक्षा अभिलेख',
  'System-wide access and action log across all modules — live entries from this session appear at the top':
    'सभी मॉड्यूल पर प्रणाली-व्यापी पहुँच एवं कार्रवाई अभिलेख — इस सत्र की सजीव प्रविष्टियाँ ऊपर दिखती हैं',
  'Filtered by header search: "{0}"': 'शीर्ष खोज से फ़िल्टर किया: "{0}"',
  'Search user, action, module, case ID...': 'उपयोगकर्ता, कार्रवाई, मॉड्यूल, प्रकरण क्रमांक खोजें...',
  Timestamp: 'समय-मुद्रा',
  User: 'उपयोगकर्ता',
  Module: 'मॉड्यूल',
  'IP / Device': 'IP / उपकरण',
  'AI Copilot Prompt / Output Log': 'AI सहप्रचालक निवेश / निर्गम अभिलेख',
  'Every draft, summary, checklist or translation the AI Copilot has generated, with the officer and case it was generated for':
    'AI सहप्रचालक द्वारा निर्मित प्रत्येक प्रारूप, सारांश, जाँच-सूची अथवा अनुवाद, साथ में वह अधिकारी और प्रकरण जिसके लिए वह बनाया गया',
  '{0} logged outputs': '{0} दर्ज निर्गम',
  'Search AI Copilot activity...': 'AI सहप्रचालक गतिविधि खोजें...',
  'No AI Copilot activity logged yet this session. Generate a draft, checklist, or summary from Officer AI Copilot to see it appear here.':
    'इस सत्र में अभी तक कोई AI सहप्रचालक गतिविधि दर्ज नहीं। यहाँ दिखने हेतु अधिकारी AI सहप्रचालक से कोई प्रारूप, जाँच-सूची अथवा सारांश तैयार करें।',
  Officer: 'अधिकारी',
  'AI Output Generated': 'निर्मित AI निर्गम',
  'Context Module': 'संदर्भ मॉड्यूल',
  'Case / GSTIN': 'प्रकरण / GSTIN',
  'Prompt/output content itself is not persisted in this log by design (data minimisation) — only the fact that a generation occurred, by whom, for which case, and when. This satisfies the governance requirement for AI Copilot usage logging distinct from the general system audit trail above.':
    'निवेश/निर्गम की विषय-वस्तु स्वयं इस अभिलेख में अभिकल्प से ही संचित नहीं की जाती (आँकड़ा न्यूनीकरण) — केवल यह तथ्य कि निर्माण हुआ, किसके द्वारा, किस प्रकरण हेतु, और कब। यह ऊपर दिए सामान्य प्रणाली लेखापरीक्षा अनुक्रम से पृथक, AI सहप्रचालक उपयोग अभिलेखन की शासन-संबंधी अपेक्षा को पूरा करता है।',

  /* == AI Governance & Security — standing controls ===================== */
  'Model Explainability & Data Governance': 'प्रारूप स्पष्टीकरण-योग्यता एवं आँकड़ा शासन',
  'Standing controls governing AI usage on this platform':
    'इस मंच पर AI उपयोग को नियंत्रित करने वाले स्थायी नियंत्रण',
  'Model explainability': 'प्रारूप स्पष्टीकरण-योग्यता',
  'Every risk score is fully attributable to a discrete set of weighted, transparent rules (see the "Why flagged?" panel used app-wide) — there is no black-box scoring. Officers can trace any risk rating back to the exact triggered indicators and their weight contribution.':
    'प्रत्येक जोखिम अंक पूर्णतः भारित, पारदर्शी नियमों के एक निश्चित समुच्चय से जुड़ा है (पूरे अनुप्रयोग में प्रयुक्त "चिह्नित क्यों?" पटल देखें) — कोई अपारदर्शी अंकन नहीं है। अधिकारी किसी भी जोखिम श्रेणी को ठीक उन्हीं लागू संकेतकों और उनके भार-योगदान तक पीछे जाकर देख सकते हैं।',
  'Data minimisation': 'आँकड़ा न्यूनीकरण',
  'Encryption status': 'कूटलेखन स्थिति',
  'API integration security': 'API एकीकरण सुरक्षा',
  'This demonstration has no integrations and makes no network calls. Production requirement: route all AI Copilot and reporting integrations through the departmental secure gateway with mutual TLS, request signing and role-scoped API tokens, and transmit no taxpayer data to external, uncontrolled endpoints.':
    'इस प्रदर्शन में कोई एकीकरण नहीं है और कोई नेटवर्क संपर्क नहीं किया जाता। वास्तविक तैनाती की अपेक्षा: सभी AI सहप्रचालक एवं प्रतिवेदन एकीकरण विभागीय सुरक्षित द्वार से, पारस्परिक TLS, अनुरोध हस्ताक्षर एवं पद-सीमित API टोकन सहित भेजे जाएँ, और कोई भी करदाता आँकड़ा बाह्य, अनियंत्रित स्रोतों को न भेजा जाए।',
  'DPDP-aligned data handling': 'DPDP-अनुरूप आँकड़ा प्रबंधन',
  'No real taxpayer data is present in this demonstration — every record is generated. Production requirement: process taxpayer personal and financial data strictly for stated revenue-assurance and compliance purposes, consistent with the Digital Personal Data Protection Act, 2023, with purpose limitation, access logging and retention controls.':
    'इस प्रदर्शन में कोई वास्तविक करदाता आँकड़ा नहीं है — प्रत्येक अभिलेख निर्मित है। वास्तविक तैनाती की अपेक्षा: करदाता के व्यक्तिगत एवं वित्तीय आँकड़ों का प्रसंस्करण डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम, 2023 के अनुरूप, केवल घोषित राजस्व-आश्वासन एवं अनुपालन प्रयोजनों हेतु किया जाए, साथ में प्रयोजन सीमा, पहुँच अभिलेखन एवं प्रतिधारण नियंत्रण लागू हों।',
  'Bias / false-positive monitoring': 'पक्षपात / मिथ्या-सकारात्मक निगरानी',
  'No sampling programme runs in this demonstration; the rate shown above is an illustrative placeholder. Production requirement: sample AI-flagged cases continuously for officer review and track the confirmed false-positive rate to detect systemic bias or drift by sector and district.':
    'इस प्रदर्शन में कोई प्रतिचयन कार्यक्रम नहीं चलता; ऊपर दिखाई गई दर दृष्टांत मात्र है। वास्तविक तैनाती की अपेक्षा: AI-चिह्नित प्रकरणों के नमूने अधिकारी समीक्षा हेतु निरंतर लिए जाएँ और क्षेत्र एवं जिलावार प्रणालीगत पक्षपात अथवा विचलन पकड़ने हेतु पुष्ट मिथ्या-सकारात्मक दर पर दृष्टि रखी जाए।',
  'Model drift monitoring': 'प्रारूप विचलन निगरानी',
  'Red-team testing status': 'रेड-टीम परीक्षण स्थिति',
  'CERT-In / VAPT readiness': 'CERT-In / VAPT तत्परता',

  /* == Reports & Briefing Notes ========================================== */
  'Governance · Report Generation Center': 'शासन · प्रतिवेदन निर्माण केंद्र',
  'Generate structured briefing notes and reports for the Commissioner, senior officers and audit/refund/investigation teams. Every report preview is a simulated draft assembled from current platform data for demonstration purposes and requires officer sign-off before formal circulation.':
    'आयुक्त, वरिष्ठ अधिकारियों तथा लेखापरीक्षा/प्रतिदाय/अन्वेषण दलों हेतु संरचित टिप्पणियाँ एवं प्रतिवेदन तैयार करें। प्रत्येक प्रतिवेदन पूर्वावलोकन प्रदर्शन प्रयोजन हेतु वर्तमान मंच आँकड़ों से जोड़ा गया अनुरूपित प्रारूप है और औपचारिक परिचालन से पूर्व अधिकारी के हस्ताक्षर की अपेक्षा रखता है।',
  'Report Types Available': 'उपलब्ध प्रतिवेदन प्रकार',
  'Reports Generated (This Month, illustrative)': 'निर्मित प्रतिवेदन (इस माह, दृष्टांत)',
  'Most-Requested Report (illustrative)': 'सर्वाधिक माँगा गया प्रतिवेदन (दृष्टांत)',
  'Pending Governance-Reviewed Reports': 'लंबित शासन-समीक्षित प्रतिवेदन',
  'No reports match your search.': 'आपकी खोज से कोई प्रतिवेदन मेल नहीं खाता।',
  Preview: 'पूर्वावलोकन',
  'Draft report preview': 'प्रारूप प्रतिवेदन पूर्वावलोकन',
  'Simulated output for demonstration': 'प्रदर्शन हेतु अनुरूपित निर्गम',
  'Generated on {0}': '{0} को निर्मित',
  'Summary — English': 'सारांश — अंग्रेज़ी',
  'This report preview is a simulated, AI-assisted draft generated from platform data for demonstration purposes only. It is not an official departmental record and requires review and sign-off by an authorised officer before circulation or filing.':
    'यह प्रतिवेदन पूर्वावलोकन केवल प्रदर्शन प्रयोजन हेतु मंच आँकड़ों से निर्मित अनुरूपित, AI-सहायित प्रारूप है। यह आधिकारिक विभागीय अभिलेख नहीं है और परिचालन अथवा नस्तीबद्ध करने से पूर्व प्राधिकृत अधिकारी द्वारा समीक्षा एवं हस्ताक्षर की अपेक्षा रखता है।',

  /* == Engine Stack ====================================================== */
  'Governance · Delivery': 'शासन · कार्यान्वयन',
  'Fifteen intelligence engines mapped against the fields the department can supply today, each classified by technique and given a verdict backed by something checkable. The purpose is to separate what can be built and validated from what would be a promise.':
    'विभाग आज जो क्षेत्र दे सकता है, उनके सापेक्ष पंद्रह इंटेलिजेंस यंत्रों का मिलान, प्रत्येक का तकनीक के अनुसार वर्गीकरण और जाँचे जा सकने वाले आधार पर निष्कर्ष। उद्देश्य यह पृथक करना है कि क्या बनाया एवं प्रमाणित किया जा सकता है और क्या केवल एक वादा होगा।',
  'It reports on the platform’s engines and the fields available to them, which are properties of the data as a whole rather than of any district or sector.':
    'यह मंच के यंत्रों और उन्हें उपलब्ध क्षेत्रों पर प्रतिवेदन देता है, जो किसी एक जिले या क्षेत्र के नहीं बल्कि समग्र आँकड़ों के गुण हैं।',
  Built: 'निर्मित',
  'of {0} engines': '{0} यंत्रों में से',
  Partial: 'आंशिक',
  'the supported half is built': 'समर्थित आधा भाग निर्मित',
  Blocked: 'अवरुद्ध',
  'missing input, not effort': 'निवेश की कमी, श्रम की नहीं',
  'Graph hops absent': 'आरेख के अनुपस्थित चरण',
  'of {0} in the spine': 'रीढ़ के {0} में से',
  '{0} — {1} engines': '{0} — {1} यंत्र',
  'What exists': 'क्या मौजूद है',
  'What is missing': 'क्या अनुपस्थित है',
  'Open screen': 'पर्दा खोलें',
  'On generative AI': 'जनरेटिव AI के विषय में',
  'The intelligence graph, hop by hop': 'इंटेलिजेंस आरेख, चरण-दर-चरण',
  '{0} of {1} hops are present, {2} partial and {3} absent. The absent ones are where every cross-entity capability fails.':
    '{1} में से {0} चरण उपलब्ध हैं, {2} आंशिक और {3} अनुपस्थित। अनुपस्थित चरणों पर ही प्रत्येक अंतर-इकाई क्षमता विफल होती है।',
  Present: 'उपलब्ध',
  Absent: 'अनुपस्थित',
  'On the architecture': 'संरचना के विषय में',
  'Four additions to the 500-case extract, in the order that unlocks most. The first is five columns and unblocks four engines; the modelling for all of them already exists and is waiting on the fields.':
    '500 प्रकरणों के एक्सट्रैक्ट में चार वृद्धियाँ, उस क्रम में जो सर्वाधिक खोलता है। पहली वृद्धि पाँच स्तंभों की है और चार यंत्र मुक्त करती है; इन सबका प्रारूपण पहले से तैयार है और केवल क्षेत्रों की प्रतीक्षा में है।',
  Unlocks: 'क्या मुक्त करता है',

  /* == Pilot Extract Specification ======================================= */
  'Governance · Pilot': 'शासन · पायलट',
  'The field-level column list for the 500-case pilot, addressed to GSTN, NIC and the divisions. Each field carries its format, its source, whether it is mandatory and which engine it unlocks — so a data owner can see what their column is for rather than being asked for whatever they have.':
    '500 प्रकरणों के पायलट हेतु क्षेत्र-स्तरीय स्तंभ सूची, GSTN, NIC एवं विभागों को संबोधित। प्रत्येक क्षेत्र के साथ उसका स्वरूप, स्रोत, वह अनिवार्य है या नहीं, और वह कौन-सा यंत्र मुक्त करता है, यह दिया गया है — ताकि आँकड़ा-धारक से "जो कुछ हो वह दीजिए" कहने के बजाय उसे दिखे कि उसका स्तंभ किसलिए है।',
  'It is a column specification for a data request, not a view over taxpayer records.':
    'यह आँकड़ा माँग हेतु स्तंभ विनिर्देश है, करदाता अभिलेखों पर दृश्य नहीं।',
  'Files requested': 'माँगी गई फाइलें',
  'one per entity type': 'प्रत्येक इकाई प्रकार हेतु एक',
  'Fields specified': 'विनिर्दिष्ट क्षेत्र',
  '{0} mandatory': '{0} अनिवार्य',
  'Critical fields': 'निर्णायक क्षेत्र',
  'decide the outcome tier': 'परिणाम का स्तर तय करते हैं',
  'From GSTN': 'GSTN से',
  'of {0} — rest departmental and NIC': '{0} में से — शेष विभागीय एवं NIC',
  '500 cases is not 500 taxpayers': '500 प्रकरण 500 करदाता नहीं हैं',
  '{0} fields': '{0} क्षेत्र',
  Scope: 'दायरा',
  Column: 'स्तंभ',
  Type: 'प्रकार',
  Example: 'उदाहरण',
  Req: 'आवश्यक',
  Engines: 'यंत्र',
  Note: 'टिप्पणी',
  'naming convention — map to source': 'नामकरण परिपाटी — मूल स्रोत से मिलाएँ',
  'Format conventions': 'स्वरूप परिपाटियाँ',
  'Each of these has caused a real error in this build or would have.':
    'इनमें से प्रत्येक ने इस निर्माण में वास्तविक त्रुटि उत्पन्न की है अथवा करती।',
  'Legal and privacy position': 'विधिक एवं निजता स्थिति',
  'Settle these before the request goes out, not after.':
    'माँग भेजने से पूर्व इन्हें निपटाएँ, बाद में नहीं।',
  'Where a field corresponds to a published GST form, that form is named. Where a column name is a convention proposed for this extract rather than an official schema field it is marked as such — map it to whatever the source system actually calls it rather than assuming the name exists.':
    'जहाँ कोई क्षेत्र किसी प्रकाशित GST प्रपत्र से मेल खाता है, वहाँ उस प्रपत्र का नाम दिया गया है। जहाँ स्तंभ का नाम आधिकारिक संरचना का क्षेत्र न होकर इस एक्सट्रैक्ट हेतु प्रस्तावित परिपाटी है, वहाँ वैसा अंकित है — नाम मौजूद है यह मान लेने के बजाय उसे मूल प्रणाली जो वास्तव में कहती है उससे मिलाएँ।',

  /* == Official Statistics =============================================== */
  'Governance · Data Provenance': 'शासन · आँकड़ा उद्गम',
  'Published government figures, carried here with their source, their period and the date they were read. These are the only real numbers in the platform — every other figure on every other screen is generated demonstration data.':
    'शासन द्वारा प्रकाशित आँकड़े, उनके स्रोत, अवधि और पढ़े जाने की तिथि सहित यहाँ दिए गए। मंच में केवल यही वास्तविक संख्याएँ हैं — हर दूसरे पर्दे का हर दूसरा आँकड़ा निर्मित प्रदर्शन आँकड़ा है।',
  'The figures here are published statewide totals from CBIC, PIB and mahagst.gov.in, and cannot be narrowed to a division or sector without misrepresenting them.':
    'यहाँ के आँकड़े CBIC, PIB एवं mahagst.gov.in द्वारा प्रकाशित राज्यव्यापी कुल राशियाँ हैं, और उनका विरूपण किए बिना उन्हें किसी विभाग या क्षेत्र तक सीमित नहीं किया जा सकता।',
  'What this demonstration is, to scale': 'यह प्रदर्शन पैमाने की दृष्टि से क्या है',
  'This platform models {0} taxpayers across {1} districts. Maharashtra has {2} registered SGST dealers across {3} districts. The demonstration is roughly one taxpayer for every {4} real ones — it is built to show how the workflow behaves, not to represent the state’s book.':
    'यह मंच {1} जिलों के {0} करदाताओं का प्रारूप प्रस्तुत करता है। महाराष्ट्र में {3} जिलों में {2} पंजीकृत SGST व्यापारी हैं। अर्थात प्रदर्शन में प्रत्येक {4} वास्तविक करदाताओं पर लगभग एक — यह कार्यप्रवाह का व्यवहार दिखाने हेतु बनाया गया है, राज्य का लेखा प्रस्तुत करने हेतु नहीं।',
  'Taxpayers modelled': 'प्रारूप में करदाता',
  'Registered SGST dealers': 'पंजीकृत SGST व्यापारी',
  'as at {0}': '{0} तक',
  'Districts modelled': 'प्रारूप में जिले',
  'Districts in Maharashtra': 'महाराष्ट्र के जिले',
  'Published figures': 'प्रकाशित आँकड़े',
  'Read on {0}. Each figure links to the publication that states it.':
    '{0} को पढ़े गए। प्रत्येक आँकड़ा उस प्रकाशन से जुड़ा है जो उसे बताता है।',
  'Official source': 'आधिकारिक स्रोत',
  'Sources not yet transcribed': 'अब तक न उतारे गए स्रोत',
  'Named as authoritative but not read into the platform. Listed with no figures attached — an unread source gets a link, never an estimate.':
    'प्रामाणिक के रूप में नामित किंतु मंच में पढ़कर नहीं लिए गए। बिना किसी आँकड़े के सूचीबद्ध — न पढ़े गए स्रोत को कड़ी मिलती है, अनुमान कभी नहीं।',
  Official: 'आधिकारिक',

  /* == Project Resources ================================================= */
  'Data Resources · Provenance': 'आँकड़ा संसाधन · उद्गम',
  'The law this platform encodes, the judgments it relies on, the published figures it cites, the statistical methods it applies and the software it runs on — with a plain statement of which records are simulated and which are real.':
    'यह मंच किस विधि को संकेतबद्ध करता है, किन निर्णयों पर निर्भर है, किन प्रकाशित आँकड़ों को उद्धृत करता है, कौन-सी सांख्यिकीय पद्धतियाँ लागू करता है और किस संगणक प्रणाली पर चलता है — साथ में यह स्पष्ट कथन कि कौन-से अभिलेख अनुरूपित हैं और कौन-से वास्तविक।',
  'It lists the sources, methods and software the platform is built on.':
    'मंच जिन स्रोतों, पद्धतियों एवं संगणक प्रणालियों पर बना है, उनकी सूची यहाँ है।',
  'Statutory sources': 'सांविधिक स्रोत',
  'encoded, not summarised': 'संकेतबद्ध, सारांशित नहीं',
  'Judicial authorities': 'न्यायिक प्राधिकार',
  'verified against reports': 'वृत्तांतों से सत्यापित',
  'Official data sources': 'आधिकारिक आँकड़ा स्रोत',
  'government published': 'शासन द्वारा प्रकाशित',
  Methods: 'पद्धतियाँ',
  'each with its failure mode': 'प्रत्येक के साथ उसकी विफलता की रीति',
  'Software packages': 'संगणक प्रणाली संकुल',
  'all open-source': 'सभी मुक्त-स्रोत',
  'Generated from a fixed seed. None of it describes a real taxpayer.':
    'एक नियत बीज से निर्मित। इसमें से कुछ भी किसी वास्तविक करदाता का वर्णन नहीं करता।',
  Real: 'वास्तविक',
  'Verified against published sources on {0}.': '{0} को प्रकाशित स्रोतों से सत्यापित।',
  'The division is absolute': 'यह विभाजन निरपवाद है',
  'Statute and subordinate legislation': 'अधिनियम एवं अधीनस्थ विधान',
  'Encoded as computation rather than summarised. The limitation engine computes from these, which is why its output can go into a notice.':
    'सारांश के बजाय संगणना के रूप में संकेतबद्ध। परिसीमा यंत्र इन्हीं से गणना करता है, इसीलिए उसका निर्गम नोटिस में जा सकता है।',
  'Judicial authority': 'न्यायिक प्राधिकार',
  'Verified against published reports. Where only a holding could be confirmed, the case name is left blank rather than invented.':
    'प्रकाशित वृत्तांतों से सत्यापित। जहाँ केवल निर्णय-सार ही पुष्ट हो सका, वहाँ प्रकरण का नाम गढ़ने के बजाय रिक्त छोड़ा गया है।',
  'Official published sources': 'आधिकारिक प्रकाशित स्रोत',
  'Dataset pointers held without values': 'बिना मानों के रखे गए आँकड़ा-समुच्चय संकेत',
  'Recorded so the department knows they exist, with nothing inferred from them — the endpoints returned HTTP 403 when fetched, and guessing at their contents would have been worse than leaving them empty.':
    'विभाग को उनके अस्तित्व की जानकारी रहे इसलिए दर्ज, उनसे कुछ भी अनुमानित किए बिना — माँगे जाने पर इन स्रोतों ने HTTP 403 लौटाया, और उनकी विषय-वस्तु का अनुमान लगाना उन्हें रिक्त छोड़ने से बुरा होता।',
  Dataset: 'आँकड़ा-समुच्चय',
  'No values held': 'कोई मान नहीं रखे गए',
  'Statistical and algorithmic methods': 'सांख्यिकीय एवं अल्गोरिदमी पद्धतियाँ',
  'Each with the reason it was chosen and the way it fails. A method whose failure mode is not stated is a method nobody can audit.':
    'प्रत्येक के साथ यह कि उसे क्यों चुना गया और वह किस प्रकार विफल होती है। जिस पद्धति की विफलता की रीति बताई न गई हो, उसकी लेखापरीक्षा कोई नहीं कर सकता।',
  'Why this one': 'यही क्यों',
  'How it fails': 'यह कैसे विफल होती है',
  Software: 'संगणक प्रणाली',
  'All open-source. The platform makes no call to the open internet for its figures, models or maps, and runs entirely within the department’s own infrastructure.':
    'सभी मुक्त-स्रोत। यह मंच अपने आँकड़ों, प्रारूपों या मानचित्रों के लिए खुले इंटरनेट से कोई संपर्क नहीं करता, और पूर्णतः विभाग की अपनी अवसंरचना के भीतर चलता है।'
})
