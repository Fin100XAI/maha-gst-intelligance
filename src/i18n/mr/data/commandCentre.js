import { registerMessages } from '../../locale.js'

/**
 * Marathi — commandBoard.js and commandCentre.js: the standing conditions the
 * board reports, the at-risk mechanisms, the protection funnel, and the
 * pending capabilities with the reason each is blocked.
 *
 * Two passages here carry the whole design and are translated at full length
 * rather than summarised: severity meaning irreversibility rather than size,
 * and the two clocks — limitation as a cliff, decay as a slope — behaving
 * differently and therefore calling for different responses.
 *
 *   irreversibility → अपरिवर्तनीयता
 *   cliff / slope   → कडा / उतार
 *   funnel          → गाळणी टप्पे
 *   labelled corpus → चिन्हांकित संग्रह
 *   double-count    → दुहेरी मोजणी
 *   artifact        → कृत्रिम परिणाम
 *   second (a verb) → तात्पुरते पाठवणे
 */
registerMessages('mr', {
  /* == Command board — severity =========================================== */
  'Loss is happening now and cannot be undone.': 'नुकसान आत्ता होत आहे आणि ते भरून काढता येणार नाही.',
  'Significant value at risk from a cause the department controls.':
    'विभागाच्या नियंत्रणातील कारणामुळे लक्षणीय मूल्य जोखमीत आहे.',
  'Needs monitoring, or turns on something outside the department’s control.':
    'यावर लक्ष ठेवणे आवश्यक, किंवा हे विभागाच्या नियंत्रणाबाहेरील गोष्टीवर अवलंबून आहे.',
  'Severity here means irreversibility, not size. Critical is reserved for loss that is happening now and cannot be undone — an expired period, or one about to expire with nobody able to act. A larger sum still recoverable next month ranks High. Ordering by rupee value would put the recoverable above the irrecoverable and train exactly the wrong reflex.':
    'येथे तीव्रता म्हणजे अपरिवर्तनीयता, आकार नव्हे. "अत्यंत गंभीर" ही श्रेणी आत्ता होत असलेल्या व भरून न काढता येणाऱ्या नुकसानासाठीच राखीव आहे — संपलेला कालावधी, किंवा संपण्याच्या मार्गावर असलेला आणि ज्यावर कारवाई करू शकेल असे कोणीही नाही असा कालावधी. पुढील महिन्यातही वसूल होऊ शकणारी मोठी रक्कम "उच्च" श्रेणीत येते. रुपयांच्या मूल्यानुसार क्रम लावल्यास वसूलपात्र गोष्ट न-वसूलपात्र गोष्टीच्या वर जाईल आणि नेमकी चुकीचीच सवय लागेल.',

  /* == Command board — the standing conditions =========================== */
  'The statutory period has expired. No demand can now be raised for these periods however the case is worked, and the amount is not recoverable by any action available to the department.':
    'सांविधिक मुदत संपली आहे. प्रकरण कसेही हाताळले तरी या कालावधींसाठी आता कोणतीही मागणी उभी करता येणार नाही, आणि विभागाला उपलब्ध असलेल्या कोणत्याही कारवाईने ती रक्कम वसूल होणार नाही.',
  'Close them formally and record why each was missed, so the same failure is visible next quarter rather than repeated.':
    'ती औपचारिकरीत्या निकालात काढा आणि प्रत्येक का निसटले याची नोंद ठेवा, जेणेकरून तीच चूक पुढील तिमाहीत पुन्हा होण्याऐवजी दिसून येईल.',
  'Divisional Joint Commissioner': 'विभागीय सह आयुक्त',
  'Audit queue clear of time-barred periods': 'लेखापरीक्षा रांग मुदतबाह्य कालावधींपासून मुक्त',
  'Officers are assigned to cases where no recoverable demand can be raised. Every day spent on these is a day not spent on a case that is still live.':
    'ज्या प्रकरणांत वसूलपात्र मागणीच उभी करता येत नाही अशा प्रकरणांवर अधिकारी नेमलेले आहेत. यांवर खर्च होणारा प्रत्येक दिवस हा अद्याप जिवंत असलेल्या प्रकरणावर खर्च न झालेला दिवस असतो.',
  'committed to dead cases': 'मृत प्रकरणांना बांधलेले',
  'Withdraw them from the queue this week and reassign the capacity.':
    'या आठवड्यात ती रांगेतून काढून घ्या आणि क्षमता पुन्हा नेमून द्या.',
  'The deadline falls within thirty days and no eligible officer in that division has capacity. If nothing changes the period expires and the demand is extinguished by operation of law.':
    'मुदत तीस दिवसांच्या आत संपते आहे आणि त्या विभागातील कोणत्याही पात्र अधिकाऱ्याकडे क्षमता नाही. काहीही न बदलल्यास कालावधी संपेल आणि कायद्याच्या परिणामाने मागणी नष्ट होईल.',
  'expires within 30 days': '३० दिवसांत संपते',
  'Second an officer from an adjacent division, or accept the loss explicitly.':
    'शेजारच्या विभागातून एक अधिकारी तात्पुरता पाठवा, किंवा हे नुकसान स्पष्टपणे स्वीकारा.',
  'not workable this week': 'या आठवड्यात हाताळता येणार नाही',
  'A posting decision for the divisions with no eligible officer; a prioritisation decision for the rest.':
    'ज्या विभागांत पात्र अधिकारी नाही त्यांच्यासाठी हा नियुक्तीचा निर्णय आहे; उरलेल्यांसाठी प्राधान्यक्रमाचा.',
  'already lost to queue dwell': 'रांगेतील प्रतीक्षेमुळे आधीच गमावलेले',
  'Set a maximum queue age for high-value signals, and staff to it.':
    'उच्च मूल्याच्या संकेतांसाठी रांगेतील कमाल वय ठरवा, आणि त्यानुसार कर्मचारी नेमा.',
  'Credit continues to move downstream while cases wait. This is the amount that stops being blockable between now and next Monday.':
    'प्रकरणे वाट पाहत असताना श्रेय पुढे सरकतच राहते. आतापासून पुढील सोमवारपर्यंत जी रक्कम रोखता येण्याजोगी उरणार नाही ती हीच.',
  'decays within 7 days': '७ दिवसांत क्षय होते',
  'Work the top of the priority queue before the week closes.':
    'आठवडा संपण्यापूर्वी प्राधान्य रांगेचा वरचा भाग हाताळा.',
  'it crosses': 'ती ओलांडते',
  'they cross': 'त्या ओलांडतात',
  'A chain is one economic unit and several jurisdictional ones. Where a division in its span has no investigation officer posted, the chain cannot be closed as a unit and acting on part of it warns the rest.':
    'साखळी ही आर्थिक दृष्ट्या एकच घटक असते आणि अधिकारक्षेत्रीय दृष्ट्या अनेक. तिच्या व्याप्तीतील ज्या विभागात कोणताही तपास अधिकारी नियुक्त नाही, तिथे ती साखळी एकसंध म्हणून बंद करता येत नाही आणि तिच्या एका भागावर कारवाई केल्याने उरलेले सावध होतात.',
  'blockable but unreachable': 'रोखता येण्याजोगे पण पोहोचता न येणारे',
  'Post an investigation officer to the uncovered division, or run the action from headquarters.':
    'व्याप्ती नसलेल्या विभागात तपास अधिकारी नियुक्त करा, किंवा कारवाई मुख्यालयातून चालवा.',
  'turns on a question of law': 'विधी प्रश्नावर अवलंबून',
  'Take a legal view before any further order issues on these periods, and identify collected demand that would be refundable.':
    'या कालावधींवर आणखी कोणताही आदेश जारी होण्यापूर्वी विधी अभिप्राय घ्या, आणि वसूल केलेली कोणती मागणी परत करावी लागेल ते ओळखा.',
  'Legal Branch': 'विधी शाखा',
  'represented, not recoverable': 'दर्शवलेले, वसूलपात्र नव्हे',
  'Establish the period and applicable section on the highest-value few before deciding whether to reopen.':
    'पुन्हा उघडायचे की नाही हे ठरवण्यापूर्वी सर्वाधिक मूल्याच्या काही प्रकरणांचा कालावधी व लागू कलम निश्चित करा.',

  /* == Command centre — at-risk mechanisms ============================== */
  'protection opportunity': 'संरक्षणाची संधी',
  'Approaching limitation': 'मुदत जवळ येत आहे',
  'A statutory deadline falls within 90 days. If it passes the demand is extinguished by operation of law, whatever the merits.':
    'सांविधिक मुदत ९० दिवसांच्या आत संपते आहे. ती उलटल्यास, गुणवत्ता कशीही असो, कायद्याच्या परिणामाने मागणी नष्ट होते.',
  'Decaying while unworked': 'न हाताळल्यामुळे क्षय होत आहे',
  'Recoverable value is falling week on week because credit continues to move downstream while the case waits.':
    'प्रकरण वाट पाहत असताना श्रेय पुढे सरकत राहते, त्यामुळे वसूलपात्र मूल्य आठवड्यागणिक घटत आहे.',
  'No officer can reach it': 'कोणताही अधिकारी तिथपर्यंत पोहोचू शकत नाही',
  'No eligible officer in the division has capacity this week, or none is posted at all.':
    'विभागातील कोणत्याही पात्र अधिकाऱ्याकडे या आठवड्यात क्षमता नाही, किंवा कोणी नियुक्तच नाही.',
  'Blockable credit in a chain': 'साखळीतील रोखता येण्याजोगे श्रेय',
  'Sits in a detected chain where credit remains blockable if action is taken before it is utilised.':
    'अशा शोधलेल्या साखळीत आहे जिथे श्रेय वापरले जाण्यापूर्वी कारवाई केल्यास ते रोखता येते.',
  'Deadline rests on a contested notification': 'मुदत वादग्रस्त अधिसूचनेवर आधारित',
  'The limitation date depends on Notification 09/2023 or 56/2023, whose validity is reserved before the Supreme Court.':
    'मुदतीची तारीख अधिसूचना ०९/२०२३ किंवा ५६/२०२३ वर अवलंबून आहे, जिची वैधता सर्वोच्च न्यायालयासमोर राखून ठेवली आहे.',
  'The headline counts each taxpayer once, however many mechanisms flag it. Adding the mechanism totals instead would give a figure that is larger, and wrong by exactly the amount shown as double-count avoided. Value whose limitation period has already expired is excluded from the opportunity entirely and reported separately, because no action can recover it and including it would claim credit for money that is gone.':
    'कितीही यंत्रणा एखाद्या करदात्याला निदर्शनास आणोत, ठळक आकडा त्याला एकदाच मोजतो. त्याऐवजी यंत्रणांच्या बेरजा जोडल्या असत्या तर आकडा मोठा आला असता, आणि टाळलेली दुहेरी मोजणी म्हणून दाखवलेल्या रकमेइतकाच तो चुकीचा ठरला असता. ज्याची मुदत आधीच संपली आहे ते मूल्य संधीतून पूर्णपणे वगळले असून वेगळे नोंदवले आहे, कारण कोणतीही कारवाई ते वसूल करू शकत नाही आणि ते समाविष्ट केल्यास निघून गेलेल्या पैशाचे श्रेय घेतल्यासारखे होईल.',

  /* == Command centre — this week's actions ============================== */
  'Open and progress this week': 'या आठवड्यात उघडा व पुढे न्या',
  'Ranked by the value these actions protect THIS WEEK, which is deliberately not the same as the value of the case. A large case whose deadline is eighty days away loses nothing by waiting, and ranking it above a smaller one that decays on Friday would spend the week badly. Where an action is marked unreachable, no eligible officer in that division has capacity — the action is still correct, but it cannot be taken without a deployment decision.':
    'या कृती या आठवड्यात जे मूल्य वाचवतात त्यानुसार क्रम लावलेला आहे, आणि ते जाणीवपूर्वक प्रकरणाच्या मूल्याहून वेगळे आहे. ज्याची मुदत ऐंशी दिवसांवर आहे असे मोठे प्रकरण वाट पाहून काहीही गमावत नाही, आणि शुक्रवारी क्षय होणाऱ्या लहान प्रकरणाच्या वर त्याला ठेवल्यास आठवडा वाया जाईल. जिथे कृती "पोहोचता न येणारी" म्हणून चिन्हांकित आहे, तिथे त्या विभागातील कोणत्याही पात्र अधिकाऱ्याकडे क्षमता नाही — कृती तरीही योग्यच आहे, पण नियुक्तीच्या निर्णयाशिवाय ती करता येणार नाही.',

  /* == Command centre — pending capabilities ============================ */
  'Missed-revenue review candidates': 'निसटलेल्या महसुलाचे पुनर्विलोकन उमेदवार',
  'Closed and no-action cases whose evidence resembles historically confirmed suppression.':
    'निकाली व कारवाई न झालेली प्रकरणे ज्यांचा पुरावा पूर्वी निश्चित झालेल्या माहिती दडवण्याशी साम्य दाखवतो.',
  'A labelled corpus of confirmed outcomes. Resemblance to confirmed fraud cannot be computed without confirmed fraud to resemble.':
    'निश्चित झालेल्या निष्कर्षांचा चिन्हांकित संग्रह. ज्याच्याशी साम्य दाखवायचे अशी निश्चित झालेली फसवणूकच नसेल, तर फसवणुकीशी साम्य परिगणित करता येत नाही.',
  'No question of law in this dataset has five concluded proceedings, so every departmental success rate is currently withheld as statistically meaningless.':
    'या डेटासंचातील कोणत्याही विधी प्रश्नावर पाच निकाली कार्यवाही नाहीत, त्यामुळे विभागाचे प्रत्येक यशाचे प्रमाण सध्या सांख्यिकीय दृष्ट्या निरर्थक म्हणून रोखून धरले आहे.',
  'Section 73 cases showing Section 74 patterns': 'कलम ७४ चे नमुने दाखवणारी कलम ७३ ची प्रकरणे',
  'Cases treated as non-fraud whose evidence profile matches historically confirmed fraud cases.':
    'फसवणूक नसलेली म्हणून हाताळलेली प्रकरणे ज्यांचा पुरावा पूर्वी निश्चित झालेल्या फसवणूक प्रकरणांशी जुळतो.',
  'The same labelled corpus, plus the adjudication outcome on each closed case.':
    'तोच चिन्हांकित संग्रह, आणि त्यासोबत प्रत्येक निकाली प्रकरणावरील न्यायनिर्णयाचा निष्कर्ष.',
  'Reclassification carries a materially longer limitation period and a higher penalty, so a model proposing it must be defensible in appeal. On the current sample it would not be.':
    'फेरवर्गीकरणासोबत लक्षणीयरीत्या मोठी मुदत व अधिक दंड येतो, त्यामुळे ते सुचवणारे प्रारूप अपिलात समर्थनीय असले पाहिजे. सध्याच्या नमुन्यावर ते तसे असणार नाही.',
  'Counterfactual case outcomes': 'प्रति-तथ्य प्रकरण निष्कर्ष',
  'What revenue might have resulted had a case been escalated differently.':
    'प्रकरण वेगळ्या प्रकारे वरिष्ठांकडे नेले असते तर किती महसूल मिळाला असता.',
  'Outcome histories across comparable cases, and enough of them to support a comparison rather than an anecdote.':
    'तुलनात्मक प्रकरणांचे निष्कर्ष इतिहास, आणि तेही सुट्या घटनेऐवजी तुलनेला आधार देण्याइतक्या संख्येने.',
  'A counterfactual drawn from three concluded cases is a guess wearing a number.':
    'तीन निकाली प्रकरणांवरून काढलेला प्रति-तथ्य म्हणजे आकड्याचा पोशाख घातलेला अंदाज.',
  'Previously low-risk taxpayers showing emerging network anomalies':
    'नेटवर्कमधील नवीन असामान्यता दाखवणारे पूर्वी कमी जोखमीचे करदाते',
  'Entities not currently flagged that are becoming linked to flagged ones.':
    'सध्या निदर्शनास न आणलेले घटक जे निदर्शनास आणलेल्यांशी जोडले जात आहेत.',
  'Registration-identity linkage — shared premises, telephone, bank account, authorised signatory, PAN. The rulebook detects circular trading from invoice flow; it does not detect shared identity.':
    'नोंदणी-ओळख संबंध — समान जागा, दूरध्वनी, बँक खाते, अधिकृत स्वाक्षरीकर्ता, PAN. नियमपुस्तक बीजक प्रवाहावरून वर्तुळाकार व्यापार शोधते; ते समान ओळख शोधत नाही.',
  'Tested against this dataset and not demonstrable: contact details here are synthesised per taxpayer, so apparent shared-email groups are a trade-name artifact rather than a signal.':
    'या डेटासंचावर तपासले असता ते दाखवता येत नाही: इथले संपर्क तपशील प्रत्येक करदात्यासाठी स्वतंत्रपणे तयार केलेले आहेत, त्यामुळे समान ईमेल असल्यासारखे दिसणारे गट हे संकेत नसून व्यापारी नावांमुळे आलेला कृत्रिम परिणाम आहेत.',

  /* == Command centre — horizon and funnel =============================== */
  'revenue at risk of becoming unrecoverable by day N':
    'N व्या दिवसापर्यंत वसूल न होण्याच्या जोखमीतील महसूल',
  'actually protected this week': 'या आठवड्यात प्रत्यक्षात वाचवलेले',
  'Assessed revenue exposure': 'निर्धारित महसूल जोखीम रक्कम',
  'Everything the risk engine believes is owed across the modelled population.':
    'प्रारूपातील संपूर्ण संख्येवर जोखीम यंत्रणेच्या मते जे काही देय आहे ते सर्व.',
  'Still recoverable today': 'आजही वसूलपात्र',
  'Lost to detection lag and downstream utilisation before this week began.':
    'हा आठवडा सुरू होण्यापूर्वीच शोधातील विलंब व पुढील टप्प्यांतील वापरामुळे गमावलेले.',
  'Detection speed': 'शोधाचा वेग',
  'An eligible officer could work it': 'पात्र अधिकारी ते हाताळू शकेल',
  'No eligible officer in that division has capacity, or none is posted at all.':
    'त्या विभागातील कोणत्याही पात्र अधिकाऱ्याकडे क्षमता नाही, किंवा कोणी नियुक्तच नाही.',
  Deployment: 'नियुक्ती',
  'Protected by acting this week': 'या आठवड्यात कारवाई केल्याने वाचलेले',
  'The remainder is not lost — it is simply not at risk within seven days, and will surface in a later week.':
    'उरलेले गमावलेले नाही — ते फक्त सात दिवसांच्या आत जोखमीत नाही, आणि पुढील एखाद्या आठवड्यात समोर येईल.',
  Scheduling: 'नियोजन',
  'The limitation date depends on Notification 09/2023 or 56/2023. High Courts have divided on their validity and the Supreme Court has reserved judgment, so these turn on a question of law rather than of fact and need a legal view before any order issues.':
    'मुदतीची तारीख अधिसूचना ०९/२०२३ किंवा ५६/२०२३ वर अवलंबून आहे. त्यांच्या वैधतेबाबत उच्च न्यायालयांत मतभेद असून सर्वोच्च न्यायालयाने निकाल राखून ठेवला आहे, त्यामुळे ही प्रकरणे तथ्याच्या नव्हे तर विधी प्रश्नावर अवलंबून आहेत आणि कोणताही आदेश जारी होण्यापूर्वी त्यांना विधी अभिप्राय आवश्यक आहे.',
  'Two clocks run at once and they behave differently. Limitation is a cliff — the day after the deadline the demand is worth nothing however strong it is. Decay is a slope — credit keeps moving downstream while the case waits. A forecast modelling only decay would miss the cliff entirely; one modelling only deadlines would show value as safe while it quietly erodes. Both are applied here, and the split between them is shown because they call for different responses: the cliff needs a notice issued, the slope needs the case opened sooner.':
    'एकाच वेळी दोन घड्याळे चालतात आणि ती वेगवेगळी वागतात. मुदत हा कडा आहे — मुदतीच्या दुसऱ्या दिवशी मागणी कितीही भक्कम असली तरी तिचे मूल्य शून्य होते. क्षय हा उतार आहे — प्रकरण वाट पाहत असताना श्रेय पुढे सरकतच राहते. केवळ क्षयाचे प्रारूप मांडणारे भाकीत कडा पूर्णपणे चुकवेल; केवळ मुदतींचे प्रारूप मांडणारे भाकीत मूल्य शांतपणे झिजत असतानाही ते सुरक्षित दाखवेल. इथे दोन्ही लावले आहेत, आणि त्यांच्यातील विभागणी दाखवली आहे कारण त्यांना वेगवेगळे प्रतिसाद लागतात: कड्यासाठी नोटीस जारी करावी लागते, उतारासाठी प्रकरण लवकर उघडावे लागते.',
  'Each step loses value to a different cause with a different owner, which is why they are not netted into a single recovery rate. Detection speed governs the first drop, deployment the second, scheduling the third. Only the first two are losses in any real sense — the final step is small because most value is simply not at risk within seven days, not because it has gone.':
    'प्रत्येक टप्प्यावर वेगळ्या कारणाने मूल्य गमावले जाते आणि त्या प्रत्येक कारणाचा धनी वेगळा असतो, म्हणूनच ते एकाच वसुली दरात एकत्र केलेले नाहीत. पहिली घट शोधाच्या वेगावर, दुसरी नियुक्तीवर, तिसरी नियोजनावर अवलंबून असते. खऱ्या अर्थाने नुकसान फक्त पहिल्या दोनच आहेत — शेवटचा टप्पा लहान आहे कारण बहुतांश मूल्य निघून गेलेले नसून ते फक्त सात दिवसांच्या आत जोखमीत नाही.'
})
