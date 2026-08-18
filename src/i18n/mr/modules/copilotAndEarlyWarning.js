import { registerMessages } from '../../locale.js'

/* ---------------------------------------------------------------------------
 * OFFICER AI COPILOT + COMPLIANCE EARLY WARNING CATALOGUE
 *
 * Hand-written Marathi for the UI chrome of `src/modules/OfficerAICopilot.jsx`
 * and `src/modules/ComplianceEarlyWarning.jsx` — panel/card titles, table
 * column headers, action-button labels, empty-state text, badges and the
 * fixed vocabulary of the 9 early-warning signal types.
 *
 * Not covered here (by design):
 *   - `translateBriefing()` and its output (AIOutputPanel / TranslationBubble
 *     rendering of `translated.prefix/body/note`) — a separate, already-
 *     working AI-output translation feature, left untouched.
 *   - AI-generated draft content itself (summaries, notices, checklists,
 *     compliance-nudge text) returned by `src/data/ai.js` helpers.
 *   - Taxpayer/trade name, GSTIN, district, sector, dates and figures pulled
 *     straight from data records.
 * ------------------------------------------------------------------------- */

registerMessages('mr', {
  /* == Officer AI Copilot — header ========================================= */
  'Enforcement · AI-Assisted Workflow': 'अंमलबजावणी · AI-सहाय्यित कार्यप्रवाह',
  'AI-generated draft. Officer verification and approval required. This assistant generates decision-support drafts — case summaries, notice drafts, checklists and briefings — for a selected taxpayer case. It does not issue notices, take enforcement action or replace officer judgement.':
    'AI-निर्मित मसुदा. अधिकारी पडताळणी व मान्यता आवश्यक. हा सहायक निवडलेल्या करदाता प्रकरणासाठी निर्णय-सहाय्यक मसुदे — प्रकरण सारांश, नोटीस मसुदे, तपासणी याद्या व माहितीपत्रे — तयार करतो. तो स्वतःहून नोटीस जारी करत नाही, अंमलबजावणी कृती करत नाही किंवा अधिकाऱ्याच्या निर्णयाची जागा घेत नाही.',
  'AI-generated draft. Officer verification and approval required. All outputs below are advisory suggestions only and must be reviewed, edited and approved by an authorised officer before use.':
    'AI-निर्मित मसुदा. अधिकारी पडताळणी व मान्यता आवश्यक. खालील सर्व निर्गत केवळ सल्लागार सूचना आहेत आणि वापरण्यापूर्वी प्राधिकृत अधिकाऱ्याने त्यांचे पुनरावलोकन, संपादन व मान्यता देणे आवश्यक आहे.',

  /* == Case Context panel =================================================== */
  'Case Context': 'प्रकरण संदर्भ',
  'Select the working case for this session': 'या सत्रासाठी कार्यरत प्रकरण निवडा',
  'Search trade name or GSTIN...': 'व्यापार नाव किंवा GSTIN शोधा...',
  'Narrowed by header filters (district / sector / risk level)': 'शीर्षलेख गाळण्यांनुसार मर्यादित (जिल्हा / क्षेत्र / जोखीम पातळी)',
  Sector: 'क्षेत्र',
  District: 'जिल्हा',
  'Filing status': 'विवरणपत्र स्थिती',
  'Audit status': 'लेखापरीक्षा स्थिती',
  'Risk signal only': 'केवळ जोखीम संकेत',
  'Officer verification required': 'अधिकारी पडताळणी आवश्यक',
  'View Full Taxpayer 360 Profile': 'संपूर्ण करदाता ३६० प्रोफाइल पहा',

  /* == AI Actions panel ====================================================== */
  'AI Actions': 'AI कृती',
  'Generate a draft using this case as context': 'हे प्रकरण संदर्भ म्हणून वापरून मसुदा तयार करा',
  'Generate Case Summary': 'प्रकरण सारांश तयार करा',
  'Draft Notice': 'नोटीस मसुदा तयार करा',
  'Summarise Taxpayer Reply': 'करदात्याच्या उत्तराचा सारांश तयार करा',
  'Generate Audit Checklist': 'लेखापरीक्षा तपासणी यादी तयार करा',
  'Explain Mismatch': 'तफावतीचे स्पष्टीकरण द्या',
  'Generate Senior Officer Briefing': 'वरिष्ठ अधिकारी माहितीपत्र तयार करा',
  'Compare With Similar Cases': 'समान प्रकरणांशी तुलना करा',
  'Suggest Hearing Questions': 'सुनावणी प्रश्न सुचवा',
  'Draft Notice — ASMT-10 Scrutiny Notice': 'नोटीस मसुदा — ASMT-10 तपासणी नोटीस',

  /* == Translate Summary block (chrome only — translateBriefing() itself and
     its output are a separate feature and are not touched) ================= */
  'Translate Summary': 'सारांशाचे भाषांतर करा',
  Marathi: 'मराठी',
  Hindi: 'हिंदी',
  English: 'इंग्रजी',
  'Uses the most recent generated summary as source text': 'नुकत्याच तयार केलेल्या सारांशाचा स्रोत मजकूर म्हणून वापर करते',
  'Translate Summary — Marathi': 'सारांशाचे भाषांतर — मराठी',
  'Translate Summary — Hindi': 'सारांशाचे भाषांतर — हिंदी',
  'Translate Summary — English': 'सारांशाचे भाषांतर — इंग्रजी',

  /* == Conversation area ===================================================== */
  'Clear Conversation': 'संभाषण साफ करा',
  'No AI actions run yet': 'अद्याप कोणतीही AI कृती राबवलेली नाही',
  'Select an action from the left panel to generate a draft for {0}. All outputs are advisory suggestions requiring officer review.':
    '{0} साठी मसुदा तयार करण्यासाठी डाव्या पटलातून एक कृती निवडा. सर्व निर्गत सल्लागार सूचना असून अधिकारी पुनरावलोकन आवश्यक आहे.',
  'the selected case': 'निवडलेले प्रकरण',
  Case: 'प्रकरण',
  Confidence: 'विश्वासार्हता',
  'Risk score': 'जोखीम गुण',

  /* == Compliance Early Warning — header ==================================== */
  'Proactive Monitoring': 'सक्रिय निरीक्षण',
  'Proactive detection of filing, payment and behavioural anomalies — enabling outreach and officer review before escalation to formal enforcement action.':
    'विवरणपत्र भरणे, भरणा व वर्तनात्मक विसंगतींचे सक्रिय शोधन — औपचारिक अंमलबजावणी कृतीपर्यंत उन्नयन होण्यापूर्वी संपर्क व अधिकारी पुनरावलोकन शक्य करते.',

  /* == KPI row ================================================================ */
  'Total Open Alerts': 'एकूण खुले इशारे',
  'Officer Review Queue': 'अधिकारी पुनरावलोकन रांग',
  'Resolved This Month': 'या महिन्यात निराकरण झालेले',
  'Alert Types Active': 'सक्रिय इशारा प्रकार',
  'of {0}': '{0} पैकी',

  /* == Charts ================================================================= */
  'Alerts by Type': 'प्रकारानुसार इशारे',
  'Breakdown of early-warning signals — respects global filters': 'पूर्वसूचना संकेतांची विभागणी — जागतिक गाळण्यांनुसार',
  'Alert Volume Trend': 'इशारा प्रमाण कल',
  'Alerts raised, bucketed over the last ~48 days': 'गेल्या सुमारे ४८ दिवसांत नोंदवलेले इशारे, कालावधीनुसार विभागलेले',

  /* == Alert feed table ======================================================= */
  'Early Warning Alert Feed': 'पूर्वसूचना इशारा सूची',
  'Searchable, filterable register of active compliance signals': 'सक्रिय अनुपालन संकेतांची शोधण्यायोग्य, गाळण्यायोग्य नोंदवही',
  'Search GSTIN / trade name...': 'GSTIN / व्यापार नाव शोधा...',
  'Alert Type': 'इशारा प्रकार',
  Taxpayer: 'करदाता',
  'Risk Score': 'जोखीम गुण',
  Status: 'स्थिती',
  'Raised On': 'नोंद दिनांक',

  /* == 9 early-warning signal types (fixed system vocabulary, EARLY_WARNING_TYPES) */
  'All Alert Types': 'सर्व इशारा प्रकार',
  'Non-Filer Alert': 'विवरणपत्र न भरल्याचा इशारा',
  'Late Filing Pattern': 'विलंबित विवरणपत्र नमुना',
  'Nil-Return Risk': 'शून्य-विवरणपत्र जोखीम',
  'Sudden Tax Payment Drop': 'कर भरण्यात अचानक घट',
  'Dormant-to-Active Spike': 'निष्क्रिय-ते-सक्रिय अचानक वाढ',
  'Registration Amendment Risk': 'नोंदणी दुरुस्ती जोखीम',
  'New Taxpayer High Transaction Risk': 'नवीन करदाता उच्च व्यवहार जोखीम',
  'High Turnover, Low Payment': 'उच्च उलाढाल, कमी भरणा',
  'Return Mismatch': 'विवरणपत्र तफावत',

  /* == Their matching recommended actions (fixed system text) ================ */
  'Send automated reminder; escalate to Division Officer if unresolved within 7 days':
    'स्वयंचलित स्मरणपत्र पाठवा; ७ दिवसांत निराकरण न झाल्यास विभागीय अधिकाऱ्याकडे उन्नत करा',
  'Monitor for chronic late-filing pattern; issue compliance nudge and review interest/late-fee computation':
    'सतत विलंबित विवरणपत्र नमुन्यावर देखरेख ठेवा; अनुपालन स्मरणपत्र द्या आणि व्याज/विलंब-शुल्क गणनेचे पुनरावलोकन करा',
  'Verify return filed reflects actual business activity; cross-check against e-way bill and turnover trend':
    'दाखल विवरणपत्र प्रत्यक्ष व्यावसायिक कार्यवाहीशी सुसंगत आहे याची पडताळणी करा; ई-वे बिल व उलाढाल कलाशी तुलना करा',
  'Desk review of last 3 return periods; compare against sector trend':
    'शेवटच्या ३ विवरणपत्र कालावधींचे कार्यालयीन पुनरावलोकन करा; क्षेत्रीय कलाशी तुलना करा',
  'Verify reactivation is genuine business resumption; check for shell-entity reuse indicators':
    'पुनःसक्रियता खरी व्यावसायिक पुनःसुरुवात आहे याची पडताळणी करा; निष्क्रिय-संस्था पुनर्वापर निर्देशकांची तपासणी करा',
  'Review amended registration fields (address/authorised signatory/bank) for consistency with filing history':
    'दुरुस्त केलेली नोंदणी क्षेत्रे (पत्ता/प्राधिकृत स्वाक्षरीकर्ता/बँक) विवरणपत्र इतिहासाशी सुसंगत आहेत का याचे पुनरावलोकन करा',
  'Field verification of newly registered entity given disproportionately high early transaction volume':
    'असमान प्रमाणात उच्च प्रारंभिक व्यवहार प्रमाण लक्षात घेता नव्याने नोंदणीकृत संस्थेची क्षेत्रीय पडताळणी करा',
  'Reconcile declared turnover against tax paid; verify for under-reporting of taxable value':
    'घोषित उलाढालीचा भरलेल्या कराशी ताळमेळ घ्या; करपात्र मूल्याच्या कमी-अहवालाची पडताळणी करा',
  'Flag for officer review queue — e-way bill movement value inconsistent with filed returns':
    'अधिकारी पुनरावलोकन रांगेसाठी चिन्हांकित करा — ई-वे बिल हालचाल मूल्य दाखल विवरणपत्रांशी विसंगत',

  /* == Alert status values (fixed system vocabulary) ========================= */
  'All Statuses': 'सर्व स्थिती',
  Open: 'खुले',
  'Outreach Sent': 'संपर्क पाठवला',
  'Officer Reviewing': 'अधिकारी पुनरावलोकन करत आहे',
  Resolved: 'निराकरण झाले',

  /* == Officer review queue =================================================== */
  'Alerts currently under officer review — status updates are local to this session':
    'सध्या अधिकारी पुनरावलोकनाखाली असलेले इशारे — स्थिती बदल केवळ या सत्रापुरते',
  'No alerts currently in the officer review queue.': 'सध्या अधिकारी पुनरावलोकन रांगेत कोणतेही इशारे नाहीत.',
  '{0} in queue': 'रांगेत {0}',
  Raised: 'नोंदवले',
  'Mark Resolved': 'निराकरण झाले म्हणून चिन्हांकित करा',

  /* == Alert detail modal ===================================================== */
  'Recommended Action (System)': 'शिफारस केलेली कृती (प्रणाली)',
  'AI-Generated Taxpayer Outreach': 'AI-निर्मित करदाता संपर्क',
  'View Taxpayer 360': 'करदाता ३६० पहा'
})
