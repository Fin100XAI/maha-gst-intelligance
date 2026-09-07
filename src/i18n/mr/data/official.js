import { registerMessages } from '../../locale.js'

/**
 * Marathi — official.js: the published government figures, their sources, and
 * the sources named but not yet transcribed.
 *
 * These are the only real numbers in the platform, so the provenance line
 * beside each figure is the load-bearing part. The organisation names are
 * translated where the department itself publishes a Marathi form of the name,
 * and the source labels are translated so an officer can see what was read; the
 * figures, dates, growth rates and the HTTP status stay exactly as published.
 *
 * "Division-wise tax revenue for Maharashtra" keeps the state name: it is the
 * published dataset's own title, not a description this platform wrote.
 */
registerMessages('mr', {
  /* == Publishing bodies ================================================ */
  'Maharashtra Goods and Services Tax Department': 'महाराष्ट्र वस्तू व सेवा कर विभाग',
  'Maharashtra GST Department': 'महाराष्ट्र GST विभाग',
  'Press Information Bureau, Government of India': 'पत्र सूचना कार्यालय, भारत सरकार',
  'Goods and Services Tax Network': 'वस्तू व सेवा कर नेटवर्क',
  'Open Government Data (OGD) Platform India': 'खुले शासकीय डेटा (OGD) मंच भारत',
  Maharashtra: 'महाराष्ट्र',
  'All-India': 'अखिल भारतीय',

  /* == Source titles ==================================================== */
  'Statistics — Registered Dealers and Tax Revenue': 'सांख्यिकी — नोंदणीकृत व्यापारी व कर महसूल',
  'GST revenue collection press releases': 'GST महसूल वसुली प्रसिद्धिपत्रके',

  /* == The figures read ================================================= */
  'Registered SGST dealers in Maharashtra': 'महाराष्ट्रातील नोंदणीकृत SGST व्यापारी',
  'Position as at 1 April 2025': '१ एप्रिल २०२५ रोजीची स्थिती',
  'Total registered dealers, all Acts (SGST, VAT, CST, Profession Tax)':
    'सर्व अधिनियमांखालील एकूण नोंदणीकृत व्यापारी (SGST, VAT, CST, व्यवसाय कर)',
  'Maharashtra tax revenue (departmental series)': 'महाराष्ट्र कर महसूल (विभागीय मालिका)',
  '₹ crore': '₹ कोटी',
  'Series to 28 February 2025': '२८ फेब्रुवारी २०२५ पर्यंतची मालिका',
  'India gross GST collection, FY 2024-25': 'भारताची एकूण GST वसुली, आर्थिक वर्ष २०२४-२५',
  'Financial year 2024-25 · 9.4% year-on-year growth':
    'आर्थिक वर्ष २०२४-२५ · वार्षिक ९.४% वाढ',
  'India gross GST collection, April–December 2025':
    'भारताची एकूण GST वसुली, एप्रिल–डिसेंबर २०२५',
  'April to December 2025 · 6.7% year-on-year growth': 'एप्रिल ते डिसेंबर २०२५ · वार्षिक ६.७% वाढ',

  /* == Sources named but not transcribed ================================ */
  'State/UT-wise gross GST collection, 2020-21 to 2024-25':
    'राज्य/केंद्रशासित प्रदेशनिहाय एकूण GST वसुली, २०२०-२१ ते २०२४-२५',
  'Not read — source blocks automated retrieval (HTTP 403). Values must be pulled manually.':
    'वाचलेले नाही — स्रोत स्वयंचलित मागणी रोखतो (HTTP 403). मूल्ये हाताने घ्यावी लागतील.',
  'Annual GST collection by taxpayer segment (Large / Medium / Small / Micro), 2019-20 to 2024-25':
    'करदाता वर्गानुसार वार्षिक GST वसुली (मोठे / मध्यम / लहान / सूक्ष्म), २०१९-२० ते २०२४-२५',
  'Monthly GST collection data (GSTN portal publication)':
    'मासिक GST वसुली माहिती (GSTN संकेतस्थळावरील प्रकाशन)',
  'Monthly PDF series. GST collections are now published on the GST portal rather than by press release.':
    'मासिक PDF मालिका. GST वसुलीचे आकडे आता प्रसिद्धिपत्रकाऐवजी GST संकेतस्थळावर प्रसिद्ध होतात.',
  'Division-wise tax revenue for Maharashtra (Mumbai, Pune, Nagpur and others)':
    'महाराष्ट्रासाठी विभागनिहाय कर महसूल (मुंबई, पुणे, नागपूर व इतर)',
  'Published on the source page as a series from 2005-06 to May 2024. Not yet transcribed into this file.':
    'स्रोत पानावर २००५-०६ ते मे २०२४ अशी मालिका म्हणून प्रसिद्ध. अद्याप या फाइलमध्ये उतरवलेली नाही.'
})
