import { registerMessages } from '../../locale.js'

/**
 * Hindi — Statutory Time Intelligence.
 *
 * Statutory vocabulary is fixed here and reused everywhere else:
 *   limitation      → परिसीमा
 *   time-barred     → कालातीत
 *   binding         → बाध्यकारी
 *   proceeding      → कार्यवाही
 *   demand          → माँग
 *   notice          → सूचना
 *   order           → आदेश
 *   ultra vires     → अधिकारातीत
 *   extinguished    → विलुप्त
 *
 * Section numbers, notification numbers, form codes and GST abbreviations stay
 * in Latin script — they are legal identifiers, and translating them would
 * make an officer's citation unverifiable against the Act.
 */
registerMessages('hi', {
  'Leadership · Statutory Risk': 'नेतृत्व · सांविधिक जोखिम',
  'Every open proceeding against its own limitation clock. When a deadline passes the demand is extinguished by operation of law — this is the one exposure on the platform that is not a model but a consequence of statute.':
    'प्रत्येक लंबित कार्यवाही, उसकी अपनी परिसीमा अवधि के सापेक्ष। समय-सीमा बीत जाने पर माँग विधि के प्रवर्तन से विलुप्त हो जाती है — यह इस मंच का एकमात्र ऐसा जोखिम है जो किसी मॉडल का नहीं, बल्कि संविधि का परिणाम है।',

  'Why this leads': 'यह सबसे पहले क्यों',
  'A risk score can be argued with. A limitation date cannot.':
    'जोखिम अंक पर बहस की जा सकती है। परिसीमा तिथि पर नहीं।',
  'Revenue lost to limitation is irreversible, unarguable, and attributable to a named officer and date. Of the proceedings in view, ₹{0} Cr has already passed its deadline and ₹{1} Cr expires within thirty days.':
    'परिसीमा के कारण गया राजस्व अपरिवर्तनीय और निर्विवाद होता है, और किसी नामित अधिकारी तथा तिथि से जुड़ा होता है। दृश्यमान कार्यवाहियों में से ₹{0} करोड़ की समय-सीमा पहले ही बीत चुकी है और ₹{1} करोड़ तीस दिनों के भीतर समाप्त हो रही है।',

  'Already time-barred': 'पहले से कालातीत',
  'Expiring within 30 days': '30 दिनों में समाप्त',
  'Expiring within 90 days': '90 दिनों में समाप्त',
  'Live exposure in time': 'समय-सीमा के भीतर जीवित जोखिम राशि',
  '₹ Cr': '₹ करोड़',

  '{0} proceeding(s) rest on a contested extension.': '{0} कार्यवाही एक विवादित विस्तार पर आधारित है।',
  'Their deadline depends on Notification 56/2023-CT, which the Gauhati High Court has held ultra vires Section 168A. A demand relying on it carries live litigation risk and should be reviewed with the Legal Cell before action.':
    'इनकी समय-सीमा अधिसूचना 56/2023-CT पर निर्भर है, जिसे गुवाहाटी उच्च न्यायालय ने धारा 168A के अधिकारातीत ठहराया है। इस पर आधारित माँग में जीवित वाद-जोखिम है और कार्रवाई से पूर्व विधि कक्ष के साथ इसकी समीक्षा की जानी चाहिए।',

  'Limitation register': 'परिसीमा पंजी',
  'Ranked by how soon the binding deadline falls. Where no notice has issued the notice deadline binds — it falls months before the order deadline and is the one most often missed.':
    'बाध्यकारी समय-सीमा कितनी शीघ्र आती है, उसके क्रम में। जहाँ कोई सूचना जारी नहीं हुई है वहाँ सूचना की समय-सीमा बाध्यकारी है — यह आदेश की समय-सीमा से कई माह पहले आती है और प्रायः यही चूकती है।',
  'Search the register...': 'पंजी में खोजें...',
  'Computed from statute — verify against the case record before acting':
    'संविधि से परिकलित — कार्रवाई से पूर्व प्रकरण अभिलेख से सत्यापित करें',

  'Formation exposure': 'संरचना-वार जोखिम राशि',
  'Which divisions carry the nearest deadlines': 'किन विभागों की समय-सीमाएँ सबसे निकट हैं',
  '{0} proceedings · ₹{1} Cr exposed': '{0} कार्यवाहियाँ · ₹{1} करोड़ जोखिम में',
  '{0} critical': '{0} अति गंभीर',
  Nearest: 'निकटतम',

  'Statutory basis': 'सांविधिक आधार',
  'The rules this register computes from': 'यह पंजी जिन नियमों से परिकलित होती है',
  Contested: 'विवादित',
  'Basis for this deadline': 'इस समय-सीमा का आधार',
  'Tax period': 'कर अवधि',
  'Tax period / Section': 'कर अवधि / धारा',
  'Section invoked': 'लागू धारा',
  'Annual return due': 'वार्षिक विवरणी देय',
  'Notice deadline': 'सूचना समय-सीमा',
  'Order deadline': 'आदेश समय-सीमा',
  'Binding deadline': 'बाध्यकारी समय-सीमा',
  'Currently binding': 'वर्तमान में बाध्यकारी',
  'How this date is computed': 'यह तिथि कैसे परिकलित होती है',
  Authority: 'प्राधिकार',
  'This deadline depends on a notification held ultra vires by the Gauhati High Court. Review with the Legal Cell before relying on it.':
    'यह समय-सीमा एक ऐसी अधिसूचना पर निर्भर है जिसे गुवाहाटी उच्च न्यायालय ने अधिकारातीत ठहराया है। इस पर निर्भर होने से पूर्व विधि कक्ष के साथ समीक्षा करें।',

  deadline: 'समय-सीमा',
  'Time left': 'शेष समय',
  Expired: 'समाप्त',
  'Revenue exposed': 'जोखिम में राजस्व',
  'Responsible officer': 'उत्तरदायी अधिकारी',
  Formation: 'संरचना',
  Basis: 'आधार',
  Check: 'जाँच',
  'Lead Signal': 'प्रमुख संकेत'
})
