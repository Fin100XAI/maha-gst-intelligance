import { registerMessages } from '../locale.js'

/**
 * Marathi — the shared panels that appear on many screens rather than one.
 *
 * The landing page, the role gate, and the six components every module renders:
 * the evidence-to-action brief, the cluster panel, the command board, the
 * comparable-cases panel, the filter-scope line and the statutory flag. These
 * are read on more screens than any single module's prose, which is why they
 * are pinned rather than left to composition.
 *
 *   limitation      → मुदत / परिमर्यादा (मुदत where the officer reads a deadline,
 *                     परिमर्यादा only where the statutory concept is meant)
 *   time-barred     → मुदतबाह्य
 *   exposure        → जोखीम रक्कम
 *   binding         → बंधनकारक
 *   persuasive      → मार्गदर्शक
 *   comparability   → तुलनात्मकता
 *   irreversible    → अपरिवर्तनीय
 *   cluster         → गट
 */
registerMessages('mr', {
  /* == Landing page ======================================================= */
  'Revenue Assurance, Fraud Risk': 'महसूल आश्वासन, फसवणूक जोखीम',
  ' & Compliance Intelligence Infrastructure for Maharashtra GST':
    ' व अनुपालन इंटेलिजन्स पायाभूत सुविधा — महाराष्ट्र GST साठी',

  /* == Role gate ========================================================== */
  'Select your role, then enter the access code.': 'आपले पद निवडा, नंतर प्रवेश संकेतांक टाका.',
  'Sections this role opens': 'हे पद कोणते विभाग उघडते',
  'All sections': 'सर्व विभाग',
  'Demonstration access code': 'प्रात्यक्षिक प्रवेश संकेतांक',
  'Enter the access code': 'प्रवेश संकेतांक टाका',
  'Show access code': 'संकेतांक दाखवा',
  'Hide access code': 'संकेतांक लपवा',
  'Access code not recognised.': 'प्रवेश संकेतांक ओळखला गेला नाही.',
  'Access follows the role held, and every action is logged against the officer who took it.':
    'प्रवेश हा धारण केलेल्या पदानुसार मिळतो, आणि प्रत्येक कृती ती करणाऱ्या अधिकाऱ्याच्या नावे नोंदवली जाते.',
  'Every figure states the system it came from and whether it is simulated.':
    'प्रत्येक आकडा तो कोणत्या प्रणालीतून आला आणि तो अनुरूपित आहे का, हे स्पष्ट सांगतो.',
  'The platform makes no call to the open internet for its figures, models or maps.':
    'हा मंच आपले आकडे, प्रारूपे किंवा नकाशे यांसाठी खुल्या इंटरनेटशी कोणताही संपर्क साधत नाही.',
  'Demonstration environment. Every taxpayer, return, notice and case in this platform is simulated; the statute, notifications and published collection figures are real.':
    'प्रात्यक्षिक वातावरण. या मंचावरील प्रत्येक करदाता, विवरणपत्र, नोटीस व प्रकरण अनुरूपित आहे; कायदा, अधिसूचना व प्रसिद्ध वसुलीचे आकडे मात्र खरे आहेत.',
  'Demonstration environment using simulated data. Role-based section access, maker-checker workflow and audit logging run throughout the platform.':
    'अनुरूपित माहितीवर चालणारे प्रात्यक्षिक वातावरण. पदनिहाय विभाग प्रवेश, कर्ता-तपासनीस कार्यप्रवाह व लेखापरीक्षा नोंद संपूर्ण मंचावर कार्यरत आहेत.',

  /* == Evidence-to-action brief =========================================== */
  'Evidence-to-action brief': 'पुरावा-ते-कृती टिपण',
  'Evidence on record': 'अभिलेखावरील पुरावा',
  'No encoded risk rule fires for this taxpayer.': 'या करदात्यासाठी कोणताही संकेतबद्ध जोखीम नियम लागू होत नाही.',
  'Filing status: {0} · compliance history on record: {1}':
    'विवरणपत्र स्थिती: {0} · अभिलेखावरील अनुपालन इतिहास: {1}',
  'Provision engaged': 'लागू केलेली तरतूद',
  'Rests on a contested notification': 'वादग्रस्त अधिसूचनेवर आधारित',
  'No limitation record exists for this taxpayer, so no provision has been engaged by the platform.':
    'या करदात्यासाठी मुदतीची कोणतीही नोंद नाही, त्यामुळे मंचाने कोणतीही तरतूद लागू केलेली नाही.',
  'Precedent bearing on this case': 'या प्रकरणावर परिणाम करणारा पूर्वनिर्णय',
  Binding: 'बंधनकारक',
  Persuasive: 'मार्गदर्शक',
  Favours: 'अनुकूल',
  'the department': 'विभागाला',
  'the assessee': 'करनिर्धारितीला',
  undecided: 'अनिर्णीत',
  'Departmental record on {0}: {1} concluded proceedings, {2}% confirmed. Institutional memory, not judicial authority.':
    '{0} बाबत विभागाचा अभिलेख: {1} निकाली कार्यवाही, {2}% कायम. ही संस्थात्मक स्मृती आहे, न्यायिक प्राधिकार नाही.',
  'What is at stake': 'पणाला काय लागले आहे',
  'Assessed exposure': 'निर्धारित जोखीम रक्कम',
  'Decays within 7 days': '७ दिवसांत क्षय होते',
  'Confidence — reported against four separate questions': 'विश्वास — चार स्वतंत्र प्रश्नांवर स्वतंत्रपणे नोंदवलेला',
  'Limitation position': 'मुदतीची स्थिती',
  '{0} days past the deadline': 'मुदतीनंतर {0} दिवस',
  '{0} days remain': '{0} दिवस शिल्लक',
  'No limitation record. Absence of a record is not the same as absence of a deadline.':
    'मुदतीची नोंद नाही. नोंद नसणे म्हणजे मुदत नसणे नव्हे.',
  'Recommended next step': 'शिफारस केलेले पुढील पाऊल',
  'Basis: {0}': 'आधार: {0}',
  'Requires officer approval before anything issues.': 'काहीही जारी होण्यापूर्वी अधिकाऱ्याची मान्यता आवश्यक.',

  /* == Cluster panel ====================================================== */
  'Flagged Clusters': 'निदर्शनास आणलेले गट',
  ' — every cluster listed here requires verification by the Investigation Team before any enforcement action.':
    ' — येथे नोंदवलेल्या प्रत्येक गटाची कोणतीही अंमलबजावणी कारवाई करण्यापूर्वी तपास पथकाकडून पडताळणी आवश्यक आहे.',
  'The cluster list and summary below are therefore empty. The graph still shows the last selected cluster, which is outside your current filters — clear or widen the filters to see matching clusters.':
    'त्यामुळे खालील गट यादी व सारांश रिकामे आहेत. आलेख अद्याप शेवटी निवडलेला गट दाखवत आहे, जो आपल्या सध्याच्या गाळण्यांच्या बाहेर आहे — जुळणारे गट पाहण्यासाठी गाळण्या काढा किंवा रुंद करा.',
  'Consolidated summary across the {0} cluster(s) matching the current filters.':
    'सध्याच्या गाळण्यांशी जुळणाऱ्या {0} गटांचा एकत्रित सारांश.',

  /* == Command board ====================================================== */
  'Active conditions': 'कार्यरत परिस्थिती',
  'Grouped by irreversibility, not by value. {0} of the {1} need a decision at Commissioner level.':
    'अपरिवर्तनीयतेनुसार गटबद्ध, मूल्यानुसार नाही. {1} पैकी {0} साठी आयुक्त स्तरावर निर्णय आवश्यक आहे.',
  'Irreversible — {0}% of the total': 'अपरिवर्तनीय — एकूणपैकी {0}%',
  'Still in play': 'अद्याप बदलण्याजोगे',
  Decision: 'निर्णय',

  /* == Comparable cases =================================================== */
  'Comparable concluded proceedings': 'तुलनात्मक निकाली कार्यवाही',
  'Drawn from the {0} proceedings in the department’s record that have actually concluded and carry an outcome.':
    'विभागाच्या अभिलेखातील ज्या {0} कार्यवाही प्रत्यक्षात निकाली निघाल्या आहेत आणि ज्यांचा निष्कर्ष नोंदलेला आहे, त्यांतून घेतलेले.',
  Comparability: 'तुलनात्मकता',
  Position: 'स्थिती',
  'Why it is comparable': 'ते तुलनात्मक का आहे',
  'No positive match beyond the score.': 'गुणांकापलीकडे कोणतीही सकारात्मक जुळणी नाही.',
  'How it differs — read before relying on it': 'ते कशात वेगळे आहे — त्यावर विसंबण्यापूर्वी वाचा',
  'No material difference detected on the assessed dimensions.':
    'तपासलेल्या परिमाणांवर कोणताही भौतिक फरक आढळला नाही.',
  'Dimensions and their weight': 'परिमाणे व त्यांचे भारमान',

  /* == Filter scope line ================================================== */
  'Showing {0} of {1} {2}': '{1} पैकी {0} {2} दाखवत आहे',
  'filtered to': 'यावर गाळलेले',
  '{0} hidden by the filter': 'गाळणीमुळे {0} लपवलेले',
  'The filter bar does not apply to this page.': 'गाळणी पट्टी या पानाला लागू होत नाही.',
  'The filter is currently set to': 'गाळणी सध्या यावर लावलेली आहे',
  'nothing on this page is narrowed by it.': 'या पानावरील काहीही त्यामुळे मर्यादित होत नाही.',

  /* == Statutory flag ===================================================== */
  'Time-barred': 'मुदतबाह्य',
  '{0}d left': '{0} दि. शिल्लक',
  '{0}d': '{0} दि.',
  '{0}d overdue': '{0} दि. मुदतीनंतर',
  'Statutory period expired': 'सांविधिक मुदत संपली',
  'Statutory deadline approaching': 'सांविधिक मुदत जवळ येत आहे',
  '{0} of these {1} are on periods that are already time-barred — {2} of exposure that can no longer be demanded.':
    'यांपैकी {0} {1} अशा कालावधींवरील आहेत जे आधीच मुदतबाह्य झाले आहेत — {2} इतकी जोखीम रक्कम आता मागता येणार नाही.',
  'The limitation period has expired, so no demand can lawfully be raised for these periods however the case is worked. They should be reviewed for closure rather than advanced, and the officer-days they hold released to cases that are still live.':
    'मुदत संपली आहे, त्यामुळे प्रकरण कसेही हाताळले तरी या कालावधींसाठी कायदेशीररीत्या कोणतीही मागणी उभी करता येणार नाही. ती पुढे नेण्याऐवजी निकालात काढण्यासाठी तपासावीत, आणि त्यांत अडकलेले अधिकारी-दिवस अद्याप जिवंत असलेल्या प्रकरणांसाठी मोकळे करावेत.',
  '{0} more expire within 30 days': 'आणखी {0} ३० दिवसांत संपतात',
  '{0} of these {1} expire within 30 days': 'यांपैकी {0} {1} ३० दिवसांत संपतात',
  ' — {0} of exposure that will be extinguished by operation of law if the notice does not issue in time.':
    ' — {0} इतकी जोखीम रक्कम, जी नोटीस वेळेत न निघाल्यास कायद्याच्या परिणामाने नष्ट होईल.',
  'Advancing this case cannot produce a recoverable demand. Review it for closure.':
    'हे प्रकरण पुढे नेल्याने वसूलपात्र मागणी निर्माण होऊ शकत नाही. ते निकालात काढण्यासाठी तपासा.',
  'This deadline rests on a notification whose validity is reserved before the Supreme Court — see Precedent Intelligence.':
    'ही मुदत अशा अधिसूचनेवर आधारित आहे जिची वैधता सर्वोच्च न्यायालयासमोर राखून ठेवली आहे — पूर्वनिर्णय इंटेलिजन्स पहा.'
})
