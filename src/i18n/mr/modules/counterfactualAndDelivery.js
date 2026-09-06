import { registerMessages } from '../../locale.js'

/**
 * Marathi — Counterfactual Case Intelligence, Engine Stack, Official Statistics.
 *
 *   counterfactual      → प्रति-तथ्य
 *   queue dwell         → रांगेतील प्रतीक्षा
 *   detection latency   → शोधातील विलंब
 *   recovery curve      → वसुली वक्र
 *   causal claim        → कार्यकारण दावा
 *   engine              → यंत्रणा
 *   hop                 → टप्पा (a single link in the graph spine)
 *   spine               → कणा
 *   provenance          → उगमस्थान
 *   transcribed         → उतरवलेले
 */
registerMessages('mr', {
  /* == Counterfactual Case Intelligence =================================== */
  'Missed Revenue · Counterfactual': 'निसटलेला महसूल · प्रति-तथ्य',
  'What the same action, taken earlier, would have been worth on a given case — with comparable concluded proceedings shown as the evidence behind the comparison. Timing only: what a different escalation route would have produced is a causal claim this platform does not make, and the screen says so.':
    'तीच कृती आधी केली असती तर एखाद्या प्रकरणात तिचे मूल्य किती झाले असते — तुलनेमागील पुरावा म्हणून तुलनात्मक निकाली कार्यवाही दाखवून. केवळ वेळेपुरते: वेगळ्या वाढीव कार्यवाहीच्या मार्गाने काय घडले असते हा कार्यकारण दावा हा मंच करत नाही, आणि पडदा तसे स्पष्ट सांगतो.',
  'Lost to queue dwell': 'रांगेतील प्रतीक्षेमुळे गमावले',
  '₹ Cr — controllable': '₹ कोटी — नियंत्रणीय',
  'Lost to detection latency': 'शोधातील विलंबामुळे गमावले',
  '₹ Cr — data-feed': '₹ कोटी — डेटा स्रोत',
  'Median queue wait': 'रांगेतील मध्यक प्रतीक्षा',
  'signal visible to worked': 'संकेत दिसण्यापासून हाताळण्यापर्यंत',
  '₹ Cr today': '₹ कोटी आज',
  'Where the lag sits across the portfolio': 'संपूर्ण संचात विलंब कुठे आहे',
  'Queue dwell': 'रांगेतील प्रतीक्षा',
  Detection: 'शोध',
  cases: 'प्रकरणे',
  queue: 'रांग',
  signal: 'संकेत',
  'Forgone by waiting': 'प्रतीक्षेमुळे गमावलेले',
  'signal first visible': 'संकेत प्रथम दिसला',
  'The same action, taken on four different days': 'तीच कृती, चार वेगवेगळ्या दिवशी केलेली',
  'Each bar is the recovery curve evaluated at that day. None of them models a different action.':
    'प्रत्येक स्तंभ म्हणजे त्या दिवशी मोजलेला वसुली वक्र. यांपैकी कोणताही वेगळ्या कृतीचे प्रारूप मांडत नाही.',
  'what happened': 'प्रत्यक्षात काय घडले',
  'ceiling — not achievable': 'कमाल मर्यादा — गाठता न येणारी',
  day: 'दिवस',
  'The gap that was controllable': 'नियंत्रणात असलेली तफावत',
  'Acting when the signal first became visible would have preserved {0}. The case was worked {1} days later and {2} remained. The difference, {3}, was lost to queue dwell rather than to anything about the taxpayer.':
    'संकेत प्रथम दिसला तेव्हाच कारवाई केली असती तर {0} शिल्लक राहिले असते. प्रकरण {1} दिवसांनी हाताळले गेले आणि {2} शिल्लक राहिले. यातील {3} इतका फरक करदात्याशी संबंधित कशामुळेही नव्हे, तर रांगेतील प्रतीक्षेमुळे गमावला गेला.',
  'The evidence driving the comparison — concluded cases comparable on the dimensions that decide outcomes, with what actually happened in each.':
    'तुलनेमागील पुरावा — निष्कर्ष ठरवणाऱ्या परिमाणांवर तुलनात्मक असलेली निकाली प्रकरणे, प्रत्येकात प्रत्यक्षात काय घडले यासह.',
  comparability: 'तुलनात्मकता',
  'Timing only — not a different decision': 'केवळ वेळेपुरते — वेगळा निर्णय नव्हे',

  /* == Engine Stack ======================================================= */
  'Governance · Delivery': 'कारभार · अंमलबजावणी',
  'Fifteen intelligence engines mapped against the fields the department can supply today, each classified by technique and given a verdict backed by something checkable. The purpose is to separate what can be built and validated from what would be a promise.':
    'विभाग आज पुरवू शकतो त्या क्षेत्रांशी पंधरा इंटेलिजन्स यंत्रणा जुळवलेल्या, प्रत्येकीचे तंत्रानुसार वर्गीकरण करून तपासता येईल अशा आधारावर निष्कर्ष दिलेला. काय बांधता व पडताळता येईल आणि काय केवळ आश्वासन ठरेल, हे वेगळे करणे हा यामागील हेतू आहे.',
  'It reports on the platform’s engines and the fields available to them, which are properties of the data as a whole rather than of any district or sector.':
    'हे मंचाच्या यंत्रणा व त्यांना उपलब्ध क्षेत्रे यांबाबत अहवाल देते, जी कोणत्याही एका जिल्ह्याची किंवा क्षेत्राची नव्हे तर संपूर्ण डेटाची वैशिष्ट्ये आहेत.',
  Built: 'बांधलेल्या',
  'of {0} engines': '{0} यंत्रणांपैकी',
  Partial: 'अंशतः',
  'the supported half is built': 'आधार असलेला अर्धा भाग बांधलेला',
  Blocked: 'अडलेल्या',
  'missing input, not effort': 'माहितीची कमतरता, श्रमाची नव्हे',
  'Graph hops absent': 'आलेखातील अनुपस्थित टप्पे',
  'of {0} in the spine': 'कण्यातील {0} पैकी',
  '{0} — {1} engines': '{0} — {1} यंत्रणा',
  'What exists': 'काय अस्तित्वात आहे',
  'What is missing': 'काय गहाळ आहे',
  'Open screen': 'पडदा उघडा',
  'On generative AI': 'जनरेटिव्ह AI बाबत',
  'The intelligence graph, hop by hop': 'इंटेलिजन्स आलेख, टप्प्याटप्प्याने',
  '{0} of {1} hops are present, {2} partial and {3} absent. The absent ones are where every cross-entity capability fails.':
    '{1} पैकी {0} टप्पे उपलब्ध आहेत, {2} अंशतः आणि {3} अनुपस्थित. अनुपस्थित टप्प्यांवरच प्रत्येक आंतर-घटक क्षमता अपयशी ठरते.',
  Present: 'उपलब्ध',
  Absent: 'अनुपस्थित',
  'On the architecture': 'रचनेबाबत',
  'Four additions to the 500-case extract, in the order that unlocks most. The first is five columns and unblocks four engines; the modelling for all of them already exists and is waiting on the fields.':
    '५०० प्रकरणांच्या एक्सट्रॅक्टमध्ये चार भर, सर्वाधिक खुले करणाऱ्या क्रमाने. पहिली भर पाच स्तंभांची असून ती चार यंत्रणा मोकळ्या करते; या सर्वांचे प्रारूप आधीच तयार असून केवळ क्षेत्रांची वाट पाहत आहे.',
  Unlocks: 'काय खुले करते',

  /* == Official Statistics ================================================ */
  'Governance · Data Provenance': 'कारभार · डेटा उगमस्थान',
  'Published government figures, carried here with their source, their period and the date they were read. These are the only real numbers in the platform — every other figure on every other screen is generated demonstration data.':
    'शासनाने प्रसिद्ध केलेले आकडे, त्यांचा स्रोत, कालावधी व ते वाचल्याची तारीख यांसह येथे दिलेले. मंचावरील हेच फक्त खरे आकडे आहेत — इतर प्रत्येक पडद्यावरील इतर प्रत्येक आकडा हा निर्माण केलेला प्रात्यक्षिक डेटा आहे.',
  'The figures here are published statewide totals from CBIC, PIB and mahagst.gov.in, and cannot be narrowed to a division or sector without misrepresenting them.':
    'येथील आकडे हे CBIC, PIB व mahagst.gov.in यांनी प्रसिद्ध केलेल्या राज्यव्यापी एकूण रकमा आहेत, आणि त्यांचा विपर्यास केल्याशिवाय ते एका विभागापुरते किंवा क्षेत्रापुरते मर्यादित करता येत नाहीत.',
  'What this demonstration is, to scale': 'हे प्रात्यक्षिक प्रमाणात नेमके काय आहे',
  'This platform models {0} taxpayers across {1} districts. Maharashtra has {2} registered SGST dealers across {3} districts. The demonstration is roughly one taxpayer for every {4} real ones — it is built to show how the workflow behaves, not to represent the state’s book.':
    'हा मंच {1} जिल्ह्यांतील {0} करदात्यांचे प्रारूप मांडतो. महाराष्ट्रात {3} जिल्ह्यांत {2} नोंदणीकृत SGST व्यापारी आहेत. म्हणजे प्रात्यक्षिकात दर {4} खऱ्या करदात्यांमागे साधारण एक — हे कार्यप्रवाह कसा वागतो हे दाखवण्यासाठी बांधलेले आहे, राज्याचा हिशेब मांडण्यासाठी नाही.',
  'Taxpayers modelled': 'प्रारूपातील करदाते',
  'Registered SGST dealers': 'नोंदणीकृत SGST व्यापारी',
  'as at {0}': '{0} रोजी',
  'Districts modelled': 'प्रारूपातील जिल्हे',
  'Districts in Maharashtra': 'महाराष्ट्रातील जिल्हे',
  'Published figures': 'प्रसिद्ध आकडे',
  'Read on {0}. Each figure links to the publication that states it.':
    '{0} रोजी वाचलेले. प्रत्येक आकडा तो नमूद करणाऱ्या प्रकाशनाशी जोडलेला आहे.',
  'Official source': 'अधिकृत स्रोत',
  'Sources not yet transcribed': 'अद्याप न उतरवलेले स्रोत',
  'Named as authoritative but not read into the platform. Listed with no figures attached — an unread source gets a link, never an estimate.':
    'प्रामाणिक म्हणून नमूद केलेले पण मंचात वाचून घेतलेले नाहीत. कोणतेही आकडे न जोडता यादीत दिलेले — न वाचलेल्या स्रोताला दुवा मिळतो, अंदाज कधीच नाही.',
  Official: 'अधिकृत'
})
