import { registerMessages } from '../../locale.js'

/**
 * Marathi — Precedent Intelligence.
 *
 * The vocabulary here is the one an officer would use in a note on the file,
 * not a literal rendering of the English:
 *
 *   binding / persuasive → बंधनकारक / मार्गदर्शक
 *   forum                → न्यायमंच
 *   question of law      → विधी प्रश्न
 *   holding              → निर्णयसार
 *   settled / unsettled  → निर्णीत / अनिर्णीत
 *   under challenge      → आव्हानाधीन
 *   struck down / upheld → रद्द / कायम
 *   citation             → संदर्भ
 *   success rate         → यशाचे प्रमाण
 */
registerMessages('mr', {
  /* == Header ============================================================= */
  'Enforcement · Legal Authority': 'अंमलबजावणी · विधी प्राधिकार',
  'Prior decisions weighted by the forum that gave them and whether they still stand — not by how similar the facts look. A judgment from another State’s High Court does not bind a Maharashtra authority, and a judgment under appeal is a liability rather than support.':
    'पूर्वीचे निर्णय ते कोणत्या न्यायमंचाने दिले आणि ते अद्याप टिकून आहेत का यानुसार भारित केलेले — तथ्ये किती सारखी दिसतात यानुसार नाही. दुसऱ्या राज्याच्या उच्च न्यायालयाचा निर्णय महाराष्ट्रातील प्राधिकाऱ्याला बंधनकारक नसतो, आणि अपिलाधीन असलेला निर्णय हा आधार नसून दायित्व असतो.',

  /* == Question status ==================================================== */
  'Status of the question': 'प्रश्नाची स्थिती',
  Settled: 'निर्णीत',
  Unsettled: 'अनिर्णीत',
  Disputed: 'वादग्रस्त',
  'Authorities on record': 'अभिलेखावरील प्राधिकार',
  '({0} for dept, {1} for assessee)': '({0} विभागाच्या बाजूने, {1} करनिर्धारितीच्या बाजूने)',
  'Binding in Maharashtra': 'महाराष्ट्रात बंधनकारक',
  'Departmental exposure': 'विभागाची जोखीम रक्कम',
  '₹ Cr across {0} proceedings': '₹ कोटी — {0} कार्यवाहींत',
  'Question of law': 'विधी प्रश्न',
  'Why it matters': 'हे का महत्त्वाचे आहे',

  /* == Authority table ==================================================== */
  'Authorities, ranked by binding weight': 'प्राधिकार, बंधनकारक भारमानानुसार क्रमवारीत',
  'Ordered by the forum, not by date or similarity. Where a case name could not be established from a published source it is left blank rather than invented.':
    'न्यायमंचानुसार क्रम लावलेला, तारखेनुसार किंवा साम्यानुसार नाही. जिथे प्रसिद्ध स्रोतावरून प्रकरणाचे नाव निश्चित करता आले नाही, तिथे ते रचण्याऐवजी रिकामे ठेवले आहे.',
  'Persuasive only': 'केवळ मार्गदर्शक',
  'Case name not established from a published source, and deliberately not stated.':
    'प्रसिद्ध स्रोतावरून प्रकरणाचे नाव निश्चित झालेले नाही, आणि ते जाणीवपूर्वक नमूद केलेले नाही.',

  /* == Proceedings turning on the contested notifications ================= */
  'affected proceedings': 'प्रभावित कार्यवाही',
  'Proceedings that turn on this question': 'या प्रश्नावर अवलंबून असलेल्या कार्यवाही',
  '{0} proceedings totalling {1} have a limitation date that rests on the contested notifications.':
    'एकूण {1} रकमेच्या {0} कार्यवाहींची मुदत तारीख वादग्रस्त अधिसूचनांवर अवलंबून आहे.',
  'If the notifications are struck down': 'अधिसूचना रद्द झाल्यास',
  'If they are upheld': 'त्या कायम राहिल्यास',
  'Financial year': 'आर्थिक वर्ष',
  'Deadline relied on': 'ज्या मुदतीवर विसंबले',

  /* == Departmental outcomes ============================================== */
  'No question of law yet carries enough concluded proceedings to state a success rate':
    'यशाचे प्रमाण सांगण्याइतक्या निकाली कार्यवाही अद्याप कोणत्याही विधी प्रश्नावर नाहीत',
  '{0} of {1} questions carry enough concluded proceedings to state a success rate':
    '{1} पैकी {0} प्रश्नांवर यशाचे प्रमाण सांगण्याइतक्या निकाली कार्यवाही आहेत',
  'A success rate computed on two or three concluded cases is not a weak signal — it is a misleading one, and an officer who relies on it has been misled by arithmetic. Below the five-case threshold this module reports the count and withholds the rate. That the threshold is rarely met is itself the finding: departmental outcome history is too thin to guide case strategy, and building it is a data-capture problem before it is an analytics one.':
    'दोन-तीन निकाली प्रकरणांवरून काढलेले यशाचे प्रमाण हा दुर्बळ संकेत नाही — तो दिशाभूल करणारा संकेत आहे, आणि त्यावर विसंबणाऱ्या अधिकाऱ्याची अंकगणिताने दिशाभूल केलेली असते. पाच प्रकरणांच्या उंबरठ्याखाली हे प्रारूप संख्या सांगते आणि प्रमाण रोखून धरते. हा उंबरठा क्वचितच गाठला जातो हाच खरा निष्कर्ष आहे: विभागाचा निष्कर्षांचा इतिहास प्रकरण-रणनीतीला दिशा देण्याइतका सखोल नाही, आणि तो उभा करणे ही विश्लेषणाची नव्हे तर आधी माहिती-संकलनाची समस्या आहे.',
  'Departmental outcomes by question of law': 'विधी प्रश्नानुसार विभागाचे निष्कर्ष',
  'This department’s own concluded proceedings, grouped by the legal question rather than by sector. Institutional memory — not judicial authority, and not citable as precedent.':
    'याच विभागाच्या स्वतःच्या निकाली कार्यवाही, क्षेत्रानुसार नव्हे तर विधी प्रश्नानुसार गटबद्ध. ही संस्थात्मक स्मृती आहे — न्यायिक प्राधिकार नाही, आणि पूर्वनिर्णय म्हणून उद्धृत करण्याजोगी नाही.',
  Concluded: 'निकाली',
  Confirmed: 'कायम',
  Reversed: 'रद्द',
  'Success rate': 'यशाचे प्रमाण',
  'withheld — n={0}': 'रोखलेले — n={0}',

  /* == Weak positions ===================================================== */
  'Where the department’s position is already weak': 'विभागाची स्थिती जिथे आधीच कमकुवत आहे',
  'Recorded on the case file at the time of assessment, not inferred by a model.':
    'करनिर्धारणाच्या वेळी प्रकरण नस्तीवर नोंदवलेले, प्रारूपाने काढलेले अनुमान नाही.',
  'Documentation gap': 'कागदपत्रांची त्रुटी',
  'Precedent unfavourable': 'पूर्वनिर्णय प्रतिकूल',
  'Median age': 'मध्यक वय',

  /* == Forum hierarchy and status classification ========================== */
  'Forum hierarchy, from the position of a Maharashtra authority':
    'न्यायमंच उतरंड, महाराष्ट्रातील प्राधिकाऱ्याच्या दृष्टिकोनातून',
  'Binding weight is relative to the deciding authority. The same judgment carries different weight for an officer in another State, which is why jurisdiction is modelled rather than assumed.':
    'बंधनकारक भारमान हे निर्णय घेणाऱ्या प्राधिकाऱ्यावर अवलंबून असते. तोच निर्णय दुसऱ्या राज्यातील अधिकाऱ्यासाठी वेगळे भारमान बाळगतो, म्हणूनच अधिकारक्षेत्र गृहीत न धरता त्याचे प्रारूप मांडले आहे.',
  'Not binding': 'बंधनकारक नाही',
  'Status classifications': 'स्थिती वर्गीकरण',
  'A precedent under challenge is worse than none — relying on it creates exposure the officer did not know they had.':
    'आव्हानाधीन पूर्वनिर्णय हा नसण्यापेक्षा वाईट — त्यावर विसंबल्याने अधिकाऱ्याला माहीत नसलेली जोखीम निर्माण होते.',
  'No case citation on this screen is generated. Where a holding was confirmed but the case name was not, the name is left blank. A fabricated citation inside an issued notice makes the notice defective and the platform indefensible, so the model is not permitted to supply one.':
    'या पडद्यावरील एकही प्रकरण संदर्भ निर्माण केलेला नाही. जिथे निर्णयसार निश्चित झाला पण प्रकरणाचे नाव नाही, तिथे नाव रिकामे ठेवले आहे. जारी केलेल्या नोटिशीत रचलेला संदर्भ नोटीस सदोष करतो आणि मंच असमर्थनीय ठरवतो, म्हणून प्रारूपाला असा संदर्भ पुरवण्याची परवानगी नाही.'
})
