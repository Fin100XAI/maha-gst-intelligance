import { registerMessages } from '../../locale.js'

/**
 * Hindi — Project Resources, Engine Stack, Extract Specification and
 * Official Statistics.
 *
 *   extract              → एक्सट्रैक्ट
 *   feed                 → स्रोत
 *   pointer              → संकेतक
 *   failure mode         → विफलता की रीति
 *   point-in-time        → नियत क्षण का
 *   seed                 → बीज
 *   grain                → विवरण-स्तर
 *   hop                  → चरण (an edge in the invoice chain)
 *   verdict              → निर्णय
 *   as-at date           → यथा-तिथि
 *
 * Form names, HTTP codes, licence names and column identifiers stay in Latin.
 */
registerMessages('hi', {
  /* == Project Resources — provenance ==================================== */
  'Published sources read on {0}': '{0} को पढ़े गए प्रकाशित स्रोत',
  'Point-in-time capture. The platform makes no network call for a figure, a model or a map.':
    'नियत क्षण का अंकन। आँकड़े, प्रारूप या मानचित्र के लिए मंच कोई नेटवर्क कॉल नहीं करता।',
  'Simulated at 1 modelled taxpayer per {0} registered dealers — no total here is a statewide figure.':
    'प्रत्येक {0} पंजीकृत व्यापारियों पर 1 प्रारूपित करदाता के अनुपात में अनुकरण — यहाँ का कोई भी योग राज्यव्यापी आँकड़ा नहीं है।',
  '{0} of {1} statutory, judicial and official sources carry a link to the publication that states them.':
    '{1} में से {0} सांविधिक, न्यायिक एवं शासकीय स्रोतों के साथ उन्हें बताने वाले प्रकाशन की कड़ी है।',
  '{0} binding in Maharashtra': '{0} महाराष्ट्र में बाध्यकारी',
  '{0} pointers held with no values': '{0} संकेतक, बिना किसी मान के रखे गए',
  '{0} state a failure mode': '{0} अपनी विफलता की रीति बताती हैं',
  '{0} licences, all open-source': '{0} लाइसेंस, सभी मुक्तस्रोत',
  '{0} classes of record, every one generated from a fixed seed. None of it describes a real taxpayer.':
    'अभिलेखों के {0} वर्ग, प्रत्येक एक नियत बीज से उत्पन्न। इनमें से कुछ भी किसी वास्तविक करदाता का वर्णन नहीं करता।',
  '{0} classes of fact, each verified against a published source read on {1}.':
    'तथ्यों के {0} वर्ग, प्रत्येक {1} को पढ़े गए प्रकाशित स्रोत से सत्यापित।',
  'The scale the simulated side is built at': 'अनुकरण वाला पक्ष जिस पैमाने पर बना है',
  'Modelled counts set against the published ones, so the gap is explicit rather than assumed away.':
    'प्रारूपित संख्याएँ प्रकाशित संख्याओं के सामने रखी गई हैं, ताकि अंतर मान लेकर ढकने के बजाय स्पष्ट रहे।',
  'One modelled taxpayer stands for roughly {0} real registered dealers. Every aggregate on every other screen is drawn from the modelled population and must be read at that scale.':
    'एक प्रारूपित करदाता लगभग {0} वास्तविक पंजीकृत व्यापारियों का प्रतिनिधित्व करता है। शेष प्रत्येक पर्दे का प्रत्येक समुच्चय प्रारूपित संख्या से लिया गया है और उसी पैमाने पर पढ़ा जाना चाहिए।',
  'The {0} published figures are held in Official Statistics':
    '{0} प्रकाशित आँकड़े आधिकारिक सांख्यिकी में रखे गए हैं',

  /* == Project Resources — authorities and sources ====================== */
  'The question these authorities bear on': 'ये न्यायनिर्णय जिस प्रश्न से संबंधित हैं',
  '{0} authorities, {1} of them decided and binding on a Maharashtra authority.':
    '{0} न्यायनिर्णय, जिनमें से {1} निर्णीत और महाराष्ट्र के प्राधिकारी पर बाध्यकारी हैं।',
  '{0} favour the department, {1} the assessee': '{0} विभाग के पक्ष में, {1} करदाता के',
  'Verified against published reports. Where only a holding could be confirmed, the case name is left blank rather than invented, and each row states the forum, whether it binds here and whether it still stands.':
    'प्रकाशित रिपोर्टों से सत्यापित। जहाँ केवल निष्कर्ष ही पुष्ट हो सका, वहाँ प्रकरण का नाम गढ़ने के बजाय रिक्त छोड़ा गया है, और प्रत्येक पंक्ति मंच कौन-सा है, वह यहाँ बाध्यकारी है या नहीं, और वह अब भी टिका है या नहीं, यह बताती है।',
  'Decided {0}': '{0} को निर्णीत',
  'Decision date not established': 'निर्णय की तिथि स्थापित नहीं',
  '{0} sources, from which {1} figures published by {2} publishers have been transcribed. The figures themselves are held in Official Statistics and appear nowhere else.':
    '{0} स्रोत, जिनसे {2} प्रकाशकों द्वारा प्रकाशित {1} आँकड़े उतारे गए हैं। आँकड़े स्वयं आधिकारिक सांख्यिकी में रखे गए हैं और अन्यत्र कहीं नहीं आते।',
  'Open Official Statistics': 'आधिकारिक सांख्यिकी खोलें',
  '{0} pointers, {1} figures inferred from them. The endpoints returned HTTP 403 when fetched, and guessing at their contents would have been worse than leaving them empty.':
    '{0} संकेतक, उनसे निकाले गए {1} आँकड़े। वे एंडपॉइंट लाने पर HTTP 403 लौटाते रहे, और उनकी सामग्री का अनुमान लगाना उन्हें रिक्त छोड़ने से बुरा होता।',
  'from {0} publishers, {1} with a source link': '{0} प्रकाशकों से, {1} स्रोत कड़ी सहित',
  'Read on': 'पढ़ने की तिथि',
  'point-in-time capture, not a live feed': 'नियत क्षण का अंकन, जीवित स्रोत नहीं',
  'Named but not read': 'नाम लिए गए, पर पढ़े नहीं गए',
  'carried with no figures attached': 'बिना कोई आँकड़ा जोड़े रखे गए',
  'Demonstration scale': 'प्रदर्शन का पैमाना',
  '1 : {0}': '1 : {0}',
  'modelled taxpayer to registered dealer': 'प्रारूपित करदाता से पंजीकृत व्यापारी',
  'These {0} figures are never mixed into a computed total':
    'ये {0} आँकड़े किसी परिकलित योग में कभी नहीं मिलाए जाते',
  'No figure on this page is combined with a modelled one, and no modelled record is presented anywhere as an observation. Nothing here is fetched at run time: each figure was read by hand from the publication it links to on {0}, and only an edit to the source file can change it.':
    'इस पृष्ठ का कोई आँकड़ा किसी प्रारूपित आँकड़े से नहीं जोड़ा गया, और कोई प्रारूपित अभिलेख कहीं भी प्रेक्षण के रूप में प्रस्तुत नहीं है। यहाँ कुछ भी चलते समय नहीं लाया जाता: प्रत्येक आँकड़ा {0} को, जिस प्रकाशन से वह जुड़ा है वहीं से हाथ से पढ़ा गया, और उसे केवल स्रोत नस्ती में संपादन ही बदल सकता है।',
  '{0} figures over {1} scopes, read on {2}. Each links to the publication that states it and carries the exact date it speaks to.':
    '{1} दायरों पर फैले {0} आँकड़े, {2} को पढ़े गए। प्रत्येक उसे बताने वाले प्रकाशन से जुड़ा है और वह जिस तिथि की बात करता है वह ठीक तिथि साथ रखता है।',
  'speaks to {0}': '{0} की बात करता है',
  '{0} sources named as authoritative but not read into the platform. Listed with no figures attached — an unread source gets a link, never an estimate.':
    'प्रामाणिक बताए गए पर मंच में न पढ़े गए {0} स्रोत। बिना कोई आँकड़ा जोड़े सूचीबद्ध — अपठित स्रोत को कड़ी मिलती है, अनुमान कभी नहीं।',
  'A figure with no publication that states it does not belong on this page. A figure republished for a period other than the one it was issued for does not either — the period and the as-at date are what tell an officer whether a number is still the current one.':
    'जिसे बताने वाला कोई प्रकाशन ही न हो, वह आँकड़ा इस पृष्ठ पर नहीं आता। और जिस अवधि के लिए वह जारी हुआ उससे भिन्न अवधि के लिए पुनः प्रकाशित आँकड़ा भी नहीं — कोई संख्या अब भी चालू है या नहीं, यह अधिकारी को अवधि और यथा-तिथि ही बताती हैं।',

  /* == Engine Stack ===================================================== */
  '{0} of {1} state the way they fail. A method whose failure mode is not stated is a method nobody can audit — and each names the screen that spends it, so a disputed figure can be traced to the method behind it.':
    '{1} में से {0} विधियाँ बताती हैं कि वे किस तरह विफल होती हैं। जिस विधि की विफलता की रीति बताई ही न गई हो, उसकी जाँच कोई नहीं कर सकता — और प्रत्येक विधि उस पर्दे का नाम लेती है जो उसे खर्च करता है, ताकि विवादित आँकड़े का सूत्र उसके पीछे की विधि तक जोड़ा जा सके।',
  'Used by': 'प्रयोक्ता',
  '{0} packages under {1} licences, every version pinned. The platform makes no call to the open internet for its figures, models or maps, and runs entirely within the department’s own infrastructure.':
    '{1} लाइसेंसों के अंतर्गत {0} पैकेज, प्रत्येक संस्करण नियत। अपने आँकड़ों, प्रारूपों या मानचित्रों के लिए मंच खुले इंटरनेट को कोई कॉल नहीं करता, और पूरी तरह विभाग के अपने अवसंरचना के भीतर चलता है।',
  'Under judicial challenge': 'न्यायिक चुनौती के अधीन',
  'Named by the extract': 'एक्सट्रैक्ट द्वारा नामित',
  'of {0}, across {1} requested columns': '{0} में से, माँगे गए {1} स्तंभों में',
  'What the technique labels mean': 'तकनीक के चिह्नों का अर्थ',
  'Every engine below carries one or more of these. The label is not decoration — it states what the engine needs before it can run.':
    'नीचे का प्रत्येक यंत्र इनमें से एक या अधिक चिह्न रखता है। यह चिह्न सजावट नहीं — यह बताता है कि चलने से पहले यंत्र को क्या चाहिए।',
  '{0} engines': '{0} यंत्र',
  '{0} requested columns name this engine, in {1} of the {2} extract files':
    'माँगे गए {0} स्तंभ इस यंत्र का नाम लेते हैं, {2} में से {1} एक्सट्रैक्ट नस्तियों में',
  'No requested column in the extract names this engine':
    'एक्सट्रैक्ट का कोई माँगा गया स्तंभ इस यंत्र का नाम नहीं लेता',
  'Hops present': 'चरण उपलब्ध',
  'Hops partial': 'चरण अधूरे',
  'held at the wrong grain': 'गलत विवरण-स्तर पर रखे गए',
  'Hops absent': 'चरण अनुपस्थित',
  'every cross-entity capability fails here': 'अंतर-इकाई प्रत्येक क्षमता यहाँ विफल होती है',
  '{0}. {1}': '{0}. {1}',
  'Priority {0} of {1}': '{1} में से प्राथमिकता {0}',
  'Every engine not yet built, and the extract files that would supply it':
    'अब तक न बना प्रत्येक यंत्र, और उसे आपूर्ति करने वाली एक्सट्रैक्ट नस्तियाँ',
  '{0} of {1} engines are partial or blocked. Column counts are read from the extract specification, which states engine by engine what each field is for.':
    '{1} में से {0} यंत्र अधूरे या अवरुद्ध हैं। स्तंभों की संख्याएँ एक्सट्रैक्ट विनिर्देश से पढ़ी गई हैं, जो यंत्रवार बताता है कि प्रत्येक क्षेत्र किसलिए है।',
  Engine: 'यंत्र',
  Verdict: 'निर्णय',
  'Columns requested': 'माँगे गए स्तंभ',
  'Extract files': 'एक्सट्रैक्ट नस्तियाँ',
  None: 'एक भी नहीं',

  /* == Extract Specification ============================================ */
  'Open the field-level extract specification': 'क्षेत्र-स्तरीय एक्सट्रैक्ट विनिर्देश खोलें',
  'Names to map': 'जोड़ने योग्य नाम',
  '{0} names to map': 'जोड़ने योग्य {0} नाम',
  'of {0} — proposed, not official schema names':
    '{0} में से — प्रस्तावित, आधिकारिक स्कीमा के नाम नहीं',
  'Who owns which columns': 'कौन-से स्तंभ किसके अधीन',
  '{0} fields across {1} files, held by {2} owners. Each owner must be approached separately.':
    '{1} नस्तियों में फैले {0} क्षेत्र, {2} स्वामियों के पास। प्रत्येक स्वामी से अलग-अलग संपर्क करना होगा।',
  '{0} of {1} fields': '{1} में से {0} क्षेत्र',
  'The {0} fields that decide the outcome tier': 'परिणाम का स्तर तय करने वाले {0} क्षेत्र',
  'Without these the outcome engines learn who the taxpayer was, not why a demand held up. They cannot be collected retrospectively.':
    'इनके बिना परिणाम यंत्र इतना ही सीखते हैं कि करदाता कौन था, यह नहीं कि माँग क्यों टिकी। इन्हें भूतलक्षी रूप से एकत्र नहीं किया जा सकता।',
  'Engines {0}': 'यंत्र {0}',
  '{0} optional': '{0} वैकल्पिक',
  'Serves engines {0}': '{0} यंत्रों को आपूर्ति करता है',
  '{0} rules. Each of these has caused a real error in this build or would have, and each states the consequence rather than the preference.':
    '{0} नियम। इनमें से प्रत्येक ने इस संस्करण में वास्तविक त्रुटि पैदा की है या करता, और प्रत्येक वरीयता नहीं बल्कि परिणाम बताता है।',
  '{0} positions, to be settled before the request goes out rather than after the extract is built.':
    '{0} स्थितियाँ, जिन्हें एक्सट्रैक्ट बन जाने के बाद नहीं बल्कि माँग भेजने से पहले तय किया जाना है।',
  'Where a field corresponds to a published GST form, that form is named. {0} of the {1} column names are conventions proposed for this extract rather than official schema fields, and are marked as such in the Column cell — map each of those to whatever the source system actually calls it rather than assuming the name exists.':
    'जहाँ कोई क्षेत्र किसी प्रकाशित GST प्रपत्र से मेल खाता है, वहाँ उस प्रपत्र का नाम दिया गया है। {1} में से {0} स्तंभ-नाम आधिकारिक स्कीमा क्षेत्र नहीं बल्कि इस एक्सट्रैक्ट हेतु प्रस्तावित संकेत हैं, और स्तंभ खाने में वैसा ही अंकित है — उस नाम के अस्तित्व को मान लेने के बजाय उनमें से प्रत्येक को उसी नाम से जोड़ें जिससे स्रोत प्रणाली उसे वास्तव में पुकारती है।',

  /* == Project resources — short lines ============================ */
  'The law, judgments, published figures and methods this platform relies on.':
    'यह मंच जिन पर निर्भर है वे विधि, न्यायनिर्णय, प्रकाशित आँकड़े और विधियाँ।',
  'Read every aggregate on every other screen at this scale.':
    'शेष प्रत्येक पर्दे का प्रत्येक समुच्चय इसी पैमाने पर पढ़ें।',
  'Verified against published reports. An unconfirmed case name is left blank.':
    'प्रकाशित रिपोर्टों से सत्यापित। अपुष्ट प्रकरण नाम रिक्त छोड़ा गया है।',
  'The figures themselves are held in Official Statistics, nowhere else.':
    'आँकड़े स्वयं आधिकारिक सांख्यिकी में रखे गए हैं, अन्यत्र कहीं नहीं।',
  'The endpoints returned HTTP 403, so no figure was inferred from them.':
    'वे एंडपॉइंट HTTP 403 लौटाते रहे, इसलिए उनसे कोई आँकड़ा नहीं निकाला गया।',
  'A method whose failure mode is not stated is one nobody can audit.':
    'जिस विधि की विफलता की रीति बताई न गई हो, उसकी जाँच कोई नहीं कर सकता।',
  'Every version pinned. No call to the open internet at run time.':
    'प्रत्येक संस्करण नियत। चलते समय खुले इंटरनेट को कोई कॉल नहीं।',

  /* == Data resources — short lines ============================ */
  'Published figures, with their source, period and the date they were read.':
    'प्रकाशित आँकड़े, उनके स्रोत, अवधि और पढ़ने की तिथि सहित।',
  'The modelled scale, set against the published one.':
    'प्रारूपित पैमाना, प्रकाशित पैमाने के सामने रखा गया।',
  'No published figure is ever mixed with a modelled one.':
    'कोई प्रकाशित आँकड़ा किसी प्रारूपित आँकड़े से कभी नहीं मिलाया जाता।',
  'A figure with no publication behind it does not belong on this page.':
    'जिसके पीछे प्रकाशन नहीं, वह आँकड़ा इस पृष्ठ पर नहीं आता।',
  'Fifteen engines against the fields the department can supply today.':
    'विभाग आज जो क्षेत्र दे सकता है उनके सापेक्ष पंद्रह यंत्र।',
  'Four additions to the extract, in the order that unlocks most.':
    'एक्सट्रैक्ट में चार वृद्धियाँ, सर्वाधिक खोलने वाले क्रम में।',
  'The column list for the 500-case pilot, addressed to GSTN, NIC and divisions.':
    '500-प्रकरण पायलट हेतु स्तंभ सूची, GSTN, NIC एवं संभागों को संबोधित।',
  'Proposed names are marked — map each to what the source system calls it.':
    'प्रस्तावित नाम अंकित हैं — प्रत्येक को स्रोत प्रणाली जिस नाम से पुकारती है उससे जोड़ें।'
})
