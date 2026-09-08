import { registerMessages } from '../../locale.js'

/**
 * Hindi — Platform Settings.
 *
 * Diction is inherited from sections/gov.js, where the access matrix first
 * appeared, so the two screens read as one system:
 *
 *   role                 → भूमिका
 *   section (navigation) → अनुभाग        (धारा stays reserved for statute)
 *   module               → मॉड्यूल
 *   platform             → मंच
 *   at render time       → पर्दा बनाते समय ही
 *   access configuration → पहुँच विन्यास
 *
 * “Pinned” has no settled Hindi equivalent in departmental use, so the sense is
 * carried instead — a module held back below its section — rather than a
 * transliteration that would explain nothing to a reader.
 */
registerMessages('hi', {
  /* == Header ============================================================ */
  Settings: 'सेटिंग्स',
  'Settings · Platform Configuration': 'सेटिंग्स · मंच विन्यास',
  'Who can open what, read out of the configuration the platform enforces.':
    'कौन क्या खोल सकता है — मंच जो विन्यास वास्तव में लागू करता है, उसी से पढ़ा गया।',
  'Every table on this screen is generated at render time from the role and module access configuration rather than described alongside it, so it cannot drift from what the platform actually applies. Nothing here is editable: access is a deployment decision made in the departmental system of record, not a switch an officer flips mid-session.':
    'इस पर्दे की प्रत्येक सारणी भूमिका और मॉड्यूल के पहुँच विन्यास से पर्दा बनाते समय ही उत्पन्न होती है, उसका अलग वर्णन नहीं लिखा गया — इसलिए मंच वास्तव में जो लागू करता है उससे वह दूर नहीं जा सकती। यहाँ कुछ भी संपादन योग्य नहीं है: पहुँच विभाग की अभिलेख प्रणाली में लिया जाने वाला तैनाती-निर्णय है, सत्र के बीच अधिकारी द्वारा पलटा जाने वाला स्विच नहीं।',
  'It describes roles and access, which are configuration rather than taxpayer data.':
    'यह भूमिकाओं और पहुँच का वर्णन करता है, जो करदाता-आँकड़े नहीं बल्कि विन्यास हैं।',

  'Which role can open which screen, read out of the configuration the platform enforces.':
    'कौन-सी भूमिका कौन-सा पर्दा खोल सकती है — मंच जो विन्यास वास्तव में लागू करता है, उसी से पढ़ा गया।',

  /* == Counters ========================================================== */
  'Officer Roles': 'अधिकारी भूमिकाएँ',
  Sections: 'अनुभाग',
  Modules: 'मॉड्यूल',
  'Modules Pinned Below Their Section': 'अपने अनुभाग से नीचे रोके गए मॉड्यूल',
  'open to fewer roles than the section': 'अनुभाग से कम भूमिकाओं के लिए खुले',

  /* == The matrix ======================================================== */
  'Role-Based Access — as enforced': 'भूमिका-आधारित पहुँच — जैसी लागू है',
  'Generated from the access configuration at render time, not described alongside it':
    'पर्दा बनाते समय ही पहुँच विन्यास से उत्पन्न, उसका अलग वर्णन लिखकर नहीं',
  'Lands on after sign-in': 'साइन-इन के बाद खुलने वाला पर्दा',
  'No module reachable': 'कोई भी मॉड्यूल पहुँच योग्य नहीं',
  'Access is decided per role at section level and then again at module level. The fourth column is that second layer on its own — modules inside a section the role holds that it still cannot open. That is the layer a reviewer most often cannot see.':
    'पहुँच प्रत्येक भूमिका हेतु पहले अनुभाग स्तर पर और फिर मॉड्यूल स्तर पर तय होती है। चौथा स्तंभ वही दूसरी परत है, स्वतंत्र रूप से — भूमिका के पास जो अनुभाग है उसके भीतर के वे मॉड्यूल जिन्हें वह फिर भी नहीं खोल सकती। समीक्षक को प्रायः यही परत दिखाई नहीं देती।',
  'A role with a section is not automatically given every module in it.':
    'किसी भूमिका को अनुभाग मिलने भर से उसके भीतर का प्रत्येक मॉड्यूल स्वतः नहीं मिलता।',

  /* == Pins ============================================================== */
  'Screens open to fewer roles than the section they sit in':
    'जिस अनुभाग में हैं उससे कम भूमिकाओं के लिए खुले पर्दे',
  'No module is pinned. Every screen is open to whoever holds its section.':
    'कोई भी मॉड्यूल रोका नहीं गया है। जिसके पास अनुभाग है, उसके लिए उसका हर पर्दा खुला है।',
  'A pin is what keeps a menu change from becoming an access change.':
    'मेन्यू का बदलाव पहुँच का बदलाव न बन जाए, यह रोक ही उसे सँभालती है।',
  'When a screen moves between sections, every role holding the destination section would otherwise gain it. Pinning the module to the roles that could already open it keeps the audience exactly as it was, so the platform can be reorganised for how work is actually done without quietly widening who sees what.':
    'कोई पर्दा एक अनुभाग से दूसरे में जाए, तो नया अनुभाग रखने वाली प्रत्येक भूमिका को वह अन्यथा मिल जाएगा। उस मॉड्यूल को पहले से खोल सकने वाली भूमिकाओं तक ही रोक रखने पर दर्शक-वर्ग ठीक वैसा ही रहता है — अर्थात काम वास्तव में जैसे होता है उसके अनुसार मंच की पुनर्रचना की जा सकती है, और किसे क्या दिखता है यह चुपचाप नहीं फैलता।',

  /* == The gate ========================================================== */
  'Demonstration Access Gate': 'प्रदर्शन पहुँच द्वार',
  'How this build is entered, and what that is worth':
    'इस संस्करण में प्रवेश कैसे होता है, और उसका मूल्य कितना',

  /* == Pointer left on the governance console ============================ */
  'The full matrix is on the Settings screen, generated from the same configuration':
    'पूरी सारणी सेटिंग्स पर्दे पर है, उसी विन्यास से उत्पन्न',
  'Access is decided per role at section level and then again at module level. The matrix is generated from that configuration at render time on the Settings screen rather than described alongside it, so it cannot drift from what the platform actually enforces.':
    'पहुँच प्रत्येक भूमिका हेतु पहले अनुभाग स्तर पर और फिर मॉड्यूल स्तर पर तय होती है। वह सारणी सेटिंग्स पर्दे पर, उसी विन्यास से पर्दा बनाते समय ही उत्पन्न होती है, उसका अलग वर्णन नहीं लिखा गया — इसलिए मंच वास्तव में जो लागू करता है उससे वह दूर नहीं जा सकती।',
  'Access is decided per role at section level and then again at module level. The matrix that shows both layers — sections granted, modules reachable, and the modules a role is denied despite holding their section — is on the Settings screen. It is generated at render time from the same configuration this control register describes, so the two cannot disagree.':
    'पहुँच प्रत्येक भूमिका हेतु पहले अनुभाग स्तर पर और फिर मॉड्यूल स्तर पर तय होती है। दोनों परतें दिखाने वाली सारणी — दिए गए अनुभाग, पहुँच योग्य मॉड्यूल, और अनुभाग होते हुए भी अस्वीकृत मॉड्यूल — सेटिंग्स पर्दे पर है। यह नियंत्रण-पंजी जिस विन्यास का वर्णन करती है, उसी से वह पर्दा बनाते समय उत्पन्न होती है, इसलिए दोनों में मतभेद नहीं हो सकता।'
})
