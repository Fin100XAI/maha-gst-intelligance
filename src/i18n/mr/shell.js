import { registerMessages } from '../locale.js'

/* ---------------------------------------------------------------------------
 * SHELL, LANDING PAGE AND SIGN-IN CATALOGUE
 *
 * Hand-written Marathi for every string on the app shell (masthead, topbar,
 * navigation, context bar), the pre-login landing page, and the role
 * sign-in screen — the surfaces every officer sees before reaching a single
 * module, and so the highest-visibility text in the platform.
 * ------------------------------------------------------------------------- */

registerMessages('mr', {
  /* == Masthead ============================================================ */
  'Government of Maharashtra · Office of the State GST Commissioner': 'महाराष्ट्र शासन · राज्य वस्तू व सेवा कर आयुक्त कार्यालय',
  'Revenue Assurance, Fraud Risk & Compliance Intelligence Infrastructure for GST':
    'GST साठी महसूल हमी, फसवणूक जोखीम व अनुपालन इंटेलिजन्स प्रणाली',
  'Position as at': 'स्थिती दिनांक',
  'Demonstration Environment': 'प्रात्यक्षिक वातावरण',
  'Demonstration Environment · Simulated data': 'प्रात्यक्षिक वातावरण · नमुना आकडेवारी',
  Session: 'सत्र',

  /* == Data provenance ===================================================== */
  'Illustrative data': 'नमुना माहिती',
  'Figures as at {0}': 'आकडेवारी {0} रोजीची',
  'Every figure on this screen is generated demonstration data. No live departmental system is connected.':
    'या स्क्रीनवरील प्रत्येक आकडा प्रात्यक्षिकासाठी तयार केलेला आहे. कोणतीही थेट विभागीय प्रणाली जोडलेली नाही.',

  /* == Header / Topbar ====================================================== */
  'Search GSTIN, trade name, legal name...': 'GSTIN, व्यापार नाव, कायदेशीर नाव शोधा...',
  Copilot: 'को-पायलट',
  'Switch role': 'भूमिका बदला',
  'Sign out': 'साइन आउट',
  'Role-based access': 'भूमिका-आधारित प्रवेश',
  '{0} of {1} modules': '{1} पैकी {0} घटक',
  'Restricted: {0}': 'प्रतिबंधित: {0}',
  'Interface language': 'इंटरफेस भाषा',
  'Text size': 'मजकूर आकार',
  'Text size: {0}': 'मजकूर आकार: {0}',
  'Colour theme': 'रंगसंगती',
  'Colour theme: {0}': 'रंगसंगती: {0}',
  Light: 'प्रकाशमान',
  Dark: 'गडद',
  Notifications: 'सूचना',
  'Restricted for your role': 'आपल्या भूमिकेसाठी प्रतिबंधित',
  'assigned cases': 'नेमून दिलेली प्रकरणे',
  'Revenue Assurance & Compliance Intelligence Infrastructure': 'महसूल हमी व अनुपालन इंटेलिजन्स प्रणाली',

  /* == Navigation groups (also used on the landing page capability grid) === */
  'Command Centre': 'नियंत्रण कक्ष',
  'Revenue at Risk': 'जोखमीतील महसूल',
  'Case Priority': 'प्रकरण प्राधान्य',
  'Risk Discovery': 'जोखीम शोध',
  'Missed Revenue': 'निसटलेला महसूल',
  'Legal Standing': 'विधी स्थिती',
  Commissionerate: 'आयुक्तालय',
  'Registration & Returns': 'नोंदणी व विवरणपत्रे',
  'Audit & Assessment': 'लेखापरीक्षण व निर्धारण',
  'Investigation & Enforcement': 'तपास व अंमलबजावणी',
  'Refund & Recovery': 'परतावा व वसुली',
  'Legal & Appeals': 'विधी व अपील',
  'Analytics & Governance': 'विश्लेषण व कारभार',
  Leadership: 'नेतृत्व',
  Revenue: 'महसूल',
  'Fraud & Risk': 'फसवणूक व जोखीम',
  Enforcement: 'अंमलबजावणी',
  Benchmarking: 'तुलनात्मक मूल्यमापन',
  'Data Resources': 'डेटा संसाधने',
  Governance: 'कारभार',

  /* == Module titles (15) — used in TopNav dropdowns, mobile sidebar, and
     the landing page's capability grid ===================================== */
  'Executive Command Center': 'कार्यकारी सूत्र केंद्र',
  'Revenue Intelligence': 'महसूल इंटेलिजन्स',
  'Taxpayer 360': 'करदाता ३६०',
  'ITC Risk Intelligence': 'ITC जोखीम इंटेलिजन्स',
  'Fake Invoice Network': 'बनावट चलन जाळे',
  'E-Way Bill Intelligence': 'ई-वे बिल इंटेलिजन्स',
  'Refund Risk Intelligence': 'परतावा जोखीम इंटेलिजन्स',
  'Audit & Scrutiny Engine': 'लेखापरीक्षा व तपासणी यंत्रणा',
  'Sector Intelligence': 'क्षेत्र इंटेलिजन्स',
  'District & Division Performance': 'जिल्हा व विभाग कामगिरी',
  'Officer AI Copilot': 'अधिकारी AI को-पायलट',
  'Litigation Intelligence': 'खटला इंटेलिजन्स',
  'Compliance Early Warning': 'अनुपालन पूर्वसूचना',
  'AI Governance & Security': 'AI कारभार व सुरक्षा',
  'Reports & Briefing Notes': 'अहवाल व माहितीपत्रे',

  /* == Context bar ========================================================== */
  Context: 'संदर्भ',
  'Maha GST Intelligence': 'महा GST इंटेलिजन्स',
  'Acting as {0}': '{0} म्हणून कार्यरत',
  Filters: 'गाळण्या',

  /* == Officer roles (RoleSelector, ContextBar "Acting as", Header profile) */
  Commissioner: 'आयुक्त',
  'Joint Commissioner': 'सह आयुक्त',
  'Division Officer': 'विभागीय अधिकारी',
  'Audit Officer': 'लेखापरीक्षा अधिकारी',
  'Refund Officer': 'परतावा अधिकारी',
  'Investigation Officer': 'तपास अधिकारी',
  'AI Governance Officer': 'AI कारभार अधिकारी',
  'Read-only Policy Viewer': 'केवळ-वाचन धोरण दर्शक',
  'Guest Officer': 'अतिथी अधिकारी',

  /* == Role selector (sign-in) screen ======================================= */
  'Secure Access · Role-Based Sign-In': 'सुरक्षित प्रवेश · भूमिका-आधारित साइन-इन',
  'Officer Name (optional)': 'अधिकाऱ्याचे नाव (ऐच्छिक)',
  'e.g. Rohan Deshmukh': 'उदा. रोहन देशमुख',
  'Select Role to Continue': 'सुरू ठेवण्यासाठी भूमिका निवडा',
  'You are signing in as': 'आपण याप्रमाणे साइन इन करत आहात',
  'Select your officer record…': 'आपली अधिकारी नोंद निवडा…',
  'This role is scoped to cases assigned to you specifically — pick your officer record so that scoping resolves correctly.':
    'ही भूमिका फक्त आपल्याला नेमून दिलेल्या प्रकरणांपुरती मर्यादित आहे — योग्य व्याप्ती निश्चित होण्यासाठी आपली अधिकारी नोंद निवडा.',
  'Enter Secure Workspace': 'सुरक्षित कार्यक्षेत्रात प्रवेश करा',
  'This is a demonstration environment using simulated data. Role-based access control, maker-checker workflow and audit logging are enforced throughout the platform.':
    'हे अनुरूपित माहिती वापरणारे प्रात्यक्षिक वातावरण आहे. भूमिका-आधारित प्रवेश नियंत्रण, निर्माता-पडताळणी कार्यप्रवाह आणि लेखापरीक्षा नोंदी संपूर्ण प्रणालीत लागू आहेत.',
  'Full state-wide access. Executive command center, all intelligence modules and AI governance.':
    'संपूर्ण राज्यव्यापी प्रवेश. कार्यकारी सूत्र केंद्र, सर्व इंटेलिजन्स घटक आणि AI कारभार.',
  'Full state-wide access with divisional oversight responsibilities.':
    'विभागीय देखरेखीच्या जबाबदाऱ्यांसह संपूर्ण राज्यव्यापी प्रवेश.',
  'Division-level revenue, audit and refund intelligence for assigned territory.':
    'नेमून दिलेल्या क्षेत्रासाठी विभाग-स्तरीय महसूल, लेखापरीक्षा व परतावा इंटेलिजन्स.',
  'Access to assigned audit and scrutiny cases and case-level intelligence.':
    'नेमून दिलेली लेखापरीक्षा व तपासणी प्रकरणे आणि प्रकरण-स्तरीय बुद्धिमत्तेचा प्रवेश.',
  'Access to refund risk intelligence and assigned refund cases.':
    'परतावा जोखीम इंटेलिजन्स व नेमून दिलेल्या परतावा प्रकरणांचा प्रवेश.',
  'Access to fake invoice network, ITC risk and audit case intelligence.':
    'बनावट चलन जाळे, ITC जोखीम व लेखापरीक्षा प्रकरण बुद्धिमत्तेचा प्रवेश.',
  'Access to AI governance dashboard, model logs and override review.':
    'AI कारभार डॅशबोर्ड, प्रारूप नोंदी व अधिक्रमण पुनरावलोकनाचा प्रवेश.',
  'Read-only access to reports and briefing notes only.':
    'केवळ अहवाल व माहितीपत्रांपुरता केवळ-वाचन प्रवेश.',

  /* == Landing page ========================================================== */
  'MAHA GST INTELLIGENCE': 'महा GST इंटेलिजन्स',
  'GOVERNMENT OF MAHARASHTRA · STATE GST DEPARTMENT': 'महाराष्ट्र शासन · राज्य वस्तू व सेवा कर विभाग',
  'Government of Maharashtra · State GST Department': 'महाराष्ट्र शासन · राज्य वस्तू व सेवा कर विभाग',
  'Officer Sign-In': 'अधिकारी साइन-इन',
  'A unified intelligence platform for the Commissioner, senior officers, audit teams and refund teams — turning filings, payments, ITC claims, e-way bills and litigation into explainable, action-ready risk signals. Built for revenue protection and taxpayer fairness alike.':
    'आयुक्त, वरिष्ठ अधिकारी, लेखापरीक्षा चमू व परतावा चमूंसाठी एकात्मिक इंटेलिजन्स मंच — विवरणपत्रे, भरणा, ITC दावे, ई-वे बिल व खटले यांचे स्पष्टीकरणीय, कृतीयोग्य जोखीम संकेतांत रूपांतर. महसूल संरक्षण आणि करदात्याच्या निष्पक्षतेसाठी तयार.',
  'View Platform Capabilities': 'मंचाची क्षमता पहा',
  'GST Revenue Modelled (24 months)': 'प्रतिरूपित GST महसूल (२४ महिने)',
  'Taxpayers Modelled': 'प्रतिरूपित करदाते',
  'Districts Modelled': 'प्रतिरूपित जिल्हे',
  'Generated demonstration data': 'प्रात्यक्षिकासाठी तयार केलेली माहिती',
  'Figures marked ◆ are generated demonstration data, shown as at {0}. They are not the department’s collection or taxpayer figures.':
    '◆ चिन्हांकित आकडे प्रात्यक्षिकासाठी तयार केलेले असून {0} रोजीची स्थिती दर्शवतात. ते विभागाचे प्रत्यक्ष वसुली अथवा करदाता आकडे नाहीत.',
  'Intelligence Modules': 'इंटेलिजन्स घटक',

  'Role-Based Access Control': 'भूमिका-आधारित प्रवेश नियंत्रण',
  'Maker-Checker Workflow': 'निर्माता-पडताळणी कार्यप्रवाह',
  'Explainable AI — No Black Box': 'स्पष्टीकरणीय AI — गूढ प्रणाली नाही',
  'DPDP-Aligned Data Handling': 'DPDP-अनुरूप माहिती हाताळणी',
  'Full Audit Trail': 'संपूर्ण लेखापरीक्षा मागोवा',
  'Human Approval on Every Action': 'प्रत्येक कृतीवर मानवी मान्यता',

  'What This Platform Does': 'हा मंच काय करतो',
  'Intelligence infrastructure, not another dashboard': 'इंटेलिजन्स प्रणाली, आणखी एक डॅशबोर्ड नव्हे',
  "Every module is built around one principle: officers get explainable signals, never black-box decisions.":
    'प्रत्येक घटक एका तत्त्वावर आधारित आहे: अधिकाऱ्यांना स्पष्टीकरणीय संकेत मिळतात, गूढ निर्णय कधीच नाहीत.',
  'Revenue Assurance': 'महसूल हमी',
  'Track collection against target across every district and sector, and surface leakage before it compounds.':
    'प्रत्येक जिल्हा व क्षेत्रात उद्दिष्टाच्या तुलनेत वसुलीचा मागोवा घ्या आणि गळती वाढण्यापूर्वीच शोधा.',
  'Fraud-Risk Detection': 'फसवणूक-जोखीम शोध',
  'Graph-based detection of circular trading, shell-entity patterns and pass-through invoice networks.':
    'वर्तुळाकार व्यापार, निष्क्रिय-संस्था नमुने व पासथ्रू चलन जाळ्यांचा आलेख-आधारित शोध.',
  'Explainable Risk Scoring': 'स्पष्टीकरणीय जोखीम गुणांकन',
  "Every risk score traces to a discrete, weighted rule set — officers see exactly why a taxpayer was flagged.":
    'प्रत्येक जोखीम गुण एका निश्चित, भारित नियम संचाशी जोडलेला असतो — करदात्याला का चिन्हांकित केले हे अधिकाऱ्यांना नेमके दिसते.',
  'Audit & Refund Prioritisation': 'लेखापरीक्षा व परतावा प्राधान्यक्रम',
  'Risk-ranked case queues with AI-assisted checklists and notice drafts, gated behind officer approval.':
    'जोखीम-क्रमांकित प्रकरण रांगा, AI-सहाय्यित तपासणी याद्या व नोटीस मसुदे, अधिकारी मान्यतेनंतरच वापरात.',
  'Officer Decision Support': 'अधिकारी निर्णय सहाय्य',
  'An AI copilot that drafts, summarises and translates — and never issues, blocks or rejects on its own.':
    'मसुदा तयार करणारा, सारांशित करणारा व भाषांतर करणारा AI को-पायलट — जो स्वतःहून कधीही जारी, अवरोधित वा नामंजूर करत नाही.',
  'Governance & Security': 'कारभार व सुरक्षा',
  'Role-based access, maker-checker approval and a full audit trail across every sensitive action.':
    'भूमिका-आधारित प्रवेश, निर्माता-पडताळणी मान्यता आणि प्रत्येक संवेदनशील कृतीचा संपूर्ण लेखापरीक्षा मागोवा.',

  'Platform Capabilities': 'मंच क्षमता',
  '15 intelligence modules, one command system': '१५ इंटेलिजन्स घटक, एक सूत्र प्रणाली',
  'From executive briefing to case-level scrutiny — organised the way officers actually work.':
    'कार्यकारी माहितीपत्रापासून प्रकरण-स्तरीय तपासणीपर्यंत — अधिकारी प्रत्यक्षात ज्या पद्धतीने काम करतात त्याच पद्धतीने रचलेले.',

  /* == Surfaces (landing page — pages behind the storefront) ================= */
  'Behind The Sign-In': 'साइन-इन नंतर',
  'The intelligence pages behind this platform': 'या मंचामागील इंटेलिजन्स पृष्ठे',
  'This page is the storefront. After sign-in, these same figures are laid out in the pages officers actually decide from — one for every area the department runs.':
    'हे पान दर्शनी भाग आहे. साइन-इन केल्यानंतर हेच आकडे अधिकारी प्रत्यक्ष ज्यावरून निर्णय घेतात त्या पानांमध्ये मांडले जातात — विभाग चालवत असलेल्या प्रत्येक क्षेत्रासाठी एक.',
  'Whole state on one screen, ordered by what needs a decision today.':
    'संपूर्ण राज्य एका पडद्यावर, आज कशावर निर्णय हवा त्या क्रमाने.',
  'Collection against target across every district, sector and tax head.':
    'प्रत्येक जिल्हा, क्षेत्र व कर शीर्षकात उद्दिष्टाच्या तुलनेत वसुली.',
  'One profile per GSTIN — filings, payments, ITC and risk in one place.':
    'प्रत्येक GSTIN साठी एक प्रोफाइल — विवरणपत्रे, भरणा, ITC व जोखीम एकाच ठिकाणी.',
  'Input tax credit claims scored against filing and payment behaviour.':
    'विवरणपत्र व भरणा वर्तनाच्या आधारे ITC दाव्यांचे गुणांकन.',
  'Graph view of circular trading, shell entities and pass-through chains.':
    'वर्तुळाकार व्यापार, निष्क्रिय संस्था व पासथ्रू साखळ्यांचे आलेख दृश्य.',
  'Transit records checked against filings for mismatches and route anomalies.':
    'विसंगती व मार्ग अनियमिततांसाठी वाहतूक नोंदी विवरणपत्रांशी पडताळल्या जातात.',
  'Refund claims ranked by risk before sanction, with the evidence behind each.':
    'मंजुरीपूर्वी परतावा दावे जोखिमेनुसार क्रमांकित, प्रत्येकामागील पुराव्यासह.',
  'Case queues, AI-assisted checklists and notice drafts, gated behind approval.':
    'प्रकरण रांगा, AI-सहाय्यित तपासणी याद्या व नोटीस मसुदे, मान्यतेनंतरच वापरात.',
  'Compliance and revenue patterns compared across industry sectors statewide.':
    'राज्यभरातील उद्योग क्षेत्रांमधील अनुपालन व महसूल नमुन्यांची तुलना.',
  'Every district and division scored on collection, compliance and enforcement.':
    'प्रत्येक जिल्हा व विभाग वसुली, अनुपालन व अंमलबजावणीवर गुणांकित.',
  'Drafts, summarises and translates — and never issues or blocks on its own.':
    'मसुदा तयार करतो, सारांशित करतो व भाषांतर करतो — स्वतःहून कधीही जारी वा अवरोधित करत नाही.',
  'Pending cases, order outcomes and exposure tracked through appeal stages.':
    'प्रलंबित प्रकरणे, आदेश निकाल व जोखीम अपील टप्प्यांदरम्यान मागोवा घेतले जातात.',
  'Non-filers and slipping compliance flagged before the shortfall compounds.':
    'तूट वाढण्यापूर्वीच अ-भरणादार व घसरते अनुपालन चिन्हांकित.',
  'Model logs, override history and the guardrails every recommendation runs through.':
    'प्रारूप नोंदी, अधिक्रमण इतिहास व प्रत्येक शिफारस ज्यातून जाते ते संरक्षक नियम.',
  'Ready-made briefing notes and exportable reports for every review cycle.':
    'प्रत्येक पुनरावलोकन चक्रासाठी सिद्ध माहितीपत्रे व निर्यातयोग्य अहवाल.',

  'Coverage In This Demonstration': 'या प्रात्यक्षिकातील व्याप्ती',
  '{0} districts modelled, one consolidated view': '{0} जिल्हे प्रतिरूपित, एक एकत्रित दृश्य',
  'This demonstration models {0} of Maharashtra’s 36 districts. The consolidated view is designed to take all 36 without change — what is shown here is a representative subset, not statewide coverage.':
    'हे प्रात्यक्षिक महाराष्ट्रातील ३६ पैकी {0} जिल्ह्यांचे प्रतिरूप करते. एकत्रित दृश्य कोणताही बदल न करता सर्व ३६ जिल्हे सामावून घेण्यासाठी तयार केलेले आहे — येथे दाखवलेला भाग प्रातिनिधिक नमुना आहे, राज्यव्यापी व्याप्ती नव्हे.',

  'Ready to enter the secure workspace?': 'सुरक्षित कार्यक्षेत्रात प्रवेश करण्यास तयार आहात?',
  'Sign in with your officer role to access risk intelligence, case workflows and the AI copilot — all subject to role-based access control and mandatory human approval.':
    'जोखीम इंटेलिजन्स, प्रकरण कार्यप्रवाह व AI को-पायलटाचा प्रवेश मिळवण्यासाठी आपल्या अधिकारी भूमिकेने साइन इन करा — सर्व भूमिका-आधारित प्रवेश नियंत्रण व अनिवार्य मानवी मान्यतेच्या अधीन.',

  'Government of Maharashtra · State GST Department — Revenue Assurance & Compliance Intelligence Infrastructure':
    'महाराष्ट्र शासन · राज्य वस्तू व सेवा कर विभाग — महसूल हमी व अनुपालन इंटेलिजन्स प्रणाली',
  'Demonstration environment · All figures are simulated': 'प्रात्यक्षिक वातावरण · सर्व आकडे अनुरूपित आहेत',

  /* == Live ticker (landing page) =========================================== */
  Simulated: 'अनुरूपित',
  '{0} compliance alerts currently open for officer review': '{0} अनुपालन इशारे अधिकारी पुनरावलोकनासाठी सध्या खुले आहेत',
  '{0} ITC risk cases flagged this cycle': 'या चक्रात {0} ITC जोखीम प्रकरणे चिन्हांकित',
  '{0} refund cases awaiting officer sanction': '{0} परतावा प्रकरणे अधिकारी मंजुरीच्या प्रतीक्षेत',
  '₹{0} Cr in exposure currently flagged as high-risk': 'सध्या ₹{0} कोटी रक्कम उच्च-जोखीम म्हणून चिन्हांकित',
  '{0} taxpayer has not filed for the current period': 'सध्याच्या कालावधीसाठी {0} करदात्याने विवरणपत्र भरलेले नाही',
  '{0} taxpayers have not filed for the current period': 'सध्याच्या कालावधीसाठी {0} करदात्यांनी विवरणपत्र भरलेले नाही',
  '{0} taxpayer currently carries a Critical risk rating': 'सध्या {0} करदाता अत्यंत गंभीर जोखीम श्रेणीत आहे',
  '{0} taxpayers currently carry a Critical risk rating': 'सध्या {0} करदाते अत्यंत गंभीर जोखीम श्रेणीत आहेत',

  /* == Built to be accountable (landing page trust section) ================= */
  Assurance: 'आश्वासन',
  'Built to be accountable': 'उत्तरदायी असण्यासाठी घडवलेले',
  'A decision an officer cannot account for is worse than no decision at all. These four properties hold on every page behind this one, and each can be checked from inside the platform.':
    'ज्या निर्णयाचा अधिकारी हिशेब देऊ शकत नाही, तो निर्णय नसण्यापेक्षा वाईट. या पृष्ठामागील प्रत्येक पानावर हे चार गुणधर्म लागू होतात आणि प्रत्येक मंचाच्या आतून तपासता येतो.',
  'Accountable by role': 'पदानुसार उत्तरदायी',
  'Access follows the role held, not the person — and every action taken under a role is logged against the officer who took it.':
    'प्रवेश व्यक्तीनुसार नव्हे तर धारण केलेल्या भूमिकेनुसार होतो — आणि त्या भूमिकेखाली केलेली प्रत्येक कृती ती करणाऱ्या अधिकाऱ्याच्या नावे नोंदवली जाते.',
  'Provenance on every figure': 'प्रत्येक आकड्यावर उगमनोंद',
  'Every module states where its figures come from and which of them are simulated. Nothing is shown as an observation that isn’t one.':
    'प्रत्येक घटक आपले आकडे कोठून येतात आणि त्यांपैकी कोणते अनुरूपित आहेत हे नमूद करतो. जे प्रत्यक्ष निरीक्षण नाही ते निरीक्षण म्हणून दाखवले जात नाही.',
  'AI that shows its work': 'आपली मांडणी दाखवणारी AI',
  'Every recommendation carries its evidence, its confidence, and which role is authorised to act on it. The platform never issues, blocks or rejects on its own.':
    'प्रत्येक शिफारस तिच्या पुराव्यासह, विश्वासार्हतेसह आणि तिच्यावर कार्यवाही करण्यास अधिकृत भूमिकेसह येते. मंच स्वतःहून कधीही जारी, अवरोधित वा नामंजूर करत नाही.',
  'Self-contained by design': 'रचनेनुसार स्वयंपूर्ण',
  'The platform makes no calls out to the open internet for its figures, models or maps. It runs entirely within the department’s own infrastructure.':
    'मंच आपल्या आकड्यांसाठी, प्रारूपांसाठी वा नकाशांसाठी खुल्या आंतरजालाशी संपर्क साधत नाही. तो पूर्णपणे विभागाच्या स्वतःच्या पायाभूत सुविधेत चालतो.',

  /* == Footer meta (landing page) ============================================ */
  'Last reviewed and updated': 'अंतिम पुनरावलोकन व अद्यतन',
  August: 'ऑगस्ट',
  'Visitors today (simulated)': 'आजचे अभ्यागत (अनुरूपित)',
  'Built in line with GIGW, W3C and WCAG 2.1 accessibility guidelines': 'GIGW, W3C व WCAG 2.1 सुलभता मार्गदर्शक तत्त्वांनुसार घडवलेले',

  /* == Global filter option lists (values stay English for filtering logic;
     only the visible option label passes through t()) ====================== */
  'All Districts': 'सर्व जिल्हे',
  Mumbai: 'मुंबई',
  Thane: 'ठाणे',
  Pune: 'पुणे',
  Nagpur: 'नागपूर',
  Nashik: 'नाशिक',
  'Chhatrapati Sambhajinagar': 'छत्रपती संभाजीनगर',
  Kolhapur: 'कोल्हापूर',
  Solapur: 'सोलापूर',
  Amravati: 'अमरावती',
  Jalgaon: 'जळगाव',
  Satara: 'सातारा',
  Raigad: 'रायगड',

  'All Divisions': 'सर्व विभाग',
  'Mumbai Division': 'मुंबई विभाग',
  'Thane Division': 'ठाणे विभाग',
  'Pune Division': 'पुणे विभाग',
  'Nagpur Division': 'नागपूर विभाग',
  'Nashik Division': 'नाशिक विभाग',
  'Aurangabad Division': 'औरंगाबाद विभाग',
  'Kolhapur Division': 'कोल्हापूर विभाग',
  'Amravati Division': 'अमरावती विभाग',

  'All Sectors': 'सर्व क्षेत्रे',
  'Real Estate': 'स्थावर मालमत्ता',
  Construction: 'बांधकाम',
  Pharma: 'औषधनिर्माण',
  Logistics: 'रसद',
  Textiles: 'वस्त्रोद्योग',
  'Gems & Jewellery': 'रत्ने व दागिने',
  'Auto Components': 'वाहन सुटे भाग',
  Restaurants: 'उपाहारगृहे',
  Electronics: 'इलेक्ट्रॉनिक्स',
  Steel: 'पोलाद',
  Cement: 'सिमेंट',
  'E-commerce Sellers': 'ई-कॉमर्स विक्रेते',
  'Professional Services': 'व्यावसायिक सेवा',
  'Import/Export': 'आयात/निर्यात',

  'All Types': 'सर्व प्रकार',
  'Regular Filer': 'नियमित विवरणपत्र भरणारा',
  'Late Filer': 'विलंबित विवरणपत्र भरणारा',
  'Non-Filer': 'विवरणपत्र न भरणारा',

  'All Risk Levels': 'सर्व जोखीम पातळ्या',
  Low: 'कमी',
  Medium: 'मध्यम',
  High: 'उच्च',
  Critical: 'अत्यंत गंभीर',

  'Last 3 Months': 'गेले ३ महिने',
  'Last 6 Months': 'गेले ६ महिने',
  'Last 12 Months': 'गेले १२ महिने',
  'Financial Year 2025-26': 'आर्थिक वर्ष २०२५-२६'
})
