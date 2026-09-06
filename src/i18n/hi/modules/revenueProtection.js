import { registerMessages } from '../../locale.js'

/**
 * Hindi — Revenue Protection Command Centre.
 *
 * Continues the vocabulary fixed in statutoryAndRecovery.js and adds:
 *   exposure / at risk   → जोखिम राशि / जोखिम में
 *   recoverable          → वसूली-योग्य
 *   decay                → क्षरण
 *   deduplicated         → अपुनरावृत्त
 *   mechanism            → तंत्र
 *   deployment           → तैनाती
 */
registerMessages('hi', {
  'Leadership · Revenue Protection': 'नेतृत्व · राजस्व संरक्षण',
  'What the department is about to lose, what can still be protected, and which actions this week protect the most. Every figure is computed by the engine that owns it — nothing on this screen is illustrative.':
    'विभाग क्या खोने वाला है, अब भी क्या बचाया जा सकता है, और इस सप्ताह कौन-सी कार्रवाइयाँ सर्वाधिक बचाती हैं। प्रत्येक आँकड़ा उसी इंजन से परिकलित है जो उसका स्वामी है — इस पृष्ठ पर कुछ भी उदाहरणात्मक नहीं है।',

  'Revenue Protection Opportunity': 'राजस्व संरक्षण अवसर',
  'across {0} cases · each counted once, however many mechanisms flag it':
    '{0} प्रकरणों में · प्रत्येक एक ही बार गिना गया, चाहे कितने भी तंत्र उसे चिह्नित करें',
  'at-risk cases': 'जोखिम वाले प्रकरण',
  'Within 30 days': '30 दिनों के भीतर',
  '{0} cases': '{0} प्रकरण',
  'Decays this week': 'इस सप्ताह क्षरित',
  'if untouched': 'यदि अछूता रहा',
  Unreachable: 'अगम्य',
  'no officer available': 'कोई अधिकारी उपलब्ध नहीं',
  'Legal review': 'विधिक समीक्षा',

  '{0} across {1} cases is already beyond its limitation date.':
    '{1} प्रकरणों में {0} अपनी परिसीमा तिथि पहले ही पार कर चुका है।',
  'Excluded from the figure above, and stated beside it. Money that is gone cannot be counted as an opportunity to protect it — and the size of this number, not the size of the opportunity, is the argument for acting earlier.':
    'ऊपर के आँकड़े से बाहर रखा गया, और उसके साथ अलग से बताया गया। जो धन जा चुका है उसे बचाने का अवसर नहीं गिना जा सकता — और शीघ्र कार्रवाई का तर्क इस संख्या के आकार से बनता है, अवसर के आकार से नहीं।',

  'Where the money goes between owed and protected': 'देय और संरक्षित के बीच धन कहाँ जाता है',
  'Four steps, three different causes, three different owners. They are not netted into one recovery rate because they call for three different decisions.':
    'चार चरण, तीन भिन्न कारण, तीन भिन्न उत्तरदायी। इन्हें एक ही वसूली दर में नहीं मिलाया गया क्योंकि ये तीन भिन्न निर्णयों की माँग करते हैं।',

  'Revenue at risk over time': 'समय के साथ जोखिम में राजस्व',
  'What survives, and what is gone, if nothing is done.': 'यदि कुछ न किया जाए तो क्या बचता है और क्या चला जाता है।',
  'Still recoverable': 'अब भी वसूली-योग्य',
  'Lost — cumulative': 'क्षति — संचयी',
  '{0} left': '{0} शेष',

  'Two clocks, two responses': 'दो घड़ियाँ, दो प्रतिक्रियाएँ',
  'Split of the 180-day loss.': '180-दिवसीय हानि का विभाजन।',
  'Cliff — limitation expiry': 'कगार — परिसीमा समाप्ति',
  'Worth full value the day before, nothing the day after. Needs a notice issued.':
    'एक दिन पहले पूरा मूल्य, अगले दिन शून्य। इसके लिए सूचना जारी होनी चाहिए।',
  'Slope — downstream utilisation': 'ढलान — अनुप्रवाह उपयोग',
  'Erodes continuously while the case waits. Needs the case opened sooner.':
    'प्रकरण की प्रतीक्षा के दौरान निरंतर क्षरित होता है। इसके लिए प्रकरण शीघ्र खोला जाना चाहिए।',

  'Why this is not the sum of the modules': 'यह मॉड्यूलों का योग क्यों नहीं है',
  'The same rupee is flagged by more than one engine. Adding the mechanism totals would overstate the position by {0}.':
    'एक ही रुपया एक से अधिक इंजनों द्वारा चिह्नित होता है। तंत्रों के योग जोड़ने पर स्थिति {0} अधिक दिखाई देगी।',
  'Sum of the mechanisms': 'तंत्रों का योग',
  'What a dashboard adding its own tiles would print.': 'अपनी ही टाइलें जोड़ने वाला डैशबोर्ड यही छापता।',
  'Deduplicated union': 'अपुनरावृत्त संयोग',
  'Each taxpayer once, whatever flags it.': 'प्रत्येक करदाता एक बार, चाहे उसे कुछ भी चिह्नित करे।',
  'Double-count avoided': 'दोहरी गणना से बचाव',
  '{0}× overlap · {1} of {2} cases carry more than one mechanism':
    '{0}× अतिव्यापन · {2} में से {1} प्रकरणों में एक से अधिक तंत्र लागू',

  'Where it is concentrated': 'यह कहाँ केंद्रित है',
  'Value at risk by division, with the share no eligible officer can reach. The second bar is the deployment decision.':
    'विभाग-वार जोखिम में मूल्य, तथा वह अंश जहाँ कोई पात्र अधिकारी नहीं पहुँच सकता। दूसरी पट्टी तैनाती का निर्णय है।',
  '{0} cases · {1}% unreachable': '{0} प्रकरण · {1}% अगम्य',
  'Value at risk': 'जोखिम में मूल्य',
  'Share no eligible officer can reach': 'वह अंश जहाँ कोई पात्र अधिकारी नहीं पहुँच सकता',
  '{0} cases worth {1} require a legal view before any order issues':
    '{1} मूल्य के {0} प्रकरणों में कोई आदेश जारी करने से पूर्व विधिक राय आवश्यक है',

  'Top actions this week, by revenue protected': 'इस सप्ताह की प्रमुख कार्रवाइयाँ, संरक्षित राजस्व के क्रम में',
  'Ranked by what the action protects over the next seven days — not by the size of the case.':
    'अगले सात दिनों में कार्रवाई जो बचाती है उसके क्रम में — प्रकरण के आकार के क्रम में नहीं।',
  '{0} of these {1} actions cannot be taken this week.': 'इन {1} कार्रवाइयों में से {0} इस सप्ताह नहीं की जा सकतीं।',
  'No eligible officer in that division has capacity, or none is posted. The ranking is still correct; what is missing is somebody to act on it, which is a deployment decision rather than a scheduling one.':
    'उस विभाग में किसी पात्र अधिकारी के पास क्षमता नहीं है, अथवा कोई तैनात ही नहीं है। क्रम अब भी सही है; जो नहीं है वह उस पर कार्रवाई करने वाला व्यक्ति है, और यह अनुसूचन का नहीं बल्कि तैनाती का निर्णय है।',
  'No officer available': 'कोई अधिकारी उपलब्ध नहीं',
  '{0} days to deadline': 'समय-सीमा तक {0} दिन',
  Protects: 'बचाता है',

  'Not yet computable': 'अभी परिकलनीय नहीं',
  'Capabilities this screen would normally carry, left visibly empty rather than filled with plausible figures. Each names the input that unblocks it.':
    'जो क्षमताएँ सामान्यतः इस पृष्ठ पर होतीं, उन्हें प्रशंसनीय आँकड़ों से भरने के बजाय स्पष्ट रूप से रिक्त छोड़ा गया है। प्रत्येक उस निवेश का नाम बताती है जो उसे संभव बनाएगा।',
  'Pending data': 'डेटा प्रतीक्षित',
  'Blocked by': 'किसके कारण अवरुद्ध'
})
