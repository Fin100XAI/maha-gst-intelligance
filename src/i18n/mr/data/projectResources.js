import { registerMessages } from '../../locale.js'

/**
 * Marathi — projectResources.js: the statutory sources, the official published
 * data, the statistical methods with their failure modes, the software stack,
 * and the simulated-versus-real division.
 *
 * Each method entry has three parts — what it is, why it was chosen, how it
 * fails — and the third is the one that matters most. A method whose failure
 * mode is not stated is a method nobody can audit, so those sentences are
 * translated in full rather than shortened.
 *
 * Method names stay recognisable in Latin where they are the name of a
 * published technique an officer or auditor would look up: Iglewicz–Hoaglin,
 * Jaccard, MAD, NP-hard. Package names — React, Vite, Tailwind CSS, Recharts,
 * PostCSS, Autoprefixer — are product names and are never translated. Statutory
 * citations and SLP numbers stay as published.
 *
 *   failure mode        → अपयशाची पद्धत
 *   residual graph      → शिल्लक आलेख
 *   piecewise-linear    → खंडशः रेषीय
 *   anchor              → आधारबिंदू
 *   interpolation       → अंतर्वेशन
 *   effect size         → परिणाम आकार
 *   stratum / strata    → स्तर
 *   seed                → बीज
 *   determinism         → निश्चितता
 */
registerMessages('mr', {
  /* == Source categories ================================================ */
  'Statute & subordinate legislation': 'कायदा व अधीनस्थ विधिविधान',
  'Encoded as computation, not summarised. The limitation engine computes from these rather than from a model.':
    'सारांशित नव्हे, परिगणना म्हणून संकेतबद्ध. मुदत यंत्रणा प्रारूपावरून नव्हे तर यांवरूनच गणना करते.',
  'Official published data': 'अधिकृत प्रसिद्ध माहिती',
  'Real figures from government sources, kept strictly separate from the simulated operational records.':
    'शासकीय स्रोतांतील खरे आकडे, अनुरूपित कार्यालयीन अभिलेखांपासून काटेकोरपणे वेगळे ठेवलेले.',
  'Statistical & algorithmic methods': 'सांख्यिकीय व अल्गोरिदमिक पद्धती',
  'Each chosen for a stated reason, and each with a known failure mode that is named on the screen that uses it.':
    'प्रत्येक पद्धत नमूद कारणासाठी निवडलेली, आणि प्रत्येकीची ज्ञात अपयशाची पद्धत ती वापरणाऱ्या पडद्यावरच नावासह दिलेली.',
  'Runs entirely within the department’s own infrastructure. No call is made to the open internet for figures, models or maps.':
    'पूर्णपणे विभागाच्याच पायाभूत सुविधेत चालते. आकडे, प्रारूपे किंवा नकाशे यांसाठी खुल्या इंटरनेटशी कोणताही संपर्क साधला जात नाही.',

  /* == Statutory sources ================================================ */
  'Rule 99, CGST Rules': 'नियम ९९, CGST नियम',
  'Scrutiny of returns. Prescribes the 30-day period for a reply in FORM GST ASMT-11 — the notice drafting originally stated 15 days and was corrected against this.':
    'विवरणपत्रांची तपासणी. FORM GST ASMT-11 मध्ये उत्तरासाठी ३० दिवसांचा कालावधी विहित करतो — नोटीस मसुद्यात मूळतः १५ दिवस लिहिले होते आणि याच्या आधारे ते दुरुस्त केले.',
  'Finance (No. 2) Act, 2024': 'वित्त (क्र. २) अधिनियम, २०२४',
  'Inserted Section 74A, which applies from FY 2024-25 and removes the fraud / non-fraud split in limitation periods.':
    'कलम ७४अ समाविष्ट केले, जे आर्थिक वर्ष २०२४-२५ पासून लागू होते आणि मुदतींतील फसवणूक / फसवणूक-नसलेली हा भेद रद्द करते.',

  /* == Official data sources ============================================ */
  'Maharashtra GST Department — dealer statistics': 'महाराष्ट्र GST विभाग — व्यापारी सांख्यिकी',
  'Registered dealer counts and departmental statistics. Provides the scale context against which the modelled population is stated.':
    'नोंदणीकृत व्यापाऱ्यांची संख्या व विभागीय सांख्यिकी. प्रारूपातील संख्या ज्या प्रमाणाच्या संदर्भात मांडली जाते तो संदर्भ हीच पुरवते.',
  'Press Information Bureau — monthly GST collection releases':
    'पत्र सूचना कार्यालय — मासिक GST वसुली प्रसिद्धिपत्रके',
  'National gross GST collection figures, published monthly.':
    'राष्ट्रीय एकूण GST वसुलीचे आकडे, दरमहा प्रसिद्ध होणारे.',
  'CBIC — GST tax information portal': 'CBIC — GST कर माहिती संकेतस्थळ',
  'The authoritative text of the Act, Rules and notifications. Every statutory computation in this platform traces here.':
    'अधिनियम, नियम व अधिसूचनांचा प्रमाण मजकूर. या मंचावरील प्रत्येक सांविधिक गणना इथपर्यंत मागे नेता येते.',
  'Statutory Time Intelligence, Audit & Scrutiny Engine':
    'सांविधिक मुदत इंटेलिजन्स, लेखापरीक्षा व तपासणी यंत्रणा',
  'data.gov.in — GST datasets': 'data.gov.in — GST डेटासंच',
  'Dataset pointers are recorded with no values attached: the endpoints returned HTTP 403 when fetched, so nothing was inferred from them. Listing them without values is deliberate.':
    'डेटासंच निर्देश कोणत्याही मूल्यांशिवाय नोंदवले आहेत: मागवले असता या स्रोतांनी HTTP 403 परत दिला, त्यामुळे त्यांवरून काहीही अनुमान काढलेले नाही. मूल्यांशिवाय त्यांची यादी देणे हे जाणीवपूर्वक आहे.',

  /* == Methods ========================================================== */
  'Median absolute deviation, Iglewicz–Hoaglin modified z':
    'मध्यक निरपेक्ष विचलन, इग्लेविच–होगलिन सुधारित z',
  'Peer-relative outlier detection at a threshold of 3.5.':
    '३.५ या उंबरठ्यावर समकक्षांच्या तुलनेत बाह्यबिंदू शोध.',
  'Mean and standard deviation are dragged by the outliers being hunted — a handful of extreme entities inflate the spread until they no longer register. MAD does not have that failure.':
    'सरासरी व प्रमाण विचलन हे ज्या बाह्यबिंदूंचा शोध घ्यायचा त्यांच्याकडूनच ओढले जातात — मूठभर टोकाचे घटक पसरण इतकी फुगवतात की ते स्वतःच नोंदले जात नाहीत. MAD मध्ये हे अपयश नाही.',
  'A zero MAD, where more than half a peer group share one value, makes the score undefined. Those cases are skipped rather than reported as infinite.':
    'समकक्ष गटातील निम्म्याहून अधिक घटकांचे मूल्य एकच असल्यास MAD शून्य होते आणि गुणांक अपरिभाषित राहतो. अशी प्रकरणे अनंत म्हणून नोंदवण्याऐवजी वगळली जातात.',

  'Three-colour depth-first cycle detection': 'तीन-रंगी खोली-प्रथम चक्र शोध',
  'Run once per node on the residual graph after removing it, to test whether circulation survives.':
    'प्रत्येक घटक काढून टाकल्यावर उरलेल्या शिल्लक आलेखावर एकदा चालवला जातो, जेणेकरून परिचलन टिकते का हे तपासता येईल.',
  'Centrality measures how important a node looks. It does not answer whether the chain keeps running without it, and on a chain with a bypass route those point at different entities.':
    'केंद्रस्थता एखादा घटक किती महत्त्वाचा दिसतो हे मोजते. त्याच्याशिवाय साखळी चालू राहते का याचे उत्तर ती देत नाही, आणि बगल मार्ग असलेल्या साखळीत या दोन गोष्टी वेगवेगळ्या घटकांकडे बोट दाखवतात.',
  'Only as good as the edges supplied. With cluster-level edges it cannot trace between GSTIN layers.':
    'पुरवलेल्या कड्या जेवढ्या चांगल्या तेवढाच तो चांगला. गट-पातळीवरील कड्यांसह तो GSTIN स्तरांदरम्यान माग काढू शकत नाही.',
  'Network Enforcement': 'नेटवर्क अंमलबजावणी',

  'Jaccard index on triggered rule sets': 'लागू झालेल्या नियम संचांवरील जॅकार्ड निर्देशांक',
  'Overlap between the risk rules firing on two taxpayers.':
    'दोन करदात्यांवर लागू होणाऱ्या जोखीम नियमांमधील आच्छादन.',
  'Set overlap rather than count similarity — two taxpayers each firing three rules are not similar if the rules differ.':
    'संख्येचे साम्य नव्हे तर संचाचे आच्छादन — प्रत्येकी तीन नियम लागू होणारे दोन करदाते, नियम वेगळे असतील तर सारखे नाहीत.',
  'Returns null where neither has rules, which is uninformative rather than a perfect match.':
    'दोघांपैकी कोणालाही नियम लागू नसतील तिथे रिक्त परत देते, कारण ती परिपूर्ण जुळणी नसून माहिती नसणे आहे.',

  'Piecewise-linear recovery decay curve': 'खंडशः रेषीय वसुली क्षय वक्र',
  'Interpolated between anchors at 0, 30, 90, 180, 365, 540 and 730 days.':
    '०, ३०, ९०, १८०, ३६५, ५४० व ७३० दिवसांच्या आधारबिंदूंदरम्यान अंतर्वेशित.',
  'A step function meant only band-crossers decayed, which made the ranking degenerate. Continuous interpolation fixed it.':
    'पायरी-स्वरूपाच्या फलनामुळे केवळ पट्टा ओलांडणाऱ्यांचाच क्षय होत असे, आणि त्यामुळे क्रमवारी निरर्थक होत असे. सलग अंतर्वेशनाने ते दुरुस्त झाले.',
  'The anchors are a stated assumption, not an observed recovery rate. Turning it into a probability model needs observed recovery against demand.':
    'आधारबिंदू हे नमूद केलेले गृहीतक आहे, निरीक्षण केलेला वसुली दर नाही. त्याचे संभाव्यता प्रारूपात रूपांतर करण्यासाठी मागणीच्या तुलनेत प्रत्यक्ष वसुली लागते.',
  'Revenue at Risk & Recovery, Counterfactual Case Intelligence':
    'जोखमीतील महसूल व वसुली, प्रति-तथ्य प्रकरण इंटेलिजन्स',

  'Relaxed upper bound on generalised assignment': 'सामान्यीकृत नेमणुकीवरील शिथिल कमाल मर्यादा',
  'Eligibility and integrality both relaxed to produce a bound the true optimum cannot exceed.':
    'खरे सर्वोत्तम जी ओलांडू शकत नाही अशी मर्यादा मिळवण्यासाठी पात्रता व पूर्णांकता या दोन्ही शिथिल केलेल्या.',
  'Generalised assignment is NP-hard. Rather than claim optimality, the greedy result is reported as a share of a bound that is unreachable by construction.':
    'सामान्यीकृत नेमणूक ही NP-hard समस्या आहे. सर्वोत्तमतेचा दावा करण्याऐवजी, लोभी निष्कर्ष हा रचनेनुसारच गाठता न येणाऱ्या मर्यादेचा वाटा म्हणून नोंदवला जातो.',
  'The bound is loose. It brackets the optimum rather than locating it.':
    'ही मर्यादा सैल आहे. ती सर्वोत्तम कुठे आहे हे सांगत नाही, फक्त त्याला कंसात बांधते.',

  'Standardised mean difference (effect size)': 'प्रमाणित सरासरी फरक (परिणाम आकार)',
  'Separation between a positive class and the baseline, measured against the population spread.':
    'सकारात्मक वर्ग व आधाररेषा यांतील पृथक्करण, संख्येच्या पसरणीच्या तुलनेत मोजलेले.',
  'Establishes whether a resemblance model is worth building before it is built. Below roughly 0.5 there is nothing to stand on.':
    'साम्य ओळखणारे प्रारूप बांधण्याआधीच ते बांधण्यासारखे आहे का हे ठरवते. साधारण ०.५ च्या खाली उभे राहण्यासारखे काहीही नाही.',
  'Small samples make any effect size unstable — which is itself part of the finding where the contrast class is two cases.':
    'लहान नमुन्यांमुळे कोणताही परिणाम आकार अस्थिर होतो — आणि विरोधी वर्गात दोनच प्रकरणे असतील तिथे हेच निष्कर्षाचा भाग आहे.',

  'Stratified randomised trial design': 'स्तरीकृत यादृच्छिक चाचणी रचना',
  'Strata on exposure decile crossed with risk band, with a rotating start arm per stratum.':
    'जोखीम रक्कम दशमांश व जोखीम पट्टा यांच्या छेदावर स्तर, आणि प्रत्येक स्तरासाठी फिरता प्रारंभ गट.',
  'Alternating on a global index sent every singleton stratum to the same arm, producing a 4x imbalance in the critical band.':
    'एकाच जागतिक क्रमांकावर आळीपाळी केल्याने एकाच घटकाचा प्रत्येक स्तर एकाच गटात गेला, आणि निर्णायक पट्ट्यात ४ पट असमतोल निर्माण झाला.',
  'Needs a run long enough to conclude. Endpoints are pre-declared for that reason.':
    'निष्कर्षापर्यंत पोहोचण्याइतका दीर्घ काळ चालणे आवश्यक. त्याच कारणासाठी निष्कर्ष-बिंदू आधीच जाहीर केले आहेत.',

  'Every simulated record derives from a fixed seed.':
    'प्रत्येक अनुरूपित अभिलेख निश्चित बीजापासून तयार होतो.',
  'The demonstration must be identical on every machine and every reload. A figure that moves between viewings cannot be discussed.':
    'प्रात्यक्षिक प्रत्येक संगणकावर व प्रत्येक वेळी तंतोतंत सारखेच असले पाहिजे. दोन वेळा पाहताना बदलणाऱ्या आकड्यावर चर्चाच करता येत नाही.',
  'Determinism is not realism. The distribution is a designed one, not an observed one.':
    'निश्चितता म्हणजे वास्तवता नव्हे. हे वितरण रचलेले आहे, निरीक्षण केलेले नाही.',
  'All simulated data': 'सर्व अनुरूपित माहिती',

  /* == Software ========================================================= */
  'User interface': 'वापरकर्ता आंतरपृष्ठ',
  'Build and development server': 'बांधणी व विकास सर्व्हर',
  'Styling, driven by CSS variables so themes switch without duplicate rules':
    'शैली, CSS चलांवर आधारित जेणेकरून नियमांची पुनरावृत्ती न करता रंगसंगती बदलता येते',
  Charting: 'आलेख निर्मिती',
  Icons: 'चिन्हे',
  'CSS processing': 'CSS प्रक्रिया',

  /* == Simulated versus real ============================================ */
  'Every taxpayer, GSTIN, trade name, address and contact detail':
    'प्रत्येक करदाता, GSTIN, व्यापारी नाव, पत्ता व संपर्क तपशील',
  'All returns, payments, ITC claims, refunds and e-way bill records':
    'सर्व विवरणपत्रे, भरणे, ITC दावे, परतावे व ई-वे बिल अभिलेख',
  'All notices, audit cases, litigation cases and compliance alerts':
    'सर्व नोटिसा, लेखापरीक्षा प्रकरणे, खटला प्रकरणे व अनुपालन सूचना',
  'The officer establishment and every assignment': 'अधिकारी आस्थापना व प्रत्येक नेमणूक',
  'All network clusters and their edges': 'सर्व नेटवर्क गट व त्यांच्या कड्या',
  'Sections 73, 74 and 74A of the CGST/MGST Act, and Rule 99':
    'CGST/MGST अधिनियमाची कलमे ७३, ७४ व ७४अ, आणि नियम ९९',
  'Notifications 09/2023-CT and 56/2023-CT, and their contested status':
    'अधिसूचना ०९/२०२३-CT व ५६/२०२३-CT, आणि त्यांची वादग्रस्त स्थिती',
  'The four judicial authorities on Section 168A, including SLP (C) 4240/2025':
    'कलम १६८अ वरील चार न्यायिक प्राधिकार, ज्यात SLP (C) 4240/2025 समाविष्ट',
  'Published collection and dealer figures from PIB and mahagst.gov.in':
    'PIB व mahagst.gov.in यांचे प्रसिद्ध वसुली व व्यापारी आकडे',
  'The division is absolute and stated on every screen that shows a figure. No simulated record is presented as an observation, and no real figure is mixed into a simulated aggregate. The scale ratio is roughly 1:6,484 — 156 modelled taxpayers against 10,11,501 registered SGST dealers — so no total on this platform should be read as a statewide figure.':
    'ही विभागणी निरपवाद असून आकडा दाखवणाऱ्या प्रत्येक पडद्यावर ती नमूद केली आहे. कोणताही अनुरूपित अभिलेख निरीक्षण म्हणून सादर केलेला नाही, आणि कोणताही खरा आकडा अनुरूपित बेरजेत मिसळलेला नाही. प्रमाण गुणोत्तर साधारण १:६,४८४ आहे — १०,११,५०१ नोंदणीकृत SGST व्यापाऱ्यांच्या तुलनेत प्रारूपातील १५६ करदाते — त्यामुळे या मंचावरील कोणतीही बेरीज राज्यव्यापी आकडा म्हणून वाचली जाऊ नये.'
})
