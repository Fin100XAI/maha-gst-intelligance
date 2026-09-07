import { registerMessages } from '../../locale.js'

/**
 * Marathi — sentences the data layer builds at run time.
 *
 * Every entry here was, until recently, an interpolated template literal in
 * src/data. A computed sentence can never match a catalogue key, so it reached
 * an officer in English on a screen set to Marathi — and it did so invisibly:
 * coverage.mjs saw no t() call to score, prose.mjs saw no constant to look up,
 * and untranslated.mjs saw a value that had passed through t(). Only the
 * browser caught them. scripts/templates.mjs now fails the build on any new one.
 *
 * The {0} arguments are numbers, dates, financial years and section labels —
 * they arrive already formatted and are not re-ordered here, because the data
 * layer passes them positionally.
 */
registerMessages('mr', {
  /* == Command board — condition detail ================================= */
  'Departmental capacity is only {0}% used, but an unused officer-day in one division cannot be spent in another and an audit officer cannot take an investigation case. {1} of them have no eligible officer posted at all.':
    'विभागीय क्षमतेपैकी केवळ {0}% वापरली गेली आहे, पण एका विभागातील न वापरलेला अधिकारी-दिवस दुसऱ्या विभागात खर्च करता येत नाही आणि लेखापरीक्षण अधिकारी तपासाचे प्रकरण घेऊ शकत नाही. त्यांपैकी {1} प्रकरणांना एकही पात्र अधिकारी नियुक्तच नाही.',
  'Value decays continuously while a case sits unworked. This is the controllable half of the lag — the other {0} Cr is detection latency, which no amount of prioritisation shortens.':
    'प्रकरणावर काम होत नसताना मूल्याचा क्षय सतत होत राहतो. हा विलंबाचा नियंत्रणयोग्य अर्धा भाग आहे — उरलेले {0} कोटी हा शोध विलंब असून तो कितीही प्राधान्यक्रम लावला तरी कमी होत नाही.',
  '{0}. If the notifications fall, the extended deadline never existed and any order passed under it was void when made — including demand already collected.':
    '{0}. अधिसूचना रद्द ठरल्यास वाढीव मुदत मुळात अस्तित्वातच नव्हती आणि तिच्या आधारे काढलेला कोणताही आदेश काढतानाच निष्प्रभ होता — आधीच वसूल केलेल्या मागणीसह.',
  '{0} audits were closed with rules still live and {1} taxpayers never received a notice despite them. Only {2} carry a confirmed live limitation clock, so this is a review list rather than a recovery figure.':
    'नियम अद्याप कार्यरत असतानाच {0} लेखापरीक्षणे बंद करण्यात आली आणि ते असूनही {1} करदात्यांना कधीही नोटीस मिळाली नाही. केवळ {2} प्रकरणांवर निश्चित जिवंत परिसीमा घड्याळ आहे, त्यामुळे ही वसुलीची आकडेवारी नसून पुनर्विलोकनाची यादी आहे.',

  /* == Case digital twin — next action ================================== */
  'Issue {0} before {1}': '{1} पूर्वी {0} बजावा',
  '{0} days remain on the {1} clock. After that the demand is extinguished by operation of law.':
    '{1} घड्याळावर {0} दिवस शिल्लक आहेत. त्यानंतर कायद्याच्या अंमलानेच मागणी संपुष्टात येते.',
  'The {0} deadline of {1} has passed. No demand can now be raised for this period.':
    '{1} ही {0} ची मुदत उलटून गेली आहे. या कालावधीसाठी आता कोणतीही मागणी उभी करता येणार नाही.',
  '₹{0} L of recoverable value is forecast to decay if this case is untouched for another seven days.':
    'हे प्रकरण आणखी सात दिवस हाताळले नाही, तर ₹{0} लाख वसूलपात्र मूल्याचा क्षय होण्याचा अंदाज आहे.',

  /* == Statutory clock — how the deadline was computed ================== */
  '{0} years from the annual-return due date for {1} ({2}).':
    '{1} साठीच्या वार्षिक विवरण देय तारखेपासून ({2}) {0} वर्षे.',
  'Extended to {0} by notification, in place of the base {1}-year computation.':
    'मूळ {1}-वर्षांच्या गणनेऐवजी अधिसूचनेद्वारे {0} पर्यंत वाढवलेली.',
  'Notice must issue at least {0} months before the order deadline.':
    'आदेशाच्या मुदतीच्या किमान {0} महिने आधी नोटीस बजावली गेली पाहिजे.',
  'Computed from the statute and the annual return due date for {0} under {1}. Date arithmetic, not a model.':
    '{1} अंतर्गत {0} साठीच्या कायद्यावरून आणि वार्षिक विवरण देय तारखेवरून मोजलेली. हे तारखांचे अंकगणित आहे, प्रारूप नव्हे.',

  /* == Priority queue — why a case moved ================================ */
  'Priority {0} — unchanged from its risk-score rank.':
    'प्राधान्य {0} — त्याच्या जोखीम-गुण क्रमांकाइतकेच, बदल नाही.',
  'Moved {0} from risk rank {1} to priority {2} on the combined weighting of exposure, recoverability and effort.':
    'जोखीम रक्कम, वसुलीची शक्यता आणि श्रम यांच्या एकत्रित भारानुसार जोखीम क्रमांक {1} वरून प्राधान्य {2} पर्यंत {0} सरकले.',
  'Moved {0} from risk rank {1} to priority {2} because {3}.':
    '{3}, त्यामुळे जोखीम क्रमांक {1} वरून प्राधान्य {2} पर्यंत {0} सरकले.',

  /* == Retrospective ==================================================== */
  'Identifying Section 73 cases that resemble Section 74 cases requires Section 74 cases to resemble. The register contains {0}. A resemblance model built on a single positive example is not weak — it is undefined, because there is no variation from which to learn what the pattern is.':
    'Section 74 सारखी दिसणारी Section 73 प्रकरणे ओळखायची असतील, तर ज्यांच्यासारखी दिसतील अशी Section 74 प्रकरणे असावी लागतात. नोंदवहीत {0} आहेत. एकाच होकारार्थी उदाहरणावर उभे केलेले साम्य-प्रारूप दुर्बल नसते — ते अपरिभाषित असते, कारण नमुना काय आहे हे शिकण्यासारखी कोणतीही विविधताच नसते.',
  'The case waited {0} days in the queue after the signal appeared.':
    'संकेत दिसल्यानंतर प्रकरण {0} दिवस रांगेत वाट पाहत राहिले.',

  /* == AI Copilot — output headings ===================================== */
  'AI Case Summary — {0}': 'AI प्रकरण सारांश — {0}',
  'AI-Generated Audit Checklist — {0}': 'AI-निर्मित लेखापरीक्षण तपासयादी — {0}',
  'AI-Drafted {0} — {1}': 'AI-मसुदा {0} — {1}',
  'AI-Generated Refund Verification Checklist — {0}':
    'AI-निर्मित परतावा पडताळणी तपासयादी — {0}',
  'AI Litigation Risk Summary — {0}': 'AI न्यायालयीन जोखीम सारांश — {0}',
  'AI-Generated Taxpayer Outreach — {0}': 'AI-निर्मित करदाता संपर्क — {0}',
  'AI Similar Case Comparison — {0}': 'AI समान प्रकरण तुलना — {0}',
  'AI-Suggested Hearing Questions — {0}': 'AI-सुचवलेले सुनावणी प्रश्न — {0}',
  'Dear Taxpayer ({0}), our records indicate {1} for a recent return period. To avoid interest, late fee or further scrutiny, please review and file/correct your returns at the earliest. This is a system-generated compliance reminder and not a notice or demand.':
    'आदरणीय करदाता ({0}), आमच्या नोंदींनुसार अलीकडील विवरण कालावधीसाठी {1} आढळून आले आहे. व्याज, विलंब शुल्क किंवा पुढील छाननी टाळण्यासाठी कृपया आपली विवरणपत्रे लवकरात लवकर तपासा आणि दाखल करा किंवा दुरुस्त करा. हे प्रणालीने तयार केलेले अनुपालन स्मरणपत्र आहे — नोटीस किंवा मागणी नव्हे.',

  /* Command board — value label. */
  unrecoverable: 'वसूल न होणारे',

  /* == Top actions — what protects value this week ====================== */
  'Issue notice before {0}': '{0} पूर्वी नोटीस बजावा',
  '{0} days remain under {1}. After that the demand is extinguished by operation of law and the full amount is lost.':
    '{1} अंतर्गत {0} दिवस शिल्लक आहेत. त्यानंतर कायद्याच्या अंमलानेच मागणी संपुष्टात येते आणि संपूर्ण रक्कम गमावली जाते.',
  'This is the value forecast to become unrecoverable if the case is untouched for a further seven days. The rest of the exposure is not at risk this week.':
    'हे प्रकरण आणखी सात दिवस हाताळले नाही, तर वसूल न होणारे ठरण्याचा अंदाज असलेले हे मूल्य आहे. उर्वरित जोखीम रक्कम या आठवड्यात धोक्यात नाही.',
  'Act on chain {0}': 'साखळी {0} वर कारवाई करा',
  'Credit in this chain remains blockable, and this is the share of it forecast to be utilised over the next seven days. The chain is {0} days old, so the curve here is flatter than it would be on a fresh signal.':
    'या साखळीतील श्रेय अजून रोखता येण्याजोगे आहे, आणि पुढील सात दिवसांत त्यातील जितका भाग वापरला जाण्याचा अंदाज आहे तो हा. साखळी {0} दिवसांची असल्याने इथला वक्र ताज्या संकेतापेक्षा अधिक सपाट आहे.',
  'Schedule before {0}': '{0} पूर्वी नियोजन करा',
  '{0} days remain, so nothing is lost by not working it this week — but it must not slip past the window.':
    '{0} दिवस शिल्लक आहेत, त्यामुळे या आठवड्यात काम न केल्याने काहीही गमावले जात नाही — पण ते कालपटाबाहेर जाता कामा नये.',

  /* == Capacity residual — why a case could not be placed ================ */
  'Neither a deployment nor a volume problem. The case needs more than {0} days and is indivisible, so it can never be placed inside a one-week horizon however many officers are added. Requires a multi-week block or a two-officer team.':
    'ही ना तैनातीची समस्या आहे, ना कामाच्या प्रमाणाची. प्रकरणाला {0} दिवसांहून अधिक वेळ लागतो आणि ते विभागता येत नाही, त्यामुळे कितीही अधिकारी वाढवले तरी ते एका आठवड्याच्या कालपटात बसवताच येत नाही. यासाठी अनेक आठवड्यांचा गाळा किंवा दोन अधिकाऱ्यांचे पथक लागते.',

  /* == Precedent — the standing of the question ========================== */
  'Settled by {0}, which binds authorities in Maharashtra.':
    '{0} यांनी निकाली काढलेले, आणि ते महाराष्ट्रातील प्राधिकरणांवर बंधनकारक आहे.',

  /* == Closed vocabularies — signal-age and refund-intensity bands ======= */
  '0–30 days': '0–30 दिवस',
  '31–90 days': '31–90 दिवस',
  '91–180 days': '91–180 दिवस',
  '181–365 days': '181–365 दिवस',
  '1–2× benchmark': 'मानकाच्या 1–2×',
  '2–3× benchmark': 'मानकाच्या 2–3×',
  '3× benchmark and above': 'मानकाच्या 3× आणि त्यावर',

  /* Forecast marker on a month axis. */
  '{0} (F)': '{0} (अं)',

  /* Provenance line appended to every copied briefing note. */
  '— Simulated export from Maha GST Intelligence (demonstration environment). All figures are generated demonstration data as at {0}; they are not departmental records. Verify against the source system before circulation.':
    '— महा GST इंटेलिजन्स (प्रात्यक्षिक वातावरण) येथून नक्कल केलेला निर्यात. सर्व आकडे {0} रोजीची तयार केलेली प्रात्यक्षिक माहिती आहेत; ते विभागीय अभिलेख नाहीत. वितरणापूर्वी स्रोत प्रणालीशी पडताळून पहा.',

  /* == Recommendations and notes declared beside the data they describe === */
  'Counted whether live or expired: if the notification falls, orders already passed under it were void when made.':
    'जिवंत असो वा मुदतबाह्य — दोन्ही मोजले आहेत: अधिसूचना रद्द ठरल्यास, तिच्या आधारे आधीच काढलेले आदेश काढतानाच निष्प्रभ होते.',
  'Cross-check the consignment record against the filed return for the same period before scrutiny is opened.':
    'छाननी सुरू करण्यापूर्वी त्याच कालावधीच्या दाखल विवरणाशी खेप नोंद ताडून पहा.',
  'Reconcile the claimed credit against GSTR-2B for the trailing six periods before any further set-off is allowed.':
    'पुढील कोणतीही वजावट मंजूर करण्यापूर्वी मागील सहा कालावधींच्या GSTR-2B शी दावा केलेल्या श्रेयाचा ताळमेळ घ्या.',

  /* == Comparability engine — why two cases are or are not alike ========= */
  'Both turn on {0}': 'दोन्ही {0} यावर अवलंबून आहेत',
  'Different questions of law — {0} against {1}':
    'वेगवेगळे विधिप्रश्न — {0} विरुद्ध {1}',
  'Department position on both recorded as "{0}"':
    'दोन्हींवर विभागाची भूमिका "{0}" अशी नोंदवली आहे',
  'Department position differs — "{0}" against "{1}"':
    'विभागाची भूमिका भिन्न आहे — "{0}" विरुद्ध "{1}"',
  'Shared risk rules: {0}': 'समान जोखीम नियम: {0}',
  'The comparison case also triggered: {0}':
    'तुलनेतील प्रकरणात याही नियमांनी प्रतिसाद दिला: {0}',
  'Comparable ITC intensity — {0}% against {1}% of turnover':
    'तुलनीय ITC तीव्रता — उलाढालीचे {0}% विरुद्ध {1}%',
  'ITC intensity differs materially — {0}% against {1}%':
    'ITC तीव्रतेत लक्षणीय फरक — {0}% विरुद्ध {1}%',
  'Both in {0} — noted, but sector does not decide outcomes':
    'दोन्ही {0} मध्ये — नोंद घेतली, पण क्षेत्र निकाल ठरवत नाही',

  /* == Bands, evidence lines and statutory notes declared as constants == */
  '1 April 2025':
    '1 एप्रिल 2025',
  '10 concluded outcomes across 7 questions of law — no question reaches 5.':
    '7 विधिप्रश्नांवर मिळून 10 निकाली निष्पत्ती — एकही प्रश्न 5 पर्यंत पोहोचत नाही.',
  '10 concluded proceedings. Enough to retrieve comparables, nowhere near enough to learn from.':
    '10 निकाली कार्यवाही. तुलनीय प्रकरणे काढण्यापुरती पुरेशी, पण त्यांतून शिकण्यासाठी कितीतरी कमी.',
  '3.5 days':
    '3.5 दिवस',
  '5.0 days':
    '5.0 दिवस',
  '30 days or fewer':
    '30 किंवा त्याहून कमी दिवस',
  '31 to 60 days':
    '31 ते 60 दिवस',
  '61 to 90 days':
    '61 ते 90 दिवस',
  '365+ days':
    '365+ दिवस',
  '90 – 365 days':
    '90 – 365 दिवस',
  '42 months from the annual-return due date for the notice; 12 months from the notice for the order (extendable by 6 months on approval).':
    'नोटिशीसाठी वार्षिक विवरण देय तारखेपासून 42 महिने; आदेशासाठी नोटिशीपासून 12 महिने (मंजुरीने 6 महिने वाढवता येणारे).',
  '56 candidates, 2 closed with signals live and 54 never actioned.':
    '56 उमेदवार, त्यांपैकी 2 संकेत जिवंत असतानाच बंद आणि 54 वर कधीही कारवाई झाली नाही.',
  '58% of departmental capacity is used while 51 cases worth Rs 18.78 Cr cannot be reached — the finding aggregate utilisation hides.':
    'विभागीय क्षमतेपैकी 58% वापरली जाते, तरी 18.78 कोटी रुपयांची 51 प्रकरणे गाठता येत नाहीत — एकत्रित वापर जो निष्कर्ष लपवतो तो हा.',
  '8 proceedings past their deadline at Rs 10.84 Cr; the verdict now propagates into the audit queue, where 7 open cases sat on dead periods.':
    '10.84 कोटी रुपयांच्या 8 कार्यवाही मुदत ओलांडून गेल्या; हा निष्कर्ष आता लेखापरीक्षण रांगेतही पोहोचतो, जिथे 7 प्रलंबित प्रकरणे मुदतबाह्य कालावधींवर बसली होती.',
  '73, 74, 74A, or the relevant provision.':
    '73, 74, 74A, किंवा लागू असलेली तरतूद.',

  /* == Case digital twin — timeline entries and the statutory verdict === */
  '{0} registered in {1}':
    '{1} मध्ये {0} नोंदणीकृत',
  '{0} issued':
    '{0} जारी केली',
  'Status: {0}':
    'स्थिती: {0}',
  '{0} — stage {1}':
    '{0} — टप्पा {1}',
  '{0} deadline — {1}':
    '{0} मुदत — {1}',
  'The {0} deadline of {1} for {2} under {3} passed {4} days ago. No demand can now be raised for this period.':
    '{2} साठी {3} अंतर्गत असलेली {1} ही {0} ची मुदत {4} दिवसांपूर्वी उलटून गेली. या कालावधीसाठी आता कोणतीही मागणी उभी करता येणार नाही.',
  '{0} days remain to the {1} deadline of {2} for {3} under {4}.':
    '{3} साठी {4} अंतर्गत असलेल्या {2} या {1} मुदतीला {0} दिवस शिल्लक आहेत.',

  /* == Comparability engine — whether a rate may be stated at all ======= */
  '{0} of {1} concluded proceedings on the same question of law were confirmed in the department\'s favour.':
    'त्याच विधिप्रश्नावरील {1} निकाली कार्यवाहींपैकी {0} विभागाच्या बाजूने कायम झाल्या.',
  '{0} comparable proceedings found, of which {1} turn on the same question of law. Each outcome is shown individually and no rate is stated: a rate may only be computed across cases sharing the question that decides them, and {2} are needed before it means anything. A figure drawn from cases turning on different questions would read as evidence about this case and would not be.':
    '{0} तुलनीय कार्यवाही आढळल्या, त्यांपैकी {1} त्याच विधिप्रश्नावर अवलंबून आहेत. प्रत्येक निकाल स्वतंत्रपणे दाखवला आहे आणि कोणताही दर सांगितलेला नाही: दर केवळ ज्या प्रश्नाने निकाल ठरतो तोच प्रश्न सामायिक असलेल्या प्रकरणांवर मोजता येतो, आणि त्याला अर्थ येण्यासाठी {2} प्रकरणे लागतात. वेगवेगळ्या प्रश्नांवर अवलंबून असलेल्या प्रकरणांतून काढलेला आकडा या प्रकरणाविषयीचा पुरावा असल्यासारखा वाचला जाईल, आणि तो तसा नसेल.',

  /* == Column label and published figures carrying an Indian unit ======= */
  'Worst pool demand / supply': 'सर्वाधिक ताण असलेल्या गटाची मागणी / पुरवठा',
  '₹22.08 lakh Cr': '₹22.08 लाख कोटी',
  '₹17.4 lakh Cr': '₹17.4 लाख कोटी'
})
