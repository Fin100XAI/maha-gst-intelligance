import { registerMessages } from '../../locale.js'

/* ---------------------------------------------------------------------------
 * AI GOVERNANCE & SECURITY + REPORTS & BRIEFING NOTES CATALOGUE
 *
 * Hand-written Marathi for the UI chrome of the AI Governance & Security
 * module (`src/modules/AIGovernanceSecurity.jsx`) and the Reports & Briefing
 * Notes module (`src/modules/ReportsBriefingNotes.jsx`) — panel titles,
 * KPI labels, table columns, checklist items, governance control copy, and
 * the ten report type names/descriptions.
 *
 * Does NOT include strings already covered by shell.js (module titles,
 * officer role names, "Role-Based Access Control", etc.) — those are reused
 * verbatim via the same English source key. Also does NOT include anything
 * inside ReportsBriefingNotes.jsx's "Marathi Summary" toggle/translateBriefing
 * render path (a separate, already-working AI-output translation feature),
 * nor the dynamic report-preview bullet sentences built in `buildPreview()`,
 * which feed that same translateBriefing mechanism and must stay in English.
 * ------------------------------------------------------------------------- */

registerMessages('mr', {
  /* == AI Governance & Security — header, banner, KPIs ===================== */
  'Governance · AI Oversight & Security': 'कारभार · AI देखरेख व सुरक्षा',
  'Oversight console for AI-assisted decision support across the platform — model usage, human override rates, role-based access control, and audit trail integrity. AI systems here operate strictly in an advisory capacity under mandatory human review.':
    'संपूर्ण मंचावरील AI-सहाय्यित निर्णय सहाय्यासाठी देखरेख फलक — प्रारूप वापर, मानवी अधिक्रमण दर, भूमिका-आधारित प्रवेश नियंत्रण आणि लेखापरीक्षा मागोवा अखंडता. येथील AI प्रणाली केवळ सल्लागार क्षमतेत कार्य करतात आणि अनिवार्य मानवी पुनरावलोकनाच्या अधीन असतात.',
  'Mandatory Governance Boundaries': 'अनिवार्य कारभार मर्यादा',
  'AI cannot issue penalty': 'AI दंड आकारू शकत नाही',
  'AI cannot block taxpayer': 'AI करदात्याला अवरोधित करू शकत नाही',
  'AI cannot reject refund': 'AI परतावा नामंजूर करू शकत नाही',
  'AI only supports authorised officer decision-making': 'AI केवळ प्राधिकृत अधिकाऱ्याच्या निर्णय प्रक्रियेस सहाय्य करते',
  'AI Recommendations Generated': 'तयार केलेल्या AI शिफारशी',
  'Officer-Approved Actions': 'अधिकारी-मान्य कृती',
  'Rejected AI Suggestions': 'नामंजूर AI सूचना',
  'Pending Governance Review': 'कारभार पुनरावलोकन प्रलंबित',

  /* == Model Confidence Distribution / False Positive Review panels ======== */
  'Model Confidence Distribution': 'प्रारूप विश्वासार्हता वितरण',
  'Share of AI outputs by confidence band': 'विश्वासार्हता पट्ट्यानुसार AI निर्गताचा हिस्सा',
  'False Positive Review': 'खोटे सकारात्मक पुनरावलोकन',
  'Human-in-the-loop review outcomes for AI-flagged cases': 'AI-चिन्हांकित प्रकरणांसाठी मानव-सहभागी पुनरावलोकन निष्पत्ती',
  'Flags Reviewed': 'पुनरावलोकित इशारे',
  'Confirmed False Positives': 'निश्चित खोटे सकारात्मक',
  'Confirmed false-positive rate': 'निश्चित खोटे-सकारात्मक दर',
  'Of {0} AI-generated risk flags submitted for officer review, {1} were confirmed as false positives ({2}%). This rate is tracked continuously to monitor model precision and inform periodic recalibration; it does not by itself trigger any automated model change.':
    'अधिकारी पुनरावलोकनासाठी सादर केलेल्या {0} AI-निर्मित जोखीम इशाऱ्यांपैकी, {1} खोटे सकारात्मक म्हणून निश्चित करण्यात आले ({2}%). प्रारूपाची अचूकता निरीक्षण करण्यासाठी व नियतकालिक पुनःअंशांकनास माहिती देण्यासाठी हा दर सातत्याने मागोवा घेतला जातो; हा स्वतःहून कोणताही स्वयंचलित प्रारूप बदल घडवत नाही.',

  /* == Role-Based Access Control table (title/subtitle reused from shell.js) */
  'Module access permissions by officer role': 'अधिकारी भूमिकेनुसार घटक प्रवेश परवानग्या',
  Role: 'भूमिका',
  'Access Summary': 'प्रवेश सारांश',
  'Restricted / Focus Modules': 'प्रतिबंधित / केंद्रित घटक',
  'Full access to all modules, including Executive Command Center and AI Governance & Security.':
    'कार्यकारी सूत्र केंद्र व AI कारभार व सुरक्षेसह सर्व घटकांचा संपूर्ण प्रवेश.',
  'Access to all modules except AI Governance & Security; includes Audit & Scrutiny and Refund Risk.':
    'AI कारभार व सुरक्षा वगळता सर्व घटकांचा प्रवेश; यात लेखापरीक्षा व तपासणी आणि परतावा जोखीम यांचा समावेश.',
  'Access to all modules except Executive Command Center and AI Governance & Security; includes Audit & Scrutiny Engine.':
    'कार्यकारी सूत्र केंद्र व AI कारभार व सुरक्षा वगळता सर्व घटकांचा प्रवेश; यात लेखापरीक्षा व तपासणी यंत्रणेचा समावेश.',
  'Access to all modules except Executive Command Center and AI Governance & Security; includes Refund Risk Intelligence.':
    'कार्यकारी सूत्र केंद्र व AI कारभार व सुरक्षा वगळता सर्व घटकांचा प्रवेश; यात परतावा जोखीम बुद्धिमत्तेचा समावेश.',
  'Access to all modules except Executive Command Center; primary oversight of AI Governance & Security.':
    'कार्यकारी सूत्र केंद्र वगळता सर्व घटकांचा प्रवेश; AI कारभार व सुरक्षेची प्राथमिक देखरेख.',
  'Restricted to Reports & Briefing Notes only, in read-only capacity.':
    'केवळ अहवाल व माहितीपत्रांपुरता, केवळ-वाचन क्षमतेत मर्यादित.',
  'Reports & Briefing Notes (read-only)': 'अहवाल व माहितीपत्रे (केवळ-वाचन)',

  /* == Maker-Checker workflow panel ========================================= */
  'Maker-Checker / Human-in-the-Loop Workflow': 'निर्माता-पडताळणी / मानव-सहभागी कार्यप्रवाह',
  'Every AI-generated notice or audit action requires officer approval before execution':
    'प्रत्येक AI-निर्मित नोटीस किंवा लेखापरीक्षा कृतीसाठी अंमलबजावणीपूर्वी अधिकारी मान्यता आवश्यक',
  'The platform enforces a maker-checker control on every AI-assisted output. The AI system only ever occupies the "maker / draft" role — it cannot independently execute an enforcement action. This mirrors the Human Approval step already built into the Audit & Scrutiny Engine workflow, and applies uniformly across notice drafting, audit scoping, refund checklists and taxpayer outreach.':
    'प्रत्येक AI-सहाय्यित निर्गतावर मंच निर्माता-पडताळणी नियंत्रण लागू करतो. AI प्रणाली नेहमीच फक्त "निर्माता / मसुदा" भूमिकेत असते — ती स्वतंत्रपणे कोणतीही अंमलबजावणी कृती करू शकत नाही. हे लेखापरीक्षा व तपासणी यंत्रणा कार्यप्रवाहात आधीच अंतर्भूत असलेल्या मानवी मान्यता पायरीशी सुसंगत आहे आणि नोटीस मसुदा तयार करणे, लेखापरीक्षा व्याप्ती निश्चिती, परतावा तपासणी याद्या आणि करदाता संपर्क यांमध्ये एकसमानपणे लागू होते.',
  'AI generates draft': 'AI मसुदा तयार करते',
  'Notice / checklist / summary / briefing': 'नोटीस / तपासणी यादी / सारांश / माहितीपत्र',
  'Officer reviews': 'अधिकारी पुनरावलोकन करतो',
  'Verifies evidence, edits content': 'पुरावा पडताळतो, मजकूर संपादित करतो',
  'Officer approves or rejects': 'अधिकारी मान्यता देतो किंवा नामंजूर करतो',
  'Maker-checker control point': 'निर्माता-पडताळणी नियंत्रण बिंदू',
  'Action executed & logged': 'कृती अंमलात आणली व नोंदवली',
  'Recorded in audit trail': 'लेखापरीक्षा मागोव्यात नोंदवलेले',

  /* == Audit Log / AI Copilot log tables ==================================== */
  'Audit Log': 'लेखापरीक्षा नोंद',
  'System-wide access and action log across all modules — live entries from this session appear at the top':
    'सर्व घटकांमधील प्रणाली-व्यापी प्रवेश व कृती नोंद — या सत्रातील थेट नोंदी सर्वात वर दिसतात',
  'Filtered by header search: "{0}"': 'शीर्षलेख शोधाद्वारे गाळलेले: "{0}"',
  'Search user, action, module, case ID...': 'वापरकर्ता, कृती, घटक, प्रकरण क्रमांक शोधा...',
  Timestamp: 'वेळमुद्रा',
  User: 'वापरकर्ता',
  Action: 'कृती',
  Module: 'घटक',
  'Case ID': 'प्रकरण क्रमांक',
  'IP / Device': 'IP / उपकरण',
  Status: 'स्थिती',
  Live: 'थेट',
  'AI Copilot Prompt / Output Log': 'AI को-पायलट सूचना / निर्गत नोंद',
  'Every draft, summary, checklist or translation the AI Copilot has generated, with the officer and case it was generated for':
    'AI को-पायलटाने तयार केलेला प्रत्येक मसुदा, सारांश, तपासणी यादी किंवा भाषांतर, संबंधित अधिकारी व प्रकरणासह',
  '{0} logged outputs': '{0} नोंदवलेले निर्गत',
  'Search AI Copilot activity...': 'AI को-पायलट कार्यविवरण शोधा...',
  'No AI Copilot activity logged yet this session. Generate a draft, checklist, or summary from Officer AI Copilot to see it appear here.':
    'या सत्रात अद्याप कोणतेही AI को-पायलट कार्य नोंदवले गेलेले नाही. अधिकारी AI को-पायलटावरून मसुदा, तपासणी यादी किंवा सारांश तयार करा म्हणजे ते येथे दिसेल.',
  Officer: 'अधिकारी',
  'AI Output Generated': 'तयार केलेले AI निर्गत',
  'Context Module': 'संदर्भ घटक',
  'Case / GSTIN': 'प्रकरण / GSTIN',
  'Prompt/output content itself is not persisted in this log by design (data minimisation) — only the fact that a generation occurred, by whom, for which case, and when. This satisfies the governance requirement for AI Copilot usage logging distinct from the general system audit trail above.':
    'रचनेनुसार (माहिती अल्पीकरण) सूचना/निर्गत मजकूर स्वतः या नोंदीत साठवला जात नाही — केवळ निर्मिती घडली ही वस्तुस्थिती, कोणी, कोणत्या प्रकरणासाठी व केव्हा हेच नोंदवले जाते. हे वरील सर्वसाधारण प्रणाली लेखापरीक्षा मागोव्यापेक्षा वेगळी असलेली AI को-पायलट वापर नोंदणीची कारभार आवश्यकता पूर्ण करते.',

  /* == Model Explainability & Data Governance panel ========================= */
  'Model Explainability & Data Governance': 'प्रारूप स्पष्टीकरणीयता व माहिती कारभार',
  'Standing controls governing AI usage on this platform': 'या मंचावरील AI वापर नियंत्रित करणारी स्थायी नियंत्रणे',
  'Model explainability': 'प्रारूप स्पष्टीकरणीयता',
  'Every risk score is fully attributable to a discrete set of weighted, transparent rules (see the "Why flagged?" panel used app-wide) — there is no black-box scoring. Officers can trace any risk rating back to the exact triggered indicators and their weight contribution.':
    'प्रत्येक जोखीम गुण एका निश्चित, भारित व पारदर्शक नियम संचाशी पूर्णतः संबंधित असतो (संपूर्ण मंचावर वापरलेले "का चिन्हांकित?" फलक पहा) — कोणतेही गूढ गुणांकन नाही. अधिकारी कोणतेही जोखीम मानांकन नेमक्या चालना दिलेल्या निर्देशकांपर्यंत व त्यांच्या भार योगदानापर्यंत शोधू शकतात.',
  'Data minimisation': 'माहिती अल्पीकरण',
  'Encryption status': 'कूटबद्धता स्थिती',
  'API integration security': 'API एकात्मीकरण सुरक्षा',
  'All AI Copilot and reporting integrations are routed through the departmental secure gateway with mutual TLS, request signing, and role-scoped API tokens; no taxpayer data is transmitted to external, uncontrolled endpoints.':
    'सर्व AI को-पायलट व अहवाल एकात्मीकरणे परस्पर TLS, विनंती स्वाक्षरी व भूमिका-व्याप्त API टोकनसह विभागीय सुरक्षित प्रवेशद्वारामार्गे मार्गस्थ केली जातात; कोणतीही करदाता माहिती बाह्य, अनियंत्रित अंतिमबिंदूंकडे प्रसारित केली जात नाही.',
  'DPDP-aligned data handling': 'DPDP-अनुरूप माहिती हाताळणी',
  'Taxpayer personal and financial data is processed strictly for stated revenue-assurance and compliance purposes, consistent with the Digital Personal Data Protection Act, 2023, with purpose limitation, access logging and retention controls in place.':
    'करदात्याची वैयक्तिक व वित्तीय माहिती डिजिटल वैयक्तिक माहिती संरक्षण अधिनियम, २०२३ शी सुसंगत, केवळ नमूद महसूल हमी व अनुपालन प्रयोजनांसाठी हाताळली जाते, ज्यात प्रयोजन मर्यादा, प्रवेश नोंदणी व साठवण नियंत्रणे लागू आहेत.',
  'Bias / false-positive monitoring': 'पूर्वग्रह / खोटे-सकारात्मक निरीक्षण',
  'AI-flagged cases are continuously sampled for officer review (see False Positive Review panel above); confirmed false-positive rate is tracked to detect systemic bias or drift in specific sectors or districts.':
    'AI-चिन्हांकित प्रकरणे अधिकारी पुनरावलोकनासाठी सातत्याने नमुन्यादाखल घेतली जातात (वरील खोटे सकारात्मक पुनरावलोकन फलक पहा); विशिष्ट क्षेत्रे किंवा जिल्ह्यांतील पद्धतशीर पूर्वग्रह किंवा विचलन शोधण्यासाठी निश्चित खोटे-सकारात्मक दराचा मागोवा घेतला जातो.',
  'Model drift monitoring': 'प्रारूप विचलन निरीक्षण',
  'Red-team testing status': 'रेड-टीम चाचणी स्थिती',
  'Last red-team adversarial test conducted on {0}, covering prompt-injection, data-exfiltration and adversarial-input scenarios against the AI Copilot layer.':
    'AI को-पायलट स्तरावर सूचना-अंतःक्षेपण, माहिती-वहन व प्रतिकूल-निविष्टी परिस्थितींचा समावेश असलेली शेवटची रेड-टीम प्रतिकूल चाचणी {0} रोजी घेण्यात आली.',
  'CERT-In / VAPT readiness': 'CERT-In / VAPT सज्जता',
  'Access control review': 'प्रवेश नियंत्रण पुनरावलोकन',
  'Data encryption audit': 'माहिती कूटबद्धता लेखापरीक्षा',
  'Penetration testing': 'भेदन चाचणी',
  'Incident response drill': 'घटना प्रतिसाद सराव',
  'Third-party API security assessment': 'तृतीय-पक्ष API सुरक्षा मूल्यांकन',
  Complete: 'पूर्ण',
  Scheduled: 'नियोजित',

  /* == Reports & Briefing Notes — header, KPIs, list, modal ================= */
  'Governance · Report Generation Center': 'कारभार · अहवाल निर्मिती केंद्र',
  'Generate structured briefing notes and reports for the Commissioner, senior officers and audit/refund/investigation teams. Every report preview is a simulated draft assembled from current platform data for demonstration purposes and requires officer sign-off before formal circulation.':
    'आयुक्त, वरिष्ठ अधिकारी आणि लेखापरीक्षा/परतावा/तपास चमूंसाठी संरचित माहितीपत्रे व अहवाल तयार करा. प्रत्येक अहवाल पूर्वावलोकन हे प्रात्यक्षिक प्रयोजनासाठी सध्याच्या मंच माहितीवरून जुळवलेला अनुरूपित मसुदा असून औपचारिक प्रसारणापूर्वी अधिकारी मान्यता आवश्यक आहे.',
  'Report Types Available': 'उपलब्ध अहवाल प्रकार',
  'Reports Generated (This Month)': 'तयार केलेले अहवाल (या महिन्यात)',
  'Most-Requested Report': 'सर्वाधिक विनंती केलेला अहवाल',
  'Pending Governance-Reviewed Reports': 'कारभार-पुनरावलोकन प्रलंबित अहवाल',
  'No reports match your search.': 'आपल्या शोधाशी जुळणारे कोणतेही अहवाल नाहीत.',
  Preview: 'पूर्वावलोकन',
  Generate: 'तयार करा',
  'Draft report preview': 'अहवाल मसुदा पूर्वावलोकन',
  'Simulated output for demonstration': 'प्रात्यक्षिकासाठी अनुरूपित निर्गत',
  'Generated on {0}': 'निर्मिती दिनांक {0}',
  'Summary — English': 'सारांश — इंग्रजी',
  'This report preview is a simulated, AI-assisted draft generated from platform data for demonstration purposes only. It is not an official departmental record and requires review and sign-off by an authorised officer before circulation or filing.':
    'हे अहवाल पूर्वावलोकन केवळ प्रात्यक्षिक प्रयोजनासाठी मंच माहितीवरून तयार केलेला अनुरूपित, AI-सहाय्यित मसुदा आहे. हा अधिकृत विभागीय अभिलेख नसून प्रसारण किंवा दाखलीपूर्वी प्राधिकृत अधिकाऱ्याचे पुनरावलोकन व मान्यता आवश्यक आहे.',

  /* == The 10 report types — name + description ============================ */
  'Commissioner Daily Brief': 'आयुक्त दैनिक माहितीपत्र',
  'Daily executive summary of revenue, risk and priority alerts.': 'महसूल, जोखीम व प्राधान्य इशाऱ्यांचा दैनिक कार्यकारी सारांश.',
  'Monthly Revenue Risk Report': 'मासिक महसूल जोखीम अहवाल',
  'Consolidated revenue performance and risk exposure for the month.': 'महिन्यासाठी एकत्रित महसूल कामगिरी व जोखीम रक्कम.',
  'District Performance Report': 'जिल्हा कामगिरी अहवाल',
  'Target vs actual, risk concentration and workload by district.': 'जिल्हानिहाय उद्दिष्ट विरुद्ध प्रत्यक्ष, जोखीम एकवटन व कार्यभार.',
  'Sector Risk Report': 'क्षेत्र जोखीम अहवाल',
  'Sector-wise benchmark deviation and anomaly summary.': 'क्षेत्रनिहाय मानक विचलन व विसंगती सारांश.',
  'ITC Exposure Report': 'ITC जोखीम रक्कम अहवाल',
  'High-risk ITC claims and estimated exposure.': 'उच्च-जोखमीचे ITC दावे व अंदाजित जोखीम रक्कम.',
  'Refund Risk Report': 'परतावा जोखीम अहवाल',
  'Refund scrutiny pipeline and risk-ranked cases.': 'परतावा तपासणी प्रवाह व जोखीम-क्रमांकित प्रकरणे.',
  'Audit Prioritisation Report': 'लेखापरीक्षा प्राधान्यक्रम अहवाल',
  'Risk-ranked taxpayer list for audit planning.': 'लेखापरीक्षा नियोजनासाठी जोखीम-क्रमांकित करदाता यादी.',
  'Litigation Risk Report': 'खटला जोखीम अहवाल',
  'Appeal pipeline, adverse outcome risk and recovery locked.': 'अपील प्रवाह, प्रतिकूल निष्पत्ती जोखीम व अडकलेली वसुली.',
  'Compliance Early Warning Report': 'अनुपालन पूर्वसूचना अहवाल',
  'Proactive signals and recommended taxpayer outreach.': 'सक्रिय संकेत व शिफारस केलेला करदाता संपर्क.',
  'AI Governance Report': 'AI कारभार अहवाल',
  'Model usage, human override rate and audit trail summary.': 'प्रारूप वापर, मानवी अधिक्रमण दर व लेखापरीक्षा मागोवा सारांश.'
})
