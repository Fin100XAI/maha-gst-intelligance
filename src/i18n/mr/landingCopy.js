import { registerMessages } from '../locale.js'

/**
 * Marathi — the landing page's own copy: value propositions, trust principles,
 * the assurance strip, and the one-line description of every module.
 *
 * WHY THIS IS A SEPARATE FILE FROM shellPanels
 *
 * These strings are declared as constants in LandingPage.jsx and rendered
 * through t(variable), never written as t('…') at the render site. The
 * per-screen coverage report cannot see them, which is how they stayed English
 * on the first screen a visitor opens while every screen behind it reported
 * 100%. Worse, the composer half-matched several of them and produced
 * "भूमिका-based प्रवेश नियंत्रण" — a mongrel, which reads as broken rather than
 * as untranslated. scripts/prose.mjs now catches this whole class.
 *
 * The module descriptions are deliberately not restatements of the module
 * names: each says what an officer actually finds on that page, and the Marathi
 * keeps that. A description that merely re-says the title would be worse in
 * either language.
 */
registerMessages('mr', {
  /* == Value propositions ================================================= */
  'Revenue Assurance': 'महसूल आश्वासन',
  'Track collection against target across every district and sector, and surface leakage before it compounds.':
    'प्रत्येक जिल्हा व क्षेत्रात लक्ष्याच्या तुलनेत वसुलीवर लक्ष ठेवा, आणि गळती वाढण्यापूर्वीच ती समोर आणा.',
  'Fraud-Risk Detection': 'फसवणूक जोखीम शोध',
  'Graph-based detection of circular trading, shell-entity patterns and pass-through invoice networks.':
    'वर्तुळाकार व्यापार, बनावट घटकांचे नमुने व मध्यस्थ बीजक जाळी यांचा आलेखाधारित शोध.',
  'Explainable Risk Scoring': 'स्पष्टीकरणीय जोखीम गुणांकन',
  'Every risk score traces to a discrete, weighted rule set — officers see exactly why a taxpayer was flagged.':
    'प्रत्येक जोखीम गुणांक निश्चित, भारित नियम संचापर्यंत मागे नेता येतो — करदाता नेमका का निदर्शनास आणला हे अधिकाऱ्यांना स्पष्ट दिसते.',
  'Audit & Refund Prioritisation': 'लेखापरीक्षा व परतावा प्राधान्यक्रम',
  'Risk-ranked case queues with AI-assisted checklists and notice drafts, gated behind officer approval.':
    'जोखीम क्रमवारीतील प्रकरण रांगा, सोबत AI-सहाय्यित तपासणी सूची व नोटीस मसुदे, आणि हे सर्व अधिकाऱ्याच्या मान्यतेच्या अधीन.',
  'Officer Decision Support': 'अधिकारी निर्णय सहाय्य',
  'An AI copilot that drafts, summarises and translates — and never issues, blocks or rejects on its own.':
    'मसुदा तयार करणारा, सारांश काढणारा व भाषांतर करणारा AI सहवैमानिक — जो स्वतःहून कधीही काहीही जारी करत नाही, रोखत नाही किंवा नाकारत नाही.',
  'Governance & Security': 'कारभार व सुरक्षा',
  'Role-based access, maker-checker approval and a full audit trail across every sensitive action.':
    'पदनिहाय प्रवेश, कर्ता-तपासनीस मान्यता आणि प्रत्येक संवेदनशील कृतीची संपूर्ण लेखापरीक्षा नोंद.',

  /* == Assurance strip ==================================================== */
  'Role-based access control': 'पदनिहाय प्रवेश नियंत्रण',
  'Maker-checker workflow': 'कर्ता-तपासनीस कार्यप्रवाह',
  'Explainable AI — no black box': 'स्पष्टीकरणीय AI — कोणतीही अपारदर्शक पेटी नाही',
  'Designed for DPDP-aligned data handling': 'DPDP-अनुरूप डेटा हाताळणीसाठी रचलेले',
  'DPDP-Aligned Data Handling': 'DPDP-अनुरूप डेटा हाताळणी',
  'Full audit trail': 'संपूर्ण लेखापरीक्षा नोंद',
  'Human approval on every action': 'प्रत्येक कृतीवर मानवी मान्यता',

  /* == Trust principles =================================================== */
  'Accountable by role': 'पदानुसार उत्तरदायी',
  'Access follows the role held, not the person — and every action taken under a role is logged against the officer who took it.':
    'प्रवेश हा व्यक्तीनुसार नव्हे तर धारण केलेल्या पदानुसार मिळतो — आणि पदाखाली केलेली प्रत्येक कृती ती करणाऱ्या अधिकाऱ्याच्या नावे नोंदवली जाते.',
  'Provenance on every figure': 'प्रत्येक आकड्याचे उगमस्थान',
  'Every module states where its figures come from and which of them are simulated. Nothing is shown as an observation that isn’t one.':
    'प्रत्येक प्रारूप आपले आकडे कुठून आले आणि त्यांपैकी कोणते अनुरूपित आहेत हे स्पष्ट सांगते. जे निरीक्षण नाही ते निरीक्षण म्हणून दाखवले जात नाही.',
  'AI that shows its work': 'आपले काम दाखवणारा AI',
  'Every recommendation carries its evidence, its confidence, and which role is authorised to act on it. The platform never issues, blocks or rejects on its own.':
    'प्रत्येक शिफारशीसोबत तिचा पुरावा, तिचा विश्वास, आणि तिच्यावर कारवाई करण्यास कोणते पद अधिकृत आहे हे दिलेले असते. मंच स्वतःहून कधीही काहीही जारी करत नाही, रोखत नाही किंवा नाकारत नाही.',
  'Self-contained by design': 'रचनेनेच स्वयंपूर्ण',
  'The platform makes no calls out to the open internet for its figures, models or maps. It runs entirely within the department’s own infrastructure.':
    'हा मंच आपले आकडे, प्रारूपे किंवा नकाशे यांसाठी खुल्या इंटरनेटशी कोणताही संपर्क साधत नाही. तो पूर्णपणे विभागाच्याच पायाभूत सुविधेत चालतो.',

  /* == One line per module ================================================ */
  'Whole state on one screen, ordered by what needs a decision today.':
    'संपूर्ण राज्य एका पडद्यावर, आज कशावर निर्णय आवश्यक आहे त्या क्रमाने.',
  'Collection against target across every district, sector and tax head.':
    'प्रत्येक जिल्हा, क्षेत्र व कर शीर्षकानुसार लक्ष्याच्या तुलनेत वसुली.',
  'Input tax credit claims scored against filing and payment behaviour.':
    'विवरणपत्र व भरणा वर्तनाच्या तुलनेत इनपुट कर श्रेय दाव्यांचे गुणांकन.',
  'Transit records checked against filings for mismatches and route anomalies.':
    'विसंगती व मार्गातील असामान्यता तपासण्यासाठी वाहतूक अभिलेखांची विवरणपत्रांशी पडताळणी.',
  'Refund claims ranked by risk before sanction, with the evidence behind each.':
    'मंजुरीपूर्वी जोखमीनुसार क्रमवारी लावलेले परतावा दावे, प्रत्येकामागील पुराव्यासह.',
  'Case queues, AI-assisted checklists and notice drafts, gated behind approval.':
    'प्रकरण रांगा, AI-सहाय्यित तपासणी सूची व नोटीस मसुदे, आणि हे सर्व मान्यतेच्या अधीन.',
  'Compliance and revenue patterns compared across industry sectors statewide.':
    'राज्यभरातील उद्योग क्षेत्रांमधील अनुपालन व महसूल नमुन्यांची तुलना.',
  'Every district and division scored on collection, compliance and enforcement.':
    'वसुली, अनुपालन व अंमलबजावणीवर प्रत्येक जिल्हा व विभागाचे गुणांकन.',
  'Drafts, summarises and translates — and never issues or blocks on its own.':
    'मसुदा तयार करतो, सारांश काढतो व भाषांतर करतो — आणि स्वतःहून कधीही काहीही जारी करत नाही किंवा रोखत नाही.',
  'Pending cases, order outcomes and exposure tracked through appeal stages.':
    'अपिलाच्या टप्प्यांतून प्रलंबित प्रकरणे, आदेशांचे निष्कर्ष व जोखीम रकमेवर लक्ष.',
  'Every proceeding against its statutory clock — what is barred, what expires within thirty days, and what it is worth.':
    'प्रत्येक कार्यवाही तिच्या सांविधिक घड्याळाच्या तुलनेत — काय मुदतबाह्य आहे, तीस दिवसांत काय संपते, आणि त्याचे मूल्य किती.',
  'Revenue at risk — how much of a demand is still collectable, and how fast that falls while the case waits.':
    'जोखमीतील महसूल — मागणीपैकी किती अद्याप वसूल होऊ शकते, आणि प्रकरण वाट पाहत असताना ते किती वेगाने घटते.',
  'One assembled view of a taxpayer, every fact carrying the system it came from and the date it was true.':
    'करदात्याचे एकत्र जुळवलेले एकच दृश्य, प्रत्येक तथ्यासोबत ते कोणत्या प्रणालीतून आले व कोणत्या तारखेस खरे होते हे नमूद.',
  'Cases ranked by recoverable value per officer-day rather than by risk score, with the movement explained.':
    'जोखीम गुणांकाऐवजी प्रति अधिकारी-दिवस वसूलपात्र मूल्यानुसार क्रमवारी लावलेली प्रकरणे, क्रमातील बदलाच्या स्पष्टीकरणासह.',
  'Published figures from CBIC, PIB and mahagst.gov.in, kept separate from the simulated operational records.':
    'CBIC, PIB व mahagst.gov.in यांचे प्रसिद्ध आकडे, अनुरूपित कार्यालयीन अभिलेखांपासून वेगळे ठेवलेले.',
  'Closed and no-action cases re-examined against the signals that were live at the time, as explainable review candidates.':
    'निकाली व कारवाई न झालेली प्रकरणे, त्या वेळी कार्यरत असलेल्या संकेतांच्या आधारे पुन्हा तपासलेली, स्पष्टीकरण देता येणारे पुनर्विलोकन उमेदवार म्हणून.',
  'What the same action taken earlier would have been worth on a case, with comparable concluded proceedings as the evidence.':
    'तीच कृती आधी केली असती तर प्रकरणात तिचे मूल्य किती झाले असते, पुरावा म्हणून तुलनात्मक निकाली कार्यवाहींसह.',
  'What the department is about to lose, what can still be protected, and which actions this week protect the most.':
    'विभाग काय गमावणार आहे, काय अद्याप वाचवता येते, आणि या आठवड्यात कोणत्या कृती सर्वाधिक संरक्षण देतात.',
  'Screens only the taxpayers no encoded rule touches, looking for patterns the rulebook does not yet contain.':
    'ज्या करदात्यांना कोणताही संकेतबद्ध नियम स्पर्श करत नाही केवळ त्यांचीच चाळणी करते, नियमपुस्तकात अद्याप नसलेले नमुने शोधत.',
  'Circular invoice chains from detection through to action — the graph, which entity actually stops it, and whether officers exist in every division it crosses.':
    'वर्तुळाकार बीजक साखळ्या, शोधापासून कारवाईपर्यंत — आलेख, प्रत्यक्षात कोणता घटक ती थांबवतो, आणि ती ज्या प्रत्येक विभागातून जाते तिथे अधिकारी आहेत का.',
  'A week of officer capacity allocated against binding territorial and role eligibility, surfacing what nobody can reach and why.':
    'बंधनकारक प्रादेशिक व पदनिहाय पात्रतेनुसार वाटलेली एका आठवड्याची अधिकारी क्षमता, आणि कोणालाही जे गाठता येत नाही ते व त्याचे कारण समोर आणणारी.',
  'Prior decisions weighted by the forum that gave them and whether they still stand — not by how similar the facts look.':
    'पूर्वीचे निर्णय ते कोणत्या न्यायमंचाने दिले आणि ते अद्याप टिकून आहेत का यानुसार भारित — तथ्ये किती सारखी दिसतात यानुसार नाही.',
  'Non-filers and slipping compliance flagged before the shortfall compounds.':
    'तूट वाढण्यापूर्वीच विवरणपत्र न भरणारे व ढासळते अनुपालन निदर्शनास आणले जाते.',
  'Every source, judgment, method and package the platform is built on — and a plain statement of what is simulated.':
    'मंच ज्या प्रत्येक स्रोत, निर्णय, पद्धत व संचावर उभारला आहे ते सर्व — आणि काय अनुरूपित आहे याचे स्पष्ट कथन.',
  'The field-level column list for the pilot — format, source and the engine each column unlocks.':
    'पायलटसाठी क्षेत्र-पातळीवरील स्तंभ यादी — स्वरूप, स्रोत आणि प्रत्येक स्तंभ कोणती यंत्रणा खुली करतो.',
  'Fifteen intelligence engines mapped against the fields that actually exist, with what the pilot extract must carry.':
    'प्रत्यक्षात अस्तित्वात असलेल्या क्षेत्रांशी जुळवलेल्या पंधरा इंटेलिजन्स यंत्रणा, आणि पायलट एक्सट्रॅक्टमध्ये काय असले पाहिजे यासह.',
  'Model logs, override history and the guardrails every recommendation runs through.':
    'प्रारूप नोंदी, फेरबदलाचा इतिहास आणि प्रत्येक शिफारस ज्या संरक्षक मर्यादांतून जाते त्या.',
  'Ready-made briefing notes and exportable reports for every review cycle.':
    'प्रत्येक आढावा चक्रासाठी तयार माहिती टिपणे व निर्यात करण्याजोगे अहवाल.'
})
