import { registerMessages } from '../../locale.js'

/**
 * Hindi — Precedent Intelligence and Litigation Intelligence.
 *
 *   authority            → न्यायनिर्णय
 *   posture              → स्थिति-वर्ग
 *   persuasive           → मार्गदर्शक (as against बाध्यकारी, binding)
 *   forum                → मंच
 *   amount in dispute    → विवादित राशि
 *   appeal ladder        → अपील सीढ़ी
 *   confirmed / reversed / remanded → कायम / निरस्त / पुनर्विचारार्थ वापस
 *   weak position        → दुर्बल स्थिति
 *   documentation gap    → दस्तावेज़ों की कमी
 *
 * “Question of law” is विधि-प्रश्न. Section and notification identifiers stay
 * in Latin — Section 168A, 56/2023-CT — as they are cited in orders.
 */
registerMessages('hi', {
  /* == Precedent Intelligence — the question and its exposure =========== */
  'Authorities favouring the department': 'विभाग के पक्ष में न्यायनिर्णय',
  'of {0} authorities on record — {1} persuasive only':
    'अभिलेख के {0} न्यायनिर्णयों में से — {1} केवल मार्गदर्शक',
  'of {0} — {1} favour the assessee, {2} undecided':
    '{0} में से — {1} करदाता के पक्ष में, {2} अनिर्णीत',
  'Exposure riding on the question': 'इस प्रश्न पर टिकी जोखिम राशि',
  '₹ Cr across {0} of {1} contested proceedings':
    'विवादित {1} में से {0} कार्यवाहियों में मिलाकर ₹ करोड़',
  'Nearest deadline among them': 'उनमें निकटतम समय-सीमा',
  'None live': 'एक भी जीवित नहीं',
  'every affected proceeding is already time-barred':
    'प्रभावित प्रत्येक कार्यवाही पहले ही कालातीत हो चुकी है',
  'days · {0} of {1} fall due within 90 days': 'दिन · {1} में से {0} 90 दिनों में देय',

  /* == Precedent Intelligence — posture ================================= */
  'What may be done with each authority today': 'आज प्रत्येक न्यायनिर्णय का क्या किया जा सकता है',
  'Every authority on this question sits in exactly one posture. The posture, not the outcome, decides whether it can be relied on in a notice.':
    'इस प्रश्न पर प्रत्येक न्यायनिर्णय ठीक एक ही स्थिति-वर्ग में बैठता है। नोटिस में उस पर भरोसा किया जा सकता है या नहीं, यह परिणाम नहीं बल्कि स्थिति-वर्ग तय करता है।',
  '{0} of {1} authorities': '{1} न्यायनिर्णयों में से {0}',
  'Ordered by the forum, not by date or similarity. Authority is law and does not narrow with the filter bar — only the caseload below it does. Where a case name could not be established from a published source it is left blank rather than invented.':
    'तिथि या समानता से नहीं, मंच के अनुसार क्रम। न्यायनिर्णय विधि है और फ़िल्टर पट्टी से सीमित नहीं होता — केवल नीचे का कार्यभार सीमित होता है। जहाँ प्रकाशित स्रोत से प्रकरण का नाम स्थापित नहीं हो सका, वहाँ उसे गढ़ने के बजाय रिक्त छोड़ा गया है।',
  'Forum — rank {0} of {1}': 'मंच — {1} में से क्रम {0}',
  'Rank {0} of {1}': '{1} में से क्रम {0}',
  'Whether it still stands': 'वह अब भी टिका है या नहीं',
  'This tab states the rules by which authority is weighted. They are law, and they are the same in every division and for every sector.':
    'न्यायनिर्णय को किन नियमों से भार दिया जाता है, यह टैब वही बताता है। वे विधि हैं, और प्रत्येक विभाग तथा प्रत्येक क्षेत्र के लिए वही हैं।',

  /* == Precedent Intelligence — which notification binds ================ */
  'The notification each deadline rests on': 'प्रत्येक समय-सीमा जिस अधिसूचना पर टिकी है',
  'Not attributed to a contested notification': 'किसी विवादित अधिसूचना से नहीं जोड़ी गई',
  'Notice already issued — the order clock rests on the extension':
    'नोटिस पहले ही जारी — आदेश की घड़ी अवधि-विस्तार पर टिकी है',
  'No notice yet — the window to issue at all rests on it':
    'अभी नोटिस नहीं — नोटिस जारी करने का कालपट ही उस पर टिका है',
  'Already past the binding date on the extended clock':
    'विस्तारित घड़ी की बाध्यकारी तिथि भी बीत चुकी',
  '{0} · ₹{1} Cr': '{0} · ₹{1} करोड़',
  '{0} of {1} proceedings · ₹{2} Cr': '{1} में से {0} कार्यवाहियाँ · ₹{2} करोड़',
  'Deadline that binds': 'बाध्यकारी समय-सीमा',
  'Days left': 'शेष दिन',

  /* == Precedent Intelligence — departmental record ===================== */
  'Departmental outcome history is computed once over the whole register by the precedent engine; a division-level version would be a second computation of the same figure, and the two would eventually disagree.':
    'विभागीय परिणामों का इतिहास पूर्वनिर्णय यंत्र द्वारा पूरी पंजी पर एक ही बार परिकलित होता है; विभाग-स्तरीय संस्करण उसी आँकड़े की दूसरी गणना होगी, और अंततः दोनों में मतभेद हो जाएगा।',
  '{0} of {1} proceedings on the register have concluded and carry an outcome — {2}%. Of those, {3} were confirmed, {4} reversed and {5} remanded. Every proceeding still pending contributes nothing to this record until it concludes.':
    'पंजी की {1} में से {0} कार्यवाहियाँ निपट चुकी हैं और उनका परिणाम है — {2}%। उनमें से {3} कायम, {4} निरस्त और {5} पुनर्विचारार्थ वापस। अब भी लंबित प्रत्येक कार्यवाही निपटने तक इस अभिलेख में कुछ नहीं जोड़ती।',
  'Still pending': 'अब भी लंबित',
  'The withheld cells are the point. Each states the concluded count that produced it, so an officer can see exactly how far short of the threshold the record falls rather than being handed a rate that the sample cannot carry.':
    'रोके गए खाने ही यहाँ मुख्य बात हैं। प्रत्येक खाना उस निपटी संख्या को बताता है जिससे वह बना, ताकि नमूना जिस दर को नहीं उठा सकता वह थमाने के बजाय, अभिलेख सीमा से कितना कम पड़ता है यह अधिकारी को ठीक-ठीक दिखे।',
  'These rows are grouped by the issue category recorded on the case file. The questions of law on the first tab are held separately and nothing in the record joins the two, so this module cannot say how the department has fared on the Section 168A question specifically. That is a data-capture gap — outcomes are not captured against the question that decided them — and it is stated rather than bridged with an assumed mapping.':
    'ये पंक्तियाँ प्रकरण नस्ती पर दर्ज मुद्दा-श्रेणी के अनुसार समूहित हैं। पहले टैब के विधि-प्रश्न अलग रखे जाते हैं और अभिलेख में इन दोनों को जोड़ने वाला कुछ नहीं है, इसलिए Section 168A के प्रश्न पर विभाग का प्रदर्शन कैसा रहा, यह यह मॉड्यूल नहीं बता सकता। यह आँकड़ा-संग्रह की कमी है — परिणाम उस प्रश्न के सापेक्ष दर्ज नहीं होते जिसने उन्हें तय किया — और उसे किसी मानी हुई जोड़ से पाटने के बजाय स्पष्ट रूप से बताया गया है।',
  'Recorded on the case file at the time of assessment, not inferred by a model. Each count is shown against the proceedings on that issue, because three weak files out of four is a different problem from three out of forty.':
    'निर्धारण के समय प्रकरण नस्ती पर दर्ज, किसी प्रारूप द्वारा निकाला गया अनुमान नहीं। प्रत्येक संख्या उस मुद्दे की कार्यवाहियों के सापेक्ष दिखाई गई है, क्योंकि चार में से तीन दुर्बल नस्तियाँ चालीस में से तीन से भिन्न समस्या हैं।',

  /* == Litigation Intelligence — headline =============================== */
  'Pending proceedings, order outcomes and exposure tracked through the appeal stages — how much of the amount in dispute is still contestable, where in the ladder it sits, and how much of it rides on a position the department itself has recorded as weak.':
    'लंबित कार्यवाहियाँ, आदेशों के परिणाम और अपील चरणों के आर-पार अनुसरित जोखिम राशि — विवादित राशि में से कितनी अब भी लड़ी जा सकती है, वह सीढ़ी में कहाँ खड़ी है, और उसमें से कितनी विभाग द्वारा ही दुर्बल दर्ज की गई स्थिति पर टिकी है।',
  'litigation proceedings': 'वाद-कार्यवाहियाँ',
  'of {0} proceedings in scope — {1} concluded': 'दायरे की {0} कार्यवाहियों में से — {1} निपटीं',
  'Exposure still under appeal': 'अब भी अपील में जोखिम राशि',
  '₹ Cr of ₹{0} Cr in scope · ₹{1} Cr on the register statewide':
    'दायरे के ₹{0} करोड़ में से ₹ करोड़ · राज्यव्यापी पंजी पर ₹{1} करोड़',
  'Orders reversed at appeal': 'अपील में निरस्त आदेश',
  'of {0} concluded — {1} confirmed, {2} remanded · ₹{3} Cr reversed':
    'निपटी {0} में से — {1} कायम, {2} पुनर्विचारार्थ वापस · ₹{3} करोड़ निरस्त',
  'Exposure at a weak position': 'दुर्बल स्थिति पर जोखिम राशि',
  '₹ Cr — {0}% of the amount in dispute, across {1} of {2} proceedings':
    '₹ करोड़ — विवादित राशि का {0}%, {2} में से {1} कार्यवाहियों में मिलाकर',
  'High-value pending': 'उच्च मूल्य की लंबित',
  'over ₹50L — ₹{0} Cr, {1}% of the exposure still under appeal':
    '₹50 लाख से अधिक — ₹{0} करोड़, अब भी अपील में जोखिम राशि का {1}%',

  /* == Litigation Intelligence — why no blended rate ==================== */
  'No blended success rate is stated on this screen — {0} of {1} proceedings in scope have concluded and carry an outcome.':
    'इस पर्दे पर कोई मिश्रित सफलता दर नहीं दी गई — दायरे की {1} में से {0} कार्यवाहियाँ निपट चुकी हैं और उनका परिणाम है।',
  'A single percentage computed across seven different questions of law is a generalisation wearing a statistic: it reads as evidence about the case in front of the officer and is nothing of the kind. Outcomes are therefore reported as counts against their denominator. Where the department’s record is thick enough to carry a rate, it is stated per question of law — and withheld with the concluded count shown where it is not — in Precedent Intelligence, which owns that gate.':
    'सात भिन्न विधि-प्रश्नों पर मिलाकर निकाला गया एक ही प्रतिशत आँकड़े का वस्त्र पहने सामान्यीकरण है: वह अधिकारी के सामने रखे प्रकरण के बारे में प्रमाण-सा पढ़ा जाता है, जबकि वह कुछ भी वैसा नहीं है। इसलिए परिणाम अपने हर के सापेक्ष संख्याओं के रूप में बताए जाते हैं। जहाँ विभाग का अभिलेख किसी दर को उठाने भर घना है, वहाँ वह विधि-प्रश्न के अनुसार बताया जाता है — और जहाँ नहीं, वहाँ निपटी संख्या दिखाकर रोक लिया जाता है — यह पूर्वनिर्णय इंटेलिजेंस में, जिसके पास वह अधिकार है।',

  /* == Litigation Intelligence — ladder, ageing, issues ================== */
  'Where the exposure sits in the appeal ladder': 'जोखिम राशि अपील सीढ़ी में कहाँ खड़ी है',
  'First appeal, second appeal, then the three ways a proceeding ends. Exposure is the amount in dispute at each rung, as a share of ₹{0} Cr in scope.':
    'प्रथम अपील, द्वितीय अपील, और फिर कार्यवाही समाप्त होने के तीन मार्ग। जोखिम राशि अर्थात प्रत्येक पायदान की विवादित राशि, दायरे के ₹{0} करोड़ के अंश के रूप में।',
  'Amount in dispute': 'विवादित राशि',
  'Amount in dispute (₹ Cr)': 'विवादित राशि (₹ करोड़)',
  'Share of exposure': 'जोखिम राशि में अंश',
  'Weak position': 'दुर्बल स्थिति',
  'Case ageing against the money it holds': 'प्रकरण की आयु, उसमें फँसी राशि के सापेक्ष',
  'Bars are the amount in dispute, not the number of cases — an old case decides nothing until you know what is riding on it.':
    'स्तंभ विवादित राशि हैं, प्रकरणों की संख्या नहीं — उस पर क्या टिका है यह जाने बिना पुराना प्रकरण कुछ भी तय नहीं करता।',
  '₹{0} Cr · {1}%': '₹{0} करोड़ · {1}%',
  'Legal issues, by amount at stake and how they have ended':
    'विधिक मुद्दे — दाँव पर लगी राशि और वे कैसे समाप्त हुए, इसके अनुसार',
  'Ranked by the money in dispute rather than by how often the issue appears. Outcomes are counts against the concluded total; no rate is computed here.':
    'मुद्दा कितनी बार आता है इसके बजाय विवादित राशि के अनुसार क्रम। परिणाम निपटी कुल संख्या के सापेक्ष आँकड़े हैं; यहाँ कोई दर परिकलित नहीं की गई।',
  'Legal issue': 'विधिक मुद्दा',
  Pending: 'लंबित',
  'Share of this issue’s exposure': 'इस मुद्दे की जोखिम राशि में अंश',
  '{0}% of ₹{1} Cr': '₹{1} करोड़ का {0}%',
  'Respects global district / division / sector / risk / date filters':
    'जिला / विभाग / क्षेत्र / जोखिम / तिथि के वैश्विक फ़िल्टर मानता है',

  /* == Litigation Intelligence — weak positions ========================== */
  'Where weak positions cluster, and what they cost':
    'दुर्बल स्थितियाँ कहाँ जमा होती हैं, और उनकी कीमत क्या है',
  'Positions recorded on the case file at assessment, weighted by the amount in dispute behind them':
    'निर्धारण के समय प्रकरण नस्ती पर दर्ज स्थितियाँ, उनके पीछे की विवादित राशि से भारित',
  '{0} of {1} proceedings in scope carry a position the department itself recorded as weak, and ₹{2} Cr — {3}% of the amount in dispute — sits behind them.':
    'दायरे की {1} में से {0} कार्यवाहियों में विभाग द्वारा ही दुर्बल दर्ज की गई स्थिति है, और उनके पीछे ₹{2} करोड़ — विवादित राशि का {3}% — खड़े हैं।',
  '{0} of {1} weak positions ({2}%) are documentation gaps, holding ₹{3} Cr. Recommend a refresher on evidence collection and case-file discipline for audit and assessment officers — this is the half the department can fix by itself, before a hearing rather than after one.':
    '{1} में से {0} दुर्बल स्थितियाँ ({2}%) दस्तावेज़ों की कमी हैं और उनमें ₹{3} करोड़ फँसे हैं। लेखापरीक्षा एवं निर्धारण अधिकारियों के लिए प्रमाण-संग्रह तथा प्रकरण-नस्ती अनुशासन पर पुनश्चर्या प्रशिक्षण की संस्तुति — यही वह आधा भाग है जिसे विभाग स्वयं, सुनवाई के बाद नहीं बल्कि उससे पहले ही ठीक कर सकता है।',
  '{0} of {1} weak positions ({2}%) are unfavourable precedent, holding ₹{3} Cr. Training does not move these: route them through the Legal Cell early for a distinguishing argument, or evaluate withdrawal where the authority is binding and against the department.':
    '{1} में से {0} दुर्बल स्थितियाँ ({2}%) प्रतिकूल पूर्वनिर्णय के कारण हैं और उनमें ₹{3} करोड़ फँसे हैं। प्रशिक्षण से ये नहीं हिलतीं: भेद दर्शाने वाले तर्क हेतु उन्हें जल्दी विधि प्रकोष्ठ के माध्यम से भेजें, या जहाँ न्यायनिर्णय बाध्यकारी और विभाग के विरुद्ध है वहाँ वापसी का मूल्यांकन करें।',

  /* == Precedent and litigation — short lines ============================ */
  'Weighted by the forum that gave the decision, not by how similar the facts look.':
    'निर्णय देने वाले मंच के अनुसार भार, तथ्य कितने समान दिखते हैं उसके अनुसार नहीं।',
  'Ordered by forum. Authority is law and does not narrow with the filters.':
    'मंच के अनुसार क्रम। न्यायनिर्णय विधि है और फ़िल्टर से सीमित नहीं होता।',
  'A rate drawn from two or three cases misleads rather than informs.':
    'दो-तीन प्रकरणों से निकाला गया दर सूचना देने के बजाय भ्रमित करता है।',
  'Only concluded proceedings carry an outcome. Pending ones contribute nothing.':
    'केवल निपटी कार्यवाहियों का परिणाम होता है। लंबित कुछ नहीं जोड़तीं।',
  'This department\'s own record, grouped by the legal question.':
    'इस विभाग का अपना अभिलेख, विधि-प्रश्न के अनुसार समूहित।',
  'The withheld cells are the point — each shows how far short the record falls.':
    'रोके गए खाने ही मुख्य हैं — प्रत्येक बताता है कि अभिलेख कितना कम पड़ता है।',
  'Grouped by the issue on the case file, which is not the question of law.':
    'प्रकरण नस्ती के मुद्दे के अनुसार समूहित, जो विधि-प्रश्न नहीं है।',
  'Recorded at assessment, not inferred — shown against its own denominator.':
    'निर्धारण के समय दर्ज, अनुमान नहीं — अपने ही हर के साथ दिखाया गया।',
  'Binding weight depends on the deciding authority, not on the wording.':
    'बाध्यकारी भार निर्णय देने वाले प्राधिकारी पर निर्भर, शब्दावली पर नहीं।',
  'No citation here is generated. An unconfirmed case name is left blank.':
    'यहाँ का कोई संदर्भ गढ़ा नहीं गया। अपुष्ट प्रकरण नाम रिक्त छोड़ा गया है।',
  'Exposure through the appeal ladder, and how much rests on a weak position.':
    'अपील सीढ़ी में जोखिम राशि, और उसमें से कितनी दुर्बल स्थिति पर टिकी है।',
  'No blended rate: outcomes are counts against their own denominator.':
    'कोई मिश्रित दर नहीं: परिणाम अपने हर के सापेक्ष आँकड़े हैं।',
  'Documentation gaps — the half the department can fix before a hearing.':
    'दस्तावेज़ों की कमी — सुनवाई से पहले विभाग स्वयं ठीक कर सकता है वह आधा भाग।',
  'Unfavourable precedent — training does not move these.':
    'प्रतिकूल पूर्वनिर्णय — प्रशिक्षण से ये नहीं हिलतीं।'
})
