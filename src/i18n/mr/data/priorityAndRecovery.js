import { registerMessages } from '../../locale.js'

/**
 * Marathi — the reasoning prose in priority.js and recovery.js: the recovery
 * proxies, effort tiers, plain-language rank explanations, the controlled-trial
 * endpoints, the decay bands and the four structural causes of lag.
 *
 * The four causes are the argument the whole recovery screen exists to make, so
 * each keeps its three-part shape in Marathi — what is true, what it costs,
 * what would change it — rather than being smoothed into one sentence.
 *
 *   proxy             → प्रातिनिधिक निर्देशक
 *   dissipate         → विखुरणे
 *   provisional attachment → तात्पुरती जप्ती
 *   dwell             → ठहराव / रेंगाळणे
 *   decay band        → क्षय पट्टा
 *   endpoint          → निष्कर्ष-बिंदू
 *   stratified        → स्तरीकृत
 *   confounded        → गोंधळलेला
 *   guardrail         → संरक्षक मर्यादा
 */
registerMessages('mr', {
  /* == Priority — recovery proxies ======================================= */
  'how wrong is this?': 'हे किती चुकीचे आहे?',
  'Entity still filing returns': 'घटक अद्याप विवरणपत्रे भरत आहे',
  'A taxpayer still filing is contactable, usually still trading, and has an operative bank account.':
    'अद्याप विवरणपत्रे भरणारा करदाता संपर्कात असतो, साधारणपणे व्यापार चालू असतो, आणि त्याचे बँक खाते कार्यरत असते.',
  'Non-filer — may no longer be operating': 'विवरणपत्र न भरणारा — कदाचित कार्यरत नसेल',
  'Non-filing is the strongest available signal that an entity has ceased to operate at its declared premises.':
    'घटकाने आपल्या घोषित जागेवरून कामकाज थांबवले आहे याचा उपलब्ध असलेला सर्वात प्रबळ संकेत म्हणजे विवरणपत्र न भरणे.',
  'Turnover scale suggests traceable assets': 'उलाढालीचे प्रमाण माग काढता येण्याजोगी मालमत्ता सुचवते',
  'Larger declared turnover correlates with attachable assets and identifiable banking.':
    'अधिक घोषित उलाढाल ही जप्त करता येण्याजोगी मालमत्ता व ओळखता येणारे बँकिंग यांच्याशी निगडित असते.',
  'Demand already contested in appeal': 'मागणीला आधीच अपिलात आव्हान',
  'A demand under appeal is locked until the appellate stage concludes; near-term realisation is unlikely.':
    'अपिलाधीन मागणी ही अपिलाचा टप्पा संपेपर्यंत अडकलेली असते; नजीकच्या काळात वसुली होण्याची शक्यता कमी.',
  'Signal is recent': 'संकेत अलीकडचा आहे',
  'A fresh signal usually means credit has not yet dispersed beyond the first hop.':
    'ताजा संकेत म्हणजे साधारणपणे श्रेय अद्याप पहिल्या टप्प्यापलीकडे विखुरलेले नाही.',

  /* == Priority — effort tiers ========================================== */
  'Baseline desk review': 'आधारभूत कार्यालयीन पुनर्विलोकन',
  'Multiple risk rules to substantiate': 'सिद्ध करण्यासाठी अनेक जोखीम नियम',
  'Counterparty chain to trace': 'माग काढण्यासाठी प्रतिपक्ष साखळी',
  'Appeal record to review': 'पुनर्विलोकनासाठी अपील अभिलेख',
  'Notice already issued — setup complete': 'नोटीस आधीच जारी — पूर्वतयारी पूर्ण',

  /* == Priority — plain-language rank explanations ====================== */
  'the statutory period has expired, so no demand can now be raised':
    'सांविधिक मुदत संपली आहे, त्यामुळे आता कोणतीही मागणी उभी करता येत नाही',
  'the statutory deadline is still distant, so the case can wait without loss':
    'सांविधिक मुदत अद्याप दूर आहे, त्यामुळे प्रकरण नुकसानीशिवाय वाट पाहू शकते',
  'little of the exposure is still realistically recoverable at this signal age':
    'संकेताच्या या वयावर जोखीम रकमेपैकी फारच थोडी वास्तवात वसूलपात्र आहे',
  'downstream credit in a linked cluster may still be blockable':
    'जोडलेल्या गटातील पुढे गेलेले श्रेय अद्याप रोखता येण्याजोगे असू शकते',
  'the entity is still filing and assets look traceable':
    'घटक अद्याप विवरणपत्रे भरत आहे आणि मालमत्तेचा माग काढता येईल असे दिसते',
  'recovery prospects are weak on the available indicators':
    'उपलब्ध निर्देशकांनुसार वसुलीची शक्यता कमकुवत आहे',

  /* == Priority — the controlled trial =================================== */
  'Mean exposure (₹ L)': 'सरासरी जोखीम रक्कम (₹ लाख)',
  'Mean risk score': 'सरासरी जोखीम गुणांक',
  'Mean officer-days': 'सरासरी अधिकारी-दिवस',
  'Critical / High share (%)': 'अत्यंत गंभीर / उच्च यांचा वाटा (%)',
  'Revenue recovered per officer-day': 'प्रति अधिकारी-दिवस वसूल झालेला महसूल',
  'The primary endpoint. Capacity is the binding constraint, so the platform must be judged on what the same officer-days produce.':
    'हा प्राथमिक निष्कर्ष-बिंदू. क्षमता ही बंधनकारक मर्यादा आहे, त्यामुळे तेवढेच अधिकारी-दिवस काय निर्माण करतात यावरूनच मंचाचे मूल्यमापन झाले पाहिजे.',
  'Cases reaching limitation without action': 'कारवाईशिवाय मुदतीपर्यंत पोहोचलेली प्रकरणे',
  'The cleanest counterfactual available. A time-bar is unambiguous, dated, and cannot be attributed to officer judgement.':
    'उपलब्ध असलेला सर्वात स्वच्छ प्रति-तथ्य. मुदतबाह्य होणे हे संदिग्ध नसते, त्याला तारीख असते, आणि ते अधिकाऱ्याच्या मताला जबाबदार धरता येत नाही.',
  'Median signal-age at first action': 'पहिल्या कारवाईच्या वेळी संकेताचे मध्यक वय',
  'Tests the mechanism directly — the platform claims to compress time-to-action, so this should move before recovery does.':
    'हे यंत्रणेची थेट चाचणी घेते — मंच कारवाईस लागणारा काळ कमी करण्याचा दावा करतो, त्यामुळे वसुलीच्या आधी हेच बदलले पाहिजे.',
  'Selection concentration by sector and district': 'क्षेत्र व जिल्हानिहाय निवडीचे एकवटणे',
  'A guardrail, not a success measure. The treatment arm must not concentrate enforcement more than the control arm.':
    'ही संरक्षक मर्यादा आहे, यशाचे मापक नाही. प्रयोग गटाने नियंत्रण गटापेक्षा अधिक प्रमाणात अंमलबजावणी एकवटता कामा नये.',
  'Arms are stratified by exposure decile and risk band so the comparison is not confounded by case mix. Officers in both arms work their normal capacity; only the ordering differs. The trial must run a full statutory cycle for the limitation endpoint to be meaningful, and the platform arm must not be given additional staff — that would measure resourcing rather than prioritisation.':
    'प्रकरणांच्या मिश्रणामुळे तुलना गोंधळू नये म्हणून गट हे जोखीम रक्कम दशमांश व जोखीम पट्ट्यानुसार स्तरीकृत केले आहेत. दोन्ही गटांतील अधिकारी आपली नेहमीचीच क्षमता वापरतात; फरक फक्त क्रमाचा असतो. मुदतीचा निष्कर्ष-बिंदू अर्थपूर्ण ठरण्यासाठी चाचणी संपूर्ण सांविधिक चक्रभर चालली पाहिजे, आणि मंचाच्या गटाला अतिरिक्त कर्मचारी देता कामा नयेत — त्याने प्राधान्यक्रमाऐवजी साधनसंपत्तीचे मोजमाप होईल.',

  /* == Recovery — decay bands =========================================== */
  Preventable: 'टाळता येण्याजोगे',
  'Entity is still trading and bank accounts are operative. Credit passed downstream has usually not yet been utilised, so it can be blocked rather than recovered.':
    'घटकाचा व्यापार अद्याप चालू असून बँक खाती कार्यरत आहेत. पुढे दिलेले श्रेय साधारणपणे अद्याप वापरलेले नसते, त्यामुळे ते वसूल करण्याऐवजी रोखता येते.',
  'Most of the credit has been utilised at the first hop. Provisional attachment is still effective and directors remain contactable.':
    'बहुतांश श्रेय पहिल्याच टप्प्यावर वापरले गेले आहे. तात्पुरती जप्ती अद्याप परिणामकारक असून संचालक संपर्कात आहेत.',
  'Assets are dissipating and the chain has typically reached a second hop. Recovery shifts from blocking credit to pursuing the entity.':
    'मालमत्ता विखुरत आहे आणि साखळी साधारणपणे दुसऱ्या टप्प्यापर्यंत पोहोचली आहे. वसुली ही श्रेय रोखण्याकडून घटकाचा पाठपुरावा करण्याकडे सरकते.',
  Eroded: 'झिजलेले',
  'The entity is commonly non-operational at its declared premises. Recovery depends on tracing directors and attaching third-party assets.':
    'घटक साधारणपणे आपल्या घोषित जागेवर कार्यरत नसतो. वसुली ही संचालकांचा माग काढणे व तृतीय पक्षाची मालमत्ता जप्त करणे यांवर अवलंबून असते.',
  'Over 365 days': '३६५ दिवसांहून अधिक',
  'Largely written down': 'बहुतांश निर्लेखित',
  'Realisation is via prosecution and appellate process. The credit is long utilised and the exposure is effectively a book entry.':
    'वसुली ही खटला व अपील प्रक्रियेतून होते. श्रेय कधीच वापरले गेले असून जोखीम रक्कम प्रत्यक्षात केवळ लेखानोंद उरते.',
  'what can a week buy': 'एक आठवडा काय मिळवून देऊ शकतो',

  /* == Recovery — registration screening indicators ===================== */
  'Registered address shared with an already-flagged entity':
    'आधीच निदर्शनास आणलेल्या घटकाशी समान नोंदणीकृत पत्ता',
  Registration: 'नोंदणी',
  'Contact number or email shared across multiple registrations':
    'अनेक नोंदण्यांमध्ये समान संपर्क क्रमांक किंवा ईमेल',
  'PAN linked to a proprietor of a previously cancelled registration':
    'पूर्वी रद्द झालेल्या नोंदणीच्या मालकाशी जोडलेला PAN',
  'High-value outward supply within the first filing period':
    'पहिल्याच विवरणपत्र कालावधीत उच्च मूल्याचा बाह्य पुरवठा',
  'First return': 'पहिले विवरणपत्र',
  'Premises verification not completed or returned negative':
    'जागेची पडताळणी पूर्ण झाली नाही किंवा नकारात्मक आली',

  /* == Recovery — the four structural causes of lag ===================== */
  'Detection is bound to the return cycle': 'शोध हा विवरणपत्र चक्राशी बांधलेला आहे',
  'A signal cannot fire until the return that reveals it is filed. That puts a floor of one filing cycle under every indicator before an officer can see anything at all, and scrutiny selection then runs annually.':
    'ज्या विवरणपत्रातून संकेत उघड होतो ते दाखल होईपर्यंत तो संकेत लागूच होऊ शकत नाही. त्यामुळे अधिकाऱ्याला काहीही दिसण्यापूर्वी प्रत्येक निर्देशकाखाली एका विवरणपत्र चक्राची किमान मर्यादा येते, आणि त्यानंतर तपासणीसाठीची निवड वर्षातून एकदा चालते.',
  'The fastest possible detection is already 25–45 days late; the typical one is a year.':
    'शक्य असलेला सर्वात जलद शोधही आधीच २५–४५ दिवस उशिरा असतो; नेहमीचा शोध वर्षभराने होतो.',
  'Score behaviour continuously against e-way bill and e-invoice flow, which arrive before the return does.':
    'विवरणपत्राच्या आधी येणाऱ्या ई-वे बिल व ई-बीजक प्रवाहाच्या तुलनेत वर्तनाचे सातत्याने गुणांकन करा.',
  'Credit is claimed before it is verified': 'श्रेय पडताळणीपूर्वीच दावा केले जाते',
  'The buyer claims ITC in the same period the supplier declares it, while the check that the supplier actually paid happens later. Section 16(2)(c) makes the credit conditional on payment the department cannot yet confirm.':
    'पुरवठादार ज्या कालावधीत घोषणा करतो त्याच कालावधीत खरेदीदार ITC चा दावा करतो, तर पुरवठादाराने प्रत्यक्षात भरणा केला का याची तपासणी नंतर होते. कलम १६(२)(क) हे श्रेय अशा भरण्यावर सशर्त करते ज्याची विभाग अद्याप खात्री करू शकत नाही.',
  'By the time the mismatch resolves, the credit has been utilised and often passed on again.':
    'विसंगती निकाली निघेपर्यंत श्रेय वापरले गेलेले असते आणि अनेकदा पुढेही दिलेले असते.',
  'Flag the buyer at the point the supplier’s liability goes unpaid, not at annual reconciliation.':
    'वार्षिक ताळमेळाच्या वेळी नव्हे, तर पुरवठादाराचे दायित्व न भरले जाण्याच्या क्षणीच खरेदीदाराला निदर्शनास आणा.',
  'Queues are ranked by risk score, not by decay': 'रांगा जोखीम गुणांकानुसार लावल्या जातात, क्षयानुसार नाही',
  'A 92-score case that is 400 days old is worth less than a 71-score case that is 20 days old, but a score-ordered queue puts the 92 first every time.':
    '४०० दिवस जुने ९२ गुणांचे प्रकरण हे २० दिवस जुन्या ७१ गुणांच्या प्रकरणापेक्षा कमी मूल्याचे असते, पण गुणांकानुसार लावलेली रांग दरवेळी ९२ लाच पुढे ठेवते.',
  'Officer-days are spent on cases whose value has already gone, while recoverable ones age past the window.':
    'ज्यांचे मूल्य आधीच निघून गेले आहे अशा प्रकरणांवर अधिकारी-दिवस खर्च होतात, तर वसूलपात्र प्रकरणे मुदतीपलीकडे जुनी होतात.',
  'Order the queue by value at risk this week. Same headcount, materially different yield.':
    'रांग या आठवड्यातील जोखमीतील मूल्यानुसार लावा. तेवढेच मनुष्यबळ, लक्षणीयरीत्या वेगळे उत्पन्न.',
  'Registration risk is assessed after the fact': 'नोंदणीची जोखीम घटना घडून गेल्यावर तपासली जाते',
  'Shared premises, shared contacts and PAN linkage to cancelled registrations are all checkable on the day of application. They are instead reconstructed from invoice flow months later.':
    'समान जागा, समान संपर्क आणि रद्द झालेल्या नोंदण्यांशी असलेला PAN संबंध हे सर्व अर्जाच्या दिवशीच तपासता येतात. त्याऐवजी ते काही महिन्यांनी बीजक प्रवाहावरून पुन्हा उभे केले जातात.',
  'A shell entity trades for a full cycle before the first signal exists to catch it.':
    'त्याला पकडणारा पहिला संकेत अस्तित्वात येण्यापूर्वीच बनावट घटक पूर्ण एक चक्रभर व्यापार करतो.',
  'Screen at registration, where the cost of stopping the entity is effectively zero.':
    'नोंदणीच्याच टप्प्यावर चाळणी करा, जिथे घटक थांबवण्याची किंमत प्रत्यक्षात शून्य असते.',
  'Cases dwell inside the department after detection': 'शोधानंतर प्रकरणे विभागातच रेंगाळतात',
  'Detection is only the first clock. A case then waits through allocation, notice, hearing and recovery stages while the entity continues to dissipate assets.':
    'शोध हे केवळ पहिले घड्याळ आहे. त्यानंतर प्रकरण वाटप, नोटीस, सुनावणी व वसुली या टप्प्यांतून वाट पाहत राहते, आणि तोवर घटक मालमत्ता विखुरतच राहतो.',
  'Internal dwell frequently exceeds the detection lag that preceded it.':
    'विभागांतर्गत रेंगाळणे हे अनेकदा त्याआधीच्या शोधातील विलंबापेक्षाही जास्त असते.',
  'Track stage ageing against the recovery curve, not against an internal service standard.':
    'टप्प्यांचे वय हे अंतर्गत सेवा मानकाच्या तुलनेत नव्हे, तर वसुली वक्राच्या तुलनेत मोजा.',
  'The recovery curve is an illustrative model, not a measurement. The percentages are a calibration of the stated reasoning for each band — they are not derived from departmental recovery outcomes. Every case figure on this screen is generated demonstration data. The curve is shown so the assumption behind it can be examined and argued with; it must be re-based on the department’s own realisation history before it informs any operational decision.':
    'वसुली वक्र हे दर्शनार्थ प्रारूप आहे, मोजमाप नाही. टक्केवारी ही प्रत्येक पट्ट्यासाठी नमूद केलेल्या तर्काची मांडणी आहे — ती विभागाच्या वसुलीच्या निष्कर्षांवरून काढलेली नाही. या पडद्यावरील प्रत्येक प्रकरणाचा आकडा हा निर्माण केलेला प्रात्यक्षिक डेटा आहे. वक्र यासाठी दाखवला आहे की त्यामागील गृहीतक तपासता व त्याच्याशी वाद घालता यावा; कोणत्याही कार्यालयीन निर्णयाला दिशा देण्यापूर्वी तो विभागाच्या स्वतःच्या वसुली इतिहासावर पुन्हा आधारित करावा लागेल.'
})
