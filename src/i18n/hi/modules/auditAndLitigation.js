import { registerMessages } from '../../locale.js'

/**
 * Hindi — Audit & Scrutiny Engine and Litigation Intelligence.
 *
 *   scrutiny        → संवीक्षा
 *   pipeline        → शृंखला
 *   stage           → चरण
 *   exposure        → जोखिम राशि
 *   ageing          → लंबन
 *   adverse outcome → प्रतिकूल परिणाम
 *   contemporaneous → तत्कालीन
 *   distinguishing  → भेद स्थापित करने वाला
 *   annexure        → संलग्नक
 *   register        → पंजी
 *
 * Form codes — GSTR-2B — and GSTIN stay in Latin.
 */
registerMessages('hi', {
  /* == Audit & Scrutiny Engine — header =================================== */
  'Enforcement · Risk-Based Prioritisation': 'प्रवर्तन · जोखिम-आधारित प्राथमिकता',
  'Risk-ranked audit case prioritisation and pipeline management — from case identification through hearing and recovery, with AI-assisted checklists, notices and mandatory officer approval at every stage transition.':
    'जोखिम-क्रम में लेखापरीक्षा प्रकरणों की प्राथमिकता एवं शृंखला प्रबंधन — प्रकरण की पहचान से सुनवाई और वसूली तक, AI-सहायित जाँच-सूचियों, नोटिसों और प्रत्येक चरण-परिवर्तन पर अनिवार्य अधिकारी अनुमोदन के साथ।',
  'open audit cases': 'खुले लेखापरीक्षा प्रकरण',
  'Showing cases assigned to you —': 'आपको नियत प्रकरण दिखाए जा रहे हैं —',
  '{0} of your {1} cases match the current filters':
    'आपके {1} प्रकरणों में से {0} वर्तमान फ़िल्टर से मेल खाते हैं',
  'Your role can access every case — showing {0} of {1} that match the current filters':
    'आपका पद प्रत्येक प्रकरण देख सकता है — वर्तमान फ़िल्टर से मेल खाते {1} में से {0} दिखाए जा रहे हैं',
  'View all statewide cases': 'राज्यभर के सभी प्रकरण देखें',
  'Back to my assigned cases': 'मुझे नियत प्रकरणों पर लौटें',

  /* == Audit & Scrutiny Engine — tiles and list =========================== */
  'Active Cases': 'सक्रिय प्रकरण',
  'in pipeline': 'शृंखला में',
  'Total Estimated Exposure': 'कुल अनुमानित जोखिम राशि',
  'Critical Risk Cases': 'अत्यंत गंभीर जोखिम प्रकरण',
  'highest category': 'सर्वोच्च श्रेणी',
  'Average Case Age': 'औसत प्रकरण आयु',
  'Case ID': 'प्रकरण क्रमांक',
  'GSTIN / Trade Name': 'GSTIN / व्यापारिक नाम',
  'Estimated Exposure': 'अनुमानित जोखिम राशि',
  'Assigned Officer': 'नियत अधिकारी',
  'Suggested Scope': 'सुझाया गया दायरा',
  Action: 'कार्रवाई',
  'Open Case': 'प्रकरण खोलें',
  'Risk-Ranked Case List': 'जोखिम-क्रम प्रकरण सूची',
  'Sorted by risk score, descending — respects global district / sector / risk filters':
    'जोखिम अंक के अवरोही क्रम में — वैश्विक जिला / क्षेत्र / जोखिम फ़िल्टर का पालन करती है',
  'Officer Verification Required': 'अधिकारी द्वारा पुष्टि आवश्यक',
  'Search by GSTIN or trade name...': 'GSTIN या व्यापारिक नाम से खोजें...',
  'No audit cases match the current filters.': 'वर्तमान फ़िल्टर से कोई लेखापरीक्षा प्रकरण मेल नहीं खाता।',

  /* == Audit & Scrutiny Engine — the pipeline board ======================= */
  'Audit Workflow Pipeline': 'लेखापरीक्षा कार्यप्रवाह शृंखला',
  'Kanban-style stage tracking — advance or return a case using the controls on each card':
    'कानबान शैली में चरण अनुवर्तन — प्रत्येक कार्ड पर दिए नियंत्रणों से प्रकरण आगे बढ़ाएँ या वापस करें',
  'No cases': 'कोई प्रकरण नहीं',
  'Move this case back one stage': 'इस प्रकरण को एक चरण पीछे ले जाएँ',
  Back: 'पीछे',
  'Advancing a case requires officer approval — opens the case for review':
    'प्रकरण आगे बढ़ाने हेतु अधिकारी का अनुमोदन आवश्यक — प्रकरण समीक्षा हेतु खुलता है',
  Review: 'समीक्षा',

  /* == Audit & Scrutiny Engine — the case panel ========================== */
  'Case {0} — {1}': 'प्रकरण {0} — {1}',
  'Opened {0}': 'खोला गया {0}',
  'Last Action {0}': 'अंतिम कार्रवाई {0}',
  'Case Summary': 'प्रकरण सारांश',
  'Case Age': 'प्रकरण आयु',
  'View Taxpayer 360': 'करदाता 360 देखें',
  'Taxpayer profile unavailable for risk indicators.': 'जोखिम संकेतकों हेतु करदाता विवरण उपलब्ध नहीं।',
  'AI-Generated Audit Note': 'AI-निर्मित लेखापरीक्षा टिप्पणी',
  'Generate Required Documents Checklist': 'आवश्यक दस्तावेज जाँच-सूची तैयार करें',
  'Compare Similar Historical Cases': 'समान पूर्व प्रकरणों से तुलना करें',
  'Preview Notice Draft': 'नोटिस प्रारूप पूर्वावलोकन',
  'Human Approval': 'मानवीय अनुमोदन',
  'I confirm officer review is complete — risk indicators, checklist and supporting evidence for this case have been examined and verified.':
    'मैं पुष्टि करता/करती हूँ कि अधिकारी समीक्षा पूर्ण है — इस प्रकरण के जोखिम संकेतक, जाँच-सूची और समर्थक साक्ष्य की जाँच एवं पुष्टि की जा चुकी है।',
  'Case Closed': 'प्रकरण निपटाया गया',
  'Approve for Next Stage ({0})': 'अगले चरण हेतु अनुमोदित करें ({0})',

  /* == Litigation Intelligence — header and tiles ======================== */
  Enforcement: 'प्रवर्तन',
  'Appeal and order intelligence across the department\'s litigation pipeline — legal issue trends, ageing, adverse outcome risk and AI-assisted case review.':
    'विभाग की मुकदमा शृंखला पर अपील एवं आदेश इंटेलिजेंस — विधिक विषयों की प्रवृत्ति, लंबन, प्रतिकूल परिणाम का जोखिम और AI-सहायित प्रकरण समीक्षा।',
  'litigation cases': 'मुकदमा प्रकरण',
  'Total Appeals': 'कुल अपीलें',
  'Dept. Success Rate': 'विभागीय सफलता दर',
  'Orders Reversed': 'निरस्त आदेश',
  'Amount Under Dispute': 'विवादाधीन राशि',
  Cr: 'करोड़',
  'High-Value Pending': 'उच्च मूल्य लंबित',
  '> ₹50L': '> ₹50 लाख',

  /* == Litigation Intelligence — charts and register ===================== */
  'Common Issues Under Dispute': 'विवाद के सामान्य विषय',
  'Litigation cases by legal issue category': 'विधिक विषय श्रेणी के अनुसार मुकदमा प्रकरण',
  Cases: 'प्रकरण',
  'Case Ageing Distribution': 'प्रकरण लंबन वितरण',
  'Days since appeal filed': 'अपील दाखिल होने से बीते दिन',
  'Litigation Case Register': 'मुकदमा प्रकरण पंजी',
  'Respects global district / sector / search filters':
    'वैश्विक जिला / क्षेत्र / खोज फ़िल्टर का पालन करती है',
  'Search case, GSTIN, trade name...': 'प्रकरण, GSTIN, व्यापारिक नाम खोजें...',
  'Legal Issue': 'विधिक विषय',
  'Disputed Amount': 'विवादित राशि',
  'Ageing (days)': 'लंबन (दिन)',
  Ageing: 'लंबन',
  'Filed On': 'दाखिल दिनांक',
  'Adverse Outcome Risk': 'प्रतिकूल परिणाम जोखिम',
  'Department Position': 'विभाग की स्थिति',
  'AI Litigation Risk Summary': 'AI मुकदमा जोखिम सारांश',

  /* == Litigation Intelligence — training signals ======================== */
  'Officer Training Signals': 'अधिकारी प्रशिक्षण संकेत',
  'Pattern analysis of weak department positions across litigation cases':
    'मुकदमा प्रकरणों में विभाग की कमजोर स्थितियों का प्रतिरूप विश्लेषण',
  'No weak-position cases identified in the current litigation register.':
    'वर्तमान मुकदमा पंजी में कमजोर स्थिति वाला कोई प्रकरण चिह्नित नहीं।',
  'of weak-position cases': 'कमजोर स्थिति वाले प्रकरणों में से',
  '({0} of {1})': '({1} में से {0})',
  'relate to': 'इनसे संबंधित हैं',
  'documentation gaps': 'दस्तावेजी कमियाँ',
  'recommend a refresher training on evidence collection and case-file discipline for audit and assessment officers.':
    'लेखापरीक्षा एवं निर्धारण अधिकारियों हेतु साक्ष्य संकलन और प्रकरण-नस्ती अनुशासन पर पुनश्चर्या प्रशिक्षण की सिफारिश।',
  'unfavourable precedent': 'प्रतिकूल पूर्वनिर्णय',
  'recommend routing these categories through the Legal Cell early, and briefing field officers on current appellate/tribunal trends for the affected issue categories.':
    'इन श्रेणियों को आरंभ में ही विधि प्रकोष्ठ के माध्यम से भेजने, और प्रभावित विषय श्रेणियों पर वर्तमान अपीलीय/अधिकरण प्रवृत्तियों की जानकारी क्षेत्रीय अधिकारियों को देने की सिफारिश।',
  'Advisory signal — training plan requires Commissioner approval':
    'सलाहकारी संकेत — प्रशिक्षण योजना हेतु आयुक्त का अनुमोदन आवश्यक',

  /* == Litigation Intelligence — the AI case review ====================== */
  'Documentation improvement required': 'दस्तावेजीकरण में सुधार आवश्यक',
  'Case file lacks sufficient contemporaneous evidence to support the department\'s position on {0}. Recommend collating GSTR-2B reconciliation statements, e-way bill trail and supplier confirmation letters before the next hearing, and formally placing them on record with a covering note.':
    '{0} पर विभाग की स्थिति के समर्थन हेतु प्रकरण नस्ती में पर्याप्त तत्कालीन साक्ष्य नहीं है। अगली सुनवाई से पूर्व GSTR-2B मिलान विवरण, ई-वे बिल शृंखला और आपूर्तिकर्ता पुष्टि पत्र एकत्र कर, आवरण टिप्पणी सहित औपचारिक रूप से अभिलेख पर रखने की सिफारिश।',
  'Legal position needs strengthening': 'विधिक स्थिति को सुदृढ़ करने की आवश्यकता',
  'Existing appellate/tribunal precedent on {0} is currently unfavourable to the department\'s stand. Recommend consulting the Legal Cell for an alternative distinguishing argument or, where warranted, evaluating settlement/withdrawal to avoid an adverse order at a higher forum.':
    '{0} पर वर्तमान अपीलीय/अधिकरण पूर्वनिर्णय विभाग के पक्ष के प्रतिकूल है। भेद स्थापित करने वाले वैकल्पिक तर्क हेतु विधि प्रकोष्ठ से परामर्श, अथवा जहाँ उचित हो वहाँ उच्चतर मंच पर प्रतिकूल आदेश से बचने हेतु समझौते/वापसी पर विचार करने की सिफारिश।',
  'Position adequate — minor reinforcement suggested': 'स्थिति पर्याप्त — मामूली सुदृढ़ीकरण सुझाया गया',
  'Department position is reasonably supported. Recommend a final review of the reply/counter-affidavit for completeness and ensuring all annexures referenced are on file prior to hearing.':
    'विभाग की स्थिति को उचित समर्थन प्राप्त है। सुनवाई से पूर्व उत्तर/प्रति-शपथपत्र की पूर्णता हेतु अंतिम समीक्षा और संदर्भित सभी संलग्नक नस्ती पर होने की पुष्टि की सिफारिश।',
  'Position well supported': 'स्थिति भलीभाँति समर्थित',
  'Documentation and legal reasoning for this case are adequately supported. No immediate corrective action required; maintain current filing discipline for the next hearing.':
    'इस प्रकरण का दस्तावेजीकरण एवं विधिक तर्क पर्याप्त रूप से समर्थित है। तत्काल कोई सुधारात्मक कार्रवाई आवश्यक नहीं; अगली सुनवाई हेतु वर्तमान दाखिल अनुशासन बनाए रखें।'
})
