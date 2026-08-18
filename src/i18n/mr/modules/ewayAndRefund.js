import { registerMessages } from '../../locale.js'

/* ---------------------------------------------------------------------------
 * E-WAY BILL INTELLIGENCE & REFUND RISK INTELLIGENCE CATALOGUE
 *
 * Hand-written Marathi for every string introduced by
 * `src/modules/EWayBillIntelligence.jsx` and
 * `src/modules/RefundRiskIntelligence.jsx` that is not already covered by
 * `shell.js`. Recurring shell terms (module titles, District, Sector, risk
 * levels, role names) are reused via shell.js and are not repeated here.
 * ------------------------------------------------------------------------- */

registerMessages('mr', {
  /* == Shared column headers / labels used by both modules ================ */
  'GSTIN / Trade Name': 'GSTIN / व्यापार नाव',
  District: 'जिल्हा',
  Sector: 'क्षेत्र',
  Action: 'कृती',
  '₹ Lakh': '₹ लाख',
  'Search by GSTIN or trade name...': 'GSTIN किंवा व्यापार नावाने शोधा...',
  'Officer Review Required': 'अधिकारी पुनरावलोकन आवश्यक',
  Yes: 'होय',
  No: 'नाही',
  'Export-Linked': 'निर्यात-संबंधित',
  Domestic: 'देशांतर्गत',
  Moderate: 'मध्यम',

  /* == E-Way Bill Intelligence ============================================= */
  'Fraud & Risk · Logistics Intelligence': 'फसवणूक व जोखीम · रसद बुद्धिमत्ता',
  'Movement-vs-filing intelligence: correlating declared e-way bill movement value against filed returns to surface logistics-linked under-reporting risk across Maharashtra.':
    'हालचाल-विरुद्ध-विवरणपत्र बुद्धिमत्ता: महाराष्ट्रभर रसदशी संबंधित अल्प-नोंदणी जोखीम उघड करण्यासाठी घोषित ई-वे बिल हालचाल मूल्याची दाखल विवरणपत्रांशी सांगड घालणे.',

  'Total E-Way Bill Value': 'एकूण ई-वे बिल मूल्य',
  'High Movement, Low Filing': 'उच्च हालचाल, अल्प विवरणपत्र भरणा',
  'records flagged': 'चिन्हांकित नोंदी',
  'Cancellation Rate': 'रद्दीकरण दर',
  'Inter-State Long Haul': 'आंतरराज्य दीर्घ अंतर वाहतूक',
  movements: 'हालचाली',

  'E-Way Bill Value Trend': 'ई-वे बिल मूल्य कल',
  'Total declared movement value across recent periods': 'अलीकडील कालावधींमधील एकूण घोषित हालचाल मूल्य',
  'No e-way bill records match the current filters.': 'सध्याच्या गाळण्यांशी जुळणाऱ्या कोणत्याही ई-वे बिल नोंदी नाहीत.',
  'District-Wise Logistics Risk': 'जिल्हानिहाय रसद जोखीम',
  'Anomaly-flagged movements by district': 'जिल्ह्यानुसार विसंगती-चिन्हांकित हालचाली',
  'No district data available for the current filters.': 'सध्याच्या गाळण्यांसाठी जिल्हानिहाय माहिती उपलब्ध नाही.',

  'Suspicious E-Way Bill Patterns': 'संशयास्पद ई-वे बिल नमुने',
  'Records with anomaly flags, cancellations, or no matching filed return': 'विसंगती चिन्हांकित, रद्द झालेल्या किंवा दाखल विवरणपत्राशी न जुळणाऱ्या नोंदी',
  'No suspicious e-way bill patterns match the current filters.': 'सध्याच्या गाळण्यांशी जुळणारे कोणतेही संशयास्पद ई-वे बिल नमुने नाहीत.',

  'AI-Generated Movement Mismatch Summary': 'AI-निर्मित हालचाल विसंगती सारांश',
  'AI-Generated Movement Mismatch Summary — {0}': 'AI-निर्मित हालचाल विसंगती सारांश — {0}',
  'Synthesized narrative for the highest-anomaly taxpayer in the current filter set': 'सध्याच्या गाळणी संचातील सर्वाधिक-विसंगती करदात्यासाठी संश्लेषित वर्णन',
  'No anomaly-flagged e-way bill records available to summarise for the current filters.': 'सध्याच्या गाळण्यांसाठी सारांशित करण्याजोग्या विसंगती-चिन्हांकित ई-वे बिल नोंदी उपलब्ध नाहीत.',

  'E-Way ID': 'ई-वे बिल क्रमांक',
  'Route Type': 'मार्ग प्रकार',
  'Distance (km)': 'अंतर (किमी)',
  'Value (₹L)': 'मूल्य (₹ लाख)',
  'Cancelled?': 'रद्द?',
  Cancelled: 'रद्द',
  Active: 'सक्रिय',
  'Matched to Return?': 'विवरणपत्राशी जुळले?',
  Matched: 'जुळले',
  Unmatched: 'न जुळलेले',
  'Anomaly Flag': 'विसंगती चिन्ह',
  Flagged: 'चिन्हांकित',
  'View Taxpayer': 'करदाता पहा',
  'Intra-State': 'राज्यांतर्गत',
  'Inter-State': 'आंतरराज्य',

  '{0} ({1}) generated e-way bills valued at ₹{2} L across {3} movement record(s) in the {4} district, of which {5} were not matched to filed returns.':
    '{0} ({1}) यांनी {4} जिल्ह्यात {3} हालचाल नोंदींमध्ये ₹{2} लाख मूल्याची ई-वे बिले तयार केली, त्यापैकी {5} दाखल विवरणपत्राशी जुळल्या नाहीत.',
  'The highest-value flagged movement (₹{0} L, {1}, {2} km, vehicle {3}) shows a pattern inconsistent with declared outward supply, suggesting possible under-reporting of turnover or fictitious movement.':
    'सर्वाधिक-मूल्याची चिन्हांकित हालचाल (₹{0} लाख, {1}, {2} किमी, वाहन {3}) घोषित बाह्य पुरवठ्याशी विसंगत नमुना दर्शवते, जी उलाढालीचे संभाव्य अल्प-अहवालीकरण किंवा काल्पनिक हालचाल सुचवते.',
  'Current taxpayer risk rating: {0} ({1}/100). Sector: {2}.': 'सध्याचे करदाता जोखीम मानांकन: {0} ({1}/100). क्षेत्र: {2}.',
  'Taxpayer risk profile unavailable for this record.': 'या नोंदीसाठी करदाता जोखीम प्रोफाइल उपलब्ध नाही.',

  'E-Way Bill generation log': 'ई-वे बिल निर्मिती नोंदवही',
  'Return filing match status': 'विवरणपत्र भरणा जुळणी स्थिती',
  'Route and distance pattern': 'मार्ग व अंतर नमुना',
  'Vehicle movement records': 'वाहन हालचाल नोंदी',
  'This narrative is a system-generated pattern observation based on e-way bill and return-matching data. It is not evidence of tax evasion and does not constitute an adverse finding. Verification by an authorised officer is mandatory before any action.':
    'हे वर्णन ई-वे बिल व विवरणपत्र-जुळणी माहितीवर आधारित प्रणाली-निर्मित नमुना निरीक्षण आहे. हा करचुकवेगिरीचा पुरावा नाही आणि प्रतिकूल निष्कर्ष ठरत नाही. कोणतीही कृती करण्यापूर्वी प्राधिकृत अधिकाऱ्याची पडताळणी अनिवार्य आहे.',

  /* == Refund Risk Intelligence ============================================ */
  'Fraud & Risk · Refund Scrutiny': 'फसवणूक व जोखीम · परतावा तपासणी',
  'Risk-ranked refund claim scrutiny — combining refund-to-turnover intensity, export linkage and taxpayer risk profile to prioritise officer review before sanction.':
    'जोखीम-क्रमांकित परतावा दावा तपासणी — मंजुरीपूर्वी अधिकारी पुनरावलोकनास प्राधान्य देण्यासाठी परतावा-ते-उलाढाल तीव्रता, निर्यात संबंध व करदाता जोखीम प्रोफाइल यांची सांगड.',

  'Showing cases assigned to you —': 'आपल्याला नेमून दिलेली प्रकरणे दाखवत आहे —',
  '({0} of {1} statewide)': '(राज्यव्यापी {1} पैकी {0})',
  'Showing all {0} refund cases statewide — role-based access allows this for your account':
    'राज्यभरातील सर्व {0} परतावा प्रकरणे दाखवत आहे — आपल्या खात्यासाठी भूमिका-आधारित प्रवेशामुळे हे शक्य आहे',
  'View all statewide cases': 'सर्व राज्यव्यापी प्रकरणे पहा',
  'Back to my assigned cases': 'माझ्या नेमून दिलेल्या प्रकरणांकडे परत जा',

  'Total Refund Claims Value': 'एकूण परतावा दाव्यांचे मूल्य',
  'High-Risk Refunds': 'उच्च-जोखीम परतावे',
  'High / Critical': 'उच्च / अत्यंत गंभीर',
  'Avg. Refund-to-Turnover': 'सरासरी परतावा-ते-उलाढाल',
  'High-Value Claim Pattern': 'उच्च-मूल्य दावा नमुना',
  'claims > ₹10L (proxy)': 'दावे > ₹१० लाख (अंदाजे)',

  'Refund Claims by Sector': 'क्षेत्रानुसार परतावा दावे',
  'Total claimed amount (₹ Lakh) grouped by sector': 'क्षेत्रानुसार गटबद्ध एकूण दावा रक्कम (₹ लाख)',
  'No refund cases match the current filters.': 'सध्याच्या गाळण्यांशी जुळणारी कोणतीही परतावा प्रकरणे नाहीत.',
  'Refund-to-Turnover Ratio Distribution': 'परतावा-ते-उलाढाल गुणोत्तर वितरण',
  'Number of claims by refund-to-turnover band': 'परतावा-ते-उलाढाल पट्ट्यानुसार दाव्यांची संख्या',

  'Refund Case Register': 'परतावा प्रकरण नोंदवही',
  'Filterable via global district / sector / risk filters and free-text search':
    'सर्वसाधारण जिल्हा / क्षेत्र / जोखीम गाळण्या आणि मुक्त-मजकूर शोधाद्वारे गाळता येण्याजोगे',

  'Refund ID': 'परतावा क्रमांक',
  'Claimed Amount': 'दावा रक्कम',
  'Refund/Turnover %': 'परतावा/उलाढाल %',
  'Export Linked?': 'निर्यात संबंधित?',
  Risk: 'जोखीम',
  Status: 'स्थिती',
  'Assigned Officer': 'नेमून दिलेला अधिकारी',
  Review: 'पुनरावलोकन करा',

  'Low Risk': 'कमी जोखीम',
  'Needs Officer Review': 'अधिकारी पुनरावलोकन आवश्यक',
  'Escalate for Scrutiny': 'तपासणीसाठी उन्नत करा',

  'Refund Case Review — {0}': 'परतावा प्रकरण पुनरावलोकन — {0}',
  'Claim Details': 'दाव्याचा तपशील',
  'Refund / Turnover': 'परतावा / उलाढाल',
  'Filed On': 'दाखल दिनांक',
  'Export Linked': 'निर्यात संबंधित',
  'View Taxpayer 360': 'करदाता ३६० पहा',
  'Taxpayer profile unavailable for risk indicators.': 'जोखीम निर्देशकांसाठी करदाता प्रोफाइल उपलब्ध नाही.',

  'Generate Refund Verification Checklist': 'परतावा पडताळणी तपासणी यादी तयार करा',
  'Workflow Action': 'कार्यप्रवाह कृती',
  'Select a status, then confirm review to apply it — this mirrors the same maker-checker step used in Audit & Scrutiny.':
    'स्थिती निवडा, नंतर ती लागू करण्यासाठी पुनरावलोकनाची पुष्टी करा — हे लेखापरीक्षा व तपासणीत वापरल्या जाणाऱ्या त्याच निर्माता-पडताळणी पायरीसारखे आहे.',
  'Mark Low Risk': 'कमी जोखीम म्हणून चिन्हांकित करा',
  'I confirm officer review is complete — risk indicators and supporting data for this refund case have been examined, and I am setting status to':
    'मी अधिकारी पुनरावलोकन पूर्ण झाल्याची पुष्टी करतो/करते — या परतावा प्रकरणाचे जोखीम निर्देशक व सहाय्यक माहितीची तपासणी करण्यात आली आहे, आणि मी स्थिती याप्रमाणे निश्चित करत आहे',
  'Apply Status Change': 'स्थिती बदल लागू करा',
  'By design, this system provides no auto-reject action. Refund claims can only be routed for officer review, escalated for scrutiny, or marked low risk — final sanction or rejection decisions remain exclusively with the authorised Refund Officer under statutory process.':
    'रचनेनुसार, या प्रणालीत कोणतीही स्वयंचलित-नामंजुरी कृती नाही. परतावा दावे केवळ अधिकारी पुनरावलोकनासाठी पाठवले, तपासणीसाठी उन्नत केले किंवा कमी जोखीम म्हणून चिन्हांकित केले जाऊ शकतात — अंतिम मंजुरी किंवा नामंजुरीचे निर्णय वैधानिक प्रक्रियेनुसार केवळ प्राधिकृत परतावा अधिकाऱ्याकडेच राहतात.'
})
