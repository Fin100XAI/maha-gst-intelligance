import { registerMessages } from '../../locale.js'

/**
 * Hindi — Unknown Risk Discovery, Network Enforcement, ITC Risk
 * Intelligence, E-Way Bill Intelligence, Compliance Early Warning and
 * Refund Risk Intelligence.
 *
 *   unflagged            → अचिह्नित
 *   unassessed           → अमूल्यांकित (never “निर्दोष”)
 *   peer norm            → समकक्ष मानक
 *   cut / cut point      → छेद / छेद-बिंदु (the entity a chain is broken at)
 *   blockable            → रोकने-योग्य
 *   utilised             → उपयोग किया गया
 *   chain                → श्रृंखला
 *   lead strength        → सुराग की शक्ति
 *   consignment          → खेप
 *   unmatched            → अमेलित
 *   alert                → चेतावनी
 *   inflow               → आवक
 *   claim                → दावा
 *   sanction             → स्वीकृति
 *   percentage point     → प्रतिशत बिंदु (pp)
 *
 * Form identifiers stay in Latin — GSTR-1, e-way bill, GSTIN.
 */
registerMessages('hi', {
  /* == Unknown Risk Discovery ============================================ */
  'of {0} taxpayers ({1}%) — trigger no encoded rule':
    '{0} करदाताओं में से ({1}%) — कोई कूटबद्ध नियम लागू नहीं होता',
  'Actually measured against peers': 'वास्तव में समकक्षों के सापेक्ष मापे गए',
  'of {0} screened — {1} sit in sectors too small to norm and are unassessed, not cleared':
    'छँटाई किए गए {0} में से — {1} ऐसे क्षेत्रों में हैं जो मानक निकालने भर बड़े नहीं; वे अमूल्यांकित हैं, निर्दोष घोषित नहीं',
  '{0}% of those screened — {1} recurring signatures worth encoding':
    'छँटाई किए गए में से {0}% — कूटबद्ध करने योग्य {1} पुनरावृत्त अभिलक्षण',
  'Closest approach to the threshold': 'सीमा के सर्वाधिक निकट',
  'highest unflagged deviation — {0} short of the {1} cut, on {2}':
    'अचिह्नितों में सर्वाधिक विचलन — {1} की सीमा से {0} कम, {2} पर',
  'Who was actually measured': 'वास्तव में किसका मापन हुआ',
  '{0} of the {1} screened taxpayers were scored against a peer norm. The remaining {2} were not — the answer for them is "unknown", not "clean".':
    'छँटाई किए गए {1} करदाताओं में से {0} को समकक्ष मानक के सापेक्ष अंक दिए गए। शेष {2} को नहीं — उनके लिए उत्तर "अज्ञात" है, "निर्दोष" नहीं।',
  'Every screened taxpayer sits in a sector large enough to carry a peer norm, so the screen covers the whole unflagged population.':
    'छँटाई किया गया प्रत्येक करदाता समकक्ष मानक उठा सकने भर बड़े क्षेत्र में है, इसलिए यह छँटाई पूरी अचिह्नित संख्या को समेटती है।',
  'Sector with no peer norm': 'समकक्ष मानक रहित क्षेत्र',
  'Taxpayers in sector': 'क्षेत्र के करदाता',
  '{0} — below the minimum of {1}': '{0} — न्यूनतम {1} से कम',
  'Unassessed among the screened': 'छँटाई किए गए में अमूल्यांकित',
  'Exposure they carry': 'वे जो जोखिम राशि वहन करते हैं',
  'These {0} taxpayers carry {1} of exposure and were never scored, because a peer median drawn from fewer than {2} businesses is not a norm. The action is a wider extract for these sectors — statewide rather than pilot — not a lower minimum group size, which would replace an honest gap with a fabricated benchmark.':
    'ये {0} करदाता {1} जोखिम राशि वहन करते हैं और उन्हें कभी अंक नहीं दिए गए, क्योंकि {2} से कम व्यवसायों से निकाला गया समकक्ष मध्यक मानक नहीं होता। इस पर कार्रवाई है इन क्षेत्रों हेतु व्यापक एक्सट्रैक्ट — प्रायोगिक नहीं, राज्यव्यापी — न्यूनतम समूह आकार घटाना नहीं, जिससे ईमानदार कमी की जगह गढ़ा हुआ मानक बैठ जाएगा।',
  'Shortfall against the {0} cut': '{0} की सीमा से कमी',
  'reaches it': 'वहाँ तक पहुँचता है',
  '{0} short': '{0} कम',
  'Flagged reach, as a multiple of unflagged': 'अचिह्नितों की तुलना में चिह्नितों की पहुँच, गुणकों में',
  '{0}×': '{0}×',
  'The nearest miss is {0}, where the most extreme unflagged taxpayer reaches {1} — {2} below the cut. How narrow that gap is does not change what should be done with it. The threshold is the Iglewicz–Hoaglin convention, not a dial set to whatever makes this screen produce output, and moving it far enough to catch a near miss would report every ordinary business at that same distance from its peers as a discovery.':
    'सबसे कम अंतर से चूका {0} है, जहाँ सर्वाधिक चरम अचिह्नित करदाता {1} तक पहुँचता है — सीमा से {2} कम। वह अंतर कितना सँकरा है, इससे उसका क्या किया जाए यह नहीं बदलता। यह सीमा Iglewicz–Hoaglin की प्रचलित परिपाटी है — यह पर्दा कुछ न कुछ परिणाम दे, इसके लिए घुमाया जाने वाला बटन नहीं; और उसे इतना खिसकाना कि थोड़े से चूका प्रकरण पकड़ में आए, अपने समकक्षों से उतनी ही दूरी पर खड़े प्रत्येक साधारण व्यवसाय को खोज बताकर दर्ज कर देगा।',

  /* == Network Enforcement ============================================== */
  'across {0} divisions': '{0} संभागों में',
  '{0} entities · {1} chains span more than one division, up to {2}':
    '{0} इकाइयाँ · {1} श्रृंखलाएँ एक से अधिक संभागों में फैली हैं, अधिकतम {2} तक',
  '₹ Cr — {0}% of the credit in these chains; the other {1}% is already utilised':
    '₹ करोड़ — इन श्रृंखलाओं के श्रेय का {0}%; शेष {1}% का उपयोग पहले ही हो चुका है',
  'of {0} entities ({1}%), across {2} of {3} chains — acting on one changes nothing':
    '{0} इकाइयों में से ({1}%), {3} में से {2} श्रृंखलाओं में — किसी एक पर कार्रवाई से कुछ नहीं बदलता',
  'of {0} chains — {1} Cr blockable behind a division with no investigation officer':
    '{0} श्रृंखलाओं में से — जाँच अधिकारी रहित संभाग के पीछे {1} करोड़ रोकने-योग्य',
  'Act first on {0}: it carries the largest blockable value of any chain that every division in its span can close on one date — {1} across {2} divisions, {3} days old.':
    'पहले {0} पर कार्रवाई करें: जिन श्रृंखलाओं को उनके विस्तार का प्रत्येक संभाग एक ही तिथि पर बंद कर सकता है, उनमें सबसे अधिक रोकने-योग्य मूल्य इसी में है — {2} संभागों में मिलाकर {1}, आयु {3} दिन।',
  'Cut point: {0}': 'छेद-बिंदु: {0}',
  'Which chain first': 'पहले कौन-सी श्रृंखला',
  'Ranked by blockable value. A chain is only workable this week if its cut point sits in a division with an officer who may act — the last two columns decide that, and they override the first.':
    'रोकने-योग्य मूल्य के अनुसार क्रम। श्रृंखला इस सप्ताह तभी हाथ में ली जा सकती है जब उसका छेद-बिंदु ऐसे संभाग में हो जहाँ कार्रवाई कर सकने वाला अधिकारी हो — यह अंतिम दो स्तंभ तय करते हैं, और वे पहले स्तंभ पर भारी पड़ते हैं।',
  Chain: 'श्रृंखला',
  '{0} entities · {1} divisions': '{0} इकाइयाँ · {1} संभाग',
  '{0}% of this chain’s credit': 'इस श्रृंखला के श्रेय का {0}%',
  'Where the cut works': 'छेद कहाँ काम करता है',
  '{0}% of chain invoice value sits on its edges': 'श्रृंखला के बीजक मूल्य का {0}% उसके किनारों पर है',
  'No single cut works — group action only': 'कोई एक छेद पर्याप्त नहीं — केवल सामूहिक कार्रवाई',
  'Margin over the next option': 'अगले विकल्प पर बढ़त',
  'only one effective cut': 'केवल एक ही प्रभावी छेद',
  '{0}% better': '{0}% बेहतर',
  'Entities that would not stop it': 'जिन इकाइयों पर कार्रवाई से वह नहीं रुकेगी',
  'Workable now?': 'अभी हाथ में ली जा सकती है?',
  'Cut point has no officer': 'छेद-बिंदु पर कोई अधिकारी नहीं',
  'Cut is covered, span is not': 'छेद पर अधिकारी है, पूरे विस्तार पर नहीं',
  'The margin column is the one most easily missed. Where it is small, the ranking between the recommended entity and the next is inside the noise of the lead-strength weights, and the choice should be made on evidence an officer holds rather than on this ordering.':
    'बढ़त वाला स्तंभ ही सबसे आसानी से नज़र से चूकता है। जहाँ वह छोटी है, वहाँ संस्तुत इकाई और अगली इकाई का क्रम सुराग-शक्ति के भारों के शोर के भीतर ही होता है, और चुनाव इस क्रम पर नहीं बल्कि अधिकारी के पास मौजूद प्रमाण पर होना चाहिए।',
  '{0} still blockable ({1}% of this chain’s credit; {2} already utilised) of {3} that moved through the chain · signal age {4} days · {5} divisions':
    'श्रृंखला से गुज़रे {3} में से {0} अब भी रोकने-योग्य (इस श्रृंखला के श्रेय का {1}%; {2} का उपयोग पहले ही) · संकेत की आयु {4} दिन · {5} संभाग',
  'Lead strength {0} of a possible 0.95': 'सुराग की शक्ति {0}, संभव 0.95 में से',
  'No investigation officer in this division': 'इस संभाग में कोई जाँच अधिकारी नहीं',
  '{0} of invoice value sits on the edges this entity is party to — {1}% of the {2} moving through the chain.':
    'यह इकाई जिन किनारों में पक्षकार है उन पर {0} बीजक मूल्य है — श्रृंखला से गुज़रते {2} का {1}%।',
  'Lead built from': 'सुराग किस आधार पर बना',
  'Scores {0}% above the next effective cut, {1}. Below roughly 10% that ordering is inside the noise of the lead weights and should not decide the target on its own.':
    'अगले प्रभावी छेद, यानी {1}, से {0}% अधिक अंक। लगभग 10% से नीचे यह क्रम सुराग भारों के शोर के भीतर ही होता है और उसे अकेले लक्ष्य तय नहीं करना चाहिए।',
  'The only entity in this chain whose removal stops the circulation — there is no second option to weigh it against.':
    'इस श्रृंखला की एकमात्र इकाई जिसे हटाने पर परिचालन रुक जाता है — इसके साथ तौलने के लिए कोई दूसरा विकल्प है ही नहीं।',
  'Division — officer available?': 'संभाग — अधिकारी उपलब्ध?',
  'Share of chain value': 'श्रृंखला मूल्य में अंश',
  'No investigation officer is posted in {0} — {1} of the {2} divisions this chain crosses. This chain cannot be closed as a unit until one is: a deployment decision, not a scheduling one.':
    '{0} में कोई जाँच अधिकारी तैनात नहीं है — यह श्रृंखला जिन {2} संभागों से गुज़रती है उनमें से {1}। जब तक तैनाती न हो, यह श्रृंखला एक इकाई के रूप में बंद नहीं की जा सकती: यह तैनाती का निर्णय है, समय-सारणी का नहीं।',
  'The gap falls on the cut point itself: {0}, the only entity ranked worth acting against here, sits in {1}. Posting an officer there is what unlocks {2}, not better scheduling.':
    'यह कमी ठीक छेद-बिंदु पर ही पड़ती है: यहाँ कार्रवाई-योग्य आँकी गई एकमात्र इकाई {0}, {1} में है। {2} को खोलती है वहाँ अधिकारी की तैनाती, बेहतर समय-सारणी नहीं।',
  '{0} days — one division per week across {1}': '{0} दिन — {1} में प्रति सप्ताह एक संभाग',
  '{0} — {1}% of what is still blockable': '{0} — अब भी रोकने-योग्य का {1}%',
  'signal age {0}d · {1} already utilised': 'संकेत की आयु {0} दि · {1} का उपयोग पहले ही',
  'If each chain were worked one division per week rather than on a single date — {0}% of the {1} Cr still blockable.':
    'यदि प्रत्येक श्रृंखला एक ही तिथि के बजाय प्रति सप्ताह एक संभाग की गति से निपटाई जाए — अब भी रोकने-योग्य {1} करोड़ का {0}%।',
  'Utilised downstream and no longer blockable by any action — {0}% of the {1} Cr of credit these chains carried, and {2}× everything coordination could still save.':
    'आगे के चरणों में उपयोग हो चुका और अब किसी भी कार्रवाई से न रोका जा सकने वाला — इन श्रृंखलाओं द्वारा वहन किए गए {1} करोड़ श्रेय का {0}%, और समन्वय से अब भी बचाई जा सकने वाली पूरी राशि का {2}×।',

  /* == ITC Risk Intelligence ============================================ */
  'Input tax credit scored against the filing and payment behaviour of the entity claiming it. Every ratio here is set against the benchmark for that taxpayer’s own sector, because credit intensity is a property of the trade before it is a property of the taxpayer.':
    'निविष्ट कर श्रेय को उसका दावा करने वाली इकाई के विवरणी एवं भुगतान व्यवहार के सापेक्ष आँका गया है। यहाँ का प्रत्येक अनुपात उस करदाता के अपने क्षेत्र के मानक के सापेक्ष रखा गया है, क्योंकि श्रेय की सघनता करदाता का गुण होने से पहले उस व्यापार का गुण होती है।',
  'ITC behind a risk signal': 'जोखिम संकेत के पीछे ITC',
  'Cr of ₹{0} Cr claimed in scope — {1}% of the credit':
    'दायरे में दावा किए गए ₹{0} करोड़ में से करोड़ — श्रेय का {1}%',
  'Taxpayers carrying an ITC signal': 'ITC संकेत रखने वाले करदाता',
  'of {0} in scope ({1}%) — the statewide rate is {2}%':
    'दायरे के {0} में से ({1}%) — राज्यव्यापी दर {2}% है',
  'ITC-to-turnover against sector benchmark': 'क्षेत्रीय मानक के सापेक्ष ITC-से-कारोबार',
  'against a {0}% benchmark for this mix of sectors — {1} pp above':
    'क्षेत्रों के इस मिश्रण हेतु {0}% मानक के सापेक्ष — {1} प्रतिशत बिंदु ऊपर',
  'against a {0}% benchmark for this mix of sectors — {1} pp below':
    'क्षेत्रों के इस मिश्रण हेतु {0}% मानक के सापेक्ष — {1} प्रतिशत बिंदु नीचे',
  'Concentration of flagged credit': 'चिह्नित श्रेय का संकेंद्रण',
  'of flagged ITC sits with the {0} largest claimants — where officer time returns most':
    'चिह्नित ITC में से इतना {0} सबसे बड़े दावेदारों के पास है — जहाँ अधिकारी के समय का प्रतिफल सर्वाधिक है',
  'Credit intensity against filing and payment behaviour':
    'विवरणी एवं भुगतान व्यवहार के सापेक्ष श्रेय की सघनता',
  'The combination this module exists to surface: credit taken now, by an entity whose return and payment behaviour does not support it. Read the last column first.':
    'यह मॉड्यूल जिस संयोग को सामने लाने के लिए है वही: अभी लिया गया श्रेय, और ऐसी इकाई जिसका विवरणी एवं भुगतान व्यवहार उसका समर्थन नहीं करता। अंतिम स्तंभ पहले पढ़ें।',
  'Filing behaviour': 'विवरणी व्यवहार',
  '{0}% of those in scope': 'दायरे में से {0}%',
  'ITC / turnover vs benchmark': 'ITC / कारोबार बनाम मानक',
  'Tax paid / turnover vs benchmark': 'भुगतान किया कर / कारोबार बनाम मानक',
  'ITC claimed': 'दावा किया गया ITC',
  '{0}% of credit in scope': 'दायरे के श्रेय का {0}%',
  'Credit held against headcount': 'संख्या के सापेक्ष धारित श्रेय',
  'A value above 1.0 in the last column means that filing class holds more of the credit than its share of the taxpayers — credit concentrating in the group least able to substantiate it. Below 1.0 it is the opposite, and the class is not where scrutiny belongs. The comparison is only valid inside the current filters: narrow to a district and the benchmark column moves with the sector mix of that district.':
    'अंतिम स्तंभ में 1.0 से ऊपर का मान बताता है कि उस विवरणी वर्ग के पास करदाताओं में अपने अंश से अधिक श्रेय है — यानी श्रेय उसी समूह में सिमट रहा है जो उसे प्रमाणित करने में सबसे कम सक्षम है। 1.0 से नीचे इसका उल्टा, और उस वर्ग में छानबीन का स्थान नहीं। यह तुलना केवल वर्तमान फ़िल्टरों के भीतर ही मान्य है: किसी एक ज़िले तक सीमित करने पर मानक स्तंभ भी उस ज़िले के क्षेत्र-मिश्रण के साथ हिल जाता है।',
  'ITC-to-turnover deviation by sector': 'क्षेत्रवार ITC-से-कारोबार विचलन',
  'Bar height is the gap in percentage points between the ratio actually claimed in scope and that sector’s benchmark. Colour is the concentration of High / Critical taxpayers in the sector.':
    'स्तंभ की ऊँचाई दायरे में वास्तव में दावा किए गए अनुपात और उस क्षेत्र के मानक के बीच प्रतिशत बिंदुओं का अंतर है। रंग उस क्षेत्र में उच्च / गंभीर करदाताओं का संकेंद्रण है।',
  'Taxpayers in scope': 'दायरे के करदाता',
  'ITC / turnover claimed': 'दावा किया गया ITC / कारोबार',
  'ITC / turnover': 'ITC / कारोबार',
  'Sector benchmark': 'क्षेत्रीय मानक',
  Gap: 'अंतर',
  '+{0} pp': '+{0} प्रतिशत बिंदु',
  '{0} pp': '{0} प्रतिशत बिंदु',
  'A positive gap is worth an analyst’s attention only where the taxpayer count behind it is large enough to mean something — a sector carrying three taxpayers in scope will swing several percentage points on one claim, and that is variance rather than a finding.':
    'धनात्मक अंतर विश्लेषक के ध्यान योग्य तभी है जब उसके पीछे करदाताओं की संख्या अर्थपूर्ण होने भर बड़ी हो — दायरे में तीन करदाता रखने वाला क्षेत्र एक ही दावे पर कई प्रतिशत बिंदु हिल जाएगा, और वह उतार-चढ़ाव है, निष्कर्ष नहीं।',
  'No taxpayers match the current filters, so no sector comparison can be drawn.':
    'वर्तमान फ़िल्टर से कोई करदाता मेल नहीं खाता, इसलिए कोई क्षेत्रीय तुलना नहीं निकाली जा सकती।',
  '{0} of {1} taxpayers in scope ({2}%), carrying ₹{3} Cr of claimed credit.':
    'दायरे के {1} में से {0} करदाता ({2}%), ₹{3} करोड़ दावा किया गया श्रेय वहन करते हुए।',
  'What to do': 'क्या करें',
  'no sector benchmark on record': 'अभिलेख पर क्षेत्रीय मानक नहीं',
  '{0}% benchmark · {1}× it': '{0}% मानक · उसका {1}×',
  '{0}% benchmark': '{0}% मानक',
  'Supplier risk: {0}': 'आपूर्तिकर्ता जोखिम: {0}',
  'Exposure ₹{0} L': 'जोखिम राशि ₹{0} लाख',
  '₹{0} L exposure': '₹{0} लाख जोखिम राशि',
  'Evidence — {0} of the {1} encoded rules triggered':
    'प्रमाण — {1} कूटबद्ध नियमों में से {0} लागू हुए',
  '(+{0} of {1} points)': '({1} में से +{0} अंक)',
  'Period {0} ({1} – {2})': 'अवधि {0} ({1} – {2})',

  /* == E-Way Bill Intelligence ========================================== */
  '{0} ({1}) generated e-way bills valued at ₹{2} L across {3} movement record(s) in the {4} district, of which {5} ({6}% of the value, ₹{7} L) were not matched to filed returns. The unmatched share across the whole feed is {8}%.':
    '{0} ({1}) ने {4} ज़िले में {3} परिवहन अभिलेखों में मिलाकर ₹{2} लाख मूल्य के ई-वे बिल बनाए, जिनमें से {5} ({6}% मूल्य, ₹{7} लाख) दाखिल विवरणियों से मेल नहीं खाए। पूरे स्रोत में अमेलित अंश {8}% है।',
  'Current taxpayer risk rating: {0} ({1}/100). Sector: {2}. Filing behaviour: {3}. Declared movement stands at {4}× declared turnover on the return record.':
    'वर्तमान करदाता जोखिम मानांकन: {0} ({1}/100)। क्षेत्र: {2}। विवरणी व्यवहार: {3}। विवरणी अभिलेख पर घोषित कारोबार के {4}× के बराबर घोषित परिवहन है।',
  'Movement not matched to a return': 'विवरणी से मेल न खाता परिवहन',
  '{0}% of their ₹{1} L moved': 'उनके द्वारा भेजे गए ₹{1} लाख का {0}%',
  Consignments: 'खेपें',
  '{0} unmatched of {1}': '{1} में से {0} अमेलित',
  '{0} cancelled · {1} flagged': '{0} रद्द · {1} चिह्नित',
  'not on record': 'अभिलेख पर नहीं',
  'Declared movement / turnover': 'घोषित परिवहन / कारोबार',
  'Transit records checked against filings. The question this screen answers is how much declared goods movement has no filed return behind it, whose movement that is, and how that compares with the rest of the state.':
    'परिवहन अभिलेख दाखिल विवरणियों से मिलाकर जाँचे गए। यह पर्दा जिस प्रश्न का उत्तर देता है वह है: घोषित माल परिवहन में से कितने के पीछे कोई दाखिल विवरणी ही नहीं, वह परिवहन किसका है, और शेष राज्य की तुलना में वह कैसा दिखता है।',
  'Movement with no matching return': 'मेल खाती विवरणी रहित परिवहन',
  '₹ Lakh of ₹{0} L moved in scope — {1}% of the value, against {2}% of records statewide':
    'दायरे में भेजे गए ₹{0} लाख में से ₹ लाख — मूल्य का {1}%, जबकि राज्यव्यापी अभिलेखों का {2}%',
  'Taxpayers behind the unmatched movement': 'अमेलित परिवहन के पीछे के करदाता',
  'of {0} with movement in scope — this, not the consignment, is the unit of action':
    'दायरे में परिवहन रखने वाले {0} में से — कार्रवाई की इकाई खेप नहीं, यही है',
  'Records carrying an anomaly flag': 'विसंगति चिह्न वाले अभिलेख',
  'of {0} records ({1}%) — the statewide rate is {2}%':
    '{0} अभिलेखों में से ({1}%) — राज्यव्यापी दर {2}% है',
  'Cancellation rate': 'रद्द होने की दर',
  '% — {0} of {1} records, ₹{2} L cancelled; statewide {3}%':
    '% — {1} में से {0} अभिलेख, ₹{2} लाख रद्द; राज्यव्यापी {3}%',
  'Unmatched movement value by period': 'अवधिवार अमेलित परिवहन मूल्य',
  'Value with no matching filed return, against a total of ₹{0} L moved in scope. Total movement rises and falls with trade; the unmatched share is what an officer is being asked to act on.':
    'मेल खाती दाखिल विवरणी रहित मूल्य, दायरे में भेजे गए कुल ₹{0} लाख के सापेक्ष। कुल परिवहन व्यापार के साथ घटता-बढ़ता है; अधिकारी को जिस पर कार्रवाई करनी है वह अमेलित अंश है।',
  '{0}: ₹{1} L unmatched of ₹{2} L ({3}%)': '{0}: ₹{2} लाख में से ₹{1} लाख अमेलित ({3}%)',
  'District-wise unmatched rate': 'ज़िलावार अमेलित दर',
  'Share of each district’s consignments with no matching return. The statewide rate is {0}% — a district below it is not a priority however many records it carries.':
    'प्रत्येक ज़िले की खेपों में से मेल खाती विवरणी रहित खेपों का अंश। राज्यव्यापी दर {0}% है — उससे नीचे का ज़िला चाहे कितने भी अभिलेख रखता हो, प्राथमिकता नहीं है।',
  'Bars above {0}% are above the statewide unmatched rate. Districts with very few records will sit at 0% or 100% for reasons that are not risk — read the record count alongside.':
    '{0}% से ऊपर के स्तंभ राज्यव्यापी अमेलित दर से ऊपर हैं। बहुत कम अभिलेख वाले ज़िले जोखिम के अलावा अन्य कारणों से 0% या 100% पर बैठेंगे — साथ में अभिलेखों की संख्या भी पढ़ें।',
  'Taxpayers ranked by unmatched movement': 'अमेलित परिवहन के अनुसार करदाताओं का क्रम',
  '{0} taxpayers with at least one unmatched, cancelled or flagged consignment, ranked by the value with no return behind it.':
    'कम-से-कम एक अमेलित, रद्द अथवा चिह्नित खेप वाले {0} करदाता, जिनके पीछे कोई विवरणी नहीं ऐसे मूल्य के अनुसार क्रमबद्ध।',
  'No taxpayer in the current filters carries an unmatched, cancelled or flagged consignment.':
    'वर्तमान फ़िल्टर के किसी करदाता के पास अमेलित, रद्द अथवा चिह्नित खेप नहीं है।',
  'Not available on this platform: a period reconciliation of consignment value against declared outward supply. The e-way feed here carries individual consignments dated across a rolling window, while the return record carries a single monthly turnover figure per taxpayer — summing one against the other would compare two different periods and produce a mismatch out of arithmetic rather than behaviour. The match status shown is the one the e-way feed itself carries. A true reconciliation needs GSTR-1 outward supply at invoice level for the same tax period, which this platform does not hold. The "declared movement / turnover" column is the one like-for-like ratio available, and it comes from the taxpayer’s own return record rather than from these consignments.':
    'इस मंच पर उपलब्ध नहीं: घोषित बहिर्गामी आपूर्ति के सापेक्ष खेप मूल्य का अवधिवार मिलान। यहाँ का ई-वे स्रोत सरकते कालपट में अलग-अलग तिथियों की स्वतंत्र खेपें रखता है, जबकि विवरणी अभिलेख प्रति करदाता एक ही मासिक कारोबार आँकड़ा रखता है — एक की दूसरे से जोड़ दो भिन्न अवधियों की तुलना करेगी और व्यवहार से नहीं, अंकगणित से विसंगति पैदा करेगी। दिखाई गई मिलान-स्थिति वही है जो ई-वे स्रोत स्वयं रखता है। सच्चे मिलान के लिए उसी कर-अवधि की बीजक-स्तरीय GSTR-1 बहिर्गामी आपूर्ति चाहिए, जो इस मंच के पास नहीं है। "घोषित परिवहन / कारोबार" ही एकमात्र समरूप अनुपात उपलब्ध स्तंभ है, और वह इन खेपों से नहीं बल्कि करदाता के अपने विवरणी अभिलेख से आता है।',
  'Consignment register': 'खेप पंजी',
  '{0} of {1} records in scope carry an anomaly flag, a cancellation, or no matching return. Use this to check a specific movement; use the ranking above to decide who to open.':
    'दायरे के {1} में से {0} अभिलेखों पर विसंगति चिह्न, रद्दीकरण, अथवा मेल खाती विवरणी ही नहीं है। किसी विशिष्ट परिवहन की जाँच हेतु इसका प्रयोग करें; किस पर प्रकरण खोलना है यह तय करने हेतु ऊपर का क्रम देखें।',
  Age: 'आयु',

  /* == Compliance Early Warning ========================================= */
  'Non-filers and slipping compliance, surfaced before the shortfall compounds. Every alert below carries how long it has been open and what is at stake behind it, because an early warning that has sat unworked for a quarter is no longer early.':
    'विवरणी न भरने वाले और फिसलता अनुपालन, कमी के चक्रवृद्धि होने से पहले सामने लाए गए। नीचे की प्रत्येक चेतावनी के साथ वह कितने समय से लंबित है और उसके पीछे क्या दाँव पर है, यह दिया है — क्योंकि एक तिमाही तक बिना काम पड़ी रही पूर्व-चेतावनी अब पूर्व नहीं रहती।',
  'Unresolved alerts': 'अनिस्तारित चेतावनियाँ',
  'of {0} in scope ({1}%) — ₹{2} Cr of exposure across {3} taxpayers':
    'दायरे के {0} में से ({1}%) — {3} करदाताओं में मिलाकर ₹{2} करोड़ जोखिम राशि',
  'Open non-filer alerts': 'विवरणी न भरने की लंबित चेतावनियाँ',
  '{0} taxpayers carrying ₹{1} Cr of monthly turnover with no return filed — the base the shortfall compounds on':
    'बिना कोई विवरणी दाखिल किए ₹{1} करोड़ मासिक कारोबार वहन करते {0} करदाता — वह आधार जिस पर कमी चक्रवृद्धि होती है',
  'Open longer than 60 days': '60 दिनों से अधिक लंबित',
  'of {0} unresolved ({1}%) — ₹{2} Cr behind them; the median unresolved alert is {3} days old':
    'अनिस्तारित {0} में से ({1}%) — उनके पीछे ₹{2} करोड़; मध्यक अनिस्तारित चेतावनी {3} दिन पुरानी है',
  '{0}% of alerts in scope — the statewide resolution rate is {1}%':
    'दायरे की चेतावनियों का {0}% — राज्यव्यापी निस्तारण दर {1}% है',
  'How long the unresolved queue has been waiting':
    'अनिस्तारित पंक्ति कितने समय से प्रतीक्षा में है',
  '{0} unresolved alerts, banded by age. The band an alert falls into decides what should happen to it, not the alert type.':
    '{0} अनिस्तारित चेतावनियाँ, आयु के अनुसार पट्टियों में। चेतावनी का क्या हो यह उसका प्रकार नहीं, बल्कि वह किस पट्टी में आती है यह तय करता है।',
  'Age band': 'आयु पट्टी',
  Alerts: 'चेतावनियाँ',
  '{0}% of unresolved': 'अनिस्तारित का {0}%',
  'What it means': 'इसका अर्थ',
  'Exposure is summed over distinct taxpayers, not over alerts — most taxpayers here carry more than one signal, and summing per alert would count the same entity several times.':
    'जोखिम राशि चेतावनियों पर नहीं, अलग-अलग करदाताओं पर जोड़ी गई है — यहाँ अधिकांश करदाता एक से अधिक संकेत रखते हैं, और चेतावनीवार जोड़ने पर वही इकाई कई बार गिनी जाती।',
  'Alert inflow': 'चेतावनियों की आवक',
  'Alerts raised per 8-day period over the last ~48 days, out of {0} in scope. A rising inflow against a static resolution rate is a staffing signal, not a risk one.':
    'पिछले लगभग 48 दिनों में प्रत्येक 8-दिवसीय अवधि में उठी चेतावनियाँ, दायरे के {0} में से। स्थिर निस्तारण दर के सापेक्ष बढ़ती आवक कर्मचारी-संख्या का संकेत है, जोखिम का नहीं।',
  'Alerts by type — the value and recommended action for each are in the table below.':
    'प्रकारवार चेतावनियाँ — प्रत्येक का मूल्य और संस्तुत कार्रवाई नीचे की तालिका में है।',
  'Alert types — what each is worth and what to do about it':
    'चेतावनियों के प्रकार — प्रत्येक का मूल्य कितना और उसका क्या करें',
  '{0} of the {1} signal types are firing in the current scope, ranked by the exposure behind them rather than by count.':
    'वर्तमान दायरे में {1} में से {0} संकेत प्रकार लागू हो रहे हैं, संख्या के बजाय उनके पीछे की जोखिम राशि के अनुसार क्रमबद्ध।',
  Signal: 'संकेत',
  '{0} open of {1}': '{1} में से {0} लंबित',
  '{0}% of all alerts in scope': 'दायरे की सभी चेतावनियों का {0}%',
  'Median age, open': 'लंबित की मध्यक आयु',
  'Recommended action': 'संस्तुत कार्रवाई',
  '{0} of {1} taxpayers in scope are firing three or more distinct signals at once, carrying ₹{2} Cr.':
    'दायरे के {1} में से {0} करदाताओं पर एक साथ तीन या अधिक भिन्न संकेत लागू हो रहे हैं, और वे ₹{2} करोड़ वहन करते हैं।',
  'One signal is a lapse. Three at once, in the same window, is a trajectory — and it is the population this screen exists to reach before the shortfall compounds. These should be worked ahead of any single-signal alert of the same age, whatever their individual risk scores say.':
    'एक संकेत चूक है। एक ही कालपट में एक साथ तीन एक दिशा है — और कमी के चक्रवृद्धि होने से पहले जिस तक पहुँचने के लिए यह पर्दा है वही यह संख्या है। उनके व्यक्तिगत जोखिम अंक चाहे जो कहें, इन्हें उसी आयु की किसी भी एक-संकेत चेतावनी से पहले निपटाया जाना चाहिए।',
  '{0} signals': '{0} संकेत',
  'oldest {0} days': 'सबसे पुरानी {0} दिन',
  'and {0} more': 'और {0} अन्य',
  'Showing {0} of {1} alerts in scope. Sort by age to find the ones the outreach never reached.':
    'दायरे की {1} में से {0} चेतावनियाँ दिखाई जा रही हैं। संपर्क जिन तक कभी नहीं पहुँचा उन्हें खोजने हेतु आयु के अनुसार क्रम लगाएँ।',
  '{0} days old': '{0} दिन पुरानी',
  'Open {0} days, raised {1}': '{0} दिन से लंबित, {1} को उठी',
  'Other signals on this taxpayer': 'इस करदाता पर अन्य संकेत',
  '{0} of {1} types': '{1} प्रकारों में से {0}',

  /* == Refund Risk Intelligence ========================================= */
  'Refund claims ranked by risk before sanction. Refund intensity is read against the benchmark for the claimant’s own sector rather than as an absolute percentage — a 15% refund ratio is ordinary in import/export and extreme in professional services.':
    'स्वीकृति से पहले जोखिम के अनुसार क्रमबद्ध प्रतिदाय दावे। प्रतिदाय की सघनता निरपेक्ष प्रतिशत के रूप में नहीं, दावेदार के अपने क्षेत्र के मानक के सापेक्ष पढ़ी जाती है — 15% प्रतिदाय अनुपात आयात/निर्यात में साधारण और व्यावसायिक सेवाओं में चरम है।',
  Claimed: 'दावा किया गया',
  'Refund / turnover vs sector benchmark': 'प्रतिदाय / कारोबार बनाम क्षेत्रीय मानक',
  'benchmark {0}% · {1}× it': 'मानक {0}% · उसका {1}×',
  'Days since filing': 'दाखिल किए जाने से दिन',
  'Claimant filing behaviour': 'दावेदार का विवरणी व्यवहार',
  'Value awaiting a decision': 'निर्णय की प्रतीक्षा में मूल्य',
  '₹ Lakh across {0} claims — {1}% of the ₹{2} L claimed in scope':
    '{0} दावों में मिलाकर ₹ लाख — दायरे में दावा किए गए ₹{2} लाख का {1}%',
  'High-risk claims': 'उच्च जोखिम के दावे',
  'of {0} claims ({1}%), holding {2}% of the claimed value':
    '{0} दावों में से ({1}%), दावा किए गए मूल्य का {2}% धारण करते हुए',
  'Refund-to-turnover against sector benchmark': 'क्षेत्रीय मानक के सापेक्ष प्रतिदाय-से-कारोबार',
  'Claims above the sector band': 'क्षेत्रीय पट्टी से ऊपर के दावे',
  'at {0}× benchmark or more — {1}% of claims, ₹{2} L; this is the threshold the encoded refund rule uses':
    'मानक के {0}× या अधिक पर — दावों का {1}%, ₹{2} लाख; कूटबद्ध प्रतिदाय नियम यही सीमा प्रयोग करता है',
  'Refund intensity by sector, against that sector’s benchmark':
    'क्षेत्रवार प्रतिदाय सघनता, उस क्षेत्र के मानक के सापेक्ष',
  'Bar height is the gap in percentage points between the ratio claimed and the sector benchmark. A positive gap on a sector carrying few claims is variance, not a finding — read the claim count alongside it.':
    'स्तंभ की ऊँचाई दावा किए गए अनुपात और क्षेत्रीय मानक के बीच प्रतिशत बिंदुओं का अंतर है। कम दावों वाले क्षेत्र पर धनात्मक अंतर उतार-चढ़ाव है, निष्कर्ष नहीं — साथ में दावों की संख्या भी पढ़ें।',
  Claims: 'दावे',
  'Refund / turnover': 'प्रतिदाय / कारोबार',
  'Multiple of benchmark': 'मानक के गुणक',
  'Claims above band': 'पट्टी से ऊपर के दावे',
  'Claims by multiple of the sector benchmark': 'क्षेत्रीय मानक के गुणकों के अनुसार दावे',
  'Bands are relative to the claimant’s own sector, not absolute. The benchmark refund ratio runs from 1% to 21% across these sectors, so a flat percentage band would put an ordinary exporter and an extreme domestic claim in the same bucket.':
    'पट्टियाँ दावेदार के अपने क्षेत्र के सापेक्ष हैं, निरपेक्ष नहीं। इन क्षेत्रों में मानक प्रतिदाय अनुपात 1% से 21% तक जाता है, इसलिए सपाट प्रतिशत पट्टी एक साधारण निर्यातक और एक चरम घरेलू दावे को एक ही खाने में डाल देगी।',
  '{0} claims · ₹{1} L · {2}% of claims in scope':
    '{0} दावे · ₹{1} लाख · दायरे के दावों का {2}%',
  'At {0}× and above, the encoded refund rule fires and contributes to the taxpayer’s risk score — so those claims are already reflected in the Risk column of the register and should not be counted as a second, independent signal.':
    '{0}× और उससे ऊपर कूटबद्ध प्रतिदाय नियम लागू होता है और करदाता के जोखिम अंक में योगदान करता है — इसलिए वे दावे पंजी के जोखिम स्तंभ में पहले से ही प्रतिबिंबित हैं और उन्हें दूसरा, स्वतंत्र संकेत मानकर नहीं गिना जाना चाहिए।',
  '{0} claims in scope. Median claim has been pending {1} days since filing; the oldest, {2} days.':
    'दायरे में {0} दावे। मध्यक दावा दाखिल किए जाने से {1} दिन से लंबित है; सबसे पुराना, {2} दिन।',
  'Days since filing is stated without a deadline against it. This platform does not encode the statutory refund timeline — the limitation engine covers assessment proceedings under sections 73, 74 and 74A only — so no claim here is described as overdue, and the ageing column is a workload signal rather than a statutory one.':
    'दाखिल किए जाने से दिन बिना किसी समय-सीमा के सामने रखे गए हैं। यह मंच सांविधिक प्रतिदाय समय-सीमा कूटबद्ध नहीं करता — परिसीमा यंत्र केवल धारा 73, 74 और 74A के अंतर्गत निर्धारण कार्यवाहियों को समेटता है — इसलिए यहाँ किसी दावे को अतिदेय नहीं बताया गया, और आयु स्तंभ सांविधिक नहीं बल्कि कार्यभार का संकेत है।',
  'Not available on this platform: repeat-claim detection. Identifying a taxpayer claiming refund period after period requires a refund history keyed by GSTIN and period, and this dataset holds one claim per taxpayer. A high-value threshold was previously shown in this position as a proxy for it; a large single claim is not a repeat pattern, so the figure has been removed rather than relabelled.':
    'इस मंच पर उपलब्ध नहीं: पुनरावृत्त दावों की पहचान। अवधि दर अवधि प्रतिदाय का दावा करने वाला करदाता पहचानने हेतु GSTIN और अवधि से अनुक्रमित प्रतिदाय इतिहास चाहिए, और इस आँकड़ा-संग्रह में प्रति करदाता एक ही दावा है। इसी स्थान पर पहले उसके स्थानापन्न के रूप में उच्च मूल्य की सीमा दिखाई जाती थी; एक बड़ा अकेला दावा पुनरावृत्ति का प्रतिरूप नहीं है, इसलिए उस आँकड़े को नया नाम देकर रखने के बजाय हटा दिया गया है।',
  '{0}× the sector benchmark': 'क्षेत्रीय मानक का {0}×',
  '{0}% — no sector benchmark': '{0}% — क्षेत्रीय मानक नहीं',
  '{0}% against {1}% benchmark': '{1}% मानक के सापेक्ष {0}%',
  '{0} — {1} days ago': '{0} — {1} दिन पूर्व',

  /* Constant-declared recommendations and band labels passed to t(variable). */
  'Confirm the registered sector is correct first — a misclassified taxpayer deviates from the wrong benchmark and is not a case.':
    'पहले यह पुष्ट करें कि पंजीकृत क्षेत्र सही है — गलत वर्गीकृत करदाता गलत मानक से विचलित होता है और वह प्रकरण नहीं बनता।',
  'Route to Network Intelligence rather than acting alone — a chain is broken at one entity, and which one is a question that screen answers.':
    'अकेले कार्रवाई करने के बजाय नेटवर्क इंटेलिजेंस को भेजें — श्रृंखला किसी एक इकाई पर टूटती है, और वह कौन-सी है यह प्रश्न वही पर्दा हल करता है।',
  'Verify the upstream supplier’s own filing status before treating the credit as available — a credit is only as good as the return behind it.':
    'श्रेय को उपलब्ध मानने से पहले ऊपरी चरण के आपूर्तिकर्ता की अपनी विवरणी स्थिति सत्यापित करें — श्रेय का मोल उसके पीछे की विवरणी जितना ही होता है।',
  'Early warning has failed on these. They belong in the enforcement pipeline rather than in an outreach queue.':
    'इन पर पूर्व-चेतावनी विफल हो चुकी है। इनका स्थान संपर्क पंक्ति में नहीं, प्रवर्तन शृंखला में है।',
  'No longer early. A quarter of filing periods has passed and the shortfall has compounded through each of them.':
    'अब यह पूर्व-चेतावनी नहीं रही। विवरणी अवधियों की एक तिमाही बीत चुकी है और उनमें से प्रत्येक में कमी चक्रवृद्धि होती गई है।',
  'Older than 90 days': '90 दिनों से पुरानी',
  'Outreach has had time to work. Where it has not, this is where officer review belongs.':
    'संपर्क को काम करने का पर्याप्त समय मिल चुका है। जहाँ वह नहीं चला, वहीं अधिकारी पुनर्विलोकन का स्थान है।',
  'Raised within 30 days': '30 दिनों में उठी',
  'Still early. Automated outreach resolves most of these without any officer time.':
    'अभी भी पूर्व चरण। इनमें से अधिकांश स्वचालित संपर्क से ही, अधिकारी का समय लगे बिना निपट जाती हैं।',
  'Below sector benchmark': 'क्षेत्रीय मानक से नीचे',
  'No sector benchmark on record': 'अभिलेख पर क्षेत्रीय मानक नहीं',

  /* == Network enforcement — short lines ============================ */
  'Circular invoice chains, and which entity actually stops each one.':
    'वर्तुल बीजक श्रृंखलाएँ, और प्रत्येक श्रृंखला वास्तव में कौन-सी इकाई रोकती है।',
  'Lost before detection — this sets the scale of everything below.':
    'पहचान से पहले ही खोया — नीचे की हर बात का पैमाना यही तय करता है।',
  'Act first on the chain every division in its span can close on one date.':
    'जिस श्रृंखला को उसके सभी संभाग एक ही तिथि पर बंद कर सकें, पहले उसी पर कार्रवाई करें।',
  'Ranked by blockable value — but only workable where an officer can act.':
    'रोकने-योग्य मूल्य के अनुसार क्रम — पर वहीं संभव जहाँ अधिकारी कार्रवाई कर सके।',
  'Where the margin is small, the ordering is inside the noise.':
    'जहाँ बढ़त छोटी है, वहाँ क्रम शोर के भीतर ही है।',
  'A closed loop: removing any one entity breaks it, so lead strength decides.':
    'बंद लूप: कोई भी एक इकाई हटाने पर वह टूटता है, इसलिए सुराग की शक्ति तय करती है।',
  'One economic unit, several jurisdictions — the chain crosses divisions.':
    'एक आर्थिक इकाई, कई अधिकार-क्षेत्र — श्रृंखला संभाग पार करती है।',
  'A deployment decision, not a scheduling one.':
    'यह तैनाती का निर्णय है, समय-सारणी का नहीं।',
  'The gap is on the cut point itself — posting an officer there unlocks it.':
    'कमी ठीक छेद-बिंदु पर ही है — वहाँ अधिकारी तैनात करने से वह खुलती है।',
  'Already utilised downstream — no action can block it now.':
    'आगे के चरणों में उपयोग हो चुका — अब कोई कार्रवाई उसे नहीं रोक सकती।',
  'The coordination loss is small, and stated as such rather than headlined.':
    'समन्वय की हानि छोटी है, और उसे शीर्षक बनाए बिना वैसा ही बताया गया है।',
  'Centrality says how important a node looks, not whether removing it works.':
    'केंद्रीयता बताती है कि नोड कितना महत्वपूर्ण दिखता है, उसे हटाने से काम बनता है या नहीं यह नहीं।',

  /* == E-way and refund — short lines ============================ */
  'Declared movement with no filed return behind it, and whose it is.':
    'जिसके पीछे दाखिल विवरणी नहीं, वह घोषित परिवहन, और वह किसका है।',
  'Total movement follows trade; the unmatched share is what to act on.':
    'कुल परिवहन व्यापार के साथ बदलता है; कार्रवाई अमेलित अंश पर करनी है।',
  'A district below the statewide rate is not a priority, whatever its volume.':
    'राज्यव्यापी दर से नीचे का ज़िला, उसकी मात्रा चाहे जो हो, प्राथमिकता नहीं है।',
  'Not available: a period reconciliation against declared outward supply.':
    'उपलब्ध नहीं: घोषित बहिर्गामी आपूर्ति के सापेक्ष अवधिवार मिलान।',
  'Use this to check one movement; use the ranking above to decide who to open.':
    'एक परिवहन जाँचने हेतु यह प्रयोग करें; किस पर प्रकरण खोलना है उसके लिए ऊपर का क्रम।',
  'Refund intensity against the claimant\'s own sector, not as a flat percentage.':
    'प्रतिदाय की सघनता दावेदार के अपने क्षेत्र के सापेक्ष, सपाट प्रतिशत के रूप में नहीं।',
  'A positive gap on few claims is variance — read the claim count with it.':
    'कम दावों पर धनात्मक अंतर उतार-चढ़ाव है — साथ में दावों की संख्या भी पढ़ें।',
  'Bands are relative to each sector, which runs from 1% to 21%.':
    'पट्टियाँ प्रत्येक क्षेत्र के सापेक्ष, जो 1% से 21% तक जाता है।',
  'Already counted in the Risk column — not a second, independent signal.':
    'जोखिम स्तंभ में पहले ही गिना गया — यह दूसरा, स्वतंत्र संकेत नहीं।',
  'No statutory refund clock is encoded, so nothing here is overdue.':
    'सांविधिक प्रतिदाय घड़ी कूटबद्ध नहीं है, इसलिए यहाँ कुछ भी अतिदेय नहीं।',
  'Not available: repeat-claim detection needs a history keyed by period.':
    'उपलब्ध नहीं: पुनरावृत्त दावों की पहचान हेतु अवधि से अनुक्रमित इतिहास चाहिए।',
  'No auto-reject. Claims can only be routed to an officer.':
    'स्वचालित अस्वीकार नहीं। दावे केवल अधिकारी को भेजे जा सकते हैं।',

  /* == Unknown risk, ITC and early warning — short lines ============================ */
  'What the encoded rules do not look for — the unflagged population.':
    'कूटबद्ध नियम जिसे नहीं खोजते वह — अचिह्नित संख्या।',
  'Never scored: a peer median from a handful of businesses is not a norm.':
    'कभी अंकित नहीं: मुट्ठी भर व्यवसायों से निकाला गया समकक्ष मध्यक मानक नहीं है।',
  'No unflagged taxpayer reaches the threshold; flagged ones pass it easily.':
    'कोई अचिह्नित करदाता सीमा तक नहीं पहुँचता; चिह्नित उसे सहज पार करते हैं।',
  'How narrow the miss is does not change what should be done with it.':
    'कितने कम अंतर से चूका, इससे उसका क्या किया जाए यह नहीं बदलता।',
  'Lowering the threshold would report ordinary variation as a discovery.':
    'सीमा घटाने पर सामान्य उतार-चढ़ाव ही खोज के रूप में दर्ज होगा।',
  'Credit scored against the filing and payment behaviour behind it.':
    'श्रेय उसके पीछे के विवरणी एवं भुगतान व्यवहार के सापेक्ष अंकित।',
  'Credit taken now, by an entity whose behaviour does not support it.':
    'अभी लिया गया श्रेय, और ऐसी इकाई जिसका व्यवहार उसका समर्थन नहीं करता।',
  'Above 1.0 means credit is concentrating where it is least substantiated.':
    '1.0 से ऊपर अर्थात् श्रेय वहाँ सिमट रहा है जहाँ वह सबसे कम प्रमाणित है।',
  'The gap between what was claimed and that sector\'s own benchmark.':
    'दावा किए गए और उस क्षेत्र के अपने मानक के बीच का अंतर।',
  'Slipping compliance, surfaced before the shortfall compounds.':
    'फिसलता अनुपालन, कमी के चक्रवृद्धि होने से पहले सामने लाया गया।',
  'Summed over taxpayers, not alerts — most carry more than one signal.':
    'चेतावनियों पर नहीं, करदाताओं पर योग — अधिकांश एक से अधिक संकेत रखते हैं।',
  'A rising inflow against a static resolution rate is a staffing signal.':
    'स्थिर निस्तारण दर के सापेक्ष बढ़ती आवक कर्मचारी-संख्या का संकेत है।',
  'One signal is a lapse; three at once is a trajectory.':
    'एक संकेत चूक है; एक साथ तीन एक दिशा है।',

  /* == Unknown risk — short lines ============================ */
  'Each ratio against the median of the taxpayer’s own sector, on a modified z.':
    'प्रत्येक अनुपात करदाता के अपने क्षेत्र के मध्यक के सापेक्ष, संशोधित z पर।',
  'Every ratio here is already an encoded rule, so the extreme tail is taken.':
    'यहाँ का प्रत्येक अनुपात पहले से कूटबद्ध नियम है, इसलिए चरम छोर पहले ही लिया जा चुका है।',
  'The method is correct; the empty result is the finding.':
    'विधि सही है; रिक्त परिणाम ही निष्कर्ष है।'
})
