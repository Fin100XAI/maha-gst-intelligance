import { registerMessages } from '../../locale.js'

/**
 * Hindi — ITC Risk Intelligence, E-Way Bill Intelligence, Refund Risk
 * Intelligence.
 *
 *   input tax credit  → ITC (kept in Latin — an officer reads it as a code)
 *   spike             → उछाल
 *   circular trading  → वर्तुलाकार व्यापार
 *   movement          → परिवहन
 *   under-reporting   → कम घोषित करना
 *   sanction          → मंजूरी
 *   maker-checker     → कर्ता-परीक्षक
 *   linkage           → संबंध
 *   band              → वर्ग
 */
registerMessages('hi', {
  /* == ITC Risk Intelligence ============================================== */
  'Fraud & Risk · ITC Intelligence': 'कपट एवं जोखिम · ITC इंटेलिजेंस',
  'Anomaly detection across input tax credit behaviour — abnormal spikes, high-risk supplier linkage, circular trading suspicion, e-way bill mismatch and sector deviation.':
    'इनपुट कर श्रेय व्यवहार में विसंगति की पहचान — असामान्य उछाल, उच्च जोखिम आपूर्तिकर्ता से संबंध, वर्तुलाकार व्यापार का संदेह, ई-वे बिल विसंगति और क्षेत्रीय विचलन।',
  'Total ITC Exposure (filtered)': 'कुल ITC जोखिम राशि (फ़िल्टर किया)',
  'High-Risk ITC Claims': 'उच्च जोखिम ITC दावे',
  'Avg. ITC-to-Turnover Ratio': 'औसत ITC-से-कारोबार अनुपात',
  'ITC Spike Alerts': 'ITC उछाल सूचनाएँ',
  'Average ITC-to-Turnover Ratio by Sector': 'क्षेत्रवार औसत ITC-से-कारोबार अनुपात',
  'Sector benchmark ratios with associated high-risk taxpayer counts.':
    'क्षेत्रीय मानक अनुपात, साथ में संबंधित उच्च जोखिम करदाताओं की संख्या।',
  'Bar height = average ITC-to-turnover ratio (%). Colour intensity = concentration of High/Critical risk taxpayers in that sector.':
    'स्तंभ की ऊँचाई = औसत ITC-से-कारोबार अनुपात (%)। रंग की गहराई = उस क्षेत्र में उच्च/अत्यंत गंभीर जोखिम करदाताओं का घनत्व।',
  'ITC Anomaly Categories': 'ITC विसंगति श्रेणियाँ',
  'Select a category to view matching taxpayer cases under the current global filters.':
    'वर्तमान वैश्विक फ़िल्टर के अंतर्गत मेल खाते करदाता प्रकरण देखने हेतु कोई श्रेणी चुनें।',
  'No taxpayers currently match this category under the active global filters.':
    'सक्रिय वैश्विक फ़िल्टर के अंतर्गत इस समय कोई करदाता इस श्रेणी से मेल नहीं खाता।',
  'Show More': 'और दिखाएँ',
  'Showing {0} of {1} matching cases': 'मेल खाते {1} प्रकरणों में से {0} दिखाए जा रहे हैं',
  'Est. Exposure': 'अनुमानित जोखिम राशि',
  'No individual rule detail available.': 'किसी एकल नियम का विवरण उपलब्ध नहीं।',
  'Review Required': 'समीक्षा आवश्यक',
  Routine: 'सामान्य',
  'Hide checklist': 'जाँच-सूची छिपाएँ',
  'Verification checklist': 'सत्यापन जाँच-सूची',

  /* == E-Way Bill Intelligence — header and tiles ========================= */
  'Fraud & Risk · Logistics Intelligence': 'कपट एवं जोखिम · माल परिवहन इंटेलिजेंस',
  'Movement-vs-filing intelligence: correlating declared e-way bill movement value against filed returns to surface logistics-linked under-reporting risk across Maharashtra.':
    'परिवहन बनाम विवरणी इंटेलिजेंस: घोषित ई-वे बिल परिवहन मूल्य का दाखिल विवरणियों से मिलान कर, महाराष्ट्र भर में माल परिवहन से जुड़े कम घोषित करने के जोखिम को सामने लाना।',
  'Total E-Way Bill Value': 'कुल ई-वे बिल मूल्य',
  '₹ Lakh': '₹ लाख',
  'High Movement, Low Filing': 'अधिक परिवहन, कम विवरणी',
  'records flagged': 'अभिलेख चिह्नित',
  'Cancellation Rate': 'रद्दीकरण दर',
  'Inter-State Long Haul': 'अंतर-राज्यीय लंबी दूरी',
  movements: 'परिवहन',

  /* == E-Way Bill Intelligence — charts and register ===================== */
  'E-Way Bill Value Trend': 'ई-वे बिल मूल्य प्रवृत्ति',
  'Total declared movement value across recent periods': 'हाल की अवधियों में कुल घोषित परिवहन मूल्य',
  'No e-way bill records match the current filters.': 'वर्तमान फ़िल्टर से कोई ई-वे बिल अभिलेख मेल नहीं खाता।',
  'District-Wise Logistics Risk': 'जिलावार माल परिवहन जोखिम',
  'Anomaly-flagged movements by district': 'जिलावार विसंगति-चिह्नित परिवहन',
  'No district data available for the current filters.': 'वर्तमान फ़िल्टर हेतु कोई जिला आँकड़ा उपलब्ध नहीं।',
  'Suspicious E-Way Bill Patterns': 'संदिग्ध ई-वे बिल प्रतिरूप',
  'Records with anomaly flags, cancellations, or no matching filed return':
    'ऐसे अभिलेख जिन पर विसंगति चिह्न हैं, जो रद्द हुए हैं, या जिनसे मेल खाती कोई दाखिल विवरणी नहीं',
  'Officer Review Required': 'अधिकारी समीक्षा आवश्यक',
  'No suspicious e-way bill patterns match the current filters.':
    'वर्तमान फ़िल्टर से कोई संदिग्ध ई-वे बिल प्रतिरूप मेल नहीं खाता।',
  'E-Way ID': 'ई-वे क्रमांक',
  'Route Type': 'मार्ग प्रकार',
  'Distance (km)': 'दूरी (कि.मी.)',
  'Value (₹L)': 'मूल्य (₹ लाख)',
  'Cancelled?': 'रद्द?',
  Cancelled: 'रद्द',
  Active: 'सक्रिय',
  'Matched to Return?': 'विवरणी से मेल?',
  Matched: 'मेल खाया',
  Unmatched: 'मेल नहीं खाया',
  'Anomaly Flag': 'विसंगति चिह्न',
  Flagged: 'चिह्नित',
  'View Taxpayer': 'करदाता देखें',

  /* == E-Way Bill Intelligence — the generated narrative ================== */
  'AI-Generated Movement Mismatch Summary': 'AI-निर्मित परिवहन विसंगति सारांश',
  'AI-Generated Movement Mismatch Summary — {0}': 'AI-निर्मित परिवहन विसंगति सारांश — {0}',
  'Synthesized narrative for the highest-anomaly taxpayer in the current filter set':
    'वर्तमान फ़िल्टर समुच्चय में सर्वाधिक विसंगति वाले करदाता हेतु संश्लेषित विवरण',
  'No anomaly-flagged e-way bill records available to summarise for the current filters.':
    'वर्तमान फ़िल्टर हेतु सारांश योग्य कोई विसंगति-चिह्नित ई-वे बिल अभिलेख उपलब्ध नहीं।',
  '{0} ({1}) generated e-way bills valued at ₹{2} L across {3} movement record(s) in the {4} district, of which {5} were not matched to filed returns.':
    '{0} ({1}) ने {4} जिले में {3} परिवहन अभिलेखों में ₹{2} लाख मूल्य के ई-वे बिल बनाए, जिनमें से {5} का दाखिल विवरणियों से मेल नहीं हुआ।',
  'The highest-value flagged movement (₹{0} L, {1}, {2} km, vehicle {3}) shows a pattern inconsistent with declared outward supply, suggesting possible under-reporting of turnover or fictitious movement.':
    'सर्वाधिक मूल्य वाला चिह्नित परिवहन (₹{0} लाख, {1}, {2} कि.मी., वाहन {3}) घोषित बहिर्गामी आपूर्ति से असंगत प्रतिरूप दर्शाता है, जिससे कारोबार कम घोषित करने अथवा काल्पनिक परिवहन की संभावना संकेतित होती है।',
  'Current taxpayer risk rating: {0} ({1}/100). Sector: {2}.':
    'वर्तमान करदाता जोखिम श्रेणी: {0} ({1}/100)। क्षेत्र: {2}।',
  'Taxpayer risk profile unavailable for this record.': 'इस अभिलेख हेतु करदाता जोखिम विवरण उपलब्ध नहीं।',
  'E-Way Bill generation log': 'ई-वे बिल निर्माण अभिलेख',
  'Return filing match status': 'विवरणी दाखिल मिलान स्थिति',
  'Route and distance pattern': 'मार्ग एवं दूरी प्रतिरूप',
  'Vehicle movement records': 'वाहन परिवहन अभिलेख',
  'This narrative is a system-generated pattern observation based on e-way bill and return-matching data. It is not evidence of tax evasion and does not constitute an adverse finding. Verification by an authorised officer is mandatory before any action.':
    'यह विवरण ई-वे बिल और विवरणी-मिलान आँकड़ों पर आधारित प्रणाली-निर्मित प्रतिरूप अवलोकन है। यह कर अपवंचन का साक्ष्य नहीं है और न ही कोई प्रतिकूल निष्कर्ष है। किसी भी कार्रवाई से पूर्व प्राधिकृत अधिकारी द्वारा सत्यापन अनिवार्य है।',

  /* == Refund Risk Intelligence =========================================== */
  'Fraud & Risk · Refund Scrutiny': 'कपट एवं जोखिम · प्रतिदाय संवीक्षा',
  'Risk-ranked refund claim scrutiny — combining refund-to-turnover intensity, export linkage and taxpayer risk profile to prioritise officer review before sanction.':
    'जोखिम-क्रम में प्रतिदाय दावों की संवीक्षा — प्रतिदाय-से-कारोबार तीव्रता, निर्यात संबंध और करदाता जोखिम विवरण को जोड़कर, मंजूरी से पूर्व अधिकारी समीक्षा को प्राथमिकता देना।',
  '({0} of your {1} cases match the current filters)':
    '(आपके {1} प्रकरणों में से {0} वर्तमान फ़िल्टर से मेल खाते हैं)',
  'Your role can access every refund case — showing {0} of {1} that match the current filters':
    'आपका पद प्रत्येक प्रतिदाय प्रकरण देख सकता है — वर्तमान फ़िल्टर से मेल खाते {1} में से {0} दिखाए जा रहे हैं',
  'Total Refund Claims Value': 'कुल प्रतिदाय दावा मूल्य',
  'High-Risk Refunds': 'उच्च जोखिम प्रतिदाय',
  'High / Critical': 'उच्च / अत्यंत गंभीर',
  'Avg. Refund-to-Turnover': 'औसत प्रतिदाय-से-कारोबार',
  'High-Value Claim Pattern': 'उच्च मूल्य दावा प्रतिरूप',
  'claims > ₹10L (proxy)': '₹10 लाख से अधिक के दावे (प्रातिनिधिक)',
  'Refund Claims by Sector': 'क्षेत्रवार प्रतिदाय दावे',
  'Total claimed amount (₹ Lakh) grouped by sector': 'क्षेत्रवार समूहबद्ध कुल दावाकृत राशि (₹ लाख)',
  'No refund cases match the current filters.': 'वर्तमान फ़िल्टर से कोई प्रतिदाय प्रकरण मेल नहीं खाता।',
  'Refund-to-Turnover Ratio Distribution': 'प्रतिदाय-से-कारोबार अनुपात वितरण',
  'Number of claims by refund-to-turnover band': 'प्रतिदाय-से-कारोबार वर्ग के अनुसार दावों की संख्या',
  'Refund Case Register': 'प्रतिदाय प्रकरण पंजी',
  'Filterable via global district / sector / risk filters and free-text search':
    'वैश्विक जिला / क्षेत्र / जोखिम फ़िल्टर और मुक्त-पाठ खोज से फ़िल्टर किया जा सकता है',
  'Refund ID': 'प्रतिदाय क्रमांक',
  'Claimed Amount': 'दावाकृत राशि',
  'Refund/Turnover %': 'प्रतिदाय/कारोबार %',
  'Export Linked?': 'निर्यात से संबंधित?',
  'Export-Linked': 'निर्यात-संबंधित',
  'Export Linked': 'निर्यात संबंधित',
  Domestic: 'घरेलू',
  Status: 'स्थिति',
  'Refund Case Review — {0}': 'प्रतिदाय प्रकरण समीक्षा — {0}',
  'Claim Details': 'दावा विवरण',
  'Refund / Turnover': 'प्रतिदाय / कारोबार',
  'Generate Refund Verification Checklist': 'प्रतिदाय सत्यापन जाँच-सूची तैयार करें',
  'Workflow Action': 'कार्यप्रवाह कार्रवाई',
  'Select a status, then confirm review to apply it — this mirrors the same maker-checker step used in Audit & Scrutiny.':
    'कोई स्थिति चुनें, फिर उसे लागू करने हेतु समीक्षा की पुष्टि करें — यह वही कर्ता-परीक्षक चरण है जो लेखापरीक्षा एवं संवीक्षा में प्रयुक्त होता है।',
  'Mark Low Risk': 'कम जोखिम अंकित करें',
  'I confirm officer review is complete — risk indicators and supporting data for this refund case have been examined, and I am setting status to':
    'मैं पुष्टि करता/करती हूँ कि अधिकारी समीक्षा पूर्ण है — इस प्रतिदाय प्रकरण के जोखिम संकेतक एवं समर्थक आँकड़े जाँचे जा चुके हैं, और मैं स्थिति निर्धारित कर रहा/रही हूँ',
  'Apply Status Change': 'स्थिति परिवर्तन लागू करें',
  'By design, this system provides no auto-reject action. Refund claims can only be routed for officer review, escalated for scrutiny, or marked low risk — final sanction or rejection decisions remain exclusively with the authorised Refund Officer under statutory process.':
    'रचना के अनुसार, इस प्रणाली में स्वतः अस्वीकृति की कोई कार्रवाई नहीं है। प्रतिदाय दावे केवल अधिकारी समीक्षा हेतु भेजे जा सकते हैं, संवीक्षा हेतु वरिष्ठ स्तर पर भेजे जा सकते हैं, या कम जोखिम अंकित किए जा सकते हैं — अंतिम मंजूरी अथवा अस्वीकृति के निर्णय सांविधिक प्रक्रिया के अंतर्गत केवल प्राधिकृत प्रतिदाय अधिकारी के पास ही रहते हैं।'
})
