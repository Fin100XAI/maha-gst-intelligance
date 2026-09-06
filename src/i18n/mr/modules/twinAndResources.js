import { registerMessages } from '../../locale.js'

/**
 * Marathi — Case Digital Twin and Project Resources.
 *
 *   twin            → ट्विन (transliterated; "जुळे" would read as a sibling,
 *                     not as a unified record)
 *   chronology      → कालानुक्रम
 *   provenance      → उगमस्थान
 *   exposure        → जोखीम रक्कम
 *   simulated       → अनुरूपित
 *   holding         → निर्णयसार
 *   failure mode    → अपयशाची पद्धत
 *   seed            → बीज (of the pseudo-random generator)
 */
registerMessages('mr', {
  /* == Case Digital Twin ================================================== */
  'Revenue · Unified Case Record': 'महसूल · एकत्रित प्रकरण अभिलेख',
  'One taxpayer, one chronology, one exposure, one legal position, one recommended next action — assembled from every system that holds a piece of them. Every fact states the system it came from.':
    'एक करदाता, एक कालानुक्रम, एक जोखीम रक्कम, एक विधी स्थिती, एक शिफारस केलेली पुढील कृती — त्यांचा कोणताही भाग असलेल्या प्रत्येक प्रणालीतून जुळवलेली. प्रत्येक तथ्य तो कोणत्या प्रणालीतून आला हे स्पष्ट सांगते.',
  '{0} case(s) — ordered by how soon action is required':
    '{0} प्रकरण(े) — कारवाईची निकड किती लवकर आहे त्यानुसार क्रमाने',
  'What is at stake and what remains recoverable': 'पणाला काय लागले आहे व वसूलपात्र काय शिल्लक आहे',
  'Estimated exposure': 'अंदाजित जोखीम रक्कम',
  'Recoverable now': 'आता वसूलपात्र',
  'Decays in 7 days': '७ दिवसांत क्षय होते',
  'Signal age': 'संकेताचे वय',
  'Why flagged': 'निदर्शनास का आणले',
  'Legal position': 'विधी स्थिती',
  'The statutory clock on this proceeding': 'या कार्यवाहीवरील सांविधिक घड्याळ',
  'Contested extension': 'वादग्रस्त मुदतवाढ',
  'No proceeding is currently running against a statutory clock for this taxpayer.':
    'या करदात्यासाठी सध्या कोणतीही कार्यवाही सांविधिक घड्याळाविरुद्ध चालू नाही.',
  'Unified chronology': 'एकत्रित कालानुक्रम',
  '{0} events merged across systems. Today this is reconstructed by hand from each system in turn.':
    'विविध प्रणालींतून एकत्र केलेल्या {0} घटना. आज हे प्रत्येक प्रणालीतून एकेक करून हाताने पुन्हा जुळवावे लागते.',
  'Proceedings on record': 'अभिलेखावरील कार्यवाही',
  'Notices issued': 'जारी केलेल्या नोटिसा',
  'Audit cases': 'लेखापरीक्षा प्रकरणे',
  'Refund claims': 'परतावा दावे',
  Appeals: 'अपिले',
  'Open compliance alerts': 'प्रलंबित अनुपालन सूचना',
  'Network cluster': 'नेटवर्क गट',
  'Not linked': 'जोडलेले नाही',
  'Source coverage': 'स्रोतांची व्याप्ती',
  'Which systems contributed to this twin': 'या ट्विनमध्ये कोणत्या प्रणालींनी योगदान दिले',
  'In this demonstration no external system is connected — the twin is assembled from generated records shaped like each source. A production deployment reads these feeds directly.':
    'या प्रात्यक्षिकात कोणतीही बाह्य प्रणाली जोडलेली नाही — ट्विन हे प्रत्येक स्रोताच्या आकाराचे निर्माण केलेले अभिलेख वापरून जुळवले आहे. प्रत्यक्ष अंमलबजावणीत हे स्रोत थेट वाचले जातात.',
  'A unified view is decision support — verify against the source record before acting':
    'एकत्रित दृश्य हे निर्णयासाठी सहाय्य आहे — कारवाई करण्यापूर्वी मूळ अभिलेखाशी पडताळून पहा',
  'Recommended next action': 'शिफारस केलेली पुढील कृती',

  /* == Project Resources — header ========================================= */
  'Data Resources · Provenance': 'डेटा संसाधने · उगमस्थान',
  'The law this platform encodes, the judgments it relies on, the published figures it cites, the statistical methods it applies and the software it runs on — with a plain statement of which records are simulated and which are real.':
    'हा मंच कोणता कायदा संकेतबद्ध करतो, कोणत्या निर्णयांवर विसंबतो, कोणते प्रसिद्ध आकडे उद्धृत करतो, कोणत्या सांख्यिकीय पद्धती वापरतो आणि कोणत्या संगणक प्रणालीवर चालतो — यांसह कोणते अभिलेख अनुरूपित आहेत व कोणते खरे आहेत याचे स्पष्ट कथन.',
  'It lists the sources, methods and software the platform is built on.':
    'मंच ज्या स्रोतांवर, पद्धतींवर व संगणक प्रणालींवर उभारला आहे त्यांची यादी येथे आहे.',

  /* == Project Resources — counters ======================================= */
  'Statutory sources': 'सांविधिक स्रोत',
  'encoded, not summarised': 'संकेतबद्ध, सारांशित नाही',
  'Judicial authorities': 'न्यायिक प्राधिकार',
  'verified against reports': 'वृत्तांतांशी पडताळलेले',
  'Official data sources': 'अधिकृत डेटा स्रोत',
  'government published': 'शासनाने प्रसिद्ध केलेले',
  Methods: 'पद्धती',
  'each with its failure mode': 'प्रत्येकीसह तिची अपयशाची पद्धत',
  'Software packages': 'संगणक प्रणाली संच',
  'all open-source': 'सर्व मुक्त-स्रोत',

  /* == Project Resources — simulated versus real ========================== */
  'Generated from a fixed seed. None of it describes a real taxpayer.':
    'निश्चित बीजापासून निर्माण केलेले. यातील काहीही खऱ्या करदात्याचे वर्णन करत नाही.',
  Real: 'खरे',
  'Verified against published sources on {0}.': '{0} रोजी प्रसिद्ध स्रोतांशी पडताळलेले.',
  'The division is absolute': 'ही विभागणी निरपवाद आहे',

  /* == Project Resources — the sections =================================== */
  'Statute and subordinate legislation': 'कायदा व अधीनस्थ विधिविधान',
  'Encoded as computation rather than summarised. The limitation engine computes from these, which is why its output can go into a notice.':
    'सारांशाऐवजी परिगणना म्हणून संकेतबद्ध. मुदत यंत्रणा यांवरूनच गणना करते, म्हणूनच तिचा निष्कर्ष नोटिशीत जाऊ शकतो.',
  'Judicial authority': 'न्यायिक प्राधिकार',
  'Verified against published reports. Where only a holding could be confirmed, the case name is left blank rather than invented.':
    'प्रसिद्ध वृत्तांतांशी पडताळलेले. जिथे केवळ निर्णयसारच निश्चित करता आला, तिथे प्रकरणाचे नाव रचण्याऐवजी रिकामे ठेवले आहे.',
  Source: 'स्रोत',
  'Official published sources': 'अधिकृत प्रसिद्ध स्रोत',
  'Dataset pointers held without values': 'मूल्यांशिवाय ठेवलेले डेटासंच निर्देश',
  'Recorded so the department knows they exist, with nothing inferred from them — the endpoints returned HTTP 403 when fetched, and guessing at their contents would have been worse than leaving them empty.':
    'ते अस्तित्वात आहेत हे विभागाला कळावे म्हणून नोंदवलेले, त्यांवरून काहीही अनुमान न काढता — मागवले असता या स्रोतांनी HTTP 403 परत दिला, आणि त्यांतील मजकुराचा अंदाज बांधणे हे ते रिकामे ठेवण्यापेक्षा वाईट ठरले असते.',
  Dataset: 'डेटासंच',
  'No values held': 'कोणतीही मूल्ये ठेवलेली नाहीत',
  'Statistical and algorithmic methods': 'सांख्यिकीय व अल्गोरिदमिक पद्धती',
  'Each with the reason it was chosen and the way it fails. A method whose failure mode is not stated is a method nobody can audit.':
    'प्रत्येकीसह ती का निवडली आणि ती कशी अपयशी ठरते हे दिले आहे. जिच्या अपयशाची पद्धत सांगितलेली नाही, अशा पद्धतीची तपासणी कोणीही करू शकत नाही.',
  'Why this one': 'हीच का',
  'How it fails': 'ती कशी अपयशी ठरते',
  Software: 'संगणक प्रणाली',
  'All open-source. The platform makes no call to the open internet for its figures, models or maps, and runs entirely within the department’s own infrastructure.':
    'सर्व मुक्त-स्रोत. हा मंच आपले आकडे, प्रारूपे किंवा नकाशे यांसाठी खुल्या इंटरनेटशी कोणताही संपर्क साधत नाही, आणि पूर्णपणे विभागाच्याच पायाभूत सुविधेत चालतो.'
})
