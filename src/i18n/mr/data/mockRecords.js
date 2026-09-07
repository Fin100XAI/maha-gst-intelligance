import { registerMessages } from '../../locale.js'

/**
 * Marathi — the operational vocabulary generated into the records: audit
 * status, litigation status, audit-log actions and devices, and the AI
 * governance control statuses.
 *
 * NOT TRANSLATED, AND EXCLUDED FROM scripts/prose.mjs BY DECLARATION NAME
 *
 * LEGAL_SUFFIX holds the entity suffixes the generator appends to trade names —
 * Private Limited, Industries Ltd, Trading Co. Those are part of a registered
 * name rather than a description of it. "Shivneri Steel Corporation" is what
 * appears on the registration certificate, and an officer searching for it in
 * GSTN would not find a translated version.
 *
 * Security and standards identifiers stay in Latin for the same reason an
 * officer would quote them unchanged: AES-256, TLS 1.3, CERT-In, VAPT, PII,
 * MIDC.
 *
 *   drift          → विचलन (of a model over time)
 *   control band   → नियंत्रण पट्टा
 *   adversarial    → प्रतिकूल
 *   prompt-injection → निवेश-घुसखोरी
 *   exfiltration   → माहिती बाहेर काढणे
 *   empanelled     → सूचीबद्ध
 *   masking        → आच्छादन
 */
registerMessages('mr', {
  /* == Address fragments ================================================= */
  'Industrial Estate': 'औद्योगिक वसाहत',
  'Commercial Complex': 'व्यापारी संकुल',
  'Business Park': 'व्यवसाय संकुल',

  /* == Audit and litigation status ====================================== */
  All: 'सर्व',
  'Not Selected': 'निवडलेले नाही',
  'Under Scrutiny': 'तपासणीत',
  'Audit In Progress': 'लेखापरीक्षा सुरू',
  'Notice Issued': 'नोटीस जारी',
  'No Active Litigation': 'कोणताही सुरू असलेला खटला नाही',
  Compliant: 'नियमपालन करणारा',

  /* == Audit log — actions ============================================== */
  'Viewed Taxpayer 360 Profile': 'करदाता ३६० माहिती पाहिली',
  'Generated AI Risk Explanation': 'AI जोखीम स्पष्टीकरण तयार केले',
  'Approved Audit Assignment': 'लेखापरीक्षा नेमणुकीस मान्यता दिली',
  'Drafted Notice (AI-assisted)': 'नोटीस मसुदा तयार केला (AI-सहाय्यित)',
  'Exported Report': 'अहवाल निर्यात केला',
  'Overrode AI Risk Flag': 'AI जोखीम निदर्शन रद्द केले',
  'Reviewed Refund Case': 'परतावा प्रकरणाचे पुनर्विलोकन केले',
  'Marked False Positive': 'चुकीचे निदर्शन म्हणून नोंदवले',
  Login: 'प्रवेश',
  'Updated Case Status': 'प्रकरण स्थिती अद्ययावत केली',

  /* == Audit log — modules, devices and outcome ========================= */
  'Audit & Scrutiny': 'लेखापरीक्षा व तपासणी',
  'Refund Risk': 'परतावा जोखीम',
  Reports: 'अहवाल',
  'Desktop / Chrome (MahaGST Intranet)': 'डेस्कटॉप / Chrome (MahaGST अंतर्जाल)',
  'Desktop / Edge (MahaGST Intranet)': 'डेस्कटॉप / Edge (MahaGST अंतर्जाल)',
  'Tablet / Secure App': 'टॅबलेट / सुरक्षित अ‍ॅप',
  Success: 'यशस्वी',
  'Denied — Insufficient Role Permission': 'नाकारले — पदास पुरेशी परवानगी नाही',

  /* == AI governance control statuses =================================== */
  Enabled: 'सुरू',
  'AES-256 at rest, TLS 1.3 in transit': 'साठवणुकीत AES-256, वहनात TLS 1.3',
  'Not monitored in this demonstration — production requires a drift check against a control band each cycle':
    'या प्रात्यक्षिकात यावर देखरेख नाही — प्रत्यक्ष अंमलबजावणीत प्रत्येक चक्रात नियंत्रण पट्ट्याच्या तुलनेत विचलन तपासणी आवश्यक',
  'Not conducted — production requires adversarial testing for prompt-injection and data-exfiltration before go-live':
    'केलेले नाही — प्रत्यक्ष अंमलबजावणीत कार्यान्वयनापूर्वी निवेश-घुसखोरी व माहिती बाहेर काढण्याविरुद्ध प्रतिकूल चाचणी आवश्यक',
  'Not assessed — production requires a CERT-In empanelled VAPT cycle and certificate before deployment':
    'मूल्यांकन केलेले नाही — प्रत्यक्ष अंमलबजावणीत तैनातीपूर्वी CERT-In सूचीबद्ध VAPT चक्र व प्रमाणपत्र आवश्यक',
  'Not applicable to this demonstration (no backend or stored data) — production target is AES-256 at rest and TLS 1.3 in transit':
    'या प्रात्यक्षिकाला लागू नाही (कोणतीही मागील प्रणाली किंवा साठवलेली माहिती नाही) — प्रत्यक्ष अंमलबजावणीचे उद्दिष्ट साठवणुकीत AES-256 व वहनात TLS 1.3',
  'Not implemented — production requires PII masking in AI Copilot prompts by default':
    'अंमलात आणलेले नाही — प्रत्यक्ष अंमलबजावणीत AI सहवैमानिकाच्या निवेशांत PII आच्छादन मूलभूतपणे आवश्यक'
})
