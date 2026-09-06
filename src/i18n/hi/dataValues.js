import { registerMessages } from '../locale.js'

/**
 * Hindi — the closed vocabularies that come from the data rather than the UI.
 *
 * WHY THIS IS THE HIGHEST-LEVERAGE FILE IN THE HINDI CATALOGUE
 *
 * Districts, divisions, sectors, case stages, notice types, alert types and risk
 * rules are data values, not interface labels. Ninety-six distinct strings, but
 * they render thousands of times — in every table, every chip, every chart axis
 * and every filter dropdown. Until they are translated, a fully translated
 * screen still reads as English, because most of the words on it come from the
 * records rather than from the page. Marathi already carried these across its
 * screen catalogues; Hindi did not, which is the single largest reason the
 * Hindi pages still showed English.
 *
 * Proper nouns are transliterated, not translated: a district is written as the
 * department writes it. Form codes — GSTR-3A, RFD-08, ASMT-10, REG-17, DRC-01 —
 * and ITC stay in Latin, because they are the citation an officer quotes.
 *
 * "Aurangabad Division" keeps its administrative name; the district it contains
 * is separately listed as Chhatrapati Sambhajinagar, which is how the two
 * actually appear in departmental records.
 */
registerMessages('hi', {
  /* == Districts — filter vocabulary ====================================== */
  Mumbai: 'मुंबई',
  Thane: 'ठाणे',
  Pune: 'पुणे',
  Nagpur: 'नागपुर',
  Nashik: 'नासिक',
  'Chhatrapati Sambhajinagar': 'छत्रपति संभाजीनगर',
  Kolhapur: 'कोल्हापुर',
  Solapur: 'सोलापुर',
  Amravati: 'अमरावती',
  Jalgaon: 'जलगाँव',
  Satara: 'सतारा',
  Raigad: 'रायगढ़',

  /* == Divisions ========================================================== */
  'Mumbai Division': 'मुंबई विभाग',
  'Thane Division': 'ठाणे विभाग',
  'Pune Division': 'पुणे विभाग',
  'Nagpur Division': 'नागपुर विभाग',
  'Nashik Division': 'नासिक विभाग',
  'Aurangabad Division': 'औरंगाबाद विभाग',
  'Kolhapur Division': 'कोल्हापुर विभाग',
  'Amravati Division': 'अमरावती विभाग',

  /* == Sectors ============================================================ */
  'Real Estate': 'स्थावर संपदा',
  Construction: 'निर्माण',
  Pharma: 'औषधि निर्माण',
  Logistics: 'माल परिवहन',
  Textiles: 'वस्त्र उद्योग',
  'Gems & Jewellery': 'रत्न एवं आभूषण',
  'Auto Components': 'वाहन कल-पुर्जे',
  Restaurants: 'भोजनालय',
  Electronics: 'इलेक्ट्रॉनिक्स',
  Steel: 'इस्पात',
  Cement: 'सीमेंट',
  'E-commerce Sellers': 'ई-कॉमर्स विक्रेता',
  'Professional Services': 'व्यावसायिक सेवाएँ',
  'Import/Export': 'आयात/निर्यात',

  /* == Filing status ====================================================== */
  'Regular Filer': 'नियमित विवरणी दाखिल करने वाला',
  'Late Filer': 'विलंब से विवरणी दाखिल करने वाला',
  'Non-Filer': 'विवरणी दाखिल न करने वाला',
  'Financial Year 2025-26': 'वित्तीय वर्ष 2025-26',

  /* == Audit stages ======================================================= */
  New: 'नया',
  'Under Review': 'समीक्षाधीन',
  'Notice Drafted': 'नोटिस प्रारूपित',
  Hearing: 'सुनवाई',
  Recovery: 'वसूली',
  Closed: 'निपटाया गया',

  /* == Litigation stages ================================================== */
  'Order Confirmed': 'आदेश पुष्ट',
  'Order Reversed': 'आदेश निरस्त',
  Remanded: 'पुनर्विचार हेतु प्रतिप्रेषित',
  'Pending at Tribunal': 'अधिकरण में लंबित',
  'Pending at Appellate Authority': 'अपीलीय प्राधिकारी के समक्ष लंबित',

  /* == Questions of law =================================================== */
  'ITC Eligibility Dispute': 'ITC पात्रता विवाद',
  'Classification Dispute': 'वर्गीकरण विवाद',
  'Valuation Dispute': 'मूल्यांकन विवाद',
  'Place of Supply Dispute': 'आपूर्ति स्थान विवाद',
  'Refund Rejection Challenge': 'प्रतिदाय अस्वीकृति को चुनौती',
  'Penalty Proportionality': 'शास्ति की आनुपातिकता',
  'Limitation Period Dispute': 'परिसीमा अवधि विवाद',

  /* == Departmental position on a question of law ========================= */
  Strong: 'सुदृढ़',
  Moderate: 'मध्यम',
  'Weak — documentation gap': 'कमजोर — दस्तावेजी कमी',
  'Weak — precedent unfavourable': 'कमजोर — पूर्वनिर्णय प्रतिकूल',

  /* == Notice types — mockData.NOTICE_TYPES =============================== */
  'GSTR-3A Non-Filer Notice': 'GSTR-3A विवरणी न भरने की नोटिस',
  'RFD-08 Refund Rejection Notice': 'RFD-08 प्रतिदाय अस्वीकृति नोटिस',
  'ASMT-10 Scrutiny Notice': 'ASMT-10 संवीक्षा नोटिस',
  'REG-17 Registration Cancellation Notice': 'REG-17 पंजीयन रद्दीकरण नोटिस',
  'DRC-01 Show Cause Notice': 'DRC-01 कारण बताओ नोटिस',

  /* == Notice status ====================================================== */
  'Hearing Scheduled': 'सुनवाई नियत',
  'Reply Received': 'उत्तर प्राप्त',
  'Reply Awaited': 'उत्तर प्रतीक्षित',
  Escalated: 'वरिष्ठ स्तर पर भेजा गया',
  'Order Issued': 'आदेश जारी',

  /* == Compliance alerts ================================================== */
  'Registration Amendment Risk': 'पंजीयन संशोधन जोखिम',
  'New Taxpayer High Transaction Risk': 'नया करदाता, उच्च लेनदेन जोखिम',
  'High Turnover, Low Payment': 'उच्च कारोबार, कम कर भुगतान',
  'Late Filing Pattern': 'विलंब से विवरणी भरने की प्रवृत्ति',
  'Sudden Tax Payment Drop': 'कर भुगतान में अचानक गिरावट',
  'Return Mismatch': 'विवरणी में विसंगति',
  'Non-Filer Alert': 'विवरणी न भरने वाला — सूचना',
  'Dormant-to-Active Spike': 'निष्क्रिय से सक्रिय होने पर अचानक उछाल',

  /* == Alert status — the officer's own disposition of an alert =========== */
  Open: 'खुला',
  'Outreach Sent': 'संपर्क भेजा गया',
  'Officer Reviewing': 'अधिकारी समीक्षा कर रहे हैं',
  Resolved: 'निस्तारित',

  /* == Risk rules ========================================================= */
  'New Registration, High Transaction Volume': 'नया पंजीयन, उच्च लेनदेन मात्रा',
  'High-Risk Supplier Linkage': 'उच्च जोखिम आपूर्तिकर्ता से संबंध',
  'High Refund-to-Turnover Ratio': 'प्रतिदाय-कारोबार अनुपात उच्च',
  'Abnormal ITC Spike': 'ITC में असामान्य उछाल',
  'E-Way Bill vs Return Mismatch': 'ई-वे बिल एवं विवरणी में विसंगति',
  'Sudden Decline in Tax Payment': 'कर भुगतान में अचानक गिरावट',
  'Non-Filing of Returns': 'विवरणियाँ दाखिल न करना',
  'Chronic Late Filing': 'लगातार विलंब से विवरणी दाखिल करना',
  'Circular Trading / Network Signal': 'वर्तुलाकार व्यापार / नेटवर्क संकेत',

  /* == Compliance history — mockData.COMPLIANCE_HISTORIES ================= */
  'Consistently Compliant': 'निरंतर अनुपालनशील',
  'Minor Irregularities': 'मामूली अनियमितताएँ',
  'Repeated Defaults': 'बार-बार चूक',
  'Under Investigation': 'अन्वेषणाधीन',

  /* == Refund triage ====================================================== */
  'Low Risk': 'कम जोखिम',
  'Needs Officer Review': 'अधिकारी समीक्षा आवश्यक',
  'Escalate for Scrutiny': 'संवीक्षा हेतु भेजें',

  /* == Role within a network cluster ====================================== */
  'Hub Entity': 'केंद्रीय इकाई',
  'Pass-Through': 'मध्यवर्ती इकाई',
  Counterparty: 'प्रतिपक्ष'
})
