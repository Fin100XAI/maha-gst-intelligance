import { registerMessages } from '../../locale.js'

/**
 * Hindi — Case Priority Engine, Case Digital Twin, Officer AI Copilot.
 *
 *   priority        → प्राथमिकता
 *   officer-day     → अधिकारी-दिवस
 *   exposure        → जोखिम राशि
 *   recoverability  → वसूली-क्षमता
 *   proxy           → प्रातिनिधिक निर्देशक
 *   control arm     → नियंत्रण समूह
 *   stratified      → स्तरीकृत
 *   chronology      → कालक्रम
 *   twin            → ट्विन (transliterated — it names the unified record)
 *   grounded        → अभिलेख-आधारित
 */
registerMessages('hi', {
  /* == Case Priority Engine — header and method ========================== */
  'Enforcement · Case Selection': 'प्रवर्तन · प्रकरण चयन',
  'Six factors, divided by the officer-days a case would take. Risk score answers how wrong something is; this answers what deserves an officer’s week.':
    'छह कारक, प्रकरण में लगने वाले अधिकारी-दिवसों से विभाजित। जोखिम अंक बताता है कि कुछ कितना गलत है; यह बताता है कि किसे अधिकारी का एक सप्ताह मिलना चाहिए।',
  'How a case is ranked': 'प्रकरण का क्रम कैसे तय होता है',
  Priority: 'प्राथमिकता',
  'Risk rank': 'जोखिम क्रम',
  'Statutory clock': 'सांविधिक घड़ी',
  'Officer-days': 'अधिकारी-दिवस',
  'officer-days': 'अधिकारी-दिवस',
  'Risk severity': 'जोखिम की गंभीरता',
  'Revenue exposure': 'राजस्व जोखिम राशि',
  Recoverability: 'वसूली-क्षमता',
  'Time to statutory deadline': 'सांविधिक समय-सीमा तक शेष समय',
  'Network propagation': 'नेटवर्क में प्रसार',
  Network: 'नेटवर्क',
  'Probability of recovery': 'वसूली की प्रायिकता',
  'Officer-days required': 'आवश्यक अधिकारी-दिवस',
  'Only one factor is not a judgement: the statutory clock comes from law, and carries the widest range — a case that can no longer be actioned is worth little regardless of how large it is. Probability of recovery is a transparent proxy over observable facts, not a learned estimate; the platform has no completed outcomes to learn from yet, and saying otherwise would be the fastest way to discredit it.':
    'केवल एक कारक निर्णय नहीं है: सांविधिक घड़ी विधि से आती है, और उसका विस्तार सबसे अधिक है — जिस प्रकरण पर अब कार्रवाई ही नहीं हो सकती, वह कितना भी बड़ा हो, उसका मूल्य अल्प है। वसूली की प्रायिकता निरीक्षण-योग्य तथ्यों पर आधारित पारदर्शी प्रातिनिधिक निर्देशक है, सीखा हुआ आकलन नहीं; मंच के पास सीखने योग्य एक भी पूर्ण परिणाम अभी नहीं है, और इसके विपरीत कहना मंच की विश्वसनीयता समाप्त करने का सबसे तेज़ मार्ग होगा।',

  /* == Case Priority Engine — summary ==================================== */
  'Cases scored': 'अंकित प्रकरण',
  'Moved 10+ places': '10+ स्थान बदले',
  'vs risk rank': 'जोखिम क्रम के सापेक्ष',
  'High-risk but time-barred': 'उच्च जोखिम किंतु कालातीत',
  deprioritised: 'प्राथमिकता घटाई गई',
  'Recoverable in top 40': 'शीर्ष 40 में वसूली-योग्य',

  /* == Case Priority Engine — queue ====================================== */
  'Priority queue': 'प्राथमिकता पंक्ति',
  'Equity monitor': 'समता निगरानी',
  'Controlled comparison': 'नियंत्रित तुलना',
  'Ranked working queue': 'क्रमबद्ध कार्य पंक्ति',
  '{0} officer-days across the top 40 — click any row for the full factor breakdown and why it moved.':
    'शीर्ष 40 प्रकरणों में कुल {0} अधिकारी-दिवस — पूर्ण कारक विभाजन और वह क्यों हिला, यह देखने हेतु किसी भी पंक्ति पर क्लिक करें।',
  'Search the queue...': 'पंक्ति में खोजें...',
  'Ranking is advisory — case allocation remains an officer decision':
    'क्रम सलाहकारी है — प्रकरण आवंटन अधिकारी का ही निर्णय रहता है',

  /* == Case Priority Engine — per-case explanation ======================= */
  'Why this case sits at #{0}': 'यह प्रकरण #{0} पर क्यों है',
  'In plain terms': 'सरल शब्दों में',
  'Factor contributions': 'कारकों का योगदान',
  'Time sensitivity': 'समय की संवेदनशीलता',
  'no clock': 'घड़ी नहीं',
  expired: 'समाप्त',
  'P(recovery)': 'वसूली प्रायिकता',
  proxy: 'प्रातिनिधिक निर्देशक',
  'Divided by {0} officer-days → priority score {1}':
    '{0} अधिकारी-दिवसों से विभाजित → प्राथमिकता अंक {1}',
  'Recovery proxies applied': 'लागू वसूली निर्देशक',
  'None — baseline 0.50 applied.': 'कोई नहीं — आधार 0.50 लागू।',
  'Effort estimate': 'श्रम आकलन',
  Total: 'कुल',

  /* == Case Priority Engine — equity monitor ============================= */
  '{0} group(s) selected at more than twice their share of the population.':
    'जनसंख्या में उनके हिस्से के दोगुने से अधिक अनुपात में {0} समूह चयनित हुए हैं।',
  'This is not necessarily wrong — risk may genuinely concentrate — but it must be explainable if challenged. Review before the queue is worked.':
    'यह आवश्यक रूप से गलत नहीं है — जोखिम वास्तव में केंद्रित हो सकता है — किंतु चुनौती दिए जाने पर इसका स्पष्टीकरण देना संभव होना चाहिए। पंक्ति निपटाने से पूर्व समीक्षा करें।',
  'No sector or district is selected at more than twice its share of the case population. The working queue does not concentrate enforcement beyond the underlying risk distribution.':
    'कोई भी क्षेत्र अथवा जिला प्रकरण-संख्या में अपने हिस्से के दोगुने से अधिक अनुपात में चयनित नहीं है। कार्य पंक्ति अंतर्निहित जोखिम वितरण से आगे प्रवर्तन को केंद्रित नहीं करती।',
  'By sector': 'क्षेत्रवार',
  'By district': 'जिलावार',
  'Share of the top-40 working queue against share of all scored cases':
    'सभी अंकित प्रकरणों में हिस्से के सापेक्ष शीर्ष-40 कार्य पंक्ति में हिस्सा',

  /* == Case Priority Engine — controlled comparison ====================== */
  'Pilot design': 'पायलट अभिकल्प',
  'A demonstration proves the screen works. Only a comparison proves the ranking does.':
    'प्रदर्शन केवल यह सिद्ध करता है कि पर्दा काम करता है। क्रम काम करता है, यह केवल तुलना ही सिद्ध कर सकती है।',
  'If cases are re-ordered and recovery improves, that gain cannot be attributed to the platform without a control arm — officer skill, case mix and the effect of being observed all explain it equally well. Both arms are worked at normal capacity; only the ordering differs.':
    'यदि प्रकरणों का क्रम बदलने पर वसूली सुधरती है, तो नियंत्रण समूह के बिना वह लाभ मंच को नहीं दिया जा सकता — अधिकारी का कौशल, प्रकरणों का मिश्रण और निरीक्षण में होने का प्रभाव, ये सभी उसे उतनी ही अच्छी तरह समझाते हैं। दोनों समूह सामान्य क्षमता पर ही निपटाए जाते हैं; अंतर केवल क्रम का है।',
  'Arm balance': 'समूहों का संतुलन',
  'Stratified across {0} strata by exposure decile and risk band':
    'जोखिम राशि दशमक एवं जोखिम वर्ग के अनुसार {0} स्तरों में स्तरीकृत',
  Metric: 'मापक',
  Platform: 'मंच',
  Control: 'नियंत्रण',
  'What gets measured': 'क्या मापा जाता है',
  'Endpoints fixed before the trial runs': 'परीक्षण आरंभ होने से पूर्व नियत परिणाम-बिंदु',
  Primary: 'प्राथमिक',
  Secondary: 'द्वितीयक',
  Conditions: 'शर्तें',

  /* == Case Digital Twin ================================================= */
  'Revenue · Unified Case Record': 'राजस्व · एकीकृत प्रकरण अभिलेख',
  'One taxpayer, one chronology, one exposure, one legal position, one recommended next action — assembled from every system that holds a piece of them. Every fact states the system it came from.':
    'एक करदाता, एक कालक्रम, एक जोखिम राशि, एक विधिक स्थिति, एक अनुशंसित अगली कार्रवाई — उन सभी प्रणालियों से जोड़कर बनाई गई जिनके पास इनका कोई अंश है। प्रत्येक तथ्य बताता है कि वह किस प्रणाली से आया।',
  '{0} case(s) — ordered by how soon action is required':
    '{0} प्रकरण — कार्रवाई की तात्कालिकता के क्रम में',
  'No cases match the current filters.': 'वर्तमान फ़िल्टर से कोई प्रकरण मेल नहीं खाता।',
  'What is at stake and what remains recoverable': 'दाँव पर क्या है और वसूली-योग्य क्या शेष है',
  'Estimated exposure': 'अनुमानित जोखिम राशि',
  'Recoverable now': 'अभी वसूली-योग्य',
  'Decays in 7 days': '7 दिनों में क्षय',
  'Signal age': 'संकेत की आयु',
  'Why flagged': 'चिह्नित क्यों',
  'Legal position': 'विधिक स्थिति',
  'The statutory clock on this proceeding': 'इस कार्यवाही पर सांविधिक घड़ी',
  'Contested extension': 'विवादित अवधि-विस्तार',
  'No proceeding is currently running against a statutory clock for this taxpayer.':
    'इस करदाता के लिए इस समय कोई कार्यवाही सांविधिक घड़ी के विरुद्ध नहीं चल रही।',
  'Unified chronology': 'एकीकृत कालक्रम',
  '{0} events merged across systems. Today this is reconstructed by hand from each system in turn.':
    'विभिन्न प्रणालियों से जोड़ी गई {0} घटनाएँ। आज यह प्रत्येक प्रणाली से एक-एक कर हाथ से पुनः जोड़ना पड़ता है।',
  'Proceedings on record': 'अभिलेख पर कार्यवाहियाँ',
  'Notices issued': 'जारी नोटिस',
  'Audit cases': 'लेखापरीक्षा प्रकरण',
  'Refund claims': 'प्रतिदाय दावे',
  Appeals: 'अपीलें',
  'Open compliance alerts': 'खुली अनुपालन सूचनाएँ',
  'Network cluster': 'नेटवर्क समूह',
  'Not linked': 'संबद्ध नहीं',
  'Source coverage': 'स्रोतों की व्याप्ति',
  'Which systems contributed to this twin': 'इस ट्विन में किन प्रणालियों का योगदान है',
  Live: 'सजीव',
  'In this demonstration no external system is connected — the twin is assembled from generated records shaped like each source. A production deployment reads these feeds directly.':
    'इस प्रदर्शन में कोई बाह्य प्रणाली जुड़ी नहीं है — ट्विन प्रत्येक स्रोत के आकार के निर्मित अभिलेखों से जोड़ा गया है। वास्तविक तैनाती में ये स्रोत सीधे पढ़े जाते हैं।',
  'A unified view is decision support — verify against the source record before acting':
    'एकीकृत दृश्य निर्णय-सहायता है — कार्रवाई से पूर्व मूल अभिलेख से पुष्टि करें',
  'Recommended next action': 'अनुशंसित अगली कार्रवाई',

  /* == Officer AI Copilot ================================================ */
  'Enforcement · Case Retrieval': 'प्रवर्तन · प्रकरण पुनःप्राप्ति',
  'Answers drawn from the case record, not generated. Every statement cites the record and the system it came from; a question that cannot be grounded is declined, naming the feed that would be needed to answer it.':
    'उत्तर प्रकरण अभिलेख से लिए गए हैं, निर्मित नहीं। प्रत्येक कथन अभिलेख और उसकी स्रोत प्रणाली का संदर्भ देता है; जिस प्रश्न को अभिलेख का आधार नहीं दिया जा सकता, वह अस्वीकार कर दिया जाता है और बताया जाता है कि उत्तर हेतु कौन-सा स्रोत चाहिए।',
  'Ask about this case': 'इस प्रकरण के बारे में पूछें',
  'Grounded questions return cited statements. The three marked below cannot be grounded on the feeds currently connected.':
    'अभिलेख-आधारित प्रश्न संदर्भ सहित कथन लौटाते हैं। नीचे चिह्नित तीन को इस समय जुड़े स्रोतों पर आधार नहीं दिया जा सकता।',
  'Select a question above. Answers are assembled from the case record — nothing here is generated, and nothing is asserted without a citation.':
    'ऊपर से कोई प्रश्न चुनें। उत्तर प्रकरण अभिलेख से जोड़े जाते हैं — यहाँ कुछ भी निर्मित नहीं है, और संदर्भ के बिना कुछ भी दृढ़तापूर्वक नहीं कहा गया।',
  '{0} statement(s), each cited to the record behind it':
    '{0} कथन, प्रत्येक अपने पीछे के अभिलेख के संदर्भ सहित',
  'Retrieved from the case record — verify against the source system before acting':
    'प्रकरण अभिलेख से लिया गया — कार्रवाई से पूर्व मूल प्रणाली से पुष्टि करें',
  'Cannot be answered from the record': 'अभिलेख से इसका उत्तर नहीं दिया जा सकता',
  'What would be required': 'क्या आवश्यक होगा'
})
