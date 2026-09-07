import { registerMessages } from '../../locale.js'

/**
 * Hindi — commandBoard.js and commandCentre.js: the standing conditions the
 * board reports, the at-risk mechanisms, the protection funnel, and the
 * pending capabilities with the reason each is blocked.
 *
 * The two load-bearing passages — severity meaning irreversibility rather than
 * size, and the two clocks behaving as a cliff and a slope — are translated at
 * full length rather than summarised.
 *
 *   irreversibility → अपरिवर्तनीयता
 *   cliff / slope   → कगार / ढलान
 *   funnel          → छननी चरण
 *   labelled corpus → अंकित संग्रह
 *   double-count    → दोहरी गणना
 *   artifact        → कृत्रिम परिणाम
 *   second (a verb) → अस्थायी रूप से भेजना
 */
registerMessages('hi', {
  /* == Command board — severity =========================================== */
  'Loss is happening now and cannot be undone.': 'हानि अभी हो रही है और उसे पलटा नहीं जा सकता।',
  'Significant value at risk from a cause the department controls.':
    'विभाग के नियंत्रण वाले कारण से महत्वपूर्ण मूल्य जोखिम में है।',
  'Needs monitoring, or turns on something outside the department’s control.':
    'इस पर निगरानी आवश्यक है, अथवा यह विभाग के नियंत्रण से बाहर की किसी बात पर निर्भर है।',
  'Severity here means irreversibility, not size. Critical is reserved for loss that is happening now and cannot be undone — an expired period, or one about to expire with nobody able to act. A larger sum still recoverable next month ranks High. Ordering by rupee value would put the recoverable above the irrecoverable and train exactly the wrong reflex.':
    'यहाँ गंभीरता का अर्थ अपरिवर्तनीयता है, आकार नहीं। "अत्यंत गंभीर" श्रेणी केवल उस हानि के लिए सुरक्षित है जो अभी हो रही है और पलटी नहीं जा सकती — समाप्त हो चुकी अवधि, अथवा वह जो समाप्त होने को है और जिस पर कार्रवाई करने वाला कोई नहीं। अगले माह भी वसूली-योग्य बड़ी राशि "उच्च" श्रेणी में आती है। रुपये के मूल्य से क्रम लगाने पर वसूली-योग्य वस्तु अवसूली-योग्य से ऊपर आ जाती और ठीक गलत आदत पड़ती।',

  /* == Command board — the standing conditions =========================== */
  'The statutory period has expired. No demand can now be raised for these periods however the case is worked, and the amount is not recoverable by any action available to the department.':
    'सांविधिक अवधि समाप्त हो चुकी है। प्रकरण चाहे जैसे भी निपटाया जाए, इन अवधियों हेतु अब कोई माँग खड़ी नहीं की जा सकती, और विभाग को उपलब्ध किसी भी कार्रवाई से वह राशि वसूल नहीं होगी।',
  'Close them formally and record why each was missed, so the same failure is visible next quarter rather than repeated.':
    'उन्हें औपचारिक रूप से निपटाएँ और दर्ज करें कि प्रत्येक क्यों छूटा, ताकि वही चूक अगली तिमाही में दोहराई जाने के बजाय दिखाई दे।',
  'Divisional Joint Commissioner': 'विभागीय संयुक्त आयुक्त',
  'Audit queue clear of time-barred periods': 'लेखापरीक्षा पंक्ति कालातीत अवधियों से मुक्त',
  'Officers are assigned to cases where no recoverable demand can be raised. Every day spent on these is a day not spent on a case that is still live.':
    'अधिकारी ऐसे प्रकरणों पर नियत हैं जिनमें वसूली-योग्य माँग खड़ी ही नहीं की जा सकती। इन पर लगाया गया प्रत्येक दिन उस प्रकरण पर न लगाया गया दिन है जो अब भी जीवित है।',
  'committed to dead cases': 'मृत प्रकरणों में लगा हुआ',
  'Withdraw them from the queue this week and reassign the capacity.':
    'इस सप्ताह उन्हें पंक्ति से हटाएँ और क्षमता पुनः नियत करें।',
  'The deadline falls within thirty days and no eligible officer in that division has capacity. If nothing changes the period expires and the demand is extinguished by operation of law.':
    'समय-सीमा तीस दिनों के भीतर है और उस विभाग के किसी भी पात्र अधिकारी के पास क्षमता नहीं है। यदि कुछ नहीं बदला तो अवधि समाप्त हो जाएगी और विधि के प्रवर्तन से माँग समाप्त हो जाएगी।',
  'expires within 30 days': '30 दिनों में समाप्त',
  'Second an officer from an adjacent division, or accept the loss explicitly.':
    'निकटवर्ती विभाग से एक अधिकारी अस्थायी रूप से भेजें, अथवा इस हानि को स्पष्ट रूप से स्वीकार करें।',
  'not workable this week': 'इस सप्ताह निपटाने योग्य नहीं',
  'A posting decision for the divisions with no eligible officer; a prioritisation decision for the rest.':
    'जिन विभागों में पात्र अधिकारी नहीं है उनके लिए यह तैनाती का निर्णय है; शेष के लिए प्राथमिकता का।',
  'already lost to queue dwell': 'पंक्ति में ठहराव से पहले ही खोया',
  'Set a maximum queue age for high-value signals, and staff to it.':
    'उच्च मूल्य के संकेतों हेतु पंक्ति की अधिकतम आयु निर्धारित करें, और उसी के अनुसार कर्मचारी लगाएँ।',
  'Credit continues to move downstream while cases wait. This is the amount that stops being blockable between now and next Monday.':
    'प्रकरणों की प्रतीक्षा के दौरान श्रेय आगे बढ़ता रहता है। अब से अगले सोमवार तक जो राशि रोकने-योग्य नहीं रह जाएगी, वह यही है।',
  'decays within 7 days': '7 दिनों में क्षय',
  'Work the top of the priority queue before the week closes.':
    'सप्ताह समाप्त होने से पूर्व प्राथमिकता पंक्ति का शीर्ष भाग निपटाएँ।',
  'it crosses': 'वह पार करती है',
  'they cross': 'वे पार करती हैं',
  'A chain is one economic unit and several jurisdictional ones. Where a division in its span has no investigation officer posted, the chain cannot be closed as a unit and acting on part of it warns the rest.':
    'शृंखला आर्थिक रूप से एक इकाई है और अधिकारिता की दृष्टि से अनेक। उसकी व्याप्ति के जिस विभाग में कोई अन्वेषण अधिकारी तैनात नहीं है, वहाँ शृंखला एक इकाई के रूप में बंद नहीं की जा सकती और उसके एक भाग पर कार्रवाई शेष को सचेत कर देती है।',
  'blockable but unreachable': 'रोकने-योग्य किंतु अगम्य',
  'Post an investigation officer to the uncovered division, or run the action from headquarters.':
    'जिस विभाग में व्याप्ति नहीं है वहाँ अन्वेषण अधिकारी तैनात करें, अथवा कार्रवाई मुख्यालय से चलाएँ।',
  'turns on a question of law': 'विधि के प्रश्न पर निर्भर',
  'Take a legal view before any further order issues on these periods, and identify collected demand that would be refundable.':
    'इन अवधियों पर कोई और आदेश जारी होने से पूर्व विधिक राय लें, और पहचानें कि वसूली गई कौन-सी माँग प्रतिदेय होगी।',
  'Legal Branch': 'विधि शाखा',
  'represented, not recoverable': 'दर्शाया गया, वसूली-योग्य नहीं',
  'Establish the period and applicable section on the highest-value few before deciding whether to reopen.':
    'पुनः खोलना है या नहीं, यह तय करने से पूर्व सर्वाधिक मूल्य वाले कुछ प्रकरणों की अवधि एवं लागू धारा निश्चित करें।',

  /* == Command centre — at-risk mechanisms ============================== */
  'protection opportunity': 'संरक्षण का अवसर',
  'Approaching limitation': 'परिसीमा निकट आ रही है',
  'A statutory deadline falls within 90 days. If it passes the demand is extinguished by operation of law, whatever the merits.':
    'सांविधिक समय-सीमा 90 दिनों के भीतर है। वह बीत जाने पर, गुण-दोष चाहे जो हों, विधि के प्रवर्तन से माँग समाप्त हो जाती है।',
  'Decaying while unworked': 'न निपटाए जाने से क्षय हो रहा है',
  'Recoverable value is falling week on week because credit continues to move downstream while the case waits.':
    'प्रकरण की प्रतीक्षा के दौरान श्रेय आगे बढ़ता रहता है, इसलिए वसूली-योग्य मूल्य सप्ताह-दर-सप्ताह गिर रहा है।',
  'No officer can reach it': 'कोई अधिकारी वहाँ तक नहीं पहुँच सकता',
  'No eligible officer in the division has capacity this week, or none is posted at all.':
    'विभाग के किसी भी पात्र अधिकारी के पास इस सप्ताह क्षमता नहीं है, अथवा कोई तैनात ही नहीं है।',
  'Blockable credit in a chain': 'शृंखला में रोकने-योग्य श्रेय',
  'Sits in a detected chain where credit remains blockable if action is taken before it is utilised.':
    'ऐसी पहचानी गई शृंखला में है जहाँ श्रेय उपयोग होने से पूर्व कार्रवाई करने पर उसे रोका जा सकता है।',
  'Deadline rests on a contested notification': 'समय-सीमा विवादित अधिसूचना पर आधारित',
  'The limitation date depends on Notification 09/2023 or 56/2023, whose validity is reserved before the Supreme Court.':
    'परिसीमा की तिथि अधिसूचना 09/2023 अथवा 56/2023 पर निर्भर है, जिसकी वैधता उच्चतम न्यायालय के समक्ष सुरक्षित रखी गई है।',
  'The headline counts each taxpayer once, however many mechanisms flag it. Adding the mechanism totals instead would give a figure that is larger, and wrong by exactly the amount shown as double-count avoided. Value whose limitation period has already expired is excluded from the opportunity entirely and reported separately, because no action can recover it and including it would claim credit for money that is gone.':
    'कितने भी तंत्र किसी करदाता को चिह्नित करें, मुख्य आँकड़ा उसे एक ही बार गिनता है। इसके बजाय तंत्रों के योग जोड़ने पर आँकड़ा बड़ा आता, और "टाली गई दोहरी गणना" के रूप में दिखाई गई राशि के ठीक बराबर गलत होता। जिसकी परिसीमा अवधि पहले ही समाप्त हो चुकी है, वह मूल्य अवसर से पूर्णतः बाहर रखा गया है और अलग दर्ज किया गया है, क्योंकि कोई कार्रवाई उसे वसूल नहीं कर सकती और उसे सम्मिलित करना जा चुके धन का श्रेय लेना होता।',

  /* == Command centre — this week's actions ============================== */
  'Open and progress this week': 'इस सप्ताह खोलें एवं आगे बढ़ाएँ',
  'Ranked by the value these actions protect THIS WEEK, which is deliberately not the same as the value of the case. A large case whose deadline is eighty days away loses nothing by waiting, and ranking it above a smaller one that decays on Friday would spend the week badly. Where an action is marked unreachable, no eligible officer in that division has capacity — the action is still correct, but it cannot be taken without a deployment decision.':
    'क्रम इस आधार पर है कि ये कार्रवाइयाँ इस सप्ताह कितना मूल्य बचाती हैं, और यह जानबूझकर प्रकरण के मूल्य से भिन्न है। जिस बड़े प्रकरण की समय-सीमा अस्सी दिन दूर है, वह प्रतीक्षा से कुछ नहीं खोता, और उसे शुक्रवार को क्षय होने वाले छोटे प्रकरण से ऊपर रखने पर सप्ताह व्यर्थ जाता। जहाँ कार्रवाई "अगम्य" अंकित है, वहाँ उस विभाग के किसी पात्र अधिकारी के पास क्षमता नहीं है — कार्रवाई तब भी सही है, पर तैनाती के निर्णय के बिना वह की नहीं जा सकती।',

  /* == Command centre — pending capabilities ============================ */
  'Missed-revenue review candidates': 'छूटे राजस्व के समीक्षा उम्मीदवार',
  'Closed and no-action cases whose evidence resembles historically confirmed suppression.':
    'निपटाए गए और बिना कार्रवाई वाले प्रकरण जिनका साक्ष्य पूर्व में पुष्ट तथ्य-छिपाव से समानता रखता है।',
  'A labelled corpus of confirmed outcomes. Resemblance to confirmed fraud cannot be computed without confirmed fraud to resemble.':
    'पुष्ट परिणामों का अंकित संग्रह। जिससे समानता दिखानी है वह पुष्ट कपट ही न हो, तो पुष्ट कपट से समानता परिकलित नहीं की जा सकती।',
  'No question of law in this dataset has five concluded proceedings, so every departmental success rate is currently withheld as statistically meaningless.':
    'इस आँकड़ा-समुच्चय में विधि के किसी प्रश्न पर पाँच निपटाई गई कार्यवाहियाँ नहीं हैं, इसलिए प्रत्येक विभागीय सफलता दर इस समय सांख्यिकीय रूप से निरर्थक मानकर रोकी गई है।',
  'Section 73 cases showing Section 74 patterns': 'धारा 74 के प्रतिरूप दिखाने वाले धारा 73 के प्रकरण',
  'Cases treated as non-fraud whose evidence profile matches historically confirmed fraud cases.':
    'कपट-रहित मानकर निपटाए गए प्रकरण जिनका साक्ष्य-स्वरूप पूर्व में पुष्ट कपट प्रकरणों से मेल खाता है।',
  'The same labelled corpus, plus the adjudication outcome on each closed case.':
    'वही अंकित संग्रह, साथ में प्रत्येक निपटाए गए प्रकरण पर न्यायनिर्णयन का परिणाम।',
  'Reclassification carries a materially longer limitation period and a higher penalty, so a model proposing it must be defensible in appeal. On the current sample it would not be.':
    'पुनर्वर्गीकरण के साथ तात्त्विक रूप से लंबी परिसीमा अवधि और अधिक शास्ति आती है, इसलिए उसे सुझाने वाला प्रारूप अपील में बचाव-योग्य होना चाहिए। वर्तमान नमूने पर वह नहीं होगा।',
  'Counterfactual case outcomes': 'प्रति-तथ्य प्रकरण परिणाम',
  'What revenue might have resulted had a case been escalated differently.':
    'प्रकरण भिन्न ढंग से वरिष्ठ स्तर पर भेजा गया होता तो कितना राजस्व मिलता।',
  'Outcome histories across comparable cases, and enough of them to support a comparison rather than an anecdote.':
    'तुलनीय प्रकरणों के परिणाम-इतिहास, और वे भी इतनी संख्या में कि वे किसी अलग-थलग घटना के बजाय तुलना को सहारा दे सकें।',
  'A counterfactual drawn from three concluded cases is a guess wearing a number.':
    'तीन निपटाए गए प्रकरणों से निकाला गया प्रति-तथ्य, आँकड़े का वेश धारे हुए अनुमान है।',
  'Previously low-risk taxpayers showing emerging network anomalies':
    'नेटवर्क में उभरती असामान्यताएँ दिखाने वाले पूर्व में कम जोखिम वाले करदाता',
  'Entities not currently flagged that are becoming linked to flagged ones.':
    'इस समय अचिह्नित ऐसी इकाइयाँ जो चिह्नित इकाइयों से जुड़ती जा रही हैं।',
  'Registration-identity linkage — shared premises, telephone, bank account, authorised signatory, PAN. The rulebook detects circular trading from invoice flow; it does not detect shared identity.':
    'पंजीयन-पहचान संबंध — साझा परिसर, दूरभाष, बैंक खाता, प्राधिकृत हस्ताक्षरकर्ता, PAN। नियमपुस्तिका बीजक प्रवाह से वर्तुलाकार व्यापार पहचानती है; वह साझा पहचान नहीं पहचानती।',
  'Tested against this dataset and not demonstrable: contact details here are synthesised per taxpayer, so apparent shared-email groups are a trade-name artifact rather than a signal.':
    'इस आँकड़ा-समुच्चय पर परखने पर यह दिखाया नहीं जा सकता: यहाँ संपर्क विवरण प्रत्येक करदाता हेतु अलग-अलग गढ़े गए हैं, इसलिए साझा ईमेल वाले प्रतीत होते समूह संकेत नहीं, व्यापारिक नामों से उपजा कृत्रिम परिणाम हैं।',

  /* == Command centre — horizon and funnel =============================== */
  'revenue at risk of becoming unrecoverable by day N':
    'N वें दिन तक अवसूली-योग्य हो जाने के जोखिम वाला राजस्व',
  'actually protected this week': 'इस सप्ताह वास्तव में बचाया गया',
  'Assessed revenue exposure': 'निर्धारित राजस्व जोखिम राशि',
  'Everything the risk engine believes is owed across the modelled population.':
    'प्रारूप की समस्त संख्या पर जोखिम यंत्र के अनुसार जो कुछ देय है, वह सब।',
  'Still recoverable today': 'आज भी वसूली-योग्य',
  'Lost to detection lag and downstream utilisation before this week began.':
    'यह सप्ताह आरंभ होने से पूर्व ही पहचान-विलंब और आगे के उपयोग से खोया।',
  'Detection speed': 'पहचान की गति',
  'An eligible officer could work it': 'कोई पात्र अधिकारी इसे निपटा सकता है',
  'No eligible officer in that division has capacity, or none is posted at all.':
    'उस विभाग के किसी पात्र अधिकारी के पास क्षमता नहीं है, अथवा कोई तैनात ही नहीं है।',
  Deployment: 'तैनाती',
  'Protected by acting this week': 'इस सप्ताह कार्रवाई से बचाया गया',
  'The remainder is not lost — it is simply not at risk within seven days, and will surface in a later week.':
    'शेष खोया नहीं है — वह केवल सात दिनों के भीतर जोखिम में नहीं है, और किसी आगामी सप्ताह में सामने आएगा।',
  Scheduling: 'अनुसूचन',
  'The limitation date depends on Notification 09/2023 or 56/2023. High Courts have divided on their validity and the Supreme Court has reserved judgment, so these turn on a question of law rather than of fact and need a legal view before any order issues.':
    'परिसीमा की तिथि अधिसूचना 09/2023 अथवा 56/2023 पर निर्भर है। उनकी वैधता पर उच्च न्यायालयों में मतभेद है और उच्चतम न्यायालय ने निर्णय सुरक्षित रखा है, इसलिए ये प्रकरण तथ्य के नहीं, विधि के प्रश्न पर निर्भर हैं और किसी भी आदेश के जारी होने से पूर्व इन्हें विधिक राय चाहिए।',
  'Two clocks run at once and they behave differently. Limitation is a cliff — the day after the deadline the demand is worth nothing however strong it is. Decay is a slope — credit keeps moving downstream while the case waits. A forecast modelling only decay would miss the cliff entirely; one modelling only deadlines would show value as safe while it quietly erodes. Both are applied here, and the split between them is shown because they call for different responses: the cliff needs a notice issued, the slope needs the case opened sooner.':
    'एक साथ दो घड़ियाँ चलती हैं और वे भिन्न व्यवहार करती हैं। परिसीमा एक कगार है — समय-सीमा के अगले दिन माँग चाहे कितनी भी सुदृढ़ हो, उसका मूल्य शून्य हो जाता है। क्षय एक ढलान है — प्रकरण की प्रतीक्षा के दौरान श्रेय आगे बढ़ता रहता है। केवल क्षय का प्रारूप बनाने वाला पूर्वानुमान कगार को पूर्णतः चूक जाता; केवल समय-सीमाओं का प्रारूप बनाने वाला मूल्य को चुपचाप क्षरित होते हुए भी सुरक्षित दिखाता। यहाँ दोनों लगाए गए हैं, और उनके बीच का विभाजन दिखाया गया है क्योंकि उन्हें भिन्न प्रतिक्रियाएँ चाहिए: कगार के लिए नोटिस जारी करना पड़ता है, ढलान के लिए प्रकरण जल्दी खोलना पड़ता है।',
  'Each step loses value to a different cause with a different owner, which is why they are not netted into a single recovery rate. Detection speed governs the first drop, deployment the second, scheduling the third. Only the first two are losses in any real sense — the final step is small because most value is simply not at risk within seven days, not because it has gone.':
    'प्रत्येक चरण पर मूल्य भिन्न कारण से खोता है और प्रत्येक कारण का उत्तरदायी भिन्न है, इसीलिए उन्हें एक ही वसूली दर में मिलाया नहीं गया। पहली गिरावट पहचान की गति पर, दूसरी तैनाती पर, तीसरी अनुसूचन पर निर्भर है। वास्तविक अर्थ में हानि केवल पहली दो ही हैं — अंतिम चरण छोटा इसलिए है कि अधिकांश मूल्य जा नहीं चुका, वह बस सात दिनों के भीतर जोखिम में नहीं है।'
})
