import { registerMessages } from '../locale.js'

/* ---------------------------------------------------------------------------
 * SHARED UI COMPONENT CATALOGUE
 *
 * Every module-translation pass was scoped to its own module file — none of
 * them touched `src/components/ui/*` or `src/components/shared/*`, since
 * those are shared across all 15 modules. This file covers what those
 * components render on their own: risk badges, the data-table chrome,
 * export buttons, the AI-output panel frame, the score gauge, the
 * "why flagged" explainability panel, and the full taxpayer drilldown modal
 * (opened from nearly every module).
 * ------------------------------------------------------------------------- */

registerMessages('mr', {
  /* == RiskBadge / HumanReviewBadge ======================================== */
  'Human Review Required': 'मानवी पुनरावलोकन आवश्यक',

  /* == ExportBar ============================================================ */
  'Export PDF': 'PDF निर्यात करा',
  'Export Excel': 'Excel निर्यात करा',
  'Copy Briefing Note': 'माहितीपत्र प्रत करा',
  Exported: 'निर्यात केले',
  'Copy failed': 'प्रत अयशस्वी',

  /* == DataTable ============================================================= */
  'Search...': 'शोधा...',
  'No records match the current filters.': 'सध्याच्या गाळण्यांशी जुळणाऱ्या नोंदी नाहीत.',
  '{0} of {1} records': '{1} पैकी {0} नोंदी',
  'Page {0} of {1}': '{1} पैकी पृष्ठ {0}',
  Prev: 'मागील',
  Next: 'पुढील',

  /* == ScoreGauge ============================================================ */
  'of 100': '/ १००',
  'Composite score': 'संयुक्त गुण',
  Healthy: 'निरोगी',
  Degraded: 'क्षीण',

  /* == WhyFlaggedPanel ======================================================= */
  'Why flagged?': 'का चिन्हांकित केले?',
  'Confidence: {0}': 'विश्वासार्हता: {0}',
  'No risk rules triggered. Behaviour is within expected parameters for this taxpayer profile.':
    'कोणताही जोखीम नियम कार्यान्वित झाला नाही. या करदात्याच्या प्रोफाइलसाठी वर्तन अपेक्षित मर्यादेत आहे.',
  'Routine monitoring — no escalation required': 'नियमित देखरेख — वाढीची आवश्यकता नाही',
  'Very High': 'अत्यंत उच्च',
  Moderate: 'मध्यम',

  /* == Modal ================================================================= */
  Close: 'बंद करा',

  /* == AIOutputPanel / AIDisclaimer ========================================= */
  'AI Copilot — simulated output': 'AI सहवैमानिक — अनुरूपित निर्गत',
  'Evidence Used': 'वापरलेला पुरावा',
  'Informational only': 'केवळ माहितीसाठी',
  'AI does not take enforcement decisions. All outputs are advisory risk signals subject to authorised officer verification and approval.':
    'AI अंमलबजावणीचे निर्णय घेत नाही. सर्व निर्गत सल्लागार जोखीम संकेत आहेत, जे प्राधिकृत अधिकाऱ्याच्या पडताळणी व मान्यतेच्या अधीन आहेत.',

  /* == AI helper limitation notes (src/data/ai.js) ========================== */
  'AI-generated output is a decision-support draft based on available filing and transaction data. It does not constitute a legal finding, penalty, or enforcement action. Authorised officer verification and approval is mandatory before any action is taken.':
    'AI-निर्मित निर्गत उपलब्ध विवरणपत्र व व्यवहार माहितीवर आधारित निर्णय-सहाय्य मसुदा आहे. हा कायदेशीर निष्कर्ष, दंड किंवा अंमलबजावणी कारवाई नाही. कोणतीही कृती करण्यापूर्वी प्राधिकृत अधिकाऱ्याची पडताळणी व मान्यता अनिवार्य आहे.',
  'AI-generated output is a decision-support draft based on available filing and transaction data. It does not constitute a legal finding, penalty, or enforcement action. Authorised officer verification and approval is mandatory before any action is taken. The system does not auto-reject or auto-sanction any refund claim.':
    'AI-निर्मित निर्गत उपलब्ध विवरणपत्र व व्यवहार माहितीवर आधारित निर्णय-सहाय्य मसुदा आहे. हा कायदेशीर निष्कर्ष, दंड किंवा अंमलबजावणी कारवाई नाही. कोणतीही कृती करण्यापूर्वी प्राधिकृत अधिकाऱ्याची पडताळणी व मान्यता अनिवार्य आहे. प्रणाली कोणताही परतावा दावा स्वयंचलितपणे नामंजूर वा मंजूर करत नाही.',
  'Automated nudges are informational only. They do not constitute a legal notice and do not trigger any adverse action.':
    'स्वयंचलित स्मरणपत्रे केवळ माहितीसाठी आहेत. ती कायदेशीर नोटीस नाहीत आणि कोणतीही प्रतिकूल कारवाई सुरू करत नाहीत.',

  /* == TaxpayerDrilldownModal ================================================ */
  Overview: 'आढावा',
  'Filing & ITC': 'विवरणपत्र व ITC',
  'E-Way & Refund': 'ई-वे व परतावा',
  Network: 'जाळे',
  'Timeline & Notes': 'कालरेषा व टिपण्या',
  'AI Summary': 'AI सारांश',
  'Risk signal only': 'केवळ जोखीम संकेत',
  'Officer verification required': 'अधिकारी पडताळणी आवश्यक',
  'No automated adverse action': 'कोणतीही स्वयंचलित प्रतिकूल कारवाई नाही',
  Sector: 'क्षेत्र',
  'District / Division': 'जिल्हा / विभाग',
  Registered: 'नोंदणीकृत',
  Contact: 'संपर्क',
  Email: 'ईमेल',
  Address: 'पत्ता',
  'Monthly Turnover': 'मासिक उलाढाल',
  'Tax Paid': 'भरलेला कर',
  'ITC Claimed': 'दावा केलेले ITC',
  'Filing Status': 'विवरणपत्र स्थिती',
  'Audit Status': 'लेखापरीक्षा स्थिती',
  'Appeal Status': 'अपील स्थिती',
  'Tax Paid vs ITC Claimed (12 months)': 'भरलेला कर वि. दावा केलेले ITC (१२ महिने)',
  'Tax Paid (₹)': 'भरलेला कर (₹)',
  'ITC Claimed (₹)': 'दावा केलेले ITC (₹)',
  'ITC-to-Turnover': 'ITC-ते-उलाढाल',
  'Sector Benchmark ITC': 'क्षेत्र मानक ITC',
  Deviation: 'विचलन',
  'Refund Claim Trend (₹)': 'परतावा दावा कल (₹)',
  'Refund Claimed': 'दावा केलेला परतावा',
  'E-Way Bill Movement Value (₹)': 'ई-वे बिल हालचाल मूल्य (₹)',
  'E-Way Value': 'ई-वे मूल्य',
  'Linked Suppliers': 'जोडलेले पुरवठादार',
  'Linked Buyers': 'जोडलेले खरेदीदार',
  'Compliance Timeline': 'अनुपालन कालरेषा',
  'GST Registration granted': 'GST नोंदणी मंजूर',
  '{0} issued — status: {1}': '{0} जारी — स्थिती: {1}',
  'Current compliance history: {0}': 'सध्याचा अनुपालन इतिहास: {0}',
  'Officer Notes': 'अधिकारी टिपण्या',
  'Add an officer note...': 'अधिकारी टिपणी जोडा...',
  'Add Note': 'टिपणी जोडा',
  'Generated by Officer AI Copilot': 'अधिकारी AI सहवैमानिकाद्वारे तयार',

  /* == Notice status values (interpolated into TimelineItem) ================ */
  'Reply Awaited': 'उत्तराची प्रतीक्षा',
  'Reply Received': 'उत्तर प्राप्त',
  'Hearing Scheduled': 'सुनावणी नियोजित',
  'Order Issued': 'आदेश जारी',
  Escalated: 'वाढवलेले'
})
