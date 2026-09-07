import { registerMessages } from '../../locale.js'

/**
 * Hindi — official.js: the published government figures, their sources, and the
 * sources named but not yet transcribed.
 *
 * These are the only real numbers in the platform, so the provenance line
 * beside each figure is the load-bearing part. Organisation names take the
 * Hindi form these bodies themselves publish under, and the source labels are
 * translated so an officer can see what was read; the figures, dates, growth
 * rates and the HTTP status stay exactly as published.
 *
 * "Division-wise tax revenue for Maharashtra" keeps the state name: it is the
 * published dataset's own title, not a description this platform wrote.
 */
registerMessages('hi', {
  /* == Publishing bodies ================================================ */
  'Maharashtra Goods and Services Tax Department': 'महाराष्ट्र वस्तु एवं सेवा कर विभाग',
  'Maharashtra GST Department': 'महाराष्ट्र GST विभाग',
  'Press Information Bureau, Government of India': 'पत्र सूचना कार्यालय, भारत सरकार',
  'Goods and Services Tax Network': 'वस्तु एवं सेवा कर नेटवर्क',
  'Open Government Data (OGD) Platform India': 'मुक्त शासकीय आँकड़ा (OGD) मंच भारत',
  Maharashtra: 'महाराष्ट्र',
  'All-India': 'अखिल भारतीय',

  /* == Source titles ==================================================== */
  'Statistics — Registered Dealers and Tax Revenue':
    'सांख्यिकी — पंजीकृत व्यापारी एवं कर राजस्व',
  'GST revenue collection press releases': 'GST राजस्व वसूली संबंधी विज्ञप्तियाँ',

  /* == The figures read ================================================= */
  'Registered SGST dealers in Maharashtra': 'महाराष्ट्र में पंजीकृत SGST व्यापारी',
  'Position as at 1 April 2025': '1 अप्रैल 2025 तक की स्थिति',
  'Total registered dealers, all Acts (SGST, VAT, CST, Profession Tax)':
    'सभी अधिनियमों के अंतर्गत कुल पंजीकृत व्यापारी (SGST, VAT, CST, व्यवसाय कर)',
  'Maharashtra tax revenue (departmental series)': 'महाराष्ट्र कर राजस्व (विभागीय शृंखला)',
  '₹ crore': '₹ करोड़',
  'Series to 28 February 2025': '28 फरवरी 2025 तक की शृंखला',
  'India gross GST collection, FY 2024-25': 'भारत की सकल GST वसूली, वित्तीय वर्ष 2024-25',
  'Financial year 2024-25 · 9.4% year-on-year growth':
    'वित्तीय वर्ष 2024-25 · वार्षिक 9.4% वृद्धि',
  'India gross GST collection, April–December 2025':
    'भारत की सकल GST वसूली, अप्रैल–दिसंबर 2025',
  'April to December 2025 · 6.7% year-on-year growth': 'अप्रैल से दिसंबर 2025 · वार्षिक 6.7% वृद्धि',

  /* == Sources named but not transcribed ================================ */
  'State/UT-wise gross GST collection, 2020-21 to 2024-25':
    'राज्य/संघ राज्यक्षेत्रवार सकल GST वसूली, 2020-21 से 2024-25',
  'Not read — source blocks automated retrieval (HTTP 403). Values must be pulled manually.':
    'नहीं पढ़ा गया — स्रोत स्वचालित प्राप्ति रोकता है (HTTP 403)। मान हाथ से लेने होंगे।',
  'Annual GST collection by taxpayer segment (Large / Medium / Small / Micro), 2019-20 to 2024-25':
    'करदाता वर्ग के अनुसार वार्षिक GST वसूली (वृहत् / मध्यम / लघु / सूक्ष्म), 2019-20 से 2024-25',
  'Monthly GST collection data (GSTN portal publication)':
    'मासिक GST वसूली आँकड़े (GSTN पोर्टल पर प्रकाशन)',
  'Monthly PDF series. GST collections are now published on the GST portal rather than by press release.':
    'मासिक PDF शृंखला। GST वसूली के आँकड़े अब विज्ञप्ति के बजाय GST पोर्टल पर प्रकाशित होते हैं।',
  'Division-wise tax revenue for Maharashtra (Mumbai, Pune, Nagpur and others)':
    'महाराष्ट्र हेतु विभागवार कर राजस्व (मुंबई, पुणे, नागपुर एवं अन्य)',
  'Published on the source page as a series from 2005-06 to May 2024. Not yet transcribed into this file.':
    'स्रोत पृष्ठ पर 2005-06 से मई 2024 तक की शृंखला के रूप में प्रकाशित। अभी तक इस फाइल में नहीं उतारा गया।'
})
