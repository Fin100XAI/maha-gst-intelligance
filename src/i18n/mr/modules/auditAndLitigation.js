import { registerMessages } from '../../locale.js'

/* ---------------------------------------------------------------------------
 * AUDIT & SCRUTINY ENGINE + LITIGATION INTELLIGENCE CATALOGUE
 *
 * Hand-written Marathi for every string introduced by
 * `src/modules/AuditScrutinyEngine.jsx` and `src/modules/LitigationIntelligence.jsx`
 * that is not already covered by `../shell.js`. Recurring terms (District,
 * Sector, risk levels, "Cr", common words) reuse the shell/lexicon reading
 * wherever the exact same English source text recurs.
 * ------------------------------------------------------------------------- */

registerMessages('mr', {
  /* == Shared table column headers / common labels ========================= */
  'Case ID': 'प्रकरण क्रमांक',
  'GSTIN / Trade Name': 'GSTIN / व्यापार नाव',
  District: 'जिल्हा',
  Sector: 'क्षेत्र',
  Stage: 'टप्पा',
  'View Taxpayer 360': 'करदाता ३६० पहा',
  '{0} days': '{0} दिवस',
  Cases: 'प्रकरणे',

  /* == Audit & Scrutiny Engine — header, RBAC banner ======================= */
  'Enforcement · Risk-Based Prioritisation': 'अंमलबजावणी · जोखीम-आधारित प्राधान्यक्रम',
  'Risk-ranked audit case prioritisation and pipeline management — from case identification through hearing and recovery, with AI-assisted checklists, notices and mandatory officer approval at every stage transition.':
    'जोखीम-क्रमांकित लेखापरीक्षा प्रकरण प्राधान्यक्रम व कार्यप्रवाह व्यवस्थापन — प्रकरण ओळखीपासून सुनावणी व वसुलीपर्यंत, AI-सहाय्यित तपासणी याद्या, नोटिसा आणि प्रत्येक टप्पा बदलावर अनिवार्य अधिकारी मान्यतेसह.',
  'Showing cases assigned to you —': 'तुम्हाला नेमून दिलेली प्रकरणे दाखवत आहे —',
  '{0} of {1} statewide': '{1} पैकी {0} राज्यव्यापी',
  'Showing all {0} cases statewide — role-based access allows this for your account':
    'राज्यव्यापी सर्व {0} प्रकरणे दाखवत आहे — आपल्या खात्यासाठी भूमिका-आधारित प्रवेशामुळे हे शक्य आहे',
  'View all statewide cases': 'सर्व राज्यव्यापी प्रकरणे पहा',
  'Back to my assigned cases': 'माझ्या नेमून दिलेल्या प्रकरणांकडे परत जा',

  /* == Audit & Scrutiny Engine — KPI cards ================================= */
  'Active Cases': 'सक्रिय प्रकरणे',
  'in pipeline': 'कार्यवाहीत',
  'Total Estimated Exposure': 'एकूण अंदाजित जोखीम रक्कम',
  '₹ Cr': '₹ कोटी',
  'Critical Risk Cases': 'अत्यंत गंभीर जोखीम प्रकरणे',
  'highest category': 'सर्वोच्च श्रेणी',
  'Average Case Age': 'सरासरी प्रकरण वय',
  days: 'दिवस',

  /* == Audit & Scrutiny Engine — case list card and table =================== */
  'Risk-Ranked Case List': 'जोखीम-क्रमांकित प्रकरण यादी',
  'Sorted by risk score, descending — respects global district / sector / risk filters':
    'जोखीम गुणांनुसार उतरत्या क्रमाने क्रमवारी — सर्वंकष जिल्हा / क्षेत्र / जोखीम गाळण्या लागू',
  'Officer Verification Required': 'अधिकारी पडताळणी आवश्यक',
  Risk: 'जोखीम',
  'Estimated Exposure': 'अंदाजित जोखीम रक्कम',
  'Assigned Officer': 'नेमलेला अधिकारी',
  'Suggested Scope': 'सुचवलेली व्याप्ती',
  Action: 'कृती',
  'Open Case': 'प्रकरण उघडा',
  'Search by GSTIN or trade name...': 'GSTIN किंवा व्यापार नावाने शोधा...',
  'No audit cases match the current filters.': 'सध्याच्या गाळण्यांशी जुळणारे कोणतेही लेखापरीक्षा प्रकरण नाही.',

  /* == Audit & Scrutiny Engine — workflow pipeline (Kanban) ================= */
  'Audit Workflow Pipeline': 'लेखापरीक्षा कार्यप्रवाह मार्गिका',
  'Kanban-style stage tracking — advance or return a case using the controls on each card':
    'कानबान-शैली टप्पा निरीक्षण — प्रत्येक पत्त्यावरील नियंत्रणे वापरून प्रकरण पुढे न्या किंवा मागे घ्या',
  'No cases': 'प्रकरणे नाहीत',
  Back: 'मागे',
  Next: 'पुढे',

  /* == Audit & Scrutiny Engine — case stage names (AUDIT_STAGES) =========== */
  New: 'नवीन',
  'Under Review': 'पुनरावलोकनाधीन',
  'Notice Drafted': 'नोटीस मसुदा तयार',
  Hearing: 'सुनावणी',
  Recovery: 'वसुली',
  Closed: 'बंद',

  /* == Audit & Scrutiny Engine — suggested-scope advisory text (3 fixed values) */
  'Full-scope investigation: ITC chain verification, counterparty cross-check, e-way bill reconciliation':
    'पूर्ण-व्याप्ती तपास: ITC साखळी पडताळणी, प्रतिपक्ष तपासणी, ई-वे बिल ताळमेळ',
  'Focused ITC verification: supplier GSTR-2B reconciliation, invoice sampling':
    'केंद्रित ITC पडताळणी: पुरवठादार GSTR-2B ताळमेळ, चलन नमुना तपासणी',
  'Standard desk scrutiny: return consistency and payment trend review':
    'मानक डेस्क तपासणी: विवरणपत्र सुसंगतता व भरणा कल पुनरावलोकन',

  /* == Audit & Scrutiny Engine — case detail modal ========================== */
  'Case {0} — {1}': 'प्रकरण {0} — {1}',
  'Opened {0}': 'उघडले {0}',
  'Last Action {0}': 'शेवटची कृती {0}',
  'Case Summary': 'प्रकरण सारांश',
  'Case Age': 'प्रकरण वय',
  'Taxpayer profile unavailable for risk indicators.': 'जोखीम निर्देशकांसाठी करदाता प्रोफाइल उपलब्ध नाही.',
  'AI-Generated Audit Note': 'AI-निर्मित लेखापरीक्षा टिपण',
  'Generate Required Documents Checklist': 'आवश्यक कागदपत्रांची तपासणी यादी तयार करा',
  'Compare Similar Historical Cases': 'समान ऐतिहासिक प्रकरणांची तुलना करा',
  'Preview Notice Draft': 'नोटीस मसुद्याचे पूर्वावलोकन करा',
  'Human Approval': 'मानवी मान्यता',
  'I confirm officer review is complete — risk indicators, checklist and supporting evidence for this case have been examined and verified.':
    'मी पुष्टी करतो की अधिकारी पुनरावलोकन पूर्ण झाले आहे — या प्रकरणाच्या जोखीम निर्देशकांची, तपासणी यादीची व सहाय्यक पुराव्यांची तपासणी व पडताळणी करण्यात आली आहे.',
  'Case Closed': 'प्रकरण बंद झाले',
  'Approve for Next Stage ({0})': 'पुढील टप्प्यासाठी मान्यता द्या ({0})',

  /* == Litigation Intelligence — header, KPI cards ========================== */
  "Appeal and order intelligence across the department's litigation pipeline — legal issue trends, ageing, adverse outcome risk and AI-assisted case review.":
    'विभागाच्या खटला कार्यप्रवाहातील अपील व आदेश बुद्धिमत्ता — कायदेशीर मुद्द्यांचे कल, वयोमान, प्रतिकूल निष्पत्ती जोखीम आणि AI-सहाय्यित प्रकरण पुनरावलोकन.',
  'Total Appeals': 'एकूण अपील',
  'Dept. Success Rate': 'विभागाचा यशस्वी दर',
  'Orders Reversed': 'उलटवलेले आदेश',
  'Recovery Locked': 'अडकलेली वसुली',
  Cr: 'कोटी',
  'High-Value Pending': 'उच्च-मूल्य प्रलंबित',
  '> ₹5Cr': '> ₹५ कोटी',

  /* == Litigation Intelligence — charts ====================================== */
  'Common Issues Under Dispute': 'वादग्रस्त सामान्य मुद्दे',
  'Litigation cases by legal issue category': 'कायदेशीर मुद्दा श्रेणीनुसार खटला प्रकरणे',
  'Case Ageing Distribution': 'प्रकरण वयोमान वितरण',
  'Days since appeal filed': 'अपील दाखल केल्यापासूनचे दिवस',
  '< 90 days': '९० दिवसांपेक्षा कमी',
  '90 – 365 days': '९० – ३६५ दिवस',
  '365+ days': '३६५+ दिवस',

  /* == Litigation Intelligence — legal issue categories (LEGAL_ISSUES) ====== */
  'ITC Eligibility Dispute': 'ITC पात्रता वाद',
  'Classification Dispute': 'वर्गीकरण वाद',
  'Valuation Dispute': 'मूल्यांकन वाद',
  'Place of Supply Dispute': 'पुरवठा स्थळ वाद',
  'Refund Rejection Challenge': 'परतावा नकार आव्हान',
  'Penalty Proportionality': 'दंड प्रमाणबद्धता',
  'Limitation Period Dispute': 'मुदत कालावधी वाद',

  /* == Litigation Intelligence — appeal stage names (appealStatus) ========== */
  'Pending at Appellate Authority': 'अपील प्राधिकरणात प्रलंबित',
  'Pending at Tribunal': 'न्यायाधिकरणात प्रलंबित',
  'Order Confirmed': 'आदेश कायम',
  'Order Reversed': 'आदेश रद्द',
  Remanded: 'पुनर्विचारार्थ परत पाठवले',

  /* == Litigation Intelligence — department position (departmentPosition) == */
  Strong: 'भक्कम',
  Moderate: 'मध्यम',
  'Weak — documentation gap': 'दुर्बल — दस्तऐवजीकरण तफावत',
  'Weak — precedent unfavourable': 'दुर्बल — पूर्वदृष्टान्त प्रतिकूल',

  /* == Litigation Intelligence — officer training signals ================== */
  'Officer Training Signals': 'अधिकारी प्रशिक्षण संकेत',
  'Pattern analysis of weak department positions across litigation cases':
    'खटला प्रकरणांमधील दुर्बल विभागीय भूमिकांचे नमुना विश्लेषण',
  'No weak-position cases identified in the current litigation register.':
    'सध्याच्या खटला नोंदवहीत कोणतीही दुर्बल-स्थिती प्रकरणे आढळली नाहीत.',
  'of weak-position cases': 'दुर्बल-स्थिती प्रकरणांपैकी',
  '({0} of {1})': '({1} पैकी {0})',
  'relate to': 'संबंधित आहेत',
  'documentation gaps': 'दस्तऐवजीकरण तफावतीशी',
  'recommend a refresher training on evidence collection and case-file discipline for audit and assessment officers.':
    'लेखापरीक्षा व आकारणी अधिकाऱ्यांसाठी पुरावा संकलन व प्रकरण-फाइल शिस्तीबाबत उजळणी प्रशिक्षणाची शिफारस आहे.',
  'unfavourable precedent': 'प्रतिकूल पूर्वदृष्टान्ताशी',
  'recommend routing these categories through the Legal Cell early, and briefing field officers on current appellate/tribunal trends for the affected issue categories.':
    'या श्रेणी लवकर विधी कक्षामार्फत मार्गस्थ करण्याची आणि संबंधित मुद्दा श्रेणींबाबत सध्याच्या अपील/न्यायाधिकरण कलांबाबत क्षेत्रीय अधिकाऱ्यांना माहिती देण्याची शिफारस आहे.',
  'Advisory signal — training plan requires Commissioner approval': 'सल्लागार संकेत — प्रशिक्षण आराखड्यास आयुक्तांची मान्यता आवश्यक',

  /* == Litigation Intelligence — case register table ======================== */
  'Litigation Case Register': 'खटला प्रकरण नोंदवही',
  'Respects global district / sector / search filters': 'सर्वंकष जिल्हा / क्षेत्र / शोध गाळण्या लागू',
  'Search case, GSTIN, trade name...': 'प्रकरण, GSTIN, व्यापार नाव शोधा...',
  'Legal Issue': 'कायदेशीर मुद्दा',
  'Disputed Amount': 'विवादित रक्कम',
  'Ageing (days)': 'वयोमान (दिवस)',
  'Adverse Outcome Risk': 'प्रतिकूल निष्पत्ती जोखीम',
  'Department Position': 'विभागाची भूमिका',
  View: 'पहा',

  /* == Litigation Intelligence — case detail modal =========================== */
  'Filed On': 'दाखल दिनांक',
  Ageing: 'वयोमान',
  'AI Litigation Risk Summary': 'AI खटला जोखीम सारांश',

  /* == Litigation Intelligence — AI-style documentation recommendation ====== */
  'Documentation improvement required': 'दस्तऐवजीकरण सुधारणा आवश्यक',
  "Case file lacks sufficient contemporaneous evidence to support the department's position on {0}. Recommend collating GSTR-2B reconciliation statements, e-way bill trail and supplier confirmation letters before the next hearing, and formally placing them on record with a covering note.":
    '{0} संदर्भात विभागाच्या भूमिकेस समर्थन देण्यासाठी प्रकरण फाइलमध्ये पुरेसा समकालीन पुरावा नाही. पुढील सुनावणीपूर्वी GSTR-2B ताळमेळ विवरणे, ई-वे बिल मागोवा व पुरवठादार पुष्टीकरण पत्रे एकत्रित करून आच्छादन टिपणासह औपचारिकरित्या अभिलेखावर ठेवण्याची शिफारस आहे.',
  'Legal position needs strengthening': 'कायदेशीर भूमिका बळकट करणे आवश्यक',
  "Existing appellate/tribunal precedent on {0} is currently unfavourable to the department's stand. Recommend consulting the Legal Cell for an alternative distinguishing argument or, where warranted, evaluating settlement/withdrawal to avoid an adverse order at a higher forum.":
    '{0} संदर्भातील विद्यमान अपील/न्यायाधिकरण पूर्वदृष्टान्त सध्या विभागाच्या भूमिकेस प्रतिकूल आहे. पर्यायी भेदभावात्मक युक्तिवादासाठी विधी कक्षाचा सल्ला घेण्याची किंवा, आवश्यक असल्यास, उच्च न्यायमंचावर प्रतिकूल आदेश टाळण्यासाठी समझोता/माघारीचे मूल्यमापन करण्याची शिफारस आहे.',
  'Position adequate — minor reinforcement suggested': 'भूमिका पुरेशी — किरकोळ बळकटीकरण सुचवले',
  'Department position is reasonably supported. Recommend a final review of the reply/counter-affidavit for completeness and ensuring all annexures referenced are on file prior to hearing.':
    'विभागाच्या भूमिकेस वाजवी समर्थन आहे. सुनावणीपूर्वी उत्तर/प्रति-प्रतिज्ञापत्राचे पूर्णतेसाठी अंतिम पुनरावलोकन करण्याची व संदर्भित सर्व जोडपत्रे फाइलमध्ये असल्याची खातरजमा करण्याची शिफारस आहे.',
  'Position well supported': 'भूमिका सुयोग्यरित्या समर्थित',
  'Documentation and legal reasoning for this case are adequately supported. No immediate corrective action required; maintain current filing discipline for the next hearing.':
    'या प्रकरणाचे दस्तऐवजीकरण व कायदेशीर तर्क पुरेसे समर्थित आहेत. तात्काळ सुधारात्मक कृतीची आवश्यकता नाही; पुढील सुनावणीसाठी सध्याची फाइलिंग शिस्त कायम ठेवा.'
})
