import { registerMessages } from '../../locale.js'

/* ---------------------------------------------------------------------------
 * EXECUTIVE COMMAND CENTER CATALOGUE
 *
 * Hand-written Marathi for every string in src/modules/ExecutiveCommandCenter.jsx
 * that is not already covered by the shell catalogue (../shell.js) — the
 * Commissioner-facing statewide revenue and risk overview module.
 * ------------------------------------------------------------------------- */

registerMessages('mr', {
  /* == Hero ================================================================= */
  'Government of Maharashtra · GST Department': 'महाराष्ट्र शासन · GST विभाग',
  'Generate Commissioner Brief': 'आयुक्त माहितीपत्र तयार करा',

  /* == Section header ======================================================= */
  'Statewide Revenue & Risk Overview': 'राज्यव्यापी महसूल व जोखीम आढावा',
  'Consolidated view of revenue performance, fraud risk exposure and compliance posture across Maharashtra for the Commissioner and senior leadership.':
    'आयुक्त व वरिष्ठ नेतृत्वासाठी संपूर्ण महाराष्ट्रातील महसूल कामगिरी, फसवणूक जोखीम व अनुपालन स्थितीचा एकत्रित आढावा.',

  /* == Common units / recurring column & label vocabulary =================== */
  '₹ Cr': '₹ कोटी',
  Taxpayer: 'करदाता',
  Taxpayers: 'करदाते',
  District: 'जिल्हा',
  Division: 'विभाग',
  Sector: 'क्षेत्र',
  Exposure: 'जोखीम रक्कम',
  Risk: 'जोखीम',
  Month: 'महिना',
  'Target (₹ Cr)': 'उद्दिष्ट (₹ कोटी)',
  'Actual (₹ Cr)': 'प्रत्यक्ष (₹ कोटी)',
  Variance: 'फरक',
  'Total Registered': 'एकूण नोंदणीकृत',
  'New Registrations': 'नवीन नोंदणी',
  'Regular Filers': 'नियमित विवरणपत्र भरणारे',
  'Late Filers': 'विलंबित विवरणपत्र भरणारे',
  'Non-Filers': 'विवरणपत्र न भरणारे',
  'Gap %': 'तफावत %',
  'Audit Recovery (₹ Cr)': 'लेखापरीक्षा वसुली (₹ कोटी)',
  'Revenue (₹ Lakh)': 'महसूल (₹ लाख)',
  'High-Risk Count': 'उच्च-जोखीम संख्या',
  'Gap:': 'तफावत:',

  /* == KPI row =============================================================== */
  'High-Risk Exposure': 'उच्च-जोखीम रक्कम',
  'ITC Risk Cases': 'ITC जोखीम प्रकरणे',
  'Refund Cases Under Review': 'पुनरावलोकनाधीन परतावा प्रकरणे',
  'Audit Recovery Pipeline': 'लेखापरीक्षा वसुली प्रक्रिया',
  'Compliance Alerts (Open)': 'अनुपालन इशारे (खुले)',

  /* == Revenue & Compliance Health Index ==================================== */
  'Revenue & Compliance Health Index': 'महसूल व अनुपालन स्वास्थ्य निर्देशांक',
  'Weighted composite across six indicators — the single number leadership tracks period to period':
    'सहा निर्देशकांवर आधारित भारित संयुक्त गुण — नेतृत्व कालावधीनुसार मागोवा घेणारी एकमेव संख्या',
  'Composite score': 'संयुक्त गुण',
  Component: 'घटक',
  Wt: 'भार',
  Score: 'गुण',
  'Contrib.': 'योगदान',
  'Filing Compliance': 'विवरणपत्र अनुपालन',
  'Revenue Realisation': 'महसूल प्राप्ती',
  'ITC Risk Containment': 'ITC जोखीम नियंत्रण',
  'Refund Risk Containment': 'परतावा जोखीम नियंत्रण',
  'Audit Closure Rate': 'लेखापरीक्षा निपटारा दर',
  'Litigation Position': 'खटला स्थिती',

  /* == Statewide Statistics panel ============================================ */
  'Statewide Statistics': 'राज्यव्यापी सांख्यिकी',
  "One consolidated statistics panel — switch views the way the department's own public Statistics page does":
    'एक एकत्रित सांख्यिकी पटल — विभागाच्या स्वतःच्या सार्वजनिक सांख्यिकी पानाप्रमाणे दृश्ये बदला',
  '{0} records': '{0} नोंदी',
  'Search this view...': 'हे दृश्य शोधा...',
  'Revenue Collection': 'महसूल वसुली',
  'Registered Taxpayers': 'नोंदणीकृत करदाते',
  'District-wise Revenue': 'जिल्हानिहाय महसूल',
  'Sector-wise Collection': 'क्षेत्रनिहाय वसुली',

  /* == Revenue trend & risk distribution ===================================== */
  'State Revenue Trend — Target vs Actual': 'राज्य महसूल कल — उद्दिष्ट वि. प्रत्यक्ष',
  '{0}-month collection performance (₹ Cr) — {1}': '{0}-महिन्यांची वसुली कामगिरी (₹ कोटी) — {1}',
  'Taxpayer Risk Distribution': 'करदाता जोखीम वितरण',
  '{0} taxpayers matching current filters': 'सध्याच्या गाळण्यांनुसार {0} करदाते',
  '{0} taxpayers monitored statewide': 'राज्यव्यापी निरीक्षित {0} करदाते',

  /* == District heatmap ======================================================= */
  'District Risk Heatmap': 'जिल्हा जोखीम उष्मा नकाशा',
  'Shaded by count of High/Critical-risk taxpayers — click a district for detail':
    'उच्च/अत्यंत गंभीर-जोखीम करदात्यांच्या संख्येनुसार छटा — तपशीलासाठी जिल्ह्यावर क्लिक करा',
  'Filtered view active': 'गाळणी लागू असलेले दृश्य',
  'high/critical taxpayers': 'उच्च/अत्यंत गंभीर करदाते',

  /* == Filing Behaviour Snapshot =============================================== */
  'Filing Behaviour Snapshot': 'विवरणपत्र भरणा वर्तन झलक',
  'Filer status — matching current filters': 'भरणा स्थिती — सध्याच्या गाळण्यांनुसार',
  'Statewide filer status': 'राज्यव्यापी भरणा स्थिती',
  '{0}% of taxpayer base': 'एकूण करदात्यांपैकी {0}%',
  'Critical Risk Entities': 'अत्यंत गंभीर जोखीम संस्था',
  'High Risk Entities': 'उच्च जोखीम संस्था',
  'Requires immediate officer attention': 'तात्काळ अधिकारी लक्ष आवश्यक',
  'Prioritised for scrutiny / audit': 'तपासणी/लेखापरीक्षेसाठी प्राधान्यक्रमित',

  /* == Sector revenue & Matters Requiring Attention ============================ */
  'Sector-Wise Revenue Contribution': 'क्षेत्रनिहाय महसूल योगदान',
  'Tax collected by sector (₹ Lakh)': 'क्षेत्रनिहाय वसूल कर (₹ लाख)',
  'Matters Requiring Attention': 'लक्ष आवश्यक असलेली प्रकरणे',
  '{0} open': '{0} खुले',
  'No open high-risk alerts.': 'कोणतेही खुले उच्च-जोखीम इशारे नाहीत.',

  /* == Revenue & Finance / Audit & Enforcement Pipeline ========================= */
  'Revenue & Finance': 'महसूल व वित्त',
  'Collection realisation against target, and exposure locked in non-filing':
    'उद्दिष्टाच्या तुलनेत वसुली प्राप्ती, आणि विवरणपत्र न भरण्यामुळे अडकलेली जोखीम रक्कम',
  '₹{0} Cr collected of ₹{1} Cr target ({2})': 'उद्दिष्ट ₹{1} कोटींपैकी ₹{0} कोटी वसूल ({2})',
  'Est. Exposure — Non-Filers': 'अंदाजित जोखीम रक्कम — विवरणपत्र न भरणारे',
  'Audit & Enforcement Pipeline': 'लेखापरीक्षा व अंमलबजावणी प्रक्रिया',
  '{0} cases matching filters': 'गाळण्यांनुसार जुळणारी {0} प्रकरणे',
  '{0} cases statewide': 'राज्यव्यापी {0} प्रकरणे',
  live: 'थेट',
  'Sanctioned Exposure': 'मंजूर जोखीम रक्कम',
  'Critical Risk': 'अत्यंत गंभीर जोखीम',
  'Delayed (>180d)': 'विलंबित (>१८० दिवस)',
  'Highest-Risk Cases': 'सर्वोच्च-जोखीम प्रकरणे',

  /* == Top risk table ============================================================ */
  'Top 10 Highest-Risk Taxpayers': 'शीर्ष १० सर्वोच्च-जोखीम करदाते',
  'Statewide risk ranking — click a row for the full Taxpayer 360 profile':
    'राज्यव्यापी जोखीम क्रमवारी — संपूर्ण करदाता ३६० प्रोफाइलसाठी पंक्तीवर क्लिक करा',

  /* == Commissioner Daily Brief =================================================== */
  'Commissioner Daily Brief': 'आयुक्त दैनंदिन माहितीपत्र',
  'Governed AI layer — advisory only. Every finding below states its evidence and confidence.':
    'नियंत्रित AI स्तर — केवळ सल्लागार. खालील प्रत्येक निष्कर्ष आपला पुरावा व विश्वासार्हता नमूद करतो.',
  Generate: 'तयार करा',
  'No brief generated yet': 'अद्याप कोणतेही माहितीपत्र तयार केलेले नाही',
  "Generate an executive brief to synthesise the state's current revenue and risk position, with evidence and confidence stated for every finding.":
    'राज्याच्या सध्याच्या महसूल व जोखीम स्थितीचे संश्लेषण करण्यासाठी कार्यकारी माहितीपत्र तयार करा, प्रत्येक निष्कर्षासाठी पुरावा व विश्वासार्हता नमूद करून.',

  /* == District detail modal ======================================================= */
  'Target Collection': 'उद्दिष्ट वसुली',
  'Actual Collection': 'प्रत्यक्ष वसुली',
  'Collection Gap': 'वसुली तफावत',
  'High/Critical Risk Taxpayers': 'उच्च/अत्यंत गंभीर जोखीम करदाते',
  'Audit Recovery': 'लेखापरीक्षा वसुली',
  'Officer Workload Index': 'अधिकारी कार्यभार निर्देशांक',
  'Avg. Case Ageing': 'सरासरी प्रकरण वयोमान',
  '{0} days': '{0} दिवस'
})
