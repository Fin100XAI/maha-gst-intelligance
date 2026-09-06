import { registerMessages } from '../../locale.js'

/**
 * Marathi — Statutory Time Intelligence and the Revenue Protection Command Centre.
 *
 * Vocabulary follows mahagst.gov.in where the department publishes a term
 * (विभाग, आयुक्त, करदाता, नोंदणी, विवरणपत्र) and standard Marathi legal usage
 * elsewhere:
 *   limitation / time limit → मुदत
 *   time-barred             → मुदतबाह्य
 *   proceeding              → कार्यवाही
 *   demand                  → मागणी
 *   notice                  → नोटीस
 *   order                   → आदेश
 *   ultra vires             → अधिकारातीत
 *
 * Section numbers, notification numbers and GST abbreviations stay in Latin
 * script, matching the department's own practice with e-Return and e-Payment.
 */
registerMessages('mr', {
  /* == Statutory Time Intelligence ======================================== */
  'Leadership · Statutory Risk': 'नेतृत्व · सांविधिक जोखीम',
  'Every open proceeding against its own limitation clock. When a deadline passes the demand is extinguished by operation of law — this is the one exposure on the platform that is not a model but a consequence of statute.':
    'प्रत्येक प्रलंबित कार्यवाही, तिच्या स्वतःच्या मुदतीच्या सापेक्ष. मुदत संपल्यावर मागणी कायद्याने आपोआप संपुष्टात येते — या मंचावरील हा एकमेव धोका आहे जो प्रारूपाचा नसून कायद्याचा परिणाम आहे.',
  'Why this leads': 'हे सर्वात आधी का',
  'A risk score can be argued with. A limitation date cannot.':
    'जोखीम गुणांकावर वाद घालता येतो. मुदतीच्या तारखेवर नाही.',
  'Revenue lost to limitation is irreversible, unarguable, and attributable to a named officer and date. Of the proceedings in view, ₹{0} Cr has already passed its deadline and ₹{1} Cr expires within thirty days.':
    'मुदत संपल्याने गमावलेला महसूल अपरिवर्तनीय आणि निर्विवाद असतो, आणि तो विशिष्ट अधिकारी व तारखेशी जोडलेला असतो. दृश्यमान कार्यवाहींपैकी ₹{0} कोटींची मुदत आधीच संपली आहे आणि ₹{1} कोटींची मुदत तीस दिवसांत संपत आहे.',
  'Already time-barred': 'आधीच मुदतबाह्य',
  'Expiring within 30 days': '30 दिवसांत मुदत संपणारे',
  'Expiring within 90 days': '90 दिवसांत मुदत संपणारे',
  'Live exposure in time': 'मुदतीत असलेली जोखीम रक्कम',
  '₹ Cr': '₹ कोटी',
  '{0} proceeding(s) rest on a contested extension.': '{0} कार्यवाही वादग्रस्त मुदतवाढीवर आधारित आहे.',
  'Their deadline depends on Notification 56/2023-CT, which the Gauhati High Court has held ultra vires Section 168A. A demand relying on it carries live litigation risk and should be reviewed with the Legal Cell before action.':
    'त्यांची मुदत अधिसूचना 56/2023-CT वर अवलंबून आहे, जी गुवाहाटी उच्च न्यायालयाने कलम 168A च्या अधिकारातीत ठरवली आहे. तिच्यावर आधारित मागणीत जिवंत वादाचा धोका आहे आणि कारवाईपूर्वी विधी कक्षासोबत तिची तपासणी करावी.',
  'Limitation register': 'मुदत नोंदवही',
  'Ranked by how soon the binding deadline falls. Where no notice has issued the notice deadline binds — it falls months before the order deadline and is the one most often missed.':
    'बंधनकारक मुदत किती लवकर येते त्या क्रमाने. जिथे नोटीस दिलेली नाही तिथे नोटिसीची मुदत बंधनकारक असते — ती आदेशाच्या मुदतीच्या कित्येक महिने आधी येते आणि तीच बहुतेकदा चुकते.',
  'Search the register...': 'नोंदवहीत शोधा...',
  'Computed from statute — verify against the case record before acting':
    'कायद्यावरून परिगणित — कारवाईपूर्वी प्रकरण नोंदीशी पडताळून पहा',
  'Formation exposure': 'रचनानिहाय जोखीम रक्कम',
  'Which divisions carry the nearest deadlines': 'कोणत्या विभागांच्या मुदती सर्वात जवळ आहेत',
  '{0} proceedings · ₹{1} Cr exposed': '{0} कार्यवाही · ₹{1} कोटी जोखमीत',
  '{0} critical': '{0} अत्यंत गंभीर',
  Nearest: 'सर्वात जवळची',
  'Statutory basis': 'सांविधिक आधार',
  'The rules this register computes from': 'ही नोंदवही ज्या नियमांवरून परिगणित होते',
  Contested: 'वादग्रस्त',
  'Basis for this deadline': 'या मुदतीचा आधार',
  'Tax period': 'कर कालावधी',
  'Tax period / Section': 'कर कालावधी / कलम',
  'Section invoked': 'लागू कलम',
  'Annual return due': 'वार्षिक विवरणपत्र देय',
  'Notice deadline': 'नोटीस मुदत',
  'Order deadline': 'आदेश मुदत',
  'Binding deadline': 'बंधनकारक मुदत',
  'Currently binding': 'सध्या बंधनकारक',
  'How this date is computed': 'ही तारीख कशी परिगणित होते',
  Authority: 'प्राधिकरण',
  'This deadline depends on a notification held ultra vires by the Gauhati High Court. Review with the Legal Cell before relying on it.':
    'ही मुदत गुवाहाटी उच्च न्यायालयाने अधिकारातीत ठरवलेल्या अधिसूचनेवर अवलंबून आहे. तिच्यावर विसंबण्यापूर्वी विधी कक्षासोबत तपासणी करा.',
  deadline: 'मुदत',
  'Time left': 'उरलेला वेळ',
  Expired: 'मुदत संपली',
  'Revenue exposed': 'जोखमीतील महसूल',
  'Responsible officer': 'जबाबदार अधिकारी',
  Formation: 'रचना',
  Basis: 'आधार',
  Check: 'तपासणी',

  /* == Revenue Protection Command Centre ================================== */
  'Leadership · Revenue Protection': 'नेतृत्व · महसूल संरक्षण',
  'What the department is about to lose, what can still be protected, and which actions this week protect the most. Every figure is computed by the engine that owns it — nothing on this screen is illustrative.':
    'विभाग काय गमावणार आहे, अजूनही काय वाचवता येईल, आणि या आठवड्यात कोणत्या कृती सर्वाधिक वाचवतात. प्रत्येक आकडा ज्या इंजिनाचा तो आहे त्यानेच परिगणित केला आहे — या पडद्यावरील काहीही केवळ उदाहरणादाखल नाही.',
  'Revenue Protection Opportunity': 'महसूल संरक्षण संधी',
  'across {0} cases · each counted once, however many mechanisms flag it':
    '{0} प्रकरणांमध्ये · प्रत्येक एकदाच मोजले, कितीही यंत्रणांनी ते चिन्हांकित केले तरी',
  'at-risk cases': 'जोखमीतील प्रकरणे',
  'Within 30 days': '30 दिवसांच्या आत',
  '{0} cases': '{0} प्रकरणे',
  'Decays this week': 'या आठवड्यात घटणारे',
  'if untouched': 'हात न लावल्यास',
  Unreachable: 'पोहोचता न येणारे',
  'no officer available': 'कोणताही अधिकारी उपलब्ध नाही',
  'Legal review': 'विधी तपासणी',
  '{0} across {1} cases is already beyond its limitation date.':
    '{1} प्रकरणांतील {0} ची मुदत आधीच संपली आहे.',
  'Excluded from the figure above, and stated beside it. Money that is gone cannot be counted as an opportunity to protect it — and the size of this number, not the size of the opportunity, is the argument for acting earlier.':
    'वरील आकड्यातून वगळलेले, आणि त्याच्या शेजारी स्वतंत्रपणे नमूद केलेले. गेलेला पैसा वाचवण्याची संधी म्हणून मोजता येत नाही — आणि लवकर कारवाईचा युक्तिवाद या संख्येच्या आकारातून येतो, संधीच्या आकारातून नाही.',
  'Where the money goes between owed and protected': 'देय आणि संरक्षित यांदरम्यान पैसा कुठे जातो',
  'Four steps, three different causes, three different owners. They are not netted into one recovery rate because they call for three different decisions.':
    'चार टप्पे, तीन वेगळी कारणे, तीन वेगळे जबाबदार. त्यांना एकाच वसुली दरात एकत्र केलेले नाही कारण ते तीन वेगळे निर्णय मागतात.',
  'Revenue at risk over time': 'कालानुरूप जोखमीतील महसूल',
  'What survives, and what is gone, if nothing is done.': 'काहीच न केल्यास काय टिकते आणि काय जाते.',
  'Still recoverable': 'अजूनही वसूलपात्र',
  'Lost — cumulative': 'हानी — संचयी',
  '{0} left': '{0} शिल्लक',
  'Two clocks, two responses': 'दोन घड्याळे, दोन प्रतिसाद',
  'Split of the 180-day loss.': '180 दिवसांतील हानीची विभागणी.',
  'Cliff — limitation expiry': 'कडा — मुदत समाप्ती',
  'Worth full value the day before, nothing the day after. Needs a notice issued.':
    'आदल्या दिवशी पूर्ण मूल्य, दुसऱ्या दिवशी शून्य. यासाठी नोटीस देणे आवश्यक.',
  'Slope — downstream utilisation': 'उतार — पुढील टप्प्यातील वापर',
  'Erodes continuously while the case waits. Needs the case opened sooner.':
    'प्रकरण प्रतीक्षेत असताना सतत घटत जाते. यासाठी प्रकरण लवकर उघडणे आवश्यक.',
  'Why this is not the sum of the modules': 'हा घटकांची बेरीज का नाही',
  'The same rupee is flagged by more than one engine. Adding the mechanism totals would overstate the position by {0}.':
    'एकच रुपया एकापेक्षा अधिक इंजिनांकडून चिन्हांकित होतो. यंत्रणांच्या बेरजा जोडल्यास स्थिती {0} ने जास्त दिसेल.',
  'Sum of the mechanisms': 'यंत्रणांची बेरीज',
  'What a dashboard adding its own tiles would print.': 'स्वतःच्याच चौकटी जोडणारा डॅशबोर्ड हेच छापेल.',
  'Deduplicated union': 'पुनरावृत्तीरहित एकत्रीकरण',
  'Each taxpayer once, whatever flags it.': 'प्रत्येक करदाता एकदाच, त्याला काहीही चिन्हांकित करो.',
  'Double-count avoided': 'दुहेरी मोजणी टाळली',
  '{0}× overlap · {1} of {2} cases carry more than one mechanism':
    '{0}× आच्छादन · {2} पैकी {1} प्रकरणांत एकापेक्षा अधिक यंत्रणा',
  'Where it is concentrated': 'हे कुठे केंद्रित आहे',
  'Value at risk by division, with the share no eligible officer can reach. The second bar is the deployment decision.':
    'विभागनिहाय जोखमीतील मूल्य, आणि ज्यापर्यंत कोणताही पात्र अधिकारी पोहोचू शकत नाही तो वाटा. दुसरी पट्टी हा नियुक्तीचा निर्णय आहे.',
  '{0} cases · {1}% unreachable': '{0} प्रकरणे · {1}% पोहोचता न येणारी',
  'Value at risk': 'जोखमीतील मूल्य',
  'Share no eligible officer can reach': 'ज्यापर्यंत कोणताही पात्र अधिकारी पोहोचू शकत नाही तो वाटा',
  '{0} cases worth {1} require a legal view before any order issues':
    '{1} मूल्याच्या {0} प्रकरणांत कोणताही आदेश देण्यापूर्वी विधी अभिप्राय आवश्यक',
  'Top actions this week, by revenue protected': 'या आठवड्यातील प्रमुख कृती, संरक्षित महसुलाच्या क्रमाने',
  'Ranked by what the action protects over the next seven days — not by the size of the case.':
    'पुढील सात दिवसांत कृती जे वाचवते त्या क्रमाने — प्रकरणाच्या आकाराच्या क्रमाने नाही.',
  '{0} of these {1} actions cannot be taken this week.': 'या {1} कृतींपैकी {0} या आठवड्यात करता येणार नाहीत.',
  'No eligible officer in that division has capacity, or none is posted. The ranking is still correct; what is missing is somebody to act on it, which is a deployment decision rather than a scheduling one.':
    'त्या विभागातील कोणत्याही पात्र अधिकाऱ्याकडे क्षमता नाही, किंवा कोणी नियुक्तच नाही. क्रम अजूनही बरोबर आहे; जे नाही ते म्हणजे त्यावर कारवाई करणारी व्यक्ती, आणि हा नियोजनाचा नव्हे तर नियुक्तीचा निर्णय आहे.',
  'No officer available': 'कोणताही अधिकारी उपलब्ध नाही',
  '{0} days to deadline': 'मुदतीस {0} दिवस',
  Protects: 'वाचवते',
  'Not yet computable': 'अद्याप परिगणनीय नाही',
  'Capabilities this screen would normally carry, left visibly empty rather than filled with plausible figures. Each names the input that unblocks it.':
    'सामान्यतः या पडद्यावर असणाऱ्या क्षमता, प्रशंसनीय आकड्यांनी भरण्याऐवजी स्पष्टपणे रिकाम्या ठेवल्या आहेत. प्रत्येक ती माहिती सांगते जी त्यांना शक्य करेल.',
  'Pending data': 'माहिती प्रलंबित',
  'Blocked by': 'कशामुळे अडलेले'
})
