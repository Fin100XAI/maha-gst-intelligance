import { registerMessages } from '../../locale.js'

/* ---------------------------------------------------------------------------
 * REVENUE INTELLIGENCE + SECTOR INTELLIGENCE CATALOGUE
 *
 * Hand-written Marathi for every string on the Revenue Intelligence
 * (`src/modules/RevenueIntelligence.jsx`) and Sector Intelligence
 * (`src/modules/SectorIntelligence.jsx`) modules that is not already covered
 * by `../shell.js` (module titles, "Revenue Assurance", "Benchmarking",
 * district/sector/risk-level/filing-status option labels, etc. — those are
 * reused verbatim via the shared shell catalogue).
 * ------------------------------------------------------------------------- */

registerMessages('mr', {
  /* == Shared table/column vocabulary ====================================== */
  GSTIN: 'GSTIN',
  'Trade Name': 'व्यापार नाव',
  District: 'जिल्हा',
  Sector: 'क्षेत्र',
  Turnover: 'उलाढाल',
  'Tax Paid': 'भरलेला कर',
  'Revenue Drop %': 'महसूल घट %',
  Risk: 'जोखीम',
  View: 'पहा',
  Taxpayer: 'करदाता',
  'Filing Status': 'विवरणपत्र स्थिती',
  'of {0}': '{0} पैकी',

  /* == Revenue Intelligence — header ======================================= */
  'Statewide revenue assurance engine — tracks collection performance against target, surfaces leakage indicators and forecasts near-term risk to state GST revenue.':
    'राज्यव्यापी महसूल हमी यंत्रणा — उद्दिष्टाच्या तुलनेत वसुली कामगिरीचा मागोवा घेते, गळतीचे निर्देशक दर्शवते आणि राज्य GST महसुलावरील निकटकालीन जोखमीचा अंदाज वर्तवते.',

  /* == Revenue Intelligence — KPI row ====================================== */
  'Total Revenue Monitored': 'निरीक्षित एकूण महसूल',
  'Revenue Gap vs Target': 'उद्दिष्टाच्या तुलनेत महसूल तफावत',
  'vs cumulative target': 'संचयी उद्दिष्टाच्या तुलनेत',
  'Districts in Deficit': 'तूट असलेले जिल्हे',
  'Sectors with Tax Decline': 'कर घट असलेली क्षेत्रे',

  /* == Revenue Intelligence — Monthly trend chart ========================== */
  'Monthly Revenue Trend': 'मासिक महसूल कल',
  'State GST collection — target vs actual (₹ Cr) — {0}': 'राज्य GST वसुली — उद्दिष्ट वि. प्रत्यक्ष (₹ कोटी) — {0}',
  'State GST collection — target vs actual (₹ Cr) — {0} · statewide trend, not filtered by district/division':
    'राज्य GST वसुली — उद्दिष्ट वि. प्रत्यक्ष (₹ कोटी) — {0} · राज्यव्यापी कल, जिल्हा/विभागानुसार फिल्टर केलेला नाही',
  'Target (₹ Cr)': 'उद्दिष्ट (₹ कोटी)',
  'Actual (₹ Cr)': 'प्रत्यक्ष (₹ कोटी)',

  /* == Revenue Intelligence — district / sector bar charts ================= */
  'District-Wise Revenue Collection': 'जिल्हानिहाय महसूल वसुली',
  'Actual collection by district (₹ Cr) — respects global filters': 'जिल्हानिहाय प्रत्यक्ष वसुली (₹ कोटी) — जागतिक गाळण्यांनुसार',
  'Sector-Wise Revenue Performance': 'क्षेत्रनिहाय महसूल कामगिरी',
  'Tax collected by sector (₹ Lakh) — respects global filters': 'क्षेत्रनिहाय जमा झालेला कर (₹ लाख) — जागतिक गाळण्यांनुसार',

  /* == Revenue Intelligence — forecast card ================================ */
  'Forecasted Revenue Risk — Next Quarter': 'अंदाजित महसूल जोखीम — पुढील तिमाही',
  'Forecast (Illustrative) — naive trend-based projection for next 3 months': 'अंदाज (दर्शक) — पुढील ३ महिन्यांसाठी साधा कल-आधारित प्रक्षेप',
  'Forecast (Illustrative)': 'अंदाज (दर्शक)',
  'Forecast values are an illustrative linear projection derived from the trailing 6-month collection trend. They are not an official revenue projection and must not be used for budgetary commitment.':
    'अंदाजित मूल्ये मागील ६ महिन्यांच्या वसुली कलावरून काढलेला दर्शक रेषीय प्रक्षेप आहेत. हा अधिकृत महसूल अंदाज नाही आणि अर्थसंकल्पीय बांधिलकीसाठी वापरता येणार नाही.',

  /* == Revenue Intelligence — leakage indicators =========================== */
  'Revenue Leakage Indicators': 'महसूल गळती निर्देशक',
  'Click an indicator to filter the abnormal-behaviour register below': 'खालील असामान्य-वर्तन नोंदवही गाळण्यासाठी एखाद्या निर्देशकावर क्लिक करा',
  'Active Filter': 'सक्रिय गाळणी',
  'Clear filter — show all abnormal-behaviour taxpayers': 'गाळणी साफ करा — सर्व असामान्य-वर्तन करदाते दाखवा',
  'Sudden Fall in Tax Payment': 'कर भरण्यात अचानक घट',
  'Turnover Growth, Tax Decline': 'उलाढाल वाढ, कर घट',
  'Nil-Return / Non-Filer Risk': 'शून्य-विवरणपत्र / विवरणपत्र न भरणारा जोखीम',
  'Late Filing Impact': 'विलंबित विवरणपत्राचा परिणाम',
  'Recommend desk review of last 3 filed returns and comparison against sector trend.':
    'गेल्या ३ भरलेल्या विवरणपत्रांचे डेस्क पुनरावलोकन आणि क्षेत्रीय कलाशी तुलना करण्याची शिफारस.',
  'Recommend reconciliation of turnover growth against tax payment trend; verify for possible under-reporting of taxable value.':
    'उलाढाल वाढीचा कर भरणा कलाशी ताळमेळ घालण्याची शिफारस; करपात्र मूल्याच्या संभाव्य कमी-अहवालाची पडताळणी करा.',
  'Recommend automated reminder escalation to Division Officer; consider provisional assessment if non-filing persists beyond statutory window.':
    'विभागीय अधिकाऱ्याकडे स्वयंचलित स्मरणपत्र उन्नयनाची शिफारस; वैधानिक मुदतीनंतरही विवरणपत्र न भरल्यास हंगामी आकारणीचा विचार करा.',
  'Recommend monitoring for chronic late-filing pattern; flag for compliance nudge and interest/late-fee computation review.':
    'सातत्याने विलंबित विवरणपत्र भरण्याच्या नमुन्याचे निरीक्षण करण्याची शिफारस; अनुपालन स्मरणासाठी व व्याज/विलंब-शुल्क आकारणी पुनरावलोकनासाठी चिन्हांकित करा.',

  /* == Revenue Intelligence — abnormal behaviour table ====================== */
  'Taxpayers with Abnormal Revenue Behaviour': 'असामान्य महसूल वर्तन असलेले करदाते',
  'Filtered by: {0}': 'यानुसार गाळलेले: {0}',
  'All revenue-leakage indicators (union)': 'सर्व महसूल-गळती निर्देशक (एकत्रित)',
  '{0} matched': '{0} जुळले',
  'Search GSTIN / trade name...': 'GSTIN / व्यापार नाव शोधा...',
  'Suggested Officer Action': 'सुचवलेली अधिकारी कृती',
  'No specific leakage indicator triggered — routine monitoring recommended.': 'कोणताही विशिष्ट गळती निर्देशक सक्रिय झालेला नाही — नियमित निरीक्षणाची शिफारस.',

  /* == Sector Intelligence — header ========================================= */
  "Cross-sector revenue, ITC and risk benchmarking across Maharashtra's priority industry sectors, with taxpayer-level drill-down.":
    'महाराष्ट्रातील प्राधान्य उद्योग क्षेत्रांमधील महसूल, ITC व जोखीम यांचे आंतर-क्षेत्रीय तुलनात्मक मूल्यमापन, करदाता-स्तरीय सखोल विश्लेषणासह.',

  /* == Sector Intelligence — KPI row ======================================== */
  'Sectors Tracked': 'निरीक्षित क्षेत्रे',
  'Highest-Risk Sector': 'सर्वाधिक-जोखीम क्षेत्र',
  '{0} high-risk': '{0} उच्च-जोखीम',
  'Highest Revenue Sector': 'सर्वाधिक महसूल क्षेत्र',
  'Widest ITC Deviation': 'सर्वाधिक ITC विचलन',
  'vs cross-sector median': 'आंतर-क्षेत्रीय मध्यकाच्या तुलनेत',

  /* == Sector Intelligence — charts ========================================= */
  'Tax Revenue Collected by Sector': 'क्षेत्रनिहाय जमा झालेला कर महसूल',
  'Sum of tax paid by taxpayers in each sector (₹ Lakh)': 'प्रत्येक क्षेत्रातील करदात्यांनी भरलेल्या कराची बेरीज (₹ लाख)',
  'Revenue (₹L)': 'महसूल (₹ लाख)',
  'Tax vs ITC vs Refund Ratio by Sector': 'क्षेत्रनिहाय कर वि. ITC वि. परतावा गुणोत्तर',
  'Benchmark ratios as % of turnover': 'उलाढालीच्या % म्हणून मानक गुणोत्तरे',
  'Tax Ratio %': 'कर गुणोत्तर %',
  'ITC Ratio %': 'ITC गुणोत्तर %',
  'Refund Ratio %': 'परतावा गुणोत्तर %',

  /* == Sector Intelligence — sector picker ================================= */
  'Sector Picker': 'क्षेत्र निवडक',
  'Select a sector for a detailed intelligence panel': 'सविस्तर बुद्धिमत्ता पटलासाठी एक क्षेत्र निवडा',

  /* == Sector Intelligence — sector profile panel =========================== */
  '{0} — Sector Profile': '{0} — क्षेत्र प्रोफाइल',
  'Revenue Contribution': 'महसूल योगदान',
  'Taxpayers in Sector': 'क्षेत्रातील करदाते',
  'Tax-to-Turnover': 'कर-ते-उलाढाल',
  'ITC Benchmark': 'ITC मानक',
  'Refund Benchmark': 'परतावा मानक',
  'Filing Compliance': 'विवरणपत्र अनुपालन',
  'Sector Anomaly Alert': 'क्षेत्र विसंगती इशारा',
  '{0} ITC ratio ({1}%) deviates': '{0} चे ITC गुणोत्तर ({1}%) विचलित होते',
  'from the cross-sector median ({0}%). {1} taxpayers in this sector currently carry a High or Critical risk rating.':
    'आंतर-क्षेत्रीय मध्यकापासून ({0}%). या क्षेत्रातील {1} करदाते सध्या उच्च किंवा अत्यंत गंभीर जोखीम मानांकन बाळगतात.',
  'Recommend sector-level scrutiny review': 'क्षेत्र-स्तरीय तपासणी पुनरावलोकनाची शिफारस',

  /* == Sector Intelligence — risk indicator rule labels (also used by the
     shared risk-scoring engine in src/data/risk.js; hand-translated here
     for their render site in this module) =================================== */
  'Circular Trading / Network Signal': 'वर्तुळाकार व्यापार / जाळे संकेत',
  'Non-Filing of Returns': 'विवरणपत्र न भरणे',
  'Abnormal ITC Spike': 'असामान्य ITC वाढ',
  'E-Way Bill vs Return Mismatch': 'ई-वे बिल वि. विवरणपत्र विसंगती',
  'High-Risk Supplier Linkage': 'उच्च-जोखीम पुरवठादार संबंध',
  'Sudden Decline in Tax Payment': 'कर भरण्यात अचानक घट',
  'High Refund-to-Turnover Ratio': 'उच्च परतावा-ते-उलाढाल गुणोत्तर',
  'New Registration, High Transaction Volume': 'नवीन नोंदणी, उच्च व्यवहार प्रमाण',
  'Deviation from Sector Benchmark': 'क्षेत्र मानकापासून विचलन',
  'Chronic Late Filing': 'सातत्याने विलंबित विवरणपत्र भरणे',

  /* == Sector Intelligence — top-triggered-indicators & top-taxpayers cards == */
  'Top Triggered Risk Indicators': 'सर्वाधिक सक्रिय झालेले जोखीम निर्देशक',
  'Aggregated across {0} taxpayers in sector': 'क्षेत्रातील {0} करदात्यांवर एकत्रित',
  'No risk rules triggered among taxpayers in this sector.': 'या क्षेत्रातील करदात्यांमध्ये कोणताही जोखीम नियम सक्रिय झालेला नाही.',
  'Top Taxpayers by Risk': 'जोखीमनुसार अग्रगण्य करदाते',
  'Respecting global district / risk filters': 'जागतिक जिल्हा / जोखीम गाळण्यांनुसार',
  'No taxpayers match the current global filters within this sector.': 'या क्षेत्रात सध्याच्या जागतिक गाळण्यांशी जुळणारा कोणताही करदाता नाही.',

  /* == Sector Intelligence — taxpayer register ============================== */
  '{0} — Taxpayer Register': '{0} — करदाता नोंदवही',
  'Searchable list of taxpayers in this sector (respects global filters)': 'या क्षेत्रातील करदात्यांची शोधण्यायोग्य यादी (जागतिक गाळण्यांनुसार)',
  'Search taxpayer / GSTIN...': 'करदाता / GSTIN शोधा...'
})
