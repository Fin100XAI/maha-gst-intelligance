import { registerMessages } from '../../locale.js'

/* ---------------------------------------------------------------------------
 * TAXPAYER 360 & DISTRICT / DIVISION PERFORMANCE CATALOGUE
 *
 * Hand-written Marathi for every string in `src/modules/Taxpayer360.jsx` and
 * `src/modules/DistrictDivisionPerformance.jsx` that is not already covered
 * by `../shell.js` (module title, "Benchmarking" nav group, district/division/
 * sector/risk-level filter option labels, etc. — those keys are reused as-is
 * from shell.js and are not repeated here).
 * ------------------------------------------------------------------------- */

registerMessages('mr', {
  /* == Taxpayer 360 — header, pills, search ================================ */
  'Revenue · Taxpayer Intelligence': 'महसूल · करदाता इंटेलिजन्स',
  'Search any GSTIN or trade name for a complete taxpayer intelligence profile — filing behaviour, ITC pattern, refund history, e-way bill activity, network linkages and risk explainability.':
    'संपूर्ण करदाता इंटेलिजन्स प्रोफाइलसाठी कोणताही GSTIN किंवा व्यापार नाव शोधा — विवरणपत्र भरण्याची पद्धत, ITC नमुना, परतावा इतिहास, ई-वे बिल क्रियाकलाप, जाळे जोडण्या व जोखीम स्पष्टीकरण.',
  'Risk signal only': 'केवळ जोखीम संकेत',
  'Officer verification required': 'अधिकारी पडताळणी आवश्यक',
  'No automated adverse action': 'स्वयंचलित प्रतिकूल कारवाई नाही',
  'Search by GSTIN, trade name or legal name — e.g. 27AAAPZ1000..., or Shivneri Enterprises':
    'GSTIN, व्यापार नाव किंवा कायदेशीर नावाने शोधा — उदा. 27AAAPZ1000..., किंवा Shivneri Enterprises',
  '{0} {1} match "{2}" under the current global filters.': '{0} {1} सद्य जागतिक गाळण्यांतर्गत "{2}" शी जुळतात.',
  taxpayer: 'करदाता',
  taxpayers: 'करदाते',
  'Search Results': 'शोध निकाल',
  'Click any row to open the full Taxpayer 360 profile.': 'संपूर्ण करदाता ३६० प्रोफाइल उघडण्यासाठी कोणत्याही ओळीवर क्लिक करा.',

  /* == Taxpayer 360 — KPIs and highest-risk panel =========================== */
  'Total Taxpayers (filtered)': 'एकूण करदाते (गाळलेले)',
  'High / Critical Risk': 'उच्च / अत्यंत गंभीर जोखीम',
  'Non-Filers': 'विवरणपत्र न भरणारे',
  'New Registrations': 'नवीन नोंदणी',
  'Highest Risk Taxpayers': 'सर्वाधिक जोखमीचे करदाते',
  'Top entities by computed risk score under the current global filters — a starting point when no search query is entered.':
    'सद्य जागतिक गाळण्यांतर्गत संगणित जोखीम गुणांनुसार शीर्ष घटक — शोध प्रश्न न भरल्यास प्रारंभबिंदू.',
  'Risk signal only. No automated adverse action is taken — every case listed here requires officer verification before any action.':
    'केवळ जोखीम संकेत. कोणतीही स्वयंचलित प्रतिकूल कारवाई केली जात नाही — येथे सूचीबद्ध प्रत्येक प्रकरणास कोणत्याही कृतीपूर्वी अधिकारी पडताळणी आवश्यक आहे.',
  'No taxpayers match the current global filters.': 'सद्य जागतिक गाळण्यांशी कोणताही करदाता जुळत नाही.',

  /* == Taxpayer 360 — table columns / mini stat labels ====================== */
  GSTIN: 'GSTIN',
  'Trade Name': 'व्यापार नाव',
  District: 'जिल्हा',
  Sector: 'क्षेत्र',
  'Filing Status': 'विवरणपत्र स्थिती',
  Risk: 'जोखीम',
  'Est. Exposure': 'अंदाजित जोखीम रक्कम',

  /* == District & Division Performance — header, KPIs ======================= */
  "Geographic governance view of revenue targets, risk concentration, officer workload and case ageing across Maharashtra's districts and divisions.":
    'महाराष्ट्रातील जिल्हे व विभागांमधील महसूल उद्दिष्टे, जोखीम संकेंद्रण, अधिकारी कामाचा ताण व प्रकरण जुनेपणा यांचे भौगोलिक कारभार दृश्य.',
  'Total Districts': 'एकूण जिल्हे',
  'Districts in Deficit': 'तूट असलेले जिल्हे',
  'of {0}': '{0} पैकी',
  'Total Non-Filers': 'एकूण विवरणपत्र न भरणारे',
  'Total Audit Recovery': 'एकूण लेखापरीक्षा वसुली',
  Cr: 'Cr',
  days: 'दिवस',

  /* == District & Division Performance — severity heatmap =================== */
  'District Severity Heatmap': 'जिल्हा तीव्रता उष्मा नकाशा',
  'Threshold-based shading — not a taxpayer risk score': 'मर्यादा-आधारित छटा — करदाता जोखीम गुण नव्हे',
  'Risk Taxpayers': 'जोखमीचे करदाते',
  'Target Gap %': 'उद्दिष्ट तफावत %',
  Severe: 'गंभीर',
  Elevated: 'वाढलेले',
  Moderate: 'मध्यम',
  Stable: 'स्थिर',
  'Severe deficit': 'गंभीर तूट',
  'High deficit': 'उच्च तूट',
  'Mild deficit': 'सौम्य तूट',
  'On/above target': 'उद्दिष्टावर/त्याहून अधिक',

  /* == District & Division Performance — district cards ===================== */
  'District Performance Cards': 'जिल्हा कामगिरी कार्डे',
  Actual: 'प्रत्यक्ष',
  Target: 'उद्दिष्ट',
  'Officer Workload': 'अधिकारी कामाचा ताण',
  'Case Ageing': 'प्रकरण जुनेपणा',
  'District drilldown': 'जिल्हा तपशील',
  'No districts match the current global filters.': 'सद्य जागतिक गाळण्यांशी कोणताही जिल्हा जुळत नाही.',

  /* == District & Division Performance — division ranking table ============= */
  'Division Performance Ranking': 'विभाग कामगिरी क्रमवारी',
  'Aggregated target vs actual, audit recovery and workload by division':
    'विभागानुसार एकत्रित उद्दिष्ट विरुद्ध प्रत्यक्ष, लेखापरीक्षा वसुली व कामाचा ताण',
  Rank: 'क्रमांक',
  Division: 'विभाग',
  'Target (Cr)': 'उद्दिष्ट (Cr)',
  'Actual (Cr)': 'प्रत्यक्ष (Cr)',
  Performance: 'कामगिरी',
  'Audit Recovery (Cr)': 'लेखापरीक्षा वसुली (Cr)',
  'Avg Workload': 'सरासरी कामाचा ताण',
  '{0} divisions covering {1} districts across Maharashtra.': '{0} विभाग महाराष्ट्रातील {1} जिल्ह्यांचा समावेश करतात.',

  /* == District & Division Performance — district drilldown modal =========== */
  'Target Gap': 'उद्दिष्ट तफावत',
  'Audit Recovery': 'लेखापरीक्षा वसुली',
  'Officer Workload in {0}': '{0} मधील अधिकारी कामाचा ताण',
  'No officers directly assigned to this district in the current dataset.':
    'सध्याच्या माहितीसंचात या जिल्ह्याला थेट नेमलेला कोणताही अधिकारी नाही.',
  '{0} assigned · {1} closed MTD': '{0} नेमून दिलेली · {1} MTD बंद',
  'Avg resolution: {0}d': 'सरासरी निराकरण: {0}d',
  'Top Risk Taxpayers in this District': 'या जिल्ह्यातील सर्वाधिक जोखमीचे करदाते',
  'No taxpayers in this district match the current global filters.': 'या जिल्ह्यातील कोणताही करदाता सद्य जागतिक गाळण्यांशी जुळत नाही.'
})
