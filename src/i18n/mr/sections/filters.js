import { registerMessages } from '../../locale.js'

/**
 * Marathi — the header filter bar's coverage notices.
 *
 * These lines appear only when an officer has set a filter the screen cannot
 * honour, so they name the dropdown they are talking about and give the reason
 * in one breath. Vocabulary follows the filter bar itself:
 *
 *   date range      → दिनांक पल्ला
 *   taxpayer type   → करदाता प्रकार
 *   risk level      → जोखीम पातळी
 */
registerMessages('mr', {
  /* == Filter names, as the officer sees them on the control ============ */
  'Date range': 'दिनांक पल्ला',
  'Taxpayer type': 'करदाता प्रकार',
  'Risk level': 'जोखीम पातळी',
  '{0} is not applied here.': '{0} येथे लागू केलेला नाही.',

  /* == Why a screen cannot honour a filter =============================== */
  'These are case records. Filing status is held on the taxpayer, not on the case, so the platform cannot narrow this list by it without guessing which taxpayer each case belongs to.':
    'या प्रकरण-नोंदी आहेत. विवरण-स्थिती करदात्यावर नोंदलेली असते, प्रकरणावर नव्हे — त्यामुळे प्रत्येक प्रकरण कोणत्या करदात्याचे आहे याचा अंदाज बांधल्याशिवाय मंच ही यादी त्यानुसार मर्यादित करू शकत नाही.',
  'This screen reads a current-state register rather than a stream of dated events, so there is no date on the records to narrow against.':
    'हा पडदा दिनांकित घटनांच्या प्रवाहाऐवजी सद्य-स्थिती नोंदवही वाचतो, त्यामुळे मर्यादित करण्यासाठी नोंदींवर दिनांकच नाही.',
  'The window this screen measures runs forward from today, so a past date range would not change what it shows.':
    'हा पडदा जी कालमर्यादा मोजतो ती आजपासून पुढे चालते, त्यामुळे मागील दिनांक पल्ल्याने तो जे दाखवतो त्यात बदल होणार नाही.',
  'The recovery window is measured forward from today, so a past date range would not change what is still recoverable.':
    'वसुलीची कालमर्यादा आजपासून पुढे मोजली जाते, त्यामुळे मागील दिनांक पल्ल्याने अजूनही काय वसूल होऊ शकते त्यात बदल होणार नाही.',
  'The queue is ranked on what is workable now, so it is built from the open position rather than from cases opened inside a chosen window.':
    'रांग आत्ता काय हाताळता येईल यावर क्रमवारी लावली जाते, त्यामुळे ती निवडलेल्या कालावधीत उघडलेल्या प्रकरणांवरून नव्हे तर सध्याच्या खुल्या स्थितीवरून तयार होते.',
  'ITC ratios describe a taxpayer as they stand today, computed from the whole filing history rather than from returns inside a window.':
    'ITC गुणोत्तरे करदात्याची आजची स्थिती दर्शवतात; ती एका कालावधीतील विवरणांवरून नव्हे तर संपूर्ण विवरण-इतिहासावरून काढलेली असतात.',
  'District collection is held as a single current-period book with no monthly series behind it, so there is no period to narrow to.':
    'जिल्हा वसुली ही मासिक मालिकेशिवाय एकाच चालू-कालावधीच्या खतावणीत ठेवलेली आहे, त्यामुळे मर्यादित करण्यासाठी कोणताही कालावधी उपलब्ध नाही.',
  'Dropped on purpose: this screen exists to compare sectors against one another, and narrowing to a single sector would leave nothing to compare it with. Pick a sector in the selector below instead.':
    'जाणीवपूर्वक वगळलेला: हा पडदा क्षेत्रांची एकमेकांशी तुलना करण्यासाठीच आहे, आणि एकाच क्षेत्रापुरते मर्यादित केल्यास तुलनेसाठी काहीच उरणार नाही. त्याऐवजी खालील निवडकातून क्षेत्र निवडा.',

  /* == Units the scope banner counts in ================================= */
  alerts: 'सूचना',
  taxpayers: 'करदाते',
  districts: 'जिल्हे',
  'refund claims': 'परतावा दावे',
  'transit records': 'वाहतूक नोंदी',
  'open proceedings': 'खुली कार्यवाही',
  'cases in the recovery window': 'वसुली कालमर्यादेतील प्रकरणे'
})
