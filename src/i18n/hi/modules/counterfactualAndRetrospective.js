import { registerMessages } from '../../locale.js'

/**
 * Hindi — Counterfactual Case Intelligence and Missed Revenue Discovery.
 *
 *   counterfactual      → प्रति-तथ्य
 *   queue dwell         → पंक्ति में ठहराव
 *   detection latency   → पहचान में विलंब
 *   recovery curve      → वसूली वक्र
 *   causal claim        → कारण-संबंधी दावा
 *   retrospective       → पूर्वव्यापी
 *   review candidate    → समीक्षा उम्मीदवार
 *   separation test     → पृथक्करण परीक्षण
 *   effect size         → प्रभाव आकार
 *   positive class      → सकारात्मक वर्ग
 *   contrast class      → विरोधी वर्ग
 *   sustained           → कायम रहा
 */
registerMessages('hi', {
  /* == Counterfactual Case Intelligence ================================== */
  'Missed Revenue · Counterfactual': 'छूटा राजस्व · प्रति-तथ्य',
  'What the same action, taken earlier, would have been worth on a given case — with comparable concluded proceedings shown as the evidence behind the comparison. Timing only: what a different escalation route would have produced is a causal claim this platform does not make, and the screen says so.':
    'वही कार्रवाई पहले की गई होती तो किसी प्रकरण में उसका मूल्य कितना होता — तुलना के पीछे के साक्ष्य के रूप में तुलनीय निपटाई गई कार्यवाहियाँ दिखाते हुए। केवल समय तक सीमित: किसी भिन्न वरिष्ठ-स्तर मार्ग से क्या होता, यह कारण-संबंधी दावा यह मंच नहीं करता, और पर्दा यह स्पष्ट कहता है।',
  'Lost to queue dwell': 'पंक्ति में ठहराव से खोया',
  '₹ Cr — controllable': '₹ करोड़ — नियंत्रणीय',
  'Lost to detection latency': 'पहचान में विलंब से खोया',
  '₹ Cr — data-feed': '₹ करोड़ — आँकड़ा स्रोत',
  'Median queue wait': 'पंक्ति में मध्यक प्रतीक्षा',
  'signal visible to worked': 'संकेत दिखने से निपटान तक',
  '₹ Cr today': '₹ करोड़ आज',
  'Where the lag sits across the portfolio': 'पूरे समुच्चय में विलंब कहाँ है',
  'Queue dwell': 'पंक्ति में ठहराव',
  Detection: 'पहचान',
  cases: 'प्रकरण',
  queue: 'पंक्ति',
  signal: 'संकेत',
  'Forgone by waiting': 'प्रतीक्षा में गँवाया',
  'signal first visible': 'संकेत पहली बार दिखा',
  'The same action, taken on four different days': 'वही कार्रवाई, चार अलग-अलग दिनों पर की गई',
  'Each bar is the recovery curve evaluated at that day. None of them models a different action.':
    'प्रत्येक स्तंभ उस दिन पर मापा गया वसूली वक्र है। इनमें से कोई भी किसी भिन्न कार्रवाई का प्रारूप नहीं बनाता।',
  'what happened': 'वास्तव में क्या हुआ',
  'ceiling — not achievable': 'अधिकतम सीमा — प्राप्य नहीं',
  day: 'दिन',
  'The gap that was controllable': 'वह अंतर जो नियंत्रण में था',
  'Acting when the signal first became visible would have preserved {0}. The case was worked {1} days later and {2} remained. The difference, {3}, was lost to queue dwell rather than to anything about the taxpayer.':
    'संकेत पहली बार दिखते ही कार्रवाई की गई होती तो {0} बचा रहता। प्रकरण {1} दिन बाद निपटाया गया और {2} शेष रहा। यह {3} का अंतर करदाता से जुड़ी किसी बात से नहीं, बल्कि पंक्ति में ठहराव से खोया गया।',
  'The evidence driving the comparison — concluded cases comparable on the dimensions that decide outcomes, with what actually happened in each.':
    'तुलना का आधार बनने वाला साक्ष्य — परिणाम तय करने वाले आयामों पर तुलनीय निपटाए गए प्रकरण, प्रत्येक में वास्तव में क्या हुआ इसके साथ।',
  comparability: 'तुलनीयता',
  'Timing only — not a different decision': 'केवल समय तक सीमित — भिन्न निर्णय नहीं',

  /* == Missed Revenue Discovery ========================================== */
  'Missed Revenue · Retrospective': 'छूटा राजस्व · पूर्वव्यापी',
  'Closed audits and no-action cases re-examined against the signals that were live at the time. Produces explainable review candidates for an officer to judge — never an automatic Section 74 classification, and the screen shows why that refusal is a measurement rather than a caution.':
    'निपटाई गई लेखापरीक्षाएँ और बिना कार्रवाई वाले प्रकरण, उस समय सक्रिय रहे संकेतों के सापेक्ष पुनः जाँचे गए। इससे ऐसे स्पष्टीकरण-योग्य समीक्षा उम्मीदवार बनते हैं जिन पर अधिकारी निर्णय ले — धारा 74 का स्वचालित वर्गीकरण कभी नहीं, और यह इनकार सावधानी नहीं बल्कि एक माप है, यह पर्दा दिखाता है।',
  'Review candidates': 'समीक्षा उम्मीदवार',
  'Closed with signals live': 'संकेत सक्रिय रहते हुए निपटाए गए',
  'audit closed anyway': 'फिर भी लेखापरीक्षा बंद',
  'Never actioned': 'कभी कार्रवाई नहीं',
  'no notice ever issued': 'कभी कोई नोटिस जारी नहीं',
  'Clock confirmed live': 'घड़ी सक्रिय होना पुष्ट',
  'of {0} — see caveat': '{0} में से — चेतावनी देखें',
  '{0} of these {1} carry a confirmed live limitation clock.':
    'इनमें से {0} {1} पर पुष्ट रूप से सक्रिय परिसीमा घड़ी है।',
  rules: 'नियम',
  'Signals live at the time': 'उस समय सक्रिय रहे संकेत',
  'The encoded rules that were firing when this case was put down.':
    'जब यह प्रकरण अलग रखा गया, तब लागू हो रहे संकेतबद्ध नियम।',
  'What the department did': 'विभाग ने क्या किया',
  'Risk score': 'जोखिम अंक',
  Limitation: 'परिसीमा',
  'not established': 'सिद्ध नहीं',
  'What happened in cases comparable on the dimensions that decide outcomes. Evidence for a judgement, not a prediction.':
    'परिणाम तय करने वाले आयामों पर तुलनीय प्रकरणों में क्या हुआ। यह निर्णय हेतु साक्ष्य है, भविष्यवाणी नहीं।',
  'Before this is reopened': 'इसे पुनः खोलने से पूर्व',
  'In order. None of it is done by this screen.': 'क्रम से। इनमें से कुछ भी यह पर्दा नहीं करता।',

  /* == Missed Revenue Discovery — the separation test ==================== */
  'A review candidate, not a classification': 'समीक्षा उम्मीदवार, वर्गीकरण नहीं',
  'No automatic Section 74 classification — and not because the sample is small.':
    'धारा 74 का कोई स्वचालित वर्गीकरण नहीं — और इसलिए नहीं कि नमूना छोटा है।',
  'The separation test': 'पृथक्करण परीक्षण',
  'Before a resemblance model is built, the cases it learns from must differ from the cases it will screen. Measured per feature, reported whatever it says.':
    'समानता पहचानने वाला प्रारूप बनाने से पूर्व, वह जिन प्रकरणों से सीखता है वे उन प्रकरणों से भिन्न होने चाहिए जिनकी वह छानबीन करेगा। प्रत्येक लक्षण पर मापा गया, और परिणाम जो भी हो वैसा ही दर्ज।',
  'Positive class': 'सकारात्मक वर्ग',
  'sustained on appeal': 'अपील में कायम रहे',
  'Contrast class': 'विरोधी वर्ग',
  'reversed or remanded': 'निरस्त अथवा पुनर्विचार हेतु प्रतिप्रेषित',
  Baseline: 'आधाररेखा',
  'all litigation': 'सभी मुकदमे',
  'Features that separate': 'पृथक्करण करने वाले लक्षण',
  'none reach 0.5': 'कोई भी 0.5 तक नहीं पहुँचता',
  Feature: 'लक्षण',
  'Cases we won': 'हमारे जीते प्रकरण',
  'All cases': 'सभी प्रकरण',
  'Effect size': 'प्रभाव आकार',
  'Usable signal?': 'प्रयोग-योग्य संकेत?',
  'Why more cases would not fix this': 'अधिक प्रकरणों से यह क्यों नहीं सुलझेगा',
  'And the contrast class is empty in practice': 'और विरोधी वर्ग व्यवहार में रिक्त है',
  'What is actually needed': 'वास्तव में क्या आवश्यक है'
})
