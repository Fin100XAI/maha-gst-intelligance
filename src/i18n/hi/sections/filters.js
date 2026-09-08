import { registerMessages } from '../../locale.js'

/**
 * Hindi — the header filter bar's coverage notices.
 *
 * These lines appear only when an officer has set a filter the screen cannot
 * honour, so they name the dropdown they are talking about and give the reason
 * in one breath. Vocabulary follows the filter bar itself:
 *
 *   date range      → दिनांक परिसर
 *   taxpayer type   → करदाता प्रकार
 *   risk level      → जोखिम स्तर
 */
registerMessages('hi', {
  /* == Filter names, as the officer sees them on the control ============ */
  'Date range': 'दिनांक परिसर',
  'Taxpayer type': 'करदाता प्रकार',
  'Risk level': 'जोखिम स्तर',
  '{0} is not applied here.': '{0} यहाँ लागू नहीं किया गया है।',

  /* == Why a screen cannot honour a filter =============================== */
  'These are case records. Filing status is held on the taxpayer, not on the case, so the platform cannot narrow this list by it without guessing which taxpayer each case belongs to.':
    'ये प्रकरण-अभिलेख हैं। विवरणी-स्थिति करदाता पर दर्ज होती है, प्रकरण पर नहीं — इसलिए प्रत्येक प्रकरण किस करदाता का है यह अनुमान लगाए बिना मंच इस सूची को उसके आधार पर सीमित नहीं कर सकता।',
  'This screen reads a current-state register rather than a stream of dated events, so there is no date on the records to narrow against.':
    'यह पर्दा दिनांकित घटनाओं की धारा के बजाय वर्तमान-स्थिति पंजी पढ़ता है, इसलिए सीमित करने हेतु अभिलेखों पर कोई दिनांक ही नहीं है।',
  'The window this screen measures runs forward from today, so a past date range would not change what it shows.':
    'यह पर्दा जिस अवधि को मापता है वह आज से आगे चलती है, इसलिए पिछले दिनांक परिसर से वह जो दिखाता है उसमें कोई अंतर नहीं आएगा।',
  'The recovery window is measured forward from today, so a past date range would not change what is still recoverable.':
    'वसूली की अवधि आज से आगे मापी जाती है, इसलिए पिछले दिनांक परिसर से यह नहीं बदलेगा कि अब भी क्या वसूल किया जा सकता है।',
  'The queue is ranked on what is workable now, so it is built from the open position rather than from cases opened inside a chosen window.':
    'कतार इस आधार पर क्रमबद्ध होती है कि अभी क्या निपटाया जा सकता है, इसलिए वह चुनी गई अवधि में खुले प्रकरणों से नहीं बल्कि वर्तमान खुली स्थिति से बनती है।',
  'ITC ratios describe a taxpayer as they stand today, computed from the whole filing history rather than from returns inside a window.':
    'ITC अनुपात करदाता की आज की स्थिति बताते हैं; वे किसी अवधि की विवरणियों से नहीं, बल्कि सम्पूर्ण विवरणी-इतिहास से निकाले जाते हैं।',
  'District collection is held as a single current-period book with no monthly series behind it, so there is no period to narrow to.':
    'जिला वसूली मासिक शृंखला के बिना एक ही चालू-अवधि की बही में रखी जाती है, इसलिए सीमित करने हेतु कोई अवधि उपलब्ध नहीं है।',
  'Dropped on purpose: this screen exists to compare sectors against one another, and narrowing to a single sector would leave nothing to compare it with. Pick a sector in the selector below instead.':
    'जानबूझकर छोड़ा गया: यह पर्दा क्षेत्रों की आपस में तुलना करने के लिए ही है, और एक ही क्षेत्र तक सीमित करने पर तुलना के लिए कुछ बचेगा ही नहीं। इसके बजाय नीचे दिए चयनक से क्षेत्र चुनें।',

  /* == Units the scope banner counts in ================================= */
  alerts: 'चेतावनियाँ',
  taxpayers: 'करदाता',
  districts: 'जिले',
  'refund claims': 'रिफंड दावे',
  'transit records': 'पारगमन अभिलेख',
  'open proceedings': 'खुली कार्यवाहियाँ',
  'cases in the recovery window': 'वसूली अवधि के प्रकरण'
})
