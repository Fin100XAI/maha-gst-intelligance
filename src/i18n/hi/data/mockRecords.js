import { registerMessages } from '../../locale.js'

/**
 * Hindi — the operational vocabulary generated into the records: audit status,
 * litigation status, audit-log actions and devices, and the AI governance
 * control statuses.
 *
 * The entity suffixes the generator appends to trade names — Private Limited,
 * Industries Ltd, Trading Co. — are excluded from scripts/prose.mjs by their
 * declaration name and stay in Latin. They are part of a registered name, not a
 * description of it, and an officer searching GSTN would not find a translated
 * version.
 *
 * Security and standards identifiers stay in Latin for the same reason an
 * officer quotes them unchanged: AES-256, TLS 1.3, CERT-In, VAPT, PII, MIDC.
 *
 *   drift            → विचलन
 *   control band     → नियंत्रण पट्टी
 *   adversarial      → प्रतिकूल
 *   prompt-injection → निवेश-अंतःक्षेपण
 *   exfiltration     → आँकड़ा-निष्कासन
 *   empanelled       → सूचीबद्ध
 *   masking          → आच्छादन
 */
registerMessages('hi', {
  /* == Address fragments ================================================= */
  'Industrial Estate': 'औद्योगिक क्षेत्र',
  'Commercial Complex': 'वाणिज्यिक संकुल',
  'Business Park': 'व्यवसाय संकुल',

  /* == Audit and litigation status ====================================== */
  All: 'सभी',
  'Not Selected': 'चयनित नहीं',
  'Under Scrutiny': 'संवीक्षाधीन',
  'Audit In Progress': 'लेखापरीक्षा जारी',
  'Notice Issued': 'नोटिस जारी',
  'No Active Litigation': 'कोई सक्रिय मुकदमा नहीं',
  Compliant: 'अनुपालनशील',

  /* == Audit log — actions ============================================== */
  'Viewed Taxpayer 360 Profile': 'करदाता 360 विवरण देखा',
  'Generated AI Risk Explanation': 'AI जोखिम स्पष्टीकरण तैयार किया',
  'Approved Audit Assignment': 'लेखापरीक्षा नियतन अनुमोदित किया',
  'Drafted Notice (AI-assisted)': 'नोटिस प्रारूप तैयार किया (AI-सहायित)',
  'Exported Report': 'प्रतिवेदन निर्यात किया',
  'Overrode AI Risk Flag': 'AI जोखिम चिह्न अधिक्रमित किया',
  'Reviewed Refund Case': 'प्रतिदाय प्रकरण की समीक्षा की',
  'Marked False Positive': 'मिथ्या-सकारात्मक अंकित किया',
  Login: 'प्रवेश',
  'Updated Case Status': 'प्रकरण स्थिति अद्यतन की',

  /* == Audit log — modules, devices and outcome ========================= */
  'Audit & Scrutiny': 'लेखापरीक्षा एवं संवीक्षा',
  'Refund Risk': 'प्रतिदाय जोखिम',
  Reports: 'प्रतिवेदन',
  'Desktop / Chrome (MahaGST Intranet)': 'डेस्कटॉप / Chrome (MahaGST अंतर्जाल)',
  'Desktop / Edge (MahaGST Intranet)': 'डेस्कटॉप / Edge (MahaGST अंतर्जाल)',
  'Tablet / Secure App': 'टैबलेट / सुरक्षित ऐप',
  Success: 'सफल',
  'Denied — Insufficient Role Permission': 'अस्वीकृत — पद हेतु पर्याप्त अनुमति नहीं',

  /* == AI governance control statuses =================================== */
  Enabled: 'सक्रिय',
  'AES-256 at rest, TLS 1.3 in transit': 'भंडारण में AES-256, संचरण में TLS 1.3',
  'Not monitored in this demonstration — production requires a drift check against a control band each cycle':
    'इस प्रदर्शन में इस पर निगरानी नहीं — वास्तविक तैनाती में प्रत्येक चक्र में नियंत्रण पट्टी के सापेक्ष विचलन जाँच आवश्यक',
  'Not conducted — production requires adversarial testing for prompt-injection and data-exfiltration before go-live':
    'नहीं किया गया — वास्तविक तैनाती में चालू होने से पूर्व निवेश-अंतःक्षेपण एवं आँकड़ा-निष्कासन हेतु प्रतिकूल परीक्षण आवश्यक',
  'Not assessed — production requires a CERT-In empanelled VAPT cycle and certificate before deployment':
    'आकलन नहीं हुआ — वास्तविक तैनाती से पूर्व CERT-In सूचीबद्ध VAPT चक्र एवं प्रमाणपत्र आवश्यक',
  'Not applicable to this demonstration (no backend or stored data) — production target is AES-256 at rest and TLS 1.3 in transit':
    'इस प्रदर्शन पर लागू नहीं (कोई पश्च प्रणाली अथवा संचित आँकड़े नहीं) — वास्तविक तैनाती का लक्ष्य भंडारण में AES-256 एवं संचरण में TLS 1.3',
  'Not implemented — production requires PII masking in AI Copilot prompts by default':
    'लागू नहीं — वास्तविक तैनाती में AI सहप्रचालक के निवेशों में PII आच्छादन मूल रूप से आवश्यक'
})
