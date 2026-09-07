import { registerMessages } from '../../locale.js'

/**
 * Hindi — Case Digital Twin, Missed Revenue Discovery and
 * Counterfactual Intelligence.
 *
 *   digital twin         → डिजिटल प्रतिरूप
 *   review candidate     → पुनर्विलोकन उम्मीदवार
 *   detection latency    → पहचान विलंब
 *   detection floor      → पहचान की न्यूनतम सीमा
 *   queue dwell          → पंक्ति में ठहराव
 *   lag loss             → विलंब से हुई हानि
 *   effect size          → प्रभाव आकार
 *   separation           → पृथक्करण
 *   band                 → पट्टी
 *   stand-in             → स्थानापन्न प्रविष्टि
 *
 * “Clock” stays घड़ी — the statutory clock is a recurring object on these
 * screens, not a metaphor to be varied. Section identifiers stay in Latin.
 */
registerMessages('hi', {
  /* == Missed Revenue Discovery — the register ========================== */
  '{0} of {1} taxpayers in view — ordered by how soon action is required':
    'दृश्य के {1} में से {0} करदाता — कार्रवाई कितनी जल्दी आवश्यक है, उसी क्रम में',
  '{0} due within 30 days': '{0} 30 दिनों में देय',
  '{0} already time-barred': '{0} पहले ही कालातीत',
  '{0} with no clock established': '{0} — घड़ी ही स्थापित नहीं',
  'Amounts read as recoverable now of estimated exposure.':
    'राशियाँ अनुमानित जोखिम राशि में से अभी वसूली-योग्य के रूप में पढ़ी जाएँ।',
  'Rank {0} of {1} by estimated exposure among the taxpayers in view — {2} of the {3} in scope.':
    'दृश्य के करदाताओं में अनुमानित जोखिम राशि के अनुसार {1} में से क्रम {0} — दायरे के {3} में से {2}।',
  'What is at stake, what remains of it, and what the delay is costing':
    'दाँव पर क्या है, उसमें से क्या शेष है, और विलंब की कीमत क्या है',
  'Risk-model estimate, not an assessed demand': 'जोखिम प्रारूप का अनुमान, निर्धारित माँग नहीं',
  '{0}% of the exposure survives at this age': 'इस आयु पर जोखिम राशि का {0}% टिका रहता है',
  '{0}% of what is left — the cost of one more week untouched':
    'शेष राशि का {0}% — एक और सप्ताह अछूता छोड़ने की कीमत',
  'The cost of one more week untouched': 'एक और सप्ताह अछूता छोड़ने की कीमत',
  'Cost of deferring seven days': 'सात दिन टालने की कीमत',
  'Portfolio median is {0}d': 'पूरे संग्रह का मध्यक {0} दिन',
  'Why flagged — {0} rules firing, {1} points of the risk score {2}':
    'क्यों चिह्नित — {0} नियम लागू, जोखिम अंक {2} में से {1} अंक',
  'What this means': 'इसका अर्थ क्या है',
  '{0} encoded rules were firing when this case was put down, contributing {1} points of the risk score {2}.':
    'यह प्रकरण दर्ज होते समय {0} कूटबद्ध नियम लागू थे, जिन्होंने जोखिम अंक {2} में से {1} अंक दिए।',
  'Basis for revisiting': 'पुनर्विचार का आधार',
  'on {0} of {1} dimensions': '{1} में से {0} आयामों पर',

  /* == Missed Revenue Discovery — statutory clock ======================= */
  'Open work against an expired period': 'समाप्त हो चुकी अवधि के विरुद्ध चल रहा कार्य',
  '{0} item(s) are still live on this taxpayer — {1} audit case(s) and {2} unconcluded notice(s) — against a period that is already time-barred. Officer capacity is being spent on a demand that can no longer lawfully be raised. Close or re-scope them before any further work is booked.':
    'इस करदाता पर {0} मदें अब भी जीवित हैं — {1} लेखापरीक्षा प्रकरण और {2} अनिर्णीत नोटिस — और वह भी ऐसी अवधि के विरुद्ध जो पहले ही कालातीत हो चुकी है। जिस माँग को अब विधितः उठाया ही नहीं जा सकता, उस पर अधिकारी-क्षमता व्यय हो रही है। आगे कोई भी कार्य दर्ज करने से पहले उन्हें बंद करें या उनका दायरा बदलें।',
  'Absent input, not a clear position': 'सूचना का अभाव, स्पष्ट स्थिति नहीं',
  'The limitation register is built from audit cases. No audit case exists against this taxpayer, so no tax period has been fixed and no deadline can be stated. This is a gap in the record, and it must not be read as "there is time".':
    'परिसीमा पंजी लेखापरीक्षा प्रकरणों से बनती है। इस करदाता के विरुद्ध कोई लेखापरीक्षा प्रकरण नहीं है, इसलिए कोई कर-अवधि तय नहीं हुई और कोई समय-सीमा बताई नहीं जा सकती। यह अभिलेख की कमी है, और इसे "समय है" नहीं पढ़ा जाना चाहिए।',
  'The statutory period expired {0} days ago': 'सांविधिक अवधि {0} दिन पूर्व समाप्त हुई',
  '{0} days remain on the statutory clock': 'सांविधिक घड़ी पर {0} दिन शेष',
  '31 to 90 days': '31 से 90 दिन',
  '91 to 180 days': '91 से 180 दिन',
  'Over 180 days': '180 दिनों से अधिक',
  'No clock established': 'घड़ी स्थापित नहीं',
  'No clock': 'घड़ी नहीं',
  'Where the time actually is': 'समय वास्तव में कहाँ है',
  'Review candidates banded by what remains on the statutory clock. The band, not the amount, decides the order of work.':
    'सांविधिक घड़ी पर जो शेष है उसके अनुसार पट्टियों में बँटे पुनर्विलोकन उम्मीदवार। कार्य का क्रम राशि नहीं, पट्टी तय करती है।',
  '{0}% of candidates': 'उम्मीदवारों का {0}%',
  'A candidate whose period expires this month outranks a larger one with two years to run, because only one of them can still be converted into a demand. Candidates already time-barred are excluded upstream and never appear here.':
    'जिसकी अवधि इसी माह समाप्त हो रही है वह उम्मीदवार, दो वर्ष शेष रखने वाले बड़े उम्मीदवार से ऊपर आता है, क्योंकि उन दोनों में से केवल एक को ही अब भी माँग में बदला जा सकता है। पहले से कालातीत उम्मीदवार पहले ही चरण पर बाहर कर दिए जाते हैं और यहाँ कभी नहीं दिखते।',
  'Soonest deadline first': 'निकटतम समय-सीमा पहले',
  'Largest exposure first': 'सबसे बड़ी जोखिम राशि पहले',
  'Soonest deadline': 'निकटतम समय-सीमा',
  'None established': 'एक भी स्थापित नहीं',
  'only {0} of {1} candidates have an established clock at all; {2} expire within 30 days':
    '{1} में से केवल {0} उम्मीदवारों की घड़ी मूलतः स्थापित है; {2} 30 दिनों में समाप्त होते हैं',
  'Exposure still inside limitation': 'अब भी परिसीमा के भीतर जोखिम राशि',
  'of {0} on all candidates': 'सभी उम्मीदवारों पर {0} में से',
  'of {0} with rules firing': 'नियम लागू वाले {0} में से',
  'Closed while signals were live': 'संकेत जीवित रहते ही बंद किए गए',
  'plus {0} against whom no notice ever issued':
    'साथ ही {0}, जिनके विरुद्ध कभी नोटिस जारी ही नहीं हुआ',
  '{0} of these {1} carry a confirmed live limitation clock — {2} do not, and nothing here can be worked until a period is fixed on them.':
    'इन {1} में से {0} पर पुष्ट जीवित परिसीमा घड़ी है — {2} पर नहीं, और उन पर अवधि तय होने तक यहाँ किसी पर काम नहीं हो सकता।',
  '{0} · {1} rules': '{0} · {1} नियम',
  'No review candidates match the current filters.':
    'वर्तमान फ़िल्टर से कोई पुनर्विलोकन उम्मीदवार मेल नहीं खाता।',
  'Rank {0} of {1} by exposure among the candidates in view, out of {2} in scope.':
    'दृश्य के उम्मीदवारों में जोखिम राशि के अनुसार {1} में से क्रम {0}, दायरे के {2} में से।',
  'What is left on the clock': 'घड़ी पर क्या शेष है',
  'Nothing below can be converted into a demand after this date.':
    'इस तिथि के बाद नीचे की किसी भी बात को माँग में नहीं बदला जा सकता।',
  'Not established — an absent input': 'स्थापित नहीं — सूचना का अभाव',
  'The limitation register is built from audit cases, and no audit case exists against this taxpayer. No tax period has been fixed, so no deadline can be computed. Step 1 below is what establishes it — until then this candidate cannot be prioritised against the others, and the absence must not be read as time in hand.':
    'परिसीमा पंजी लेखापरीक्षा प्रकरणों से बनती है, और इस करदाता के विरुद्ध कोई लेखापरीक्षा प्रकरण नहीं है। कोई कर-अवधि तय नहीं हुई, इसलिए कोई समय-सीमा परिकलित नहीं की जा सकती। नीचे का चरण 1 ही उसे स्थापित करता है — तब तक इस उम्मीदवार को दूसरों के सापेक्ष प्राथमिकता नहीं दी जा सकती, और इस अभाव को हाथ में समय होना नहीं पढ़ा जाना चाहिए।',
  'Days remaining': 'शेष दिन',
  'Binding date': 'बाध्यकारी तिथि',
  'Inside 30 days. If a period is to be reopened at all, the checks below have to be completed and a notice issued before this date — after it the exposure is extinguished by operation of law.':
    '30 दिनों के भीतर। यदि अवधि को खोलना ही है, तो नीचे की जाँचें पूरी कर इस तिथि से पहले नोटिस जारी करना होगा — उसके बाद विधि के प्रवर्तन से ही जोखिम राशि समाप्त हो जाती है।',
  'After this date no demand can be raised for the period, whatever the evidence later shows. The checks below take time; count backwards from it rather than forwards from today.':
    'इस तिथि के बाद प्रमाण आगे चलकर कुछ भी दिखाए, उस अवधि के लिए कोई माँग नहीं उठाई जा सकती। नीचे की जाँचों में समय लगता है; आज से आगे गिनने के बजाय उस तिथि से पीछे गिनें।',

  /* == Case Digital Twin ================================================ */
  '{0} events merged from {1} systems. Today this is reconstructed by hand from each system in turn.':
    '{1} प्रणालियों से मिलाकर बनी {0} घटनाएँ। आज यह प्रत्येक प्रणाली से बारी-बारी हाथ से पुनः जोड़ा जाता है।',
  'Last departmental action': 'अंतिम विभागीय कार्रवाई',
  'none on record': 'अभिलेख पर एक भी नहीं',
  '{0} days ago': '{0} दिन पूर्व',
  'Dwell since the file was last touched — the part of the lag the department owns.':
    'नस्ती को अंतिम बार छुए जाने के बाद का ठहराव — विलंब का वह भाग जो विभाग के अपने हाथ में है।',
  'Each count carries the part that is still live — a closed proceeding decides nothing today.':
    'प्रत्येक संख्या के साथ वह भाग दिया है जो अब भी जीवित है — बंद हो चुकी कार्यवाही आज कुछ भी तय नहीं करती।',
  '{0} awaiting a reply or a hearing': '{0} उत्तर अथवा सुनवाई की प्रतीक्षा में',
  '{0} not yet closed': '{0} अभी बंद नहीं',
  '{0} claimed': '{0} दावा किए गए',
  '{0} in dispute': '{0} विवादित',
  'Compliance alerts': 'अनुपालन चेतावनियाँ',
  '{0} still open': '{0} अब भी लंबित',
  '{0} entities in the chain — acting alone does not stop it':
    'श्रृंखला में {0} इकाइयाँ — अकेले किसी एक पर कार्रवाई से वह रुकती नहीं',
  '{0} of {1} systems contributed a fact to this twin — and {2} of the {1} are not integrated in this build, so what they contributed is a generated stand-in.':
    '{1} में से {0} प्रणालियों ने इस प्रतिरूप को कोई तथ्य दिया — और उन {1} में से {2} इस संस्करण में एकीकृत नहीं हैं, इसलिए उनका दिया हुआ एक निर्मित स्थानापन्न प्रविष्टि है।',
  '{0} contributed nothing here. The fields it would carry are absent from this twin, not empty in the record.':
    '{0} ने यहाँ कुछ नहीं दिया। वह जो क्षेत्र लाती, वे इस प्रतिरूप में अनुपस्थित हैं — अभिलेख में रिक्त नहीं।',

  /* == Counterfactual Intelligence — the unbuilt capability ============= */
  'The separation test is a single measurement over the department’s whole concluded litigation record; it cannot be recomputed per division without falling below the sample it already fails on.':
    'पृथक्करण परीक्षण विभाग के समूचे निपटे वाद-अभिलेख पर किया गया एकल मापन है; उसे विभागवार पुनः परिकलित करने पर वह उसी नमूने से भी नीचे चला जाएगा जिस पर वह पहले ही खरा नहीं उतरता।',
  'The label that does not exist': 'वह चिह्न जो अस्तित्व में ही नहीं',
  'Identifying Section 73 cases that resemble Section 74 cases needs Section 74 cases to resemble.':
    'Section 74 जैसे दिखने वाले Section 73 प्रकरण पहचानने के लिए, जिनसे मिलते-जुलते हों वैसे Section 74 प्रकरणों का होना आवश्यक है।',
  'Section 74 proceedings': 'Section 74 कार्यवाहियाँ',
  'Section 73 proceedings': 'Section 73 कार्यवाहियाँ',
  'of {0} in the limitation register': 'परिसीमा पंजी की {0} में से',
  'the population that would be screened': 'जिनकी छँटाई की जाएगी वह संख्या',
  'Minimum before a model has anything to learn':
    'प्रारूप के पास सीखने योग्य कुछ होने से पहले की न्यूनतम संख्या',
  'threshold met': 'सीमा पूरी हुई',
  'threshold not met — the capability is left unbuilt':
    'सीमा पूरी नहीं हुई — यह क्षमता बनाई ही नहीं गई',
  'What would unlock it': 'इसे क्या खोलेगा',
  'a screen needs an effect size of about 0.5': 'छँटाई के लिए लगभग 0.5 का प्रभाव आकार चाहिए',
  'Largest effect measured': 'मापा गया सबसे बड़ा प्रभाव',
  'on {0} — still short of 0.5': '{0} पर — फिर भी 0.5 से कम',
  'Read the two mean columns against each other. Where they are the same number, a case the department won and a case drawn at random are indistinguishable on that feature — which is what "does not separate" means in practice.':
    'दोनों माध्य स्तंभों को आमने-सामने पढ़ें। जहाँ वे एक ही संख्या दिखाते हैं, वहाँ विभाग द्वारा जीता गया प्रकरण और यादृच्छिक चुना गया प्रकरण उस विशेषता पर अलग पहचाने ही नहीं जा सकते — व्यवहार में "पृथक नहीं करता" का यही अर्थ है।',

  /* == Counterfactual Intelligence — lag loss =========================== */
  '₹ Cr — {0}% of all lag loss, and the department’s own':
    '₹ करोड़ — विलंब से हुई कुल हानि का {0}%, और वह विभाग की अपनी',
  '₹ Cr — {0}%, a data-feed floor no queue can shorten':
    '₹ करोड़ — {0}%, यह आँकड़ा-स्रोत की न्यूनतम सीमा है जिसे कोई पंक्ति छोटा नहीं कर सकती',
  'Median lag, reported in two parts': 'मध्यक विलंब, दो भागों में बताया गया',
  '{0}d + {1}d': '{0} दि + {1} दि',
  'detection floor, then queue dwell — never blended':
    'पहचान की न्यूनतम सीमा, फिर पंक्ति में ठहराव — कभी मिलाकर नहीं',
  '₹ Cr — {0}% of the {1} Cr exposure on these {2} cases':
    '₹ करोड़ — इन {2} प्रकरणों पर {1} करोड़ जोखिम राशि का {0}%',
  'Two parts, kept apart, because they have different owners and different fixes.':
    'दो भाग, अलग-अलग रखे गए, क्योंकि उनके उत्तरदायी भिन्न हैं और उपाय भी भिन्न।',
  'Owner: allocation and capacity': 'उत्तरदायित्व: आवंटन और क्षमता',
  '₹{0} Cr, {1}% of the total lag loss, sat in the queue after the signal was already visible. Median dwell {2} days. This is the part a prioritisation decision changes this quarter, at the same headcount.':
    'संकेत पहले ही दिखने लगने के बाद ₹{0} करोड़, यानी विलंब से हुई कुल हानि का {1}%, पंक्ति में पड़ा रहा। मध्यक ठहराव {2} दिन। यही वह भाग है जिसे प्राथमिकता का निर्णय उसी कर्मचारी-संख्या पर, इसी तिमाही में बदल देता है।',
  'Owner: data feed integration': 'उत्तरदायित्व: आँकड़ा-स्रोत का एकीकरण',
  '₹{0} Cr, {1}% of the total, was gone before the signal could physically exist. Median detection floor {2} days. No amount of prioritisation shortens this — it moves only when a faster feed replaces the return cycle.':
    'संकेत के भौतिक रूप से अस्तित्व में आने से पहले ही ₹{0} करोड़, यानी कुल का {1}%, जा चुका था। पहचान की मध्यक न्यूनतम सीमा {2} दिन। कितनी भी प्राथमिकता इसे छोटा नहीं करती — यह तभी हिलती है जब विवरणी चक्र की जगह कोई तेज़ स्रोत आए।',
  'On {0} of {1} cases in view the department’s own dwell exceeded the detection floor — on those, the delay was not the return cycle.':
    'दृश्य के {1} में से {0} प्रकरणों में विभाग का अपना ठहराव पहचान की न्यूनतम सीमा से अधिक था — उनमें विलंब का कारण विवरणी चक्र नहीं था।',
  'Ordered by value lost to queue dwell — the controllable half.':
    'पंक्ति में ठहराव से खोए मूल्य के अनुसार क्रम — अर्थात् नियंत्रण-योग्य आधा भाग।',
  '{0} · detection {1}d, then queue {2}d': '{0} · पहचान {1} दि, फिर पंक्ति {2} दि',
  '{0} · {1} · signal first visible {2}': '{0} · {1} · संकेत पहली बार दिखा {2}',
  '({0}% of exposure)': '(जोखिम राशि का {0}%)',
  'Controllable share of the loss': 'हानि में नियंत्रण-योग्य अंश',
  'Where this case’s lag came from': 'इस प्रकरण का विलंब कहाँ से आया',
  'Reported in two parts because they have different owners. The total is {0} days from the behaviour to the day the case was worked.':
    'दो भागों में बताया गया, क्योंकि उनके उत्तरदायी भिन्न हैं। व्यवहार से लेकर प्रकरण पर काम होने के दिन तक कुल {0} दिन।',
  'Detection latency': 'पहचान विलंब',
  'Data feed': 'आँकड़ा-स्रोत',
  'The earliest this signal could exist at all, because it waits on a return being filed. Not shortenable by prioritisation — only by a feed that arrives before the return does.':
    'यह संकेत मूलतः जिस सबसे पहले क्षण अस्तित्व में आ सकता है वही, क्योंकि वह विवरणी दाखिल होने की प्रतीक्षा करता है। प्राथमिकता से यह छोटा नहीं होता — केवल विवरणी से पहले आने वाले स्रोत से।',
  Allocation: 'आवंटन',
  'How long the case then sat unworked after the signal was visible. This is the part a decision the department can take today would have changed.':
    'संकेत दिखने के बाद प्रकरण कितने समय तक बिना काम के पड़ा रहा। यही वह भाग है जिसे विभाग आज ले सकने वाला निर्णय बदल देता।',
  '{0} days of detection latency plus {1} days of queue dwell make the {2} days of total lag. They are not averaged together, because one is answered by an integration and the other by a rota.':
    '{0} दिनों का पहचान विलंब और {1} दिनों का पंक्ति ठहराव मिलकर {2} दिनों का कुल विलंब बनाते हैं। उनका औसत नहीं निकाला जाता, क्योंकि एक का उत्तर एकीकरण है और दूसरे का कार्य-बारी तालिका।',
  'Each bar is the recovery curve evaluated at that day, against an exposure of {0}. None of them models a different action.':
    'प्रत्येक स्तंभ {0} की जोखिम राशि के सापेक्ष उस दिन पर आँका गया वसूली वक्र है। उनमें से कोई भी किसी भिन्न कार्रवाई का प्रारूप नहीं बनाता।',
  'Arithmetic on a stated curve': 'बताए गए वक्र पर अंकगणित',

  /* == Missed revenue — short lines ============================ */
  'Closed cases re-examined against the signals that were live at the time.':
    'उस समय जीवित रहे संकेतों के सापेक्ष बंद प्रकरणों की पुनः जाँच।',
  'The band, not the amount, decides the order of work.':
    'कार्य का क्रम राशि नहीं, पट्टी तय करती है।',
  'No audit case, so no period is fixed — an absence, not time in hand.':
    'लेखापरीक्षा प्रकरण नहीं, इसलिए अवधि तय नहीं — यह अभाव है, हाथ में समय नहीं।',
  'Where the two means match, the feature does not separate the cases.':
    'जहाँ दोनों माध्य मिलते हैं, वहाँ वह विशेषता प्रकरणों को पृथक नहीं करती।',

  /* == Counterfactual and twin — short lines ============================ */
  'What the same action, taken earlier, would have been worth.':
    'वही कार्रवाई पहले की गई होती तो उसका मूल्य कितना होता।',
  'Queue dwell — the half a prioritisation decision changes this quarter.':
    'पंक्ति का ठहराव — प्राथमिकता का निर्णय इसी तिमाही में बदलता है वह आधा भाग।',
  'Detection floor — no amount of prioritisation shortens this.':
    'पहचान की न्यूनतम सीमा — कितनी भी प्राथमिकता इसे छोटा नहीं करती।',
  'The earliest the signal could exist — it waits on a return being filed.':
    'संकेत जिस सबसे पहले क्षण अस्तित्व में आ सकता है — वह विवरणी दाखिल होने की प्रतीक्षा करता है।',
  'Not averaged: one is answered by an integration, the other by a rota.':
    'औसत नहीं निकाला गया: एक का उत्तर एकीकरण है, दूसरे का कार्य-बारी तालिका।',
  'Acting when the signal first appeared would have preserved more.':
    'संकेत पहली बार दिखने पर कार्रवाई की होती तो अधिक बचता।',
  'One taxpayer, assembled from every system that holds a fact about them.':
    'एक करदाता, उसके बारे में तथ्य रखने वाली प्रत्येक प्रणाली से जोड़कर बनाया गया।',
  'Officer capacity is being spent on a demand that cannot be raised.':
    'जिस माँग को उठाया ही नहीं जा सकता, उस पर अधिकारी-क्षमता व्यय हो रही है।',
  'No audit case, so no period is fixed. An absence, not time in hand.':
    'लेखापरीक्षा प्रकरण नहीं, इसलिए अवधि तय नहीं। यह अभाव है, हाथ में समय नहीं।',
  'No external system is connected — records are shaped like each feed.':
    'कोई बाह्य प्रणाली जुड़ी नहीं — अभिलेख प्रत्येक स्रोत जैसे आकार के हैं।'
})
