import { registerMessages } from '../../locale.js'

/**
 * Hindi — the reasoning prose in priority.js and recovery.js: the recovery
 * proxies, effort tiers, plain-language rank explanations, the controlled-trial
 * endpoints, the decay bands and the four structural causes of lag.
 *
 * The four causes keep their three-part shape — what is true, what it costs,
 * what would change it — rather than being smoothed into one sentence, because
 * that shape is the argument.
 *
 *   proxy                  → प्रातिनिधिक निर्देशक
 *   dissipate              → बिखरना
 *   provisional attachment → अनंतिम कुर्की
 *   dwell                  → ठहराव
 *   decay band             → क्षय पट्टी
 *   endpoint               → परिणाम-बिंदु
 *   stratified             → स्तरीकृत
 *   confounded             → भ्रमित
 *   guardrail              → रक्षा-सीमा
 */
registerMessages('hi', {
  /* == Priority — recovery proxies ======================================= */
  'how wrong is this?': 'यह कितना गलत है?',
  'Entity still filing returns': 'इकाई अब भी विवरणियाँ दाखिल कर रही है',
  'A taxpayer still filing is contactable, usually still trading, and has an operative bank account.':
    'जो करदाता अब भी विवरणियाँ दाखिल कर रहा है वह संपर्क में रहता है, प्रायः व्यापार भी करता है, और उसका बैंक खाता चालू रहता है।',
  'Non-filer — may no longer be operating': 'विवरणी न भरने वाला — संभव है अब कार्यरत न हो',
  'Non-filing is the strongest available signal that an entity has ceased to operate at its declared premises.':
    'इकाई ने अपने घोषित परिसर से काम बंद कर दिया है, इसका उपलब्ध सबसे प्रबल संकेत विवरणी न भरना है।',
  'Turnover scale suggests traceable assets': 'कारोबार का परिमाण पता लगाने योग्य संपत्ति का संकेत देता है',
  'Larger declared turnover correlates with attachable assets and identifiable banking.':
    'अधिक घोषित कारोबार कुर्क करने योग्य संपत्ति और पहचान-योग्य बैंकिंग से संबद्ध होता है।',
  'Demand already contested in appeal': 'माँग को पहले ही अपील में चुनौती',
  'A demand under appeal is locked until the appellate stage concludes; near-term realisation is unlikely.':
    'अपीलाधीन माँग अपीलीय चरण समाप्त होने तक रुकी रहती है; निकट भविष्य में वसूली की संभावना कम है।',
  'Signal is recent': 'संकेत हाल का है',
  'A fresh signal usually means credit has not yet dispersed beyond the first hop.':
    'ताज़ा संकेत का प्रायः अर्थ है कि श्रेय अभी पहले चरण से आगे नहीं बिखरा।',

  /* == Priority — effort tiers ========================================== */
  'Baseline desk review': 'आधारभूत कार्यालयीन समीक्षा',
  'Multiple risk rules to substantiate': 'प्रमाणित करने हेतु अनेक जोखिम नियम',
  'Counterparty chain to trace': 'पता लगाने हेतु प्रतिपक्ष शृंखला',
  'Appeal record to review': 'समीक्षा हेतु अपील अभिलेख',
  'Notice already issued — setup complete': 'नोटिस पहले ही जारी — पूर्व-तैयारी पूर्ण',

  /* == Priority — plain-language rank explanations ====================== */
  'the statutory period has expired, so no demand can now be raised':
    'सांविधिक अवधि समाप्त हो चुकी है, इसलिए अब कोई माँग खड़ी नहीं की जा सकती',
  'the statutory deadline is still distant, so the case can wait without loss':
    'सांविधिक समय-सीमा अभी दूर है, इसलिए प्रकरण बिना हानि के प्रतीक्षा कर सकता है',
  'little of the exposure is still realistically recoverable at this signal age':
    'संकेत की इस आयु पर जोखिम राशि का बहुत कम भाग वास्तव में वसूली-योग्य है',
  'downstream credit in a linked cluster may still be blockable':
    'जुड़े समूह में आगे बढ़ा श्रेय अब भी रोका जा सकता है',
  'the entity is still filing and assets look traceable':
    'इकाई अब भी विवरणियाँ दाखिल कर रही है और संपत्ति का पता लगने योग्य दिखती है',
  'recovery prospects are weak on the available indicators':
    'उपलब्ध संकेतकों के आधार पर वसूली की संभावनाएँ कमजोर हैं',

  /* == Priority — the controlled trial =================================== */
  'Mean exposure (₹ L)': 'औसत जोखिम राशि (₹ लाख)',
  'Mean risk score': 'औसत जोखिम अंक',
  'Mean officer-days': 'औसत अधिकारी-दिवस',
  'Critical / High share (%)': 'अत्यंत गंभीर / उच्च का अंश (%)',
  'Revenue recovered per officer-day': 'प्रति अधिकारी-दिवस वसूला गया राजस्व',
  'The primary endpoint. Capacity is the binding constraint, so the platform must be judged on what the same officer-days produce.':
    'यह प्राथमिक परिणाम-बिंदु है। क्षमता ही बाध्यकारी बाधा है, इसलिए मंच का मूल्यांकन इसी पर होना चाहिए कि उतने ही अधिकारी-दिवस क्या उत्पन्न करते हैं।',
  'Cases reaching limitation without action': 'बिना कार्रवाई परिसीमा तक पहुँचे प्रकरण',
  'The cleanest counterfactual available. A time-bar is unambiguous, dated, and cannot be attributed to officer judgement.':
    'उपलब्ध सबसे स्वच्छ प्रति-तथ्य। कालातीत होना असंदिग्ध है, उसकी तिथि होती है, और उसे अधिकारी के विवेक पर नहीं डाला जा सकता।',
  'Median signal-age at first action': 'पहली कार्रवाई के समय संकेत की मध्यक आयु',
  'Tests the mechanism directly — the platform claims to compress time-to-action, so this should move before recovery does.':
    'यह तंत्र की सीधी परीक्षा लेता है — मंच कार्रवाई तक का समय घटाने का दावा करता है, इसलिए वसूली से पहले यही बदलना चाहिए।',
  'Selection concentration by sector and district': 'क्षेत्र एवं जिलावार चयन का संकेंद्रण',
  'A guardrail, not a success measure. The treatment arm must not concentrate enforcement more than the control arm.':
    'यह रक्षा-सीमा है, सफलता का मापक नहीं। प्रयोग समूह को नियंत्रण समूह से अधिक प्रवर्तन केंद्रित नहीं करना चाहिए।',
  'Arms are stratified by exposure decile and risk band so the comparison is not confounded by case mix. Officers in both arms work their normal capacity; only the ordering differs. The trial must run a full statutory cycle for the limitation endpoint to be meaningful, and the platform arm must not be given additional staff — that would measure resourcing rather than prioritisation.':
    'प्रकरणों के मिश्रण से तुलना भ्रमित न हो, इसके लिए समूह जोखिम राशि दशमक एवं जोखिम वर्ग के अनुसार स्तरीकृत हैं। दोनों समूहों के अधिकारी अपनी सामान्य क्षमता पर ही काम करते हैं; अंतर केवल क्रम का है। परिसीमा वाला परिणाम-बिंदु सार्थक होने के लिए परीक्षण पूरे सांविधिक चक्र तक चलना चाहिए, और मंच वाले समूह को अतिरिक्त कर्मचारी नहीं दिए जाने चाहिए — उससे प्राथमिकता के बजाय संसाधनों का मापन होगा।',

  /* == Recovery — decay bands =========================================== */
  Preventable: 'रोका जा सकने वाला',
  'Entity is still trading and bank accounts are operative. Credit passed downstream has usually not yet been utilised, so it can be blocked rather than recovered.':
    'इकाई अब भी व्यापार कर रही है और बैंक खाते चालू हैं। आगे बढ़ाया गया श्रेय प्रायः अभी उपयोग नहीं हुआ होता, इसलिए उसे वसूलने के बजाय रोका जा सकता है।',
  'Most of the credit has been utilised at the first hop. Provisional attachment is still effective and directors remain contactable.':
    'अधिकांश श्रेय पहले ही चरण पर उपयोग हो चुका है। अनंतिम कुर्की अब भी प्रभावी है और निदेशक संपर्क में हैं।',
  'Assets are dissipating and the chain has typically reached a second hop. Recovery shifts from blocking credit to pursuing the entity.':
    'संपत्ति बिखर रही है और शृंखला प्रायः दूसरे चरण तक पहुँच चुकी होती है। वसूली श्रेय रोकने से हटकर इकाई का पीछा करने की ओर चली जाती है।',
  Eroded: 'क्षरित',
  'The entity is commonly non-operational at its declared premises. Recovery depends on tracing directors and attaching third-party assets.':
    'इकाई प्रायः अपने घोषित परिसर पर कार्यरत नहीं होती। वसूली निदेशकों का पता लगाने और तृतीय पक्ष की संपत्ति कुर्क करने पर निर्भर करती है।',
  'Over 365 days': '365 दिनों से अधिक',
  'Largely written down': 'अधिकांशतः बट्टे खाते',
  'Realisation is via prosecution and appellate process. The credit is long utilised and the exposure is effectively a book entry.':
    'वसूली अभियोजन एवं अपीलीय प्रक्रिया से होती है। श्रेय बहुत पहले उपयोग हो चुका होता है और जोखिम राशि व्यवहार में केवल बही की प्रविष्टि रह जाती है।',
  'what can a week buy': 'एक सप्ताह क्या दिला सकता है',

  /* == Recovery — registration screening indicators ===================== */
  'Registered address shared with an already-flagged entity':
    'पहले से चिह्नित इकाई के साथ साझा पंजीकृत पता',
  Registration: 'पंजीयन',
  'Contact number or email shared across multiple registrations':
    'अनेक पंजीयनों में साझा संपर्क क्रमांक अथवा ईमेल',
  'PAN linked to a proprietor of a previously cancelled registration':
    'पूर्व में रद्द हुए पंजीयन के स्वामी से जुड़ा PAN',
  'High-value outward supply within the first filing period':
    'पहली ही विवरणी अवधि में उच्च मूल्य की बहिर्गामी आपूर्ति',
  'First return': 'पहली विवरणी',
  'Premises verification not completed or returned negative':
    'परिसर सत्यापन पूर्ण नहीं हुआ अथवा नकारात्मक रहा',

  /* == Recovery — the four structural causes of lag ===================== */
  'Detection is bound to the return cycle': 'पहचान विवरणी चक्र से बँधी है',
  'A signal cannot fire until the return that reveals it is filed. That puts a floor of one filing cycle under every indicator before an officer can see anything at all, and scrutiny selection then runs annually.':
    'जिस विवरणी से संकेत उजागर होता है, वह दाखिल हुए बिना संकेत लागू ही नहीं हो सकता। इससे अधिकारी को कुछ भी दिखने से पहले प्रत्येक संकेतक के नीचे एक विवरणी चक्र की न्यूनतम सीमा आ जाती है, और उसके बाद संवीक्षा हेतु चयन वर्ष में एक बार चलता है।',
  'The fastest possible detection is already 25–45 days late; the typical one is a year.':
    'संभव सबसे तेज़ पहचान भी पहले ही 25–45 दिन विलंबित होती है; सामान्य पहचान एक वर्ष बाद होती है।',
  'Score behaviour continuously against e-way bill and e-invoice flow, which arrive before the return does.':
    'विवरणी से पहले आने वाले ई-वे बिल एवं ई-बीजक प्रवाह के सापेक्ष व्यवहार का निरंतर अंकन करें।',
  'Credit is claimed before it is verified': 'श्रेय सत्यापन से पहले ही दावा कर लिया जाता है',
  'The buyer claims ITC in the same period the supplier declares it, while the check that the supplier actually paid happens later. Section 16(2)(c) makes the credit conditional on payment the department cannot yet confirm.':
    'आपूर्तिकर्ता जिस अवधि में घोषणा करता है, उसी अवधि में क्रेता ITC का दावा कर लेता है, जबकि आपूर्तिकर्ता ने वास्तव में भुगतान किया या नहीं, यह जाँच बाद में होती है। धारा 16(2)(ग) इस श्रेय को ऐसे भुगतान पर सशर्त बनाती है जिसकी पुष्टि विभाग अभी कर ही नहीं सकता।',
  'By the time the mismatch resolves, the credit has been utilised and often passed on again.':
    'विसंगति सुलझते-सुलझते श्रेय उपयोग हो चुका होता है और प्रायः आगे भी बढ़ा दिया गया होता है।',
  'Flag the buyer at the point the supplier’s liability goes unpaid, not at annual reconciliation.':
    'वार्षिक मिलान के समय नहीं, बल्कि आपूर्तिकर्ता का दायित्व अदत्त रह जाने के क्षण ही क्रेता को चिह्नित करें।',
  'Queues are ranked by risk score, not by decay': 'पंक्तियाँ जोखिम अंक से क्रमबद्ध होती हैं, क्षय से नहीं',
  'A 92-score case that is 400 days old is worth less than a 71-score case that is 20 days old, but a score-ordered queue puts the 92 first every time.':
    '400 दिन पुराना 92 अंक वाला प्रकरण, 20 दिन पुराने 71 अंक वाले प्रकरण से कम मूल्य का होता है, फिर भी अंक के क्रम में लगी पंक्ति हर बार 92 को ही आगे रखती है।',
  'Officer-days are spent on cases whose value has already gone, while recoverable ones age past the window.':
    'अधिकारी-दिवस उन प्रकरणों पर खर्च होते हैं जिनका मूल्य पहले ही जा चुका है, जबकि वसूली-योग्य प्रकरण अवधि से बाहर पुराने पड़ जाते हैं।',
  'Order the queue by value at risk this week. Same headcount, materially different yield.':
    'पंक्ति को इस सप्ताह की जोखिमग्रस्त राशि के अनुसार क्रमबद्ध करें। उतनी ही जनशक्ति, तात्त्विक रूप से भिन्न प्रतिफल।',
  'Registration risk is assessed after the fact': 'पंजीयन का जोखिम घटना के बाद आँका जाता है',
  'Shared premises, shared contacts and PAN linkage to cancelled registrations are all checkable on the day of application. They are instead reconstructed from invoice flow months later.':
    'साझा परिसर, साझा संपर्क और रद्द हुए पंजीयनों से PAN का संबंध, ये सब आवेदन के दिन ही जाँचे जा सकते हैं। इसके बजाय उन्हें महीनों बाद बीजक प्रवाह से पुनः जोड़ा जाता है।',
  'A shell entity trades for a full cycle before the first signal exists to catch it.':
    'उसे पकड़ने वाला पहला संकेत अस्तित्व में आने से पहले ही दिखावटी इकाई पूरा एक चक्र व्यापार कर लेती है।',
  'Screen at registration, where the cost of stopping the entity is effectively zero.':
    'पंजीयन के समय ही छानबीन करें, जहाँ इकाई को रोकने की लागत व्यवहार में शून्य है।',
  'Cases dwell inside the department after detection': 'पहचान के बाद प्रकरण विभाग के भीतर ही ठहरे रहते हैं',
  'Detection is only the first clock. A case then waits through allocation, notice, hearing and recovery stages while the entity continues to dissipate assets.':
    'पहचान केवल पहली घड़ी है। उसके बाद प्रकरण आवंटन, नोटिस, सुनवाई और वसूली के चरणों से गुजरते हुए प्रतीक्षा करता है, और तब तक इकाई संपत्ति बिखेरती रहती है।',
  'Internal dwell frequently exceeds the detection lag that preceded it.':
    'विभाग के भीतर का ठहराव प्रायः उससे पहले हुए पहचान-विलंब से भी अधिक होता है।',
  'Track stage ageing against the recovery curve, not against an internal service standard.':
    'चरणों के लंबन को आंतरिक सेवा मानक के सापेक्ष नहीं, वसूली वक्र के सापेक्ष देखें।',
  'The recovery curve is an illustrative model, not a measurement. The percentages are a calibration of the stated reasoning for each band — they are not derived from departmental recovery outcomes. Every case figure on this screen is generated demonstration data. The curve is shown so the assumption behind it can be examined and argued with; it must be re-based on the department’s own realisation history before it informs any operational decision.':
    'वसूली वक्र एक दृष्टांत प्रारूप है, माप नहीं। प्रतिशत प्रत्येक पट्टी हेतु बताए गए तर्क का अंशांकन हैं — वे विभागीय वसूली परिणामों से नहीं निकाले गए। इस पर्दे का प्रत्येक प्रकरण-आँकड़ा निर्मित प्रदर्शन आँकड़ा है। वक्र इसलिए दिखाया गया है ताकि उसके पीछे की मान्यता जाँची जा सके और उससे बहस की जा सके; किसी भी परिचालन निर्णय को दिशा देने से पूर्व उसे विभाग के अपने वसूली इतिहास पर पुनः आधारित करना होगा।'
})
