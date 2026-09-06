import { registerMessages } from '../../locale.js'

/**
 * Hindi — Network Intelligence (enforcement sequencing) and Precedent
 * Intelligence.
 *
 *   chain              → शृंखला
 *   cluster            → समूह
 *   node / entity      → इकाई
 *   edge               → कड़ी
 *   bypass route       → बगल मार्ग
 *   cut point          → छेदन बिंदु
 *   centrality         → केंद्रीयता
 *   directed cycle     → दिशिक चक्र
 *   blockable          → रोकने-योग्य
 *   utilised (credit)  → उपयोग किया गया
 *   lead strength      → सुराग की प्रबलता
 *   forum              → न्यायमंच
 *   holding            → निर्णय-सार
 *   binding/persuasive → बाध्यकारी / मार्गदर्शक
 */
registerMessages('hi', {
  /* == Network — header and framing ====================================== */
  'Fraud & Risk · Enforcement Sequencing': 'कपट एवं जोखिम · प्रवर्तन क्रम-निर्धारण',
  'Circular invoice chains, from detection through to action. The graph shows what was found; the tabs after it work out which entity actually stops the circulation, whether officers exist in every division the chain crosses, and what is lost when they cannot move on the same day.':
    'वर्तुलाकार बीजक शृंखलाएँ, पहचान से कार्रवाई तक। आरेख दिखाता है कि क्या मिला; उसके आगे के पन्ने यह निकालते हैं कि कौन-सी इकाई वास्तव में परिचलन रोकती है, शृंखला जिन-जिन विभागों से गुजरती है वहाँ अधिकारी हैं या नहीं, और वे एक ही दिन कार्रवाई न कर सकें तो क्या खोया जाता है।',
  'A chain is one economic unit spanning several divisions, and every cluster here crosses at least one boundary. Filtering to a single division would truncate the chains at that boundary and make them appear to end — the same failure the pilot extract specification warns against — so chains are always shown whole.':
    'शृंखला कई विभागों में फैली एक ही आर्थिक इकाई है, और यहाँ का प्रत्येक समूह कम से कम एक सीमा पार करता है। एक विभाग तक फ़िल्टर करने पर शृंखलाएँ उसी सीमा पर कट जाएँगी और वहीं समाप्त होती प्रतीत होंगी — यही वह चूक है जिसके विरुद्ध पायलट एक्सट्रैक्ट विनिर्देश चेतावनी देता है — इसलिए शृंखलाएँ सदैव पूरी दिखाई जाती हैं।',
  '{0} of credit in these chains has already been utilised and can no longer be blocked. {1} remains.':
    'इन शृंखलाओं में {0} का श्रेय पहले ही उपयोग हो चुका है और अब रोका नहीं जा सकता। {1} शेष है।',
  'That share was lost before detection, not through any decision taken since. It is stated first because it sets the scale of everything below: the sequencing decisions on this screen govern the remainder, and no amount of coordination recovers what has already moved through the chain. The largest available gain in network enforcement is earlier detection, not better choreography.':
    'वह हिस्सा पहचान से पहले ही खो गया, उसके बाद लिए गए किसी निर्णय से नहीं। इसे पहले बताया गया है क्योंकि यही नीचे की हर बात का पैमाना तय करता है: इस पर्दे के क्रम-निर्धारण संबंधी निर्णय केवल शेष भाग पर लागू होते हैं, और जो शृंखला से आगे निकल चुका है उसे कितना भी समन्वय वापस नहीं ला सकता। नेटवर्क प्रवर्तन में उपलब्ध सबसे बड़ा लाभ पहले पहचान है, बेहतर तालमेल नहीं।',

  /* == Network — tiles =================================================== */
  'Chains under analysis': 'विश्लेषणाधीन शृंखलाएँ',
  '{0} span more than one division': '{0} एक से अधिक विभागों में फैली',
  'Still blockable': 'अब भी रोकने-योग्य',
  '₹ Cr across all chains': '₹ करोड़ — सभी शृंखलाओं में',
  'Nodes that would not stop the chain': 'शृंखला न रोकने वाली इकाइयाँ',
  'across {0} chains': '{0} शृंखलाओं में',
  'Chains that cannot be closed at once': 'एक साथ बंद न होने वाली शृंखलाएँ',
  '{0} Cr blockable, no officer in one division': '{0} करोड़ रोकने-योग्य, एक विभाग में अधिकारी नहीं',

  /* == Network — chain panel ============================================= */
  '{0} — {1} entities': '{0} — {1} इकाइयाँ',
  '{0} still blockable of {1} that moved through the chain · signal age {2} days':
    'शृंखला से गुजरे {1} में से {0} अब भी रोकने-योग्य · संकेत की आयु {2} दिन',
  'Hide entities': 'इकाइयाँ छिपाएँ',
  'Show entities': 'इकाइयाँ दिखाएँ',
  'Act here first': 'पहले यहाँ कार्रवाई करें',
  'division not on record': 'विभाग अभिलेख पर नहीं',
  'Stops circulation': 'परिचलन रोकती है',
  'Lead strength {0}': 'सुराग की प्रबलता {0}',
  '{0} of invoice value sits on the edges this entity is party to.':
    'यह इकाई जिन कड़ियों की पक्षकार है, उन पर {0} का बीजक मूल्य है।',
  'No single effective cut': 'कोई एकल प्रभावी छेदन नहीं',
  'No single entity in this chain stops the circulation when removed. It has to be acted on as a group, or not at all.':
    'इस शृंखला की कोई भी एकल इकाई हटाने पर परिचलन नहीं रोकती। इस पर समूह के रूप में ही कार्रवाई करनी होगी, अन्यथा नहीं।',
  '{0} entity would NOT stop the chain': '{0} इकाई शृंखला नहीं रोकेगी',
  'A route bypasses these entities, so the circulation continues without them. Acting here spends the element of surprise and changes nothing.':
    'एक मार्ग इन इकाइयों को बगल से निकल जाता है, इसलिए उनके बिना भी परिचलन चलता रहता है। यहाँ कार्रवाई करने से आकस्मिकता का लाभ व्यर्थ जाता है और कुछ नहीं बदलता।',
  'No bypass routes': 'कोई बगल मार्ग नहीं',
  'This chain is a closed loop with no chord. Removing any one entity breaks the circulation, so topology does not distinguish the targets — lead strength and value at stake decide.':
    'यह शृंखला बिना किसी आड़ी कड़ी के बंद वलय है। कोई भी एक इकाई हटाने पर परिचलन टूट जाता है, इसलिए संरचना लक्ष्यों में अंतर नहीं करती — सुराग की प्रबलता और दाँव पर लगा मूल्य ही निर्णय करते हैं।',
  Entity: 'इकाई',
  'Role in chain': 'शृंखला में भूमिका',
  'Value on its edges': 'उसकी कड़ियों पर मूल्य',
  'Lead strength': 'सुराग की प्रबलता',
  'Removal stops chain?': 'हटाने से शृंखला रुकती है?',
  'No — bypassed': 'नहीं — बगल से निकल जाती है',

  /* == Network — jurisdictional span ===================================== */
  'Jurisdictional span of each chain': 'प्रत्येक शृंखला की अधिकारिता व्याप्ति',
  'Every one of these chains crosses a division boundary. The chain is one economic unit and several jurisdictional ones, and the department is organised along the second.':
    'इनमें से प्रत्येक शृंखला विभाग की सीमा पार करती है। शृंखला आर्थिक रूप से एक इकाई है और अधिकारिता की दृष्टि से अनेक, और विभाग की संरचना दूसरी के अनुसार है।',
  '{0} divisions': '{0} विभाग',
  'Can be closed simultaneously': 'एक साथ बंद की जा सकती है',
  'Cannot be closed simultaneously': 'एक साथ बंद नहीं की जा सकती',
  blockable: 'रोकने-योग्य',
  'No investigation officer is posted in {0}. This chain cannot be closed as a unit until one is — a deployment decision, not a scheduling one.':
    '{0} में कोई अन्वेषण अधिकारी तैनात नहीं है। जब तक तैनाती नहीं होती, यह शृंखला एक इकाई के रूप में बंद नहीं की जा सकती — यह तैनाती का निर्णय है, अनुसूचन का नहीं।',
  'Sequential lag': 'क्रमिक कार्रवाई में विलंब',
  'Value lost to that lag': 'उस विलंब से खोया मूल्य',
  'signal age {0}d': 'संकेत की आयु {0} दि.',

  /* == Network — the cost of coordination failure ======================== */
  'What coordination failure actually costs': 'समन्वय की विफलता की वास्तविक कीमत',
  'Lost to sequential action': 'क्रमिक कार्रवाई से खोया',
  'If each chain were worked one division per week rather than on a single date.':
    'यदि प्रत्येक शृंखला एक ही तिथि पर निपटाने के बजाय सप्ताह में एक विभाग की गति से निपटाई जाती।',
  'Already lost before detection': 'पहचान से पहले ही खोया',
  'Utilised downstream and no longer blockable by any action.':
    'आगे के चरणों में उपयोग हो चुका और अब किसी भी कार्रवाई से रोका नहीं जा सकता।',
  'The coordination loss is small, and it would be dishonest to present it as the headline. It is small for a specific reason: these chains are already {0} to {1} days old, and by that point the decay curve has flattened — most of what could move has moved, so a further week costs comparatively little. Simultaneity matters enormously on a chain detected in its first month and barely at all on one detected in its second year. The finding is therefore not "coordinate better" but "detect earlier", and the registration screen is where that is won.':
    'समन्वय से होने वाला नुकसान अल्प है, और उसे मुख्य निष्कर्ष के रूप में प्रस्तुत करना अप्रामाणिक होगा। वह अल्प होने का एक निश्चित कारण है: ये शृंखलाएँ पहले ही {0} से {1} दिन पुरानी हैं, और तब तक क्षय वक्र समतल हो चुका होता है — जो हिल सकता था उसका अधिकांश हिल चुका होता है, इसलिए एक और सप्ताह की कीमत तुलनात्मक रूप से कम है। पहले महीने में पकड़ी गई शृंखला पर एक साथ कार्रवाई अत्यंत महत्वपूर्ण है और दूसरे वर्ष में पकड़ी गई पर लगभग निरर्थक। इसलिए निष्कर्ष "बेहतर समन्वय करें" नहीं बल्कि "पहले पहचानें" है, और वह पंजीयन के पर्दे पर ही जीता जाता है।',

  /* == Network — method notes ============================================ */
  'How the cut point is decided': 'छेदन बिंदु कैसे तय होता है',
  'Why not a centrality score': 'केंद्रीयता अंक क्यों नहीं',
  'Centrality measures how important a node looks. It does not answer whether the circulation survives without it, and on a chain with a bypass route those two things point at different entities. The test used here is the direct one: remove the node and check whether a directed cycle still exists.':
    'केंद्रीयता यह मापती है कि कोई इकाई कितनी महत्वपूर्ण दिखती है। उसके बिना परिचलन टिकता है या नहीं, इसका उत्तर वह नहीं देती, और बगल मार्ग वाली शृंखला पर ये दोनों बातें अलग-अलग इकाइयों की ओर संकेत करती हैं। यहाँ प्रयुक्त परीक्षण सीधा है: इकाई हटाइए और देखिए कि दिशिक चक्र अब भी बचा है या नहीं।',
  'Lead strength indicators': 'सुराग प्रबलता के संकेतक',
  'A stated rule set, not a learned score. Each contribution is visible on the entity it applies to.':
    'यह स्पष्ट रूप से बताया गया नियम समुच्चय है, सीखा हुआ अंक नहीं। प्रत्येक योगदान उस इकाई पर दिखता है जिस पर वह लागू होता है।',
  'Base 0.20, capped at 0.95. No entity reaches certainty, because no combination of these indicators establishes one.':
    'आधार 0.20, अधिकतम सीमा 0.95। कोई भी इकाई निश्चितता तक नहीं पहुँचती, क्योंकि इन संकेतकों का कोई भी संयोजन निश्चितता सिद्ध नहीं करता।',
  'This is a lead, not a finding': 'यह सुराग है, निष्कर्ष नहीं',

  /* == Precedent Intelligence — header and status ======================== */
  'Enforcement · Legal Authority': 'प्रवर्तन · विधिक प्राधिकार',
  'Prior decisions weighted by the forum that gave them and whether they still stand — not by how similar the facts look. A judgment from another State’s High Court does not bind a Maharashtra authority, and a judgment under appeal is a liability rather than support.':
    'पूर्ववर्ती निर्णय इस आधार पर भारित कि उन्हें किस न्यायमंच ने दिया और वे अब भी टिके हैं या नहीं — इस आधार पर नहीं कि तथ्य कितने समान दिखते हैं। किसी अन्य राज्य के उच्च न्यायालय का निर्णय महाराष्ट्र के प्राधिकारी को बाध्य नहीं करता, और अपीलाधीन निर्णय समर्थन नहीं, दायित्व है।',
  'Status of the question': 'प्रश्न की स्थिति',
  Settled: 'निर्णीत',
  Unsettled: 'अनिर्णीत',
  Disputed: 'विवादित',
  'Authorities on record': 'अभिलेख पर प्राधिकार',
  '({0} for dept, {1} for assessee)': '({0} विभाग के पक्ष में, {1} करनिर्धारिती के पक्ष में)',
  'Binding in Maharashtra': 'महाराष्ट्र में बाध्यकारी',
  'Departmental exposure': 'विभागीय जोखिम राशि',
  '₹ Cr across {0} proceedings': '₹ करोड़ — {0} कार्यवाहियों में',
  'Question of law': 'विधि का प्रश्न',
  'Why it matters': 'यह क्यों महत्वपूर्ण है',

  /* == Precedent Intelligence — authorities ============================== */
  'Authorities, ranked by binding weight': 'प्राधिकार, बाध्यकारी भार के क्रम में',
  'Ordered by the forum, not by date or similarity. Where a case name could not be established from a published source it is left blank rather than invented.':
    'न्यायमंच के अनुसार क्रमबद्ध, तिथि या समानता के अनुसार नहीं। जहाँ प्रकाशित स्रोत से प्रकरण का नाम निश्चित नहीं हो सका, वहाँ उसे गढ़ने के बजाय रिक्त छोड़ा गया है।',
  'Persuasive only': 'केवल मार्गदर्शक',
  'Case name not established from a published source, and deliberately not stated.':
    'प्रकाशित स्रोत से प्रकरण का नाम निश्चित नहीं हुआ, और उसे जानबूझकर नहीं बताया गया है।',
  'affected proceedings': 'प्रभावित कार्यवाहियाँ',
  'Proceedings that turn on this question': 'इस प्रश्न पर निर्भर कार्यवाहियाँ',
  '{0} proceedings totalling {1} have a limitation date that rests on the contested notifications.':
    'कुल {1} राशि की {0} कार्यवाहियों की परिसीमा तिथि विवादित अधिसूचनाओं पर आधारित है।',
  'If the notifications are struck down': 'यदि अधिसूचनाएँ निरस्त होती हैं',
  'If they are upheld': 'यदि वे बनी रहती हैं',
  'Financial year': 'वित्तीय वर्ष',
  'Deadline relied on': 'जिस समय-सीमा पर भरोसा किया गया',

  /* == Precedent Intelligence — departmental outcomes ==================== */
  'No question of law yet carries enough concluded proceedings to state a success rate':
    'सफलता दर बताने योग्य पर्याप्त निपटाई गई कार्यवाहियाँ अभी विधि के किसी भी प्रश्न पर नहीं हैं',
  '{0} of {1} questions carry enough concluded proceedings to state a success rate':
    '{1} में से {0} प्रश्नों पर सफलता दर बताने योग्य पर्याप्त निपटाई गई कार्यवाहियाँ हैं',
  'A success rate computed on two or three concluded cases is not a weak signal — it is a misleading one, and an officer who relies on it has been misled by arithmetic. Below the five-case threshold this module reports the count and withholds the rate. That the threshold is rarely met is itself the finding: departmental outcome history is too thin to guide case strategy, and building it is a data-capture problem before it is an analytics one.':
    'दो या तीन निपटाए गए प्रकरणों पर निकाली गई सफलता दर दुर्बल संकेत नहीं — भ्रामक संकेत है, और उस पर भरोसा करने वाले अधिकारी को अंकगणित ने भ्रमित किया है। पाँच प्रकरणों की देहली से नीचे यह मॉड्यूल संख्या बताता है और दर रोक लेता है। यह देहली विरले ही पूरी होती है, यही असली निष्कर्ष है: विभाग का परिणाम-इतिहास प्रकरण-रणनीति को दिशा देने योग्य पर्याप्त गहरा नहीं है, और उसे खड़ा करना विश्लेषण से पहले आँकड़ा-संग्रहण की समस्या है।',
  'Departmental outcomes by question of law': 'विधि के प्रश्न के अनुसार विभागीय परिणाम',
  'This department’s own concluded proceedings, grouped by the legal question rather than by sector. Institutional memory — not judicial authority, and not citable as precedent.':
    'इसी विभाग की अपनी निपटाई गई कार्यवाहियाँ, क्षेत्र के बजाय विधिक प्रश्न के अनुसार समूहबद्ध। यह संस्थागत स्मृति है — न्यायिक प्राधिकार नहीं, और पूर्वनिर्णय के रूप में उद्धृत करने योग्य नहीं।',
  Concluded: 'निपटाई गई',
  Confirmed: 'पुष्ट',
  Reversed: 'निरस्त',
  'Success rate': 'सफलता दर',
  'withheld — n={0}': 'रोकी गई — n={0}',

  /* == Precedent Intelligence — weak positions and hierarchy ============= */
  'Where the department’s position is already weak': 'विभाग की स्थिति जहाँ पहले से कमजोर है',
  'Recorded on the case file at the time of assessment, not inferred by a model.':
    'निर्धारण के समय प्रकरण नस्ती पर दर्ज, किसी प्रारूप द्वारा अनुमानित नहीं।',
  'Documentation gap': 'दस्तावेजी कमी',
  'Precedent unfavourable': 'पूर्वनिर्णय प्रतिकूल',
  'Median age': 'मध्यक आयु',
  'Forum hierarchy, from the position of a Maharashtra authority':
    'न्यायमंच अनुक्रम, महाराष्ट्र के प्राधिकारी की दृष्टि से',
  'Binding weight is relative to the deciding authority. The same judgment carries different weight for an officer in another State, which is why jurisdiction is modelled rather than assumed.':
    'बाध्यकारी भार निर्णय करने वाले प्राधिकारी के सापेक्ष होता है। वही निर्णय दूसरे राज्य के अधिकारी के लिए भिन्न भार रखता है, इसीलिए अधिकारिता को मान लेने के बजाय उसका प्रारूप बनाया गया है।',
  'Not binding': 'बाध्यकारी नहीं',
  'Status classifications': 'स्थिति वर्गीकरण',
  'A precedent under challenge is worse than none — relying on it creates exposure the officer did not know they had.':
    'चुनौती के अधीन पूर्वनिर्णय न होने से भी बुरा है — उस पर भरोसा करने से ऐसी जोखिम राशि बनती है जिसका अधिकारी को पता ही नहीं था।',
  'No case citation on this screen is generated. Where a holding was confirmed but the case name was not, the name is left blank. A fabricated citation inside an issued notice makes the notice defective and the platform indefensible, so the model is not permitted to supply one.':
    'इस पर्दे का कोई भी प्रकरण संदर्भ निर्मित नहीं है। जहाँ निर्णय-सार पुष्ट हुआ किंतु प्रकरण का नाम नहीं, वहाँ नाम रिक्त छोड़ा गया है। जारी नोटिस के भीतर गढ़ा गया संदर्भ नोटिस को त्रुटिपूर्ण और मंच को अरक्षणीय बना देता है, इसलिए प्रारूप को ऐसा संदर्भ देने की अनुमति नहीं है।'
})
