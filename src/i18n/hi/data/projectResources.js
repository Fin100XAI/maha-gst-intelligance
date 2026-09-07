import { registerMessages } from '../../locale.js'

/**
 * Hindi — projectResources.js: the statutory sources, the official published
 * data, the statistical methods with their failure modes, the software stack,
 * and the simulated-versus-real division.
 *
 * Each method entry has three parts — what it is, why it was chosen, how it
 * fails — and the third is the one that matters most. A method whose failure
 * mode is not stated is a method nobody can audit, so those sentences are
 * translated in full rather than shortened.
 *
 * Method names stay recognisable in Latin where they name a published
 * technique an officer or auditor would look up: Iglewicz–Hoaglin, Jaccard,
 * MAD, NP-hard. Package names — React, Vite, Tailwind CSS, Recharts, PostCSS,
 * Autoprefixer — are product names and are never translated. Statutory
 * citations and SLP numbers stay as published.
 *
 *   failure mode      → विफलता की रीति
 *   residual graph    → अवशेष आरेख
 *   piecewise-linear  → खंडशः रैखिक
 *   anchor            → आधार-बिंदु
 *   interpolation     → अंतर्वेशन
 *   effect size       → प्रभाव आकार
 *   stratum / strata  → स्तर
 *   seed              → बीज
 *   determinism       → निश्चयात्मकता
 */
registerMessages('hi', {
  /* == Source categories ================================================ */
  'Statute & subordinate legislation': 'अधिनियम एवं अधीनस्थ विधान',
  'Encoded as computation, not summarised. The limitation engine computes from these rather than from a model.':
    'सारांशित नहीं, संगणना के रूप में संकेतबद्ध। परिसीमा यंत्र किसी प्रारूप से नहीं, इन्हीं से गणना करता है।',
  'Official published data': 'आधिकारिक प्रकाशित आँकड़े',
  'Real figures from government sources, kept strictly separate from the simulated operational records.':
    'शासकीय स्रोतों के वास्तविक आँकड़े, अनुरूपित परिचालन अभिलेखों से कड़ाई से पृथक रखे गए।',
  'Statistical & algorithmic methods': 'सांख्यिकीय एवं अल्गोरिदमी पद्धतियाँ',
  'Each chosen for a stated reason, and each with a known failure mode that is named on the screen that uses it.':
    'प्रत्येक पद्धति बताए गए कारण से चुनी गई, और प्रत्येक की ज्ञात विफलता-रीति उसी पर्दे पर नाम सहित दी गई है जो उसका उपयोग करता है।',
  'Runs entirely within the department’s own infrastructure. No call is made to the open internet for figures, models or maps.':
    'पूर्णतः विभाग की अपनी अवसंरचना के भीतर चलता है। आँकड़ों, प्रारूपों अथवा मानचित्रों के लिए खुले इंटरनेट से कोई संपर्क नहीं किया जाता।',

  /* == Statutory sources ================================================ */
  'Rule 99, CGST Rules': 'नियम 99, CGST नियम',
  'Scrutiny of returns. Prescribes the 30-day period for a reply in FORM GST ASMT-11 — the notice drafting originally stated 15 days and was corrected against this.':
    'विवरणियों की संवीक्षा। FORM GST ASMT-11 में उत्तर हेतु 30 दिन की अवधि विहित करता है — नोटिस प्रारूप में मूलतः 15 दिन लिखा था और इसी के आधार पर उसे सुधारा गया।',
  'Finance (No. 2) Act, 2024': 'वित्त (सं. 2) अधिनियम, 2024',
  'Inserted Section 74A, which applies from FY 2024-25 and removes the fraud / non-fraud split in limitation periods.':
    'धारा 74क अंतःस्थापित की, जो वित्तीय वर्ष 2024-25 से लागू है और परिसीमा अवधियों में कपट / कपट-रहित का विभाजन समाप्त करती है।',

  /* == Official data sources ============================================ */
  'Maharashtra GST Department — dealer statistics': 'महाराष्ट्र GST विभाग — व्यापारी सांख्यिकी',
  'Registered dealer counts and departmental statistics. Provides the scale context against which the modelled population is stated.':
    'पंजीकृत व्यापारियों की संख्या एवं विभागीय सांख्यिकी। प्रारूप की संख्या जिस पैमाने के संदर्भ में बताई जाती है, वह संदर्भ यही देती है।',
  'Press Information Bureau — monthly GST collection releases':
    'पत्र सूचना कार्यालय — मासिक GST वसूली विज्ञप्तियाँ',
  'National gross GST collection figures, published monthly.':
    'राष्ट्रीय सकल GST वसूली के आँकड़े, प्रतिमाह प्रकाशित।',
  'CBIC — GST tax information portal': 'CBIC — GST कर सूचना पोर्टल',
  'The authoritative text of the Act, Rules and notifications. Every statutory computation in this platform traces here.':
    'अधिनियम, नियमों एवं अधिसूचनाओं का प्रामाणिक पाठ। इस मंच की प्रत्येक सांविधिक संगणना यहीं तक जाती है।',
  'Statutory Time Intelligence, Audit & Scrutiny Engine':
    'सांविधिक समय इंटेलिजेंस, लेखापरीक्षा एवं संवीक्षा यंत्र',
  'data.gov.in — GST datasets': 'data.gov.in — GST आँकड़ा-समुच्चय',
  'Dataset pointers are recorded with no values attached: the endpoints returned HTTP 403 when fetched, so nothing was inferred from them. Listing them without values is deliberate.':
    'आँकड़ा-समुच्चय संकेत बिना किसी मान के दर्ज हैं: माँगे जाने पर इन स्रोतों ने HTTP 403 लौटाया, इसलिए उनसे कुछ भी अनुमानित नहीं किया गया। उन्हें बिना मानों के सूचीबद्ध करना जानबूझकर है।',

  /* == Methods ========================================================== */
  'Median absolute deviation, Iglewicz–Hoaglin modified z':
    'मध्यक निरपेक्ष विचलन, इगलेविच–होगलिन संशोधित z',
  'Peer-relative outlier detection at a threshold of 3.5.':
    '3.5 की देहली पर समकक्षों के सापेक्ष बहिर्बिंदु पहचान।',
  'Mean and standard deviation are dragged by the outliers being hunted — a handful of extreme entities inflate the spread until they no longer register. MAD does not have that failure.':
    'औसत और मानक विचलन उन्हीं बहिर्बिंदुओं से खिंच जाते हैं जिनकी खोज है — मुट्ठी भर चरम इकाइयाँ प्रसार को इतना फुला देती हैं कि वे स्वयं दर्ज ही नहीं होतीं। MAD में यह विफलता नहीं है।',
  'A zero MAD, where more than half a peer group share one value, makes the score undefined. Those cases are skipped rather than reported as infinite.':
    'समकक्ष समूह के आधे से अधिक का मान एक ही होने पर MAD शून्य हो जाता है और अंक अपरिभाषित रहता है। ऐसे प्रकरण अनंत के रूप में दर्ज करने के बजाय छोड़ दिए जाते हैं।',

  'Three-colour depth-first cycle detection': 'त्रि-वर्ण गहराई-प्रथम चक्र पहचान',
  'Run once per node on the residual graph after removing it, to test whether circulation survives.':
    'प्रत्येक इकाई हटाने के बाद बचे अवशेष आरेख पर एक बार चलाया जाता है, ताकि परखा जा सके कि परिचलन बचता है या नहीं।',
  'Centrality measures how important a node looks. It does not answer whether the chain keeps running without it, and on a chain with a bypass route those point at different entities.':
    'केंद्रीयता यह मापती है कि कोई इकाई कितनी महत्वपूर्ण दिखती है। उसके बिना शृंखला चलती रहती है या नहीं, इसका उत्तर वह नहीं देती, और बगल मार्ग वाली शृंखला पर ये दोनों बातें अलग-अलग इकाइयों की ओर संकेत करती हैं।',
  'Only as good as the edges supplied. With cluster-level edges it cannot trace between GSTIN layers.':
    'जितनी अच्छी कड़ियाँ दी जाएँ उतना ही अच्छा। समूह-स्तर की कड़ियों के साथ वह GSTIN स्तरों के बीच पता नहीं लगा सकता।',
  'Network Enforcement': 'नेटवर्क प्रवर्तन',

  'Jaccard index on triggered rule sets': 'लागू हुए नियम समुच्चयों पर जैकार्ड सूचकांक',
  'Overlap between the risk rules firing on two taxpayers.':
    'दो करदाताओं पर लागू होते जोखिम नियमों के बीच अतिव्यापन।',
  'Set overlap rather than count similarity — two taxpayers each firing three rules are not similar if the rules differ.':
    'संख्या की समानता नहीं, समुच्चय का अतिव्यापन — प्रत्येक पर तीन नियम लागू होने वाले दो करदाता, नियम भिन्न हों तो समान नहीं हैं।',
  'Returns null where neither has rules, which is uninformative rather than a perfect match.':
    'जहाँ दोनों में से किसी पर नियम लागू न हों वहाँ रिक्त लौटाता है, क्योंकि वह पूर्ण मेल नहीं, जानकारी का अभाव है।',

  'Piecewise-linear recovery decay curve': 'खंडशः रैखिक वसूली क्षय वक्र',
  'Interpolated between anchors at 0, 30, 90, 180, 365, 540 and 730 days.':
    '0, 30, 90, 180, 365, 540 एवं 730 दिनों के आधार-बिंदुओं के बीच अंतर्वेशित।',
  'A step function meant only band-crossers decayed, which made the ranking degenerate. Continuous interpolation fixed it.':
    'सोपान-फलन के कारण केवल पट्टी पार करने वालों का ही क्षय होता था, जिससे क्रम निरर्थक हो जाता था। सतत अंतर्वेशन ने उसे ठीक किया।',
  'The anchors are a stated assumption, not an observed recovery rate. Turning it into a probability model needs observed recovery against demand.':
    'आधार-बिंदु बताई गई मान्यता हैं, अवलोकित वसूली दर नहीं। उसे प्रायिकता प्रारूप में बदलने के लिए माँग के सापेक्ष अवलोकित वसूली चाहिए।',
  'Revenue at Risk & Recovery, Counterfactual Case Intelligence':
    'जोखिमग्रस्त राजस्व एवं वसूली, प्रति-तथ्य प्रकरण इंटेलिजेंस',

  'Relaxed upper bound on generalised assignment': 'सामान्यीकृत नियतन पर शिथिल ऊपरी सीमा',
  'Eligibility and integrality both relaxed to produce a bound the true optimum cannot exceed.':
    'ऐसी सीमा निकालने हेतु पात्रता एवं पूर्णांकता दोनों शिथिल की गईं जिसे वास्तविक अनुकूलतम पार नहीं कर सकता।',
  'Generalised assignment is NP-hard. Rather than claim optimality, the greedy result is reported as a share of a bound that is unreachable by construction.':
    'सामान्यीकृत नियतन NP-hard है। अनुकूलतम होने का दावा करने के बजाय, लोभी परिणाम ऐसी सीमा के अंश के रूप में दर्ज किया जाता है जो रचना से ही अप्राप्य है।',
  'The bound is loose. It brackets the optimum rather than locating it.':
    'यह सीमा ढीली है। वह अनुकूलतम को खोजती नहीं, केवल कोष्ठक में बाँधती है।',

  'Standardised mean difference (effect size)': 'मानकीकृत औसत अंतर (प्रभाव आकार)',
  'Separation between a positive class and the baseline, measured against the population spread.':
    'सकारात्मक वर्ग एवं आधाररेखा के बीच पृथक्करण, समुच्चय के प्रसार के सापेक्ष मापा गया।',
  'Establishes whether a resemblance model is worth building before it is built. Below roughly 0.5 there is nothing to stand on.':
    'समानता का प्रारूप बनाने से पहले ही तय करता है कि वह बनाने योग्य है या नहीं। लगभग 0.5 से नीचे टिकने लायक कुछ नहीं है।',
  'Small samples make any effect size unstable — which is itself part of the finding where the contrast class is two cases.':
    'छोटे नमूने किसी भी प्रभाव आकार को अस्थिर कर देते हैं — और जहाँ विरोधी वर्ग में दो ही प्रकरण हों वहाँ यही निष्कर्ष का हिस्सा है।',

  'Stratified randomised trial design': 'स्तरीकृत यादृच्छिक परीक्षण अभिकल्प',
  'Strata on exposure decile crossed with risk band, with a rotating start arm per stratum.':
    'जोखिम राशि दशमक एवं जोखिम वर्ग के प्रतिच्छेद पर स्तर, और प्रत्येक स्तर हेतु घूमता हुआ प्रारंभ समूह।',
  'Alternating on a global index sent every singleton stratum to the same arm, producing a 4x imbalance in the critical band.':
    'एक ही वैश्विक क्रमांक पर बारी-बारी करने से एकल इकाई वाला प्रत्येक स्तर एक ही समूह में चला गया, जिससे निर्णायक पट्टी में 4 गुना असंतुलन बना।',
  'Needs a run long enough to conclude. Endpoints are pre-declared for that reason.':
    'निष्कर्ष तक पहुँचने योग्य पर्याप्त लंबी अवधि चलना आवश्यक। इसी कारण परिणाम-बिंदु पहले से घोषित हैं।',

  'Every simulated record derives from a fixed seed.':
    'प्रत्येक अनुरूपित अभिलेख एक नियत बीज से बनता है।',
  'The demonstration must be identical on every machine and every reload. A figure that moves between viewings cannot be discussed.':
    'प्रदर्शन प्रत्येक मशीन पर और प्रत्येक बार ठीक एक जैसा होना चाहिए। जो आँकड़ा दो बार देखने पर बदल जाए, उस पर चर्चा ही नहीं हो सकती।',
  'Determinism is not realism. The distribution is a designed one, not an observed one.':
    'निश्चयात्मकता यथार्थता नहीं है। यह वितरण रचा हुआ है, अवलोकित नहीं।',
  'All simulated data': 'सभी अनुरूपित आँकड़े',

  /* == Software ========================================================= */
  'User interface': 'उपयोगकर्ता अंतरापृष्ठ',
  'Build and development server': 'निर्माण एवं विकास सर्वर',
  'Styling, driven by CSS variables so themes switch without duplicate rules':
    'शैली, CSS चरों पर आधारित ताकि नियमों की पुनरावृत्ति के बिना रंग-योजना बदली जा सके',
  Charting: 'आरेख निर्माण',
  Icons: 'चिह्न',
  'CSS processing': 'CSS संसाधन',

  /* == Simulated versus real ============================================ */
  'Every taxpayer, GSTIN, trade name, address and contact detail':
    'प्रत्येक करदाता, GSTIN, व्यापारिक नाम, पता एवं संपर्क विवरण',
  'All returns, payments, ITC claims, refunds and e-way bill records':
    'सभी विवरणियाँ, भुगतान, ITC दावे, प्रतिदाय एवं ई-वे बिल अभिलेख',
  'All notices, audit cases, litigation cases and compliance alerts':
    'सभी नोटिस, लेखापरीक्षा प्रकरण, मुकदमा प्रकरण एवं अनुपालन सूचनाएँ',
  'The officer establishment and every assignment': 'अधिकारी स्थापना एवं प्रत्येक नियतन',
  'All network clusters and their edges': 'सभी नेटवर्क समूह एवं उनकी कड़ियाँ',
  'Sections 73, 74 and 74A of the CGST/MGST Act, and Rule 99':
    'CGST/MGST अधिनियम की धाराएँ 73, 74 एवं 74क, तथा नियम 99',
  'Notifications 09/2023-CT and 56/2023-CT, and their contested status':
    'अधिसूचनाएँ 09/2023-CT एवं 56/2023-CT, और उनकी विवादित स्थिति',
  'The four judicial authorities on Section 168A, including SLP (C) 4240/2025':
    'धारा 168क पर चार न्यायिक प्राधिकार, जिनमें SLP (C) 4240/2025 सम्मिलित है',
  'Published collection and dealer figures from PIB and mahagst.gov.in':
    'PIB एवं mahagst.gov.in के प्रकाशित वसूली एवं व्यापारी आँकड़े',
  'The division is absolute and stated on every screen that shows a figure. No simulated record is presented as an observation, and no real figure is mixed into a simulated aggregate. The scale ratio is roughly 1:6,484 — 156 modelled taxpayers against 10,11,501 registered SGST dealers — so no total on this platform should be read as a statewide figure.':
    'यह विभाजन निरपवाद है और आँकड़ा दिखाने वाले प्रत्येक पर्दे पर बताया गया है। कोई भी अनुरूपित अभिलेख अवलोकन के रूप में प्रस्तुत नहीं किया गया, और कोई भी वास्तविक आँकड़ा अनुरूपित योग में नहीं मिलाया गया। पैमाने का अनुपात लगभग 1:6,484 है — 10,11,501 पंजीकृत SGST व्यापारियों के सापेक्ष प्रारूप के 156 करदाता — इसलिए इस मंच के किसी भी योग को राज्यव्यापी आँकड़े के रूप में नहीं पढ़ा जाना चाहिए।'
})
