import { registerMessages } from '../../locale.js'

/**
 * Marathi — the report catalogue, the recommended actions attached to each
 * early-warning type, and the suggested audit scopes.
 *
 * Each recommended action is an instruction an officer may act on, so it keeps
 * its imperative shape and every operational detail in it: the seven days, the
 * Division Officer it escalates to, the specific reconciliation named. A
 * softened Marathi rendering would read better and instruct worse.
 *
 *   scrutiny         → तपासणी
 *   nudge            → स्मरणपत्र
 *   under-reporting  → कमी घोषित करणे
 *   pass-through     → मध्यस्थ हस्तांतरण
 *   shell-entity     → बनावट घटक
 *   reactivation     → पुनःसक्रियता
 */
registerMessages('mr', {
  /* == Report catalogue ================================================= */
  'Monthly Revenue Risk Report': 'मासिक महसूल जोखीम अहवाल',
  'Consolidated revenue performance and risk exposure for the month.':
    'महिन्याची एकत्रित महसूल कामगिरी व जोखीम रक्कम.',
  'District Performance Report': 'जिल्हा कामगिरी अहवाल',
  'Target vs actual, risk concentration and workload by district.':
    'जिल्हानिहाय लक्ष्य विरुद्ध प्रत्यक्ष, जोखमीचे एकवटणे व कामाचा भार.',
  'Sector Risk Report': 'क्षेत्र जोखीम अहवाल',
  'Sector-wise benchmark deviation and anomaly summary.':
    'क्षेत्रनिहाय मानकापासूनचे विचलन व असामान्यतांचा सारांश.',
  'ITC Exposure Report': 'ITC जोखीम अहवाल',
  'High-risk ITC claims and estimated exposure.': 'उच्च जोखमीचे ITC दावे व अंदाजित जोखीम रक्कम.',
  'Refund Risk Report': 'परतावा जोखीम अहवाल',
  'Refund scrutiny pipeline and risk-ranked cases.':
    'परतावा तपासणी शृंखला व जोखीम क्रमवारीतील प्रकरणे.',
  'Audit Prioritisation Report': 'लेखापरीक्षा प्राधान्यक्रम अहवाल',
  'Risk-ranked taxpayer list for audit planning.':
    'लेखापरीक्षा नियोजनासाठी जोखीम क्रमवारीतील करदाता यादी.',
  'Litigation Risk Report': 'खटला जोखीम अहवाल',
  'Appeal pipeline, adverse outcome risk and recovery locked.':
    'अपील शृंखला, प्रतिकूल निष्कर्षाची जोखीम व अडकलेली वसुली.',
  'Compliance Early Warning Report': 'अनुपालन पूर्वसूचना अहवाल',
  'Proactive signals and recommended taxpayer outreach.':
    'पूर्वसक्रिय संकेत व शिफारस केलेला करदाता संपर्क.',
  'AI Governance Report': 'AI कारभार अहवाल',
  'Model usage, human override rate and audit trail summary.':
    'प्रारूप वापर, मानवी फेरबदलाचे प्रमाण व लेखापरीक्षा नोंदीचा सारांश.',
  'Daily executive summary of revenue, risk and priority alerts.':
    'महसूल, जोखीम व प्राधान्य सूचनांचा दैनंदिन कार्यकारी सारांश.',

  /* == Recommended actions on an early-warning alert ==================== */
  'Send automated reminder; escalate to Division Officer if unresolved within 7 days':
    'स्वयंचलित स्मरणपत्र पाठवा; ७ दिवसांत निकाल न लागल्यास विभाग अधिकाऱ्याकडे पाठवा',
  'Monitor for chronic late-filing pattern; issue compliance nudge and review interest/late-fee computation':
    'सातत्याने उशिरा विवरणपत्र भरण्याच्या कलावर लक्ष ठेवा; अनुपालन स्मरणपत्र द्या आणि व्याज / विलंब शुल्काची गणना तपासा',
  'Reconcile declared turnover against tax paid; verify for under-reporting of taxable value':
    'घोषित उलाढालीचा भरलेल्या कराशी ताळमेळ घाला; करपात्र मूल्य कमी घोषित केले आहे का ते पडताळा',
  'Flag for officer review queue — e-way bill movement value inconsistent with filed returns':
    'अधिकारी पुनर्विलोकन रांगेत नोंदवा — ई-वे बिल वाहतूक मूल्य दाखल विवरणपत्रांशी विसंगत आहे',
  'Field verification of newly registered entity given disproportionately high early transaction volume':
    'सुरुवातीच्याच काळात प्रमाणाबाहेर मोठे व्यवहार असल्याने नव्याने नोंदणी झालेल्या घटकाची क्षेत्रीय पडताळणी',
  'Review amended registration fields (address/authorised signatory/bank) for consistency with filing behaviour':
    'दुरुस्त केलेली नोंदणी क्षेत्रे (पत्ता / अधिकृत स्वाक्षरीकर्ता / बँक) विवरणपत्र वर्तनाशी सुसंगत आहेत का ते तपासा',
  'Verify reactivation is genuine business resumption; check for shell-entity reuse indicators':
    'पुनःसक्रियता ही खरोखर व्यवसाय पुन्हा सुरू होणे आहे का ते पडताळा; बनावट घटक पुन्हा वापरल्याचे निर्देशक तपासा',
  'Verify return filed reflects actual business activity; cross-check against e-way bill and turnover trend':
    'दाखल विवरणपत्र प्रत्यक्ष व्यवसाय कार्यवाही दर्शवते का ते पडताळा; ई-वे बिल व उलाढालीच्या कलाशी तपासून पहा',
  'Possible circular transaction chain detected based on invoice flow, ITC pass-through, low tax payment ratio and short entity life':
    'बीजक प्रवाह, ITC मध्यस्थ हस्तांतरण, कमी कर भरणा गुणोत्तर व घटकाचे अल्प आयुष्य यांवरून संभाव्य वर्तुळाकार व्यवहार साखळी आढळली',

  /* == Suggested audit scope ============================================ */
  'Standard desk scrutiny: return consistency and payment trend review':
    'प्रमाणित कार्यालयीन तपासणी: विवरणपत्रांतील सुसंगती व भरण्याच्या कलाचे पुनर्विलोकन',
  'Desk review of last 3 return periods; compare against sector trend':
    'शेवटच्या ३ विवरणपत्र कालावधींचे कार्यालयीन पुनर्विलोकन; क्षेत्रीय कलाशी तुलना करा',
  'Focused ITC verification: supplier GSTR-2B reconciliation, invoice sampling':
    'केंद्रित ITC पडताळणी: पुरवठादाराच्या GSTR-2B शी ताळमेळ, बीजकांचे नमुने',
  'Full-scope investigation: ITC chain verification, counterparty cross-check, e-way bill reconciliation':
    'संपूर्ण व्याप्तीचा तपास: ITC साखळी पडताळणी, प्रतिपक्ष तपासणी, ई-वे बिल ताळमेळ',

  /* == Small operational vocabulary ===================================== */
  'Taxpayer 360': 'करदाता ३६०',
  'Nil-Return Risk': 'शून्य विवरणपत्र जोखीम',
  'Very High': 'अत्यंत उच्च',
  'Inter-State': 'आंतरराज्य',
  'Intra-State': 'राज्यांतर्गत'
})
