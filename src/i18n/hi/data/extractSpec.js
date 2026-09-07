import { registerMessages } from '../../locale.js'

/**
 * Hindi — extractSpec.js: the format conventions, the seven files, the
 * per-column notes, and the legal and privacy positions to settle before the
 * request goes out.
 *
 * This document is addressed to GSTN, NIC and the divisions, and its whole
 * purpose is that a data owner can map a column to something in their own
 * system. So every identifier stays exactly as it will appear in the file:
 * column names (promoter_pan, jurisdiction_division), form numbers (GSTR-1,
 * GSTR-3B, GSTR-2B, DRC-01, DRC-07, ASMT-10, ADT-01), format tokens
 * (YYYY-MM-DD, ISO 8601, UTF-8, Parquet, UTC), and the sample GSTIN, PAN and
 * trade-name values. Translating any of them would break the mapping the
 * specification exists to enable.
 *
 * The note against each column IS translated, because that is what the data
 * owner reads to understand why the column is being asked for.
 *
 *   spine              → रीढ़
 *   join key           → जोड़ने की कुंजी
 *   hop                → चरण
 *   trajectory         → गति-पथ
 *   snapshot           → क्षणचित्र
 *   collision          → मेल
 *   purpose limitation → प्रयोजन सीमा
 *   retention          → प्रतिधारण
 */
registerMessages('hi', {
  /* == Format conventions =============================================== */
  'whatever you have': 'आपके पास जो कुछ हो',
  'All dates ISO 8601 (YYYY-MM-DD), no times, no timezone offsets.':
    'सभी तिथियाँ ISO 8601 (YYYY-MM-DD) में, समय के बिना, कालक्षेत्र अंतर के बिना।',
  'Limitation is computed in UTC. A local-midnight timestamp serialises to the previous day and moves every statutory deadline back by one, which is the kind of error that is only found in appeal.':
    'परिसीमा UTC में परिकलित होती है। स्थानीय मध्यरात्रि का समय-चिह्न पिछले दिन में बदल जाता है और प्रत्येक सांविधिक समय-सीमा एक दिन पीछे कर देता है — ऐसी त्रुटि केवल अपील में ही पकड़ में आती है।',
  'Distinguish null, zero and not-applicable. Use empty for unknown, 0 only for a true zero.':
    'रिक्त, शून्य और लागू-नहीं में भेद करें। अज्ञात हेतु रिक्त रखें, 0 केवल वास्तविक शून्य हेतु।',
  'The anomaly engine uses median absolute deviation. Nulls delivered as zeros collapse the peer median and make genuinely extreme entities look ordinary.':
    'असामान्यता यंत्र मध्यक निरपेक्ष विचलन का प्रयोग करता है। रिक्त मान शून्य के रूप में देने पर समकक्ष मध्यक गिर जाता है और वास्तव में चरम इकाइयाँ सामान्य दिखने लगती हैं।',
  'Amounts in rupees as integers, no formatting, no lakh/crore abbreviation.':
    'राशियाँ रुपये में पूर्णांक के रूप में, बिना किसी स्वरूपण के, लाख/करोड़ संक्षेप के बिना।',
  'Mixed units across divisions is the most common cause of a figure being wrong by a factor of one hundred.':
    'विभागों में भिन्न इकाइयों का प्रयोग ही किसी आँकड़े के सौ गुना गलत होने का सबसे सामान्य कारण है।',
  'GSTIN as the 15-character identifier, uppercase, unpadded.':
    'GSTIN 15 अक्षरों के पहचानकर्ता के रूप में, बड़े अक्षरों में, बिना कोई भराव जोड़े।',
  'It is the join key across every file in the extract.':
    'एक्सट्रैक्ट की प्रत्येक फाइल में जोड़ने की कुंजी यही है।',
  'Tax period as YYYY-MM for monthly and YYYY-YY for the financial year.':
    'कर अवधि मासिक हेतु YYYY-MM और वित्तीय वर्ष हेतु YYYY-YY के रूप में।',
  'Limitation attaches to the financial year, not the month, and mixing the two silently misassigns deadlines.':
    'परिसीमा माह से नहीं, वित्तीय वर्ष से जुड़ती है, और दोनों को मिला देने पर समय-सीमाएँ चुपचाप गलत नियत हो जाती हैं।',
  'UTF-8, comma-separated or Parquet, one file per entity type, header row required.':
    'UTF-8, अल्पविराम से विभाजित अथवा Parquet, प्रत्येक इकाई प्रकार हेतु एक फाइल, शीर्षक पंक्ति आवश्यक।',
  'Devanagari trade names are common and a non-UTF-8 export corrupts them irrecoverably.':
    'देवनागरी में व्यापारिक नाम सामान्य हैं और UTF-8 रहित निर्यात उन्हें स्थायी रूप से बिगाड़ देता है।',

  /* == File 1 — registration & identity ================================= */
  'Registration & identity': 'पंजीयन एवं पहचान',
  'GSTN — registration database': 'GSTN — पंजीयन डेटाबेस',
  'Case taxpayers plus all counterparties to one hop, identity fields at minimum for the second hop.':
    'प्रकरण के करदाता, तथा एक चरण तक के सभी प्रतिपक्ष, और दूसरे चरण हेतु न्यूनतम पहचान स्तंभ।',
  'This file is the spine. Without it no engine can traverse between registrations, and four of the fifteen engines cannot run at all.':
    'यह फाइल रीढ़ है। इसके बिना कोई यंत्र पंजीयनों के बीच भ्रमण नहीं कर सकता, और पंद्रह में से चार यंत्र चल ही नहीं सकते।',
  'Primary key across the extract.': 'संपूर्ण एक्सट्रैक्ट की प्राथमिक कुंजी।',
  'The highest-value field in this specification. Groups registrations to a common holder — the basis of every shell-network finding.':
    'इस विनिर्देश का सर्वाधिक मूल्यवान स्तंभ। पंजीयनों को एक ही धारक के अंतर्गत समूहबद्ध करता है — प्रत्येक दिखावटी-नेटवर्क निष्कर्ष का यही आधार।',
  'Private Limited Company': 'प्राइवेट लिमिटेड कंपनी',
  'Proprietorship, partnership, company, LLP, HUF, AOP.':
    'स्वामित्व संस्था, साझेदारी, कंपनी, LLP, HUF, AOP।',
  'Drives the new-registration indicator and cohort analysis.':
    'नए पंजीयन के संकेतक एवं समूह विश्लेषण का आधार।',
  'Active, suspended, cancelled, provisional.': 'सक्रिय, निलंबित, रद्द, अनंतिम।',
  'Required where status is cancelled. Links to the cancelled-registration PAN indicator.':
    'जहाँ स्थिति रद्द हो वहाँ आवश्यक। रद्द पंजीयन PAN संकेतक से जोड़ता है।',
  'Full address including PIN, not a district label.':
    'PIN सहित पूरा पता, केवल जिले का नाम नहीं।',
  'Separate column, not embedded in the address string — shared-premises detection joins on it.':
    'अलग स्तंभ, पते के पाठ में मिला हुआ नहीं — साझा परिसर की पहचान इसी स्तंभ पर जोड़ती है।',
  'Directors, partners or proprietor. Semicolon-separated where several. This is how connected registrations inherit exposure.':
    'निदेशक, साझेदार अथवा स्वामी। अनेक होने पर अर्धविराम से विभाजित। जुड़े पंजीयन जोखिम इसी मार्ग से विरासत में लेते हैं।',
  'text list': 'पाठ सूची',
  'Aligned index-for-index with promoter_pan.': 'promoter_pan के साथ क्रमांक-दर-क्रमांक संरेखित।',
  'Frequently the strongest linkage field in shell networks, because a single signatory serves many registrations.':
    'दिखावटी नेटवर्कों में प्रायः यही सबसे प्रबल संबंध स्तंभ होता है, क्योंकि एक ही हस्ताक्षरकर्ता अनेक पंजीयनों के लिए काम करता है।',
  'Value is in collisions across registrations, not in the address itself.':
    'मूल्य पते में नहीं, अनेक पंजीयनों के बीच के मेल में है।',
  'As above.': 'उपर्युक्तानुसार।',
  'Declared at registration. Supports the economic-substance test against what is actually invoiced.':
    'पंजीयन के समय घोषित। वास्तव में किसका बीजक बनता है उसके सापेक्ष आर्थिक सारवत्ता परीक्षण को सहारा देता है।',
  Departmental: 'विभागीय',
  'Must match the division names used in the officer establishment file exactly.':
    'अधिकारी स्थापना फाइल में प्रयुक्त विभाग नामों से ठीक-ठीक मेल खाना चाहिए।',

  /* == File 2 — returns ================================================= */
  'Returns — period level': 'विवरणियाँ — अवधि स्तर',
  'GSTN — returns': 'GSTN — विवरणियाँ',
  'All periods for the last 36 months for every GSTIN in the registration file.':
    'पंजीयन फाइल के प्रत्येक GSTIN हेतु पिछले 36 माह की सभी अवधियाँ।',
  'One row per GSTIN per period. Thirty-six months turns a snapshot into a trajectory, which is the whole of engine 5 and materially improves 4 and 13.':
    'प्रत्येक GSTIN हेतु प्रत्येक अवधि की एक पंक्ति। छत्तीस माह क्षणचित्र को गति-पथ में बदल देते हैं, और यंत्र 5 पूर्णतः इसी पर निर्भर है तथा 4 एवं 13 में भी तात्त्विक सुधार होता है।',
  'YYYY-MM.': 'YYYY-MM.',
  'Limitation attaches here, not to the month.': 'परिसीमा यहाँ जुड़ती है, माह से नहीं।',
  'Null where not filed. Do not substitute a zero.':
    'दाखिल न होने पर रिक्त। उसके स्थान पर शून्य न रखें।',
  'Filing lateness is a trajectory feature, not a flag.':
    'विवरणी में विलंब गति-पथ का लक्षण है, चिह्न नहीं।',
  'GSTR-1.': 'GSTR-1.',
  'CGST + SGST + IGST combined, with the split below.':
    'CGST + SGST + IGST संयुक्त, और नीचे उनका विभाजन।',
  'GSTR-3B table 4A.': 'GSTR-3B तालिका 4A.',
  'Reversal behaviour distinguishes a correction from a pattern.':
    'प्रत्यावर्तन का व्यवहार सुधार और प्रतिरूप में भेद करता है।',
  'The cash-versus-credit split is the strongest single ratio in the risk set.':
    'नकद बनाम श्रेय का विभाजन जोखिम समुच्चय का सबसे प्रबल एकल अनुपात है।',
  'GSTR-2B auto-populated. The gap against itc_availed is the ineligible-credit signal.':
    'GSTR-2B से स्वतः भरा हुआ। itc_availed के सापेक्ष अंतर ही अपात्र श्रेय का संकेत है।',

  /* == File 3 — invoice-level flow ===================================== */
  'Invoice-level supply flow': 'बीजक-स्तर आपूर्ति प्रवाह',
  'GSTN — GSTR-1 / 2B': 'GSTN — GSTR-1 / 2B',
  'All B2B invoices for the case taxpayers and their first-hop counterparties, last 24 months.':
    'प्रकरण के करदाताओं तथा उनके प्रथम-चरण प्रतिपक्षों के पिछले 24 माह के सभी B2B बीजक।',
  'Propagation between GSTIN layers cannot be traced from period aggregates. This file is what turns cluster-level exposure into a credit chain with named hops.':
    'GSTIN स्तरों के बीच प्रसार का पता अवधि के समेकित आँकड़ों से नहीं लगाया जा सकता। समूह-स्तर की जोखिम राशि को नामित चरणों वाली श्रेय शृंखला में बदलने वाली यही फाइल है।',
  'The edge. Without both ends there is no graph.':
    'यही कड़ी है। दोनों सिरों के बिना कोई आरेख नहीं।',
  'Evidence must name a document, not a period.':
    'साक्ष्य को अवधि नहीं, किसी दस्तावेज का नाम लेना चाहिए।',
  'Economic substance: goods invoiced against goods the entity is registered to deal in.':
    'आर्थिक सारवत्ता: इकाई जिन वस्तुओं का व्यापार करने हेतु पंजीकृत है उनके सापेक्ष बीजक में दर्ज वस्तुएँ।',
  'State code.': 'राज्य कूट।',
  'Amendment patterns distinguish error from construction.':
    'संशोधन के प्रतिरूप त्रुटि और सोची-समझी रचना में भेद करते हैं।',

  /* == File 4 — notices and proceedings ================================= */
  'Notices, cases and proceedings': 'नोटिस, प्रकरण एवं कार्यवाहियाँ',
  'GSTN Back Office / departmental': 'GSTN बैक ऑफिस / विभागीय',
  'Every proceeding against the 500 case taxpayers, open and closed, for the last 10 years.':
    '500 प्रकरण करदाताओं के विरुद्ध पिछले 10 वर्षों की प्रत्येक कार्यवाही, लंबित एवं निपटाई गई दोनों।',
  'Ten years, not the pilot window. The outcome tier needs history, and history cannot be collected retrospectively later.':
    'दस वर्ष, पायलट की अवधि नहीं। परिणाम स्तर को इतिहास चाहिए, और इतिहास बाद में पूर्वव्यापी रूप से एकत्र नहीं किया जा सकता।',
  'The period the demand relates to — drives limitation.':
    'माँग जिस अवधि से संबंधित है वह — परिसीमा इसी से तय होती है।',
  'ASMT-10, DRC-01, DRC-07, ADT-01 and so on. Use the form number.':
    'ASMT-10, DRC-01, DRC-07, ADT-01 इत्यादि। प्रपत्र संख्या का ही प्रयोग करें।',
  'As raised, before any appellate variation.':
    'जैसी खड़ी की गई, अपील में किसी परिवर्तन से पूर्व।',
  'Where an extended limitation period was applied. Identifies exposure to the pending Supreme Court decision.':
    'जहाँ बढ़ाई गई परिसीमा अवधि लागू की गई। उच्चतम न्यायालय के लंबित निर्णय से उत्पन्न जोखिम की पहचान करता है।',
  'Joins to the establishment file.': 'स्थापना फाइल से जुड़ता है।',

  /* == File 5 — outcomes ============================================== */
  'Adjudication and appellate outcomes': 'न्यायनिर्णयन एवं अपीलीय परिणाम',
  'Departmental — adjudication, appeals, recovery': 'विभागीय — न्यायनिर्णयन, अपीलें, वसूली',
  'Every concluded proceeding for the last 10 years, not only those against the 500.':
    'पिछले 10 वर्षों की प्रत्येक निपटाई गई कार्यवाही, केवल उन 500 के विरुद्ध की ही नहीं।',
  'This is the file that cannot be bought later. Four engines depend on it and none of them can be validated in the pilot without it. The three fields below marked critical are the ones that decide whether a model learns why demands hold up or merely who the taxpayer was.':
    'यह वह फाइल है जो बाद में खरीदी नहीं जा सकती। चार यंत्र इस पर निर्भर हैं और इसके बिना उनमें से किसी की भी पायलट में पुष्टि नहीं हो सकती। नीचे निर्णायक अंकित तीन स्तंभ ही तय करते हैं कि प्रारूप यह सीखेगा कि माँगें क्यों टिकती हैं, या केवल यह कि करदाता कौन था।',
  'Confirmed, reduced, set aside, remanded, dropped, withdrawn.':
    'पुष्ट, घटाई गई, अपास्त, पुनर्विचार हेतु प्रतिप्रेषित, छोड़ी गई, वापस ली गई।',
  Merits: 'गुण-दोष',
  'CRITICAL. Merits, limitation, procedural defect, jurisdiction, quantum. Mixing a case lost on limitation with one lost on merits trains a model on two different questions at once.':
    'निर्णायक। गुण-दोष, परिसीमा, प्रक्रियागत दोष, अधिकारिता, राशि। परिसीमा पर हारे प्रकरण को गुण-दोष पर हारे प्रकरण में मिला देने पर प्रारूप एक साथ दो भिन्न प्रश्नों पर सीखता है।',
  'CRITICAL. Whether suppression or wilful misstatement was actually held, not whether Section 74 was invoked. Charging habits are not wins.':
    'निर्णायक। धारा 74 लगाई गई थी या नहीं, बल्कि तथ्य छिपाना अथवा जानबूझकर मिथ्या कथन वास्तव में सिद्ध हुआ था या नहीं। आरोप लगाने की आदतें जीत नहीं हैं।',
  'CRITICAL. What was produced and accepted. This is the only field that describes why a demand held up — every other field describes the taxpayer.':
    'निर्णायक। क्या प्रस्तुत हुआ और क्या स्वीकार हुआ। माँग क्यों टिकी, यह वर्णन करने वाला यही एकमात्र स्तंभ है — शेष प्रत्येक स्तंभ करदाता का वर्णन करता है।',
  'As finally sustained, which is rarely the amount raised.':
    'जैसी अंततः टिकी, और वह खड़ी की गई राशि के बराबर विरले ही होती है।',
  'Actually collected. Turns the recovery curve from an assumption into an observation.':
    'वास्तव में वसूली गई। वसूली वक्र को मान्यता से अवलोकन में बदल देती है।',
  'The lag between order and collection is itself a finding.':
    'आदेश और वसूली के बीच का विलंब स्वयं एक निष्कर्ष है।',
  'Appellate Authority, Tribunal, High Court, Supreme Court.':
    'अपीलीय प्राधिकारी, अधिकरण, उच्च न्यायालय, उच्चतम न्यायालय।',

  /* == File 6 — e-way bill ============================================= */
  'E-way bill movement': 'ई-वे बिल परिवहन',
  'All e-way bills for the case taxpayers and first-hop counterparties, last 24 months.':
    'प्रकरण के करदाताओं एवं प्रथम-चरण प्रतिपक्षों के पिछले 24 माह के सभी ई-वे बिल।',
  'Goods movement against declared supply is one of the few economic-substance tests available without a physical visit.':
    'घोषित आपूर्ति के सापेक्ष माल परिवहन उन गिने-चुने आर्थिक-सारवत्ता परीक्षणों में से एक है जो भौतिक भ्रमण के बिना उपलब्ध हैं।',
  'Implausible distance against vehicle and time is a substance signal.':
    'वाहन एवं समय के सापेक्ष असंभव प्रतीत होती दूरी सारवत्ता का संकेत है।',
  'Vehicle reuse across unrelated entities is a linkage signal.':
    'असंबंधित इकाइयों में एक ही वाहन का पुनः प्रयोग संबंध का संकेत है।',

  /* == File 7 — officer establishment ================================== */
  'Officer establishment': 'अधिकारी स्थापना',
  'Departmental — establishment': 'विभागीय — स्थापना',
  'All field officers in the divisions covered by the pilot.':
    'पायलट में सम्मिलित विभागों के सभी क्षेत्रीय अधिकारी।',
  'Capacity is modelled as a constrained assignment under territorial and role eligibility. Without the posting table the deployment findings cannot be computed at all.':
    'क्षमता का प्रारूप क्षेत्रीय एवं पद-आधारित पात्रता के अधीन बाधित नियतन के रूप में बना है। तैनाती तालिका के बिना तैनाती संबंधी निष्कर्ष परिकलित ही नहीं हो सकते।',
  'Determines which case types the officer may take.':
    'अधिकारी किस प्रकार के प्रकरण ले सकता है, यह तय करता है।',
  'Must match registration.jurisdiction_division exactly.':
    'registration.jurisdiction_division से ठीक-ठीक मेल खाना चाहिए।',
  'Distinguishes a vacant post from an absent one — a vacancy is a different decision from a deployment gap.':
    'रिक्त पद और अस्तित्वहीन पद में भेद करता है — रिक्ति तैनाती की कमी से भिन्न निर्णय है।',

  /* == Legal and privacy position ====================================== */
  'Bank and account signals': 'बैंक एवं खाता संकेत',
  'Deliberately excluded from this specification.': 'इस विनिर्देश से जानबूझकर बाहर रखे गए।',
  'The brief lists bank signals "where lawfully available". That qualifier does the work: access is constrained and varies by instrument. It should be scoped separately with the Legal Branch and only then added, rather than assumed into a data request and discovered to be unavailable after the extract is built.':
    'टिप्पणी में बैंक संकेतों का उल्लेख "जहाँ विधिपूर्वक उपलब्ध हों" के साथ है। उतने ही शब्दों में सब कुछ आ जाता है: पहुँच सीमित है और साधन के अनुसार बदलती है। इसकी व्याप्ति विधि शाखा के साथ अलग से तय की जानी चाहिए और तभी इसे जोड़ा जाना चाहिए — आँकड़ा माँग में मान लेने और एक्सट्रैक्ट बन जाने के बाद अनुपलब्ध पाए जाने से बचना चाहिए।',
  'Promoter PAN and personal identifiers': 'प्रवर्तक PAN एवं व्यक्तिगत पहचानकर्ता',
  'Required, and to be handled as personal data.':
    'आवश्यक, और व्यक्तिगत आँकड़ों के रूप में ही संभाले जाएँ।',
  'Promoter PAN and name identify natural persons. They belong in the extract because the linkage capability depends on them, but access should be role-restricted, logged, and the retention period fixed in advance rather than left open.':
    'प्रवर्तक PAN एवं नाम प्राकृतिक व्यक्तियों की पहचान कराते हैं। संबंध पहचानने की क्षमता उन्हीं पर निर्भर है इसलिए वे एक्सट्रैक्ट में होने चाहिए, किंतु उन तक पहुँच पद-आधारित रूप से सीमित हो, दर्ज हो, और प्रतिधारण अवधि खुली छोड़ने के बजाय पहले से नियत हो।',
  'Purpose limitation': 'प्रयोजन सीमा',
  'State it in the request.': 'उसे माँग में ही स्पष्ट लिखें।',
  'The extract is for building and validating risk intelligence for the department. Saying so in the request is what allows a data owner to approve it quickly instead of escalating.':
    'यह एक्सट्रैक्ट विभाग हेतु जोखिम इंटेलिजेंस बनाने और उसकी पुष्टि करने के लिए है। माँग में यह लिख देने से ही आँकड़ा-धारक उसे वरिष्ठ स्तर पर भेजने के बजाय शीघ्र अनुमोदित कर पाता है।',
  'The 500 cases define the sample, not the extract. Every graph engine needs the counterparties of the case taxpayers and, for anything closing a circular pattern, the counterparties of those. An extract of exactly 500 GSTINs truncates every network at the sample boundary — every chain appears to end and no cycle can close, so the engines return nothing for a reason that has nothing to do with the taxpayers. Registration and returns detail is needed for the case taxpayers and their first hop; identity fields alone suffice for the second. Expect several thousand GSTINs rather than five hundred.':
    '500 प्रकरण नमूना तय करते हैं, एक्सट्रैक्ट नहीं। प्रत्येक आरेख यंत्र को प्रकरण के करदाताओं के प्रतिपक्ष चाहिए, और वर्तुलाकार प्रतिरूप पूरा करने वाली किसी भी बात के लिए उन प्रतिपक्षों के भी प्रतिपक्ष चाहिए। ठीक 500 GSTIN का एक्सट्रैक्ट प्रत्येक नेटवर्क को नमूने की सीमा पर काट देता है — प्रत्येक शृंखला वहीं समाप्त होती प्रतीत होती है और कोई चक्र पूरा नहीं हो पाता, इसलिए यंत्र कुछ नहीं लौटाते और उसका कारण करदाताओं से बिल्कुल संबंधित नहीं होता। पंजीयन एवं विवरणियों का विवरण प्रकरण के करदाताओं और उनके प्रथम चरण हेतु चाहिए; दूसरे चरण हेतु केवल पहचान स्तंभ पर्याप्त हैं। पाँच सौ नहीं, कई हज़ार GSTIN की अपेक्षा रखें।'
})
