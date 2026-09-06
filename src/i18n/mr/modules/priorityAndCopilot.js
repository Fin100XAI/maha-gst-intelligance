import { registerMessages } from '../../locale.js'

/**
 * Marathi — Case Priority Engine and Officer AI Copilot.
 *
 *   priority        → प्राधान्य
 *   ranking         → क्रमवारी
 *   officer-day     → अधिकारी-दिवस
 *   exposure        → जोखीम रक्कम
 *   recoverability  → वसूलक्षमता
 *   proxy           → प्रातिनिधिक निर्देशक
 *   control arm     → नियंत्रण गट
 *   stratified      → स्तरीकृत
 *   grounded        → अभिलेखाधारित   (an answer that cites the record)
 *   cited           → संदर्भासह
 */
registerMessages('mr', {
  /* == Case Priority Engine — header and method =========================== */
  'Enforcement · Case Selection': 'अंमलबजावणी · प्रकरण निवड',
  'Six factors, divided by the officer-days a case would take. Risk score answers how wrong something is; this answers what deserves an officer’s week.':
    'सहा घटक, प्रकरणाला लागणाऱ्या अधिकारी-दिवसांनी भागिले. जोखीम गुणांक हे किती चुकीचे आहे याचे उत्तर देतो; हे अधिकाऱ्याचा आठवडा कशाला द्यावा याचे उत्तर देते.',
  'How a case is ranked': 'प्रकरणाची क्रमवारी कशी ठरते',
  Priority: 'प्राधान्य',
  'Risk rank': 'जोखीम क्रम',
  'Statutory clock': 'सांविधिक घड्याळ',
  'Officer-days': 'अधिकारी-दिवस',
  'officer-days': 'अधिकारी-दिवस',
  'Risk severity': 'जोखमीची तीव्रता',
  'Revenue exposure': 'महसूल जोखीम रक्कम',
  Recoverability: 'वसूलक्षमता',
  'Time to statutory deadline': 'सांविधिक मुदतीस उरलेला काळ',
  'Network propagation': 'नेटवर्कमधून होणारा प्रसार',
  'Probability of recovery': 'वसुलीची संभाव्यता',
  'Officer-days required': 'आवश्यक अधिकारी-दिवस',
  'Only one factor is not a judgement: the statutory clock comes from law, and carries the widest range — a case that can no longer be actioned is worth little regardless of how large it is. Probability of recovery is a transparent proxy over observable facts, not a learned estimate; the platform has no completed outcomes to learn from yet, and saying otherwise would be the fastest way to discredit it.':
    'फक्त एकच घटक हा मत नाही: सांविधिक घड्याळ कायद्यातून येते, आणि त्याची व्याप्ती सर्वाधिक आहे — ज्या प्रकरणावर आता कारवाईच होऊ शकत नाही ते कितीही मोठे असले तरी त्याचे मूल्य अल्प आहे. वसुलीची संभाव्यता हा निरीक्षणीय तथ्यांवरील पारदर्शक प्रातिनिधिक निर्देशक आहे, शिकून काढलेला अंदाज नाही; मंचाकडे शिकण्यासाठी अद्याप एकही पूर्ण झालेला निष्कर्ष नाही, आणि उलट सांगणे हा मंचाची विश्वासार्हता घालवण्याचा सर्वात जलद मार्ग ठरेल.',

  /* == Case Priority Engine — summary ===================================== */
  'Cases scored': 'गुणांकित प्रकरणे',
  'Moved 10+ places': '१०+ स्थानांनी हलली',
  'vs risk rank': 'जोखीम क्रमाच्या तुलनेत',
  'High-risk but time-barred': 'उच्च जोखीम पण मुदतबाह्य',
  deprioritised: 'प्राधान्य कमी केलेली',
  'Recoverable in top 40': 'पहिल्या ४० मधील वसूलपात्र',

  /* == Case Priority Engine — tabs and queue ============================== */
  'Priority queue': 'प्राधान्य रांग',
  'Equity monitor': 'समन्यायता निरीक्षण',
  'Controlled comparison': 'नियंत्रित तुलना',
  'Ranked working queue': 'क्रमवारी लावलेली कार्यरांग',
  '{0} officer-days across the top 40 — click any row for the full factor breakdown and why it moved.':
    'पहिल्या ४० प्रकरणांत मिळून {0} अधिकारी-दिवस — संपूर्ण घटक विभागणी व ते का हलले हे पाहण्यासाठी कोणत्याही ओळीवर क्लिक करा.',
  'Search the queue...': 'रांगेत शोधा...',
  'Ranking is advisory — case allocation remains an officer decision':
    'क्रमवारी ही सल्लात्मक आहे — प्रकरण वाटप हा अधिकाऱ्याचाच निर्णय राहतो',

  /* == Case Priority Engine — the per-case explanation ==================== */
  'Why this case sits at #{0}': 'हे प्रकरण #{0} वर का आहे',
  'In plain terms': 'सोप्या शब्दांत',
  'Factor contributions': 'घटकांचे योगदान',
  'Time sensitivity': 'काळाची निकड',
  'no clock': 'घड्याळ नाही',
  expired: 'संपली',
  'P(recovery)': 'वसुली संभाव्यता',
  proxy: 'प्रातिनिधिक निर्देशक',
  'Divided by {0} officer-days → priority score {1}':
    '{0} अधिकारी-दिवसांनी भागिले → प्राधान्य गुणांक {1}',
  'Recovery proxies applied': 'लागू केलेले वसुली निर्देशक',
  'None — baseline 0.50 applied.': 'एकही नाही — आधारभूत ०.५० लागू.',
  'Effort estimate': 'श्रमाचा अंदाज',
  Total: 'एकूण',

  /* == Case Priority Engine — equity monitor ============================== */
  '{0} group(s) selected at more than twice their share of the population.':
    'लोकसंख्येतील त्यांच्या वाट्याच्या दुपटीहून अधिक प्रमाणात {0} गट निवडले गेले आहेत.',
  'This is not necessarily wrong — risk may genuinely concentrate — but it must be explainable if challenged. Review before the queue is worked.':
    'हे आवश्यक नाही की चूक असेल — जोखीम खरोखर एकवटलेली असू शकते — परंतु आव्हान दिल्यास त्याचे स्पष्टीकरण देता आले पाहिजे. रांग हाताळण्यापूर्वी तपासा.',
  'No sector or district is selected at more than twice its share of the case population. The working queue does not concentrate enforcement beyond the underlying risk distribution.':
    'कोणतेही क्षेत्र किंवा जिल्हा प्रकरण-संख्येतील त्याच्या वाट्याच्या दुपटीहून अधिक प्रमाणात निवडलेला नाही. कार्यरांग अंतर्निहित जोखीम वितरणापलीकडे अंमलबजावणी एकवटत नाही.',
  'By sector': 'क्षेत्रानुसार',
  'By district': 'जिल्ह्यानुसार',
  'Share of the top-40 working queue against share of all scored cases':
    'सर्व गुणांकित प्रकरणांतील वाट्याच्या तुलनेत पहिल्या ४० कार्यरांगेतील वाटा',

  /* == Case Priority Engine — controlled comparison ======================= */
  'Pilot design': 'पायलट रचना',
  'A demonstration proves the screen works. Only a comparison proves the ranking does.':
    'प्रात्यक्षिक हे पडदा चालतो एवढेच सिद्ध करते. क्रमवारी चालते हे केवळ तुलनाच सिद्ध करू शकते.',
  'If cases are re-ordered and recovery improves, that gain cannot be attributed to the platform without a control arm — officer skill, case mix and the effect of being observed all explain it equally well. Both arms are worked at normal capacity; only the ordering differs.':
    'प्रकरणांचा क्रम बदलल्यावर वसुली सुधारली, तरी नियंत्रण गटाशिवाय तो लाभ मंचाला दिला जाऊ शकत नाही — अधिकाऱ्याचे कौशल्य, प्रकरणांचे मिश्रण आणि निरीक्षणाखाली असल्याचा परिणाम हे सर्व तितकेच चांगले स्पष्टीकरण देतात. दोन्ही गट नेहमीच्याच क्षमतेने हाताळले जातात; फरक फक्त क्रमाचा असतो.',
  'Arm balance': 'गटांचा समतोल',
  'Stratified across {0} strata by exposure decile and risk band':
    'जोखीम रक्कम दशमांश व जोखीम पट्ट्यानुसार {0} स्तरांत स्तरीकृत',
  Metric: 'मापक',
  Platform: 'मंच',
  Control: 'नियंत्रण',
  'What gets measured': 'काय मोजले जाते',
  'Endpoints fixed before the trial runs': 'चाचणी सुरू होण्यापूर्वी निश्चित केलेले निष्कर्ष-बिंदू',
  Primary: 'प्राथमिक',
  Secondary: 'दुय्यम',
  Conditions: 'अटी',

  /* == Officer AI Copilot ================================================= */
  'Enforcement · Case Retrieval': 'अंमलबजावणी · प्रकरण पुनर्प्राप्ती',
  'Answers drawn from the case record, not generated. Every statement cites the record and the system it came from; a question that cannot be grounded is declined, naming the feed that would be needed to answer it.':
    'उत्तरे प्रकरणाच्या अभिलेखातून घेतलेली आहेत, निर्माण केलेली नाहीत. प्रत्येक विधान अभिलेख व तो कोणत्या प्रणालीतून आला याचा संदर्भ देते; ज्या प्रश्नाला अभिलेखाचा आधार देता येत नाही तो नाकारला जातो, आणि त्याचे उत्तर देण्यासाठी कोणता स्रोत लागेल हे सांगितले जाते.',
  'Search GSTIN or trade name': 'GSTIN किंवा व्यापारी नाव शोधा',
  'No cases match the current filters.': 'सध्याच्या गाळण्यांशी कोणतेही प्रकरण जुळत नाही.',
  'Ask about this case': 'या प्रकरणाबद्दल विचारा',
  'Grounded questions return cited statements. The three marked below cannot be grounded on the feeds currently connected.':
    'अभिलेखाधारित प्रश्न संदर्भासह विधाने परत देतात. खाली चिन्हांकित केलेल्या तिघांना सध्या जोडलेल्या स्रोतांवर आधार देता येत नाही.',
  'Select a question above. Answers are assembled from the case record — nothing here is generated, and nothing is asserted without a citation.':
    'वरील एक प्रश्न निवडा. उत्तरे प्रकरणाच्या अभिलेखातून जुळवली जातात — येथे काहीही निर्माण केलेले नाही, आणि संदर्भाशिवाय काहीही ठामपणे सांगितलेले नाही.',
  '{0} statement(s), each cited to the record behind it':
    '{0} विधान(े), प्रत्येक त्यामागील अभिलेखाच्या संदर्भासह',
  'as at': 'या दिनांकास',
  'Retrieved from the case record — verify against the source system before acting':
    'प्रकरणाच्या अभिलेखातून घेतलेले — कारवाई करण्यापूर्वी मूळ प्रणालीशी पडताळून पहा',
  'Cannot be answered from the record': 'अभिलेखातून याचे उत्तर देता येत नाही',
  'What would be required': 'काय आवश्यक असेल',
  Connected: 'जोडलेले',
  'Not integrated': 'एकत्रित केलेले नाही'
})
