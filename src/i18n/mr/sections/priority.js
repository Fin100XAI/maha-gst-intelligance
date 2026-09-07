import { registerMessages } from '../../locale.js'

/**
 * Marathi — Case Priority Engine, Officer Capacity & Deployment,
 * Audit & Scrutiny, and the Officer AI Copilot.
 *
 *   officer-day          → अधिकारी-दिवस
 *   deployable capacity  → तैनात करण्याजोगी क्षमता
 *   unspent              → न वापरलेला
 *   limitation-critical  → परिसीमा-निर्णायक
 *   time-barred          → कालबाह्य
 *   recoverable          → वसूलपात्र
 *   exposure             → जोखीम रक्कम
 *   decay                → क्षय
 *   idle                 → निष्क्रिय
 *   bottleneck           → अडथळा
 *   risk score           → जोखीम गुण
 *
 * The word “case” stays प्रकरण throughout; “ranked” is क्रमांकित, never
 * क्रमवारी लावलेला, so the queue reads the same on every screen.
 */
registerMessages('mr', {
  /* == Case Priority Engine — the ranking itself ======================== */
  'Six factors, divided by the officer-days a case would take. Risk score answers how wrong something is; this answers what deserves an officer’s week — and whether anyone eligible will actually reach it.':
    'सहा घटक, प्रकरणाला लागणाऱ्या अधिकारी-दिवसांनी भागिले. जोखीम गुण काहीतरी किती चुकीचे आहे हे सांगतो; हे कोणते प्रकरण अधिकाऱ्याचा आठवडा मिळवण्यास पात्र आहे — आणि पात्र असलेला कोणी तिथवर खरोखर पोहोचेल का — हे सांगते.',
  'The denominator is what makes this different from a sorted spreadsheet: {0} of the {1} cases in view sit at least ten places from their risk rank. That gap is the officer-days and the statutory clock doing their work.':
    'याला क्रमवारी लावलेल्या तक्त्यापेक्षा वेगळे ठरवणारा भाग म्हणजे भाजक: दृश्यातील {1} पैकी {0} प्रकरणे त्यांच्या जोखीम क्रमांकापासून किमान दहा स्थाने दूर आहेत. तो फरक म्हणजे अधिकारी-दिवस आणि सांविधिक घड्याळ आपले काम करत असल्याचा पुरावा.',
  'ranked cases': 'क्रमांकित प्रकरणे',
  'Reached this week': 'या आठवड्यात पोहोचलेली',
  'of {0} in view · {1} officer-days': 'दृश्यातील {0} पैकी · {1} अधिकारी-दिवस',
  'Ranked but not reached': 'क्रमांकित, पण न पोहोचलेली',
  'holding {0} recoverable': '{0} वसूलपात्र रक्कम धरून',
  'Decays before it is reached': 'पोहोचण्यापूर्वीच क्षय होणारी',
  '₹ L lost over seven days': 'सात दिवसांत गमावलेले ₹ लाख',
  '{0} that can no longer be demanded': '{0}, ज्याची आता मागणी करता येत नाही',
  '{0} of the state’s {1} officer-days this week fall on cases in this view. The “reached this week” column is read from the statewide allocation and is not narrowed by the filter bar. Click any row for the factor breakdown, the statutory position, and why it moved.':
    'या आठवड्यातील राज्याच्या {1} अधिकारी-दिवसांपैकी {0} या दृश्यातील प्रकरणांवर पडतात. “या आठवड्यात पोहोचलेली” हा स्तंभ राज्यव्यापी वाटपातून वाचला जातो आणि गाळणी पट्टीने तो मर्यादित होत नाही. घटकनिहाय विभागणी, सांविधिक स्थिती आणि प्रकरण का हलले हे पाहण्यासाठी कोणत्याही ओळीवर क्लिक करा.',
  'Sorted by risk score, descending. Risk decides the order; the statutory clock decides whether the order is worth working — sort on it to see which cases the calendar is about to close.':
    'जोखीम गुणांनुसार उतरत्या क्रमाने. जोखीम क्रम ठरवते; तो क्रम काम करण्यासारखा आहे का हे सांविधिक घड्याळ ठरवते — दिनदर्शिका कोणती प्रकरणे बंद करणार आहे हे पाहण्यासाठी त्यावर क्रम लावा.',
  'of {0} exposure': '{0} जोखीम रकमेपैकी',
  '{0} exposure': '{0} जोखीम रक्कम',
  'Exposure assessed': 'निर्धारित जोखीम रक्कम',
  'Exposure / recoverable': 'जोखीम रक्कम / वसूलपात्र',
  '{0} recoverable': '{0} वसूलपात्र',
  'cost of waiting': 'वाट पाहण्याची किंमत',
  'the denominator': 'भाजक',
  'Officer-Days Estimated': 'अंदाजित अधिकारी-दिवस',
  'Still Recoverable': 'अजूनही वसूलपात्र',
  'Decays in 7 Days': '7 दिवसांत क्षय',
  'cost of leaving this case another week': 'हे प्रकरण आणखी एक आठवडा ठेवण्याची किंमत',
  'No recovery record': 'वसुलीची नोंद नाही',
  'no recovery record': 'वसुलीची नोंद नाही',
  'the decay curve holds no entry for this GSTIN': 'क्षय वक्रात या GSTIN साठी कोणतीही नोंद नाही',
  'signal age {0} days': 'संकेताचे वय {0} दिवस',
  'Not ranked': 'क्रमांकित नाही',
  'priority #{0} of {1} ranked cases': '{1} क्रमांकित प्रकरणांपैकी प्राधान्य क्रमांक {0}',
  'no entry in the priority queue': 'प्राधान्य रांगेत कोणतीही नोंद नाही',
  'Share of the {0} cases at the head of the queue — the number a week of departmental capacity actually places — against share of all scored cases':
    'रांगेच्या अग्रभागी असलेल्या {0} प्रकरणांतील वाटा — विभागाच्या एका आठवड्याच्या क्षमतेत प्रत्यक्षात बसणारी संख्या — विरुद्ध गुणांकित सर्व प्रकरणांतील वाटा',

  /* == Case Priority Engine — statutory position ======================== */
  'Statutory position': 'सांविधिक स्थिती',
  'No limitation record': 'परिसीमेची नोंद नाही',
  'No limitation record for this taxpayer': 'या करदात्यासाठी परिसीमेची नोंद नाही',
  'No limitation record exists for this taxpayer, so the statutory clock contributed its neutral value to the ranking. Absence of a record is not the same as absence of a deadline.':
    'या करदात्यासाठी परिसीमेची कोणतीही नोंद नाही, त्यामुळे सांविधिक घड्याळाने क्रमवारीत आपले तटस्थ मूल्य दिले. नोंद नसणे म्हणजे मुदत नसणे नव्हे.',
  'Placed as limitation-critical work, before anything discretionary competed for the week.':
    'परिसीमा-निर्णायक काम म्हणून ठेवले — आठवड्यासाठी कोणतेही विवेकाधीन काम स्पर्धेत येण्यापूर्वीच.',
  'Placed on recoverable value per officer-day, on the capacity that survived limitation-critical work.':
    'परिसीमा-निर्णायक कामानंतर उरलेल्या क्षमतेवर, प्रति अधिकारी-दिवस वसूलपात्र मूल्यानुसार ठेवले.',
  'Excluded — time-barred': 'वगळले — कालबाह्य',
  'Excluded from the allocation before it ran: the statutory period has expired, so an officer-day spent here cannot produce a demand.':
    'वाटप चालण्यापूर्वीच त्यातून वगळले: सांविधिक कालावधी संपला आहे, त्यामुळे इथे खर्च केलेला अधिकारी-दिवस कोणतीही मागणी निर्माण करू शकत नाही.',
  'Nearest statutory deadline first': 'सर्वात जवळची सांविधिक मुदत आधी',
  'Inside 30 days of the deadline': 'मुदतीच्या 30 दिवसांच्या आत',
  'open cases · {0} extinguished if the notice is late':
    'प्रलंबित प्रकरणे · नोटीस उशिरा गेल्यास {0} संपुष्टात',
  '{0}d over': '{0} दिवस उलटले',

  /* == Officer Capacity & Deployment ==================================== */
  'Deployable capacity': 'तैनात करण्याजोगी क्षमता',
  'case-days · {0} officers at {1} net days': 'प्रकरण-दिवस · {1} निव्वळ दिवसांवर {0} अधिकारी',
  'of {0} workable · {1} days spent': 'कामयोग्य {0} पैकी · {1} दिवस खर्च',
  'Committed by statute': 'कायद्याने बांधील',
  'days · {0}% of the week, {1} cases, before anything else competed':
    'दिवस · आठवड्याच्या {0}%, {1} प्रकरणे, इतर काहीही स्पर्धेत येण्यापूर्वी',
  '₹ Cr · {0} left unreachable': '₹ कोटी · {0} पर्यंत पोहोचता आले नाही',
  'Where the unspent capacity sits': 'न वापरलेली क्षमता कुठे पडून आहे',
  '{0} of {1} officer-days went unspent while {2} cases could not be worked. An unspent day is not a spare day: it either sits in a division with no waiting caseload, or is shorter than the smallest case still waiting in its pool.':
    '{1} पैकी {0} अधिकारी-दिवस न वापरता राहिले, तर {2} प्रकरणांवर काम होऊ शकले नाही. न वापरलेला दिवस म्हणजे शिल्लक दिवस नव्हे: तो एकतर प्रतीक्षेत कामाचा भार नसलेल्या विभागात असतो, किंवा त्याच्या गटात प्रतीक्षेत असलेल्या सर्वात लहान प्रकरणापेक्षाही लहान असतो.',
  '{0} of {1} field officers were assigned no case at all. Before that is read as spare capacity, check the division and role: an officer with a free week and no eligible case in their own division cannot be lent to a pool that is oversubscribed.':
    '{1} पैकी {0} क्षेत्रीय अधिकाऱ्यांना एकही प्रकरण दिले गेले नाही. हे शिल्लक क्षमता म्हणून वाचण्यापूर्वी विभाग आणि भूमिका तपासा: मोकळा आठवडा असलेला पण स्वतःच्या विभागात पात्र प्रकरण नसलेला अधिकारी, भार जास्त असलेल्या गटाला उसना देता येत नाही.',
  'Days used': 'वापरलेले दिवस',
  'Days unspent': 'न वापरलेले दिवस',
  'Days idle': 'निष्क्रिय दिवस',
  'Recoverable placed': 'ठेवलेली वसूलपात्र रक्कम',
  'Recoverable per day': 'प्रति दिवस वसूलपात्र',
  'Search officers...': 'अधिकारी शोधा...',
  '{0} of the {1} unreachable cases · {2} of recoverable value at stake · {3} officer-days would be needed to clear them':
    'पोहोचता न आलेल्या {1} प्रकरणांपैकी {0} · पणाला लागलेले {2} वसूलपात्र मूल्य · ती निकाली काढण्यास {3} अधिकारी-दिवस लागतील',
  'Largest free block': 'सर्वात मोठा मोकळा गाळा',
  'No eligible officer is posted, so no block exists to measure':
    'कोणताही पात्र अधिकारी नियुक्त नाही, त्यामुळे मोजण्यासारखा गाळाच अस्तित्वात नाही',
  'Nothing waiting here fits inside one more officer-week':
    'इथे प्रतीक्षेत असलेले काहीही आणखी एका अधिकारी-आठवड्यात बसत नाही',
  '{0} cases carrying {1} of exposure, and {2} officer-days of work that was released to live cases. Not a capacity problem and deliberately not competing for officer days: no demand can lawfully be raised, so an officer-day spent here returns nothing.':
    '{1} जोखीम रक्कम धारण करणारी {0} प्रकरणे, आणि जिवंत प्रकरणांसाठी मोकळे केलेले {2} अधिकारी-दिवसांचे काम. ही क्षमतेची समस्या नाही आणि जाणीवपूर्वक अधिकारी-दिवसांसाठी स्पर्धेत नाही: कायदेशीरपणे कोणतीही मागणी उभी करता येत नाही, त्यामुळे इथे खर्च केलेला अधिकारी-दिवस काहीही परत देत नाही.',
  'Officer-days released': 'मोकळे झालेले अधिकारी-दिवस',
  '{0} time-critical': '{0} काल-निर्णायक',

  /* == Audit & Scrutiny ================================================= */
  'audit cases': 'लेखापरीक्षण प्रकरणे',
  'case records': 'प्रकरण नोंदी',
  'Open cases': 'प्रलंबित प्रकरणे',
  'of {0} in view · {1} closed': 'दृश्यातील {0} पैकी · {1} निकाली',
  'open {0}d': '{0} दिवसांपासून प्रलंबित',
  '₹ Cr of {0} exposure — {1}%': '{0} जोखीम रकमेपैकी ₹ कोटी — {1}%',
  'No action for {0}+ days': '{0}+ दिवस कोणतीही कार्यवाही नाही',
  'of {0} open · median {1} days idle':
    'प्रलंबित {0} पैकी · मध्यक {1} दिवस निष्क्रिय',
  '{0} days since the last recorded action': 'शेवटच्या नोंदलेल्या कार्यवाहीला {0} दिवस',
  'Stage tracking with what each stage is holding. A column is a bottleneck when value and expiring cases accumulate in it — a case count on its own cannot show that.':
    'प्रत्येक टप्पा काय धरून आहे यासह टप्प्यांचा मागोवा. ज्या स्तंभात मूल्य आणि मुदत संपणारी प्रकरणे साचतात तो स्तंभ अडथळा असतो — केवळ प्रकरणांची संख्या हे दाखवू शकत नाही.',
  'The recoverable figure covers the {0} of {1} cases in view that carry a record in the recovery engine. The remainder are shown at exposure only — the decay curve is not extrapolated over cases it does not hold.':
    'वसूलपात्र आकडा हा दृश्यातील {1} पैकी ज्या {0} प्रकरणांची वसुली यंत्रात नोंद आहे, तेवढाच व्यापतो. उर्वरित प्रकरणे केवळ जोखीम रकमेवर दाखवली आहेत — क्षय वक्र ज्या प्रकरणांना धरत नाही, त्यांवर तो ताणून नेलेला नाही.',
  'Showing {0} of {1} matching cases — narrow the search to reach the rest.':
    'जुळणाऱ्या {1} पैकी {0} प्रकरणे दाखवत आहोत — उर्वरित पाहण्यासाठी शोध अधिक नेमका करा.',
  '{0} matching cases': '{0} जुळणारी प्रकरणे',

  /* == Officer AI Copilot =============================================== */
  '{0} of {1} questions can be answered from the record as the platform is connected today; {2} of {3} source systems are live in this environment. The rest are declined, and the refusal names the feed that would answer them.':
    'मंच आज ज्या स्वरूपात जोडलेला आहे त्यानुसार {1} पैकी {0} प्रश्नांची उत्तरे नोंदीवरून देता येतात; या वातावरणात {3} पैकी {2} स्रोत प्रणाली जिवंत आहेत. उर्वरित प्रश्न नाकारले जातात, आणि नकारात त्यांची उत्तरे देऊ शकणाऱ्या स्रोताचे नाव दिले जाते.',
  '{0} statement(s) citing {1} system(s), of which {2} are live feeds in this environment — the rest are demonstration records.':
    '{1} प्रणालींचा संदर्भ देणारी {0} विधाने, ज्यांपैकी {2} या वातावरणात जिवंत स्रोत आहेत — उर्वरित प्रात्यक्षिक नोंदी आहेत.',
  'This is the integration decision the question turns into: until that feed is connected, no answer here can be grounded, and the platform will keep declining rather than approximating one.':
    'हा प्रश्न ज्या एकात्मीकरण निर्णयात रूपांतरित होतो तो हाच: तो स्रोत जोडला जाईपर्यंत इथले कोणतेही उत्तर आधारसहित असू शकत नाही, आणि मंच अंदाजाने उत्तर देण्याऐवजी नकारच देत राहील.',

  /* == Capacity — short lines ============================ */
  'One week of capacity, against binding territorial and functional eligibility.':
    'एका आठवड्याची क्षमता, बंधनकारक प्रादेशिक व कार्यात्मक पात्रतेच्या तुलनेत.',
  'Not a contradiction — an unused day in one division cannot move to another.':
    'हा विरोधाभास नाही — एका विभागातील न वापरलेला दिवस दुसऱ्या विभागात नेता येत नाही.',
  'An unspent day is not a spare day.':
    'न वापरलेला दिवस म्हणजे शिल्लक दिवस नव्हे.',
  'Check division and role before reading an idle officer as spare capacity.':
    'निष्क्रिय अधिकारी म्हणजे शिल्लक क्षमता समजण्यापूर्वी विभाग आणि भूमिका तपासा.',
  'A greedy heuristic, measured against a bound rather than claimed optimal.':
    'लोभी अनुमान-पद्धत, इष्टतम असल्याचा दावा न करता मर्यादेच्या तुलनेत मोजलेली.',
  'Limitation-critical work was placed first, by expiry date, not by value.':
    'परिसीमा-निर्णायक काम आधी ठेवले, मुदत संपण्याच्या तारखेनुसार, मूल्यानुसार नव्हे.',
  'Time-barred: no demand can be raised, so an officer-day here returns nothing.':
    'कालबाह्य: कोणतीही मागणी उभी करता येत नाही, त्यामुळे इथला अधिकारी-दिवस काहीही परत देत नाही.',
  'Scheduling cannot reach these — only a posting or a jurisdictional change.':
    'वेळापत्रकाने यांच्यापर्यंत पोहोचता येत नाही — केवळ नियुक्ती किंवा अधिकारक्षेत्र बदलानेच.',
  'Pooled at the level an officer-week can actually be moved.':
    'अधिकारी-आठवडा प्रत्यक्षात ज्या पातळीवर हलवता येतो त्या पातळीवर एकत्रित.',
  'Computed from the cases that would actually become reachable, not an average.':
    'प्रत्यक्षात गाठता येतील अशा प्रकरणांवरून मोजलेले, सरासरीवरून नव्हे.',
  'A case larger than one officer-week is indivisible and cannot be placed.':
    'एका अधिकारी-आठवड्याहून मोठे प्रकरण अविभाज्य असते आणि ते ठेवता येत नाही.',

  /* == Case priority — short lines ============================ */
  'Six factors, divided by the officer-days a case would take.':
    'सहा घटक, प्रकरणाला लागणाऱ्या अधिकारी-दिवसांनी भागिले.',
  'Only the statutory clock is not a judgement — it comes from law.':
    'केवळ सांविधिक घड्याळ हे मत नाही — ते कायद्यातून येते.',
  'The denominator is what separates this from a sorted spreadsheet.':
    'याला क्रमवारी लावलेल्या तक्त्यापासून वेगळे ठरवतो तो भाजक.',
  'Click any row for the factors, the statutory position, and why it moved.':
    'घटक, सांविधिक स्थिती आणि प्रकरण का हलले हे पाहण्यासाठी कोणत्याही ओळीवर क्लिक करा.',
  'No record is not the same as no deadline.':
    'नोंद नसणे म्हणजे मुदत नसणे नव्हे.',
  'No sector or district is picked at more than twice its share.':
    'कोणतेही क्षेत्र किंवा जिल्हा त्याच्या वाट्याच्या दुपटीहून अधिक निवडलेला नाही.',
  'Without a control arm, any gain cannot be attributed to the platform.':
    'नियंत्रण गटाशिवाय कोणताही फायदा मंचाला श्रेय देता येत नाही.',

  /* == Audit and copilot — short lines ============================ */
  'Audit cases ranked by risk, from identification through to recovery.':
    'जोखमीनुसार क्रमवार लावलेली लेखापरीक्षण प्रकरणे, ओळखीपासून वसुलीपर्यंत.',
  'Risk decides the order; the statutory clock decides whether it is worth working.':
    'जोखीम क्रम ठरवते; तो क्रम काम करण्यासारखा आहे का हे सांविधिक घड्याळ ठरवते.',
  'A stage is a bottleneck when value and expiring cases pile up in it.':
    'ज्या टप्प्यात मूल्य आणि मुदत संपणारी प्रकरणे साचतात तो टप्पा अडथळा असतो.',
  'Answers drawn from the record, not generated. Every statement cites its source.':
    'नोंदीतून काढलेली उत्तरे, तयार केलेली नव्हेत. प्रत्येक विधान त्याचा स्रोत सांगते.',
  'The rest are declined, naming the feed that would answer them.':
    'उर्वरित नाकारले जातात, आणि त्यांची उत्तरे देऊ शकणाऱ्या स्रोताचे नाव दिले जाते.',
  'Until that feed is connected, no answer here can be grounded.':
    'तो स्रोत जोडला जाईपर्यंत इथले कोणतेही उत्तर आधारसहित असू शकत नाही.',

  /* == Remaining explainers — short lines ============================ */
  'The rest are shown at exposure only — the decay curve is not extrapolated.':
    'उर्वरित केवळ जोखीम रकमेवर दाखवली आहेत — क्षय वक्र त्यांवर ताणलेला नाही.',
  'A positive gap on few taxpayers is variance, not a finding.':
    'थोड्या करदात्यांवरील धन अंतर हा चढउतार आहे, निष्कर्ष नव्हे.',
  'The headline follows the filter; the four figures beside it do not.':
    'मुख्य आकडा गाळणी पाळतो; त्याच्या शेजारचे चार आकडे पाळत नाहीत.',
  'Districts with very few records swing to 0% or 100% for reasons that are not risk.':
    'फार थोड्या नोंदी असलेले जिल्हे जोखमीखेरीज इतर कारणांनी 0% किंवा 100% वर जातात.'
})
