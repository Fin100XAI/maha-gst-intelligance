import { registerMessages } from '../locale.js'

/**
 * Hindi — the landing page's own copy: value propositions, trust principles,
 * the assurance strip, and the one-line description of every module.
 *
 * These are declared as constants in LandingPage.jsx and rendered through
 * t(variable) rather than written as t('…') at the render site, which is why
 * the per-screen coverage report reported 100% while the first screen a visitor
 * opens stayed English. scripts/prose.mjs catches that class now.
 *
 * DPDP stays in Latin: it is the short form an officer cites, and the Act's
 * full name is written out where the governance screen states it.
 */
registerMessages('hi', {
  /* == Value propositions ================================================= */
  'Revenue Assurance': 'राजस्व आश्वासन',
  'Track collection against target across every district and sector, and surface leakage before it compounds.':
    'प्रत्येक जिले और क्षेत्र में लक्ष्य के सापेक्ष वसूली पर दृष्टि रखें, और रिसाव बढ़ने से पहले उसे सामने लाएँ।',
  'Fraud-Risk Detection': 'कपट जोखिम पहचान',
  'Graph-based detection of circular trading, shell-entity patterns and pass-through invoice networks.':
    'वर्तुलाकार व्यापार, दिखावटी इकाइयों के प्रतिरूप और मध्यवर्ती बीजक जालों की आरेख-आधारित पहचान।',
  'Explainable Risk Scoring': 'स्पष्टीकरण-योग्य जोखिम अंकन',
  'Every risk score traces to a discrete, weighted rule set — officers see exactly why a taxpayer was flagged.':
    'प्रत्येक जोखिम अंक एक निश्चित, भारित नियम समुच्चय तक पीछे जाकर देखा जा सकता है — करदाता ठीक क्यों चिह्नित हुआ, यह अधिकारियों को स्पष्ट दिखता है।',
  'Audit & Refund Prioritisation': 'लेखापरीक्षा एवं प्रतिदाय प्राथमिकता',
  'Risk-ranked case queues with AI-assisted checklists and notice drafts, gated behind officer approval.':
    'जोखिम-क्रम में प्रकरण पंक्तियाँ, साथ में AI-सहायित जाँच-सूचियाँ एवं नोटिस प्रारूप, और यह सब अधिकारी के अनुमोदन के अधीन।',
  'Officer Decision Support': 'अधिकारी निर्णय सहायता',
  'An AI copilot that drafts, summarises and translates — and never issues, blocks or rejects on its own.':
    'ऐसा AI सहप्रचालक जो प्रारूप बनाता है, सारांश देता है और अनुवाद करता है — और स्वयं कभी कुछ जारी, अवरुद्ध या अस्वीकृत नहीं करता।',
  'Governance & Security': 'शासन एवं सुरक्षा',
  'Role-based access, maker-checker approval and a full audit trail across every sensitive action.':
    'पद-आधारित पहुँच, कर्ता-परीक्षक अनुमोदन और प्रत्येक संवेदनशील कार्रवाई का पूर्ण लेखापरीक्षा अनुक्रम।',

  /* == Assurance strip ==================================================== */
  'Role-based access control': 'पद-आधारित पहुँच नियंत्रण',
  'Maker-checker workflow': 'कर्ता-परीक्षक कार्यप्रवाह',
  'Explainable AI — no black box': 'स्पष्टीकरण-योग्य AI — कोई अपारदर्शी पेटी नहीं',
  'Designed for DPDP-aligned data handling': 'DPDP-अनुरूप आँकड़ा प्रबंधन हेतु अभिकल्पित',
  'DPDP-Aligned Data Handling': 'DPDP-अनुरूप आँकड़ा प्रबंधन',
  'Full audit trail': 'पूर्ण लेखापरीक्षा अनुक्रम',
  'Human approval on every action': 'प्रत्येक कार्रवाई पर मानवीय अनुमोदन',

  /* == Trust principles =================================================== */
  'Accountable by role': 'पद के अनुसार उत्तरदायी',
  'Access follows the role held, not the person — and every action taken under a role is logged against the officer who took it.':
    'पहुँच व्यक्ति के अनुसार नहीं, धारित पद के अनुसार मिलती है — और पद के अंतर्गत की गई प्रत्येक कार्रवाई उसे करने वाले अधिकारी के नाम दर्ज होती है।',
  'Provenance on every figure': 'प्रत्येक आँकड़े का उद्गम',
  'Every module states where its figures come from and which of them are simulated. Nothing is shown as an observation that isn’t one.':
    'प्रत्येक मॉड्यूल बताता है कि उसके आँकड़े कहाँ से आए और उनमें से कौन-से अनुरूपित हैं। जो अवलोकन नहीं है, उसे अवलोकन के रूप में नहीं दिखाया जाता।',
  'AI that shows its work': 'अपना काम दिखाने वाला AI',
  'Every recommendation carries its evidence, its confidence, and which role is authorised to act on it. The platform never issues, blocks or rejects on its own.':
    'प्रत्येक अनुशंसा के साथ उसका साक्ष्य, उसका विश्वास, और उस पर कार्रवाई हेतु कौन-सा पद प्राधिकृत है, यह दिया रहता है। मंच स्वयं कभी कुछ जारी, अवरुद्ध या अस्वीकृत नहीं करता।',
  'Self-contained by design': 'अभिकल्प से ही आत्मनिर्भर',
  'The platform makes no calls out to the open internet for its figures, models or maps. It runs entirely within the department’s own infrastructure.':
    'यह मंच अपने आँकड़ों, प्रारूपों या मानचित्रों के लिए खुले इंटरनेट से कोई संपर्क नहीं करता। यह पूर्णतः विभाग की अपनी अवसंरचना के भीतर चलता है।',

  /* == One line per module ================================================ */
  'Whole state on one screen, ordered by what needs a decision today.':
    'पूरा राज्य एक पर्दे पर, इस क्रम में कि आज किस पर निर्णय आवश्यक है।',
  'Collection against target across every district, sector and tax head.':
    'प्रत्येक जिले, क्षेत्र और कर शीर्ष पर लक्ष्य के सापेक्ष वसूली।',
  'Input tax credit claims scored against filing and payment behaviour.':
    'विवरणी एवं भुगतान व्यवहार के सापेक्ष इनपुट कर श्रेय दावों का अंकन।',
  'Transit records checked against filings for mismatches and route anomalies.':
    'विसंगतियों और मार्ग संबंधी असामान्यताओं हेतु परिवहन अभिलेखों का विवरणियों से मिलान।',
  'Refund claims ranked by risk before sanction, with the evidence behind each.':
    'मंजूरी से पूर्व जोखिम के क्रम में प्रतिदाय दावे, प्रत्येक के पीछे के साक्ष्य सहित।',
  'Case queues, AI-assisted checklists and notice drafts, gated behind approval.':
    'प्रकरण पंक्तियाँ, AI-सहायित जाँच-सूचियाँ और नोटिस प्रारूप, और यह सब अनुमोदन के अधीन।',
  'Compliance and revenue patterns compared across industry sectors statewide.':
    'राज्यभर के उद्योग क्षेत्रों में अनुपालन एवं राजस्व प्रतिरूपों की तुलना।',
  'Every district and division scored on collection, compliance and enforcement.':
    'वसूली, अनुपालन एवं प्रवर्तन पर प्रत्येक जिले और विभाग का अंकन।',
  'Drafts, summarises and translates — and never issues or blocks on its own.':
    'प्रारूप बनाता है, सारांश देता है और अनुवाद करता है — और स्वयं कभी कुछ जारी या अवरुद्ध नहीं करता।',
  'Pending cases, order outcomes and exposure tracked through appeal stages.':
    'अपील के चरणों में लंबित प्रकरण, आदेशों के परिणाम और जोखिम राशि पर दृष्टि।',
  'Every proceeding against its statutory clock — what is barred, what expires within thirty days, and what it is worth.':
    'प्रत्येक कार्यवाही उसकी सांविधिक घड़ी के सापेक्ष — क्या कालातीत है, तीस दिनों में क्या समाप्त होता है, और उसका मूल्य कितना है।',
  'Revenue at risk — how much of a demand is still collectable, and how fast that falls while the case waits.':
    'जोखिमग्रस्त राजस्व — माँग में से कितना अब भी वसूली-योग्य है, और प्रकरण की प्रतीक्षा के दौरान वह कितनी तेज़ी से घटता है।',
  'One assembled view of a taxpayer, every fact carrying the system it came from and the date it was true.':
    'करदाता का एक जोड़ा हुआ दृश्य, प्रत्येक तथ्य के साथ वह किस प्रणाली से आया और किस तिथि को सत्य था, यह दर्ज।',
  'Cases ranked by recoverable value per officer-day rather than by risk score, with the movement explained.':
    'जोखिम अंक के बजाय प्रति अधिकारी-दिवस वसूली-योग्य मूल्य के क्रम में प्रकरण, क्रम-परिवर्तन के स्पष्टीकरण सहित।',
  'Published figures from CBIC, PIB and mahagst.gov.in, kept separate from the simulated operational records.':
    'CBIC, PIB एवं mahagst.gov.in के प्रकाशित आँकड़े, अनुरूपित परिचालन अभिलेखों से पृथक रखे गए।',
  'Closed and no-action cases re-examined against the signals that were live at the time, as explainable review candidates.':
    'निपटाए गए और बिना कार्रवाई वाले प्रकरण, उस समय सक्रिय रहे संकेतों के सापेक्ष पुनः जाँचे गए, स्पष्टीकरण-योग्य समीक्षा उम्मीदवारों के रूप में।',
  'What the same action taken earlier would have been worth on a case, with comparable concluded proceedings as the evidence.':
    'वही कार्रवाई पहले की गई होती तो प्रकरण में उसका मूल्य कितना होता, साक्ष्य के रूप में तुलनीय निपटाई गई कार्यवाहियों सहित।',
  'What the department is about to lose, what can still be protected, and which actions this week protect the most.':
    'विभाग क्या खोने वाला है, क्या अब भी बचाया जा सकता है, और इस सप्ताह कौन-सी कार्रवाइयाँ सर्वाधिक बचाती हैं।',
  'Screens only the taxpayers no encoded rule touches, looking for patterns the rulebook does not yet contain.':
    'केवल उन्हीं करदाताओं की छानबीन करता है जिन्हें कोई संकेतबद्ध नियम छूता नहीं, ऐसे प्रतिरूप खोजते हुए जो नियमपुस्तिका में अब तक नहीं हैं।',
  'Circular invoice chains from detection through to action — the graph, which entity actually stops it, and whether officers exist in every division it crosses.':
    'वर्तुलाकार बीजक शृंखलाएँ, पहचान से कार्रवाई तक — आरेख, वास्तव में कौन-सी इकाई उसे रोकती है, और वह जिन-जिन विभागों से गुजरती है वहाँ अधिकारी हैं या नहीं।',
  'A week of officer capacity allocated against binding territorial and role eligibility, surfacing what nobody can reach and why.':
    'बाध्यकारी क्षेत्रीय एवं पद-आधारित पात्रता के अनुसार आवंटित एक सप्ताह की अधिकारी क्षमता, और जहाँ कोई नहीं पहुँच सकता वह तथा उसका कारण सामने लाती हुई।',
  'Prior decisions weighted by the forum that gave them and whether they still stand — not by how similar the facts look.':
    'पूर्ववर्ती निर्णय इस आधार पर भारित कि उन्हें किस न्यायमंच ने दिया और वे अब भी टिके हैं या नहीं — इस आधार पर नहीं कि तथ्य कितने समान दिखते हैं।',
  'Non-filers and slipping compliance flagged before the shortfall compounds.':
    'कमी बढ़ने से पूर्व ही विवरणी न भरने वाले और गिरता अनुपालन चिह्नित।',
  'Every source, judgment, method and package the platform is built on — and a plain statement of what is simulated.':
    'मंच जिन-जिन स्रोतों, निर्णयों, पद्धतियों और संकुलों पर बना है वे सब — और क्या अनुरूपित है इसका स्पष्ट कथन।',
  'The field-level column list for the pilot — format, source and the engine each column unlocks.':
    'पायलट हेतु क्षेत्र-स्तरीय स्तंभ सूची — स्वरूप, स्रोत और प्रत्येक स्तंभ कौन-सा यंत्र मुक्त करता है।',
  'Fifteen intelligence engines mapped against the fields that actually exist, with what the pilot extract must carry.':
    'वास्तव में मौजूद क्षेत्रों के सापेक्ष मिलाए गए पंद्रह इंटेलिजेंस यंत्र, साथ में यह कि पायलट एक्सट्रैक्ट में क्या होना चाहिए।',
  'Model logs, override history and the guardrails every recommendation runs through.':
    'प्रारूप अभिलेख, अधिक्रमण इतिहास और वे रक्षा-सीमाएँ जिनसे प्रत्येक अनुशंसा गुजरती है।',
  'Ready-made briefing notes and exportable reports for every review cycle.':
    'प्रत्येक समीक्षा चक्र हेतु तैयार टिप्पणियाँ और निर्यात-योग्य प्रतिवेदन।'
})
