import { registerMessages } from '../../locale.js'

/**
 * Marathi — Precedent Intelligence and Litigation Intelligence.
 *
 *   authority            → न्यायनिर्णय
 *   posture              → स्थिती-वर्ग
 *   persuasive           → मार्गदर्शक (as against बंधनकारक, binding)
 *   forum                → मंच
 *   amount in dispute    → वादग्रस्त रक्कम
 *   appeal ladder        → अपील शिडी
 *   confirmed / reversed / remanded → कायम / रद्द / पुनर्विचारार्थ परत
 *   weak position        → दुर्बल भूमिका
 *   documentation gap    → दस्तऐवजांतील त्रुटी
 *
 * “Question of law” is विधिप्रश्न. Section and notification identifiers stay
 * in Latin — Section 168A, 56/2023-CT — as they are cited in orders.
 */
registerMessages('mr', {
  /* == Precedent Intelligence — the question and its exposure =========== */
  'Authorities favouring the department': 'विभागाच्या बाजूने असलेले न्यायनिर्णय',
  'of {0} authorities on record — {1} persuasive only':
    'नोंदीवरील {0} न्यायनिर्णयांपैकी — {1} केवळ मार्गदर्शक',
  'of {0} — {1} favour the assessee, {2} undecided':
    '{0} पैकी — {1} करदात्याच्या बाजूने, {2} अनिर्णित',
  'Exposure riding on the question': 'या प्रश्नावर अवलंबून असलेली जोखीम रक्कम',
  '₹ Cr across {0} of {1} contested proceedings':
    'वादग्रस्त {1} पैकी {0} कार्यवाहींमध्ये मिळून ₹ कोटी',
  'Nearest deadline among them': 'त्यांतील सर्वात जवळची मुदत',
  'None live': 'एकही जिवंत नाही',
  'every affected proceeding is already time-barred':
    'प्रभावित प्रत्येक कार्यवाही आधीच कालबाह्य झाली आहे',
  'days · {0} of {1} fall due within 90 days': 'दिवस · {1} पैकी {0} 90 दिवसांत देय',

  /* == Precedent Intelligence — posture ================================= */
  'What may be done with each authority today': 'आज प्रत्येक न्यायनिर्णयाचे काय करता येईल',
  'Every authority on this question sits in exactly one posture. The posture, not the outcome, decides whether it can be relied on in a notice.':
    'या प्रश्नावरील प्रत्येक न्यायनिर्णय नेमक्या एकाच स्थिती-वर्गात बसतो. नोटिशीत त्यावर भिस्त ठेवता येईल का हे निकाल नव्हे, तर स्थिती-वर्ग ठरवतो.',
  '{0} of {1} authorities': '{1} न्यायनिर्णयांपैकी {0}',
  'Ordered by the forum, not by date or similarity. Authority is law and does not narrow with the filter bar — only the caseload below it does. Where a case name could not be established from a published source it is left blank rather than invented.':
    'तारीख किंवा साम्य यांनुसार नव्हे, तर मंचानुसार क्रम. न्यायनिर्णय हा कायदा आहे आणि गाळणी पट्टीने तो मर्यादित होत नाही — केवळ खालचा कामाचा भार मर्यादित होतो. जिथे प्रकाशित स्रोतावरून प्रकरणाचे नाव निश्चित करता आले नाही, तिथे ते रचून लिहिण्याऐवजी रिक्त ठेवले आहे.',
  'Forum — rank {0} of {1}': 'मंच — {1} पैकी क्रम {0}',
  'Rank {0} of {1}': '{1} पैकी क्रम {0}',
  'Whether it still stands': 'तो अजूनही टिकून आहे का',
  'This tab states the rules by which authority is weighted. They are law, and they are the same in every division and for every sector.':
    'न्यायनिर्णयाला कोणत्या नियमांनी वजन दिले जाते ते हा टॅब सांगतो. ते कायदा आहेत, आणि प्रत्येक विभागात व प्रत्येक क्षेत्रासाठी तेच आहेत.',

  /* == Precedent Intelligence — which notification binds ================ */
  'The notification each deadline rests on': 'प्रत्येक मुदत ज्या अधिसूचनेवर आधारित आहे ती',
  'Not attributed to a contested notification': 'वादग्रस्त अधिसूचनेशी जोडलेली नाही',
  'Notice already issued — the order clock rests on the extension':
    'नोटीस आधीच बजावली — आदेशाचे घड्याळ मुदतवाढीवर अवलंबून',
  'No notice yet — the window to issue at all rests on it':
    'अद्याप नोटीस नाही — मुळात नोटीस बजावण्याचा कालपटच त्यावर अवलंबून',
  'Already past the binding date on the extended clock':
    'वाढीव घड्याळावरील बंधनकारक तारीखही उलटून गेली',
  '{0} · ₹{1} Cr': '{0} · ₹{1} कोटी',
  '{0} of {1} proceedings · ₹{2} Cr': '{1} पैकी {0} कार्यवाही · ₹{2} कोटी',
  'Deadline that binds': 'बंधनकारक मुदत',
  'Days left': 'उरलेले दिवस',

  /* == Precedent Intelligence — departmental record ===================== */
  'Departmental outcome history is computed once over the whole register by the precedent engine; a division-level version would be a second computation of the same figure, and the two would eventually disagree.':
    'विभागीय निकालांचा इतिहास पूर्वाधार यंत्राकडून संपूर्ण नोंदवहीवर एकदाच मोजला जातो; विभागनिहाय आवृत्ती म्हणजे त्याच आकड्याची दुसरी मोजणी ठरेल, आणि कालांतराने दोन्ही एकमेकांशी जुळणार नाहीत.',
  '{0} of {1} proceedings on the register have concluded and carry an outcome — {2}%. Of those, {3} were confirmed, {4} reversed and {5} remanded. Every proceeding still pending contributes nothing to this record until it concludes.':
    'नोंदवहीवरील {1} पैकी {0} कार्यवाही निकाली निघाल्या असून त्यांना निकाल आहे — {2}%. त्यांपैकी {3} कायम, {4} रद्द आणि {5} पुनर्विचारार्थ परत. अद्याप प्रलंबित असलेली प्रत्येक कार्यवाही निकाली निघेपर्यंत या नोंदीत काहीही भर घालत नाही.',
  'Still pending': 'अजूनही प्रलंबित',
  'The withheld cells are the point. Each states the concluded count that produced it, so an officer can see exactly how far short of the threshold the record falls rather than being handed a rate that the sample cannot carry.':
    'रोखून धरलेले कप्पेच इथे महत्त्वाचे आहेत. प्रत्येक कप्पा तो ज्या निकाली संख्येतून आला ती संख्या सांगतो, जेणेकरून नमुना पेलू शकणार नाही असा दर हाती देण्याऐवजी, नोंद उंबरठ्यापासून नेमकी किती कमी पडते हे अधिकाऱ्याला दिसते.',
  'These rows are grouped by the issue category recorded on the case file. The questions of law on the first tab are held separately and nothing in the record joins the two, so this module cannot say how the department has fared on the Section 168A question specifically. That is a data-capture gap — outcomes are not captured against the question that decided them — and it is stated rather than bridged with an assumed mapping.':
    'या ओळी प्रकरण नस्तीवर नोंदलेल्या मुद्दा-वर्गानुसार गटबद्ध आहेत. पहिल्या टॅबवरील विधिप्रश्न स्वतंत्रपणे ठेवले जातात आणि नोंदीत या दोहोंना जोडणारे काहीही नाही, त्यामुळे Section 168A च्या प्रश्नावर विभागाची कामगिरी नेमकी काय, हे हा घटक सांगू शकत नाही. ही माहिती-संकलनातील त्रुटी आहे — निकाल ज्या प्रश्नाने ठरले त्या प्रश्नाविरुद्ध नोंदवले जात नाहीत — आणि ती गृहीत जुळणीने भरून काढण्याऐवजी स्पष्टपणे सांगितली आहे.',
  'Recorded on the case file at the time of assessment, not inferred by a model. Each count is shown against the proceedings on that issue, because three weak files out of four is a different problem from three out of forty.':
    'निर्धारणाच्या वेळी प्रकरण नस्तीवर नोंदवलेले, प्रारूपाने काढलेले अनुमान नव्हे. प्रत्येक संख्या त्या मुद्द्यावरील कार्यवाहींच्या तुलनेत दाखवली आहे, कारण चारपैकी तीन दुर्बल नस्ती ही चाळीसपैकी तीनपेक्षा वेगळी समस्या आहे.',

  /* == Litigation Intelligence — headline =============================== */
  'Pending proceedings, order outcomes and exposure tracked through the appeal stages — how much of the amount in dispute is still contestable, where in the ladder it sits, and how much of it rides on a position the department itself has recorded as weak.':
    'प्रलंबित कार्यवाही, आदेशांचे निकाल आणि अपील टप्प्यांतून मागोवा घेतलेली जोखीम रक्कम — वादग्रस्त रकमेपैकी किती अजून लढवता येण्याजोगी आहे, ती शिडीत कुठे उभी आहे, आणि तिच्यापैकी किती रक्कम विभागानेच दुर्बल म्हणून नोंदवलेल्या भूमिकेवर अवलंबून आहे.',
  'litigation proceedings': 'न्यायालयीन कार्यवाही',
  'of {0} proceedings in scope — {1} concluded': 'व्याप्तीतील {0} कार्यवाहींपैकी — {1} निकाली',
  'Exposure still under appeal': 'अजूनही अपिलात असलेली जोखीम रक्कम',
  '₹ Cr of ₹{0} Cr in scope · ₹{1} Cr on the register statewide':
    'व्याप्तीतील ₹{0} कोटींपैकी ₹ कोटी · राज्यभरातील नोंदवहीवर ₹{1} कोटी',
  'Orders reversed at appeal': 'अपिलात रद्द झालेले आदेश',
  'of {0} concluded — {1} confirmed, {2} remanded · ₹{3} Cr reversed':
    'निकाली {0} पैकी — {1} कायम, {2} पुनर्विचारार्थ परत · ₹{3} कोटी रद्द',
  'Exposure at a weak position': 'दुर्बल भूमिकेवरील जोखीम रक्कम',
  '₹ Cr — {0}% of the amount in dispute, across {1} of {2} proceedings':
    '₹ कोटी — वादग्रस्त रकमेच्या {0}%, {2} पैकी {1} कार्यवाहींमध्ये मिळून',
  'High-value pending': 'उच्च मूल्याची प्रलंबित',
  'over ₹50L — ₹{0} Cr, {1}% of the exposure still under appeal':
    '₹50 लाखांवरील — ₹{0} कोटी, अजूनही अपिलात असलेल्या जोखीम रकमेच्या {1}%',

  /* == Litigation Intelligence — why no blended rate ==================== */
  'No blended success rate is stated on this screen — {0} of {1} proceedings in scope have concluded and carry an outcome.':
    'या पडद्यावर एकत्रित यशाचा दर दिलेला नाही — व्याप्तीतील {1} पैकी {0} कार्यवाही निकाली निघाल्या असून त्यांना निकाल आहे.',
  'A single percentage computed across seven different questions of law is a generalisation wearing a statistic: it reads as evidence about the case in front of the officer and is nothing of the kind. Outcomes are therefore reported as counts against their denominator. Where the department’s record is thick enough to carry a rate, it is stated per question of law — and withheld with the concluded count shown where it is not — in Precedent Intelligence, which owns that gate.':
    'सात वेगवेगळ्या विधिप्रश्नांवर मिळून काढलेली एकच टक्केवारी म्हणजे आकडेवारीचा पोशाख घातलेले सामान्यीकरण: ती अधिकाऱ्यासमोरील प्रकरणाविषयीचा पुरावा असल्यासारखी वाचली जाते, आणि ती तशी मुळीच नसते. म्हणून निकाल त्यांच्या भाजकासह संख्येच्या स्वरूपात दिले जातात. जिथे विभागाची नोंद दर पेलण्याइतकी दाट आहे, तिथे तो विधिप्रश्नानुसार सांगितला जातो — आणि जिथे नाही तिथे निकाली संख्या दाखवून रोखून धरला जातो — हे पूर्वाधार इंटेलिजन्समध्ये, ज्याच्याकडे तो अधिकार आहे.',

  /* == Litigation Intelligence — ladder, ageing, issues ================== */
  'Where the exposure sits in the appeal ladder': 'जोखीम रक्कम अपील शिडीत कुठे उभी आहे',
  'First appeal, second appeal, then the three ways a proceeding ends. Exposure is the amount in dispute at each rung, as a share of ₹{0} Cr in scope.':
    'पहिले अपील, दुसरे अपील, आणि मग कार्यवाही संपण्याचे तीन मार्ग. जोखीम रक्कम म्हणजे प्रत्येक पायरीवरील वादग्रस्त रक्कम, व्याप्तीतील ₹{0} कोटींच्या तुलनेत.',
  'Amount in dispute': 'वादग्रस्त रक्कम',
  'Amount in dispute (₹ Cr)': 'वादग्रस्त रक्कम (₹ कोटी)',
  'Share of exposure': 'जोखीम रकमेतील वाटा',
  'Weak position': 'दुर्बल भूमिका',
  'Case ageing against the money it holds': 'प्रकरणाचे वय, त्यात अडकलेल्या रकमेच्या तुलनेत',
  'Bars are the amount in dispute, not the number of cases — an old case decides nothing until you know what is riding on it.':
    'स्तंभ म्हणजे वादग्रस्त रक्कम, प्रकरणांची संख्या नव्हे — त्यावर काय अवलंबून आहे हे कळेपर्यंत जुने प्रकरण काहीही ठरवत नाही.',
  '₹{0} Cr · {1}%': '₹{0} कोटी · {1}%',
  'Legal issues, by amount at stake and how they have ended':
    'विधिमुद्दे — पणाला लागलेल्या रकमेनुसार आणि ते कसे संपले त्यानुसार',
  'Ranked by the money in dispute rather than by how often the issue appears. Outcomes are counts against the concluded total; no rate is computed here.':
    'मुद्दा किती वेळा येतो यानुसार नव्हे, तर वादग्रस्त रकमेनुसार क्रम. निकाल हे निकाली एकूण संख्येच्या तुलनेतील आकडे आहेत; इथे कोणताही दर मोजलेला नाही.',
  'Legal issue': 'विधिमुद्दा',
  Pending: 'प्रलंबित',
  'Share of this issue’s exposure': 'या मुद्द्याच्या जोखीम रकमेतील वाटा',
  '{0}% of ₹{1} Cr': '₹{1} कोटींपैकी {0}%',
  'Respects global district / division / sector / risk / date filters':
    'जिल्हा / विभाग / क्षेत्र / जोखीम / दिनांक या जागतिक गाळण्या पाळतो',

  /* == Litigation Intelligence — weak positions ========================== */
  'Where weak positions cluster, and what they cost':
    'दुर्बल भूमिका कुठे साचतात, आणि त्यांची किंमत काय',
  'Positions recorded on the case file at assessment, weighted by the amount in dispute behind them':
    'निर्धारणाच्या वेळी प्रकरण नस्तीवर नोंदलेल्या भूमिका, त्यांच्यामागील वादग्रस्त रकमेनुसार भारित',
  '{0} of {1} proceedings in scope carry a position the department itself recorded as weak, and ₹{2} Cr — {3}% of the amount in dispute — sits behind them.':
    'व्याप्तीतील {1} पैकी {0} कार्यवाहींमध्ये विभागानेच दुर्बल म्हणून नोंदवलेली भूमिका आहे, आणि त्यांच्यामागे ₹{2} कोटी — वादग्रस्त रकमेच्या {3}% — उभे आहेत.',
  '{0} of {1} weak positions ({2}%) are documentation gaps, holding ₹{3} Cr. Recommend a refresher on evidence collection and case-file discipline for audit and assessment officers — this is the half the department can fix by itself, before a hearing rather than after one.':
    '{1} पैकी {0} दुर्बल भूमिका ({2}%) या दस्तऐवजांतील त्रुटी असून त्यांत ₹{3} कोटी अडकले आहेत. लेखापरीक्षण व निर्धारण अधिकाऱ्यांसाठी पुरावा संकलन आणि प्रकरण-नस्ती शिस्त यावर उजळणी प्रशिक्षणाची शिफारस — हा तोच अर्धा भाग आहे जो विभाग स्वतःच, सुनावणीनंतर नव्हे तर सुनावणीपूर्वीच दुरुस्त करू शकतो.',
  '{0} of {1} weak positions ({2}%) are unfavourable precedent, holding ₹{3} Cr. Training does not move these: route them through the Legal Cell early for a distinguishing argument, or evaluate withdrawal where the authority is binding and against the department.':
    '{1} पैकी {0} दुर्बल भूमिका ({2}%) या प्रतिकूल पूर्वाधारामुळे असून त्यांत ₹{3} कोटी अडकले आहेत. प्रशिक्षणाने या हलत नाहीत: वेगळेपण दाखवणाऱ्या युक्तिवादासाठी त्या लवकर विधी कक्षाकडे पाठवा, किंवा जिथे न्यायनिर्णय बंधनकारक असून विभागाविरुद्ध आहे तिथे माघारीचा विचार करा.',

  /* == Precedent and litigation — short lines ============================ */
  'Weighted by the forum that gave the decision, not by how similar the facts look.':
    'निर्णय देणाऱ्या मंचानुसार वजन, तथ्ये किती सारखी दिसतात त्यानुसार नव्हे.',
  'Ordered by forum. Authority is law and does not narrow with the filters.':
    'मंचानुसार क्रम. न्यायनिर्णय हा कायदा असून गाळण्यांनी तो मर्यादित होत नाही.',
  'A rate drawn from two or three cases misleads rather than informs.':
    'दोन-तीन प्रकरणांवरून काढलेला दर माहिती देण्याऐवजी दिशाभूल करतो.',
  'Only concluded proceedings carry an outcome. Pending ones contribute nothing.':
    'केवळ निकाली कार्यवाहींना निकाल असतो. प्रलंबित कार्यवाही काहीही भर घालत नाहीत.',
  'This department\'s own record, grouped by the legal question.':
    'या विभागाची स्वतःची नोंद, विधिप्रश्नानुसार गटबद्ध.',
  'The withheld cells are the point — each shows how far short the record falls.':
    'रोखून धरलेले कप्पेच महत्त्वाचे — प्रत्येक नोंद किती कमी पडते ते दाखवतो.',
  'Grouped by the issue on the case file, which is not the question of law.':
    'प्रकरण नस्तीवरील मुद्द्यानुसार गटबद्ध, जो विधिप्रश्न नव्हे.',
  'Recorded at assessment, not inferred — shown against its own denominator.':
    'निर्धारणाच्या वेळी नोंदलेले, अनुमान नव्हे — स्वतःच्या भाजकासह दाखवलेले.',
  'Binding weight depends on the deciding authority, not on the wording.':
    'बंधनकारक वजन निर्णय देणाऱ्या प्राधिकरणावर अवलंबून, शब्दरचनेवर नाही.',
  'No citation here is generated. An unconfirmed case name is left blank.':
    'इथले कोणतेही संदर्भ तयार केलेले नाहीत. निश्चित न झालेले प्रकरण नाव रिक्त ठेवले आहे.',
  'Exposure through the appeal ladder, and how much rests on a weak position.':
    'अपील शिडीतील जोखीम रक्कम, आणि तिच्यापैकी किती दुर्बल भूमिकेवर अवलंबून.',
  'No blended rate: outcomes are counts against their own denominator.':
    'एकत्रित दर नाही: निकाल हे त्यांच्या भाजकाच्या तुलनेतील आकडे आहेत.',
  'Documentation gaps — the half the department can fix before a hearing.':
    'दस्तऐवजांतील त्रुटी — सुनावणीपूर्वी विभाग स्वतः दुरुस्त करू शकतो तो अर्धा भाग.',
  'Unfavourable precedent — training does not move these.':
    'प्रतिकूल पूर्वाधार — प्रशिक्षणाने या हलत नाहीत.'
})
