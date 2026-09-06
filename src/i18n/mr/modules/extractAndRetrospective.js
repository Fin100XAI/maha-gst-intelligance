import { registerMessages } from '../../locale.js'

/**
 * Marathi — Pilot Extract Specification and Missed Revenue Discovery.
 *
 *   extract           → एक्सट्रॅक्ट (transliterated — it names a specific
 *                       deliverable the department will request by that word)
 *   field / column    → क्षेत्र / स्तंभ
 *   mandatory         → अनिवार्य
 *   retrospective     → पूर्वलक्ष्यी
 *   review candidate  → पुनर्विलोकन उमेदवार
 *   separation test   → पृथक्करण चाचणी
 *   effect size       → परिणाम आकार
 *   positive class    → सकारात्मक वर्ग
 *   contrast class    → विरोधी वर्ग
 *   sustained         → कायम राहिलेले
 */
registerMessages('mr', {
  /* == Pilot Extract Specification ======================================== */
  'Governance · Pilot': 'कारभार · पायलट',
  'The field-level column list for the 500-case pilot, addressed to GSTN, NIC and the divisions. Each field carries its format, its source, whether it is mandatory and which engine it unlocks — so a data owner can see what their column is for rather than being asked for whatever they have.':
    '५०० प्रकरणांच्या पायलटसाठी क्षेत्र-पातळीवरील स्तंभ यादी, GSTN, NIC व विभागांना उद्देशून. प्रत्येक क्षेत्रासोबत त्याचे स्वरूप, स्रोत, ते अनिवार्य आहे का, आणि ते कोणती यंत्रणा खुली करते हे दिले आहे — जेणेकरून डेटा धारकाला "जे काही असेल ते द्या" असे विचारण्याऐवजी त्याचा स्तंभ कशासाठी आहे हे दिसेल.',
  'It is a column specification for a data request, not a view over taxpayer records.':
    'हे डेटा मागणीसाठीचे स्तंभ विनिर्देश आहे, करदात्यांच्या अभिलेखांवरील दृश्य नाही.',
  'Files requested': 'मागवलेल्या फाइली',
  'one per entity type': 'प्रत्येक घटक प्रकारासाठी एक',
  'Fields specified': 'नमूद केलेली क्षेत्रे',
  '{0} mandatory': '{0} अनिवार्य',
  'Critical fields': 'निर्णायक क्षेत्रे',
  'decide the outcome tier': 'निष्कर्षाचा स्तर ठरवतात',
  'From GSTN': 'GSTN कडून',
  'of {0} — rest departmental and NIC': '{0} पैकी — उर्वरित विभागीय व NIC',
  '500 cases is not 500 taxpayers': '५०० प्रकरणे म्हणजे ५०० करदाते नव्हेत',
  '{0} fields': '{0} क्षेत्रे',
  Scope: 'व्याप्ती',
  Column: 'स्तंभ',
  Type: 'प्रकार',
  Example: 'उदाहरण',
  Req: 'आवश्यक',
  Engines: 'यंत्रणा',
  Note: 'टीप',
  'naming convention — map to source': 'नामकरण संकेत — मूळ स्रोताशी जुळवा',
  'Format conventions': 'स्वरूप संकेत',
  'Each of these has caused a real error in this build or would have.':
    'यांपैकी प्रत्येकाने या बांधणीत खरी चूक घडवली आहे किंवा घडवली असती.',
  'Legal and privacy position': 'विधी व गोपनीयता स्थिती',
  'Settle these before the request goes out, not after.': 'मागणी पाठवण्यापूर्वी हे निकालात काढा, नंतर नव्हे.',
  'Where a field corresponds to a published GST form, that form is named. Where a column name is a convention proposed for this extract rather than an official schema field it is marked as such — map it to whatever the source system actually calls it rather than assuming the name exists.':
    'जिथे एखादे क्षेत्र प्रसिद्ध GST नमुन्याशी जुळते, तिथे तो नमुना नावासह दिला आहे. जिथे स्तंभाचे नाव हे अधिकृत रचनेतील क्षेत्र नसून या एक्सट्रॅक्टसाठी सुचवलेला संकेत आहे, तिथे तसे नमूद केले आहे — ते नाव अस्तित्वात आहे असे गृहीत धरण्याऐवजी मूळ प्रणाली त्याला प्रत्यक्षात जे म्हणते त्याच्याशी जुळवा.',

  /* == Missed Revenue Discovery =========================================== */
  'Missed Revenue · Retrospective': 'निसटलेला महसूल · पूर्वलक्ष्यी',
  'Closed audits and no-action cases re-examined against the signals that were live at the time. Produces explainable review candidates for an officer to judge — never an automatic Section 74 classification, and the screen shows why that refusal is a measurement rather than a caution.':
    'निकाली लेखापरीक्षा व कारवाई न झालेली प्रकरणे, त्या वेळी कार्यरत असलेल्या संकेतांच्या आधारे पुन्हा तपासलेली. अधिकाऱ्याने निर्णय घ्यावा असे स्पष्टीकरण देता येणारे पुनर्विलोकन उमेदवार यातून तयार होतात — कलम ७४ खालील स्वयंचलित वर्गीकरण कधीच नाही, आणि हा नकार सावधगिरी नसून मोजमाप आहे हे पडदा दाखवतो.',
  'Review candidates': 'पुनर्विलोकन उमेदवार',
  'review candidates': 'पुनर्विलोकन उमेदवार',
  'Closed with signals live': 'संकेत कार्यरत असताना निकाली',
  'audit closed anyway': 'तरीही लेखापरीक्षा बंद',
  'Never actioned': 'कधीच कारवाई नाही',
  'no notice ever issued': 'कोणतीही नोटीस कधीच जारी नाही',
  'Clock confirmed live': 'घड्याळ कार्यरत असल्याचे निश्चित',
  'of {0} — see caveat': '{0} पैकी — इशारा पहा',
  '{0} of these {1} carry a confirmed live limitation clock.':
    'यांपैकी {0} {1} वर निश्चितपणे कार्यरत मुदत घड्याळ आहे.',
  rules: 'नियम',
  'Signals live at the time': 'त्या वेळी कार्यरत असलेले संकेत',
  'The encoded rules that were firing when this case was put down.':
    'हे प्रकरण बाजूला ठेवले तेव्हा लागू होत असलेले संकेतबद्ध नियम.',
  'What the department did': 'विभागाने काय केले',
  Limitation: 'मुदत',
  'not established': 'सिद्ध झालेले नाही',
  'What happened in cases comparable on the dimensions that decide outcomes. Evidence for a judgement, not a prediction.':
    'निष्कर्ष ठरवणाऱ्या परिमाणांवर तुलनात्मक असलेल्या प्रकरणांत काय घडले. हा निर्णयासाठीचा पुरावा आहे, भाकीत नाही.',
  'Before this is reopened': 'हे पुन्हा उघडण्यापूर्वी',
  'In order. None of it is done by this screen.': 'क्रमाने. यांपैकी काहीही हा पडदा करत नाही.',

  /* == Missed Revenue Discovery — the separation test ===================== */
  'A review candidate, not a classification': 'पुनर्विलोकन उमेदवार, वर्गीकरण नव्हे',
  'No automatic Section 74 classification — and not because the sample is small.':
    'कलम ७४ खाली स्वयंचलित वर्गीकरण नाही — आणि नमुना लहान आहे म्हणून नव्हे.',
  'The separation test': 'पृथक्करण चाचणी',
  'Before a resemblance model is built, the cases it learns from must differ from the cases it will screen. Measured per feature, reported whatever it says.':
    'साम्य ओळखणारे प्रारूप बांधण्यापूर्वी, ते ज्या प्रकरणांतून शिकते ती प्रकरणे ज्यांची चाळणी करणार आहे त्यांहून वेगळी असली पाहिजेत. प्रत्येक वैशिष्ट्यानुसार मोजलेले, आणि निष्कर्ष काहीही असो तसाच नोंदवलेला.',
  'Positive class': 'सकारात्मक वर्ग',
  'sustained on appeal': 'अपिलात कायम राहिलेले',
  'Contrast class': 'विरोधी वर्ग',
  'reversed or remanded': 'रद्द झालेले किंवा फेरविचारार्थ परत',
  Baseline: 'आधाररेषा',
  'all litigation': 'सर्व खटले',
  'Features that separate': 'पृथक्करण करणारी वैशिष्ट्ये',
  'none reach 0.5': 'एकही ०.५ पर्यंत पोहोचत नाही',
  Feature: 'वैशिष्ट्य',
  'Cases we won': 'आपण जिंकलेली प्रकरणे',
  'All cases': 'सर्व प्रकरणे',
  'Effect size': 'परिणाम आकार',
  'Usable signal?': 'वापरण्याजोगा संकेत?',
  'Why more cases would not fix this': 'अधिक प्रकरणांनी हे का सुटणार नाही',
  'And the contrast class is empty in practice': 'आणि विरोधी वर्ग प्रत्यक्षात रिकामा आहे',
  'What is actually needed': 'प्रत्यक्षात काय आवश्यक आहे'
})
