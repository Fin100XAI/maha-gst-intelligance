import { registerMessages } from '../../locale.js'

/**
 * Hindi — the report catalogue, the recommended actions attached to each
 * early-warning type, and the suggested audit scopes.
 *
 * Each recommended action is an instruction an officer may act on, so it keeps
 * its imperative shape and every operational detail: the seven days, the
 * Division Officer it escalates to, the specific reconciliation named. A
 * softened rendering would read better and instruct worse.
 *
 *   scrutiny         → संवीक्षा
 *   nudge            → स्मरण
 *   under-reporting  → कम घोषित करना
 *   pass-through     → मध्यवर्ती हस्तांतरण
 *   shell-entity     → दिखावटी इकाई
 *   reactivation     → पुनःसक्रियण
 */
registerMessages('hi', {
  /* == Report catalogue ================================================= */
  'Monthly Revenue Risk Report': 'मासिक राजस्व जोखिम प्रतिवेदन',
  'Consolidated revenue performance and risk exposure for the month.':
    'माह का समेकित राजस्व निष्पादन एवं जोखिम राशि।',
  'District Performance Report': 'जिला निष्पादन प्रतिवेदन',
  'Target vs actual, risk concentration and workload by district.':
    'जिलावार लक्ष्य बनाम वास्तविक, जोखिम का संकेंद्रण एवं कार्यभार।',
  'Sector Risk Report': 'क्षेत्र जोखिम प्रतिवेदन',
  'Sector-wise benchmark deviation and anomaly summary.':
    'क्षेत्रवार मानक से विचलन एवं असामान्यताओं का सारांश।',
  'ITC Exposure Report': 'ITC जोखिम प्रतिवेदन',
  'High-risk ITC claims and estimated exposure.': 'उच्च जोखिम वाले ITC दावे एवं अनुमानित जोखिम राशि।',
  'Refund Risk Report': 'प्रतिदाय जोखिम प्रतिवेदन',
  'Refund scrutiny pipeline and risk-ranked cases.':
    'प्रतिदाय संवीक्षा शृंखला एवं जोखिम-क्रम में प्रकरण।',
  'Audit Prioritisation Report': 'लेखापरीक्षा प्राथमिकता प्रतिवेदन',
  'Risk-ranked taxpayer list for audit planning.':
    'लेखापरीक्षा नियोजन हेतु जोखिम-क्रम में करदाता सूची।',
  'Litigation Risk Report': 'मुकदमा जोखिम प्रतिवेदन',
  'Appeal pipeline, adverse outcome risk and recovery locked.':
    'अपील शृंखला, प्रतिकूल परिणाम का जोखिम एवं रुकी हुई वसूली।',
  'Compliance Early Warning Report': 'अनुपालन पूर्वसूचना प्रतिवेदन',
  'Proactive signals and recommended taxpayer outreach.':
    'अग्रसक्रिय संकेत एवं अनुशंसित करदाता संपर्क।',
  'AI Governance Report': 'AI शासन प्रतिवेदन',
  'Model usage, human override rate and audit trail summary.':
    'प्रारूप उपयोग, मानवीय अधिक्रमण दर एवं लेखापरीक्षा अनुक्रम का सारांश।',
  'Daily executive summary of revenue, risk and priority alerts.':
    'राजस्व, जोखिम एवं प्राथमिकता सूचनाओं का दैनिक कार्यकारी सारांश।',

  /* == Recommended actions on an early-warning alert ==================== */
  'Send automated reminder; escalate to Division Officer if unresolved within 7 days':
    'स्वचालित स्मरण भेजें; 7 दिनों में निपटारा न होने पर विभाग अधिकारी को भेजें',
  'Monitor for chronic late-filing pattern; issue compliance nudge and review interest/late-fee computation':
    'लगातार विलंब से विवरणी भरने की प्रवृत्ति पर निगरानी रखें; अनुपालन स्मरण जारी करें और ब्याज / विलंब शुल्क की गणना की समीक्षा करें',
  'Reconcile declared turnover against tax paid; verify for under-reporting of taxable value':
    'घोषित कारोबार का भुगतान किए गए कर से मिलान करें; करयोग्य मूल्य कम घोषित किया गया है या नहीं, सत्यापित करें',
  'Flag for officer review queue — e-way bill movement value inconsistent with filed returns':
    'अधिकारी समीक्षा पंक्ति हेतु चिह्नित करें — ई-वे बिल परिवहन मूल्य दाखिल विवरणियों से असंगत है',
  'Field verification of newly registered entity given disproportionately high early transaction volume':
    'आरंभ में ही असंगत रूप से अधिक लेनदेन होने के कारण नवपंजीकृत इकाई का क्षेत्रीय सत्यापन',
  'Review amended registration fields (address/authorised signatory/bank) for consistency with filing behaviour':
    'संशोधित पंजीयन स्तंभ (पता / प्राधिकृत हस्ताक्षरकर्ता / बैंक) विवरणी व्यवहार से संगत हैं या नहीं, इसकी समीक्षा करें',
  'Verify reactivation is genuine business resumption; check for shell-entity reuse indicators':
    'पुनःसक्रियण वास्तव में व्यवसाय का पुनरारंभ है या नहीं, सत्यापित करें; दिखावटी इकाई के पुनः प्रयोग के संकेतक जाँचें',
  'Verify return filed reflects actual business activity; cross-check against e-way bill and turnover trend':
    'दाखिल विवरणी वास्तविक व्यावसायिक गतिविधि दर्शाती है या नहीं, सत्यापित करें; ई-वे बिल एवं कारोबार की प्रवृत्ति से मिलाकर जाँचें',
  'Possible circular transaction chain detected based on invoice flow, ITC pass-through, low tax payment ratio and short entity life':
    'बीजक प्रवाह, ITC मध्यवर्ती हस्तांतरण, कम कर भुगतान अनुपात एवं इकाई के अल्प जीवनकाल के आधार पर संभावित वर्तुलाकार लेनदेन शृंखला पाई गई',

  /* == Suggested audit scope ============================================ */
  'Standard desk scrutiny: return consistency and payment trend review':
    'मानक कार्यालयीन संवीक्षा: विवरणियों की संगति एवं भुगतान प्रवृत्ति की समीक्षा',
  'Desk review of last 3 return periods; compare against sector trend':
    'पिछली 3 विवरणी अवधियों की कार्यालयीन समीक्षा; क्षेत्रीय प्रवृत्ति से तुलना करें',
  'Focused ITC verification: supplier GSTR-2B reconciliation, invoice sampling':
    'केंद्रित ITC सत्यापन: आपूर्तिकर्ता के GSTR-2B से मिलान, बीजकों का प्रतिचयन',
  'Full-scope investigation: ITC chain verification, counterparty cross-check, e-way bill reconciliation':
    'पूर्ण व्याप्ति का अन्वेषण: ITC शृंखला सत्यापन, प्रतिपक्ष जाँच, ई-वे बिल मिलान',

  /* == Small operational vocabulary ===================================== */
  'Taxpayer 360': 'करदाता 360',
  'Nil-Return Risk': 'शून्य विवरणी जोखिम',
  'Very High': 'अत्यधिक उच्च',
  'Inter-State': 'अंतर-राज्यीय',
  'Intra-State': 'राज्यांतरिक'
})
