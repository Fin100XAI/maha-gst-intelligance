import { registerMessages } from '../../locale.js'

/**
 * Marathi — Executive Command Center and Revenue Protection Command Centre,
 * as reworked section by section.
 *
 * Terminology follows what the earlier catalogues already settled, so a term
 * does not change meaning between screens:
 *
 *   exposure            → जोखीम रक्कम
 *   assessed exposure   → निर्धारित जोखीम रक्कम
 *   recoverable         → वसूलपात्र
 *   limitation          → मुदत        time-barred → मुदतबाह्य
 *   decay               → क्षय
 *   officer-day/week    → अधिकारी-दिवस / अधिकारी-आठवडा
 *   capacity            → क्षमता      deployment → नियुक्ती
 *   residual            → शिल्लक      pool → संच
 *   oversubscribed      → अधिभारित
 *   binding date        → बंधनकारक तारीख
 *   composite           → संयुक्त गुणांक
 *   union / dedup       → एकत्रीकरण / दुहेरी मोजणी वगळणे
 */
registerMessages('mr', {
  /* == The decision strip ================================================ */
  'What needs a decision today': 'आज कशावर निर्णय आवश्यक आहे',
  'Ordered by what needs a decision today, not by what is easiest to display. The irreversible position comes first, then whether the department can act on it, then the performance picture that explains how it arose.':
    'जे दाखवायला सोपे आहे त्यानुसार नव्हे, तर आज कशावर निर्णय आवश्यक आहे त्यानुसार क्रम. प्रथम अपरिवर्तनीय स्थिती, नंतर विभाग त्यावर कारवाई करू शकतो का, आणि शेवटी ती स्थिती कशी निर्माण झाली हे सांगणारे कामगिरीचे चित्र.',
  '{0} of {1} active conditions need a decision at Commissioner level. Each figure below is read from the engine that owns the question, carries the base it is measured against, and states the decision it demands.':
    '{1} पैकी {0} कार्यरत परिस्थितींवर आयुक्त स्तरावर निर्णय आवश्यक आहे. खालील प्रत्येक आकडा तो प्रश्न ज्या यंत्रणेच्या मालकीचा आहे तिच्याकडून घेतलेला आहे, तो कशाच्या तुलनेत मोजला आहे ते दर्शवतो, आणि तो कोणता निर्णय मागतो हे सांगतो.',
  '{0} of {1} proceedings on the limitation register. No action available to the department recovers this.':
    'मुदत नोंदवहीतील {1} पैकी {0} कार्यवाही. विभागाला उपलब्ध असलेल्या कोणत्याही कारवाईने ही रक्कम वसूल होत नाही.',
  'Close them formally and record why each was missed.':
    'ती औपचारिकरीत्या निकालात काढा आणि प्रत्येक का निसटले याची नोंद ठेवा.',
  'Expires within 30 days': '३० दिवसांत संपते',
  '{0} proceedings, of which {1} have no eligible officer available this week.':
    '{0} कार्यवाही, त्यांपैकी {1} साठी या आठवड्यात कोणताही पात्र अधिकारी उपलब्ध नाही.',
  'Issue the notice, or second an officer from an adjacent division.':
    'नोटीस जारी करा, किंवा शेजारच्या विभागातून एक अधिकारी तात्पुरता पाठवा.',
  'Still protectable': 'अद्याप संरक्षणयोग्य',
  '{0} cases, each counted once however many mechanisms flag it — {1}× overlap removed.':
    '{0} प्रकरणे, कितीही यंत्रणांनी निदर्शनास आणली तरी प्रत्येक एकदाच मोजलेली — {1}× आच्छादन वगळले.',
  'Rank the week by what an action protects, not by the size of the case.':
    'प्रकरणाच्या आकारानुसार नव्हे, तर कृती काय वाचवते त्यानुसार आठवड्याचा क्रम लावा.',
  'Of ₹{0} Cr still recoverable today. This stops being blockable by next Monday.':
    'आज वसूलपात्र असलेल्या ₹{0} कोटींपैकी. पुढील सोमवारपर्यंत हे रोखता येण्याजोगे राहणार नाही.',
  '₹{0} Cr not workable this week · {1} have no eligible officer posted at all.':
    'या आठवड्यात ₹{0} कोटी हाताळता येणार नाहीत · {1} प्रकरणांसाठी कोणताही पात्र अधिकारी नियुक्तच नाही.',
  'A posting decision where nobody is eligible; a prioritisation decision for the rest.':
    'जिथे कोणीही पात्र नाही तिथे हा नियुक्तीचा निर्णय; उरलेल्यांसाठी प्राधान्यक्रमाचा.',
  'No proceeding on record': 'अभिलेखावर कोणतीही कार्यवाही नाही',
  'Lost if untouched 7 days': '७ दिवस न हाताळल्यास गमावले जाणारे',
  'Not in the recovery window': 'वसुली कालपटात नाही',
  'Statewide — not narrowed by the filter bar': 'राज्यव्यापी — गाळणी पट्टीने मर्यादित होत नाही',

  /* == Can the department act? =========================================== */
  'Can the department act on what it has found?': 'जे सापडले आहे त्यावर विभाग कारवाई करू शकतो का?',
  'A finding nobody can work is not a finding. Establishment, allocation and residual are read from the capacity engine — an unused officer-day in one division cannot be spent in another, so aggregate utilisation is the figure to distrust.':
    'ज्यावर कोणीही काम करू शकत नाही तो निष्कर्षच नाही. आस्थापना, वाटप व शिल्लक हे क्षमता यंत्रणेकडून घेतलेले आहेत — एका विभागातील न वापरलेला अधिकारी-दिवस दुसऱ्या विभागात वापरता येत नाही, त्यामुळे एकत्रित वापराचा आकडाच अविश्वसनीय आहे.',
  'Open capacity & deployment': 'क्षमता व नियुक्ती उघडा',
  '{0} net officer-days this week after overhead': 'अतिरिक्त कामकाज वगळून या आठवड्यात {0} निव्वळ अधिकारी-दिवस',
  'Week committed': 'आठवडा बांधलेला',
  '{0} of {1} days placed on {2} cases': '{1} पैकी {0} दिवस {2} प्रकरणांवर नेमले',
  'Not workable this week': 'या आठवड्यात हाताळता येणार नाही',
  '{0} cases · {1} of them inside the 30-day statutory window':
    '{0} प्रकरणे · त्यांपैकी {1} ३० दिवसांच्या सांविधिक मुदतीच्या आत',
  'Share of the achievable captured': 'साध्य करण्याजोग्यापैकी मिळवलेला वाटा',
  'Not computable': 'परिगणित करता येत नाही',
  'Against an upper bound that relaxes both eligibility and indivisibility, so it is unreachable by construction.':
    'पात्रता व अविभाज्यता या दोन्ही शिथिल करणाऱ्या कमाल मर्यादेच्या तुलनेत, त्यामुळे ती रचनेनुसारच गाठता येत नाही.',
  'The relaxed upper bound is zero on this week’s demand, so no share can be stated.':
    'या आठवड्याच्या मागणीवर शिथिल कमाल मर्यादा शून्य आहे, त्यामुळे कोणताही वाटा सांगता येत नाही.',
  'Of the {0} cases nobody can work: {1} have no eligible officer posted in that division at all, which is a posting decision; {2} have eligible officers whose week is already spent, which is a volume decision; and {3} need more than one officer-week and cannot be placed inside a seven-day horizon however many officers are added.':
    'कोणीही हाताळू न शकणाऱ्या {0} प्रकरणांपैकी: {1} प्रकरणांसाठी त्या विभागात कोणताही पात्र अधिकारी नियुक्तच नाही — हा नियुक्तीचा निर्णय; {2} प्रकरणांसाठी पात्र अधिकारी आहेत पण त्यांचा आठवडा आधीच खर्च झाला आहे — हा प्रमाणाचा निर्णय; आणि {3} प्रकरणांना एका अधिकारी-आठवड्याहून अधिक लागतो, त्यामुळे कितीही अधिकारी वाढवले तरी ती सात दिवसांच्या मर्यादेत बसवता येत नाहीत.',
  'Every case in this week’s demand was placed with an eligible officer.':
    'या आठवड्याच्या मागणीतील प्रत्येक प्रकरण पात्र अधिकाऱ्याकडे नेमले गेले.',
  '{0} division-and-case-type pools are oversubscribed this week. Which one the next officer-week should go to, and what it would protect, is answered on the Revenue Protection Command Centre.':
    'या आठवड्यात {0} विभाग-व-प्रकरणप्रकार संच अधिभारित आहेत. पुढील अधिकारी-आठवडा कोणत्या संचाला द्यावा आणि त्याने काय वाचेल, याचे उत्तर महसूल संरक्षण सूत्र केंद्रावर आहे.',
  'No division-and-case-type pool is oversubscribed this week.':
    'या आठवड्यात कोणताही विभाग-व-प्रकरणप्रकार संच अधिभारित नाही.',
  'Open revenue protection': 'महसूल संरक्षण उघडा',

  /* == Revenue and finance =============================================== */
  'vs {0}': '{0} च्या तुलनेत',
  'Latest month across {0} districts in scope. No per-district monthly series exists, so the year-on-year comparator is not shown rather than borrowed from the statewide figure.':
    'व्याप्तीतील {0} जिल्ह्यांचा अलीकडचा महिना. जिल्हानिहाय मासिक मालिका अस्तित्वात नाही, त्यामुळे राज्यव्यापी आकड्यावरून उसना घेण्याऐवजी वार्षिक तुलनात्मक आकडा दाखवलेलाच नाही.',
  '{0} months to {1}, against a {2} target.': '{1} पर्यंतचे {0} महिने, {2} लक्ष्याच्या तुलनेत.',
  '{0}% of ₹{1} Cr assessed exposure in scope, held by {2} entities.':
    'व्याप्तीतील ₹{1} कोटी निर्धारित जोखीम रकमेच्या {0}%, {2} घटकांकडे.',
  '{0}% of the {1} taxpayers in scope carry an ITC spike or a circular-trading signal.':
    'व्याप्तीतील {1} करदात्यांपैकी {0}% वर ITC मधील वाढ किंवा वर्तुळाकार व्यापाराचा संकेत आहे.',
  'Of {0} claims in scope, together claiming ₹{1} Cr.':
    'व्याप्तीतील {0} दाव्यांपैकी, ज्यांचा एकत्रित दावा ₹{1} कोटी आहे.',
  'Covers {0}% of the high-risk exposure alongside it.':
    'शेजारील उच्च जोखीम रकमेपैकी {0}% भरून काढते.',
  'No high-risk exposure in scope to measure this against.':
    'याची तुलना करण्यासाठी व्याप्तीत कोणतीही उच्च जोखीम रक्कम नाही.',
  'Of {0} raised in scope, on {1} distinct taxpayers carrying ₹{2} Cr of exposure counted once.':
    'व्याप्तीत उठवलेल्या {0} पैकी, {1} स्वतंत्र करदात्यांवर, ज्यांची एकदाच मोजलेली जोखीम रक्कम ₹{2} कोटी आहे.',
  'Collection realisation against target, the district book behind it, and exposure locked in non-filing':
    'लक्ष्याच्या तुलनेत वसुली प्राप्ती, त्यामागील जिल्हा हिशेब, आणि विवरणपत्र न भरण्यात अडकलेली जोखीम रक्कम',
  'Statewide collection is {0}% against the same month a year earlier ({1}).':
    'वर्षभरापूर्वीच्या याच महिन्याच्या तुलनेत ({1}) राज्यव्यापी वसुली {0}% आहे.',
  'The series does not yet hold a full year before this month, so no year-on-year comparator is stated.':
    'या महिन्यापूर्वीचे पूर्ण वर्ष मालिकेत अद्याप नाही, त्यामुळे वार्षिक तुलनात्मक आकडा दिलेला नाही.',
  'Collection gap — latest month': 'वसुलीतील तूट — अलीकडचा महिना',
  '{0} of {1} districts in scope are below target ({2}%).':
    'व्याप्तीतील {1} पैकी {0} जिल्हे लक्ष्याखाली आहेत ({2}%).',
  'Widest district shortfall': 'सर्वाधिक जिल्हा तूट',
  'No district in scope': 'व्याप्तीत कोणताही जिल्हा नाही',
  '{0} — ₹{1} Cr against a ₹{2} Cr target.': '{0} — ₹{2} कोटी लक्ष्याच्या तुलनेत ₹{1} कोटी.',
  'Widen the filter to compare formations.': 'रचना तुलना करण्यासाठी गाळणी रुंद करा.',
  '{0} non-filers of {1} taxpayers in scope.':
    'व्याप्तीतील {1} करदात्यांपैकी {0} विवरणपत्र न भरणारे.',
  'Booked across {0} districts in scope.': 'व्याप्तीतील {0} जिल्ह्यांत नोंदवलेले.',
  'Across {0} cases in scope.': 'व्याप्तीतील {0} प्रकरणांत.',
  '{0}% of the queue.': 'रांगेच्या {0}%.',
  'No cases in scope.': 'व्याप्तीत कोणतेही प्रकरण नाही.',
  '{0}% still open past six months.': 'सहा महिन्यांनंतरही {0}% प्रलंबित.',

  /* == Health index and lists =========================================== */
  'Weighted composite across six indicators — the single number leadership tracks period to period, with the component carrying the largest drag named rather than left to be found.':
    'सहा निर्देशकांचा भारित संयुक्त गुणांक — नेतृत्व दर कालावधीत पाहते तो एकच आकडा, आणि सर्वाधिक ओढ लावणारा घटक शोधायला न ठेवता नावासह दिलेला.',
  'Largest drag: {0}, scoring {1}. It costs the composite {2} points — more than any other component, because weight and shortfall both count.':
    'सर्वाधिक ओढ: {0}, गुणांक {1}. तो संयुक्त गुणांकाला {2} गुणांचा फटका देतो — इतर कोणत्याही घटकापेक्षा अधिक, कारण भारमान व तूट दोन्ही मोजली जातात.',
  'The {0} highest-scoring of {1} open alerts, each carrying the action it recommends':
    '{1} प्रलंबित सूचनांपैकी सर्वाधिक गुणांकाच्या {0}, प्रत्येकीसोबत ती शिफारस करत असलेली कृती',
  'Shaded by count of High/Critical-risk taxpayers, with each district’s collection gap beneath — click a district for detail':
    'उच्च/अत्यंत गंभीर जोखीम करदात्यांच्या संख्येनुसार छायांकित, खाली प्रत्येक जिल्ह्याची वसुली तूट — तपशिलासाठी जिल्ह्यावर क्लिक करा',
  'No district matches the current filters.': 'सध्याच्या गाळण्यांशी कोणताही जिल्हा जुळत नाही.',
  'Risk rank is not work order. The statutory clock and the value lost by waiting a week are shown beside the score, because a high score with eighty days on the clock can wait and a lower one expiring on Friday cannot.':
    'जोखीम क्रम म्हणजे कामाचा क्रम नव्हे. गुणांकाशेजारी सांविधिक घड्याळ व आठवडाभर वाट पाहिल्याने गमावले जाणारे मूल्य दाखवले आहे, कारण घड्याळावर ऐंशी दिवस असलेले उच्च गुणांकाचे प्रकरण वाट पाहू शकते आणि शुक्रवारी संपणारे कमी गुणांकाचे प्रकरण वाट पाहू शकत नाही.',
  'Open work order': 'कामाचा क्रम उघडा',

  /* == Revenue Protection Command Centre ================================= */
  '{0}% of the ₹{1} Cr assessed exposure is still recoverable at all — the rest went to detection lag before this week began.':
    '₹{1} कोटी निर्धारित जोखीम रकमेपैकी {0}% अद्याप मुळात वसूलपात्र आहे — उर्वरित हा आठवडा सुरू होण्यापूर्वीच शोधातील विलंबामुळे गेले.',
  'The headline follows the filter. The four figures beside it do not: limitation, decay and capacity are computed across the whole establishment, and narrowing them here would mean re-running engines this screen does not own.':
    'ठळक आकडा गाळणी पाळतो. त्याशेजारील चार आकडे पाळत नाहीत: मुदत, क्षय व क्षमता या संपूर्ण आस्थापनेवर परिगणित होतात, आणि त्या इथे मर्यादित करणे म्हणजे हा पडदा ज्यांचा मालक नाही अशा यंत्रणा पुन्हा चालवणे.',
  'When the statutory clock runs out': 'सांविधिक घड्याळ संपते तेव्हा',
  'Counted against the BINDING date — the notice date where no notice has issued, which falls months before the order deadline and is the one most often missed.':
    'बंधनकारक तारखेच्या तुलनेत मोजलेले — जिथे नोटीस निघालेली नाही तिथे नोटिशीची तारीख, जी आदेशाच्या मुदतीच्या कित्येक महिने आधी येते आणि तीच सर्वाधिक वेळा चुकते.',
  'Already past the binding date': 'बंधनकारक तारीख आधीच उलटली',
  'Binding date within 30 days': 'बंधनकारक तारीख ३० दिवसांत',
  '{0} of {1}': '{1} पैकी {0}',
  'Extinguished by operation of law. Excluded from the opportunity above, whatever the merits.':
    'कायद्याच्या परिणामाने नष्ट. गुणवत्ता काहीही असो, वरील संधीतून वगळलेले.',
  'A notice has to issue inside this window. Nothing else on this screen outranks it.':
    'या मुदतीच्या आत नोटीस निघालीच पाहिजे. या पडद्यावरील इतर कशाचेही याहून अधिक प्राधान्य नाही.',
  'Cumulative — contains the 30-day band above. Still schedulable, not yet urgent.':
    'संचयी — वरील ३० दिवसांचा पट्टा यात समाविष्ट आहे. अद्याप नियोजन करण्याजोगे, तातडीचे नाही.',
  'Cumulative. This is the planning horizon, not the acting one.':
    'संचयी. ही नियोजनाची मर्यादा आहे, कारवाईची नव्हे.',
  'These are ASSESSED EXPOSURE against the deadline, not the recoverable value in the headline above. The two answer different questions — what a period is worth if the demand stands, against what is realistically collectable after decay — and adding them together, or comparing them directly, would be wrong. The bands are cumulative, so they do not sum either.':
    'हे मुदतीच्या तुलनेतील निर्धारित जोखीम रक्कम आहेत, वरील ठळक आकड्यातील वसूलपात्र मूल्य नव्हे. दोघे वेगवेगळ्या प्रश्नांची उत्तरे देतात — मागणी टिकल्यास कालावधीचे मूल्य किती, आणि क्षयानंतर प्रत्यक्षात किती वसूल होऊ शकते — आणि ते एकत्र जोडणे किंवा थेट तुलना करणे चुकीचे ठरेल. पट्टे संचयी आहेत, त्यामुळे त्यांचीही बेरीज होत नाही.',
  '{0} cases · {1}% of the union': '{0} प्रकरणे · एकत्रीकरणाच्या {1}%',
  'What unblocks the unreachable share': 'पोहोचता न येणारा वाटा कशाने मोकळा होतो',
  '{0} cases worth {1} cannot be worked this week. They land there for three distinct reasons calling for three different remedies, and conflating them produces the wrong decision.':
    '{1} मूल्याची {0} प्रकरणे या आठवड्यात हाताळता येत नाहीत. ती तिथे तीन वेगळ्या कारणांनी येतात आणि त्यांना तीन वेगळे उपाय लागतात; त्यांची गल्लत केल्यास चुकीचा निर्णय निघतो.',
  '{0} of them are inside the 30-day statutory window.':
    'त्यांपैकी {0} ३० दिवसांच्या सांविधिक मुदतीच्या आत आहेत.',
  'If nothing changes the period expires and the demand is extinguished by operation of law. Second an officer from an adjacent division, or accept the loss explicitly — those are the only two outcomes available.':
    'काहीही न बदलल्यास कालावधी संपेल आणि कायद्याच्या परिणामाने मागणी नष्ट होईल. शेजारच्या विभागातून अधिकारी तात्पुरता पाठवा, किंवा हे नुकसान स्पष्टपणे स्वीकारा — उपलब्ध असलेले हे दोनच निष्कर्ष आहेत.',
  'Where the next officer-week protects most': 'पुढील अधिकारी-आठवडा कुठे सर्वाधिक वाचवतो',
  '{0}× oversubscribed · {1} of {2} officer-days demanded':
    '{0}× अधिभारित · {2} पैकी {1} अधिकारी-दिवसांची मागणी',
  '₹{0} L across {1} cases': '{1} प्रकरणांत मिळून ₹{0} लाख',
  'The marginal figure is computed from the cases actually left unreachable in that pool, taken best-density-first up to one officer-week — not an average, and not asserted. Capacity is pooled by division and case type because that is the granularity at which an officer-week can actually be moved: aggregate slack is meaningless if it sits in the wrong pool.':
    'सीमांत आकडा त्या संचात प्रत्यक्षात पोहोचता न आलेल्या प्रकरणांवरून परिगणित केला आहे, सर्वाधिक घनतेच्या क्रमाने एका अधिकारी-आठवड्यापर्यंत — ही सरासरी नाही, आणि ठामपणे मांडलेला दावाही नाही. क्षमता विभाग व प्रकरणप्रकारानुसार संचबद्ध केली आहे कारण त्याच पातळीवर अधिकारी-आठवडा प्रत्यक्षात हलवता येतो: चुकीच्या संचात पडलेली एकत्रित मोकळीक निरर्थक असते.',
  'Officer-days this list costs': 'ही यादी किती अधिकारी-दिवस मागते',
  '{0}% of the {1} net officer-days the state has this week — but capacity is pooled by division, so a statewide share is a floor on the difficulty, not a plan.':
    'या आठवड्यात राज्याकडे असलेल्या {1} निव्वळ अधिकारी-दिवसांच्या {0}% — पण क्षमता विभागनिहाय संचबद्ध आहे, त्यामुळे राज्यव्यापी वाटा हा अडचणीची किमान मर्यादा आहे, आराखडा नव्हे.',
  'The establishment reports no net officer-days this week, so no share can be stated.':
    'आस्थापना या आठवड्यात कोणतेही निव्वळ अधिकारी-दिवस नोंदवत नाही, त्यामुळे कोणताही वाटा सांगता येत नाही.',
  'Protected by taking them': 'ती घेतल्याने वाचणारे',
  'The reachable actions only, and only what they protect within seven days. This is the funnel’s last step, not a separate estimate.':
    'केवळ पोहोचता येणाऱ्या कृती, आणि केवळ त्या सात दिवसांत जे वाचवतात ते. हा गाळणी टप्प्यांतील शेवटचा टप्पा आहे, स्वतंत्र अंदाज नव्हे.',
  'Blocked for want of an officer': 'अधिकाऱ्याअभावी अडलेले',
  'Correctly ranked, and unworkable. This is a deployment decision, not a scheduling one.':
    'क्रम बरोबर, पण हाताळता येत नाही. हा नियुक्तीचा निर्णय आहे, नियोजनाचा नव्हे.',
  '{0} of these {1} actions carry no officer-day estimate. The priority engine prices effort only for taxpayers with a triggered rule and non-zero exposure, so the cost of those cases is left unstated rather than filled with an average — the officer-day total above is therefore a lower bound.':
    'या {1} कृतींपैकी {0} कृतींसाठी अधिकारी-दिवसांचा अंदाज नाही. प्राधान्य यंत्रणा केवळ ज्यांच्यावर नियम लागू झाला आहे आणि जोखीम रक्कम शून्य नाही अशाच करदात्यांसाठी श्रमाचे मूल्य ठरवते, त्यामुळे त्या प्रकरणांची किंमत सरासरीने भरून काढण्याऐवजी नमूद केलेलीच नाही — म्हणून वरील अधिकारी-दिवसांची बेरीज ही किमान मर्यादा आहे.',
  '{0} officer-days': '{0} अधिकारी-दिवस',
  'Effort not priced': 'श्रमाचे मूल्य ठरवलेले नाही',
  '{0}% of the {1} case': '{1} प्रकरणाच्या {0}%',
  'case value not stated': 'प्रकरणाचे मूल्य नमूद नाही',

  /* == Shared small units =============================================== */
  '{0}%': '{0}%',
  '₹{0} Cr': '₹{0} कोटी',
  '₹{0} L': '₹{0} लाख',

  /* Constant-declared limitation band labels passed to t(variable). */
  'Within 90 days': '90 दिवसांत',
  'Within 180 days': '180 दिवसांत',

  /* == Short lines — reasoning behind the disclosure ============================ */
  'Ordered by what needs a decision today, not by what displays easily.':
    'आज कशावर निर्णय हवा त्यानुसार क्रम, काय सहज दाखवता येते त्यानुसार नव्हे.',
  'Official dealer figures, against what this demonstration models.':
    'अधिकृत व्यापारी आकडे, या प्रात्यक्षिकाच्या प्रारूपित संख्येच्या तुलनेत.',
  'Each figure is read from the engine that owns the question.':
    'प्रत्येक आकडा ज्या यंत्राकडे तो प्रश्न आहे त्याच्याकडून वाचला जातो.',
  'Establishment, allocation and residual are read from the capacity engine.':
    'स्थापना, वाटप आणि शिल्लक हे क्षमता यंत्रातून वाचले जातात.',
  'Weighted composite across six indicators, with the largest drag named.':
    'सहा निर्देशकांवरील भारित संयुक्त गुण, सर्वात मोठा अडसर नावासह.',
  'Risk rank is not work order — the statutory clock decides.':
    'जोखीम क्रमांक म्हणजे कामाचा क्रम नव्हे — सांविधिक घड्याळ ठरवते.',

  /* == Revenue protection — short lines ============================ */
  'What is about to be lost, what can still be protected, and what to do.':
    'काय गमावले जाणार आहे, काय अजून वाचवता येते, आणि काय करायचे.',
  'Assessed exposure against the deadline — not the recoverable headline.':
    'मुदतीच्या तुलनेत निर्धारित जोखीम रक्कम — वरील वसूलपात्र आकडा नव्हे.',
  'Three reasons, three different remedies — they are not conflated.':
    'तीन कारणे, तीन वेगळे उपाय — त्यांची गल्लत केलेली नाही.',
  'Computed best-density-first on the cases actually left, not an average.':
    'प्रत्यक्षात उरलेल्या प्रकरणांवर सर्वाधिक घनतेनुसार मोजलेले, सरासरी नव्हे.',
  'Effort is priced only where a rule fired and exposure is non-zero.':
    'नियम लागू झाला असेल आणि जोखीम रक्कम शून्येतर असेल तिथेच श्रमाची किंमत ठरते.',

  /* == Navigation section labels ============================ */
  'Revenue Position':
    'महसूल स्थिती',
  'Statutory Time & Decay':
    'सांविधिक मुदत व क्षय',
  'Work Allocation':
    'कामाचे वाटप',
  'Casework':
    'प्रकरण हाताळणी',
  'Data & Governance':
    'डेटा व कारभार',
  /* == Command Centre — bands, and where each queue is worked ============ */
  Decide: 'ठरवा',
  Act: 'कृती',
  Position: 'स्थिती',
  'Where these are worked': 'ही कोठे हाताळली जातात',
  'Each queue is held and actioned on its own screen, with the count that matters there':
    'प्रत्येक रांग तिच्या स्वतःच्या पडद्यावर ठेवली व हाताळली जाते, तेथे महत्त्वाची असणाऱ्या संख्येसह',
  '₹{0} Cr high-risk exposure': '₹{0} कोटी उच्च-जोखीम रक्कम',
  '{0} under review': 'पुनर्विलोकनाधीन {0}',
  '₹{0} Cr in pipeline': 'प्रक्रियेत ₹{0} कोटी',
  '{0} open alerts': '{0} खुल्या सूचना',
  '{0} unworkable cases, from three different causes with three different remedies.':
    'हाताळता न येणारी {0} प्रकरणे — तीन वेगळी कारणे, तीन वेगळे उपाय.',
  "Generate an executive brief to synthesise the state's current revenue and risk position, with evidence and confidence stated for every finding.":
    'राज्याची सध्याची महसूल व जोखीम स्थिती एकत्र मांडणारा कार्यकारी सारांश तयार करा — प्रत्येक निष्कर्षासोबत पुरावा व विश्वासपातळी नमूद केलेली.',

  /* == Revenue Protection — one line on screen, the reasoning behind it == */
  'Excluded from the figure above, and stated beside it.':
    'वरील आकड्यातून वगळलेले, आणि त्याच्या शेजारी स्वतंत्रपणे नमूद केलेले.',
  'Four steps, three causes, three owners — not netted into one rate.':
    'चार टप्पे, तीन कारणे, तीन जबाबदार — एकाच दरात एकत्र केलेले नाहीत.',
  'Counted against the binding date, not the order deadline.':
    'बंधनकारक तारखेच्या तुलनेत मोजलेले, आदेशाच्या अंतिम मुदतीच्या नव्हे.',
  'Value at risk by division, and the share no officer can reach.':
    'विभागनिहाय जोखमीतील रक्कम, आणि जिच्यापर्यंत एकही अधिकारी पोहोचू शकत नाही असा हिस्सा.',
  'Left visibly empty rather than filled with plausible figures.':
    'सयुक्तिक वाटणाऱ्या आकड्यांनी भरण्याऐवजी उघडपणे रिकामे ठेवलेले.'
})
