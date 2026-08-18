import { registerMessages } from '../../locale.js'

/* ---------------------------------------------------------------------------
 * ITC RISK INTELLIGENCE & FAKE INVOICE NETWORK CATALOGUE
 *
 * Hand-written Marathi for every string introduced by
 * `src/modules/ITCRiskIntelligence.jsx` and `src/modules/FakeInvoiceNetwork.jsx`
 * that is not already covered by `../shell.js` (module titles, risk levels,
 * filter option labels etc. are reused verbatim from there via `t()`).
 * ------------------------------------------------------------------------- */

registerMessages('mr', {
  /* == ITC Risk Intelligence — section header & KPIs ======================= */
  'Fraud & Risk · ITC Intelligence': 'फसवणूक व जोखीम · ITC बुद्धिमत्ता',
  'Anomaly detection across input tax credit behaviour — abnormal spikes, high-risk supplier linkage, circular trading suspicion, e-way bill mismatch and sector deviation.':
    'इनपुट टॅक्स क्रेडिट वर्तनातील विसंगती शोध — असामान्य वाढ, उच्च-जोखीम पुरवठादार संबंध, वर्तुळाकार व्यापार संशय, ई-वे बिल विसंगती व क्षेत्र विचलन.',
  'Total ITC Exposure (filtered)': 'एकूण ITC जोखीम रक्कम (गाळलेली)',
  'High-Risk ITC Claims': 'उच्च-जोखीम ITC दावे',
  'Avg. ITC-to-Turnover Ratio': 'सरासरी ITC-ते-उलाढाल गुणोत्तर',
  'ITC Spike Alerts': 'ITC वाढ इशारे',

  /* == Sector benchmark chart card ========================================== */
  'Average ITC-to-Turnover Ratio by Sector': 'क्षेत्रनिहाय सरासरी ITC-ते-उलाढाल गुणोत्तर',
  'Sector benchmark ratios with associated high-risk taxpayer counts.':
    'संबंधित उच्च-जोखीम करदाता संख्येसह क्षेत्र मानक गुणोत्तरे.',
  'Bar height = average ITC-to-turnover ratio (%). Colour intensity = concentration of High/Critical risk taxpayers in that sector.':
    'दंडाची उंची = सरासरी ITC-ते-उलाढाल गुणोत्तर (%). रंगाची तीव्रता = त्या क्षेत्रातील उच्च/अत्यंत गंभीर जोखीम करदात्यांचे प्रमाण.',

  /* == ITC anomaly category tabs ============================================ */
  'ITC Anomaly Categories': 'ITC विसंगती प्रवर्ग',
  'Select a category to view matching taxpayer cases under the current global filters.':
    'सध्याच्या सर्वंकष गाळण्यांनुसार जुळणारी करदाता प्रकरणे पाहण्यासाठी एक प्रवर्ग निवडा.',
  'No taxpayers currently match this category under the active global filters.':
    'सध्या सक्रिय सर्वंकष गाळण्यांनुसार या प्रवर्गाशी कोणताही करदाता जुळत नाही.',
  'Show More': 'अधिक दाखवा',
  'Showing {0} of {1} matching cases': '{1} पैकी {0} जुळणारी प्रकरणे दाखवत आहे',

  /* == ITC anomaly category labels/descriptions (CATEGORIES) =============== */
  'Abnormal ITC Spike': 'असामान्य ITC वाढ',
  'Input tax credit claimed materially exceeds trailing average / sector norm.':
    'दावा केलेला इनपुट टॅक्स क्रेडिट मागील सरासरी / क्षेत्र मानकापेक्षा लक्षणीयरीत्या जास्त आहे.',
  'Supplier Mismatch': 'पुरवठादार विसंगती',
  'Upstream supplier independently carries a High risk rating, or a supplier-risk signal is triggered.':
    'उगमस्थानी पुरवठादार स्वतंत्रपणे उच्च जोखीम श्रेणी बाळगतो, किंवा पुरवठादार-जोखीम संकेत सक्रिय झाला आहे.',
  'Circular ITC Suspicion': 'वर्तुळाकार ITC संशय',
  'Invoice flow pattern consistent with circular trading among linked counterparties.':
    'चलन प्रवाह नमुना जोडलेल्या प्रतिपक्षांमधील वर्तुळाकार व्यापाराशी सुसंगत आहे.',
  'ITC Without Corresponding Supply Pattern': 'अनुरूप पुरवठा नमुन्याविना ITC',
  'E-way bill movement value is inconsistent with declared outward supply — credit claimed without matching movement.':
    'ई-वे बिल वहन मूल्य घोषित बाह्य पुरवठ्याशी विसंगत आहे — जुळणाऱ्या वहनाशिवाय क्रेडिटचा दावा केला आहे.',
  'Sector Deviation': 'क्षेत्र विचलन',
  'Tax-to-turnover ratio deviates materially from the peer sector benchmark.':
    'कर-ते-उलाढाल गुणोत्तर समकक्ष क्षेत्र मानकापासून लक्षणीयरीत्या विचलित होते.',

  /* == Risk rule labels (explainRiskScore evidence, rendered on ITC cards) = */
  'Circular Trading / Network Signal': 'वर्तुळाकार व्यापार / जाळे संकेत',
  'Non-Filing of Returns': 'विवरणपत्र न भरणे',
  'E-Way Bill vs Return Mismatch': 'ई-वे बिल वि. विवरणपत्र विसंगती',
  'High-Risk Supplier Linkage': 'उच्च-जोखीम पुरवठादार संबंध',
  'Sudden Decline in Tax Payment': 'कर भरण्यात अचानक घट',
  'High Refund-to-Turnover Ratio': 'उच्च परतावा-ते-उलाढाल गुणोत्तर',
  'New Registration, High Transaction Volume': 'नवीन नोंदणी, उच्च व्यवहार प्रमाण',
  'Deviation from Sector Benchmark': 'क्षेत्र मानकापासून विचलन',
  'Chronic Late Filing': 'सातत्यपूर्ण विलंबित विवरणपत्र भरणे',

  /* == ITC risk card ========================================================= */
  'Est. Exposure': 'अंदाजित जोखीम रक्कम',
  Evidence: 'पुरावा',
  'No individual rule detail available.': 'कोणताही स्वतंत्र नियम तपशील उपलब्ध नाही.',
  'Review Required': 'पुनरावलोकन आवश्यक',
  Routine: 'नियमित',
  'Hide checklist': 'तपासणी यादी लपवा',
  'Verification checklist': 'पडताळणी तपासणी यादी',

  /* == Fake Invoice Network — section header & KPIs ========================= */
  'Fraud & Risk · Network Intelligence': 'फसवणूक व जोखीम · जाळे बुद्धिमत्ता',
  'No network clusters detected in the current dataset.': 'सध्याच्या माहितीसंचात कोणतेही जाळे समूह आढळले नाहीत.',
  'No circular-trading network clusters found.': 'कोणतेही वर्तुळाकार-व्यापार जाळे समूह सापडले नाहीत.',
  'Graph-based detection of circular invoice trading and linked-entity networks — shared address/contact indicators, short-life entities and estimated flow value between counterparties.':
    'वर्तुळाकार चलन व्यापार व जोडलेल्या संस्थांच्या जाळ्यांचा आलेख-आधारित शोध — सामायिक पत्ता/संपर्क निर्देशक, अल्पायुषी संस्था व प्रतिपक्षांदरम्यानचे अंदाजित प्रवाह मूल्य.',
  'Clusters Detected': 'आढळलेले समूह',
  'Entities Involved': 'सहभागी संस्था',
  'Clusters w/ Shared Address / Contact': 'सामायिक पत्ता / संपर्क असलेले समूह',
  'Total Estimated Flow Value': 'एकूण अंदाजित प्रवाह मूल्य',
  Lakh: 'लाख',

  /* == Non-finding-of-fraud disclaimer banner (split for the <strong> tag) = */
  'Network intelligence is a statistical signal derived from invoice flow, ITC pass-through and linked-entity patterns. It is':
    'जाळे बुद्धिमत्ता ही चलन प्रवाह, ITC पासथ्रू व जोडलेल्या-संस्था नमुन्यांवरून प्राप्त केलेला सांख्यिकीय संकेत आहे. हे',
  'not a finding of fraud': 'फसवणुकीचा निष्कर्ष नाही',
  '— every cluster listed here requires verification by the Investigation Team before any enforcement action.':
    '— येथे सूचिबद्ध केलेल्या प्रत्येक समूहाला कोणत्याही अंमलबजावणी कृतीपूर्वी तपास चमूकडून पडताळणी आवश्यक आहे.',

  /* == Cluster sidebar list ================================================== */
  'Detected Clusters': 'आढळलेले समूह',
  'Select a cluster to view its network.': 'त्याचे जाळे पाहण्यासाठी एक समूह निवडा.',
  '{0} entities': '{0} संस्था',
  '₹{0} L estimated flow': 'अंदाजे ₹{0} लाख प्रवाह',
  'Shared Addr.': 'सामायिक पत्ता',
  'Shared Contact': 'सामायिक संपर्क',
  '{0} short-life': '{0} अल्पायुषी',

  /* == Network graph card ==================================================== */
  'Network Graph — {0}': 'जाळे आलेख — {0}',
  "Arrows indicate direction of invoice flow. Click a node to open the taxpayer's full profile.":
    'बाणांनी चलन प्रवाहाची दिशा दर्शवली आहे. करदात्याची संपूर्ण संचिका उघडण्यासाठी एका बिंदूवर क्लिक करा.',
  'Intelligence Brief': 'बुद्धिमत्ता माहितीपत्र',
  'Possible circular transaction chain detected based on invoice flow, ITC pass-through, low tax payment, and linked counterparty risk.':
    'चलन प्रवाह, ITC पासथ्रू, कमी कर भरणा व जोडलेल्या प्रतिपक्ष जोखिमेवर आधारित संभाव्य वर्तुळाकार व्यवहार साखळी आढळली.',
  'Shared Registered Address': 'सामायिक नोंदणीकृत पत्ता',
  'Shared Contact Details': 'सामायिक संपर्क तपशील',
  '{0} Short-Life Entity': '{0} अल्पायुषी संस्था',
  '{0} Short-Life Entities': '{0} अल्पायुषी संस्था',

  /* == Filter-mismatch notes ================================================= */
  'No clusters match your current header filters': 'तुमच्या सध्याच्या मथळा गाळण्यांशी कोणताही समूह जुळत नाही',
  'Showing the full unfiltered cluster list below — adjust or clear the header filters to narrow results.':
    'खाली संपूर्ण अ-गाळलेली समूह यादी दाखवत आहे — निकाल मर्यादित करण्यासाठी मथळा गाळण्या समायोजित करा किंवा साफ करा.',
  "This cluster doesn't match your current header filters": 'हा समूह तुमच्या सध्याच्या मथळा गाळण्यांशी जुळत नाही',
  'Dismiss filter mismatch note': 'गाळणी विसंगती टिप्पणी रद्द करा',

  /* == Legend =============================================================== */
  'Low Risk': 'कमी जोखीम',
  'Medium Risk': 'मध्यम जोखीम',
  'High Risk': 'उच्च जोखीम',
  'Critical Risk': 'अत्यंत गंभीर जोखीम',
  'Dormant / Inactive': 'निष्क्रिय / कार्यरत नाही',
  Dormant: 'निष्क्रिय',

  /* == Invoice flow edge detail table ======================================= */
  'Invoice Flow — Edge Detail': 'चलन प्रवाह — कड तपशील',
  From: 'पासून',
  To: 'पर्यंत',
  'Estimated Value': 'अंदाजित मूल्य',

  /* == Entities in cluster list ============================================= */
  'Entities in this Cluster': 'या समूहातील संस्था',

  /* == All-clusters summary table =========================================== */
  'All Detected Clusters': 'सर्व आढळलेले समूह',
  'Consolidated summary across every network cluster in the current dataset.':
    'सध्याच्या माहितीसंचातील प्रत्येक जाळे समूहावरील एकत्रित सारांश.',
  'Search clusters...': 'समूह शोधा...',
  'Cluster ID': 'समूह ID',
  Entities: 'संस्था',
  'Shared Address?': 'सामायिक पत्ता?',
  'Shared Contact?': 'सामायिक संपर्क?',
  'Short-Life Entities': 'अल्पायुषी संस्था',
  'Total Flow Value': 'एकूण प्रवाह मूल्य',
  Yes: 'होय',
  No: 'नाही',
  'View Network': 'जाळे पहा'
})
