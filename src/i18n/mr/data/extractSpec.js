import { registerMessages } from '../../locale.js'

/**
 * Marathi — extractSpec.js: the format conventions, the seven files, the
 * per-column notes, and the legal and privacy positions to settle before the
 * request goes out.
 *
 * WHAT STAYS IN LATIN, AND WHY IT MUST
 *
 * This document is addressed to GSTN, NIC and the divisions, and its whole
 * purpose is that a data owner can map a column to something in their own
 * system. So every identifier stays exactly as it will appear in the file:
 * column names (promoter_pan, jurisdiction_division), form numbers (GSTR-1,
 * GSTR-3B, GSTR-2B, DRC-01, DRC-07, ASMT-10, ADT-01), format tokens
 * (YYYY-MM-DD, ISO 8601, UTF-8, Parquet, UTC), the sample GSTIN and PAN
 * values, and the example trade name. Translating any of them would break the
 * mapping the specification exists to enable.
 *
 * The note against each column IS translated, because that is what the data
 * owner reads to understand why the column is being asked for.
 *
 *   spine            → कणा
 *   join key         → जोडणीची किल्ली
 *   hop              → टप्पा
 *   trajectory       → वाटचाल
 *   snapshot         → क्षणचित्र
 *   collision        → जुळणी
 *   purpose limitation → प्रयोजन मर्यादा
 *   retention        → जतन
 */
registerMessages('mr', {
  /* == Format conventions =============================================== */
  'whatever you have': 'तुमच्याकडे जे काही असेल ते',
  'All dates ISO 8601 (YYYY-MM-DD), no times, no timezone offsets.':
    'सर्व तारखा ISO 8601 (YYYY-MM-DD) स्वरूपात, वेळेशिवाय, कालक्षेत्र फरकाशिवाय.',
  'Limitation is computed in UTC. A local-midnight timestamp serialises to the previous day and moves every statutory deadline back by one, which is the kind of error that is only found in appeal.':
    'मुदत UTC मध्ये परिगणित होते. स्थानिक मध्यरात्रीचा वेळ-शिक्का आदल्या दिवसात रूपांतरित होतो आणि प्रत्येक सांविधिक मुदत एका दिवसाने मागे नेतो — अशा प्रकारची चूक केवळ अपिलातच उघड होते.',
  'Distinguish null, zero and not-applicable. Use empty for unknown, 0 only for a true zero.':
    'रिक्त, शून्य व लागू नाही यांत भेद करा. अज्ञात असल्यास रिकामे ठेवा, 0 केवळ खऱ्या शून्यासाठीच वापरा.',
  'The anomaly engine uses median absolute deviation. Nulls delivered as zeros collapse the peer median and make genuinely extreme entities look ordinary.':
    'असामान्यता यंत्रणा मध्यक निरपेक्ष विचलन वापरते. रिक्त मूल्ये शून्य म्हणून दिल्यास समकक्ष मध्यक कोसळतो आणि खरोखर टोकाचे घटक सामान्य दिसू लागतात.',
  'Amounts in rupees as integers, no formatting, no lakh/crore abbreviation.':
    'रकमा रुपयांत पूर्णांक स्वरूपात, कोणत्याही स्वरूपणाशिवाय, लाख/कोटी संक्षेपाशिवाय.',
  'Mixed units across divisions is the most common cause of a figure being wrong by a factor of one hundred.':
    'विभागांमध्ये वेगवेगळी एकके वापरणे हेच आकडा शंभर पटींनी चुकण्याचे सर्वात नेहमीचे कारण आहे.',
  'GSTIN as the 15-character identifier, uppercase, unpadded.':
    'GSTIN हा १५ अक्षरी ओळखक्रमांक म्हणून, कॅपिटलमध्ये, कोणतीही भर न घालता.',
  'It is the join key across every file in the extract.':
    'एक्सट्रॅक्टमधील प्रत्येक फाइलमध्ये जोडणीची किल्ली हीच आहे.',
  'Tax period as YYYY-MM for monthly and YYYY-YY for the financial year.':
    'कर कालावधी मासिकासाठी YYYY-MM आणि आर्थिक वर्षासाठी YYYY-YY स्वरूपात.',
  'Limitation attaches to the financial year, not the month, and mixing the two silently misassigns deadlines.':
    'मुदत ही महिन्याला नव्हे तर आर्थिक वर्षाला जोडलेली असते, आणि या दोहोंची गल्लत केल्यास मुदती निःशब्दपणे चुकीच्या नेमल्या जातात.',
  'UTF-8, comma-separated or Parquet, one file per entity type, header row required.':
    'UTF-8, स्वल्पविरामाने विभागलेली किंवा Parquet, प्रत्येक घटक प्रकारासाठी एक फाइल, शीर्षक ओळ आवश्यक.',
  'Devanagari trade names are common and a non-UTF-8 export corrupts them irrecoverably.':
    'देवनागरीतील व्यापारी नावे सामान्य आहेत आणि UTF-8 नसलेल्या निर्यातीत ती कायमची बिघडतात.',

  /* == File 1 — registration & identity ================================= */
  'Registration & identity': 'नोंदणी व ओळख',
  'GSTN — registration database': 'GSTN — नोंदणी डेटाबेस',
  'Case taxpayers plus all counterparties to one hop, identity fields at minimum for the second hop.':
    'प्रकरणातील करदाते, तसेच एका टप्प्यापर्यंतचे सर्व प्रतिपक्ष, आणि दुसऱ्या टप्प्यासाठी किमान ओळख क्षेत्रे.',
  'This file is the spine. Without it no engine can traverse between registrations, and four of the fifteen engines cannot run at all.':
    'ही फाइल म्हणजे कणा. तिच्याशिवाय कोणतीही यंत्रणा नोंदण्यांदरम्यान भ्रमण करू शकत नाही, आणि पंधरांपैकी चार यंत्रणा चालूच शकत नाहीत.',
  'Primary key across the extract.': 'संपूर्ण एक्सट्रॅक्टमधील मुख्य किल्ली.',
  'The highest-value field in this specification. Groups registrations to a common holder — the basis of every shell-network finding.':
    'या विनिर्देशातील सर्वाधिक मूल्याचे क्षेत्र. नोंदण्या एकाच धारकाखाली गटबद्ध करते — बनावट जाळ्यांच्या प्रत्येक निष्कर्षाचा हाच आधार.',
  'Private Limited Company': 'खाजगी मर्यादित कंपनी',
  'Proprietorship, partnership, company, LLP, HUF, AOP.':
    'मालकी संस्था, भागीदारी, कंपनी, LLP, HUF, AOP.',
  'Drives the new-registration indicator and cohort analysis.':
    'नवीन नोंदणी निर्देशक व समूह विश्लेषण यांचा आधार.',
  'Active, suspended, cancelled, provisional.': 'सक्रिय, निलंबित, रद्द, तात्पुरती.',
  'Required where status is cancelled. Links to the cancelled-registration PAN indicator.':
    'स्थिती रद्द असेल तिथे आवश्यक. रद्द नोंदणी PAN निर्देशकाशी जोडते.',
  'Full address including PIN, not a district label.':
    'PIN सह संपूर्ण पत्ता, केवळ जिल्ह्याचे नाव नव्हे.',
  'Separate column, not embedded in the address string — shared-premises detection joins on it.':
    'स्वतंत्र स्तंभ, पत्त्याच्या मजकुरात मिसळलेला नको — समान जागा शोधणे याच स्तंभावर जोडणी करते.',
  'Directors, partners or proprietor. Semicolon-separated where several. This is how connected registrations inherit exposure.':
    'संचालक, भागीदार किंवा मालक. अनेक असल्यास अर्धविरामाने विभागलेले. जोडलेल्या नोंदण्या जोखीम याच मार्गाने वारशाने घेतात.',
  'text list': 'मजकूर सूची',
  'Aligned index-for-index with promoter_pan.': 'promoter_pan शी क्रमांकानुसार तंतोतंत जुळलेली.',
  'Frequently the strongest linkage field in shell networks, because a single signatory serves many registrations.':
    'बनावट जाळ्यांमध्ये हे अनेकदा सर्वात प्रबळ संबंध क्षेत्र असते, कारण एकच स्वाक्षरीकर्ता अनेक नोंदण्यांसाठी काम करतो.',
  'Value is in collisions across registrations, not in the address itself.':
    'मूल्य हे पत्त्यात नसून अनेक नोंदण्यांमधील जुळणीत आहे.',
  'As above.': 'वरीलप्रमाणे.',
  'Declared at registration. Supports the economic-substance test against what is actually invoiced.':
    'नोंदणीच्या वेळी घोषित. प्रत्यक्षात कशाची बीजके दिली जातात त्याच्या तुलनेत आर्थिक सारभूततेच्या चाचणीस आधार देते.',
  Departmental: 'विभागीय',
  'Must match the division names used in the officer establishment file exactly.':
    'अधिकारी आस्थापना फाइलमध्ये वापरलेल्या विभाग नावांशी तंतोतंत जुळले पाहिजे.',

  /* == File 2 — returns ================================================= */
  'Returns — period level': 'विवरणपत्रे — कालावधी पातळी',
  'GSTN — returns': 'GSTN — विवरणपत्रे',
  'All periods for the last 36 months for every GSTIN in the registration file.':
    'नोंदणी फाइलमधील प्रत्येक GSTIN साठी गेल्या ३६ महिन्यांतील सर्व कालावधी.',
  'One row per GSTIN per period. Thirty-six months turns a snapshot into a trajectory, which is the whole of engine 5 and materially improves 4 and 13.':
    'प्रत्येक GSTIN साठी प्रत्येक कालावधीची एक ओळ. छत्तीस महिने क्षणचित्राचे रूपांतर वाटचालीत करतात, आणि यंत्रणा ५ संपूर्णपणे यावरच अवलंबून असून ४ व १३ यांतही लक्षणीय सुधारणा होते.',
  'YYYY-MM.': 'YYYY-MM.',
  'Limitation attaches here, not to the month.': 'मुदत इथे जोडली जाते, महिन्याला नव्हे.',
  'Null where not filed. Do not substitute a zero.':
    'दाखल न केल्यास रिक्त. त्याऐवजी शून्य टाकू नका.',
  'Filing lateness is a trajectory feature, not a flag.':
    'विवरणपत्र उशिरा भरणे हे वाटचालीचे वैशिष्ट्य आहे, निदर्शक नव्हे.',
  'GSTR-1.': 'GSTR-1.',
  'CGST + SGST + IGST combined, with the split below.':
    'CGST + SGST + IGST एकत्रित, आणि खाली त्यांची विभागणी.',
  'GSTR-3B table 4A.': 'GSTR-3B तक्ता 4A.',
  'Reversal behaviour distinguishes a correction from a pattern.':
    'उलटवण्याचे वर्तन दुरुस्ती व नमुना यांत भेद करते.',
  'The cash-versus-credit split is the strongest single ratio in the risk set.':
    'रोख विरुद्ध श्रेय ही विभागणी जोखीम संचातील सर्वात प्रबळ एकमेव गुणोत्तर आहे.',
  'GSTR-2B auto-populated. The gap against itc_availed is the ineligible-credit signal.':
    'GSTR-2B मधून आपोआप भरलेले. itc_availed च्या तुलनेतील तफावत हाच अपात्र श्रेयाचा संकेत.',

  /* == File 3 — invoice-level flow ===================================== */
  'Invoice-level supply flow': 'बीजक-पातळीवरील पुरवठा प्रवाह',
  'GSTN — GSTR-1 / 2B': 'GSTN — GSTR-1 / 2B',
  'All B2B invoices for the case taxpayers and their first-hop counterparties, last 24 months.':
    'प्रकरणातील करदाते व त्यांचे पहिल्या टप्प्यातील प्रतिपक्ष यांची गेल्या २४ महिन्यांतील सर्व B2B बीजके.',
  'Propagation between GSTIN layers cannot be traced from period aggregates. This file is what turns cluster-level exposure into a credit chain with named hops.':
    'GSTIN स्तरांदरम्यानच्या प्रसाराचा माग कालावधीच्या एकत्रित आकड्यांवरून काढता येत नाही. गट-पातळीवरील जोखीम रकमेचे रूपांतर नावासह टप्पे असलेल्या श्रेय साखळीत करणारी हीच फाइल आहे.',
  'The edge. Without both ends there is no graph.':
    'ही कडी. दोन्ही टोके नसतील तर आलेखच नाही.',
  'Evidence must name a document, not a period.':
    'पुराव्याने कालावधीचे नव्हे तर कागदपत्राचे नाव घेतले पाहिजे.',
  'Economic substance: goods invoiced against goods the entity is registered to deal in.':
    'आर्थिक सारभूतता: ज्या मालाचा व्यवहार करण्यासाठी घटक नोंदणीकृत आहे त्याच्या तुलनेत बीजक दिलेला माल.',
  'State code.': 'राज्य संकेतांक.',
  'Amendment patterns distinguish error from construction.':
    'दुरुस्तीचे नमुने चूक व जाणीवपूर्वक रचना यांत भेद करतात.',

  /* == File 4 — notices and proceedings ================================= */
  'Notices, cases and proceedings': 'नोटिसा, प्रकरणे व कार्यवाही',
  'GSTN Back Office / departmental': 'GSTN बॅक ऑफिस / विभागीय',
  'Every proceeding against the 500 case taxpayers, open and closed, for the last 10 years.':
    '५०० प्रकरण करदात्यांविरुद्धची गेल्या १० वर्षांतील प्रत्येक कार्यवाही, प्रलंबित व निकाली दोन्ही.',
  'Ten years, not the pilot window. The outcome tier needs history, and history cannot be collected retrospectively later.':
    'दहा वर्षे, पायलटचा कालावधी नव्हे. निष्कर्ष स्तराला इतिहास लागतो, आणि इतिहास नंतर पूर्वलक्ष्यी पद्धतीने गोळा करता येत नाही.',
  'The period the demand relates to — drives limitation.':
    'मागणी ज्या कालावधीशी संबंधित आहे तो — मुदत यावरून ठरते.',
  'ASMT-10, DRC-01, DRC-07, ADT-01 and so on. Use the form number.':
    'ASMT-10, DRC-01, DRC-07, ADT-01 इत्यादी. नमुना क्रमांकच वापरा.',
  'As raised, before any appellate variation.':
    'जशी उभी केली तशी, अपिलात कोणताही बदल होण्यापूर्वीची.',
  'Where an extended limitation period was applied. Identifies exposure to the pending Supreme Court decision.':
    'जिथे वाढवलेली मुदत लावली गेली तिथे. सर्वोच्च न्यायालयाच्या प्रलंबित निर्णयामुळे निर्माण होणारी जोखीम ओळखते.',
  'Joins to the establishment file.': 'आस्थापना फाइलशी जोडणी करते.',

  /* == File 5 — outcomes ============================================== */
  'Adjudication and appellate outcomes': 'न्यायनिर्णयन व अपील निष्कर्ष',
  'Departmental — adjudication, appeals, recovery': 'विभागीय — न्यायनिर्णयन, अपिले, वसुली',
  'Every concluded proceeding for the last 10 years, not only those against the 500.':
    'गेल्या १० वर्षांतील प्रत्येक निकाली कार्यवाही, केवळ त्या ५०० विरुद्धच्याच नव्हे.',
  'This is the file that cannot be bought later. Four engines depend on it and none of them can be validated in the pilot without it. The three fields below marked critical are the ones that decide whether a model learns why demands hold up or merely who the taxpayer was.':
    'ही अशी फाइल आहे जी नंतर विकत घेता येत नाही. चार यंत्रणा तिच्यावर अवलंबून आहेत आणि तिच्याशिवाय त्यांपैकी एकाचीही पायलटमध्ये पडताळणी करता येणार नाही. खाली निर्णायक म्हणून चिन्हांकित केलेली तीन क्षेत्रे हीच ठरवतात की प्रारूप मागण्या का टिकतात हे शिकते की केवळ करदाता कोण होता एवढेच.',
  'Confirmed, reduced, set aside, remanded, dropped, withdrawn.':
    'कायम, कमी केलेली, बाजूला ठेवलेली, फेरविचारार्थ परत, वगळलेली, मागे घेतलेली.',
  Merits: 'गुणवत्ता',
  'CRITICAL. Merits, limitation, procedural defect, jurisdiction, quantum. Mixing a case lost on limitation with one lost on merits trains a model on two different questions at once.':
    'निर्णायक. गुणवत्ता, मुदत, कार्यपद्धतीतील त्रुटी, अधिकारक्षेत्र, रक्कम. मुदतीवर हरलेले प्रकरण गुणवत्तेवर हरलेल्या प्रकरणात मिसळल्यास प्रारूप एकाच वेळी दोन वेगळ्या प्रश्नांवर शिकते.',
  'CRITICAL. Whether suppression or wilful misstatement was actually held, not whether Section 74 was invoked. Charging habits are not wins.':
    'निर्णायक. कलम ७४ लावले होते का नव्हे, तर माहिती दडवणे किंवा जाणीवपूर्वक चुकीचे कथन प्रत्यक्षात सिद्ध झाले होते का. आरोप ठेवण्याच्या सवयी म्हणजे यश नव्हे.',
  'CRITICAL. What was produced and accepted. This is the only field that describes why a demand held up — every other field describes the taxpayer.':
    'निर्णायक. काय सादर केले गेले व काय स्वीकारले गेले. मागणी का टिकली याचे वर्णन करणारे हे एकमेव क्षेत्र आहे — इतर प्रत्येक क्षेत्र करदात्याचे वर्णन करते.',
  'As finally sustained, which is rarely the amount raised.':
    'अखेरीस जशी टिकली तशी, आणि ती उभी केलेल्या रकमेइतकी क्वचितच असते.',
  'Actually collected. Turns the recovery curve from an assumption into an observation.':
    'प्रत्यक्षात वसूल झालेली. वसुली वक्राचे रूपांतर गृहीतकाकडून निरीक्षणात करते.',
  'The lag between order and collection is itself a finding.':
    'आदेश व वसुली यांतील विलंब हा स्वतःच एक निष्कर्ष आहे.',
  'Appellate Authority, Tribunal, High Court, Supreme Court.':
    'अपील प्राधिकारी, न्यायाधिकरण, उच्च न्यायालय, सर्वोच्च न्यायालय.',

  /* == File 6 — e-way bill ============================================= */
  'E-way bill movement': 'ई-वे बिल वाहतूक',
  'All e-way bills for the case taxpayers and first-hop counterparties, last 24 months.':
    'प्रकरणातील करदाते व पहिल्या टप्प्यातील प्रतिपक्ष यांची गेल्या २४ महिन्यांतील सर्व ई-वे बिले.',
  'Goods movement against declared supply is one of the few economic-substance tests available without a physical visit.':
    'घोषित पुरवठ्याच्या तुलनेत माल वाहतूक ही प्रत्यक्ष भेटीशिवाय उपलब्ध असलेल्या मोजक्या आर्थिक सारभूतता चाचण्यांपैकी एक आहे.',
  'Implausible distance against vehicle and time is a substance signal.':
    'वाहन व वेळेच्या तुलनेत अशक्य वाटणारे अंतर हा सारभूततेचा संकेत आहे.',
  'Vehicle reuse across unrelated entities is a linkage signal.':
    'असंबंधित घटकांमध्ये एकच वाहन पुन्हा वापरले जाणे हा संबंधाचा संकेत आहे.',

  /* == File 7 — officer establishment ================================== */
  'Officer establishment': 'अधिकारी आस्थापना',
  'Departmental — establishment': 'विभागीय — आस्थापना',
  'All field officers in the divisions covered by the pilot.':
    'पायलटमध्ये समाविष्ट विभागांतील सर्व क्षेत्रीय अधिकारी.',
  'Capacity is modelled as a constrained assignment under territorial and role eligibility. Without the posting table the deployment findings cannot be computed at all.':
    'क्षमतेचे प्रारूप प्रादेशिक व पदनिहाय पात्रतेखालील मर्यादित नेमणूक म्हणून मांडले आहे. नियुक्ती तक्त्याशिवाय नियुक्तीविषयक निष्कर्ष परिगणितच करता येत नाहीत.',
  'Determines which case types the officer may take.':
    'अधिकारी कोणत्या प्रकारची प्रकरणे घेऊ शकतो हे ठरवते.',
  'Must match registration.jurisdiction_division exactly.':
    'registration.jurisdiction_division शी तंतोतंत जुळले पाहिजे.',
  'Distinguishes a vacant post from an absent one — a vacancy is a different decision from a deployment gap.':
    'रिक्त पद व अस्तित्वातच नसलेले पद यांत भेद करते — रिक्त पद हा नियुक्तीतील त्रुटीहून वेगळा निर्णय आहे.',

  /* == Legal and privacy position ====================================== */
  'Bank and account signals': 'बँक व खाते संकेत',
  'Deliberately excluded from this specification.': 'या विनिर्देशातून जाणीवपूर्वक वगळलेले.',
  'The brief lists bank signals "where lawfully available". That qualifier does the work: access is constrained and varies by instrument. It should be scoped separately with the Legal Branch and only then added, rather than assumed into a data request and discovered to be unavailable after the extract is built.':
    'टिपणात बँक संकेतांचा उल्लेख "जिथे कायदेशीररीत्या उपलब्ध असतील तिथे" असा आहे. तेवढ्या शब्दांतच सर्व काही आहे: प्रवेश मर्यादित असून तो कोणत्या साधनाद्वारे मिळतो त्यानुसार बदलतो. त्याची व्याप्ती विधी शाखेसोबत स्वतंत्रपणे ठरवावी आणि तेव्हाच त्याचा समावेश करावा — डेटा मागणीत गृहीत धरून एक्सट्रॅक्ट तयार झाल्यावर तो उपलब्ध नाही हे कळणे टाळावे.',
  'Promoter PAN and personal identifiers': 'प्रवर्तक PAN व वैयक्तिक ओळखचिन्हे',
  'Required, and to be handled as personal data.':
    'आवश्यक, आणि वैयक्तिक माहिती म्हणूनच हाताळावे.',
  'Promoter PAN and name identify natural persons. They belong in the extract because the linkage capability depends on them, but access should be role-restricted, logged, and the retention period fixed in advance rather than left open.':
    'प्रवर्तक PAN व नाव ही नैसर्गिक व्यक्तींची ओळख पटवतात. संबंध ओळखण्याची क्षमता त्यांवर अवलंबून असल्याने ती एक्सट्रॅक्टमध्ये असावीत, पण त्यांचा प्रवेश पदनिहाय मर्यादित असावा, नोंदवला जावा, आणि जतन कालावधी खुला ठेवण्याऐवजी आधीच निश्चित केला जावा.',
  'Purpose limitation': 'प्रयोजन मर्यादा',
  'State it in the request.': 'ती मागणीतच नमूद करा.',
  'The extract is for building and validating risk intelligence for the department. Saying so in the request is what allows a data owner to approve it quickly instead of escalating.':
    'हा एक्सट्रॅक्ट विभागासाठी जोखीम इंटेलिजन्स उभारण्यासाठी व तिची पडताळणी करण्यासाठी आहे. मागणीत तसे स्पष्ट लिहिल्यानेच डेटा धारक ती वरिष्ठांकडे पाठवण्याऐवजी लवकर मंजूर करू शकतो.',
  'The 500 cases define the sample, not the extract. Every graph engine needs the counterparties of the case taxpayers and, for anything closing a circular pattern, the counterparties of those. An extract of exactly 500 GSTINs truncates every network at the sample boundary — every chain appears to end and no cycle can close, so the engines return nothing for a reason that has nothing to do with the taxpayers. Registration and returns detail is needed for the case taxpayers and their first hop; identity fields alone suffice for the second. Expect several thousand GSTINs rather than five hundred.':
    '५०० प्रकरणे नमुना ठरवतात, एक्सट्रॅक्ट नव्हे. प्रत्येक आलेख यंत्रणेला प्रकरणातील करदात्यांचे प्रतिपक्ष लागतात, आणि वर्तुळाकार नमुना पूर्ण करणाऱ्या कशासाठीही त्या प्रतिपक्षांचेही प्रतिपक्ष लागतात. नेमक्या ५०० GSTIN चा एक्सट्रॅक्ट प्रत्येक जाळे नमुन्याच्या सीमेवर तोडतो — प्रत्येक साखळी तिथेच संपल्यासारखी दिसते आणि कोणतेही चक्र पूर्ण होऊ शकत नाही, त्यामुळे यंत्रणा काहीही परत देत नाहीत आणि त्याचे कारण करदात्यांशी काहीही संबंधित नसते. नोंदणी व विवरणपत्रांचे तपशील प्रकरणातील करदाते व त्यांचा पहिला टप्पा यांसाठी लागतात; दुसऱ्या टप्प्यासाठी केवळ ओळख क्षेत्रे पुरेशी आहेत. पाचशे नव्हे तर काही हजार GSTIN अपेक्षित धरा.'
})
