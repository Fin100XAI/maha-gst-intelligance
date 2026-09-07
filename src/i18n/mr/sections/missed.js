import { registerMessages } from '../../locale.js'

/**
 * Marathi — Case Digital Twin, Missed Revenue Discovery and
 * Counterfactual Intelligence.
 *
 *   digital twin         → डिजिटल प्रतिरूप
 *   review candidate     → पुनर्विलोकन उमेदवार
 *   detection latency    → शोध विलंब
 *   detection floor      → शोधाची किमान मर्यादा
 *   queue dwell          → रांगेतील प्रतीक्षा
 *   lag loss             → विलंबामुळे झालेली हानी
 *   effect size          → परिणाम आकार
 *   separation           → वेगळेपण
 *   band                 → पट्टा
 *   stand-in             → पर्यायी नोंद
 *
 * “Clock” stays घड्याळ — the statutory clock is a recurring object on these
 * screens, not a metaphor to be varied. Section identifiers stay in Latin.
 */
registerMessages('mr', {
  /* == Missed Revenue Discovery — the register ========================== */
  '{0} of {1} taxpayers in view — ordered by how soon action is required':
    'दृश्यातील {1} पैकी {0} करदाते — कार्यवाही किती लवकर आवश्यक आहे त्यानुसार क्रम',
  '{0} due within 30 days': '{0} 30 दिवसांत देय',
  '{0} already time-barred': '{0} आधीच कालबाह्य',
  '{0} with no clock established': '{0} — घड्याळच निश्चित झालेले नाही',
  'Amounts read as recoverable now of estimated exposure.':
    'रकमा अंदाजित जोखीम रकमेपैकी आता वसूलपात्र म्हणून वाचाव्यात.',
  'Rank {0} of {1} by estimated exposure among the taxpayers in view — {2} of the {3} in scope.':
    'दृश्यातील करदात्यांमध्ये अंदाजित जोखीम रकमेनुसार {1} पैकी क्रम {0} — व्याप्तीतील {3} पैकी {2}.',
  'What is at stake, what remains of it, and what the delay is costing':
    'पणाला काय लागले आहे, त्यातले काय शिल्लक आहे, आणि विलंबाची किंमत काय',
  'Risk-model estimate, not an assessed demand': 'जोखीम प्रारूपाचा अंदाज, निर्धारित मागणी नव्हे',
  '{0}% of the exposure survives at this age': 'या वयावर जोखीम रकमेपैकी {0}% टिकून राहते',
  '{0}% of what is left — the cost of one more week untouched':
    'शिल्लक रकमेच्या {0}% — आणखी एक आठवडा हात न लावण्याची किंमत',
  'The cost of one more week untouched': 'आणखी एक आठवडा हात न लावण्याची किंमत',
  'Cost of deferring seven days': 'सात दिवस पुढे ढकलण्याची किंमत',
  'Portfolio median is {0}d': 'संपूर्ण संचाचा मध्यक {0} दिवस',
  'Why flagged — {0} rules firing, {1} points of the risk score {2}':
    'का चिन्हांकित — {0} नियम लागू, जोखीम गुण {2} पैकी {1} गुण',
  'What this means': 'याचा अर्थ काय',
  '{0} encoded rules were firing when this case was put down, contributing {1} points of the risk score {2}.':
    'हे प्रकरण नोंदवले गेले तेव्हा {0} संकेतबद्ध नियम लागू होते, ज्यांनी जोखीम गुण {2} पैकी {1} गुण दिले.',
  'Basis for revisiting': 'पुनर्विचाराचा आधार',
  'on {0} of {1} dimensions': '{1} पैकी {0} मितींवर',

  /* == Missed Revenue Discovery — statutory clock ======================= */
  'Open work against an expired period': 'मुदत संपलेल्या कालावधीविरुद्ध सुरू असलेले काम',
  '{0} item(s) are still live on this taxpayer — {1} audit case(s) and {2} unconcluded notice(s) — against a period that is already time-barred. Officer capacity is being spent on a demand that can no longer lawfully be raised. Close or re-scope them before any further work is booked.':
    'या करदात्यावर {0} बाबी अजून जिवंत आहेत — {1} लेखापरीक्षण प्रकरणे आणि {2} अनिर्णित नोटिसा — आणि तेही आधीच कालबाह्य झालेल्या कालावधीविरुद्ध. जी मागणी आता कायदेशीरपणे उभीच करता येत नाही, तिच्यावर अधिकाऱ्यांची क्षमता खर्च होत आहे. आणखी कोणतेही काम नोंदवण्यापूर्वी त्या बंद करा किंवा त्यांची व्याप्ती बदला.',
  'Absent input, not a clear position': 'माहितीचा अभाव, स्पष्ट स्थिती नव्हे',
  'The limitation register is built from audit cases. No audit case exists against this taxpayer, so no tax period has been fixed and no deadline can be stated. This is a gap in the record, and it must not be read as "there is time".':
    'परिसीमा नोंदवही लेखापरीक्षण प्रकरणांवरून तयार होते. या करदात्याविरुद्ध एकही लेखापरीक्षण प्रकरण नाही, त्यामुळे कोणताही करकालावधी निश्चित झालेला नाही आणि कोणतीही मुदत सांगता येत नाही. ही नोंदीतील त्रुटी आहे, आणि तिचा अर्थ "वेळ आहे" असा घेता कामा नये.',
  'The statutory period expired {0} days ago': 'सांविधिक कालावधी {0} दिवसांपूर्वी संपला',
  '{0} days remain on the statutory clock': 'सांविधिक घड्याळावर {0} दिवस शिल्लक',
  '31 to 90 days': '31 ते 90 दिवस',
  '91 to 180 days': '91 ते 180 दिवस',
  'Over 180 days': '180 दिवसांहून अधिक',
  'No clock established': 'घड्याळ निश्चित नाही',
  'No clock': 'घड्याळ नाही',
  'Where the time actually is': 'वेळ प्रत्यक्षात कुठे आहे',
  'Review candidates banded by what remains on the statutory clock. The band, not the amount, decides the order of work.':
    'सांविधिक घड्याळावर काय शिल्लक आहे त्यानुसार पट्ट्यांत विभागलेले पुनर्विलोकन उमेदवार. कामाचा क्रम रक्कम नव्हे, तर पट्टा ठरवतो.',
  '{0}% of candidates': 'उमेदवारांपैकी {0}%',
  'A candidate whose period expires this month outranks a larger one with two years to run, because only one of them can still be converted into a demand. Candidates already time-barred are excluded upstream and never appear here.':
    'ज्याचा कालावधी या महिन्यात संपतो असा उमेदवार, दोन वर्षे शिल्लक असलेल्या मोठ्या उमेदवारापेक्षा वरचा ठरतो, कारण त्या दोघांपैकी केवळ एकाचेच अजून मागणीत रूपांतर होऊ शकते. आधीच कालबाह्य झालेले उमेदवार आधीच्या टप्प्यावरच वगळले जातात आणि इथे कधीही दिसत नाहीत.',
  'Soonest deadline first': 'सर्वात जवळची मुदत आधी',
  'Largest exposure first': 'सर्वात मोठी जोखीम रक्कम आधी',
  'Soonest deadline': 'सर्वात जवळची मुदत',
  'None established': 'एकही निश्चित नाही',
  'only {0} of {1} candidates have an established clock at all; {2} expire within 30 days':
    '{1} पैकी केवळ {0} उमेदवारांचे घड्याळ मुळात निश्चित आहे; {2} 30 दिवसांत संपतात',
  'Exposure still inside limitation': 'अजूनही परिसीमेच्या आत असलेली जोखीम रक्कम',
  'of {0} on all candidates': 'सर्व उमेदवारांवरील {0} पैकी',
  'of {0} with rules firing': 'नियम लागू असलेल्या {0} पैकी',
  'Closed while signals were live': 'संकेत जिवंत असतानाच बंद केलेली',
  'plus {0} against whom no notice ever issued': 'शिवाय {0}, ज्यांच्याविरुद्ध कधीच नोटीस बजावली गेली नाही',
  '{0} of these {1} carry a confirmed live limitation clock — {2} do not, and nothing here can be worked until a period is fixed on them.':
    'या {1} पैकी {0} उमेदवारांवर निश्चित जिवंत परिसीमा घड्याळ आहे — {2} वर नाही, आणि त्यांच्यावर कालावधी निश्चित होईपर्यंत इथे कशावरही काम करता येणार नाही.',
  '{0} · {1} rules': '{0} · {1} नियम',
  'No review candidates match the current filters.':
    'सध्याच्या गाळण्यांशी जुळणारा एकही पुनर्विलोकन उमेदवार नाही.',
  'Rank {0} of {1} by exposure among the candidates in view, out of {2} in scope.':
    'दृश्यातील उमेदवारांमध्ये जोखीम रकमेनुसार {1} पैकी क्रम {0}, व्याप्तीतील {2} पैकी.',
  'What is left on the clock': 'घड्याळावर काय शिल्लक आहे',
  'Nothing below can be converted into a demand after this date.':
    'या तारखेनंतर खालील कशाचेही मागणीत रूपांतर होऊ शकत नाही.',
  'Not established — an absent input': 'निश्चित नाही — माहितीचा अभाव',
  'The limitation register is built from audit cases, and no audit case exists against this taxpayer. No tax period has been fixed, so no deadline can be computed. Step 1 below is what establishes it — until then this candidate cannot be prioritised against the others, and the absence must not be read as time in hand.':
    'परिसीमा नोंदवही लेखापरीक्षण प्रकरणांवरून तयार होते, आणि या करदात्याविरुद्ध एकही लेखापरीक्षण प्रकरण नाही. कोणताही करकालावधी निश्चित झालेला नाही, त्यामुळे कोणतीही मुदत मोजता येत नाही. खालील पायरी 1 हीच ती निश्चित करते — तोपर्यंत या उमेदवाराला इतरांच्या तुलनेत प्राधान्य देता येणार नाही, आणि या अभावाचा अर्थ हातात वेळ आहे असा घेता कामा नये.',
  'Days remaining': 'शिल्लक दिवस',
  'Binding date': 'बंधनकारक तारीख',
  'Inside 30 days. If a period is to be reopened at all, the checks below have to be completed and a notice issued before this date — after it the exposure is extinguished by operation of law.':
    '30 दिवसांच्या आत. कालावधी मुळात पुन्हा उघडायचा असेल, तर खालील तपासण्या पूर्ण करून या तारखेपूर्वी नोटीस बजावावी लागेल — त्यानंतर कायद्याच्या अंमलानेच जोखीम रक्कम संपुष्टात येते.',
  'After this date no demand can be raised for the period, whatever the evidence later shows. The checks below take time; count backwards from it rather than forwards from today.':
    'या तारखेनंतर पुरावा पुढे काहीही दाखवो, त्या कालावधीसाठी कोणतीही मागणी उभी करता येणार नाही. खालील तपासण्यांना वेळ लागतो; आजपासून पुढे मोजण्याऐवजी त्या तारखेपासून मागे मोजा.',

  /* == Case Digital Twin ================================================ */
  '{0} events merged from {1} systems. Today this is reconstructed by hand from each system in turn.':
    '{1} प्रणालींतून एकत्र केलेल्या {0} घटना. आज हे प्रत्येक प्रणालीतून एकेक करत हाताने पुन्हा जुळवले जाते.',
  'Last departmental action': 'शेवटची विभागीय कार्यवाही',
  'none on record': 'नोंदीवर एकही नाही',
  '{0} days ago': '{0} दिवसांपूर्वी',
  'Dwell since the file was last touched — the part of the lag the department owns.':
    'नस्तीला शेवटचा हात लागल्यापासूनची प्रतीक्षा — विलंबाचा तो भाग जो विभागाच्याच हातात आहे.',
  'Each count carries the part that is still live — a closed proceeding decides nothing today.':
    'प्रत्येक संख्येसोबत अजून जिवंत असलेला भाग दिला आहे — बंद झालेली कार्यवाही आज काहीही ठरवत नाही.',
  '{0} awaiting a reply or a hearing': '{0} उत्तराच्या किंवा सुनावणीच्या प्रतीक्षेत',
  '{0} not yet closed': '{0} अद्याप बंद नाही',
  '{0} claimed': '{0} दावा केलेले',
  '{0} in dispute': '{0} वादग्रस्त',
  'Compliance alerts': 'अनुपालन सूचना',
  '{0} still open': '{0} अजूनही प्रलंबित',
  '{0} entities in the chain — acting alone does not stop it':
    'साखळीत {0} संस्था — एकावर कारवाई करून ती थांबत नाही',
  '{0} of {1} systems contributed a fact to this twin — and {2} of the {1} are not integrated in this build, so what they contributed is a generated stand-in.':
    '{1} पैकी {0} प्रणालींनी या प्रतिरूपाला एखादी वस्तुस्थिती दिली — आणि त्या {1} पैकी {2} या आवृत्तीत एकात्मिक नाहीत, त्यामुळे त्यांनी दिलेले हे तयार केलेली पर्यायी नोंद आहे.',
  '{0} contributed nothing here. The fields it would carry are absent from this twin, not empty in the record.':
    '{0} ने इथे काहीही दिलेले नाही. ती जी क्षेत्रे आणली असती ती या प्रतिरूपात अनुपस्थित आहेत — नोंदीत रिकामी नाहीत.',

  /* == Counterfactual Intelligence — the unbuilt capability ============= */
  'The separation test is a single measurement over the department’s whole concluded litigation record; it cannot be recomputed per division without falling below the sample it already fails on.':
    'वेगळेपणाची चाचणी ही विभागाच्या संपूर्ण निकाली न्यायालयीन नोंदीवरील एकच मापन आहे; ती विभागनिहाय पुन्हा मोजली, तर जिथे ती आधीच अपुरी पडते त्या नमुन्याहूनही खाली जाईल.',
  'The label that does not exist': 'अस्तित्वातच नसलेली खूण',
  'Identifying Section 73 cases that resemble Section 74 cases needs Section 74 cases to resemble.':
    'Section 74 सारखी दिसणारी Section 73 प्रकरणे ओळखायची असतील, तर ज्यांच्यासारखी दिसतील अशी Section 74 प्रकरणेच अस्तित्वात असावी लागतात.',
  'Section 74 proceedings': 'Section 74 कार्यवाही',
  'Section 73 proceedings': 'Section 73 कार्यवाही',
  'of {0} in the limitation register': 'परिसीमा नोंदवहीतील {0} पैकी',
  'the population that would be screened': 'ज्यांची छाननी केली जाईल ती संख्या',
  'Minimum before a model has anything to learn': 'प्रारूपाला काही शिकण्यासारखे असण्यासाठी किमान संख्या',
  'threshold met': 'उंबरठा गाठला',
  'threshold not met — the capability is left unbuilt':
    'उंबरठा गाठलेला नाही — ही क्षमता न बांधताच सोडली आहे',
  'What would unlock it': 'ती कशाने खुली होईल',
  'a screen needs an effect size of about 0.5': 'छाननीसाठी सुमारे 0.5 इतका परिणाम आकार लागतो',
  'Largest effect measured': 'मोजलेला सर्वात मोठा परिणाम',
  'on {0} — still short of 0.5': '{0} वर — तरीही 0.5 पेक्षा कमी',
  'Read the two mean columns against each other. Where they are the same number, a case the department won and a case drawn at random are indistinguishable on that feature — which is what "does not separate" means in practice.':
    'दोन्ही सरासरी स्तंभ एकमेकांशी ताडून पहा. जिथे ते एकच आकडा दाखवतात, तिथे विभाग जिंकलेले प्रकरण आणि यादृच्छिक निवडलेले प्रकरण त्या गुणधर्मावर वेगळे ओळखताच येत नाहीत — प्रत्यक्षात "वेगळेपण दाखवत नाही" याचा अर्थ हाच.',

  /* == Counterfactual Intelligence — lag loss =========================== */
  '₹ Cr — {0}% of all lag loss, and the department’s own':
    '₹ कोटी — विलंबामुळे झालेल्या एकूण हानीच्या {0}%, आणि ती विभागाची स्वतःची',
  '₹ Cr — {0}%, a data-feed floor no queue can shorten':
    '₹ कोटी — {0}%, ही माहिती-स्रोताची किमान मर्यादा असून कोणतीही रांग ती कमी करू शकत नाही',
  'Median lag, reported in two parts': 'मध्यक विलंब, दोन भागांत सांगितलेला',
  '{0}d + {1}d': '{0} दि + {1} दि',
  'detection floor, then queue dwell — never blended':
    'शोधाची किमान मर्यादा, मग रांगेतील प्रतीक्षा — कधीही एकत्र मिसळलेली नाही',
  '₹ Cr — {0}% of the {1} Cr exposure on these {2} cases':
    '₹ कोटी — या {2} प्रकरणांवरील {1} कोटी जोखीम रकमेच्या {0}%',
  'Two parts, kept apart, because they have different owners and different fixes.':
    'दोन भाग, वेगवेगळे ठेवलेले, कारण त्यांचे जबाबदार वेगळे आहेत आणि उपायही वेगळे आहेत.',
  'Owner: allocation and capacity': 'जबाबदारी: वाटप आणि क्षमता',
  '₹{0} Cr, {1}% of the total lag loss, sat in the queue after the signal was already visible. Median dwell {2} days. This is the part a prioritisation decision changes this quarter, at the same headcount.':
    'संकेत आधीच दिसू लागल्यानंतर ₹{0} कोटी, म्हणजे विलंबामुळे झालेल्या एकूण हानीच्या {1}%, रांगेत पडून राहिले. मध्यक प्रतीक्षा {2} दिवस. हाच तो भाग आहे जो प्राधान्यक्रमाचा निर्णय त्याच मनुष्यबळावर, याच तिमाहीत बदलतो.',
  'Owner: data feed integration': 'जबाबदारी: माहिती-स्रोताचे एकात्मीकरण',
  '₹{0} Cr, {1}% of the total, was gone before the signal could physically exist. Median detection floor {2} days. No amount of prioritisation shortens this — it moves only when a faster feed replaces the return cycle.':
    'संकेत प्रत्यक्षात अस्तित्वात येण्याआधीच ₹{0} कोटी, म्हणजे एकूण हानीच्या {1}%, निघून गेले होते. शोधाची मध्यक किमान मर्यादा {2} दिवस. कितीही प्राधान्यक्रम लावला तरी ही कमी होत नाही — विवरण चक्राच्या जागी अधिक जलद स्रोत आला तरच ती हलते.',
  'On {0} of {1} cases in view the department’s own dwell exceeded the detection floor — on those, the delay was not the return cycle.':
    'दृश्यातील {1} पैकी {0} प्रकरणांत विभागाची स्वतःची प्रतीक्षा शोधाच्या किमान मर्यादेपेक्षा जास्त होती — त्यांच्यात विलंबाचे कारण विवरण चक्र नव्हते.',
  'Ordered by value lost to queue dwell — the controllable half.':
    'रांगेतील प्रतीक्षेमुळे गमावलेल्या मूल्यानुसार क्रम — म्हणजे नियंत्रणात असलेला अर्धा भाग.',
  '{0} · detection {1}d, then queue {2}d': '{0} · शोध {1} दि, मग रांग {2} दि',
  '{0} · {1} · signal first visible {2}': '{0} · {1} · संकेत प्रथम दिसला {2}',
  '({0}% of exposure)': '(जोखीम रकमेच्या {0}%)',
  'Controllable share of the loss': 'हानीतील नियंत्रणयोग्य वाटा',
  'Where this case’s lag came from': 'या प्रकरणाचा विलंब कुठून आला',
  'Reported in two parts because they have different owners. The total is {0} days from the behaviour to the day the case was worked.':
    'दोन भागांत सांगितलेले, कारण त्यांचे जबाबदार वेगळे आहेत. वर्तनापासून प्रकरणावर काम झालेल्या दिवसापर्यंत एकूण {0} दिवस.',
  'Detection latency': 'शोध विलंब',
  'Data feed': 'माहिती-स्रोत',
  'The earliest this signal could exist at all, because it waits on a return being filed. Not shortenable by prioritisation — only by a feed that arrives before the return does.':
    'हा संकेत मुळात जेव्हा अस्तित्वात येऊ शकतो तो सर्वात लवकरचा क्षण, कारण तो विवरण दाखल होण्याची वाट पाहतो. प्राधान्यक्रमाने तो कमी होत नाही — केवळ विवरणाआधी येणाऱ्या स्रोतानेच.',
  Allocation: 'वाटप',
  'How long the case then sat unworked after the signal was visible. This is the part a decision the department can take today would have changed.':
    'संकेत दिसल्यानंतर प्रकरण किती काळ काम न होता पडून राहिले. हाच तो भाग आहे जो विभाग आज घेऊ शकणाऱ्या निर्णयाने बदलला असता.',
  '{0} days of detection latency plus {1} days of queue dwell make the {2} days of total lag. They are not averaged together, because one is answered by an integration and the other by a rota.':
    '{0} दिवसांचा शोध विलंब अधिक {1} दिवसांची रांगेतील प्रतीक्षा मिळून {2} दिवसांचा एकूण विलंब होतो. त्यांची सरासरी काढलेली नाही, कारण एकाचे उत्तर एकात्मीकरण आहे आणि दुसऱ्याचे कामवाटप तक्ता.',
  'Each bar is the recovery curve evaluated at that day, against an exposure of {0}. None of them models a different action.':
    'प्रत्येक स्तंभ म्हणजे {0} इतक्या जोखीम रकमेच्या तुलनेत त्या दिवशी मोजलेला वसुली वक्र. त्यांपैकी एकही वेगळ्या कृतीचे प्रारूप मांडत नाही.',
  'Arithmetic on a stated curve': 'सांगितलेल्या वक्रावरील अंकगणित',

  /* == Missed revenue — short lines ============================ */
  'Closed cases re-examined against the signals that were live at the time.':
    'त्या वेळी जिवंत असलेल्या संकेतांच्या तुलनेत बंद प्रकरणांची पुन्हा तपासणी.',
  'The band, not the amount, decides the order of work.':
    'कामाचा क्रम रक्कम नव्हे, तर पट्टा ठरवतो.',
  'No audit case, so no period is fixed — an absence, not time in hand.':
    'लेखापरीक्षण प्रकरण नाही, त्यामुळे कालावधी निश्चित नाही — हा अभाव आहे, हातातील वेळ नव्हे.',
  'Where the two means match, the feature does not separate the cases.':
    'जिथे दोन्ही सरासरी जुळतात, तिथे तो गुणधर्म प्रकरणे वेगळी करत नाही.',

  /* == Counterfactual and twin — short lines ============================ */
  'What the same action, taken earlier, would have been worth.':
    'तीच कृती आधी केली असती तर तिचे मूल्य किती असते.',
  'Queue dwell — the half a prioritisation decision changes this quarter.':
    'रांगेतील प्रतीक्षा — प्राधान्यक्रमाचा निर्णय याच तिमाहीत बदलतो तो अर्धा भाग.',
  'Detection floor — no amount of prioritisation shortens this.':
    'शोधाची किमान मर्यादा — कितीही प्राधान्यक्रम लावला तरी ही कमी होत नाही.',
  'The earliest the signal could exist — it waits on a return being filed.':
    'संकेत अस्तित्वात येऊ शकतो तो सर्वात लवकरचा क्षण — तो विवरण दाखल होण्याची वाट पाहतो.',
  'Not averaged: one is answered by an integration, the other by a rota.':
    'सरासरी काढलेली नाही: एकाचे उत्तर एकात्मीकरण, दुसऱ्याचे कामवाटप तक्ता.',
  'Acting when the signal first appeared would have preserved more.':
    'संकेत प्रथम दिसला तेव्हा कारवाई केली असती तर अधिक वाचले असते.',
  'One taxpayer, assembled from every system that holds a fact about them.':
    'एक करदाता, त्याच्याविषयी वस्तुस्थिती धारण करणाऱ्या प्रत्येक प्रणालीतून जुळवलेला.',
  'Officer capacity is being spent on a demand that cannot be raised.':
    'जी मागणी उभीच करता येत नाही तिच्यावर अधिकाऱ्यांची क्षमता खर्च होत आहे.',
  'No audit case, so no period is fixed. An absence, not time in hand.':
    'लेखापरीक्षण प्रकरण नाही, त्यामुळे कालावधी निश्चित नाही. हा अभाव आहे, हातातील वेळ नव्हे.',
  'No external system is connected — records are shaped like each feed.':
    'कोणतीही बाह्य प्रणाली जोडलेली नाही — नोंदी प्रत्येक स्रोतासारख्या आकाराच्या आहेत.'
})
