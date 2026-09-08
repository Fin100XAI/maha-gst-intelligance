import { registerMessages } from '../../locale.js'

/**
 * Marathi — Platform Settings.
 *
 * Diction is inherited from sections/gov.js, where the access matrix first
 * appeared, so the two screens read as one system:
 *
 *   role                 → भूमिका
 *   section (navigation) → विभाग          (कलम stays reserved for statute)
 *   module               → घटक
 *   platform             → मंच
 *   at render time       → पडदा रचतानाच
 *   access configuration → प्रवेश संरचना
 *
 * “Pinned” has no settled Marathi equivalent in departmental use, so the sense
 * is carried instead — a module held back below its section — rather than a
 * transliteration that would explain nothing to a reader.
 */
registerMessages('mr', {
  /* == Header ============================================================ */
  Settings: 'सेटिंग्ज',
  'Settings · Platform Configuration': 'सेटिंग्ज · मंच संरचना',
  'Who can open what, read out of the configuration the platform enforces.':
    'कोण काय उघडू शकतो — मंच जी संरचना प्रत्यक्षात लागू करतो, तिच्यातूनच वाचलेले.',
  'Every table on this screen is generated at render time from the role and module access configuration rather than described alongside it, so it cannot drift from what the platform actually applies. Nothing here is editable: access is a deployment decision made in the departmental system of record, not a switch an officer flips mid-session.':
    'या पडद्यावरील प्रत्येक कोष्टक भूमिका व घटक यांच्या प्रवेश संरचनेवरून पडदा रचतानाच तयार होते — तिचे वेगळे वर्णन लिहिलेले नाही, त्यामुळे मंच प्रत्यक्षात जे लागू करतो त्यापासून ते दूर जाऊ शकत नाही. येथे काहीही संपादन करता येत नाही: प्रवेश हा विभागाच्या अधिकृत अभिलेख प्रणालीत घेतला जाणारा तैनाती-निर्णय आहे, सत्रादरम्यान अधिकाऱ्याने फिरवायची कळ नव्हे.',
  'It describes roles and access, which are configuration rather than taxpayer data.':
    'ते भूमिका व प्रवेश यांचे वर्णन करते, जी करदाता-माहिती नसून संरचना आहे.',

  'Which role can open which screen, read out of the configuration the platform enforces.':
    'कोणती भूमिका कोणता पडदा उघडू शकते — मंच जी संरचना प्रत्यक्षात लागू करतो, तिच्यातूनच वाचलेले.',

  /* == Counters ========================================================== */
  'Officer Roles': 'अधिकारी भूमिका',
  Sections: 'विभाग',
  Modules: 'घटक',
  'Modules Pinned Below Their Section': 'आपल्या विभागाखाली रोखलेले घटक',
  'open to fewer roles than the section': 'विभागापेक्षा कमी भूमिकांना खुले',

  /* == The matrix ======================================================== */
  'Role-Based Access — as enforced': 'भूमिका-आधारित प्रवेश — जसा लागू आहे',
  'Generated from the access configuration at render time, not described alongside it':
    'पडदा रचतानाच प्रवेश संरचनेवरून तयार केलेले, तिचे वेगळे वर्णन लिहून नव्हे',
  'Lands on after sign-in': 'साइन-इन नंतर उघडणारा पडदा',
  'No module reachable': 'एकही घटक पोहोचण्याजोगा नाही',
  'Access is decided per role at section level and then again at module level. The fourth column is that second layer on its own — modules inside a section the role holds that it still cannot open. That is the layer a reviewer most often cannot see.':
    'प्रवेश हा प्रत्येक भूमिकेसाठी आधी विभाग पातळीवर आणि नंतर पुन्हा घटक पातळीवर ठरवला जातो. चौथा स्तंभ म्हणजे तोच दुसरा स्तर, स्वतंत्रपणे — भूमिकेकडे असलेल्या विभागातील जे घटक तिला तरीही उघडता येत नाहीत ते. पुनर्विलोकन करणाऱ्याला बहुधा हाच स्तर दिसत नाही.',
  'A role with a section is not automatically given every module in it.':
    'एखाद्या भूमिकेला विभाग मिळाला म्हणून त्यातील प्रत्येक घटक आपोआप मिळत नाही.',

  /* == Pins ============================================================== */
  'Screens open to fewer roles than the section they sit in':
    'ज्या विभागात आहेत त्यापेक्षा कमी भूमिकांना खुले असलेले पडदे',
  'No module is pinned. Every screen is open to whoever holds its section.':
    'एकही घटक रोखलेला नाही. ज्याच्याकडे विभाग आहे त्याला त्यातील प्रत्येक पडदा खुला आहे.',
  'A pin is what keeps a menu change from becoming an access change.':
    'मेनूतील बदल हा प्रवेशातील बदल होऊ नये, हे रोखणी टिकवते.',
  'When a screen moves between sections, every role holding the destination section would otherwise gain it. Pinning the module to the roles that could already open it keeps the audience exactly as it was, so the platform can be reorganised for how work is actually done without quietly widening who sees what.':
    'एखादा पडदा एका विभागातून दुसऱ्यात हलवला, तर तो नवा विभाग असलेल्या प्रत्येक भूमिकेला अन्यथा तो मिळून जाईल. त्या घटकाला आधीच उघडू शकणाऱ्या भूमिकांपुरते रोखून ठेवले की प्रेक्षकवर्ग जसाच्या तसा राहतो — म्हणजे काम प्रत्यक्षात कसे चालते त्यानुसार मंचाची फेररचना करता येते, आणि कोणाला काय दिसते हे नकळत रुंदावत नाही.',

  /* == The gate ========================================================== */
  'Demonstration Access Gate': 'प्रात्यक्षिक प्रवेश द्वार',
  'How this build is entered, and what that is worth':
    'या आवृत्तीत प्रवेश कसा मिळतो, आणि त्याचे मूल्य किती',

  /* == Pointer left on the governance console ============================ */
  'The full matrix is on the Settings screen, generated from the same configuration':
    'संपूर्ण जाळी सेटिंग्ज पडद्यावर आहे, त्याच संरचनेवरून तयार केलेली',
  'Access is decided per role at section level and then again at module level. The matrix is generated from that configuration at render time on the Settings screen rather than described alongside it, so it cannot drift from what the platform actually enforces.':
    'प्रवेश हा प्रत्येक भूमिकेसाठी आधी विभाग पातळीवर आणि नंतर पुन्हा घटक पातळीवर ठरवला जातो. ती जाळी सेटिंग्ज पडद्यावर, त्या संरचनेवरून पडदा रचतानाच तयार केली जाते — तिचे वेगळे वर्णन लिहिलेले नाही, त्यामुळे मंच प्रत्यक्षात जे लागू करतो त्यापासून ती दूर जाऊ शकत नाही.',
  'Access is decided per role at section level and then again at module level. The matrix that shows both layers — sections granted, modules reachable, and the modules a role is denied despite holding their section — is on the Settings screen. It is generated at render time from the same configuration this control register describes, so the two cannot disagree.':
    'प्रवेश हा प्रत्येक भूमिकेसाठी आधी विभाग पातळीवर आणि नंतर पुन्हा घटक पातळीवर ठरवला जातो. दोन्ही स्तर दाखवणारी जाळी — दिलेले विभाग, पोहोचता येणारे घटक, आणि विभाग असूनही नाकारलेले घटक — सेटिंग्ज पडद्यावर आहे. हेच नियंत्रण-पत्रक ज्या संरचनेचे वर्णन करते, त्याच संरचनेवरून ती पडदा रचतानाच तयार होते, त्यामुळे दोघांत मतभेद होऊ शकत नाही.'
})
