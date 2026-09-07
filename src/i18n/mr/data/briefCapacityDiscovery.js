import { registerMessages } from '../../locale.js'

/**
 * Marathi — the reasoning prose in actionBrief.js, capacity.js and discovery.js.
 *
 * These are the passages that state what the platform will not claim: the
 * outcome dimension left deliberately unstated, the residual reported as three
 * separate problems rather than one number, the negative discovery result kept
 * as a measured finding. Each is translated at full length. The value of these
 * sentences is entirely in their precision, so a shorter Marathi rendering that
 * reads more smoothly would be the wrong trade.
 *
 *   exposure          → जोखीम रक्कम
 *   decay curve       → क्षय वक्र
 *   corroborated      → पुष्टी झालेला
 *   greedy heuristic  → लोभी अनुमान
 *   integrality       → पूर्णांकता
 *   residual          → शिल्लक
 *   median / MAD      → मध्यक / मध्यक निरपेक्ष विचलन
 *   modified z        → सुधारित z
 *   signature         → ठसा
 *   norm              → प्रमाणक
 */
registerMessages('mr', {
  /* == Action brief — the four confidence dimensions ====================== */
  'Section 73': 'कलम ७३',
  'Section 74': 'कलम ७४',
  'Section 74A': 'कलम ७४अ',
  'Not stated': 'नमूद केलेले नाही',
  'Audit case': 'लेखापरीक्षा प्रकरण',
  Alert: 'सूचना',

  'Is the exposure figure right?': 'जोखीम रकमेचा आकडा बरोबर आहे का?',
  'Computed from returns and payment records the platform holds, not estimated. The recoverable share applies a published decay curve to the age of the signal.':
    'मंचाकडे असलेल्या विवरणपत्रे व भरणा अभिलेखांवरून परिगणित, अंदाजित नाही. वसूलपात्र वाटा काढताना संकेताच्या वयावर प्रसिद्ध क्षय वक्र लावला जातो.',
  'It is an assessment of what is owed, not an assessed demand. A hearing may change it.':
    'हे देय रकमेचे आकलन आहे, निर्धारित मागणी नाही. सुनावणीत ते बदलू शकते.',

  'Is the limitation position right?': 'मुदतीची स्थिती बरोबर आहे का?',
  'No limitation record exists for this taxpayer, so no statutory deadline has been computed.':
    'या करदात्यासाठी मुदतीची कोणतीही नोंद नाही, त्यामुळे कोणतीही सांविधिक मुदत परिगणित केलेली नाही.',
  'Absence of a record is not the same as absence of a deadline.':
    'नोंद नसणे म्हणजे मुदत नसणे नव्हे.',
  'The deadline depends on Notification 09/2023 or 56/2023. High Courts have divided on their validity and the Supreme Court has reserved judgment, so the applicable date is genuinely unsettled.':
    'ही मुदत अधिसूचना ०९/२०२३ किंवा ५६/२०२३ वर अवलंबून आहे. त्यांच्या वैधतेबाबत उच्च न्यायालयांत मतभेद असून सर्वोच्च न्यायालयाने निकाल राखून ठेवला आहे, त्यामुळे लागू होणारी तारीख खरोखरच अनिर्णीत आहे.',
  'If the notifications fall, the extended deadline never existed and an order passed under it was void when made.':
    'या अधिसूचना रद्द झाल्यास वाढवलेली मुदत कधी अस्तित्वातच नव्हती असे ठरेल आणि तिच्याखाली दिलेला आदेश देतानाच निरर्थक होता.',
  'Assumes the financial year on record is the correct period for the demand.':
    'अभिलेखावरील आर्थिक वर्ष हाच मागणीसाठीचा योग्य कालावधी आहे असे गृहीत धरले आहे.',

  'Is the risk signal sound?': 'जोखीम संकेत भक्कम आहे का?',
  'three or more is a pattern rather than a coincidence': 'तीन किंवा अधिक म्हणजे योगायोग नव्हे, नमुना',
  'fewer than three is suggestive rather than corroborated':
    'तिनांहून कमी म्हणजे पुष्टी झालेला नव्हे, केवळ सूचक',
  'No encoded rule fired for this taxpayer.': 'या करदात्यासाठी कोणताही संकेतबद्ध नियम लागू झाला नाही.',
  'A rule firing is a reason to look, never a finding. Every one of them has innocent explanations.':
    'नियम लागू होणे हे पाहण्याचे कारण आहे, निष्कर्ष कधीच नाही. त्यांपैकी प्रत्येकाला निर्दोष स्पष्टीकरणे आहेत.',

  'Will this survive appeal and be recovered?': 'हे अपिलात टिकून वसूल होईल का?',
  'The department does not yet hold enough concluded proceedings on any question of law to state an outcome rate. No number is offered rather than an unreliable one.':
    'निष्कर्षाचे प्रमाण सांगण्याइतक्या निकाली कार्यवाही विभागाकडे कोणत्याही विधी प्रश्नावर अद्याप नाहीत. अविश्वसनीय आकडा देण्याऐवजी कोणताही आकडा दिलेला नाही.',
  'This is the dimension a commercial product would fabricate. It is left empty deliberately, and it is the gap the pilot should close by capturing outcomes from case one.':
    'व्यावसायिक उत्पादनाने हेच परिमाण रचून काढले असते. ते जाणीवपूर्वक रिकामे ठेवले आहे, आणि पहिल्याच प्रकरणापासून निष्कर्ष नोंदवून पायलटने भरून काढावी अशी हीच त्रुटी आहे.',
  'no comparable precedent': 'तुलनात्मक पूर्वनिर्णय नाही',
  'No binding authority bears on this case, and the department has too few concluded proceedings on the question to state a departmental record. The order archive is not connected, so no citable precedent can be retrieved.':
    'या प्रकरणावर कोणताही बंधनकारक प्राधिकार लागू होत नाही, आणि विभागाचा अभिलेख सांगण्याइतक्या निकाली कार्यवाही या प्रश्नावर विभागाकडे नाहीत. आदेश संग्रह जोडलेला नाही, त्यामुळे उद्धृत करण्याजोगा कोणताही पूर्वनिर्णय मिळवता येत नाही.',
  'Everything above is assembled from records this platform holds, and each element names the system it came from. Nothing is generated. Where an element cannot be grounded it is shown as unavailable with the reason, rather than filled in — an alert that looks complete but contains one invented element is more dangerous than one that visibly has a gap.':
    'वरील सर्व काही मंचाकडे असलेल्या अभिलेखांवरून जुळवलेले आहे, आणि प्रत्येक घटक तो कोणत्या प्रणालीतून आला हे नमूद करतो. काहीही निर्माण केलेले नाही. ज्या घटकाला अभिलेखाचा आधार देता येत नाही तो भरून काढण्याऐवजी कारणासह अनुपलब्ध म्हणून दाखवला जातो — पूर्ण दिसणारी पण एक रचलेला घटक असलेली सूचना ही उघड त्रुटी असलेल्या सूचनेपेक्षा अधिक धोकादायक असते.',
  'Confidence is reported against four separate questions rather than as one number, because they have four different answers and they imply different actions. A case that is certain on the arithmetic and unsettled on the law needs a legal view before it needs an officer-day, and a single blended figure would hide exactly that. The outcome dimension is deliberately left unstated: the department does not yet hold enough concluded proceedings to support a figure, and this is the dimension a system under commercial pressure would invent.':
    'विश्वास हा एका आकड्याऐवजी चार स्वतंत्र प्रश्नांवर स्वतंत्रपणे नोंदवला जातो, कारण त्यांची उत्तरे चार वेगवेगळी आहेत आणि ती वेगवेगळ्या कृती सुचवतात. अंकगणितावर निश्चित पण कायद्यावर अनिर्णीत असलेल्या प्रकरणाला अधिकारी-दिवसाआधी विधी अभिप्राय हवा असतो, आणि एकत्र मिसळलेला एकच आकडा नेमके तेच लपवेल. निष्कर्षाचे परिमाण जाणीवपूर्वक नमूद केलेले नाही: आकडा देण्याइतक्या निकाली कार्यवाही विभागाकडे अद्याप नाहीत, आणि व्यावसायिक दबावाखालील प्रणालीने रचून काढले असते ते हेच परिमाण आहे.',

  /* == Capacity — policy inputs ========================================== */
  'Working days per officer per week': 'प्रति अधिकारी प्रति आठवडा कामाचे दिवस',
  'Standard working week.': 'प्रमाणित कार्य आठवडा.',
  'Share spent on non-case work': 'प्रकरणेतर कामावर खर्च होणारा वाटा',
  'Hearings, correspondence, returns scrutiny administration and establishment work. Not available for case allocation.':
    'सुनावण्या, पत्रव्यवहार, विवरणपत्र तपासणीचे प्रशासन व आस्थापना कामकाज. प्रकरण वाटपासाठी उपलब्ध नाही.',
  'Net case capacity per officer per week': 'प्रति अधिकारी प्रति आठवडा निव्वळ प्रकरण क्षमता',
  'The figure the allocation actually spends.': 'वाटप प्रत्यक्षात हाच आकडा खर्च करते.',
  'Limitation-critical threshold': 'मुदतीच्या दृष्टीने निर्णायक उंबरठा',
  'Inside this window a case is treated as mandatory, not as a high-scoring option.':
    'या मुदतीच्या आत प्रकरण हे उच्च गुणांकाचा पर्याय नव्हे, तर अनिवार्य मानले जाते.',
  'Recoverability where no recovery record exists': 'वसुलीची नोंद नसताना वसूलक्षमता',
  'The same base rate used by the priority engine, applied so the two modules cannot disagree about the value of the same case.':
    'प्राधान्य यंत्रणाच वापरते तोच आधारदर, जेणेकरून एकाच प्रकरणाच्या मूल्याबाबत दोन प्रारूपांमध्ये मतभेद होऊ शकणार नाही.',
  Investigation: 'तपास',
  'A case with a counterparty chain to trace. Requires investigation powers; an audit officer cannot take it.':
    'ज्यात प्रतिपक्ष साखळीचा माग काढायचा आहे असे प्रकरण. यास तपासाचे अधिकार आवश्यक; लेखापरीक्षा अधिकारी ते घेऊ शकत नाही.',
  'Audit / scrutiny': 'लेखापरीक्षा / तपासणी',
  'Desk review and scrutiny of a single registration. Either an audit officer or the division officer may take it.':
    'एकाच नोंदणीचे कार्यालयीन पुनर्विलोकन व तपासणी. लेखापरीक्षा अधिकारी किंवा विभाग अधिकारी यांपैकी कोणीही ते घेऊ शकतो.',
  'where should the next officer go': 'पुढील अधिकारी कुठे नियुक्त करावा',
  'This is a greedy heuristic on a bipartite assignment problem, not a solved optimum — generalised assignment is NP-hard and no claim of optimality is made. The comparison figure is an upper bound obtained by relaxing both eligibility and integrality, so it is unreachable by construction and the true optimum lies between the achieved value and the bound. Limitation-critical work is assigned before anything else competes for capacity, and is ordered by expiry rather than by value, because inside that window the only defensible ordering is which case dies first.':
    'हे द्विभाजित नेमणूक समस्येवरील लोभी अनुमान आहे, सोडवलेले सर्वोत्तम नव्हे — सामान्यीकृत नेमणूक ही NP-hard समस्या असून सर्वोत्तमतेचा कोणताही दावा केलेला नाही. तुलनेचा आकडा हा पात्रता व पूर्णांकता या दोन्ही शिथिल करून मिळवलेली कमाल मर्यादा आहे, त्यामुळे ती रचनेनुसारच गाठता येत नाही आणि खरे सर्वोत्तम साध्य मूल्य व मर्यादा यांदरम्यान असते. मुदतीच्या दृष्टीने निर्णायक काम इतर कशाशीही क्षमतेसाठी स्पर्धा करण्यापूर्वीच नेमले जाते, आणि ते मूल्यानुसार नव्हे तर मुदत संपण्याच्या क्रमाने लावले जाते, कारण त्या मुदतीच्या आत कोणते प्रकरण आधी मरते हाच एकमेव समर्थनीय क्रम असतो.',
  'No eligible officer in the division': 'विभागात कोणताही पात्र अधिकारी नाही',
  'A deployment problem. No scheduling change reaches these cases — there is nobody posted who may lawfully take them. Requires a posting or a jurisdictional reassignment.':
    'ही नियुक्तीची समस्या आहे. नियोजनातील कोणताही बदल या प्रकरणांपर्यंत पोहोचत नाही — ती कायदेशीररीत्या घेऊ शकेल असा कोणीही नियुक्त नाही. यासाठी नियुक्ती किंवा अधिकारक्षेत्रातील फेरबदल आवश्यक आहे.',
  'Eligible officers fully committed': 'पात्र अधिकारी पूर्णपणे व्यग्र',
  'A volume problem. Officers exist and may take the case, but the week is already spent. Responds to additional capacity in that specific pool — the marginal value of one officer-week is computed per pool below.':
    'ही प्रमाणाची समस्या आहे. अधिकारी आहेत आणि ते प्रकरण घेऊ शकतात, पण आठवडा आधीच खर्च झाला आहे. त्या विशिष्ट संचातील अतिरिक्त क्षमतेला ती प्रतिसाद देते — एका अधिकारी-आठवड्याचे सीमांत मूल्य खाली प्रत्येक संचासाठी परिगणित केले आहे.',
  'Case larger than any single officer-week': 'कोणत्याही एका अधिकारी-आठवड्यापेक्षा मोठे प्रकरण',
  'The residual is the finding, not a failure of the allocation. Cases land here for three distinct reasons that call for three different remedies — a posting, more capacity in one specific pool, or a longer working block — and they are reported separately because conflating them produces the wrong decision. Aggregate utilisation is the figure to distrust: the department can sit well below full utilisation while a single division runs three times oversubscribed, because an unused officer-day in one division cannot be spent in another.':
    'शिल्लक हाच निष्कर्ष आहे, वाटपाचे अपयश नव्हे. प्रकरणे इथे तीन वेगळ्या कारणांनी येतात आणि त्यांना तीन वेगळे उपाय लागतात — नियुक्ती, एका विशिष्ट संचात अधिक क्षमता, किंवा अधिक लांबीचा कामाचा गठ्ठा — आणि ती वेगवेगळी नोंदवली जातात कारण त्यांची गल्लत केल्यास चुकीचा निर्णय निघतो. एकत्रित वापराचा आकडाच अविश्वसनीय आहे: एकीकडे एखादा विभाग तिपटीने भारित असतानाही विभाग एकूणपणे पूर्ण वापराच्या बराच खाली राहू शकतो, कारण एका विभागातील न वापरलेला अधिकारी-दिवस दुसऱ्या विभागात वापरता येत नाही.',

  /* == Discovery — features, method and limits =========================== */
  'ITC claimed against turnover': 'उलाढालीच्या तुलनेत दावा केलेले ITC',
  'Claiming materially more input credit per rupee of turnover than sector peers.':
    'क्षेत्रातील समकक्षांपेक्षा प्रति रुपया उलाढालीमागे लक्षणीयरीत्या अधिक इनपुट श्रेय दावा करत आहे.',
  'Claiming materially less input credit per rupee of turnover than sector peers.':
    'क्षेत्रातील समकक्षांपेक्षा प्रति रुपया उलाढालीमागे लक्षणीयरीत्या कमी इनपुट श्रेय दावा करत आहे.',
  'Tax paid against turnover': 'उलाढालीच्या तुलनेत भरलेला कर',
  'Paying materially more tax per rupee of turnover than sector peers.':
    'क्षेत्रातील समकक्षांपेक्षा प्रति रुपया उलाढालीमागे लक्षणीयरीत्या अधिक कर भरत आहे.',
  'Paying materially less tax per rupee of turnover than sector peers — credit or exemption is absorbing the liability.':
    'क्षेत्रातील समकक्षांपेक्षा प्रति रुपया उलाढालीमागे लक्षणीयरीत्या कमी कर भरत आहे — श्रेय किंवा सवलत दायित्व शोषून घेत आहे.',
  'E-way bill value against declared turnover': 'घोषित उलाढालीच्या तुलनेत ई-वे बिल मूल्य',
  'Moving materially more goods than the declared turnover accounts for.':
    'घोषित उलाढालीत बसणाऱ्या प्रमाणापेक्षा लक्षणीयरीत्या अधिक माल वाहून नेत आहे.',
  'Declaring turnover materially in excess of the goods movement recorded against it.':
    'त्याविरुद्ध नोंदलेल्या माल वाहतुकीपेक्षा लक्षणीयरीत्या अधिक उलाढाल घोषित करत आहे.',
  'Refund claimed against turnover': 'उलाढालीच्या तुलनेत दावा केलेला परतावा',
  'Claiming refund at a rate materially above sector peers.':
    'क्षेत्रातील समकक्षांपेक्षा लक्षणीयरीत्या अधिक दराने परतावा दावा करत आहे.',
  ', and ': ', आणि ',
  'Each behavioural ratio is compared against the median of the taxpayer’s own sector, scaled by the median absolute deviation of that sector. Median and MAD are used rather than mean and standard deviation because the mean and SD are themselves pulled by the outliers being searched for — a handful of extreme entities inflate the spread until they no longer register as extreme, which would make this screen fail precisely on the cases it exists to find. The threshold is a modified z of 3.5, the conventional Iglewicz–Hoaglin cut. Sectors with fewer than 8 taxpayers are not normed at all: a peer median drawn from three businesses is not a norm, and taxpayers in those sectors are unassessed rather than cleared.':
    'प्रत्येक वर्तन गुणोत्तराची तुलना करदात्याच्याच क्षेत्राच्या मध्यकाशी केली जाते, आणि त्या क्षेत्राच्या मध्यक निरपेक्ष विचलनाने ती प्रमाणित केली जाते. सरासरी व प्रमाण विचलनाऐवजी मध्यक व MAD वापरले जातात कारण सरासरी व प्रमाण विचलन हे ज्या बाह्यबिंदूंचा शोध घ्यायचा आहे त्यांच्याकडूनच ओढले जातात — मूठभर टोकाचे घटक पसरण इतकी फुगवतात की ते स्वतःच टोकाचे म्हणून नोंदले जात नाहीत, आणि त्यामुळे हा पडदा नेमक्या ज्या प्रकरणांसाठी अस्तित्वात आहे त्यांवरच अपयशी ठरेल. उंबरठा ३.५ चा सुधारित z आहे, म्हणजे रूढ इग्लेविच–होगलिन मर्यादा. ८ पेक्षा कमी करदाते असलेल्या क्षेत्रांचे प्रमाणक काढलेच जात नाही: तीन व्यवसायांवरून काढलेला समकक्ष मध्यक हा प्रमाणक नाही, आणि त्या क्षेत्रांतील करदाते निर्दोष ठरवलेले नसून अनिर्धारित असतात.',
  'Nothing here is an allegation. A legitimately unusual business is statistically indistinguishable from a suspicious one on ratio evidence alone — a genuine exporter, a firm in a bad quarter, or a business whose sector classification is simply wrong will all appear. These are review candidates, and the department should expect most of them to be explained rather than confirmed. The value is not that each one is a case; it is that a recurring signature across several of them may be a pattern the rulebook does not yet encode, and that is worth an analyst’s week.':
    'येथे काहीही आरोप नाही. केवळ गुणोत्तराच्या पुराव्यावरून वैध कारणाने असामान्य असलेला व्यवसाय आणि संशयास्पद व्यवसाय सांख्यिकीय दृष्ट्या वेगळे ओळखता येत नाहीत — खराखुरा निर्यातदार, वाईट तिमाही गेलेली फर्म, किंवा ज्याचे क्षेत्र वर्गीकरणच चुकीचे आहे असा व्यवसाय, हे सर्व इथे दिसतील. हे पुनर्विलोकन उमेदवार आहेत, आणि यांपैकी बहुतेकांचे स्पष्टीकरण मिळेल, पुष्टी नव्हे, अशीच विभागाने अपेक्षा ठेवावी. मूल्य हे नाही की यांतील प्रत्येक एक प्रकरण आहे; मूल्य हे आहे की यांपैकी अनेकांवर पुनरावृत्त होणारा ठसा हा नियमपुस्तकात अद्याप नसलेला नमुना असू शकतो, आणि त्यासाठी विश्लेषकाचा एक आठवडा देणे योग्य आहे.',
  'Detects deviation, not intent. No conclusion about evasion can be drawn from these features.':
    'ते विचलन शोधते, हेतू नाही. या वैशिष्ट्यांवरून चुकवेगिरीबाबत कोणताही निष्कर्ष काढता येत नाही.',
  'Only sees what the returns contain. A taxpayer suppressing turnover consistently across every field looks perfectly ordinary here.':
    'विवरणपत्रांत जे आहे तेवढेच त्याला दिसते. प्रत्येक रकान्यात सातत्याने उलाढाल दडवणारा करदाता इथे पूर्णपणे सामान्य दिसतो.',
  'Sector is taken from the registration record. A misclassified taxpayer will be measured against the wrong peers and may appear anomalous for that reason alone.':
    'क्षेत्र हे नोंदणी अभिलेखातून घेतले जाते. चुकीचे वर्गीकरण झालेला करदाता चुकीच्या समकक्षांशी मोजला जाईल आणि केवळ त्याच कारणाने असामान्य दिसू शकतो.',
  'Single-period ratios. A business with genuine seasonality will deviate in some periods without anything being wrong.':
    'एकाच कालावधीची गुणोत्तरे. खरीखुरी हंगामी चढउतार असलेला व्यवसाय काहीही चुकीचे नसतानाही काही कालावधींत विचलित दिसेल.',
  'The population is small. On 156 taxpayers a recurring signature of two or three is suggestive, not established, and should be confirmed against a larger extract before any rule is encoded.':
    'संख्या लहान आहे. १५६ करदात्यांवर दोन-तीन वेळा पुनरावृत्त होणारा ठसा हा सूचक आहे, सिद्ध झालेला नाही, आणि कोणताही नियम संकेतबद्ध करण्यापूर्वी तो मोठ्या एक्सट्रॅक्टवर पडताळून घ्यावा.',
  'no anomalies found': 'कोणतीही असामान्यता आढळली नाही',
  'Every feature this screen measures is already encoded as a rule, so the extreme tail of each one has been removed from the unflagged population before the screen runs. The highest deviation surviving among unflagged taxpayers is below the outlier threshold on all four ratios, while flagged taxpayers reach well past it — which is the rulebook working, not the detector failing.':
    'हा पडदा जी प्रत्येक वैशिष्ट्ये मोजतो ती आधीच नियम म्हणून संकेतबद्ध आहेत, त्यामुळे पडदा चालण्यापूर्वीच प्रत्येकाचे टोकाचे टोक निदर्शनास न आणलेल्या संख्येतून वगळले गेलेले असते. निदर्शनास न आणलेल्या करदात्यांमध्ये उरलेले सर्वाधिक विचलन चारही गुणोत्तरांवर बाह्यबिंदूच्या उंबरठ्याखाली आहे, तर निदर्शनास आणलेले करदाते तो सहज ओलांडून पुढे जातात — हे नियमपुस्तक काम करत असल्याचे लक्षण आहे, शोधयंत्र अपयशी ठरल्याचे नव्हे.',
  'Compare the two columns below. On every ratio the flagged population reaches a materially higher deviation than any unflagged taxpayer attains.':
    'खालील दोन स्तंभांची तुलना करा. प्रत्येक गुणोत्तरावर निदर्शनास आणलेली संख्या ही निदर्शनास न आणलेल्या कोणत्याही करदात्यापेक्षा लक्षणीयरीत्या अधिक विचलन गाठते.',
  'Registration-identity linkage — shared premises, telephone, email, bank account or authorised signatory across registrations. The rulebook detects circular TRADING from invoice flow; it does not detect shared IDENTITY, so this is genuinely additive. It cannot be demonstrated on this dataset because contact details here are synthesised per taxpayer rather than shared.':
    'नोंदणी-ओळख संबंध — अनेक नोंदण्यांमध्ये समान जागा, दूरध्वनी, ईमेल, बँक खाते किंवा अधिकृत स्वाक्षरीकर्ता. नियमपुस्तक बीजक प्रवाहावरून वर्तुळाकार व्यापार शोधते; ते समान ओळख शोधत नाही, त्यामुळे हे खरोखरच भर घालणारे आहे. या डेटासंचावर ते दाखवता येत नाही कारण इथले संपर्क तपशील समान नसून प्रत्येक करदात्यासाठी स्वतंत्रपणे तयार केलेले आहेत.',
  'Directorship and PAN linkage across entities, including to previously cancelled registrations.':
    'अनेक घटकांमधील संचालकपद व PAN संबंध, ज्यात पूर्वी रद्द झालेल्या नोंदण्यांशी असलेला संबंधही येतो.',
  'Invoice-level rather than period-aggregate returns, which would expose timing and counterparty structure that period totals conceal entirely.':
    'कालावधीच्या एकत्रित आकड्यांऐवजी बीजक-पातळीवरील विवरणपत्रे, ज्यातून कालावधीच्या बेरजा पूर्णपणे झाकून टाकतात अशी वेळ व प्रतिपक्ष रचना उघड होईल.',
  'Multi-period histories, allowing trajectory and volatility features rather than single-period ratios.':
    'अनेक कालावधींचा इतिहास, ज्यामुळे एकाच कालावधीच्या गुणोत्तरांऐवजी वाटचाल व अस्थिरता ही वैशिष्ट्ये वापरता येतील.',
  'Geospatial and premises data, which would make a shared-address screen possible.':
    'भौगोलिक व जागेसंबंधी माहिती, ज्यामुळे समान पत्त्याची चाळणी शक्य होईल.',
  'The method is implemented and correct, and the negative result is evidence that it is calibrated rather than evidence that it works. It should be run against a real extract before any claim is made about what it can find.':
    'पद्धत अंमलात आणलेली व बरोबर आहे, आणि नकारात्मक निष्कर्ष हा ती मांडलेली आहे याचा पुरावा आहे, ती काम करते याचा नव्हे. ती काय शोधू शकते याबाबत कोणताही दावा करण्यापूर्वी ती खऱ्या एक्सट्रॅक्टवर चालवली जावी.'
})
