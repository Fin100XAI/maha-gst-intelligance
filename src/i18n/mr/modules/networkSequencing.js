import { registerMessages } from '../../locale.js'

/**
 * Marathi — Network Intelligence (detection through to enforcement sequencing).
 *
 *   chain              → साखळी
 *   cluster            → गट
 *   node / entity      → घटक
 *   edge               → कडी
 *   bypass route       → बगल मार्ग
 *   cut point          → छेद बिंदू
 *   centrality         → केंद्रस्थता
 *   directed cycle     → दिशाबद्ध चक्र
 *   blockable          → रोखता येण्याजोगे
 *   utilised (credit)  → वापरलेले
 *   simultaneity       → एकाच वेळी कारवाई
 *   lead strength      → सुगाव्याची तीव्रता
 */
registerMessages('mr', {
  /* == Header and the framing figure ====================================== */
  'Fraud & Risk · Enforcement Sequencing': 'फसवणूक व जोखीम · अंमलबजावणी क्रमनिश्चिती',
  'Circular invoice chains, from detection through to action. The graph shows what was found; the tabs after it work out which entity actually stops the circulation, whether officers exist in every division the chain crosses, and what is lost when they cannot move on the same day.':
    'वर्तुळाकार बीजक साखळ्या, शोधापासून कारवाईपर्यंत. आलेख काय सापडले ते दाखवतो; त्यापुढील पानांत कोणता घटक प्रत्यक्षात परिचलन थांबवतो, साखळी ज्या प्रत्येक विभागातून जाते तिथे अधिकारी आहेत का, आणि ते एकाच दिवशी कारवाई करू शकले नाहीत तर काय गमावले जाते हे काढले आहे.',
  'A chain is one economic unit spanning several divisions, and every cluster here crosses at least one boundary. Filtering to a single division would truncate the chains at that boundary and make them appear to end — the same failure the pilot extract specification warns against — so chains are always shown whole.':
    'साखळी हा अनेक विभागांत पसरलेला एकच आर्थिक घटक असतो, आणि येथील प्रत्येक गट किमान एक सीमा ओलांडतो. एका विभागापुरते गाळल्यास साखळ्या त्या सीमेवर तुटतील आणि तिथेच संपल्यासारख्या दिसतील — पायलट एक्सट्रॅक्ट विनिर्देश ज्या चुकीबद्दल इशारा देते तीच ही चूक — म्हणून साखळ्या नेहमी संपूर्ण दाखवल्या जातात.',
  '{0} of credit in these chains has already been utilised and can no longer be blocked. {1} remains.':
    'या साखळ्यांतील {0} इतके श्रेय आधीच वापरले गेले आहे आणि ते आता रोखता येणार नाही. {1} शिल्लक आहे.',
  'That share was lost before detection, not through any decision taken since. It is stated first because it sets the scale of everything below: the sequencing decisions on this screen govern the remainder, and no amount of coordination recovers what has already moved through the chain. The largest available gain in network enforcement is earlier detection, not better choreography.':
    'तो वाटा शोध लागण्यापूर्वीच गमावला गेला, त्यानंतर घेतलेल्या कोणत्याही निर्णयामुळे नव्हे. तो प्रथम सांगितला आहे कारण तो खालील सर्व गोष्टींचे प्रमाण ठरवतो: या पडद्यावरील क्रमनिश्चितीचे निर्णय केवळ उर्वरित भागापुरते आहेत, आणि साखळीतून जे आधीच पुढे गेले आहे ते कितीही समन्वयाने परत मिळत नाही. नेटवर्क अंमलबजावणीतील सर्वात मोठा उपलब्ध लाभ हा आधी शोध लागणे हा आहे, अधिक चांगली आखणी नव्हे.',

  /* == Summary tiles ====================================================== */
  'Chains under analysis': 'विश्लेषणाधीन साखळ्या',
  '{0} span more than one division': '{0} एकाहून अधिक विभागांत पसरलेल्या',
  'Still blockable': 'अद्याप रोखता येण्याजोगे',
  '₹ Cr across all chains': '₹ कोटी — सर्व साखळ्या मिळून',
  'Nodes that would not stop the chain': 'साखळी न थांबवणारे घटक',
  'across {0} chains': '{0} साखळ्यांमध्ये',
  'Chains that cannot be closed at once': 'एकाच वेळी बंद करता न येणाऱ्या साखळ्या',
  '{0} Cr blockable, no officer in one division': '{0} कोटी रोखता येण्याजोगे, एका विभागात अधिकारी नाही',

  /* == The chain panel ==================================================== */
  '{0} — {1} entities': '{0} — {1} घटक',
  '{0} still blockable of {1} that moved through the chain · signal age {2} days':
    'साखळीतून गेलेल्या {1} पैकी {0} अद्याप रोखता येण्याजोगे · संकेताचे वय {2} दिवस',
  'Hide entities': 'घटक लपवा',
  'Show entities': 'घटक दाखवा',
  'Act here first': 'येथे प्रथम कारवाई करा',
  'division not on record': 'विभाग अभिलेखावर नाही',
  'Stops circulation': 'परिचलन थांबवते',
  'Lead strength {0}': 'सुगाव्याची तीव्रता {0}',
  '{0} of invoice value sits on the edges this entity is party to.':
    'हा घटक ज्या कड्यांचा पक्षकार आहे त्यांवर {0} इतके बीजक मूल्य आहे.',
  'No single effective cut': 'एकही परिणामकारक छेद नाही',
  'No single entity in this chain stops the circulation when removed. It has to be acted on as a group, or not at all.':
    'या साखळीतील एकही घटक काढल्याने परिचलन थांबत नाही. तिच्यावर गट म्हणूनच कारवाई करावी लागेल, अन्यथा नाहीच.',
  '{0} entity would NOT stop the chain': '{0} घटक साखळी थांबवणार नाही',
  'A route bypasses these entities, so the circulation continues without them. Acting here spends the element of surprise and changes nothing.':
    'एक मार्ग या घटकांना बगल देतो, त्यामुळे त्यांच्याशिवायही परिचलन चालू राहते. येथे कारवाई केल्याने अनपेक्षिततेचा फायदा वाया जातो आणि काहीही बदलत नाही.',
  'No bypass routes': 'बगल मार्ग नाहीत',
  'This chain is a closed loop with no chord. Removing any one entity breaks the circulation, so topology does not distinguish the targets — lead strength and value at stake decide.':
    'ही साखळी कोणत्याही आडव्या कडीशिवाय बंद वर्तुळ आहे. कोणताही एक घटक काढल्याने परिचलन तुटते, त्यामुळे रचना लक्ष्यांमध्ये फरक करत नाही — सुगाव्याची तीव्रता व पणाला लागलेले मूल्य हेच ठरवतात.',
  Entity: 'घटक',
  'Role in chain': 'साखळीतील भूमिका',
  'Value on its edges': 'त्याच्या कड्यांवरील मूल्य',
  'Lead strength': 'सुगाव्याची तीव्रता',
  'Removal stops chain?': 'काढल्याने साखळी थांबते?',
  'No — bypassed': 'नाही — बगल दिली जाते',

  /* == Jurisdictional span ================================================ */
  'Jurisdictional span of each chain': 'प्रत्येक साखळीची अधिकारक्षेत्रीय व्याप्ती',
  'Every one of these chains crosses a division boundary. The chain is one economic unit and several jurisdictional ones, and the department is organised along the second.':
    'यांपैकी प्रत्येक साखळी विभागाची सीमा ओलांडते. साखळी हा आर्थिक दृष्ट्या एकच घटक असून अधिकारक्षेत्रीय दृष्ट्या अनेक, आणि विभागाची रचना दुसऱ्यानुसार आहे.',
  '{0} divisions': '{0} विभाग',
  'Can be closed simultaneously': 'एकाच वेळी बंद करता येते',
  'Cannot be closed simultaneously': 'एकाच वेळी बंद करता येत नाही',
  blockable: 'रोखता येण्याजोगे',
  'No investigation officer is posted in {0}. This chain cannot be closed as a unit until one is — a deployment decision, not a scheduling one.':
    '{0} येथे कोणताही तपास अधिकारी नियुक्त नाही. तो होईपर्यंत ही साखळी एकसंध म्हणून बंद करता येणार नाही — हा नियुक्तीचा निर्णय आहे, नियोजनाचा नव्हे.',
  'Sequential lag': 'क्रमवार कारवाईतील विलंब',
  'Value lost to that lag': 'त्या विलंबामुळे गमावलेले मूल्य',
  'signal age {0}d': 'संकेताचे वय {0} दि.',

  /* == The cost of coordination failure =================================== */
  'What coordination failure actually costs': 'समन्वयातील अपयशाची प्रत्यक्ष किंमत',
  'Lost to sequential action': 'क्रमवार कारवाईमुळे गमावलेले',
  'If each chain were worked one division per week rather than on a single date.':
    'प्रत्येक साखळी एकाच तारखेला हाताळण्याऐवजी आठवड्याला एक विभाग या गतीने हाताळली असती तर.',
  'Already lost before detection': 'शोधापूर्वीच गमावलेले',
  'Utilised downstream and no longer blockable by any action.':
    'पुढील टप्प्यांत वापरले गेलेले आणि आता कोणत्याही कारवाईने रोखता न येणारे.',
  'The coordination loss is small, and it would be dishonest to present it as the headline. It is small for a specific reason: these chains are already {0} to {1} days old, and by that point the decay curve has flattened — most of what could move has moved, so a further week costs comparatively little. Simultaneity matters enormously on a chain detected in its first month and barely at all on one detected in its second year. The finding is therefore not "coordinate better" but "detect earlier", and the registration screen is where that is won.':
    'समन्वयामुळे होणारे नुकसान अल्प आहे, आणि ते ठळक निष्कर्ष म्हणून मांडणे अप्रामाणिक ठरेल. ते अल्प असण्याचे निश्चित कारण आहे: या साखळ्या आधीच {0} ते {1} दिवस जुन्या आहेत, आणि तोपर्यंत क्षय वक्र सपाट झालेला असतो — जे हलू शकत होते त्यातील बहुतांश हलून गेलेले असते, त्यामुळे आणखी एका आठवड्याची किंमत तुलनेने कमी असते. पहिल्या महिन्यात सापडलेल्या साखळीसाठी एकाच वेळी कारवाई अत्यंत महत्त्वाची असते आणि दुसऱ्या वर्षी सापडलेल्या साखळीसाठी जवळपास निरुपयोगी. त्यामुळे निष्कर्ष "अधिक चांगला समन्वय करा" हा नसून "आधी शोध घ्या" हा आहे, आणि ते नोंदणीच्या पडद्यावरच साध्य होते.',

  /* == Method notes ======================================================= */
  'How the cut point is decided': 'छेद बिंदू कसा ठरवला जातो',
  'Why not a centrality score': 'केंद्रस्थता गुणांक का नाही',
  'Centrality measures how important a node looks. It does not answer whether the circulation survives without it, and on a chain with a bypass route those two things point at different entities. The test used here is the direct one: remove the node and check whether a directed cycle still exists.':
    'केंद्रस्थता एखादा घटक किती महत्त्वाचा दिसतो हे मोजते. त्याच्याशिवाय परिचलन टिकते का याचे उत्तर ती देत नाही, आणि बगल मार्ग असलेल्या साखळीत या दोन गोष्टी वेगवेगळ्या घटकांकडे बोट दाखवतात. येथे वापरलेली चाचणी थेट आहे: घटक काढा आणि दिशाबद्ध चक्र अद्याप शिल्लक आहे का ते तपासा.',
  'Lead strength indicators': 'सुगाव्याच्या तीव्रतेचे निर्देशक',
  'A stated rule set, not a learned score. Each contribution is visible on the entity it applies to.':
    'हा स्पष्ट नमूद केलेला नियम संच आहे, शिकून काढलेला गुणांक नाही. प्रत्येक योगदान ज्या घटकाला लागू होते त्यावर दिसते.',
  'Base 0.20, capped at 0.95. No entity reaches certainty, because no combination of these indicators establishes one.':
    'आधार ०.२०, कमाल मर्यादा ०.९५. कोणताही घटक निश्चिततेपर्यंत पोहोचत नाही, कारण या निर्देशकांचे कोणतेही संयोजन निश्चितता सिद्ध करत नाही.',
  'This is a lead, not a finding': 'हा सुगावा आहे, निष्कर्ष नाही'
})
