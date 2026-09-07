import { registerMessages } from '../../locale.js'

/**
 * Hindi — Revenue Intelligence, Statutory Time Intelligence, and
 * Revenue at Risk & Recovery.
 *
 *   shortfall            → कमी
 *   attribution          → उत्तरदायित्व निर्धारण
 *   realised ratio       → वास्तविक अनुपात
 *   benchmark            → मानक
 *   detection floor      → पहचान की न्यूनतम सीमा
 *   queue dwell          → पंक्ति में ठहराव
 *   blockable window     → रोकने-योग्य कालपट
 *   binding deadline     → बाध्यकारी समय-सीमा
 *   ultra vires          → अधिकारातीत
 *
 * Form and notification identifiers stay in Latin — returns_period.csv,
 * output_tax, Notification 56/2023-CT, Section 168A.
 */
registerMessages('hi', {
  /* == Revenue Intelligence — headline and basis ========================= */
  'What this screen decides': 'यह पर्दा क्या तय करता है',
  'A shortfall is only actionable once you know whose it is.':
    'कमी किसकी है यह जाने बिना उस पर कार्रवाई नहीं हो सकती।',
  '₹{0} Cr of ₹{1} Cr — district ledger, current collection period':
    '₹{1} करोड़ में से ₹{0} करोड़ — जिला लेखा, वर्तमान वसूली अवधि',
  '₹{0} Cr of ₹{1} Cr over {2} months': '{2} माह में ₹{1} करोड़ में से ₹{0} करोड़',
  'Collection in view stands at {0}% of target — a shortfall of ₹{1} Cr. On the current-period district ledger, {2} of the {3} districts in deficit carry {4}% of that gap, and {5} of {6} sectors in view are collecting below their own tax-to-turnover benchmark. Those are the two places a recovery effort changes the number.':
    'दृश्य की वसूली लक्ष्य का {0}% है — ₹{1} करोड़ की कमी। वर्तमान अवधि के जिला लेखे में, घाटे वाले {3} जिलों में से {2} जिले उस अंतर का {4}% वहन करते हैं, और दृश्य के {6} में से {5} क्षेत्र अपने ही कर-से-कारोबार मानक से नीचे वसूली कर रहे हैं। वसूली के प्रयास से आँकड़ा जहाँ बदलता है, वे यही दो स्थान हैं।',
  'Collection in view stands at {0}% of target — ahead by ₹{1} Cr. {2} districts are nonetheless in deficit on the current-period ledger and {3} of {4} sectors in view are collecting below their own tax-to-turnover benchmark; a headline surplus does not clear either.':
    'दृश्य की वसूली लक्ष्य का {0}% है — ₹{1} करोड़ आगे। फिर भी वर्तमान अवधि के लेखे में {2} जिले घाटे में हैं और दृश्य के {4} में से {3} क्षेत्र अपने ही कर-से-कारोबार मानक से नीचे वसूली कर रहे हैं; मुख्य आँकड़े का अधिशेष इनमें से किसी को नहीं मिटाता।',
  '₹{0} Cr shortfall across {1} districts · current period':
    '{1} जिलों में मिलाकर ₹{0} करोड़ की कमी · वर्तमान अवधि',
  '{0} of {1} taxpayers in view': 'दृश्य के {1} करदाताओं में से {0}',
  'Collection Against Target': 'लक्ष्य के सापेक्ष वसूली',
  'Districts Carrying {0}% of the Shortfall': 'कमी का {0}% वहन करने वाले जिले',
  'of {0} in deficit, {1} in view': 'घाटे के {0} में से, दृश्य में {1}',
  'Sectors Below Their Tax Benchmark': 'अपने कर मानक से नीचे के क्षेत्र',
  'of {0} sectors with taxpayers in view': 'दृश्य में करदाता रखने वाले {0} क्षेत्रों में से',

  /* == Revenue Intelligence — variance, tax head, attribution ============ */
  'Variance From Target by District': 'जिलावार लक्ष्य से विचलन',
  'Collection against the district’s own target (%). Zero is on target; bars below the line are the districts a recovery effort has to reach. Absolute collection is in the shortfall ledger below.':
    'जिले के अपने लक्ष्य के सापेक्ष वसूली (%)। शून्य अर्थात लक्ष्य पर; रेखा के नीचे के स्तंभ वे जिले हैं जिन तक वसूली के प्रयास को पहुँचना है। कुल वसूली नीचे के कमी-लेखे में है।',
  'Collection by tax head is not available': 'कर शीर्ष के अनुसार वसूली उपलब्ध नहीं',
  'Every collection figure on this screen is a combined tax total. Splitting it into CGST, SGST, IGST and Cess needs the period return extract (returns_period.csv, GSTN returns), which carries output_tax broken down by head alongside the cash-versus-credit split. Until that feed is connected, the State’s own share of a shortfall cannot be separated from the IGST settlement, and nothing here should be read as an SGST-only figure.':
    'इस पर्दे का प्रत्येक वसूली आँकड़ा संयुक्त कर योग है। उसे CGST, SGST, IGST और उपकर में बाँटने के लिए अवधि विवरणी एक्सट्रैक्ट (returns_period.csv, GSTN विवरणियाँ) चाहिए, जिसमें नकद-बनाम-श्रेय विभाजन के साथ output_tax शीर्ष के अनुसार विभाजित रहता है। वह स्रोत जुड़ने तक कमी में राज्य का अपना अंश IGST निपटान से अलग नहीं किया जा सकता, और यहाँ का कोई आँकड़ा केवल SGST का नहीं पढ़ा जाना चाहिए।',
  'Shortfall Attribution — Current-Period District Ledger':
    'कमी का उत्तरदायित्व — वर्तमान अवधि का जिला लेखा',
  'Ranked by rupees of shortfall, with the running cumulative share. Targets and actuals are the district ledger for the current collection period, not the cumulative trend above — the two are different denominators and are not added together anywhere on this screen.':
    'कमी के रुपयों के अनुसार क्रम, साथ में चलता संचयी अंश। लक्ष्य एवं वास्तविक आँकड़े वर्तमान वसूली अवधि का जिला लेखा हैं, ऊपर की संचयी प्रवृत्ति नहीं — दोनों के हर भिन्न हैं और इस पर्दे पर वे कहीं भी जोड़े नहीं गए।',
  '₹{0} Cr total shortfall': 'कुल ₹{0} करोड़ की कमी',
  'No district in view is below its target for the current period.':
    'वर्तमान अवधि हेतु दृश्य का कोई जिला अपने लक्ष्य से नीचे नहीं है।',
  'Audit recovery is what the district has already booked against its gap. Where it covers a small share, the shortfall is a collection problem rather than an enforcement one, and the response differs accordingly.':
    'लेखापरीक्षा वसूली वह है जो जिला अपने अंतर के सापेक्ष पहले ही दर्ज कर चुका है। जहाँ वह अल्प अंश पूरा करती है, वहाँ कमी प्रवर्तन की नहीं, वसूली की समस्या है, और उसी अनुसार प्रतिक्रिया भिन्न होती है।',
  'Shortfall (₹ Cr)': 'कमी (₹ करोड़)',
  'Share of Shortfall': 'कमी में अंश',
  Cumulative: 'संचयी',
  'covers {0}% of the gap': 'अंतर का {0}% पूरा करती है',

  /* == Revenue Intelligence — sector ==================================== */
  'Sector Collection Against Its Own Benchmark Ratio':
    'क्षेत्र की वसूली उसके अपने मानक अनुपात के सापेक्ष',
  'Tax-to-turnover ratio actually realised by the taxpayers in view, against the reference ratio held for that sector. Absolute sector revenue only says which sectors are large; the deviation says which are underpaying relative to what they themselves declared.':
    'दृश्य के करदाताओं द्वारा वास्तव में प्राप्त कर-से-कारोबार अनुपात, उस क्षेत्र हेतु रखे संदर्भ अनुपात के सापेक्ष। कुल क्षेत्रीय राजस्व केवल यह बताता है कि कौन-से क्षेत्र बड़े हैं; विचलन बताता है कि अपने ही घोषित के सापेक्ष कौन कम भर रहे हैं।',
  'Search sectors...': 'क्षेत्र खोजें...',
  'The monthly gap to benchmark is arithmetic: the difference between the sector’s reference tax-to-turnover ratio and the ratio realised by the taxpayers in view, applied to the monthly turnover they declared. It indicates where to look. It is not an assessed liability, and a legitimate rate, exemption or export mix will explain part of it in every sector.':
    'मानक से मासिक अंतर अंकगणित है: क्षेत्र के संदर्भ कर-से-कारोबार अनुपात और दृश्य के करदाताओं द्वारा प्राप्त अनुपात का अंतर, उनके घोषित मासिक कारोबार पर लगाया गया। यह बताता है कि कहाँ देखना है। यह निर्धारित दायित्व नहीं है, और प्रत्येक क्षेत्र में वैध दर, छूट अथवा निर्यात मिश्रण उसका कुछ भाग समझा देगा।',
  'Gap %': 'अंतर %',
  'Realised Tax Ratio': 'वास्तविक कर अनुपात',
  'Sector Benchmark': 'क्षेत्रीय मानक',
  'Monthly Gap to Benchmark': 'मानक से मासिक अंतर',
  'Avg Revenue Drop': 'औसत राजस्व गिरावट',
  'No taxpayers in view': 'दृश्य में कोई करदाता नहीं',
  '{0} taxpayers in view': 'दृश्य में {0} करदाता',
  'Forecast (Illustrative) — naive trend-based projection for the next 3 months. Statewide: this projection is not narrowed by the header filters.':
    'पूर्वानुमान (दृष्टांत) — अगले 3 माह हेतु सरल प्रवृत्ति-आधारित प्रक्षेपण। राज्यव्यापी: यह प्रक्षेपण शीर्ष फ़िल्टर से सीमित नहीं होता।',
  'Projected {0}-month gap: ₹{1} Cr': 'पूर्वानुमानित {0}-माह अंतर: ₹{1} करोड़',
  'Each tile carries the number of taxpayers, their share of the population in view, and the estimated revenue exposed. Click an indicator to filter the register below.':
    'प्रत्येक कार्ड पर करदाताओं की संख्या, दृश्य की संख्या में उनका अंश, और अनुमानित जोखिमग्रस्त राजस्व दिया है। नीचे की पंजी फ़िल्टर करने हेतु किसी संकेतक पर क्लिक करें।',
  'of {0} · {1}%': '{0} में से · {1}%',
  '{0} exposed · {1}% of exposure in view': '{0} जोखिम में · दृश्य की जोखिम राशि का {1}%',
  '{0} of {1} taxpayers · {2} exposed': '{1} करदाताओं में से {0} · {2} जोखिम में',
  'Leading Indicator': 'प्रमुख संकेतक',
  'Revenue Exposed': 'जोखिमग्रस्त राजस्व',
  'Monthly turnover': 'मासिक कारोबार',
  'Tax paid': 'भुगतान किया गया कर',
  'Realised tax ratio': 'वास्तविक कर अनुपात',
  'sector benchmark {0}%': 'क्षेत्रीय मानक {0}%',

  /* == Revenue Intelligence — briefing note ============================= */
  'REVENUE INTELLIGENCE — COLLECTION AGAINST TARGET':
    'राजस्व इंटेलिजेंस — लक्ष्य के सापेक्ष वसूली',
  'Scope: {0} · {1} · {2} · {3}': 'दायरा: {0} · {1} · {2} · {3}',
  'Collection: {0} ({1}% of target).': 'वसूली: {0} (लक्ष्य का {1}%)।',
  'Gap against target: ₹{0} Cr ({1}%).': 'लक्ष्य के सापेक्ष अंतर: ₹{0} करोड़ ({1}%)।',
  'Current-period district ledger: ₹{0} Cr of shortfall across {1} districts; {2} of them carry {3}% of it. Audit recovery booked in those districts: ₹{4} Cr.':
    'वर्तमान अवधि का जिला लेखा: {1} जिलों में मिलाकर ₹{0} करोड़ की कमी; उनमें से {2} जिले उसका {3}% वहन करते हैं। उन जिलों में दर्ज लेखापरीक्षा वसूली: ₹{4} करोड़।',
  '{0} of {1} sectors in view are collecting below their own tax-to-turnover benchmark.':
    'दृश्य के {1} में से {0} क्षेत्र अपने ही कर-से-कारोबार मानक से नीचे वसूली कर रहे हैं।',
  '{0} taxpayers carry a revenue-leakage indicator, with {1} of estimated revenue exposed.':
    '{0} करदाताओं पर राजस्व रिसाव का संकेतक है, और उनके पास {1} अनुमानित राजस्व जोखिम में है।',
  'Collection is not split by tax head — CGST, SGST, IGST and Cess are not held in this platform.':
    'वसूली कर शीर्ष के अनुसार विभाजित नहीं है — CGST, SGST, IGST और उपकर इस मंच पर नहीं रखे गए।',

  /* == Statutory Time Intelligence ====================================== */
  'Revenue lost to limitation is irreversible, unarguable, and attributable to a named officer and date. Of the ₹{0} Cr riding on the {1} proceedings in view, ₹{2} Cr has already passed its deadline — {3}% of the total — and ₹{4} Cr expires within thirty days.':
    'परिसीमा से खोया राजस्व अपरिवर्तनीय होता है, उस पर बहस नहीं हो सकती, और वह नाम सहित अधिकारी एवं तिथि से जोड़ा जा सकता है। दृश्य की {1} कार्यवाहियों पर टिके ₹{0} करोड़ में से ₹{2} करोड़ की समय-सीमा पहले ही बीत चुकी है — कुल का {3}% — और ₹{4} करोड़ तीस दिनों में समाप्त होते हैं।',
  '{0} of {1} proceedings on the register': 'पंजी की {1} में से {0} कार्यवाहियाँ',
  'No proceeding in view is still in time': 'दृश्य की कोई कार्यवाही समय के भीतर नहीं',
  'Nearest binding deadline: {0} days': 'निकटतम बाध्यकारी समय-सीमा: {0} दिन',
  '{0} live proceedings await a notice — ₹{1} Cr':
    '{0} जीवित कार्यवाहियाँ नोटिस की प्रतीक्षा में — ₹{1} करोड़',
  '₹ Cr · {0} proceedings · {1}% of exposure': '₹ करोड़ · {0} कार्यवाहियाँ · जोखिम राशि का {1}%',
  '₹ Cr · {0} proceedings still open': '₹ करोड़ · {0} कार्यवाहियाँ अब भी लंबित',
  '₹{0} Cr across {1} proceedings is already time-barred.':
    '{1} कार्यवाहियों में मिलाकर ₹{0} करोड़ पहले ही कालातीत हो चुके हैं।',
  'These cannot be revived by effort or by priority — the demand is extinguished by operation of law. The action on them is not recovery but a record of how each came to lapse, since the date and the responsible officer are both on the register.':
    'इन्हें श्रम अथवा प्राथमिकता से पुनर्जीवित नहीं किया जा सकता — विधि के प्रवर्तन से माँग समाप्त हो चुकी है। इन पर कार्रवाई वसूली नहीं, बल्कि यह अभिलेख है कि प्रत्येक कैसे छूटा, क्योंकि तिथि और उत्तरदायी अधिकारी दोनों पंजी पर हैं।',
  '{0} proceedings expiring within 30 days have not yet issued a notice — ₹{1} Cr.':
    '30 दिनों में समाप्त होने वाली {0} कार्यवाहियों में अभी नोटिस जारी नहीं हुआ — ₹{1} करोड़।',
  'Where no notice has issued it is the notice deadline that binds, and it falls months before the order deadline. Once it passes the order deadline is of no use: nothing later in the proceeding can cure it. These are the cases to clear first.':
    'जहाँ नोटिस जारी नहीं हुआ वहाँ नोटिस की समय-सीमा ही बाध्यकारी है, और वह आदेश की समय-सीमा से कई माह पहले आती है। उसके बीत जाने पर आदेश की समय-सीमा निरर्थक है: कार्यवाही में उसके बाद कुछ भी करने से वह नहीं सुधरती। पहले यही प्रकरण निपटाने चाहिए।',
  '{0} proceeding(s) carrying ₹{1} Cr — {2}% of the exposure in view — rest on a contested extension.':
    '₹{1} करोड़ वहन करने वाली {0} कार्यवाहियाँ — दृश्य की जोखिम राशि का {2}% — विवादित अवधि-विस्तार पर टिकी हैं।',
  'Desks carrying the nearest deadlines': 'निकटतम समय-सीमाएँ वहन करने वाले कार्यासन',
  'Officers holding a proceeding due within 90 days, in view. Limitation attaches to a named officer, so this is the roll-up that decides a reallocation.':
    'दृश्य में 90 दिनों के भीतर देय कार्यवाही रखने वाले अधिकारी। परिसीमा नाम सहित अधिकारी से जुड़ती है, इसलिए पुनर्आवंटन तय करने वाला यही योग है।',
  'No proceeding in view falls due within 90 days.':
    'दृश्य की कोई कार्यवाही 90 दिनों में देय नहीं है।',
  '{0} due within 90 days · ₹{1} Cr · {2} awaiting a notice':
    '90 दिनों में देय {0} · ₹{1} करोड़ · {2} नोटिस की प्रतीक्षा में',
  '{0} within 30d': '30 दिनों में {0}',
  'Section mix': 'धाराओं का मिश्रण',
  'Which power each proceeding is running under. The section decides the length of the clock, and s.74 is available only on a finding of fraud, wilful misstatement or suppression.':
    'प्रत्येक कार्यवाही किस शक्ति के अंतर्गत चल रही है। घड़ी की लंबाई धारा तय करती है, और धारा 74 केवल कपट, जानबूझकर मिथ्या कथन अथवा तथ्य छिपाने के निष्कर्ष पर ही उपलब्ध है।',
  'No proceedings in view.': 'दृश्य में कोई कार्यवाही नहीं।',
  '{0} time-barred': '{0} कालातीत',
  '{0} proceedings · none still in time': '{0} कार्यवाहियाँ · कोई भी समय के भीतर नहीं',
  '{0} proceedings · nearest deadline {1} days': '{0} कार्यवाहियाँ · निकटतम समय-सीमा {1} दिन',
  'Which divisions carry the nearest deadlines. Statewide roll-up from the limitation engine — this panel is not narrowed by the header filters, unlike every figure above it.':
    'निकटतम समय-सीमाएँ कौन-से विभाग वहन करते हैं। परिसीमा यंत्र से राज्यव्यापी योग — ऊपर के प्रत्येक आँकड़े के विपरीत यह पटल शीर्ष फ़िल्टर से सीमित नहीं होता।',
  'Stage reached': 'प्राप्त चरण',
  'Notice issued': 'नोटिस जारी',
  'No notice yet': 'अभी कोई नोटिस नहीं',
  'Expired {0} days ago': '{0} दिन पूर्व समाप्त',
  '{0} days — {1}': '{0} दिन — {1}',
  'No notice has issued, so the notice deadline of {0} is what binds here — not the order deadline of {1}. Once the notice date passes the proceeding cannot be saved by anything done later.':
    'नोटिस जारी नहीं हुआ, इसलिए यहाँ {0} की नोटिस समय-सीमा ही बाध्यकारी है — {1} की आदेश समय-सीमा नहीं। नोटिस तिथि बीत जाने पर बाद में कुछ भी करने से कार्यवाही नहीं बचाई जा सकती।',

  /* == Statutory Time Intelligence — briefing note ====================== */
  'STATUTORY TIME INTELLIGENCE — LIMITATION EXPOSURE':
    'सांविधिक समय इंटेलिजेंस — परिसीमा जोखिम राशि',
  'Scope: {0} · {1} · {2} · {3} proceedings of {4} on the register.':
    'दायरा: {0} · {1} · {2} · पंजी की {4} में से {3} कार्यवाहियाँ।',
  'Already time-barred: ₹{0} Cr across {1} proceedings — {2}% of the exposure in view. Extinguished by operation of law; not recoverable.':
    'पहले ही कालातीत: {1} कार्यवाहियों में मिलाकर ₹{0} करोड़ — दृश्य की जोखिम राशि का {2}%। विधि के प्रवर्तन से समाप्त; वसूली-योग्य नहीं।',
  'Expiring within 30 days: ₹{0} Cr across {1} proceedings ({2}% of exposure in view).':
    '30 दिनों में समाप्त होने वाले: {1} कार्यवाहियों में मिलाकर ₹{0} करोड़ (दृश्य की जोखिम राशि का {2}%)।',
  'Expiring within 90 days: ₹{0} Cr across {1} proceedings ({2}% of exposure in view).':
    '90 दिनों में समाप्त होने वाले: {1} कार्यवाहियों में मिलाकर ₹{0} करोड़ (दृश्य की जोखिम राशि का {2}%)।',
  'Of those expiring within 30 days, {0} have not yet issued a notice (₹{1} Cr). The notice deadline binds in those cases and cannot be cured once it passes.':
    '30 दिनों में समाप्त होने वालों में से {0} में अभी नोटिस जारी नहीं हुआ (₹{1} करोड़)। उन प्रकरणों में नोटिस की समय-सीमा बाध्यकारी है और बीत जाने पर वह सुधारी नहीं जा सकती।',
  'Resting on a contested extension: {0} proceedings, ₹{1} Cr ({2}% of exposure in view) — Notification 56/2023-CT, held ultra vires Section 168A by the Gauhati High Court.':
    'विवादित अवधि-विस्तार पर आधारित: {0} कार्यवाहियाँ, ₹{1} करोड़ (दृश्य की जोखिम राशि का {2}%) — अधिसूचना 56/2023-CT, जिसे गुवाहाटी उच्च न्यायालय ने धारा 168क के अधिकारातीत ठहराया।',
  'Live and in time: ₹{0} Cr across {1} proceedings. Nearest binding deadline: {2} days.':
    'जीवित एवं समय के भीतर: {1} कार्यवाहियों में मिलाकर ₹{0} करोड़। निकटतम बाध्यकारी समय-सीमा: {2} दिन।',

  /* == Revenue at Risk & Recovery ======================================= */
  'The department already produces the signals. By the time a case is worked, the credit has moved downstream, been utilised, and the entity has often stopped trading. Of ₹{0} Cr currently flagged across {1} cases, ₹{2} Cr is still realistically recoverable — the remaining ₹{3} Cr has decayed while the case waited.':
    'विभाग ये संकेत पहले से ही उत्पन्न करता है। प्रकरण निपटने तक श्रेय आगे बढ़ चुका, उपयोग हो चुका होता है, और वह इकाई प्रायः व्यापार ही बंद कर चुकी होती है। {1} प्रकरणों में इस समय चिह्नित ₹{0} करोड़ में से ₹{2} करोड़ अब भी वास्तविक रूप से वसूली-योग्य है — शेष ₹{3} करोड़ का प्रकरण की प्रतीक्षा में ही क्षय हो गया।',
  'No flagged case matches the current header filters. Every figure below reads zero for that reason, not because the exposure has been cleared — widen the filters to see the portfolio.':
    'वर्तमान शीर्ष फ़िल्टर से कोई चिह्नित प्रकरण मेल नहीं खाता। नीचे का प्रत्येक आँकड़ा इसी कारण शून्य दिखाता है, इसलिए नहीं कि जोखिम राशि निपट गई — पूरा समुच्चय देखने हेतु फ़िल्टर चौड़े करें।',
  '₹ Cr across {0} cases': '₹ करोड़ — {0} प्रकरणों में',
  '₹ Cr · {0}% of flagged exposure': '₹ करोड़ · चिह्नित जोखिम राशि का {0}%',
  '₹ Cr · {0}% of what is still recoverable': '₹ करोड़ · अब भी वसूली-योग्य का {0}%',
  'Where The Lag Comes From': 'विलंब कहाँ से आता है',
  'A median lag of {0} days is not one problem. It is a detection floor imposed by the return cycle plus time the case spent waiting after it became visible — and only the second is inside the department’s control this quarter.':
    '{0} दिनों का मध्यक विलंब एक ही समस्या नहीं है। वह विवरणी चक्र द्वारा थोपी गई पहचान की न्यूनतम सीमा, और उसके दिखने के बाद प्रकरण द्वारा प्रतीक्षा में बिताया समय — इनमें से केवल दूसरा इस तिमाही विभाग के नियंत्रण में है।',
  'Median detection floor': 'पहचान की मध्यक न्यूनतम सीमा',
  'Median wait in the queue': 'पंक्ति में मध्यक प्रतीक्षा',
  'Internal dwell as a share of elapsed signal age': 'संकेत की बीती आयु में आंतरिक ठहराव का अंश',
  'summed across every case in view, not a ratio of the two medians':
    'दृश्य के प्रत्येक प्रकरण पर जोड़ा गया, दोनों मध्यकों का अनुपात नहीं',
  'Still inside the {0}-day blockable window': 'अब भी {0} दिन के रोकने-योग्य कालपट में',
  '{0} cases · {1}% of exposure in view': '{0} प्रकरण · दृश्य की जोखिम राशि का {1}%',
  'Credit passed downstream has typically not been fully utilised. Acting here blocks rather than pursues, which is the cheapest form of recovery the department has.':
    'आगे बढ़ाया गया श्रेय प्रायः पूर्णतः उपयोग नहीं हुआ होता। यहाँ कार्रवाई पीछा करने के बजाय रोकती है, और विभाग के पास वसूली का यही सबसे सस्ता रूप है।',
  'Detectable in time, aged out in the queue': 'समय पर पहचान-योग्य, पर पंक्ति में पुराना पड़ गया',
  'The signal on each of these could fire inside the blockable window, and the case is now past it. Nothing structural caused that — the whole of the delay is dwell after detection, which is the part a change of queue ordering reaches.':
    'इनमें से प्रत्येक का संकेत रोकने-योग्य कालपट के भीतर लागू हो सकता था, और प्रकरण अब उसे पार कर चुका है। इसका कोई संरचनागत कारण नहीं — संपूर्ण विलंब पहचान के बाद का ठहराव है, और पंक्ति के क्रम में परिवर्तन ठीक उसी भाग तक पहुँचता है।',
  'Never catchable inside the window': 'कालपट के भीतर कभी न पकड़ा जा सकने वाला',
  'The slowest rule triggering these cases cannot fire until after the window has closed, however fast the queue moves. Reaching this exposure needs a faster feed — e-way bill and e-invoice flow, which arrive before the return does — not more officer-days.':
    'इन प्रकरणों को लागू करने वाला सबसे धीमा नियम, पंक्ति चाहे कितनी भी तेज़ चले, कालपट बंद हुए बिना लागू ही नहीं हो सकता। इस जोखिम राशि तक पहुँचने के लिए अधिक अधिकारी-दिवस नहीं, तेज़ स्रोत चाहिए — ई-वे बिल एवं ई-बीजक प्रवाह, जो विवरणी से पहले आते हैं।',
  'Written down': 'बट्टे खाते',
  'A like-for-like comparison of two orderings over one week of work — the only variable changed is the order cases are worked in. Computed on the full statewide case set: this comparison is not narrowed by the header filters. Establishment and eligibility are modelled properly in Officer Capacity & Deployment; this screen isolates the effect of ordering alone and should not be read as a capacity plan.':
    'एक सप्ताह के कार्य पर दो क्रमों की समरूप तुलना — बदला गया एकमात्र चर यह है कि प्रकरण किस क्रम में निपटाए जाते हैं। पूरे राज्यव्यापी प्रकरण समुच्चय पर परिकलित: यह तुलना शीर्ष फ़िल्टर से सीमित नहीं होती। स्थापना एवं पात्रता का उचित प्रारूप अधिकारी क्षमता एवं तैनाती में है; यह पर्दा केवल क्रम का प्रभाव अलग करता है और इसे क्षमता योजना के रूप में नहीं पढ़ा जाना चाहिए।',
  'Both columns are measured on the same week of {0} cases — {1} field officers at {2} officer-days per case, taken from the capacity engine rather than restated here.':
    'दोनों स्तंभ {0} प्रकरणों के उसी सप्ताह पर मापे गए हैं — {1} क्षेत्रीय अधिकारी, प्रति प्रकरण {2} अधिकारी-दिवस, ये आँकड़े यहाँ दोहराने के बजाय क्षमता यंत्र से लिए गए हैं।',
  'Signal age is shown split into its two parts: the detection floor of the slowest rule that fired, and the days the case has since waited in the queue. The second column is the one an ordering change moves.':
    'संकेत की आयु उसके दो भागों में बाँटकर दिखाई गई है: लागू हुए सबसे धीमे नियम की पहचान न्यूनतम सीमा, और उसके बाद प्रकरण जितने दिन पंक्ति में रुका। क्रम बदलने से हिलने वाला स्तंभ दूसरा ही है।',
  '{0} detection floor + {1} in queue': '{0} पहचान न्यूनतम सीमा + {1} पंक्ति में',
  '{0}% of exposure': 'जोखिम राशि का {0}%',
  'Exposure is never one taxpayer. Credit moves downstream and is utilised hop by hop; once utilised it can no longer be blocked, only recovered. Statewide across all clusters — this panel is not narrowed by the header filters.':
    'जोखिम राशि कभी एक करदाता तक सीमित नहीं होती। श्रेय आगे बढ़ता है और चरण-दर-चरण उपयोग होता है; एक बार उपयोग हो जाने पर उसे रोका नहीं जा सकता, केवल वसूला जा सकता है। सभी समूहों पर राज्यव्यापी — यह पटल शीर्ष फ़िल्टर से सीमित नहीं होता।',
  '{0}% of flow': 'प्रवाह का {0}%',
  'The cheapest point on the curve. These indicators are checkable on the day of application rather than reconstructed from invoice flow a year later. Statewide across all new registrations — this panel is not narrowed by the header filters.':
    'वक्र पर सबसे सस्ता बिंदु। ये संकेतक वर्ष भर बाद बीजक प्रवाह से पुनः जोड़ने के बजाय आवेदन के दिन ही जाँचे जा सकते हैं। सभी नए पंजीयनों पर राज्यव्यापी — यह पटल शीर्ष फ़िल्टर से सीमित नहीं होता।',
  '{0} raise any indicator': '{0} में कोई भी संकेतक उठता है',
  'on the 2+ indicator cohort': '2+ संकेतक वाले समूह पर',
  exposed: 'जोखिम में',
  '₹{0}L': '₹{0} लाख',
  'No cases in view.': 'दृश्य में कोई प्रकरण नहीं।',

  /* == Revenue at Risk & Recovery — briefing note ======================= */
  'REVENUE AT RISK & RECOVERY — DECAY POSITION': 'जोखिमग्रस्त राजस्व एवं वसूली — क्षय स्थिति',
  'Scope: {0} · {1} · {2} · {3} of {4} flagged cases.':
    'दायरा: {0} · {1} · {2} · चिह्नित {4} में से {3} प्रकरण।',
  'Flagged exposure ₹{0} Cr. Still recoverable ₹{1} Cr ({2}%). Already decayed ₹{3} Cr ({4}%).':
    'चिह्नित जोखिम राशि ₹{0} करोड़। अब भी वसूली-योग्य ₹{1} करोड़ ({2}%)। पहले ही क्षय ₹{3} करोड़ ({4}%)।',
  'Another week of inaction costs ₹{0} Cr — {1}% of what is still recoverable.':
    'एक और सप्ताह की निष्क्रियता की लागत ₹{0} करोड़ — अब भी वसूली-योग्य का {1}%।',
  'Median signal age {0} days. Median detection floor {1} days; median wait in the queue after detection {2} days. Across the whole set in view, {3}% of elapsed signal age is internal dwell.':
    'संकेत की मध्यक आयु {0} दिन। पहचान की मध्यक न्यूनतम सीमा {1} दिन; पहचान के बाद पंक्ति में मध्यक प्रतीक्षा {2} दिन। दृश्य के पूरे समुच्चय पर, संकेत की बीती आयु का {3}% आंतरिक ठहराव है।',
  'Of the exposure in view, {0} is still inside the {1}-day blockable window, {2} was detectable inside it but has aged past it in the queue, and {3} could never have been caught inside it by the current rule set.':
    'दृश्य की जोखिम राशि में से {0} अब भी {1} दिन के रोकने-योग्य कालपट में है, {2} उसके भीतर पहचान-योग्य थी पर पंक्ति में पुरानी होकर उसे पार कर गई, और {3} वर्तमान नियम समुच्चय से उस कालपट में कभी पकड़ी ही नहीं जा सकती थी।',
  'The recovery curve is an illustrative model calibrated to stated reasoning, not a measurement of departmental realisation.':
    'वसूली वक्र बताए गए तर्क के अनुसार अंशांकित दृष्टांत प्रारूप है, विभागीय वसूली का माप नहीं।',

  /* == Recovery window — short lines ============================ */
  'Every flagged rupee has a recovery half-life. This measures the delay.':
    'प्रत्येक चिह्नित रुपये की वसूली की अर्ध-आयु होती है। यह पृष्ठ वह विलंब मापता है।',
  'The signals already exist. What decays is the time before anyone acts.':
    'संकेत पहले से मौजूद हैं। क्षय उस समय का होता है जब तक कोई कार्रवाई नहीं करता।',
  'Two delays, not one: the detection floor, and the wait after it.':
    'एक नहीं, दो विलंब: पहचान की न्यूनतम सीमा, और उसके बाद की प्रतीक्षा।',
  'Two orderings over one week. The only variable is the order of work.':
    'एक सप्ताह पर दो क्रम। बदलने वाला एकमात्र चर कार्य का क्रम है।',
  'Same headcount, same hours — only the ordering differs.':
    'वही कर्मचारी-संख्या, वही घंटे — अंतर केवल क्रम का।',
  'Both columns cover the same week, at the capacity engine\'s own figures.':
    'दोनों स्तंभ वही सप्ताह समेटते हैं, क्षमता यंत्र के अपने आँकड़ों पर।',
  'Signal age is split in two. Only queue dwell moves with the ordering.':
    'संकेत की आयु दो भागों में। क्रम से हिलता केवल पंक्ति का ठहराव है।',
  'Credit moves downstream hop by hop; once utilised it cannot be blocked.':
    'श्रेय चरण-दर-चरण आगे बढ़ता है; एक बार उपयोग होने पर उसे रोका नहीं जा सकता।',
  'The cheapest point on the curve — checkable on the day of application.':
    'वक्र पर सबसे सस्ता बिंदु — आवेदन के दिन ही जाँचा जा सकने वाला।',

  /* == Revenue intelligence — short lines ============================ */
  'Collection against target, leakage indicators, and near-term risk.':
    'लक्ष्य के सापेक्ष वसूली, रिसाव के संकेतक, और निकट भविष्य का जोखिम।',
  'Each district against its own target. Zero is on target.':
    'प्रत्येक ज़िला अपने ही लक्ष्य के सापेक्ष। शून्य अर्थात् लक्ष्य पर।',
  'Combined tax totals. No split by CGST, SGST, IGST or Cess is held.':
    'संयुक्त कर योग। CGST, SGST, IGST अथवा उपकर के अनुसार विभाजन उपलब्ध नहीं।',
  'Ranked by rupees of shortfall, on the current-period district ledger.':
    'कमी के रुपयों के अनुसार क्रम, वर्तमान अवधि के जिला लेखे पर।',
  'Audit recovery already booked against the gap.':
    'अंतर के सापेक्ष पहले ही दर्ज लेखापरीक्षा वसूली।',
  'What taxpayers actually realised, against their sector\'s own ratio.':
    'करदाताओं ने वास्तव में जो प्राप्त किया, उनके क्षेत्र के अपने अनुपात के सापेक्ष।',
  'Arithmetic, not an assessed liability. It says where to look.':
    'यह अंकगणित है, निर्धारित दायित्व नहीं। यह केवल बताता है कि कहाँ देखना है।',
  'An illustrative linear projection, not an official revenue forecast.':
    'दृष्टांत हेतु रैखिक प्रक्षेपण, आधिकारिक राजस्व पूर्वानुमान नहीं।',
  'Click an indicator to filter the register below.':
    'नीचे की पंजी फ़िल्टर करने हेतु संकेतक पर क्लिक करें।',

  /* == Statutory time — short lines ============================ */
  'Every open proceeding against its own limitation clock.':
    'प्रत्येक लंबित कार्यवाही अपनी ही परिसीमा घड़ी के सापेक्ष।',
  'Revenue lost to limitation is irreversible and attributable to a date.':
    'परिसीमा से खोया राजस्व अपरिवर्तनीय है और उसे तिथि से जोड़ा जा सकता है।',
  'Where no notice has issued, the notice deadline binds — months earlier.':
    'जहाँ नोटिस जारी नहीं हुआ वहाँ नोटिस की समय-सीमा बाध्यकारी — कई माह पहले की।',
  'The section decides the length of the clock.':
    'घड़ी की लंबाई धारा तय करती है।',
  'Statewide roll-up — this panel is not narrowed by the filters.':
    'राज्यव्यापी योग — यह पटल फ़िल्टर से सीमित नहीं होता।',

  /* == Recovery window bands — short lines ============================ */
  'Blocking, not pursuing — the cheapest recovery the department has.':
    'पीछा नहीं, रोकना — विभाग के पास सबसे सस्ती वसूली।',
  'Detectable in time. The whole delay is dwell after detection.':
    'समय पर पकड़ने योग्य। पूरा विलंब पहचान के बाद का ठहराव है।',
  'Needs a faster feed, not more officer-days.':
    'इसके लिए अधिक अधिकारी-दिवस नहीं, तेज़ स्रोत चाहिए।',
  'No signal can fire until the return that reveals it is filed.':
    'उसे उजागर करने वाली विवरणी दाखिल होने तक कोई संकेत लागू नहीं हो सकता।',
  'Credit is claimed in the same period the supplier declares it.':
    'आपूर्तिकर्ता जिस अवधि में घोषणा करता है, उसी अवधि में श्रेय का दावा होता है।',
  'A score-ordered queue sends officers to cases whose value has gone.':
    'अंक के क्रम की पंक्ति अधिकारियों को उन प्रकरणों में भेजती है जिनका मूल्य जा चुका है।',
  'These indicators are checkable on the day of application.':
    'ये संकेतक आवेदन के दिन ही जाँचे जा सकते हैं।',
  'The case waits after the signal is already visible.':
    'संकेत पहले ही दिखने लगने के बाद प्रकरण प्रतीक्षा करता रहता है।'
})
