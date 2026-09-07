import { registerMessages } from '../../locale.js'

/**
 * Marathi — retrospective.js and precedent.js.
 *
 * WHAT IS NOT TRANSLATED HERE, AND WHY
 *
 * Court names, case names and SLP numbers stay exactly as published. "M/s
 * Barkataki Print and Media Services v. Union of India" and "SLP (C) No. 4240
 * of 2025" are the citation an officer puts in a notice; a translated or
 * transliterated version of either would not find the judgment and would make
 * the notice defective. Authority ids (AUTH-001) are record keys, not words.
 *
 * The holdings are translated, because that is what the officer reads to decide
 * whether the authority helps. Where a holding could be confirmed but the case
 * name could not, the platform leaves the name blank rather than inventing one,
 * and the sentence saying so is translated in full.
 *
 *   holding          → निर्णयसार
 *   ultra vires      → अधिकारक्षेत्राबाहेर
 *   quashed          → रद्दबातल
 *   set aside        → बाजूला ठेवलेले
 *   reserved         → राखून ठेवलेले
 *   adjudication     → न्यायनिर्णयन
 *   contrast class   → विरोधी वर्ग
 *   separation       → पृथक्करण
 *   ground of decision → निर्णयाचा आधार
 */
registerMessages('mr', {
  /* == Retrospective — framing ========================================== */
  'What if this case had been handled differently': 'हे प्रकरण वेगळ्या प्रकारे हाताळले असते तर',
  'resembles fraud': 'फसवणुकीशी साम्य',
  'this was put down while something was still live in it':
    'यातील काहीतरी अद्याप जिवंत असतानाच हे बाजूला ठेवले गेले',
  'This is the recovery curve evaluated at a different day, not a judgement about anybody’s decisions. It says what the same action taken earlier would have been worth, which is arithmetic. It does not say what a different action would have been worth — escalation to a different section, a provisional attachment, a different forum — because that is a causal claim about a route never taken, and answering it needs outcome histories across comparable cases where each route was actually followed.':
    'हा वेगळ्या दिवशी मोजलेला वसुली वक्र आहे, कोणाच्याही निर्णयांवरील मत नाही. तीच कृती आधी केली असती तर तिचे मूल्य किती झाले असते एवढेच तो सांगतो, आणि ते अंकगणित आहे. वेगळी कृती केली असती तर काय झाले असते — वेगळ्या कलमाखाली कार्यवाही, तात्पुरती जप्ती, वेगळा न्यायमंच — हे तो सांगत नाही, कारण तो कधीही न घेतलेल्या मार्गाबद्दलचा कार्यकारण दावा आहे, आणि त्याचे उत्तर देण्यासाठी प्रत्येक मार्ग प्रत्यक्षात अनुसरलेल्या तुलनात्मक प्रकरणांचे निष्कर्ष इतिहास लागतात.',
  'The lag is reported in two parts because they have different owners and different fixes. Detection latency is how long before the signal could first be seen at all, and it is a data-feed problem — no amount of prioritisation shortens it. Queue dwell is how long the case then sat unworked, and it is a capacity and prioritisation problem, which is the part controllable this quarter. A single blended "average lag" figure hides which of the two to spend money on.':
    'विलंब दोन भागांत नोंदवला जातो कारण त्यांचे धनी वेगळे आहेत आणि उपायही वेगळे. शोधातील विलंब म्हणजे संकेत प्रथम दिसण्यापूर्वी किती काळ जातो, आणि ती स्रोताची समस्या आहे — कितीही प्राधान्यक्रम लावला तरी तो कमी होत नाही. रांगेतील प्रतीक्षा म्हणजे त्यानंतर प्रकरण किती काळ न हाताळता पडून राहिले, आणि ती क्षमता व प्राधान्यक्रमाची समस्या आहे, म्हणजेच याच तिमाहीत नियंत्रणात असलेला भाग. एकत्र मिसळलेला "सरासरी विलंब" हा एकच आकडा या दोहोंपैकी कशावर पैसा खर्च करावा हे लपवतो.',

  /* == Retrospective — revisit candidates =============================== */
  'Audit closed while risk rules were still firing':
    'जोखीम नियम अद्याप लागू असतानाच लेखापरीक्षा बंद',
  'No notice ever issued despite risk rules firing':
    'जोखीम नियम लागू असूनही कोणतीही नोटीस कधीच जारी नाही',
  'These are cases put down while something in them was still live — an audit closed with risk rules still firing, or a taxpayer against whom no notice ever issued despite them. It is not an allegation and not a finding that anything was done wrongly: rules fire on behaviour that frequently has an innocent explanation, and an officer who closed one of these may well have had a reason that is not on the system. Time-barred periods are excluded, because revisiting them recovers nothing.':
    'ही अशी प्रकरणे आहेत जी त्यांतील काहीतरी अद्याप जिवंत असतानाच बाजूला ठेवली गेली — जोखीम नियम अद्याप लागू असताना बंद केलेली लेखापरीक्षा, किंवा ते नियम लागू असूनही ज्याविरुद्ध कधीही नोटीस निघाली नाही असा करदाता. हा आरोप नाही आणि काही चुकीचे घडले असा निष्कर्षही नाही: नियम अशा वर्तनावर लागू होतात ज्याला अनेकदा निर्दोष स्पष्टीकरण असते, आणि यांपैकी एखादे प्रकरण बंद करणाऱ्या अधिकाऱ्याकडे प्रणालीवर नसलेले कारण असणेही शक्य आहे. मुदतबाह्य कालावधी वगळले आहेत, कारण त्यांचा फेरविचार केल्याने काहीही वसूल होत नाही.',
  'An audit case was opened and closed while these rules were still firing.':
    'हे नियम अद्याप लागू असतानाच लेखापरीक्षा प्रकरण उघडले व बंद केले गेले.',
  'No notice was ever issued against this taxpayer despite these rules firing.':
    'हे नियम लागू असूनही या करदात्याविरुद्ध कधीही नोटीस जारी झाली नाही.',
  'This is a review candidate, not a classification. Nothing here proposes Section 74 treatment: the department holds one concluded Section 74 proceeding, and no resemblance model can be built on a single example. Reclassification carries a longer limitation period and a heavier penalty and must be decided by an officer on the evidence, not suggested by a screen.':
    'हा पुनर्विलोकन उमेदवार आहे, वर्गीकरण नाही. येथे कलम ७४ खालील हाताळणी कुठेही सुचवलेली नाही: विभागाकडे कलम ७४ ची एकच निकाली कार्यवाही आहे, आणि एकाच उदाहरणावर साम्य ओळखणारे प्रारूप उभारता येत नाही. फेरवर्गीकरणासोबत मोठी मुदत व अधिक दंड येतो, आणि तो पुराव्यावरून अधिकाऱ्याने ठरवायचा असतो, पडद्याने सुचवायचा नाही.',

  /* == Retrospective — before reopening ================================= */
  'how much': 'किती',
  'Establish the tax period and applicable section': 'कर कालावधी व लागू कलम निश्चित करा',
  'Nothing can be reopened until the period is fixed, and the section decides how long there is to do it.':
    'कालावधी निश्चित होईपर्यंत काहीही पुन्हा उघडता येत नाही, आणि तसे करण्यास किती वेळ आहे हे कलम ठरवते.',
  'Compute the limitation date for that period': 'त्या कालावधीसाठी मुदतीची तारीख काढा',
  'A period already expired cannot be revisited whatever the evidence shows.':
    'आधीच संपलेल्या कालावधीचा, पुरावा काहीही दाखवत असला तरी, फेरविचार करता येत नाही.',
  'Retrieve the evidence the closure rested on': 'ज्या पुराव्यावर प्रकरण बंद केले तो पुरावा मिळवा',
  'The officer who closed it may have had a reason that never reached the system.':
    'ते बंद करणाऱ्या अधिकाऱ्याकडे प्रणालीपर्यंत कधीच न पोहोचलेले कारण असू शकते.',
  'Re-quantify the exposure against current returns':
    'सध्याच्या विवरणपत्रांच्या तुलनेत जोखीम रक्कम पुन्हा मोजा',
  'The figure below is a risk-model estimate, not an assessed demand.':
    'खालील आकडा हा जोखीम प्रारूपाचा अंदाज आहे, निर्धारित मागणी नाही.',

  /* == Retrospective — the Section 74 refusal ========================== */
  'Reclassification under Section 74 carries a longer limitation period and a substantially heavier penalty, and must be sustained on evidence of suppression or wilful misstatement. A model proposing it has to be defensible in appeal. On one example it would not survive the first hearing.':
    'कलम ७४ खालील फेरवर्गीकरणासोबत मोठी मुदत व लक्षणीयरीत्या अधिक दंड येतो, आणि तो माहिती दडवल्याच्या किंवा जाणीवपूर्वक चुकीचे कथन केल्याच्या पुराव्यावर टिकला पाहिजे. ते सुचवणारे प्रारूप अपिलात समर्थनीय असावे लागते. एकाच उदाहरणावर ते पहिल्याच सुनावणीत टिकणार नाही.',
  'At least five concluded Section 74 proceedings, and ideally several times that, so the pattern has variation to learn from rather than a single case to memorise.':
    'कलम ७४ च्या किमान पाच निकाली कार्यवाही, आणि आदर्शतः त्याच्या कितीतरी पट, जेणेकरून प्रारूपाला पाठ करण्यासाठी एकच प्रकरण न मिळता शिकण्यासाठी विविधता मिळेल.',
  'The adjudication outcome on each, so the model learns from cases that were SUSTAINED as fraud rather than merely alleged as fraud — those are different populations and conflating them would train it to reproduce the department’s charging habits rather than its wins.':
    'प्रत्येकावरील न्यायनिर्णयाचा निष्कर्ष, जेणेकरून प्रारूप हे केवळ फसवणूक म्हणून आरोप ठेवलेल्या नव्हे तर फसवणूक म्हणून टिकून राहिलेल्या प्रकरणांतून शिकेल — या दोन वेगळ्या संख्या आहेत आणि त्यांची गल्लत केल्यास प्रारूप विभागाच्या यशांऐवजी विभागाच्या आरोप ठेवण्याच्या सवयींची पुनरावृत्ती करायला शिकेल.',
  'The evidence actually relied on in each order, not just the section quoted, so resemblance is measured on what proved the case rather than on how it was labelled.':
    'प्रत्येक आदेशात प्रत्यक्षात ज्या पुराव्यावर विसंबले तो पुरावा, केवळ उद्धृत केलेले कलम नव्हे, जेणेकरून साम्य हे प्रकरणाला काय शिक्का लावला यावरून नव्हे तर ते कशामुळे सिद्ध झाले यावरून मोजले जाईल.',
  'This is the capability most worth having and the one furthest from being possible. It is left unbuilt rather than approximated, because an approximate version would produce confident Section 74 review candidates from noise, and an officer would act on them.':
    'ही सर्वाधिक हवीशी वाटणारी क्षमता आहे आणि शक्य होण्यापासून सर्वात दूर असलेलीही तीच आहे. ती अंदाजाने उभारण्याऐवजी न बांधता ठेवली आहे, कारण अंदाजी आवृत्ती गोंगाटातून आत्मविश्वासाने कलम ७४ चे पुनर्विलोकन उमेदवार तयार करेल, आणि अधिकारी त्यांवर कारवाई करेल.',

  /* == Retrospective — the separation test ============================= */
  'charged as fraud': 'फसवणूक म्हणून आरोप ठेवलेले',
  'SUSTAINED on appeal': 'अपिलात टिकून राहिलेले',
  'resembles a case we won': 'आपण जिंकलेल्या प्रकरणाशी साम्य',
  'Risk rules firing': 'लागू होणारे जोखीम नियम',
  'ITC claimed / turnover': 'दावा केलेले ITC / उलाढाल',
  'Tax paid / turnover': 'भरलेला कर / उलाढाल',
  'Member of a detected chain': 'शोधलेल्या साखळीचा सदस्य',
  'The features do not separate. Cases the department won look like cases in general on every feature measured, so a model asking "does this resemble a case we won" would answer yes to nearly everything and rank the rest by noise.':
    'वैशिष्ट्ये पृथक्करण करत नाहीत. मोजलेल्या प्रत्येक वैशिष्ट्यावर विभागाने जिंकलेली प्रकरणे ही सर्वसाधारण प्रकरणांसारखीच दिसतात, त्यामुळे "हे आपण जिंकलेल्या प्रकरणासारखे आहे का" असे विचारणारे प्रारूप जवळपास प्रत्येक गोष्टीला होय म्हणेल आणि उरलेल्यांचा क्रम गोंगाटावरून लावेल.',
  'A weak separation would be a sample-size problem and more cases would fix it. No separation is a feature problem, and a thousand cases described by these same fields would still look alike. The fields describe a taxpayer; they do not describe why a demand held up.':
    'दुर्बळ पृथक्करण ही नमुन्याच्या आकाराची समस्या असती आणि अधिक प्रकरणांनी ती सुटली असती. पृथक्करणच नसणे ही वैशिष्ट्यांची समस्या आहे, आणि याच रकान्यांनी वर्णन केलेली हजार प्रकरणेही सारखीच दिसतील. हे रकाने करदात्याचे वर्णन करतात; मागणी का टिकली याचे वर्णन ते करत नाहीत.',
  'The evidence relied on in each order — what was produced, what was accepted, and what the taxpayer could not explain. This is the only field that describes why a demand held up rather than who the taxpayer was.':
    'प्रत्येक आदेशात ज्या पुराव्यावर विसंबले तो — काय सादर केले गेले, काय स्वीकारले गेले, आणि करदाता काय स्पष्ट करू शकला नाही. करदाता कोण होता याऐवजी मागणी का टिकली याचे वर्णन करणारा हा एकमेव रकाना आहे.',
  'A contrast class of comparable size. Wins alone cannot teach discrimination; the reversals and remands are where the signal about what fails actually lives.':
    'तुलनात्मक आकाराचा विरोधी वर्ग. केवळ यशांवरून भेद करायला शिकवता येत नाही; काय अपयशी ठरते याचा संकेत प्रत्यक्षात रद्द झालेल्या व फेरविचारार्थ परत आलेल्या प्रकरणांत असतो.',
  'The ground on which each case was decided, so outcomes turning on limitation or procedure are separated from those decided on merits. Mixing them trains the model on two different questions at once.':
    'प्रत्येक प्रकरण ज्या आधारावर निकाली निघाले तो आधार, जेणेकरून मुदत किंवा कार्यपद्धतीवर अवलंबून असलेले निष्कर्ष हे गुणवत्तेवर ठरलेल्या निष्कर्षांपासून वेगळे करता येतील. ते एकत्र केल्यास प्रारूप एकाच वेळी दोन वेगळ्या प्रश्नांवर शिकते.',

  /* == Retrospective — the four scenarios ============================== */
  'Acted the day the behaviour occurred': 'वर्तन घडले त्याच दिवशी कारवाई',
  'Not achievable — the return that reveals it has not been filed yet. Shown as the ceiling.':
    'गाठता येणार नाही — ते उघड करणारे विवरणपत्र अद्याप दाखलच झालेले नाही. कमाल मर्यादा म्हणून दाखवलेले.',
  'Acted the day the signal first became visible': 'संकेत प्रथम दिसला त्याच दिवशी कारवाई',
  'The earliest the department could have known. This is the realistic best case.':
    'विभागाला कळू शकले असते तो सर्वात लवकरचा क्षण. हीच वास्तववादी सर्वोत्तम स्थिती.',
  'Acted within 30 days of the signal': 'संकेतानंतर ३० दिवसांच्या आत कारवाई',
  'A service standard the department could set and staff to.':
    'विभाग ठरवू शकेल व त्यानुसार कर्मचारी नेमू शकेल असे सेवा मानक.',
  'What actually happened': 'प्रत्यक्षात काय घडले',
  'Every scenario above is the same action taken on a different day. None of them models a different action — escalation to another section, a provisional attachment, a different forum — because that is a causal claim about a route never taken, and it needs outcome histories across comparable cases where each route was actually followed.':
    'वरील प्रत्येक परिस्थिती म्हणजे तीच कृती वेगळ्या दिवशी केलेली. यांपैकी कोणीही वेगळ्या कृतीचे प्रारूप मांडत नाही — दुसऱ्या कलमाखाली कार्यवाही, तात्पुरती जप्ती, वेगळा न्यायमंच — कारण तो कधीही न घेतलेल्या मार्गाबद्दलचा कार्यकारण दावा आहे, आणि त्यासाठी प्रत्येक मार्ग प्रत्यक्षात अनुसरलेल्या तुलनात्मक प्रकरणांचे निष्कर्ष इतिहास लागतात.',

  /* == Precedent — forums ============================================== */
  'Supreme Court of India': 'भारताचे सर्वोच्च न्यायालय',
  'Binds every court and authority in India under Article 141.':
    'अनुच्छेद १४१ अन्वये भारतातील प्रत्येक न्यायालय व प्राधिकाऱ्यावर बंधनकारक.',
  'Bombay High Court': 'मुंबई उच्च न्यायालय',
  'The jurisdictional High Court for Maharashtra. Binding on all authorities within the state.':
    'महाराष्ट्रासाठीचे अधिकारक्षेत्रीय उच्च न्यायालय. राज्यातील सर्व प्राधिकाऱ्यांवर बंधनकारक.',
  'High Court (other State)': 'उच्च न्यायालय (अन्य राज्य)',
  'Persuasive only. May be relied on in argument but does not bind a Maharashtra authority.':
    'केवळ मार्गदर्शक. युक्तिवादात त्यावर विसंबता येते, पण ते महाराष्ट्रातील प्राधिकाऱ्यावर बंधनकारक नाही.',
  'Appellate Tribunal': 'अपील न्यायाधिकरण',
  'Persuasive at adjudication level; binding on subordinate authorities within its own jurisdiction.':
    'न्यायनिर्णयन पातळीवर मार्गदर्शक; स्वतःच्या अधिकारक्षेत्रातील दुय्यम प्राधिकाऱ्यांवर बंधनकारक.',
  'Departmental Appellate Authority': 'विभागीय अपील प्राधिकारी',
  'Not precedent. Useful as departmental practice, not as authority.':
    'पूर्वनिर्णय नाही. विभागीय प्रथा म्हणून उपयुक्त, प्राधिकार म्हणून नाही.',
  'Adjudication order': 'न्यायनिर्णयन आदेश',
  'Not precedent in any sense. Records how one case was decided on its own facts.':
    'कोणत्याही अर्थाने पूर्वनिर्णय नाही. एक प्रकरण त्याच्या स्वतःच्या तथ्यांवर कसे निकाली निघाले याची नोंद.',

  /* == Precedent — status ============================================== */
  Stands: 'टिकून आहे',
  'No known challenge. May be relied on subject to the usual forum rules.':
    'कोणतेही ज्ञात आव्हान नाही. न्यायमंचाच्या नेहमीच्या नियमांच्या अधीन राहून त्यावर विसंबता येते.',
  'Under challenge': 'आव्हानाधीन',
  'The question is before a higher forum. Relying on this creates exposure if the decision goes the other way.':
    'हा प्रश्न वरिष्ठ न्यायमंचासमोर आहे. निर्णय विरुद्ध गेल्यास यावर विसंबल्याने जोखीम निर्माण होते.',
  'Conflicting authority': 'परस्परविरोधी प्राधिकार',
  'Other courts of equal rank have decided the opposite. The question is unsettled.':
    'समान दर्जाच्या इतर न्यायालयांनी याच्या उलट निर्णय दिला आहे. हा प्रश्न अनिर्णीत आहे.',
  'Reversed / set aside': 'रद्द / बाजूला ठेवलेले',
  'No longer good law. Must not be relied on.': 'हे यापुढे प्रमाण कायदा नाही. यावर विसंबू नये.',

  /* == Precedent — the verified authorities ============================= */
  'Gauhati High Court': 'गुवाहाटी उच्च न्यायालय',
  'Patna High Court': 'पाटणा उच्च न्यायालय',
  'Allahabad High Court': 'अलाहाबाद उच्च न्यायालय',
  'Notification 56/2023-CT is ultra vires Section 168A of the CGST Act, having been issued without the mandatory prior recommendation of the GST Council. Orders passed beyond the unextended limitation period were quashed.':
    'GST परिषदेची अनिवार्य पूर्वशिफारस न घेता जारी केल्यामुळे अधिसूचना ५६/२०२३-CT ही CGST अधिनियमाच्या कलम १६८अ च्या अधिकारक्षेत्राबाहेरची आहे. न वाढवलेल्या मुदतीनंतर दिलेले आदेश रद्दबातल ठरवले गेले.',
  'Case name and holding confirmed from published reports.':
    'प्रकरणाचे नाव व निर्णयसार प्रसिद्ध वृत्तांतांवरून निश्चित केले.',
  'Upheld the validity of Notification 56/2023-CT, taking the opposite view to the Gauhati High Court on the same question.':
    'अधिसूचना ५६/२०२३-CT ची वैधता कायम ठेवली, आणि त्याच प्रश्नावर गुवाहाटी उच्च न्यायालयाच्या उलट भूमिका घेतली.',
  'Holding confirmed from published reports; case name and date not established, and are deliberately not stated.':
    'निर्णयसार प्रसिद्ध वृत्तांतांवरून निश्चित केला; प्रकरणाचे नाव व तारीख निश्चित होऊ शकली नाही, आणि ती जाणीवपूर्वक नमूद केलेली नाहीत.',
  'Upheld the validity of Notification 09/2023-CT extending the limitation period under Section 73.':
    'कलम ७३ खालील मुदत वाढवणाऱ्या अधिसूचना ०९/२०२३-CT ची वैधता कायम ठेवली.',
  'Judgment reserved on whether the adjudication time limit under Section 73 may be extended by notification under Section 168A. Will settle the conflict between the High Courts and bind all authorities once delivered.':
    'कलम ७३ खालील न्यायनिर्णयनाची मुदत कलम १६८अ खालील अधिसूचनेने वाढवता येते का, यावर निकाल राखून ठेवला आहे. निकाल आल्यावर तो उच्च न्यायालयांमधील मतभेद निकाली काढेल आणि सर्व प्राधिकाऱ्यांवर बंधनकारक होईल.',
  'SLP number, parties and reserved status confirmed from published reports.':
    'SLP क्रमांक, पक्षकार व निकाल राखून ठेवल्याची स्थिती प्रसिद्ध वृत्तांतांवरून निश्चित केली.',

  /* == Precedent — the question and its consequences ==================== */
  'May the adjudication time limit under Section 73 be extended by notification under Section 168A?':
    'कलम ७३ खालील न्यायनिर्णयनाची मुदत कलम १६८अ खालील अधिसूचनेने वाढवता येते का?',
  'Every proceeding whose limitation date rests on Notification 09/2023-CT or 56/2023-CT.':
    'ज्यांची मुदत तारीख अधिसूचना ०९/२०२३-CT किंवा ५६/२०२३-CT वर आधारित आहे अशी प्रत्येक कार्यवाही.',
  'If the notifications fall, the extended deadlines fall with them and any order passed after the unextended date is void. The exposure is not a risk of losing on merits — it is a risk of the demand never having been validly raised.':
    'या अधिसूचना रद्द झाल्यास वाढवलेल्या मुदतीही त्यांच्यासोबत रद्द होतात आणि न वाढवलेल्या तारखेनंतर दिलेला कोणताही आदेश निरर्थक ठरतो. ही जोखीम गुणवत्तेवर हरण्याची नाही — ही मागणी कधी वैधरीत्या उभीच राहिली नव्हती याची जोखीम आहे.',
  'Unsettled — before the Supreme Court': 'अनिर्णीत — सर्वोच्च न्यायालयासमोर',
  'No binding authority applies in Maharashtra, High Courts have taken opposite views, and the Supreme Court has reserved judgment. Proceedings that depend on this question carry live risk until it is delivered.':
    'महाराष्ट्रात कोणताही बंधनकारक प्राधिकार लागू होत नाही, उच्च न्यायालयांनी परस्परविरोधी भूमिका घेतल्या आहेत, आणि सर्वोच्च न्यायालयाने निकाल राखून ठेवला आहे. या प्रश्नावर अवलंबून असलेल्या कार्यवाहींवर निकाल येईपर्यंत जिवंत जोखीम आहे.',
  'Unsettled — conflicting authority': 'अनिर्णीत — परस्परविरोधी प्राधिकार',
  'High Courts of equal rank have decided the question both ways and none of them binds Maharashtra.':
    'समान दर्जाच्या उच्च न्यायालयांनी हा प्रश्न दोन्ही बाजूंनी निकाली काढला आहे आणि त्यांपैकी एकही महाराष्ट्रावर बंधनकारक नाही.',
  'Authority exists but none of it binds a Maharashtra authority.':
    'प्राधिकार अस्तित्वात आहे पण त्यांपैकी एकही महाराष्ट्रातील प्राधिकाऱ्यावर बंधनकारक नाही.',
  'The extended deadline never existed. Any order passed after the unextended date was void when made, and demand already collected under it is liable to be refunded.':
    'वाढवलेली मुदत कधी अस्तित्वातच नव्हती. न वाढवलेल्या तारखेनंतर दिलेला कोणताही आदेश देतानाच निरर्थक होता, आणि त्याखाली आधीच वसूल केलेली मागणी परत करावी लागेल.',
  'The extension stands and these proceedings were validly within time.':
    'मुदतवाढ टिकते आणि या कार्यवाही वैधरीत्या मुदतीत होत्या.',

  /* == Precedent — the limits of what is shown ========================= */
  'match score': 'जुळणी गुणांक',
  'Facts differ between proceedings on the same issue; a matching legal question is not a matching case.':
    'एकाच मुद्द्यावरील कार्यवाहींमध्येही तथ्ये वेगळी असतात; विधी प्रश्न जुळणे म्हणजे प्रकरण जुळणे नव्हे.',
  'Departmental outcomes reflect how these cases were argued and evidenced, not what a court would hold on different facts.':
    'विभागाचे निष्कर्ष ही प्रकरणे कशी लढवली व त्यांना कोणता पुरावा दिला हे दर्शवतात, वेगळ्या तथ्यांवर न्यायालय काय ठरवेल हे नव्हे.',
  'None of the entries below is judicial authority. They are this department’s own decisions.':
    'खालीलपैकी कोणतीही नोंद न्यायिक प्राधिकार नाही. हे याच विभागाचे स्वतःचे निर्णय आहेत.',
  'Departmental order and appellate archive': 'विभागीय आदेश व अपील संग्रह',
  'Real precedent retrieval requires the department’s order corpus — adjudication orders, appellate decisions and their subsequent history — indexed and citable to paragraph. That archive is not connected to this build. What is shown below is (a) this department’s own concluded proceedings, which is institutional memory rather than authority, and (b) a small set of externally verified judgments included to demonstrate how authority is weighted. Matching cases on sector or on text similarity is not precedent and is not offered.':
    'खरा पूर्वनिर्णय शोध घेण्यासाठी विभागाचा आदेश संग्रह — न्यायनिर्णयन आदेश, अपील निर्णय व त्यांचा पुढील इतिहास — अनुक्रमणिकाबद्ध व परिच्छेदापर्यंत उद्धृत करण्याजोगा असावा लागतो. तो संग्रह या बांधणीशी जोडलेला नाही. खाली दाखवले आहे ते (अ) याच विभागाच्या स्वतःच्या निकाली कार्यवाही, जी प्राधिकार नसून संस्थात्मक स्मृती आहे, आणि (ब) प्राधिकाराचे भारमान कसे ठरते हे दाखवण्यासाठी समाविष्ट केलेले बाहेरून पडताळलेले काही निर्णय. क्षेत्रावरून किंवा मजकुराच्या साम्यावरून प्रकरणे जुळवणे हा पूर्वनिर्णय नाही आणि तो येथे दिलेला नाही.'
})
