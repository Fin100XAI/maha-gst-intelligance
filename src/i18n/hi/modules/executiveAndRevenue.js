import { registerMessages } from '../../locale.js'

/**
 * Hindi — Executive Command Center and Revenue Intelligence.
 *
 *   exposure        → जोखिम राशि
 *   realisation     → वसूली प्राप्ति
 *   leakage         → रिसाव
 *   composite       → संयुक्त
 *   heatmap         → तापचित्र
 *   ageing          → लंबन (how long a case has been open)
 *   forecast        → पूर्वानुमान
 *   register        → पंजी
 */
registerMessages('hi', {
  /* == Executive Command Center — header and official figures ============= */
  'Statewide Revenue & Risk Overview': 'राज्यव्यापी राजस्व एवं जोखिम अवलोकन',
  'Consolidated view of revenue performance, fraud risk exposure and compliance posture across Maharashtra for the Commissioner and senior leadership.':
    'आयुक्त एवं वरिष्ठ नेतृत्व हेतु महाराष्ट्र भर के राजस्व निष्पादन, कपट जोखिम राशि और अनुपालन स्थिति का समेकित दृश्य।',
  'Generate Commissioner Brief': 'आयुक्त टिप्पणी तैयार करें',
  'Official figures': 'आधिकारिक आँकड़े',
  'Maharashtra has {0} registered SGST dealers (as at 1 April 2025). This demonstration models {1}. The cards below are generated data, not departmental collection figures.':
    'महाराष्ट्र में {0} पंजीकृत SGST व्यापारी हैं (1 अप्रैल 2025 तक)। यह प्रदर्शन {1} का प्रारूप प्रस्तुत करता है। नीचे दिए कार्ड निर्मित आँकड़े हैं, विभागीय संग्रह के आँकड़े नहीं।',
  'View sources': 'स्रोत देखें',

  /* == Executive Command Center — tiles =================================== */
  'GST Revenue Monitored': 'निगरानी में GST राजस्व',
  'High-Risk Exposure': 'उच्च जोखिम राशि',
  'ITC Risk Cases': 'ITC जोखिम प्रकरण',
  'Refund Cases Under Review': 'समीक्षाधीन प्रतिदाय प्रकरण',
  'Audit Recovery Pipeline': 'लेखापरीक्षा वसूली शृंखला',
  'Compliance Alerts (Open)': 'अनुपालन सूचनाएँ (खुली)',

  /* == Executive Command Center — health index =========================== */
  'Revenue & Compliance Health Index': 'राजस्व एवं अनुपालन स्वास्थ्य सूचकांक',
  'Weighted composite across six indicators — the single number leadership tracks period to period':
    'छह संकेतकों का भारित संयुक्त मान — वह एक आँकड़ा जिसे नेतृत्व अवधि-दर-अवधि देखता है',
  'Composite score': 'संयुक्त अंक',
  Component: 'घटक',
  Wt: 'भार',
  Score: 'अंक',
  'Contrib.': 'योगदान',

  /* == Executive Command Center — distribution and heatmap =============== */
  'Taxpayer Risk Distribution': 'करदाता जोखिम वितरण',
  '{0} taxpayers matching current filters': 'वर्तमान फ़िल्टर से मेल खाते {0} करदाता',
  '{0} taxpayers monitored statewide': 'राज्यभर में {0} करदाता निगरानी में',
  'District Risk Heatmap': 'जिला जोखिम तापचित्र',
  'Shaded by count of High/Critical-risk taxpayers — click a district for detail':
    'उच्च/अत्यंत गंभीर जोखिम वाले करदाताओं की संख्या के अनुसार छायांकित — विवरण हेतु किसी जिले पर क्लिक करें',
  'Filtered view active': 'फ़िल्टर किया दृश्य सक्रिय',
  'high/critical taxpayers': 'उच्च/अत्यंत गंभीर करदाता',
  'Gap:': 'अंतर:',

  /* == Executive Command Center — filing and risk entities ================ */
  'Filing Behaviour Snapshot': 'विवरणी व्यवहार का चित्र',
  'Filer status — matching current filters': 'विवरणी स्थिति — वर्तमान फ़िल्टर से मेल खाते',
  'Statewide filer status': 'राज्यव्यापी विवरणी स्थिति',
  'Non-Filers': 'विवरणी न भरने वाले',
  '{0}% of taxpayer base': 'करदाता आधार का {0}%',
  'Late Filers': 'विलंब से विवरणी भरने वाले',
  'Critical Risk Entities': 'अत्यंत गंभीर जोखिम इकाइयाँ',
  'Requires immediate officer attention': 'अधिकारी के तत्काल ध्यान की आवश्यकता',
  'High Risk Entities': 'उच्च जोखिम इकाइयाँ',
  'Prioritised for scrutiny / audit': 'संवीक्षा / लेखापरीक्षा हेतु प्राथमिकता',
  'Matters Requiring Attention': 'ध्यान देने योग्य विषय',
  '{0} open': '{0} खुले',
  'No open high-risk alerts.': 'कोई खुली उच्च जोखिम सूचना नहीं।',

  /* == Executive Command Center — revenue and pipeline ==================== */
  'Revenue & Finance': 'राजस्व एवं वित्त',
  'Collection realisation against target, and exposure locked in non-filing':
    'लक्ष्य के सापेक्ष वसूली प्राप्ति, और विवरणी न भरने में फँसी जोखिम राशि',
  'Revenue Realisation': 'राजस्व वसूली प्राप्ति',
  '₹{0} Cr collected of ₹{1} Cr target ({2})': '₹{1} करोड़ के लक्ष्य में से ₹{0} करोड़ वसूल ({2})',
  'Est. Exposure — Non-Filers': 'अनुमानित जोखिम राशि — विवरणी न भरने वाले',
  'Audit & Enforcement Pipeline': 'लेखापरीक्षा एवं प्रवर्तन शृंखला',
  '{0} cases matching filters': 'फ़िल्टर से मेल खाते {0} प्रकरण',
  '{0} cases statewide': 'राज्यभर में {0} प्रकरण',
  live: 'सजीव',
  'Sanctioned Exposure': 'मंजूर जोखिम राशि',
  'Delayed (>180d)': 'विलंबित (>180 दि.)',
  'Highest-Risk Cases': 'सर्वाधिक जोखिम वाले प्रकरण',
  'Top 10 Highest-Risk Taxpayers': 'सर्वाधिक जोखिम वाले शीर्ष 10 करदाता',
  'Risk ranking within the current filtered view — click a row for the full Taxpayer 360 profile':
    'वर्तमान फ़िल्टर किए दृश्य में जोखिम क्रम — पूर्ण करदाता 360 विवरण हेतु किसी पंक्ति पर क्लिक करें',
  'Statewide risk ranking — click a row for the full Taxpayer 360 profile':
    'राज्यव्यापी जोखिम क्रम — पूर्ण करदाता 360 विवरण हेतु किसी पंक्ति पर क्लिक करें',

  /* == Executive Command Center — the brief =============================== */
  'Commissioner Daily Brief': 'आयुक्त दैनिक टिप्पणी',
  'Governed AI layer — advisory only. Every finding below states its evidence and confidence.':
    'नियंत्रित AI स्तर — केवल सलाहकारी। नीचे दिया प्रत्येक निष्कर्ष अपना साक्ष्य और विश्वास स्पष्ट बताता है।',
  Generate: 'तैयार करें',
  'No brief generated yet': 'अभी कोई टिप्पणी तैयार नहीं',
  'Generate an executive brief to synthesise the state\'s current revenue and risk position, with evidence and confidence stated for every finding.':
    'राज्य की वर्तमान राजस्व एवं जोखिम स्थिति का सार प्रस्तुत करने हेतु कार्यकारी टिप्पणी तैयार करें, जिसमें प्रत्येक निष्कर्ष का साक्ष्य और विश्वास स्पष्ट हो।',
  'Target Collection': 'लक्ष्य वसूली',
  'Actual Collection': 'वास्तविक वसूली',
  'Collection Gap': 'वसूली अंतर',
  'High/Critical Risk Taxpayers': 'उच्च/अत्यंत गंभीर जोखिम करदाता',
  'Audit Recovery': 'लेखापरीक्षा वसूली',
  'Officer Workload Index': 'अधिकारी कार्यभार सूचकांक',
  'Avg. Case Ageing': 'औसत प्रकरण लंबन',

  /* == Revenue Intelligence =============================================== */
  'Revenue Assurance': 'राजस्व आश्वासन',
  'Statewide revenue assurance engine — tracks collection performance against target, surfaces leakage indicators and forecasts near-term risk to state GST revenue.':
    'राज्यव्यापी राजस्व आश्वासन यंत्र — लक्ष्य के सापेक्ष वसूली निष्पादन पर दृष्टि रखता है, रिसाव के संकेतक सामने लाता है और राज्य GST राजस्व पर निकट भविष्य के जोखिम का पूर्वानुमान देता है।',
  GSTIN: 'GSTIN',
  'Trade Name': 'व्यापारिक नाम',
  Turnover: 'कारोबार',
  'Revenue Drop %': 'राजस्व गिरावट %',
  View: 'देखें',
  'Total Revenue Monitored': 'निगरानी में कुल राजस्व',
  'Revenue Gap vs Target': 'लक्ष्य के सापेक्ष राजस्व अंतर',
  'vs cumulative target': 'संचयी लक्ष्य के सापेक्ष',
  'Districts in Deficit': 'घाटे वाले जिले',
  'of {0}': '{0} में से',
  'Sectors with Tax Decline': 'कर में गिरावट वाले क्षेत्र',
  'Monthly Revenue Trend': 'मासिक राजस्व प्रवृत्ति',
  'State GST collection — target vs actual (₹ Cr) — {0} · statewide trend, not filtered by district/division':
    'राज्य GST वसूली — लक्ष्य बनाम वास्तविक (₹ करोड़) — {0} · राज्यव्यापी प्रवृत्ति, जिला/विभाग से फ़िल्टर नहीं',
  'State GST collection — target vs actual (₹ Cr) — {0}':
    'राज्य GST वसूली — लक्ष्य बनाम वास्तविक (₹ करोड़) — {0}',
  'Target (₹ Cr)': 'लक्ष्य (₹ करोड़)',
  'Actual (₹ Cr)': 'वास्तविक (₹ करोड़)',
  'District-Wise Revenue Collection': 'जिलावार राजस्व वसूली',
  'Actual collection by district (₹ Cr) — respects global filters':
    'जिलावार वास्तविक वसूली (₹ करोड़) — वैश्विक फ़िल्टर का पालन करती है',
  'Sector-Wise Revenue Performance': 'क्षेत्रवार राजस्व निष्पादन',
  'Tax collected by sector (₹ Lakh) — respects global filters':
    'क्षेत्रवार वसूला गया कर (₹ लाख) — वैश्विक फ़िल्टर का पालन करता है',
  'Forecasted Revenue Risk — Next Quarter': 'पूर्वानुमानित राजस्व जोखिम — अगली तिमाही',
  'Forecast (Illustrative) — naive trend-based projection for next 3 months':
    'पूर्वानुमान (दृष्टांत) — अगले 3 माह हेतु सरल प्रवृत्ति-आधारित प्रक्षेपण',
  'Forecast (Illustrative)': 'पूर्वानुमान (दृष्टांत)',
  'Forecast values are an illustrative linear projection derived from the trailing 6-month collection trend. They are not an official revenue projection and must not be used for budgetary commitment.':
    'पूर्वानुमान मान पिछले 6 माह की वसूली प्रवृत्ति से निकाला गया दृष्टांत रैखिक प्रक्षेपण हैं। ये आधिकारिक राजस्व प्रक्षेपण नहीं हैं और बजटीय प्रतिबद्धता हेतु प्रयुक्त नहीं किए जाने चाहिए।',
  'Revenue Leakage Indicators': 'राजस्व रिसाव संकेतक',
  'Click an indicator to filter the abnormal-behaviour register below':
    'नीचे दी असामान्य-व्यवहार पंजी को फ़िल्टर करने हेतु किसी संकेतक पर क्लिक करें',
  'Active Filter': 'सक्रिय फ़िल्टर',
  'Clear filter — show all abnormal-behaviour taxpayers':
    'फ़िल्टर हटाएँ — असामान्य व्यवहार वाले सभी करदाता दिखाएँ',
  'Taxpayers with Abnormal Revenue Behaviour': 'असामान्य राजस्व व्यवहार वाले करदाता',
  'Filtered by: {0}': 'इससे फ़िल्टर किया: {0}',
  'All revenue-leakage indicators (union)': 'सभी राजस्व-रिसाव संकेतक (संघ)',
  '{0} matched': '{0} मेल खाए',
  'Search GSTIN / trade name...': 'GSTIN / व्यापारिक नाम खोजें...',
  'Suggested Officer Action': 'सुझाई गई अधिकारी कार्रवाई',
  'No specific leakage indicator triggered — routine monitoring recommended.':
    'कोई विशिष्ट रिसाव संकेतक लागू नहीं हुआ — सामान्य निगरानी की सिफारिश।'
})
