import { registerMessages } from '../../locale.js'

/**
 * Hindi — District & Division Performance, Sector Intelligence, Compliance
 * Early Warning.
 *
 *   benchmark       → मानक
 *   deviation       → विचलन
 *   workload        → कार्यभार
 *   ageing          → लंबन
 *   drilldown       → विस्तृत विवरण
 *   outreach        → संपर्क
 *   early warning   → पूर्वसूचना
 *   feed            → प्रवाह
 *   MTD             → माह-प्रारंभ से
 */
registerMessages('hi', {
  /* == District & Division Performance =================================== */
  'Geographic governance view of revenue targets, risk concentration, officer workload and case ageing across Maharashtra\'s districts and divisions.':
    'महाराष्ट्र के जिलों एवं विभागों में राजस्व लक्ष्यों, जोखिम के घनत्व, अधिकारी कार्यभार और प्रकरण लंबन का भौगोलिक शासन दृश्य।',
  'Total Districts': 'कुल जिले',
  'Total Non-Filers': 'कुल विवरणी न भरने वाले',
  'Total Audit Recovery': 'कुल लेखापरीक्षा वसूली',
  'District Severity Heatmap': 'जिला गंभीरता तापचित्र',
  'Threshold-based shading — not a taxpayer risk score':
    'देहली-आधारित छायांकन — करदाता जोखिम अंक नहीं',
  'Risk Taxpayers': 'जोखिम करदाता',
  'Target Gap %': 'लक्ष्य अंतर %',
  'Target Gap': 'लक्ष्य अंतर',
  'District Performance Cards': 'जिला निष्पादन कार्ड',
  Actual: 'वास्तविक',
  Target: 'लक्ष्य',
  'Officer Workload': 'अधिकारी कार्यभार',
  'Case Ageing': 'प्रकरण लंबन',
  'District drilldown': 'जिला विस्तृत विवरण',
  'No districts match the current global filters.': 'वर्तमान वैश्विक फ़िल्टर से कोई जिला मेल नहीं खाता।',
  'Division Performance Ranking': 'विभाग निष्पादन क्रम',
  'Aggregated target vs actual, audit recovery and workload by division':
    'विभागवार समेकित लक्ष्य बनाम वास्तविक, लेखापरीक्षा वसूली एवं कार्यभार',
  Rank: 'क्रम',
  'Target (Cr)': 'लक्ष्य (करोड़)',
  'Actual (Cr)': 'वास्तविक (करोड़)',
  Performance: 'निष्पादन',
  'Audit Recovery (Cr)': 'लेखापरीक्षा वसूली (करोड़)',
  'Avg Workload': 'औसत कार्यभार',
  '{0} divisions covering {1} districts across Maharashtra.':
    'महाराष्ट्र के {1} जिलों को समाहित करते {0} विभाग।',
  'Officer Workload in {0}': '{0} में अधिकारी कार्यभार',
  'No officers directly assigned to this district in the current dataset.':
    'वर्तमान आँकड़ा-समुच्चय में इस जिले को सीधे नियत कोई अधिकारी नहीं।',
  '{0} assigned · {1} closed MTD': '{0} नियत · {1} माह-प्रारंभ से निपटाए',
  'Avg resolution: {0}d': 'औसत निपटान: {0} दि.',
  'Top Risk Taxpayers in this District': 'इस जिले के सर्वाधिक जोखिम वाले करदाता',
  'No taxpayers in this district match the current global filters.':
    'इस जिले का कोई करदाता वर्तमान वैश्विक फ़िल्टर से मेल नहीं खाता।',

  /* == Sector Intelligence =============================================== */
  'Cross-sector revenue, ITC and risk benchmarking across Maharashtra\'s priority industry sectors, with taxpayer-level drill-down.':
    'महाराष्ट्र के प्राथमिकता वाले उद्योग क्षेत्रों में अंतर-क्षेत्रीय राजस्व, ITC एवं जोखिम का मानक-तुलनात्मक विश्लेषण, करदाता-स्तर तक विस्तृत विवरण सहित।',
  'Sectors Tracked': 'निगरानी में क्षेत्र',
  'Highest-Risk Sector': 'सर्वाधिक जोखिम वाला क्षेत्र',
  '{0} high-risk': '{0} उच्च जोखिम',
  'Highest Revenue Sector': 'सर्वाधिक राजस्व वाला क्षेत्र',
  'Widest ITC Deviation': 'सर्वाधिक ITC विचलन',
  'vs cross-sector average': 'अंतर-क्षेत्रीय औसत के सापेक्ष',
  'Tax Revenue Collected by Sector': 'क्षेत्रवार वसूला गया कर राजस्व',
  'Sum of tax paid by taxpayers in each sector (₹ Lakh)':
    'प्रत्येक क्षेत्र के करदाताओं द्वारा भुगतान किए गए कर का योग (₹ लाख)',
  'Revenue (₹L)': 'राजस्व (₹ लाख)',
  'Tax vs ITC vs Refund Ratio by Sector': 'क्षेत्रवार कर बनाम ITC बनाम प्रतिदाय अनुपात',
  'Reference benchmark ratios as % of turnover — fixed reference values, not recomputed from the filtered taxpayer pool':
    'कारोबार के प्रतिशत में संदर्भ मानक अनुपात — ये निश्चित संदर्भ मान हैं, फ़िल्टर किए करदाता समुच्चय से पुनः परिकलित नहीं',
  'Tax Ratio %': 'कर अनुपात %',
  'ITC Ratio %': 'ITC अनुपात %',
  'Refund Ratio %': 'प्रतिदाय अनुपात %',
  'Sector Picker': 'क्षेत्र चयन',
  'Select a sector for a detailed intelligence panel': 'विस्तृत इंटेलिजेंस पटल हेतु कोई क्षेत्र चुनें',
  '{0} — Sector Profile': '{0} — क्षेत्र विवरण',
  'Revenue Contribution': 'राजस्व योगदान',
  'Taxpayers in Sector': 'क्षेत्र के करदाता',
  'Tax-to-Turnover Benchmark': 'कर-से-कारोबार मानक',
  'ITC Benchmark': 'ITC मानक',
  'Refund Benchmark': 'प्रतिदाय मानक',
  'Filing Compliance': 'विवरणी अनुपालन',
  'Sector Anomaly Alert': 'क्षेत्र विसंगति सूचना',
  '{0} ITC ratio ({1}%) deviates': '{0} का ITC अनुपात ({1}%) विचलित है',
  'from the cross-sector average ({0}%). {1} taxpayers in this sector currently carry a High or Critical risk rating.':
    'अंतर-क्षेत्रीय औसत ({0}%) से। इस क्षेत्र के {1} करदाताओं पर इस समय उच्च अथवा अत्यंत गंभीर जोखिम श्रेणी है।',
  'Recommend sector-level scrutiny review': 'क्षेत्र-स्तरीय संवीक्षा समीक्षा की सिफारिश',
  'Top Triggered Risk Indicators': 'सर्वाधिक लागू हुए जोखिम संकेतक',
  'Aggregated across {0} taxpayers in sector': 'क्षेत्र के {0} करदाताओं पर समेकित',
  'No risk rules triggered among taxpayers in this sector.':
    'इस क्षेत्र के करदाताओं पर कोई जोखिम नियम लागू नहीं हुआ।',
  'Top Taxpayers by Risk': 'जोखिम के अनुसार शीर्ष करदाता',
  'Respecting global district / risk filters': 'वैश्विक जिला / जोखिम फ़िल्टर का पालन करते हुए',
  'No taxpayers match the current global filters within this sector.':
    'इस क्षेत्र में कोई करदाता वर्तमान वैश्विक फ़िल्टर से मेल नहीं खाता।',
  '{0} — Taxpayer Register': '{0} — करदाता पंजी',
  'Searchable list of taxpayers in this sector (respects global filters)':
    'इस क्षेत्र के करदाताओं की खोजने योग्य सूची (वैश्विक फ़िल्टर का पालन करती है)',
  'Search taxpayer / GSTIN...': 'करदाता / GSTIN खोजें...',

  /* == Compliance Early Warning ========================================== */
  'Proactive Monitoring': 'अग्रसक्रिय निगरानी',
  'Proactive detection of filing, payment and behavioural anomalies — enabling outreach and officer review before escalation to formal enforcement action.':
    'विवरणी, भुगतान एवं व्यवहार संबंधी विसंगतियों की अग्रसक्रिय पहचान — औपचारिक प्रवर्तन कार्रवाई तक पहुँचने से पूर्व संपर्क और अधिकारी समीक्षा संभव बनाती है।',
  'Total Open Alerts': 'कुल खुली सूचनाएँ',
  'Officer Review Queue': 'अधिकारी समीक्षा पंक्ति',
  'Alert Types Active': 'सक्रिय सूचना प्रकार',
  'Alerts by Type': 'प्रकारवार सूचनाएँ',
  'Breakdown of early-warning signals — respects global filters':
    'पूर्वसूचना संकेतों का विभाजन — वैश्विक फ़िल्टर का पालन करता है',
  'Alert Volume Trend': 'सूचना संख्या प्रवृत्ति',
  'Alerts raised, bucketed over the last ~48 days': 'उठाई गई सूचनाएँ, पिछले लगभग 48 दिनों में वर्गीकृत',
  'Early Warning Alert Feed': 'पूर्वसूचना प्रवाह',
  'Searchable, filterable register of active compliance signals':
    'सक्रिय अनुपालन संकेतों की खोजने एवं फ़िल्टर करने योग्य पंजी',
  'Alerts currently under officer review — status updates are local to this session':
    'इस समय अधिकारी समीक्षा में सूचनाएँ — स्थिति परिवर्तन केवल इसी सत्र तक सीमित हैं',
  '{0} in queue': 'पंक्ति में {0}',
  'No alerts currently in the officer review queue.': 'इस समय अधिकारी समीक्षा पंक्ति में कोई सूचना नहीं।',
  'Alert Type': 'सूचना प्रकार',
  'Risk Score': 'जोखिम अंक',
  'Raised On': 'उठाई गई दिनांक',
  Raised: 'उठाई गई',
  'Mark Resolved': 'निस्तारित अंकित करें',
  'Recommended Action (System)': 'अनुशंसित कार्रवाई (प्रणाली)',
  'AI-Generated Taxpayer Outreach': 'AI-निर्मित करदाता संपर्क'
})
