/**
 * Bilingual English / Marathi from day one -- docs/03 section 1.
 *
 * A Maharashtra deployment that ships English-only reads as a pilot. Statutory
 * form templates are translated too, from Phase 6; this file carries the shell.
 *
 * The dictionary is typed so that a missing Marathi key is a compile error
 * rather than an English word appearing silently in a Marathi screen.
 *
 * On the wording: the sidebar uses the department's standard terms, because
 * that is what the circular says, what the training says and what a colleague
 * will say on the phone. An officer navigating to "Enforcement Funnel" should
 * not have to translate from a friendlier name first. The plain-language
 * explanation lives on each screen, in its heading and behind its ⓘ, where a
 * reader finds it once and then no longer needs it.
 */

export const LANGUAGES = ['en', 'mr'] as const
export type Language = (typeof LANGUAGES)[number]

const en = {
  'app.name': 'GST Intelligence',
  'app.tagline': 'Commercial Taxes Department, Government of Maharashtra',
  'app.skipToContent': 'Skip to content',

  'surface.dashboard': 'Dashboard',
  'surface.workbench': 'Casework',
  'surface.dashboard.for': 'The whole State at a glance',
  'surface.workbench.for': 'One business at a time',

  'nav.shared': 'Setup & Reference',
  'nav.d1': 'Overview',
  'nav.d2': 'Filing Compliance',
  'nav.d3': 'Revenue & Liability',
  'nav.d4': 'Risk Landscape',
  'nav.d5': 'Risk Parameters',
  'nav.d6': 'Enforcement Funnel',
  'nav.d7': 'Jurisdictions',
  'nav.d8': 'Officers',
  'nav.d9': 'Sectors',
  'nav.w1': 'My Queue',
  'nav.w2': 'Audit Planner',
  'nav.w3': 'Taxpayer Registry',
  'nav.w4': 'Taxpayer File',
  'nav.w5': 'Cases',
  'nav.w6': 'Notices',
  'nav.w7': 'Assistant',
  'nav.w8': 'Filings',
  'nav.w9': 'Shape of the year',
  'nav.guide': 'Guide',
  'nav.ingestion': 'Data Upload',
  'nav.library': 'Rule Library',
  'nav.alignment': 'Circular Check',
  'nav.admin': 'Parameters & Thresholds',
  'nav.roadmap': 'Roadmap',

  'theme.toggle': 'Theme',
  'theme.light': 'Light',
  'theme.dark': 'Dark',
  'theme.system': 'System',
  'language.toggle': 'Language',
  'role.viewingAs': 'Signed in as',
  'role.switchTo': 'Switch to {name}',
  'role.canDo': 'What this person can do here',
  'role.demoNote':
    'Three demonstration officers. Every screen is open to all three; the actions differ, '
    + 'because the officer who drafts a notice may not be the one who approves it.',

  'phase.notBuilt': 'Not built yet',
  'phase.deliveredIn': 'Delivered in {phase}',
  'phase.noData':
    'This screen shows no data until the phase that builds it lands. Nothing here is illustrative.',

  'comingSoon.title': 'Coming soon',
  'comingSoon.capability': 'What it will do',
  'comingSoon.dependency': 'What it is waiting for',
  'comingSoon.roadmap': 'Roadmap reference',
  'comingSoon.unlocks': 'Risk flags it would switch on',
  'comingSoon.noData': 'No data is shown on this screen, and none is invented.',

  'status.good': 'Clear',
  'status.warning': 'Moderate',
  'status.serious': 'High',
  'status.critical': 'Severe',
  'status.unknown': 'Not evaluated',

  'notFound.title': 'Page not found',
  'notFound.body': 'That route does not exist.',
  'notFound.back': 'Back to your home screen',
} as const

export type StringKey = keyof typeof en

const mr: Record<StringKey, string> = {
  'app.name': 'जीएसटी इंटेलिजन्स',
  'app.tagline': 'वाणिज्य कर विभाग, महाराष्ट्र शासन',
  'app.skipToContent': 'मजकुराकडे जा',

  'surface.dashboard': 'डॅशबोर्ड',
  'surface.workbench': 'प्रकरण कामकाज',
  'surface.dashboard.for': 'संपूर्ण राज्याचा एका दृष्टिक्षेपात आढावा',
  'surface.workbench.for': 'एका वेळी एक व्यवसाय',

  'nav.shared': 'मांडणी व संदर्भ',
  'nav.d1': 'आढावा',
  'nav.d2': 'विवरणपत्र अनुपालन',
  'nav.d3': 'महसूल व दायित्व',
  'nav.d4': 'जोखीम स्थिती',
  'nav.d5': 'जोखीम मापदंड',
  'nav.d6': 'अंमलबजावणी प्रवाह',
  'nav.d7': 'कार्यक्षेत्रे',
  'nav.d8': 'अधिकारी',
  'nav.d9': 'क्षेत्रे',
  'nav.w1': 'माझी यादी',
  'nav.w2': 'लेखापरीक्षण नियोजन',
  'nav.w3': 'करदाता नोंदवही',
  'nav.w4': 'करदाता संचिका',
  'nav.w5': 'प्रकरणे',
  'nav.w6': 'नोटिसा',
  'nav.w7': 'सहायक',
  'nav.w8': 'विवरणपत्रे',
  'nav.w9': 'वर्षाचे स्वरूप',
  'nav.guide': 'मार्गदर्शक',
  'nav.ingestion': 'माहिती आयात',
  'nav.library': 'नियम संग्रह',
  'nav.alignment': 'परिपत्रक पडताळणी',
  'nav.admin': 'मापदंड व मर्यादा',
  'nav.roadmap': 'आराखडा',

  'theme.toggle': 'रंगसंगती',
  'theme.light': 'उजळ',
  'theme.dark': 'गडद',
  'theme.system': 'प्रणालीनुसार',
  'language.toggle': 'भाषा',
  'role.viewingAs': 'यांच्या नावाने',
  'role.switchTo': '{name} यांच्याकडे बदला',
  'role.canDo': 'हे अधिकारी येथे काय करू शकतात',
  'role.demoNote':
    'प्रात्यक्षिकासाठी तीन अधिकारी. सर्व पडदे तिघांनाही खुले आहेत; कृती मात्र वेगळ्या आहेत, '
    + 'कारण नोटिशीचा मसुदा करणारा अधिकारी तिला मंजुरी देणारा असू शकत नाही.',

  'phase.notBuilt': 'अद्याप तयार नाही',
  'phase.deliveredIn': '{phase} मध्ये उपलब्ध होईल',
  'phase.noData':
    'हा पडदा तयार होईपर्यंत कोणतीही माहिती दर्शविली जाणार नाही. येथे काहीही उदाहरणादाखल नाही.',

  'comingSoon.title': 'लवकरच',
  'comingSoon.capability': 'हे काय करेल',
  'comingSoon.dependency': 'कशाची प्रतीक्षा आहे',
  'comingSoon.roadmap': 'आराखडा संदर्भ',
  'comingSoon.unlocks': 'यामुळे सुरू होणाऱ्या जोखीम निशाण्या',
  'comingSoon.noData': 'या पडद्यावर कोणतीही माहिती दर्शविलेली नाही, आणि कोणतीही बनावट माहिती नाही.',

  'status.good': 'निर्दोष',
  'status.warning': 'मध्यम',
  'status.serious': 'उच्च',
  'status.critical': 'गंभीर',
  'status.unknown': 'मूल्यांकन झाले नाही',

  'notFound.title': 'पृष्ठ सापडले नाही',
  'notFound.body': 'असा मार्ग अस्तित्वात नाही.',
  'notFound.back': 'आपल्या मुख्य पडद्याकडे परत',
}

export const STRINGS: Record<Language, Record<StringKey, string>> = { en, mr }

export const LANGUAGE_LABEL: Record<Language, string> = {
  en: 'English',
  mr: 'मराठी',
}
