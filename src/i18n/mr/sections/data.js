import { registerMessages } from '../../locale.js'

/**
 * Marathi — Project Resources, Engine Stack, Extract Specification and
 * Official Statistics.
 *
 *   extract              → उतारा
 *   feed                 → स्रोत
 *   pointer              → निर्देश
 *   failure mode         → अपयशाची पद्धत
 *   point-in-time        → ठराविक क्षणीचे
 *   seed                 → बीज
 *   grain                → तपशील पातळी
 *   hop                  → टप्पा (an edge in the invoice chain)
 *   verdict              → निर्णय
 *   as-at date           → रोजीची तारीख
 *
 * Form names, HTTP codes, licence names and column identifiers stay in Latin.
 */
registerMessages('mr', {
  /* == Project Resources — provenance ==================================== */
  'Published sources read on {0}': '{0} रोजी वाचलेले प्रकाशित स्रोत',
  'Point-in-time capture. The platform makes no network call for a figure, a model or a map.':
    'ठराविक क्षणीचे टिपण. आकडा, प्रारूप किंवा नकाशा यांसाठी मंच कोणताही नेटवर्क कॉल करत नाही.',
  'Simulated at 1 modelled taxpayer per {0} registered dealers — no total here is a statewide figure.':
    'प्रत्येक {0} नोंदणीकृत व्यापाऱ्यांमागे 1 प्रारूपित करदाता या प्रमाणात नक्कल — इथला कोणताही एकूण आकडा राज्यव्यापी आकडा नाही.',
  '{0} of {1} statutory, judicial and official sources carry a link to the publication that states them.':
    '{1} पैकी {0} सांविधिक, न्यायिक व शासकीय स्रोतांसोबत ते सांगणाऱ्या प्रकाशनाची कडी दिली आहे.',
  '{0} binding in Maharashtra': '{0} महाराष्ट्रात बंधनकारक',
  '{0} pointers held with no values': '{0} निर्देश, कोणत्याही मूल्यांशिवाय ठेवलेले',
  '{0} state a failure mode': '{0} त्यांची अपयशाची पद्धत सांगतात',
  '{0} licences, all open-source': '{0} परवाने, सर्व मुक्तस्रोत',
  '{0} classes of record, every one generated from a fixed seed. None of it describes a real taxpayer.':
    'नोंदींचे {0} वर्ग, प्रत्येक ठराविक बीजापासून तयार केलेला. यांपैकी काहीही खऱ्या करदात्याचे वर्णन करत नाही.',
  '{0} classes of fact, each verified against a published source read on {1}.':
    'वस्तुस्थितींचे {0} वर्ग, प्रत्येक {1} रोजी वाचलेल्या प्रकाशित स्रोताशी पडताळलेला.',
  'The scale the simulated side is built at': 'नक्कल केलेली बाजू ज्या प्रमाणावर उभी आहे ते',
  'Modelled counts set against the published ones, so the gap is explicit rather than assumed away.':
    'प्रारूपित संख्या प्रकाशित संख्यांसमोर मांडल्या आहेत, जेणेकरून फरक गृहीत धरून झाकण्याऐवजी उघड राहील.',
  'One modelled taxpayer stands for roughly {0} real registered dealers. Every aggregate on every other screen is drawn from the modelled population and must be read at that scale.':
    'एक प्रारूपित करदाता अंदाजे {0} खऱ्या नोंदणीकृत व्यापाऱ्यांचे प्रतिनिधित्व करतो. इतर प्रत्येक पडद्यावरील प्रत्येक एकत्रित आकडा प्रारूपित संख्येतून काढलेला असून त्याच प्रमाणावर वाचला पाहिजे.',
  'The {0} published figures are held in Official Statistics':
    '{0} प्रकाशित आकडे अधिकृत आकडेवारीमध्ये ठेवले आहेत',

  /* == Project Resources — authorities and sources ====================== */
  'The question these authorities bear on': 'हे न्यायनिर्णय ज्या प्रश्नाशी संबंधित आहेत तो',
  '{0} authorities, {1} of them decided and binding on a Maharashtra authority.':
    '{0} न्यायनिर्णय, त्यांपैकी {1} निर्णीत असून महाराष्ट्रातील प्राधिकरणावर बंधनकारक.',
  '{0} favour the department, {1} the assessee': '{0} विभागाच्या बाजूने, {1} करदात्याच्या',
  'Verified against published reports. Where only a holding could be confirmed, the case name is left blank rather than invented, and each row states the forum, whether it binds here and whether it still stands.':
    'प्रकाशित अहवालांशी पडताळलेले. जिथे केवळ निष्कर्षच निश्चित करता आला, तिथे प्रकरणाचे नाव रचून लिहिण्याऐवजी रिक्त ठेवले आहे, आणि प्रत्येक ओळ मंच कोणता, तो इथे बंधनकारक आहे का, आणि तो अजून टिकून आहे का हे सांगते.',
  'Decided {0}': '{0} रोजी निर्णीत',
  'Decision date not established': 'निर्णयाची तारीख निश्चित नाही',
  '{0} sources, from which {1} figures published by {2} publishers have been transcribed. The figures themselves are held in Official Statistics and appear nowhere else.':
    '{0} स्रोत, ज्यांतून {2} प्रकाशकांनी प्रसिद्ध केलेले {1} आकडे उतरवून घेतले आहेत. आकडे स्वतः अधिकृत आकडेवारीमध्ये ठेवले असून इतरत्र कुठेही येत नाहीत.',
  'Open Official Statistics': 'अधिकृत आकडेवारी उघडा',
  '{0} pointers, {1} figures inferred from them. The endpoints returned HTTP 403 when fetched, and guessing at their contents would have been worse than leaving them empty.':
    '{0} निर्देश, त्यांतून काढलेले {1} आकडे. ते पत्ते आणताना HTTP 403 परत आला, आणि त्यांच्या मजकुराचा अंदाज बांधणे हे ते रिकामे ठेवण्याहून वाईट ठरले असते.',
  'from {0} publishers, {1} with a source link': '{0} प्रकाशकांकडून, {1} स्रोत कडीसह',
  'Read on': 'वाचल्याची तारीख',
  'point-in-time capture, not a live feed': 'ठराविक क्षणीचे टिपण, जिवंत स्रोत नव्हे',
  'Named but not read': 'नाव घेतलेले, पण न वाचलेले',
  'carried with no figures attached': 'कोणतेही आकडे न जोडता ठेवलेले',
  'Demonstration scale': 'प्रात्यक्षिकाचे प्रमाण',
  '1 : {0}': '1 : {0}',
  'modelled taxpayer to registered dealer': 'प्रारूपित करदाता ते नोंदणीकृत व्यापारी',
  'These {0} figures are never mixed into a computed total':
    'हे {0} आकडे कोणत्याही मोजलेल्या एकूण रकमेत कधीही मिसळले जात नाहीत',
  'No figure on this page is combined with a modelled one, and no modelled record is presented anywhere as an observation. Nothing here is fetched at run time: each figure was read by hand from the publication it links to on {0}, and only an edit to the source file can change it.':
    'या पानावरील कोणताही आकडा प्रारूपित आकड्याशी जोडलेला नाही, आणि कोणतीही प्रारूपित नोंद कुठेही निरीक्षण म्हणून मांडलेली नाही. इथले काहीही चालताना आणले जात नाही: प्रत्येक आकडा {0} रोजी, ज्या प्रकाशनाशी तो जोडलेला आहे तिथून हाताने वाचला गेला, आणि तो केवळ स्रोत नस्तीत बदल केल्यानेच बदलू शकतो.',
  '{0} figures over {1} scopes, read on {2}. Each links to the publication that states it and carries the exact date it speaks to.':
    '{1} व्याप्तींवरील {0} आकडे, {2} रोजी वाचलेले. प्रत्येक आकडा तो सांगणाऱ्या प्रकाशनाशी जोडलेला असून तो ज्या तारखेविषयी बोलतो ती नेमकी तारीख त्यासोबत आहे.',
  'speaks to {0}': '{0} विषयी बोलतो',
  '{0} sources named as authoritative but not read into the platform. Listed with no figures attached — an unread source gets a link, never an estimate.':
    'अधिकृत म्हणून नाव घेतलेले पण मंचात न वाचलेले {0} स्रोत. कोणतेही आकडे न जोडता यादीत दिलेले — न वाचलेल्या स्रोताला कडी मिळते, अंदाज कधीही नाही.',
  'A figure with no publication that states it does not belong on this page. A figure republished for a period other than the one it was issued for does not either — the period and the as-at date are what tell an officer whether a number is still the current one.':
    'ज्याला सांगणारे प्रकाशनच नाही असा आकडा या पानावर बसत नाही. आणि ज्या कालावधीसाठी तो जारी झाला त्याहून वेगळ्या कालावधीसाठी पुन्हा प्रसिद्ध केलेला आकडाही बसत नाही — आकडा अजून चालू आहे का हे अधिकाऱ्याला कालावधी आणि रोजीची तारीख हेच सांगतात.',

  /* == Engine Stack ===================================================== */
  '{0} of {1} state the way they fail. A method whose failure mode is not stated is a method nobody can audit — and each names the screen that spends it, so a disputed figure can be traced to the method behind it.':
    '{1} पैकी {0} पद्धती त्या कशा अपयशी ठरतात ते सांगतात. जिची अपयशाची पद्धत सांगितलेली नाही अशी पद्धत कोणालाही तपासता येत नाही — आणि प्रत्येक पद्धत ती वापरणाऱ्या पडद्याचे नाव सांगते, जेणेकरून वादग्रस्त आकड्याचा माग त्यामागील पद्धतीपर्यंत काढता येईल.',
  'Used by': 'वापरणारे',
  '{0} packages under {1} licences, every version pinned. The platform makes no call to the open internet for its figures, models or maps, and runs entirely within the department’s own infrastructure.':
    '{1} परवान्यांखालील {0} संकुले, प्रत्येक आवृत्ती निश्चित केलेली. आपले आकडे, प्रारूपे किंवा नकाशे यांसाठी मंच खुल्या इंटरनेटला कोणताही कॉल करत नाही, आणि पूर्णपणे विभागाच्या स्वतःच्या पायाभूत सुविधांवर चालतो.',
  'Under judicial challenge': 'न्यायालयीन आव्हानाखाली',
  'Named by the extract': 'उताऱ्याने नाव घेतलेले',
  'of {0}, across {1} requested columns': '{0} पैकी, मागणी केलेल्या {1} स्तंभांमध्ये',
  'What the technique labels mean': 'तंत्राच्या खुणांचा अर्थ काय',
  'Every engine below carries one or more of these. The label is not decoration — it states what the engine needs before it can run.':
    'खालील प्रत्येक यंत्रावर यांपैकी एक किंवा अधिक खुणा आहेत. ही खूण सजावट नाही — ती यंत्र चालण्यापूर्वी त्याला काय लागते ते सांगते.',
  '{0} engines': '{0} यंत्रे',
  '{0} requested columns name this engine, in {1} of the {2} extract files':
    'मागणी केलेले {0} स्तंभ या यंत्राचे नाव घेतात, {2} पैकी {1} उतारा नस्त्यांमध्ये',
  'No requested column in the extract names this engine':
    'उताऱ्यातील मागणी केलेला एकही स्तंभ या यंत्राचे नाव घेत नाही',
  'Hops present': 'टप्पे उपलब्ध',
  'Hops partial': 'टप्पे अपुरे',
  'held at the wrong grain': 'चुकीच्या तपशील पातळीवर ठेवलेले',
  'Hops absent': 'टप्पे अनुपस्थित',
  'every cross-entity capability fails here': 'आंतर-संस्था प्रत्येक क्षमता इथे अपयशी ठरते',
  '{0}. {1}': '{0}. {1}',
  'Priority {0} of {1}': '{1} पैकी प्राधान्य {0}',
  'Every engine not yet built, and the extract files that would supply it':
    'अद्याप न बांधलेले प्रत्येक यंत्र, आणि त्याला पुरवठा करणाऱ्या उतारा नस्त्या',
  '{0} of {1} engines are partial or blocked. Column counts are read from the extract specification, which states engine by engine what each field is for.':
    '{1} पैकी {0} यंत्रे अपुरी किंवा अडलेली आहेत. स्तंभांच्या संख्या उतारा तपशीलावरून घेतल्या आहेत, जो यंत्रानुसार प्रत्येक क्षेत्र कशासाठी आहे ते सांगतो.',
  Engine: 'यंत्र',
  Verdict: 'निर्णय',
  'Columns requested': 'मागणी केलेले स्तंभ',
  'Extract files': 'उतारा नस्त्या',
  None: 'एकही नाही',

  /* == Extract Specification ============================================ */
  'Open the field-level extract specification': 'क्षेत्र-पातळीवरील उतारा तपशील उघडा',
  'Names to map': 'जुळवायची नावे',
  '{0} names to map': 'जुळवायची {0} नावे',
  'of {0} — proposed, not official schema names':
    '{0} पैकी — प्रस्तावित, अधिकृत आराखड्यातील नावे नव्हेत',
  'Who owns which columns': 'कोणते स्तंभ कोणाच्या मालकीचे',
  '{0} fields across {1} files, held by {2} owners. Each owner must be approached separately.':
    '{1} नस्त्यांमधील {0} क्षेत्रे, {2} मालकांकडे. प्रत्येक मालकाकडे स्वतंत्रपणे जावे लागेल.',
  '{0} of {1} fields': '{1} पैकी {0} क्षेत्रे',
  'The {0} fields that decide the outcome tier': 'निकालाचा स्तर ठरवणारी {0} क्षेत्रे',
  'Without these the outcome engines learn who the taxpayer was, not why a demand held up. They cannot be collected retrospectively.':
    'यांच्याशिवाय निकाल यंत्रे करदाता कोण होता एवढेच शिकतात, मागणी का टिकली हे नाही. ही माहिती पूर्वलक्ष्यी प्रभावाने गोळा करता येत नाही.',
  'Engines {0}': 'यंत्रे {0}',
  '{0} optional': '{0} ऐच्छिक',
  'Serves engines {0}': '{0} या यंत्रांना पुरवते',
  '{0} rules. Each of these has caused a real error in this build or would have, and each states the consequence rather than the preference.':
    '{0} नियम. यांपैकी प्रत्येकाने या आवृत्तीत खरी चूक घडवली आहे किंवा घडवली असती, आणि प्रत्येक नियम पसंती नव्हे तर परिणाम सांगतो.',
  '{0} positions, to be settled before the request goes out rather than after the extract is built.':
    '{0} भूमिका, ज्या उतारा तयार झाल्यानंतर नव्हे तर मागणी पाठवण्यापूर्वीच निश्चित करायच्या आहेत.',
  'Where a field corresponds to a published GST form, that form is named. {0} of the {1} column names are conventions proposed for this extract rather than official schema fields, and are marked as such in the Column cell — map each of those to whatever the source system actually calls it rather than assuming the name exists.':
    'जिथे एखादे क्षेत्र प्रकाशित GST नमुन्याशी जुळते, तिथे त्या नमुन्याचे नाव दिले आहे. {1} पैकी {0} स्तंभनावे ही अधिकृत आराखड्यातील क्षेत्रे नसून या उताऱ्यासाठी प्रस्तावित संकेत आहेत, आणि स्तंभ कप्प्यात तशी खूण केली आहे — ते नाव अस्तित्वात आहे असे गृहीत धरण्याऐवजी त्यांतील प्रत्येक नाव स्रोत प्रणाली प्रत्यक्षात ज्या नावाने ओळखते त्याच्याशी जुळवा.',

  /* == Project resources — short lines ============================ */
  'The law, judgments, published figures and methods this platform relies on.':
    'हा मंच ज्यावर अवलंबून आहे तो कायदा, न्यायनिर्णय, प्रकाशित आकडे आणि पद्धती.',
  'Read every aggregate on every other screen at this scale.':
    'इतर प्रत्येक पडद्यावरील प्रत्येक एकत्रित आकडा याच प्रमाणावर वाचा.',
  'Verified against published reports. An unconfirmed case name is left blank.':
    'प्रकाशित अहवालांशी पडताळलेले. निश्चित न झालेले प्रकरण नाव रिक्त ठेवले आहे.',
  'The figures themselves are held in Official Statistics, nowhere else.':
    'आकडे स्वतः अधिकृत आकडेवारीमध्ये ठेवले आहेत, इतरत्र कुठेही नाहीत.',
  'The endpoints returned HTTP 403, so no figure was inferred from them.':
    'ते पत्ते HTTP 403 परत करत होते, त्यामुळे त्यांवरून कोणताही आकडा काढलेला नाही.',
  'A method whose failure mode is not stated is one nobody can audit.':
    'जिची अपयशाची पद्धत सांगितलेली नाही अशी पद्धत कोणालाही तपासता येत नाही.',
  'Every version pinned. No call to the open internet at run time.':
    'प्रत्येक आवृत्ती निश्चित. चालताना खुल्या इंटरनेटला कोणताही कॉल नाही.',

  /* == Data resources — short lines ============================ */
  'Published figures, with their source, period and the date they were read.':
    'प्रकाशित आकडे, त्यांचा स्रोत, कालावधी आणि ते वाचल्याची तारीख यांसह.',
  'The modelled scale, set against the published one.':
    'प्रारूपित प्रमाण, प्रकाशित प्रमाणासमोर मांडलेले.',
  'No published figure is ever mixed with a modelled one.':
    'कोणताही प्रकाशित आकडा प्रारूपित आकड्याशी कधीही मिसळला जात नाही.',
  'A figure with no publication behind it does not belong on this page.':
    'ज्यामागे प्रकाशन नाही असा आकडा या पानावर बसत नाही.',
  'Fifteen engines against the fields the department can supply today.':
    'विभाग आज पुरवू शकेल त्या क्षेत्रांच्या तुलनेत पंधरा यंत्रे.',
  'Four additions to the extract, in the order that unlocks most.':
    'उताऱ्यात चार भर, सर्वाधिक खुले करणाऱ्या क्रमाने.',
  'The column list for the 500-case pilot, addressed to GSTN, NIC and divisions.':
    '500-प्रकरण प्रायोगिक टप्प्यासाठीची स्तंभ यादी, GSTN, NIC व विभागांना उद्देशून.',
  'Proposed names are marked — map each to what the source system calls it.':
    'प्रस्तावित नावे खुणावली आहेत — प्रत्येक नाव स्रोत प्रणाली ज्या नावाने ओळखते त्याच्याशी जुळवा.'
})
