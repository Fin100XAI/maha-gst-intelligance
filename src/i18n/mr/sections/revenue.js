import { registerMessages } from '../../locale.js'

/**
 * Marathi — Revenue Intelligence, Statutory Time Intelligence, and
 * Revenue at Risk & Recovery.
 *
 *   shortfall            → तूट
 *   attribution          → श्रेयनिर्धारण / जबाबदारी निश्चिती
 *   realised ratio       → प्रत्यक्ष गुणोत्तर
 *   benchmark            → मानक
 *   detection floor      → शोधाची किमान मर्यादा
 *   queue dwell          → रांगेतील प्रतीक्षा
 *   blockable window     → रोखता येण्याजोगा कालपट
 *   binding deadline     → बंधनकारक मुदत
 *   ultra vires          → अधिकारक्षेत्राबाहेर
 *
 * Form and notification identifiers stay in Latin — returns_period.csv,
 * output_tax, Notification 56/2023-CT, Section 168A — because they are what an
 * officer or a data owner quotes.
 */
registerMessages('mr', {
  /* == Revenue Intelligence — headline and basis ========================= */
  'What this screen decides': 'हा पडदा काय ठरवतो',
  'A shortfall is only actionable once you know whose it is.':
    'तूट कोणाची आहे हे कळल्याशिवाय तिच्यावर कारवाई करता येत नाही.',
  '₹{0} Cr of ₹{1} Cr — district ledger, current collection period':
    '₹{1} कोटींपैकी ₹{0} कोटी — जिल्हा हिशेब, चालू वसुली कालावधी',
  '₹{0} Cr of ₹{1} Cr over {2} months': '{2} महिन्यांत ₹{1} कोटींपैकी ₹{0} कोटी',
  'Collection in view stands at {0}% of target — a shortfall of ₹{1} Cr. On the current-period district ledger, {2} of the {3} districts in deficit carry {4}% of that gap, and {5} of {6} sectors in view are collecting below their own tax-to-turnover benchmark. Those are the two places a recovery effort changes the number.':
    'दृश्यातील वसुली लक्ष्याच्या {0}% आहे — ₹{1} कोटींची तूट. चालू कालावधीच्या जिल्हा हिशेबात, तुटीत असलेल्या {3} जिल्ह्यांपैकी {2} जिल्हे त्या तुटीचा {4}% वाहतात, आणि दृश्यातील {6} पैकी {5} क्षेत्रे त्यांच्याच कर-उलाढाल मानकाखाली वसुली करत आहेत. वसुलीच्या प्रयत्नाने आकडा बदलतो अशा याच दोन जागा आहेत.',
  'Collection in view stands at {0}% of target — ahead by ₹{1} Cr. {2} districts are nonetheless in deficit on the current-period ledger and {3} of {4} sectors in view are collecting below their own tax-to-turnover benchmark; a headline surplus does not clear either.':
    'दृश्यातील वसुली लक्ष्याच्या {0}% आहे — ₹{1} कोटींनी पुढे. तरीही चालू कालावधीच्या हिशेबात {2} जिल्हे तुटीत आहेत आणि दृश्यातील {4} पैकी {3} क्षेत्रे त्यांच्याच कर-उलाढाल मानकाखाली वसुली करत आहेत; ठळक आकड्यातील अधिक्य यांपैकी काहीही निकालात काढत नाही.',
  '₹{0} Cr shortfall across {1} districts · current period':
    '{1} जिल्ह्यांत मिळून ₹{0} कोटींची तूट · चालू कालावधी',
  '{0} of {1} taxpayers in view': 'दृश्यातील {1} करदात्यांपैकी {0}',
  'Collection Against Target': 'लक्ष्याच्या तुलनेत वसुली',
  'Districts Carrying {0}% of the Shortfall': 'तुटीपैकी {0}% वाहणारे जिल्हे',
  'of {0} in deficit, {1} in view': 'तुटीतील {0} पैकी, दृश्यात {1}',
  'Sectors Below Their Tax Benchmark': 'स्वतःच्या कर मानकाखालील क्षेत्रे',
  'of {0} sectors with taxpayers in view': 'दृश्यात करदाते असलेल्या {0} क्षेत्रांपैकी',

  /* == Revenue Intelligence — variance, tax head, attribution ============ */
  'Variance From Target by District': 'जिल्हानिहाय लक्ष्यापासूनचा फरक',
  'Collection against the district’s own target (%). Zero is on target; bars below the line are the districts a recovery effort has to reach. Absolute collection is in the shortfall ledger below.':
    'जिल्ह्याच्या स्वतःच्या लक्ष्याच्या तुलनेत वसुली (%). शून्य म्हणजे लक्ष्यावर; रेषेखालील स्तंभ म्हणजे वसुलीच्या प्रयत्नाने ज्यांच्यापर्यंत पोहोचायचे आहे ते जिल्हे. एकूण वसुली खालील तूट हिशेबात आहे.',
  'Collection by tax head is not available': 'कर शीर्षकानुसार वसुली उपलब्ध नाही',
  'Every collection figure on this screen is a combined tax total. Splitting it into CGST, SGST, IGST and Cess needs the period return extract (returns_period.csv, GSTN returns), which carries output_tax broken down by head alongside the cash-versus-credit split. Until that feed is connected, the State’s own share of a shortfall cannot be separated from the IGST settlement, and nothing here should be read as an SGST-only figure.':
    'या पडद्यावरील प्रत्येक वसुलीचा आकडा हा एकत्रित कर बेरीज आहे. तो CGST, SGST, IGST व उपकर यांत विभागण्यासाठी कालावधी विवरणपत्र एक्सट्रॅक्ट (returns_period.csv, GSTN विवरणपत्रे) लागतो, ज्यात रोख-विरुद्ध-श्रेय विभागणीसोबत output_tax शीर्षकानुसार विभागलेला असतो. तो स्रोत जोडला जाईपर्यंत तुटीतील राज्याचा स्वतःचा वाटा IGST समायोजनापासून वेगळा करता येत नाही, आणि इथला कोणताही आकडा केवळ SGST चा म्हणून वाचला जाऊ नये.',
  'Shortfall Attribution — Current-Period District Ledger':
    'तुटीची जबाबदारी — चालू कालावधीचा जिल्हा हिशेब',
  'Ranked by rupees of shortfall, with the running cumulative share. Targets and actuals are the district ledger for the current collection period, not the cumulative trend above — the two are different denominators and are not added together anywhere on this screen.':
    'तुटीच्या रुपयांनुसार क्रम, सोबत चालू संचयी वाटा. लक्ष्य व प्रत्यक्ष आकडे हे चालू वसुली कालावधीचा जिल्हा हिशेब आहेत, वरील संचयी कल नव्हे — या दोघांचे भाजक वेगळे आहेत आणि या पडद्यावर ते कुठेही एकत्र जोडलेले नाहीत.',
  '₹{0} Cr total shortfall': 'एकूण ₹{0} कोटींची तूट',
  'No district in view is below its target for the current period.':
    'चालू कालावधीसाठी दृश्यातील कोणताही जिल्हा त्याच्या लक्ष्याखाली नाही.',
  'Audit recovery is what the district has already booked against its gap. Where it covers a small share, the shortfall is a collection problem rather than an enforcement one, and the response differs accordingly.':
    'लेखापरीक्षा वसुली म्हणजे जिल्ह्याने आपल्या तुटीविरुद्ध आधीच नोंदवलेली रक्कम. ती जिथे अल्प वाटा भरून काढते तिथे तूट ही अंमलबजावणीची नव्हे तर वसुलीची समस्या असते, आणि त्यानुसार प्रतिसादही वेगळा असतो.',
  'Shortfall (₹ Cr)': 'तूट (₹ कोटी)',
  'Share of Shortfall': 'तुटीतील वाटा',
  Cumulative: 'संचयी',
  'covers {0}% of the gap': 'तुटीपैकी {0}% भरून काढते',

  /* == Revenue Intelligence — sector ==================================== */
  'Sector Collection Against Its Own Benchmark Ratio':
    'क्षेत्राची वसुली त्याच्याच मानक गुणोत्तराच्या तुलनेत',
  'Tax-to-turnover ratio actually realised by the taxpayers in view, against the reference ratio held for that sector. Absolute sector revenue only says which sectors are large; the deviation says which are underpaying relative to what they themselves declared.':
    'दृश्यातील करदात्यांनी प्रत्यक्षात साधलेले कर-उलाढाल गुणोत्तर, त्या क्षेत्रासाठी ठेवलेल्या संदर्भ गुणोत्तराच्या तुलनेत. एकूण क्षेत्रीय महसूल फक्त कोणती क्षेत्रे मोठी आहेत एवढेच सांगतो; विचलन सांगते की स्वतःच घोषित केलेल्याच्या तुलनेत कोणती क्षेत्रे कमी भरत आहेत.',
  'Search sectors...': 'क्षेत्रे शोधा...',
  'The monthly gap to benchmark is arithmetic: the difference between the sector’s reference tax-to-turnover ratio and the ratio realised by the taxpayers in view, applied to the monthly turnover they declared. It indicates where to look. It is not an assessed liability, and a legitimate rate, exemption or export mix will explain part of it in every sector.':
    'मानकापासूनची मासिक तफावत ही अंकगणित आहे: क्षेत्राचे संदर्भ कर-उलाढाल गुणोत्तर व दृश्यातील करदात्यांनी साधलेले गुणोत्तर यांतील फरक, त्यांनी घोषित केलेल्या मासिक उलाढालीवर लावलेला. ती कुठे पाहावे हे सुचवते. ती निर्धारित दायित्व नाही, आणि प्रत्येक क्षेत्रात वैध दर, सवलत किंवा निर्यातीचे मिश्रण तिचा काही भाग स्पष्ट करेल.',
  'Realised Tax Ratio': 'प्रत्यक्ष कर गुणोत्तर',
  'Sector Benchmark': 'क्षेत्रीय मानक',
  'Monthly Gap to Benchmark': 'मानकापासून मासिक तफावत',
  'Avg Revenue Drop': 'सरासरी महसूल घट',
  'No taxpayers in view': 'दृश्यात कोणतेही करदाते नाहीत',
  '{0} taxpayers in view': 'दृश्यात {0} करदाते',
  'Forecast (Illustrative) — naive trend-based projection for the next 3 months. Statewide: this projection is not narrowed by the header filters.':
    'भाकीत (दर्शनार्थ) — पुढील ३ महिन्यांसाठी साधे कल-आधारित प्रक्षेपण. राज्यव्यापी: हे प्रक्षेपण शीर्ष गाळण्यांनी मर्यादित होत नाही.',
  'Projected {0}-month gap: ₹{1} Cr': 'भाकीत {0}-महिन्यांची तूट: ₹{1} कोटी',
  'Each tile carries the number of taxpayers, their share of the population in view, and the estimated revenue exposed. Click an indicator to filter the register below.':
    'प्रत्येक कार्डावर करदात्यांची संख्या, दृश्यातील संख्येतील त्यांचा वाटा, आणि अंदाजित जोखमीतील महसूल दिलेला आहे. खालील नोंदवही गाळण्यासाठी निर्देशकावर क्लिक करा.',
  'of {0} · {1}%': '{0} पैकी · {1}%',
  '{0} exposed · {1}% of exposure in view': '{0} जोखमीत · दृश्यातील जोखमीच्या {1}%',
  '{0} of {1} taxpayers · {2} exposed': '{1} करदात्यांपैकी {0} · {2} जोखमीत',
  'Leading Indicator': 'प्रमुख निर्देशक',
  'Revenue Exposed': 'जोखमीतील महसूल',
  'Monthly turnover': 'मासिक उलाढाल',
  'Tax paid': 'भरलेला कर',
  'Realised tax ratio': 'प्रत्यक्ष कर गुणोत्तर',
  'sector benchmark {0}%': 'क्षेत्रीय मानक {0}%',

  /* == Revenue Intelligence — briefing note ============================= */
  'REVENUE INTELLIGENCE — COLLECTION AGAINST TARGET':
    'महसूल इंटेलिजन्स — लक्ष्याच्या तुलनेत वसुली',
  'Scope: {0} · {1} · {2} · {3}': 'व्याप्ती: {0} · {1} · {2} · {3}',
  'Collection: {0} ({1}% of target).': 'वसुली: {0} (लक्ष्याच्या {1}%).',
  'Gap against target: ₹{0} Cr ({1}%).': 'लक्ष्याच्या तुलनेत तूट: ₹{0} कोटी ({1}%).',
  'Current-period district ledger: ₹{0} Cr of shortfall across {1} districts; {2} of them carry {3}% of it. Audit recovery booked in those districts: ₹{4} Cr.':
    'चालू कालावधीचा जिल्हा हिशेब: {1} जिल्ह्यांत मिळून ₹{0} कोटींची तूट; त्यांपैकी {2} जिल्हे तिचा {3}% वाहतात. त्या जिल्ह्यांत नोंदवलेली लेखापरीक्षा वसुली: ₹{4} कोटी.',
  '{0} of {1} sectors in view are collecting below their own tax-to-turnover benchmark.':
    'दृश्यातील {1} पैकी {0} क्षेत्रे त्यांच्याच कर-उलाढाल मानकाखाली वसुली करत आहेत.',
  '{0} taxpayers carry a revenue-leakage indicator, with {1} of estimated revenue exposed.':
    '{0} करदात्यांवर महसूल गळतीचा निर्देशक आहे, आणि त्यांच्याकडे {1} अंदाजित महसूल जोखमीत आहे.',
  'Collection is not split by tax head — CGST, SGST, IGST and Cess are not held in this platform.':
    'वसुली कर शीर्षकानुसार विभागलेली नाही — CGST, SGST, IGST व उपकर या मंचावर ठेवलेले नाहीत.',

  /* == Statutory Time Intelligence ====================================== */
  'Revenue lost to limitation is irreversible, unarguable, and attributable to a named officer and date. Of the ₹{0} Cr riding on the {1} proceedings in view, ₹{2} Cr has already passed its deadline — {3}% of the total — and ₹{4} Cr expires within thirty days.':
    'मुदतीमुळे गमावलेला महसूल अपरिवर्तनीय असतो, त्यावर वाद घालता येत नाही, आणि तो नावानिशी अधिकारी व तारखेला जोडता येतो. दृश्यातील {1} कार्यवाहींवर अवलंबून असलेल्या ₹{0} कोटींपैकी ₹{2} कोटींची मुदत आधीच उलटली आहे — एकूणपैकी {3}% — आणि ₹{4} कोटी तीस दिवसांत संपतात.',
  '{0} of {1} proceedings on the register': 'नोंदवहीतील {1} पैकी {0} कार्यवाही',
  'No proceeding in view is still in time': 'दृश्यातील कोणतीही कार्यवाही मुदतीत नाही',
  'Nearest binding deadline: {0} days': 'सर्वात जवळची बंधनकारक मुदत: {0} दिवस',
  '{0} live proceedings await a notice — ₹{1} Cr':
    '{0} सुरू असलेल्या कार्यवाही नोटिशीच्या प्रतीक्षेत — ₹{1} कोटी',
  '₹ Cr · {0} proceedings · {1}% of exposure': '₹ कोटी · {0} कार्यवाही · जोखमीच्या {1}%',
  '₹ Cr · {0} proceedings still open': '₹ कोटी · {0} कार्यवाही अद्याप प्रलंबित',
  '₹{0} Cr across {1} proceedings is already time-barred.':
    '{1} कार्यवाहींत मिळून ₹{0} कोटी आधीच मुदतबाह्य झाले आहेत.',
  'These cannot be revived by effort or by priority — the demand is extinguished by operation of law. The action on them is not recovery but a record of how each came to lapse, since the date and the responsible officer are both on the register.':
    'श्रमाने किंवा प्राधान्यक्रमाने ती पुनरुज्जीवित करता येत नाहीत — कायद्याच्या परिणामाने मागणी नष्ट झाली आहे. त्यांवरील कृती वसुली नसून प्रत्येक कसे निसटले याची नोंद आहे, कारण तारीख व जबाबदार अधिकारी दोन्ही नोंदवहीवर आहेत.',
  '{0} proceedings expiring within 30 days have not yet issued a notice — ₹{1} Cr.':
    '३० दिवसांत संपणाऱ्या {0} कार्यवाहींत अद्याप नोटीस जारी झालेली नाही — ₹{1} कोटी.',
  'Where no notice has issued it is the notice deadline that binds, and it falls months before the order deadline. Once it passes the order deadline is of no use: nothing later in the proceeding can cure it. These are the cases to clear first.':
    'जिथे नोटीस जारी झालेली नाही तिथे नोटिशीची मुदतच बंधनकारक असते, आणि ती आदेशाच्या मुदतीच्या कित्येक महिने आधी येते. ती उलटल्यावर आदेशाची मुदत निरुपयोगी ठरते: कार्यवाहीत त्यानंतर काहीही केले तरी ते भरून निघत नाही. प्रथम हीच प्रकरणे निकालात काढावीत.',
  '{0} proceeding(s) carrying ₹{1} Cr — {2}% of the exposure in view — rest on a contested extension.':
    '₹{1} कोटी वाहणाऱ्या {0} कार्यवाही — दृश्यातील जोखमीच्या {2}% — वादग्रस्त मुदतवाढीवर आधारित आहेत.',
  'Desks carrying the nearest deadlines': 'सर्वात जवळच्या मुदती वाहणारी कार्यासने',
  'Officers holding a proceeding due within 90 days, in view. Limitation attaches to a named officer, so this is the roll-up that decides a reallocation.':
    'दृश्यातील ९० दिवसांत देय असलेली कार्यवाही धारण करणारे अधिकारी. मुदत ही नावानिशी अधिकाऱ्याला जोडलेली असते, त्यामुळे फेरवाटप ठरवणारी हीच बेरीज आहे.',
  'No proceeding in view falls due within 90 days.':
    'दृश्यातील कोणतीही कार्यवाही ९० दिवसांत देय नाही.',
  '{0} due within 90 days · ₹{1} Cr · {2} awaiting a notice':
    '९० दिवसांत देय {0} · ₹{1} कोटी · {2} नोटिशीच्या प्रतीक्षेत',
  '{0} within 30d': '३० दिवसांत {0}',
  'Section mix': 'कलमांचे मिश्रण',
  'Which power each proceeding is running under. The section decides the length of the clock, and s.74 is available only on a finding of fraud, wilful misstatement or suppression.':
    'प्रत्येक कार्यवाही कोणत्या अधिकाराखाली चालू आहे. घड्याळाची लांबी कलम ठरवते, आणि कलम ७४ हे केवळ फसवणूक, जाणीवपूर्वक चुकीचे कथन किंवा माहिती दडवल्याचा निष्कर्ष असेल तरच उपलब्ध असते.',
  'No proceedings in view.': 'दृश्यात कोणत्याही कार्यवाही नाहीत.',
  '{0} time-barred': '{0} मुदतबाह्य',
  '{0} proceedings · none still in time': '{0} कार्यवाही · एकही मुदतीत नाही',
  '{0} proceedings · nearest deadline {1} days': '{0} कार्यवाही · सर्वात जवळची मुदत {1} दिवस',
  'Which divisions carry the nearest deadlines. Statewide roll-up from the limitation engine — this panel is not narrowed by the header filters, unlike every figure above it.':
    'सर्वात जवळच्या मुदती कोणते विभाग वाहतात. मुदत यंत्रणेकडून आलेली राज्यव्यापी बेरीज — वरील प्रत्येक आकड्याप्रमाणे हा फलक शीर्ष गाळण्यांनी मर्यादित होत नाही.',
  'Stage reached': 'गाठलेला टप्पा',
  'Notice issued': 'नोटीस जारी',
  'No notice yet': 'अद्याप नोटीस नाही',
  'Expired {0} days ago': '{0} दिवसांपूर्वी संपली',
  '{0} days — {1}': '{0} दिवस — {1}',
  'No notice has issued, so the notice deadline of {0} is what binds here — not the order deadline of {1}. Once the notice date passes the proceeding cannot be saved by anything done later.':
    'नोटीस जारी झालेली नाही, त्यामुळे इथे {0} ही नोटिशीची मुदतच बंधनकारक आहे — {1} ही आदेशाची मुदत नव्हे. नोटिशीची तारीख उलटल्यावर नंतर काहीही केले तरी कार्यवाही वाचवता येत नाही.',

  /* == Statutory Time Intelligence — briefing note ====================== */
  'STATUTORY TIME INTELLIGENCE — LIMITATION EXPOSURE':
    'सांविधिक मुदत इंटेलिजन्स — मुदतीशी निगडित जोखीम रक्कम',
  'Scope: {0} · {1} · {2} · {3} proceedings of {4} on the register.':
    'व्याप्ती: {0} · {1} · {2} · नोंदवहीतील {4} पैकी {3} कार्यवाही.',
  'Already time-barred: ₹{0} Cr across {1} proceedings — {2}% of the exposure in view. Extinguished by operation of law; not recoverable.':
    'आधीच मुदतबाह्य: {1} कार्यवाहींत मिळून ₹{0} कोटी — दृश्यातील जोखमीच्या {2}%. कायद्याच्या परिणामाने नष्ट; वसूलपात्र नाही.',
  'Expiring within 30 days: ₹{0} Cr across {1} proceedings ({2}% of exposure in view).':
    '३० दिवसांत संपणारे: {1} कार्यवाहींत मिळून ₹{0} कोटी (दृश्यातील जोखमीच्या {2}%).',
  'Expiring within 90 days: ₹{0} Cr across {1} proceedings ({2}% of exposure in view).':
    '९० दिवसांत संपणारे: {1} कार्यवाहींत मिळून ₹{0} कोटी (दृश्यातील जोखमीच्या {2}%).',
  'Of those expiring within 30 days, {0} have not yet issued a notice (₹{1} Cr). The notice deadline binds in those cases and cannot be cured once it passes.':
    '३० दिवसांत संपणाऱ्यांपैकी {0} मध्ये अद्याप नोटीस जारी झालेली नाही (₹{1} कोटी). त्या प्रकरणांत नोटिशीची मुदत बंधनकारक असते आणि ती उलटल्यावर भरून निघत नाही.',
  'Resting on a contested extension: {0} proceedings, ₹{1} Cr ({2}% of exposure in view) — Notification 56/2023-CT, held ultra vires Section 168A by the Gauhati High Court.':
    'वादग्रस्त मुदतवाढीवर आधारित: {0} कार्यवाही, ₹{1} कोटी (दृश्यातील जोखमीच्या {2}%) — अधिसूचना ५६/२०२३-CT, जी गुवाहाटी उच्च न्यायालयाने कलम १६८अ च्या अधिकारक्षेत्राबाहेरची ठरवली.',
  'Live and in time: ₹{0} Cr across {1} proceedings. Nearest binding deadline: {2} days.':
    'सुरू व मुदतीत: {1} कार्यवाहींत मिळून ₹{0} कोटी. सर्वात जवळची बंधनकारक मुदत: {2} दिवस.',

  /* == Revenue at Risk & Recovery ======================================= */
  'The department already produces the signals. By the time a case is worked, the credit has moved downstream, been utilised, and the entity has often stopped trading. Of ₹{0} Cr currently flagged across {1} cases, ₹{2} Cr is still realistically recoverable — the remaining ₹{3} Cr has decayed while the case waited.':
    'विभाग हे संकेत आधीच तयार करतो. प्रकरण हाताळेपर्यंत श्रेय पुढे सरकलेले, वापरले गेलेले असते, आणि तो घटक अनेकदा व्यापारच बंद करून गेलेला असतो. {1} प्रकरणांत सध्या निदर्शनास आणलेल्या ₹{0} कोटींपैकी ₹{2} कोटी अद्याप वास्तवात वसूलपात्र आहेत — उर्वरित ₹{3} कोटींचा प्रकरण वाट पाहत असतानाच क्षय झाला.',
  'No flagged case matches the current header filters. Every figure below reads zero for that reason, not because the exposure has been cleared — widen the filters to see the portfolio.':
    'सध्याच्या शीर्ष गाळण्यांशी कोणतेही निदर्शनास आणलेले प्रकरण जुळत नाही. खालील प्रत्येक आकडा त्याच कारणाने शून्य दाखवतो, जोखीम रक्कम निकालात निघाली म्हणून नव्हे — संपूर्ण संच पाहण्यासाठी गाळण्या रुंद करा.',
  '₹ Cr across {0} cases': '₹ कोटी — {0} प्रकरणांत',
  '₹ Cr · {0}% of flagged exposure': '₹ कोटी · निदर्शनास आणलेल्या जोखमीच्या {0}%',
  '₹ Cr · {0}% of what is still recoverable': '₹ कोटी · अद्याप वसूलपात्र असलेल्याच्या {0}%',
  'Where The Lag Comes From': 'विलंब कुठून येतो',
  'A median lag of {0} days is not one problem. It is a detection floor imposed by the return cycle plus time the case spent waiting after it became visible — and only the second is inside the department’s control this quarter.':
    '{0} दिवसांचा मध्यक विलंब ही एकच समस्या नाही. ती विवरणपत्र चक्राने लादलेली शोधाची किमान मर्यादा, अधिक प्रकरण दिसू लागल्यानंतर ते वाट पाहत घालवलेला काळ — आणि यांपैकी दुसराच या तिमाहीत विभागाच्या नियंत्रणात आहे.',
  'Median detection floor': 'शोधाची मध्यक किमान मर्यादा',
  'Median wait in the queue': 'रांगेतील मध्यक प्रतीक्षा',
  'Internal dwell as a share of elapsed signal age': 'संकेताच्या एकूण वयातील अंतर्गत प्रतीक्षेचा वाटा',
  'summed across every case in view, not a ratio of the two medians':
    'दृश्यातील प्रत्येक प्रकरणावर बेरीज केलेली, दोन मध्यकांचे गुणोत्तर नव्हे',
  'Still inside the {0}-day blockable window': 'अद्याप {0} दिवसांच्या रोखता येण्याजोग्या कालपटात',
  '{0} cases · {1}% of exposure in view': '{0} प्रकरणे · दृश्यातील जोखमीच्या {1}%',
  'Credit passed downstream has typically not been fully utilised. Acting here blocks rather than pursues, which is the cheapest form of recovery the department has.':
    'पुढे दिलेले श्रेय साधारणपणे पूर्णपणे वापरलेले नसते. इथे कारवाई केल्याने पाठलाग करण्याऐवजी ते रोखले जाते, आणि विभागाकडे असलेला वसुलीचा हाच सर्वात स्वस्त प्रकार आहे.',
  'Detectable in time, aged out in the queue': 'वेळेत शोधण्याजोगे, पण रांगेत जुने झालेले',
  'The signal on each of these could fire inside the blockable window, and the case is now past it. Nothing structural caused that — the whole of the delay is dwell after detection, which is the part a change of queue ordering reaches.':
    'यांपैकी प्रत्येकाचा संकेत रोखता येण्याजोग्या कालपटात लागू होऊ शकत होता, आणि प्रकरण आता तो कालपट ओलांडून गेले आहे. यामागे कोणतेही रचनात्मक कारण नाही — संपूर्ण विलंब हा शोधानंतरची प्रतीक्षा आहे, आणि रांगेचा क्रम बदलल्याने नेमका तोच भाग गाठला जातो.',
  'Never catchable inside the window': 'कालपटात कधीच पकडता न येणारे',
  'The slowest rule triggering these cases cannot fire until after the window has closed, however fast the queue moves. Reaching this exposure needs a faster feed — e-way bill and e-invoice flow, which arrive before the return does — not more officer-days.':
    'ही प्रकरणे लागू करणारा सर्वात संथ नियम, रांग कितीही वेगाने चालली तरी, कालपट बंद झाल्याशिवाय लागूच होऊ शकत नाही. या जोखीम रकमेपर्यंत पोहोचण्यासाठी अधिक अधिकारी-दिवस नव्हे तर अधिक जलद स्रोत लागतो — ई-वे बिल व ई-बीजक प्रवाह, जे विवरणपत्राच्या आधी येतात.',
  'Written down': 'निर्लेखित',
  'A like-for-like comparison of two orderings over one week of work — the only variable changed is the order cases are worked in. Computed on the full statewide case set: this comparison is not narrowed by the header filters. Establishment and eligibility are modelled properly in Officer Capacity & Deployment; this screen isolates the effect of ordering alone and should not be read as a capacity plan.':
    'एका आठवड्याच्या कामावर दोन क्रमांची समान तुलना — बदललेले एकमेव चल म्हणजे प्रकरणे कोणत्या क्रमाने हाताळली जातात. संपूर्ण राज्यव्यापी प्रकरण संचावर परिगणित: ही तुलना शीर्ष गाळण्यांनी मर्यादित होत नाही. आस्थापना व पात्रता यांचे योग्य प्रारूप अधिकारी क्षमता व नियुक्ती मध्ये आहे; हा पडदा केवळ क्रमाचा परिणाम वेगळा काढतो आणि तो क्षमता आराखडा म्हणून वाचू नये.',
  'Both columns are measured on the same week of {0} cases — {1} field officers at {2} officer-days per case, taken from the capacity engine rather than restated here.':
    'दोन्ही स्तंभ {0} प्रकरणांच्या त्याच आठवड्यावर मोजले आहेत — {1} क्षेत्रीय अधिकारी, प्रति प्रकरण {2} अधिकारी-दिवस, हे आकडे इथे पुन्हा मांडण्याऐवजी क्षमता यंत्रणेकडून घेतले आहेत.',
  'Signal age is shown split into its two parts: the detection floor of the slowest rule that fired, and the days the case has since waited in the queue. The second column is the one an ordering change moves.':
    'संकेताचे वय त्याच्या दोन भागांत विभागून दाखवले आहे: लागू झालेल्या सर्वात संथ नियमाची शोध किमान मर्यादा, आणि त्यानंतर प्रकरण रांगेत जितके दिवस थांबले ते. क्रम बदलल्याने हलणारा स्तंभ दुसराच आहे.',
  '{0} detection floor + {1} in queue': '{0} शोध किमान मर्यादा + {1} रांगेत',
  '{0}% of exposure': 'जोखमीच्या {0}%',
  'Exposure is never one taxpayer. Credit moves downstream and is utilised hop by hop; once utilised it can no longer be blocked, only recovered. Statewide across all clusters — this panel is not narrowed by the header filters.':
    'जोखीम रक्कम कधीच एका करदात्यापुरती नसते. श्रेय पुढे सरकते आणि टप्प्याटप्प्याने वापरले जाते; एकदा वापरले गेल्यावर ते रोखता येत नाही, फक्त वसूल करता येते. सर्व गटांवर राज्यव्यापी — हा फलक शीर्ष गाळण्यांनी मर्यादित होत नाही.',
  '{0}% of flow': 'प्रवाहाच्या {0}%',
  'The cheapest point on the curve. These indicators are checkable on the day of application rather than reconstructed from invoice flow a year later. Statewide across all new registrations — this panel is not narrowed by the header filters.':
    'वक्रावरील सर्वात स्वस्त बिंदू. हे निर्देशक वर्षभराने बीजक प्रवाहावरून पुन्हा उभे करण्याऐवजी अर्जाच्या दिवशीच तपासता येतात. सर्व नवीन नोंदण्यांवर राज्यव्यापी — हा फलक शीर्ष गाळण्यांनी मर्यादित होत नाही.',
  '{0} raise any indicator': '{0} मध्ये कोणताही निर्देशक उठतो',
  'on the 2+ indicator cohort': '२+ निर्देशक असलेल्या गटावर',
  exposed: 'जोखमीत',
  '₹{0}L': '₹{0} लाख',
  'No cases in view.': 'दृश्यात कोणतीही प्रकरणे नाहीत.',

  /* == Revenue at Risk & Recovery — briefing note ======================= */
  'REVENUE AT RISK & RECOVERY — DECAY POSITION': 'जोखमीतील महसूल व वसुली — क्षय स्थिती',
  'Scope: {0} · {1} · {2} · {3} of {4} flagged cases.':
    'व्याप्ती: {0} · {1} · {2} · निदर्शनास आणलेल्या {4} पैकी {3} प्रकरणे.',
  'Flagged exposure ₹{0} Cr. Still recoverable ₹{1} Cr ({2}%). Already decayed ₹{3} Cr ({4}%).':
    'निदर्शनास आणलेली जोखीम रक्कम ₹{0} कोटी. अद्याप वसूलपात्र ₹{1} कोटी ({2}%). आधीच क्षय झालेले ₹{3} कोटी ({4}%).',
  'Another week of inaction costs ₹{0} Cr — {1}% of what is still recoverable.':
    'आणखी एक आठवडा निष्क्रियतेची किंमत ₹{0} कोटी — अद्याप वसूलपात्र असलेल्याच्या {1}%.',
  'Median signal age {0} days. Median detection floor {1} days; median wait in the queue after detection {2} days. Across the whole set in view, {3}% of elapsed signal age is internal dwell.':
    'संकेताचे मध्यक वय {0} दिवस. शोधाची मध्यक किमान मर्यादा {1} दिवस; शोधानंतर रांगेतील मध्यक प्रतीक्षा {2} दिवस. दृश्यातील संपूर्ण संचावर, संकेताच्या एकूण वयाच्या {3}% अंतर्गत प्रतीक्षा आहे.',
  'Of the exposure in view, {0} is still inside the {1}-day blockable window, {2} was detectable inside it but has aged past it in the queue, and {3} could never have been caught inside it by the current rule set.':
    'दृश्यातील जोखीम रकमेपैकी {0} अद्याप {1} दिवसांच्या रोखता येण्याजोग्या कालपटात आहे, {2} त्या कालपटात शोधण्याजोगी होती पण रांगेत जुनी होऊन तो कालपट ओलांडून गेली, आणि {3} सध्याच्या नियम संचाने त्या कालपटात कधीच पकडली गेली नसती.',
  'The recovery curve is an illustrative model calibrated to stated reasoning, not a measurement of departmental realisation.':
    'वसुली वक्र हे नमूद तर्कानुसार मांडलेले दर्शनार्थ प्रारूप आहे, विभागाच्या प्रत्यक्ष वसुलीचे मोजमाप नाही.',

  /* == Recovery window — short lines ============================ */
  'Every flagged rupee has a recovery half-life. This measures the delay.':
    'प्रत्येक चिन्हांकित रुपयाला वसुलीचे अर्धायुष्य असते. हे पान तो विलंब मोजते.',
  'The signals already exist. What decays is the time before anyone acts.':
    'संकेत आधीच अस्तित्वात आहेत. क्षय होतो तो कोणी कारवाई करेपर्यंतच्या वेळेचा.',
  'Two delays, not one: the detection floor, and the wait after it.':
    'एक नव्हे, दोन विलंब: शोधाची किमान मर्यादा, आणि त्यानंतरची प्रतीक्षा.',
  'Two orderings over one week. The only variable is the order of work.':
    'एका आठवड्यावर दोन क्रम. बदलणारा एकमेव घटक म्हणजे कामाचा क्रम.',
  'Same headcount, same hours — only the ordering differs.':
    'तेच मनुष्यबळ, तेच तास — फरक फक्त क्रमाचा.',
  'Both columns cover the same week, at the capacity engine\'s own figures.':
    'दोन्ही स्तंभ तोच आठवडा व्यापतात, क्षमता यंत्राच्याच आकड्यांवर.',
  'Signal age is split in two. Only queue dwell moves with the ordering.':
    'संकेताचे वय दोन भागांत. क्रमानुसार हलते ती फक्त रांगेतील प्रतीक्षा.',
  'Credit moves downstream hop by hop; once utilised it cannot be blocked.':
    'श्रेय टप्प्याटप्प्याने पुढे सरकते; एकदा वापरले गेल्यावर ते रोखता येत नाही.',
  'The cheapest point on the curve — checkable on the day of application.':
    'वक्रावरील सर्वात स्वस्त बिंदू — अर्जाच्या दिवशीच तपासता येणारा.',

  /* == Revenue intelligence — short lines ============================ */
  'Collection against target, leakage indicators, and near-term risk.':
    'लक्ष्याच्या तुलनेत वसुली, गळतीचे निर्देशक, आणि नजीकच्या काळातील जोखीम.',
  'Each district against its own target. Zero is on target.':
    'प्रत्येक जिल्हा त्याच्या स्वतःच्या लक्ष्याच्या तुलनेत. शून्य म्हणजे लक्ष्यावर.',
  'Combined tax totals. No split by CGST, SGST, IGST or Cess is held.':
    'एकत्रित कर बेरजा. CGST, SGST, IGST किंवा उपकरनिहाय विभागणी उपलब्ध नाही.',
  'Ranked by rupees of shortfall, on the current-period district ledger.':
    'तुटीच्या रुपयांनुसार क्रम, वर्तमान अवधीच्या जिल्हा लेख्यावर.',
  'Audit recovery already booked against the gap.':
    'अंतराच्या तुलनेत आधीच नोंदलेली लेखापरीक्षण वसुली.',
  'What taxpayers actually realised, against their sector\'s own ratio.':
    'करदात्यांनी प्रत्यक्षात मिळवलेले, त्यांच्या क्षेत्राच्या स्वतःच्या गुणोत्तराच्या तुलनेत.',
  'Arithmetic, not an assessed liability. It says where to look.':
    'हे अंकगणित आहे, निर्धारित दायित्व नव्हे. ते कुठे पाहायचे एवढेच सांगते.',
  'An illustrative linear projection, not an official revenue forecast.':
    'दृष्टांतापुरते रेषीय प्रक्षेपण, अधिकृत महसूल पूर्वानुमान नव्हे.',
  'Click an indicator to filter the register below.':
    'खालील नोंदवही गाळण्यासाठी निर्देशकावर क्लिक करा.',

  /* == Statutory time — short lines ============================ */
  'Every open proceeding against its own limitation clock.':
    'प्रत्येक प्रलंबित कार्यवाही तिच्या स्वतःच्या परिसीमा घड्याळाच्या तुलनेत.',
  'Revenue lost to limitation is irreversible and attributable to a date.':
    'परिसीमेमुळे गमावलेला महसूल अपरिवर्तनीय असतो आणि तो तारखेशी जोडता येतो.',
  'Where no notice has issued, the notice deadline binds — months earlier.':
    'जिथे नोटीस बजावलेली नाही तिथे नोटिशीची मुदत बंधनकारक — कित्येक महिने आधीची.',
  'The section decides the length of the clock.':
    'घड्याळाची लांबी धारा ठरवते.',
  'Statewide roll-up — this panel is not narrowed by the filters.':
    'राज्यव्यापी बेरीज — हे पटल गाळण्यांनी मर्यादित होत नाही.',

  /* == Recovery window bands — short lines ============================ */
  'Blocking, not pursuing — the cheapest recovery the department has.':
    'पाठलाग नव्हे, रोखणे — विभागाकडील सर्वात स्वस्त वसुली.',
  'Detectable in time. The whole delay is dwell after detection.':
    'वेळेत पकडता येण्याजोगे. संपूर्ण विलंब हा शोधानंतरची प्रतीक्षा आहे.',
  'Needs a faster feed, not more officer-days.':
    'यासाठी अधिक अधिकारी-दिवस नव्हे, अधिक जलद स्रोत लागतो.',
  'No signal can fire until the return that reveals it is filed.':
    'ते उघड करणारे विवरण दाखल होईपर्यंत कोणताही संकेत लागू होऊ शकत नाही.',
  'Credit is claimed in the same period the supplier declares it.':
    'पुरवठादार ज्या कालावधीत घोषणा करतो त्याच कालावधीत श्रेयाचा दावा केला जातो.',
  'A score-ordered queue sends officers to cases whose value has gone.':
    'गुणांनुसार लावलेली रांग अधिकाऱ्यांना मूल्य संपलेल्या प्रकरणांकडे पाठवते.',
  'These indicators are checkable on the day of application.':
    'हे निर्देशक अर्जाच्या दिवशीच तपासता येतात.',
  'The case waits after the signal is already visible.':
    'संकेत आधीच दिसू लागल्यानंतर प्रकरण वाट पाहत राहते.'
})
