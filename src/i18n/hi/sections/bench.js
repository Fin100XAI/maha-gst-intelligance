import { registerMessages } from '../../locale.js'

/**
 * Hindi — District & Division Performance and Sector Intelligence.
 *
 *   benchmark            → मानक
 *   peer / peer group    → समकक्ष / समकक्ष समूह
 *   peer median          → समकक्ष मध्यक
 *   modified z           → संशोधित z
 *   outlier              → असामान्य मान
 *   deviation            → विचलन
 *   shading / band       → छाया / पट्टी
 *   concentration        → संकेंद्रण
 *   pooled               → संचित
 *   denominator          → हर
 *   observed             → प्रेक्षित
 *
 * “Sector” is क्षेत्र, “division” संभाग, “district” ज़िला — kept distinct on
 * every screen because all three appear in the same sentence here.
 */
registerMessages('hi', {
  /* == District & Division — briefing note ============================== */
  'District & Division Performance — benchmarking summary':
    'ज़िला एवं संभाग प्रदर्शन — मानकीकरण सारांश',
  'Cuts: mild deficit at {0}%, high at {1}%, severe at {2}% against target.':
    'सीमाएँ: लक्ष्य के सापेक्ष हल्का घाटा {0}%, अधिक {1}%, गंभीर {2}%।',
  'Cuts at the 40th / 70th / 90th percentile of all {0} districts: {1}, {2}, {3}.':
    'सभी {0} ज़िलों के 40वें / 70वें / 90वें प्रतिशतक पर सीमाएँ: {1}, {2}, {3}।',
  '{0} of {1} districts in scope are below their collection target; the median district sits at {2}% against target.':
    'दायरे के {1} में से {0} ज़िले अपने वसूली लक्ष्य से नीचे हैं; मध्यक ज़िला लक्ष्य के {2}% पर है।',
  'Combined shortfall is ₹{0} Cr, {1}% of the ₹{2} Cr combined target.':
    'संयुक्त कमी ₹{0} करोड़ है, यानी ₹{2} करोड़ संयुक्त लक्ष्य का {1}%।',
  'No district in scope is below target, so there is no shortfall for audit recovery to cover.':
    'दायरे का कोई ज़िला लक्ष्य से नीचे नहीं है, इसलिए लेखापरीक्षा वसूली से पूरी करने योग्य कोई कमी नहीं है।',
  'Audit recovery of ₹{0} Cr covers {1}% of that shortfall.':
    '₹{0} करोड़ की लेखापरीक्षा वसूली उस कमी का {1}% पूरा करती है।',
  '{0} of {1} divisions carry a proceeding within 30 days of its binding statutory deadline, against ₹{2} Cr of exposure.':
    '{1} में से {0} संभागों में ऐसी कार्यवाही है जो अपनी बाध्यकारी सांविधिक समय-सीमा के 30 दिनों के भीतर है, और उस पर ₹{2} करोड़ की जोखिम राशि है।',
  'No division in scope carries a proceeding within 30 days of its binding statutory deadline.':
    'दायरे के किसी संभाग में अपनी बाध्यकारी सांविधिक समय-सीमा के 30 दिनों के भीतर कोई कार्यवाही नहीं है।',
  '{0} district(s) deviate beyond the peer threshold on at least one measure.':
    '{0} ज़िले कम-से-कम एक माप पर समकक्ष सीमा से परे विचलित होते हैं।',
  'No district in scope deviates beyond the peer outlier threshold on any measure.':
    'दायरे का कोई ज़िला किसी भी माप पर समकक्ष असामान्य-मान सीमा से परे विचलित नहीं होता।',
  'Severity shading and every peer median are computed on all {0} districts, unfiltered.':
    'गंभीरता की छाया और प्रत्येक समकक्ष मध्यक सभी {0} ज़िलों पर, बिना फ़िल्टर के परिकलित हैं।',

  /* == District & Division — headline cards ============================= */
  'Every district and division measured against its target, its peers and its statutory clock — collection, compliance, enforcement and the capacity available to act.':
    'प्रत्येक ज़िला और संभाग अपने लक्ष्य, अपने समकक्षों और अपनी सांविधिक घड़ी के सापेक्ष मापा गया — वसूली, अनुपालन, प्रवर्तन और कार्रवाई हेतु उपलब्ध क्षमता।',
  'Districts Below Target': 'लक्ष्य से नीचे के ज़िले',
  'median district gap to target': 'लक्ष्य से मध्यक ज़िले की दूरी',
  'Collection Shortfall': 'वसूली में कमी',
  '{0}% of ₹{1} Cr target': '₹{1} करोड़ लक्ष्य का {0}%',
  'Audit Recovery Against Shortfall': 'कमी के सापेक्ष लेखापरीक्षा वसूली',
  'No shortfall': 'कोई कमी नहीं',
  '₹{0} Cr recovered': '₹{0} करोड़ वसूल',
  'Divisions Inside 30-Day Limitation': '30 दिन की परिसीमा के भीतर संभाग',
  'of {0} · ₹{1} Cr exposure': '{0} में से · ₹{1} करोड़ जोखिम राशि',
  'no register coverage in scope': 'दायरे में पंजी का विस्तार नहीं',

  /* == District & Division — what the shading is ======================== */
  'What this shading is, and what it is not': 'यह छाया क्या है, और क्या नहीं',
  'A band is a cut on a district-level figure — a governance signal about a place. It is not a risk rating of any taxpayer inside that place: taxpayer risk is scored individually by the risk engine from the rules that actually fired, and a taxpayer in a red district is not thereby high-risk.':
    'पट्टी ज़िला-स्तरीय आँकड़े पर लगाई गई सीमा है — किसी स्थान के बारे में प्रशासनिक संकेत। वह उस स्थान के किसी करदाता का जोखिम मानांकन नहीं है: करदाता का जोखिम, वास्तव में लागू हुए नियमों से जोखिम यंत्र अलग-अलग आँकता है, और लाल ज़िले का करदाता केवल इस कारण उच्च जोखिम वाला नहीं हो जाता।',
  'Shading and every peer median on this page are computed on all {0} districts, unfiltered. Sector, risk-level and search filters narrow the per-district risk-taxpayer count on the cards below, but never the shading or the benchmark — an incidental filter must not silently recolour a governance map or move the line a district is being measured against.':
    'इस पृष्ठ की छाया और प्रत्येक समकक्ष मध्यक सभी {0} ज़िलों पर, बिना फ़िल्टर के परिकलित हैं। क्षेत्र, जोखिम-स्तर और खोज फ़िल्टर नीचे के कार्डों पर ज़िलावार जोखिम-करदाता संख्या को सीमित करते हैं, पर छाया या मानक को कभी नहीं — किसी आनुषंगिक फ़िल्टर से न तो प्रशासनिक मानचित्र चुपचाप रंग बदले, न वह रेखा हिले जिसके सापेक्ष ज़िला मापा जा रहा है।',
  'Narrowing filter active — card risk counts are scoped, shading and medians are not':
    'सीमित करने वाला फ़िल्टर सक्रिय — कार्डों की जोखिम संख्याएँ दायरे के अनुसार हैं, छाया और मध्यक नहीं',

  /* == District & Division — peer deviation ============================= */
  'Peer-Relative Deviation': 'समकक्षों के सापेक्ष विचलन',
  'Each district against the median of all {0} districts, scaled by median absolute deviation':
    'प्रत्येक ज़िला सभी {0} ज़िलों के मध्यक के सापेक्ष, मध्यक निरपेक्ष विचलन से मापित',
  'peer median': 'समकक्ष मध्यक',
  'peer median {0}': 'समकक्ष मध्यक {0}',
  'peer median {0}%': 'समकक्ष मध्यक {0}%',
  'peer median ₹{0} Cr': 'समकक्ष मध्यक ₹{0} करोड़',
  'peer median {0} days': 'समकक्ष मध्यक {0} दिन',
  'Peer outlier: {0}': 'समकक्षों में असामान्य: {0}',
  'Peer median gap {0}% · shortfall {1}': 'समकक्ष मध्यक से अंतर {0}% · कमी {1}',
  '{0}: {1} vs {2} median': '{0}: {1} बनाम {2} मध्यक',
  'No district in scope deviates beyond a modified z of {0} on any measure. That is the expected result on a peer group of {1}: the threshold is the conventional outlier cut, and on twelve districts an ordinary spread will not reach it. It is reported rather than lowered — a threshold moved until it produces results reports ordinary variation as an outlier. Read the medians above as the comparator instead.':
    'दायरे का कोई ज़िला किसी भी माप पर {0} के संशोधित z से परे विचलित नहीं होता। {1} के समकक्ष समूह पर यही अपेक्षित परिणाम है: यह सीमा प्रचलित असामान्य-मान कट है, और बारह ज़िलों पर सामान्य बिखराव उस तक नहीं पहुँचता। सीमा घटाने के बजाय इसे वैसा ही बताया गया है — परिणाम मिलने तक खिसकाई गई सीमा सामान्य उतार-चढ़ाव को ही असामान्य बताकर दर्ज करती है। उसके स्थान पर ऊपर के मध्यकों को ही तुलनाधार मानकर पढ़ें।',
  'Method: median and median absolute deviation, cut at a modified z of {0} — the platform-wide peer method owned by the discovery engine, applied here across districts rather than across a taxpayer’s sector. Mean and standard deviation are not used because a single extreme district would inflate the spread until it stopped registering as extreme. The peer group is {1} districts, above the {2}-district minimum the method requires before a norm is worth computing. Only the adverse tail is reported: a district unusually better than its peers is not a finding.':
    'पद्धति: मध्यक एवं मध्यक निरपेक्ष विचलन, {0} के संशोधित z पर सीमा — यह खोज यंत्र के अधीन, पूरे मंच पर प्रयुक्त समकक्ष पद्धति है, जिसे यहाँ करदाता के क्षेत्र के बजाय ज़िलों पर लगाया गया है। माध्य और मानक विचलन का प्रयोग नहीं किया गया, क्योंकि एक ही चरम ज़िला बिखराव को इतना फुला देता कि वह स्वयं चरम दिखना बंद कर देता। समकक्ष समूह {1} ज़िलों का है, जो किसी मानक को परिकलन-योग्य मानने से पहले पद्धति द्वारा अपेक्षित न्यूनतम {2} ज़िलों से अधिक है। केवल प्रतिकूल छोर बताया जाता है: अपने समकक्षों से असामान्य रूप से बेहतर ज़िला निष्कर्ष नहीं है।',

  /* == District & Division — table ====================================== */
  'Recovery vs Shortfall': 'वसूली बनाम कमी',
  'Recovery Covers': 'वसूली पूरा करती है',
  'recovery covers {0}%': 'वसूली {0}% पूरा करती है',
  Shortfall: 'कमी',
  'Shortfall (Cr)': 'कमी (करोड़)',
  'at or above target': 'लक्ष्य पर अथवा उससे ऊपर',
  'Division Deadline': 'संभाग की समय-सीमा',
  '{0} within 30 days': '30 दिनों में {0}',
  'not in register': 'पंजी में नहीं',
  'current filter scope': 'वर्तमान फ़िल्टर दायरा',
  none: 'एक भी नहीं',
  'n/a': 'लागू नहीं',
  'Division Collection Ranking': 'संभागवार वसूली क्रम',
  'Target, actual and the share of each shortfall that enforcement recovered':
    'लक्ष्य, वास्तविक वसूली, और प्रत्येक कमी में प्रवर्तन द्वारा वसूला गया अंश',
  'vs Division Median': 'संभागीय मध्यक के सापेक्ष',
  'No divisions match the current global filters.':
    'वर्तमान वैश्विक फ़िल्टर से कोई संभाग मेल नहीं खाता।',
  '{0} divisions covering {1} districts across Maharashtra. "Recovery covers" is audit recovery as a share of that division’s own collection shortfall — a division above target has no shortfall to cover and is shown as n/a rather than as a perfect score. The risk-taxpayer column follows the current filter scope; every other column does not.':
    'महाराष्ट्र के {1} ज़िलों को समेटते {0} संभाग। "वसूली पूरा करती है" का अर्थ उस संभाग की अपनी वसूली-कमी के सापेक्ष लेखापरीक्षा वसूली का अंश है — लक्ष्य से ऊपर के संभाग के पास पूरी करने योग्य कोई कमी ही नहीं होती, इसलिए वहाँ पूर्ण अंक के बजाय "लागू नहीं" दिखाया गया है। जोखिम-करदाता स्तंभ वर्तमान फ़िल्टर दायरे का अनुसरण करता है; शेष कोई स्तंभ नहीं।',

  /* == District & Division — non-filer denominator ====================== */
  'Non-Filer Compliance Rate': 'विवरणी न भरने वालों का अनुपालन दर',
  'A parameter this platform cannot currently answer':
    'एक ऐसा मानक जिसका उत्तर यह मंच अभी नहीं दे सकता',
  '{0} non-filers are counted across the districts in scope, but a non-filer count without its denominator is not a compliance rate and is not comparable between a metropolitan district and a rural one.':
    'दायरे के ज़िलों में मिलाकर {0} विवरणी न भरने वाले गिने गए हैं, पर हर के बिना यह संख्या अनुपालन दर नहीं है, और महानगरीय ज़िले तथा ग्रामीण ज़िले के बीच तुलनीय भी नहीं है।',
  'The denominator needed is the count of ACTIVE registrations per district from the registration register, which this platform does not hold. The {0} taxpayers in the demonstration extract are a sample, not the register, and dividing by them would produce a rate that looks precise and is wrong by orders of magnitude.':
    'आवश्यक हर है पंजीयन पंजी से ज़िलावार सक्रिय पंजीयनों की संख्या, जो इस मंच के पास नहीं है। प्रदर्शन एक्सट्रैक्ट के {0} करदाता एक नमूना हैं, पंजी नहीं; उनसे भाग देने पर मिलने वाला दर सटीक दिखेगा और कई गुना गलत होगा।',
  'Feed required: active GST registrations per district, as at the reference date. Until it is connected, non-filers are shown as a raw count against the peer median only.':
    'आवश्यक स्रोत: संदर्भ तिथि पर ज़िलावार सक्रिय GST पंजीयन। उसके जुड़ने तक विवरणी न भरने वाले केवल समकक्ष मध्यक के सापेक्ष कच्ची संख्या के रूप में दिखाए गए हैं।',

  /* == District & Division — deadlines and capacity ===================== */
  'Division Deadlines & Capacity to Act': 'संभागवार समय-सीमाएँ एवं कार्रवाई की क्षमता',
  'What is about to expire in each division, and what one more officer-week there would actually buy':
    'प्रत्येक संभाग में क्या समाप्त होने को है, और वहाँ एक और अधिकारी-सप्ताह वास्तव में क्या दिला पाएगा',
  'Deadlines are the binding statutory dates from the limitation engine — the notice date where no notice has issued, which falls months before the order date and is the one most often missed. A division with no open proceeding in the register is shown as such, not as zero risk.':
    'समय-सीमाएँ परिसीमा यंत्र की बाध्यकारी सांविधिक तिथियाँ हैं — जहाँ नोटिस जारी नहीं हुआ वहाँ नोटिस की तिथि, जो आदेश तिथि से कई माह पहले आती है और सबसे अधिक बार यही चूकती है। पंजी में कोई लंबित कार्यवाही न रखने वाला संभाग वैसा ही दिखाया गया है — शून्य जोखिम के रूप में नहीं।',
  'Demand / supply is the single worst-subscribed officer pool in that division, taken from the capacity engine rather than averaged across the division. The engine states the reason: {0}':
    'माँग / आपूर्ति का अर्थ उस संभाग का सर्वाधिक भार वाला एकल अधिकारी समूह है, जो संभाग भर का औसत निकालने के बजाय क्षमता यंत्र से लिया गया है। यंत्र कारण बताता है: {0}',
  'Statutory clock in {0}': '{0} में सांविधिक घड़ी',
  'This division carries no open proceeding in the limitation register.':
    'इस संभाग की परिसीमा पंजी में कोई लंबित कार्यवाही नहीं है।',
  '{0} open proceedings carrying ₹{1} Cr. Nearest binding deadline in {2} days; {3} within 30 days.':
    '₹{1} करोड़ वहन करती {0} लंबित कार्यवाहियाँ। निकटतम बाध्यकारी समय-सीमा {2} दिनों में; {3} 30 दिनों में।',
  'Capacity in {0}': '{0} में क्षमता',
  'No field officer pool is modelled for this division.':
    'इस संभाग हेतु कोई क्षेत्रीय अधिकारी समूह प्रारूप में नहीं लिया गया।',
  'Worst-subscribed pool: {0}, demanding {1}x the {2} officers available. One more officer-week there would reach {3} further case(s), worth ₹{4} L.':
    'सर्वाधिक भार वाला समूह: {0}, उपलब्ध {2} अधिकारियों की {1} गुना माँग। वहाँ एक और अधिकारी-सप्ताह देने पर ₹{4} लाख मूल्य के {3} और प्रकरणों तक पहुँचा जा सकेगा।',
  '{0} officers · {1} cases assigned · {2} closed month to date':
    '{0} अधिकारी · {1} प्रकरण सौंपे गए · माह में अब तक {2} निपटे',
  'No open proceeding': 'कोई लंबित कार्यवाही नहीं',
  'No field pool': 'कोई क्षेत्रीय समूह नहीं',
  'Nothing reachable': 'कुछ भी पहुँच में नहीं',
  '{0}x': '{0} गुना',
  '{0} · {1} officers': '{0} · {1} अधिकारी',
  '{0} case(s)': '{0} प्रकरण',
  'Ranked by each taxpayer’s own rule-based risk score. District shading played no part in these ratings.':
    'प्रत्येक करदाता के अपने नियम-आधारित जोखिम अंक के अनुसार क्रम। इन मानांकनों में ज़िले की छाया का कोई योगदान नहीं है।',

  /* == Sector Intelligence — briefing note ============================== */
  'Sector Intelligence — cross-sector benchmarking summary':
    'क्षेत्र इंटेलिजेंस — अंतर-क्षेत्रीय मानकीकरण सारांश',
  '{0} of {1} sectors with observations sit below their own tax-to-turnover benchmark.':
    'प्रेक्षण रखने वाले {1} में से {0} क्षेत्र अपने ही कर-से-कारोबार मानक से नीचे हैं।',
  'Widest observed gap to an own benchmark: {0}, ITC at {1}% of turnover against a {2}% benchmark ({3}%).':
    'अपने मानक से सबसे बड़ा प्रेक्षित अंतर: {0}, कारोबार का {1}% ITC, जबकि मानक {2}% ({3}%)।',
  'No sector in scope has enough observations to compare against its ITC benchmark.':
    'दायरे के किसी क्षेत्र के पास अपने ITC मानक से तुलना करने भर प्रेक्षण नहीं हैं।',
  'Highest risk concentration: {0} holds {1}% of taxpayers in scope and {2}% of the High/Critical ratings, {3}x its population share.':
    'सर्वोच्च जोखिम संकेंद्रण: {0} के पास दायरे के {1}% करदाता और उच्च/गंभीर मानांकनों का {2}% है, यानी उसके संख्या-अंश का {3} गुना।',
  'No sector in scope meets the minimum group size for a risk-concentration figure.':
    'जोखिम-संकेंद्रण का आँकड़ा देने हेतु आवश्यक न्यूनतम समूह आकार दायरे का कोई क्षेत्र पूरा नहीं करता।',
  'Selected sector {0}: {1} taxpayers, {2}% of pooled tax paid, filing compliance {3}% against a cross-sector median of {4}%.':
    'चयनित क्षेत्र {0}: {1} करदाता, संचित भुगतान किए गए कर का {2}%, विवरणी अनुपालन {3}% जबकि अंतर-क्षेत्रीय मध्यक {4}%।',
  'Sector is a descriptive dimension carrying {0}% weight in the comparability engine. Nothing on this page is evidence about an individual taxpayer.':
    'क्षेत्र एक वर्णनात्मक आयाम है जिसका तुलनीयता यंत्र में भार {0}% है। इस पृष्ठ का कुछ भी किसी एकल करदाता के बारे में प्रमाण नहीं है।',

  /* == Sector Intelligence — headline cards ============================= */
  'Each sector measured against its own benchmark, its share of the population and its statutory clock — what behaviour actually looks like inside a sector, not what the reference table says it should.':
    'प्रत्येक क्षेत्र अपने मानक, संख्या में अपने अंश और अपनी सांविधिक घड़ी के सापेक्ष मापा गया — क्षेत्र के भीतर व्यवहार वास्तव में कैसा दिखता है, न कि संदर्भ तालिका उसे कैसा होना चाहिए बताती है।',
  'Sectors Below Own Tax Benchmark': 'अपने कर मानक से नीचे के क्षेत्र',
  'of {0} with observations': 'प्रेक्षण रखने वाले {0} में से',
  'Widest Gap to Own ITC Benchmark': 'अपने ITC मानक से सबसे बड़ा अंतर',
  'None observed': 'कोई प्रेक्षित नहीं',
  'no observations': 'कोई प्रेक्षण नहीं',
  'observed {0}% vs benchmark {1}%': 'प्रेक्षित {0}% बनाम मानक {1}%',
  'no sector has observations in scope': 'दायरे में किसी क्षेत्र के प्रेक्षण नहीं',
  'Highest Risk Concentration': 'सर्वोच्च जोखिम संकेंद्रण',
  '{0}x its share of the population': 'उसके संख्या-अंश का {0} गुना',
  '{0}x its population share': 'उसके संख्या-अंश का {0} गुना',
  '{0}x share': '{0} गुना अंश',
  'no sector meets the minimum group size': 'न्यूनतम समूह आकार कोई क्षेत्र पूरा नहीं करता',
  'below peer-norm size': 'समकक्ष-मानक आकार से कम',
  'Largest Revenue Share': 'सबसे बड़ा राजस्व अंश',
  '{0}% of ₹{1}L pooled tax paid': 'संचित भुगतान किए गए ₹{1} लाख कर का {0}%',
  '{0}% of pooled tax paid': 'संचित भुगतान किए गए कर का {0}%',
  '{0}% of pool': 'संचित संग्रह का {0}%',
  'no taxpayers in scope': 'दायरे में कोई करदाता नहीं',
  '{0}% vs {1}%': '{0}% बनाम {1}%',
  'median {0}%': 'मध्यक {0}%',
  '{0} of {1} flagged': '{1} में से {0} चिह्नित',
  'all past deadline': 'सभी समय-सीमा पार',
  '{0} cases · ₹{1} Cr': '{0} प्रकरण · ₹{1} करोड़',

  /* == Sector Intelligence — what it can and cannot support ============= */
  'What a sector comparison can and cannot support':
    'क्षेत्रीय तुलना किसका आधार बन सकती है और किसका नहीं',
  'Sector is a descriptive attribute. The comparability engine weights it at {0}% — the lowest weight of any dimension it carries — because it is the dimension that looks most relevant and predicts outcomes least. Everything on this page is therefore a statement about a POPULATION: where a sector as a whole sits against its own benchmark, and where the department should look first.':
    'क्षेत्र एक वर्णनात्मक गुण है। तुलनीयता यंत्र उसे {0}% भार देता है — उसके किसी भी आयाम में सबसे कम — क्योंकि यही वह आयाम है जो सर्वाधिक प्रासंगिक दिखता है और परिणामों का पूर्वानुमान सबसे कम देता है। इसलिए इस पृष्ठ का सब कुछ एक समूह के बारे में कथन है: पूरा क्षेत्र अपने ही मानक के सापेक्ष कहाँ खड़ा है, और विभाग को पहले कहाँ देखना चाहिए।',
  'It is never evidence about an individual taxpayer. A taxpayer does not become suspect by belonging to a deviating sector, and no notice, scrutiny selection or adverse inference may rest on sector membership. Individual risk is scored separately, per taxpayer, from the rules that actually fired against that taxpayer.':
    'वह कभी किसी एकल करदाता के बारे में प्रमाण नहीं होता। विचलित क्षेत्र में होने से करदाता संदिग्ध नहीं हो जाता, और कोई नोटिस, छानबीन हेतु चयन अथवा प्रतिकूल अनुमान क्षेत्र-सदस्यता पर आधारित नहीं हो सकता। व्यक्तिगत जोखिम प्रत्येक करदाता के लिए अलग से, उसी के विरुद्ध वास्तव में लागू हुए नियमों से आँका जाता है।',
  'Sector is also taken from the registration record. A misclassified taxpayer is measured against the wrong peers and will appear anomalous for that reason alone.':
    'क्षेत्र भी पंजीयन अभिलेख से ही लिया जाता है। गलत वर्गीकृत करदाता गलत समकक्षों के सापेक्ष मापा जाता है और केवल इसी कारण असंगत दिखेगा।',

  /* == Sector Intelligence — charts and benchmarks ====================== */
  'Tax paid by the {0} taxpayers in scope, ₹{1}L pooled — bar height is absolute, the share of the pool is in the tooltip':
    'दायरे के {0} करदाताओं द्वारा भुगतान किया गया कर, संचित ₹{1} लाख — स्तंभ की ऊँचाई निरपेक्ष है, संचित संग्रह में अंश टूलटिप में है',
  '₹{0}L · {1}% of pooled tax paid': '₹{0} लाख · संचित भुगतान किए गए कर का {1}%',
  'Observed Behaviour Against the Department Benchmark':
    'विभागीय मानक के सापेक्ष प्रेक्षित व्यवहार',
  'Median observed ratio in each sector against the reference benchmark set for that sector — the benchmark alone says nothing until something is measured against it':
    'प्रत्येक क्षेत्र का मध्यक प्रेक्षित अनुपात, उस क्षेत्र हेतु नियत संदर्भ मानक के सापेक्ष — जब तक मानक के सापेक्ष कुछ मापा न जाए, अकेला मानक कुछ नहीं कहता',
  'Observed median (%)': 'प्रेक्षित मध्यक (%)',
  'Department benchmark (%)': 'विभागीय मानक (%)',
  'Observed is the MEDIAN taxpayer in the sector, not the mean: a mean would be dragged by the same outliers the department is looking for. A sector with no bar has no taxpayers in the current filter scope, which is not the same as a sector at zero.':
    'प्रेक्षित का अर्थ क्षेत्र का मध्यक करदाता है, माध्य नहीं: विभाग जिन असामान्य मानों को खोज रहा है, वे ही माध्य को खींच ले जाते। जिस क्षेत्र का स्तंभ नहीं है उसके वर्तमान फ़िल्टर दायरे में करदाता नहीं हैं — और यह क्षेत्र के शून्य पर होने जैसा नहीं है।',
  'Tax to Turnover': 'कर से कारोबार',
  'ITC to Turnover': 'ITC से कारोबार',
  'Refund to Turnover': 'प्रतिदाय से कारोबार',
  'benchmark {0}%': 'मानक {0}%',
  'cross-sector median {0}%': 'अंतर-क्षेत्रीय मध्यक {0}%',
  '{0}% of the {1} in scope': 'दायरे के {1} में से {0}%',
  'Open Proceedings': 'लंबित कार्यवाहियाँ',
  'not in the limitation register': 'परिसीमा पंजी में नहीं',
  '₹{0} Cr · nearest {1}d': '₹{0} करोड़ · निकटतम {1} दि',
  'This sector holds fewer than {0} taxpayers, the minimum the platform requires before a peer norm is worth computing. Its taxpayers are UNASSESSED against a peer median, which is not the same as being clear of one.':
    'इस क्षेत्र में {0} से कम करदाता हैं, जबकि किसी समकक्ष मानक को परिकलन-योग्य मानने से पहले मंच को इतने न्यूनतम चाहिए। इसके करदाताओं का समकक्ष मध्यक के सापेक्ष मूल्यांकन ही नहीं हुआ है — और यह उस मध्यक से निर्दोष निकल जाने जैसा नहीं है।',
  'Sector Benchmark Variance': 'क्षेत्रीय मानक में विचलन',
  'No taxpayer in this sector falls inside the current filter scope, so no observed ratio can be stated. This is an absence of data, not a clean result.':
    'इस क्षेत्र का कोई करदाता वर्तमान फ़िल्टर दायरे में नहीं आता, इसलिए कोई प्रेक्षित अनुपात नहीं बताया जा सकता। यह आँकड़ों का अभाव है, निर्दोष परिणाम नहीं।',
  'The median taxpayer in {0} claims ITC at {1}% of turnover against the {2}% benchmark set for this sector':
    '{0} का मध्यक करदाता कारोबार का {1}% ITC दावा करता है, जबकि इस क्षेत्र हेतु नियत मानक {2}% है',
  'Within this sector the encoded rules have already fired on {0} taxpayers for an ITC spike, {1} for refund ratio and {2} for deviation from the sector benchmark, out of {3} in scope. Those are the taxpayers with an individual case to answer; the sector figure is not.':
    'इस क्षेत्र में दायरे के {3} में से {0} करदाताओं पर ITC उछाल के लिए, {1} पर प्रतिदाय अनुपात के लिए और {2} पर क्षेत्रीय मानक से विचलन के लिए कूटबद्ध नियम पहले ही लागू हो चुके हैं। जिन्हें व्यक्तिगत रूप से उत्तर देना है वे यही करदाता हैं; क्षेत्र का आँकड़ा नहीं।',
  'Sector-level finding — verify per taxpayer before any action':
    'क्षेत्र-स्तरीय निष्कर्ष — किसी भी कार्रवाई से पहले करदातावार सत्यापन करें',
  'Share of the {0} taxpayers in this sector on which each rule fired':
    'इस क्षेत्र के {0} करदाताओं में से जिन पर प्रत्येक नियम लागू हुआ उनका अंश',
  '{0} of {1} · {2}%': '{1} में से {0} · {2}%',
  'Bars are scaled against the whole sector population, so a rule firing on a third of the sector reads as a third of the bar. The rules are the department’s own encoded indicators; a count here is a count of taxpayers who each independently triggered it.':
    'स्तंभ पूरे क्षेत्रीय संख्या के सापेक्ष मापित हैं, इसलिए क्षेत्र के एक-तिहाई पर लागू नियम स्तंभ का एक-तिहाई भरता है। ये नियम विभाग के अपने कूटबद्ध संकेतक हैं; यहाँ की संख्या उन करदाताओं की संख्या है जिनमें से प्रत्येक ने स्वतंत्र रूप से उसे लागू करवाया।',
  'Ranked by their own risk score, respecting global district / risk filters':
    'उनके अपने जोखिम अंक के अनुसार क्रम, ज़िला / जोखिम के वैश्विक फ़िल्टर मानते हुए',
  '{0} rule(s) fired': '{0} नियम लागू हुए',
  'These scores come from the rules that fired against each taxpayer individually. Their sector contributed nothing to the score, and appearing in a deviating sector is not itself an indicator.':
    'ये अंक प्रत्येक करदाता के विरुद्ध अलग-अलग लागू हुए नियमों से आते हैं। उनके क्षेत्र ने अंक में कुछ नहीं जोड़ा, और विचलित क्षेत्र में दिखना स्वयं कोई संकेतक नहीं है।',
  'Cross-Sector Benchmark Table': 'अंतर-क्षेत्रीय मानक तालिका',
  'Every sector against its own benchmark, its share of the population and its nearest statutory deadline':
    'प्रत्येक क्षेत्र अपने मानक, संख्या में अपने अंश और अपनी निकटतम सांविधिक समय-सीमा के सापेक्ष',
  'Each sector is compared to ITS OWN benchmark, never to another sector’s: an ITC ratio that is ordinary in wholesale trading is extraordinary in professional services, so a single cross-sector line would mostly rediscover which sectors exist.':
    'प्रत्येक क्षेत्र की तुलना उसके अपने ही मानक से की जाती है, किसी अन्य क्षेत्र के मानक से कभी नहीं: थोक व्यापार में जो ITC अनुपात साधारण है वह व्यावसायिक सेवाओं में असाधारण होता है, इसलिए एक ही अंतर-क्षेत्रीय रेखा अधिकतर यही दोबारा खोजेगी कि कौन-से क्षेत्र मौजूद हैं।',
  'Concentration is a sector’s share of the High/Critical population divided by its share of the taxpayer population — 1.0x means exactly as many flagged taxpayers as its size predicts. Sectors below the {0}-taxpayer minimum are marked, because a ratio drawn from three businesses is not a norm. Deadlines and exposure are the limitation engine’s own figures, grouped by sector here and computed nowhere but there.':
    'संकेंद्रण अर्थात् उच्च/गंभीर संख्या में क्षेत्र का अंश, भाग करदाता संख्या में उसका अंश — 1.0 गुना का अर्थ है उसके आकार से अपेक्षित उतने ही चिह्नित करदाता। {0} करदाताओं की न्यूनतम संख्या से नीचे के क्षेत्र चिह्नित किए गए हैं, क्योंकि तीन व्यवसायों से निकाला गया अनुपात मानक नहीं होता। समय-सीमाएँ और जोखिम राशि परिसीमा यंत्र के अपने आँकड़े हैं, जिन्हें यहाँ केवल क्षेत्रवार समूहित किया गया है; उनका परिकलन वहीं होता है, और कहीं नहीं।',
  'Every taxpayer in this sector with their own ITC ratio against the sector benchmark (respects global filters)':
    'इस क्षेत्र का प्रत्येक करदाता, उसका अपना ITC अनुपात क्षेत्रीय मानक के सापेक्ष (वैश्विक फ़िल्टर मानता है)',
  'A taxpayer above the sector benchmark is a question, not a finding. Peer-relative outlier detection across the unflagged population is a separate screen with a stated threshold (modified z of {0}); this column is a plain ratio against the reference benchmark and carries no threshold at all.':
    'क्षेत्रीय मानक से ऊपर का करदाता एक प्रश्न है, निष्कर्ष नहीं। अचिह्नित संख्या में समकक्षों के सापेक्ष असामान्य मान खोजना एक अलग पर्दा है जिसकी सीमा घोषित है ({0} का संशोधित z); यह स्तंभ संदर्भ मानक के सापेक्ष सादा अनुपात है और इस पर कोई सीमा है ही नहीं।',

  /* Constant-declared column and card labels passed to t(variable). */
  'Audit recovery': 'लेखापरीक्षा वसूली',
  'Case ageing': 'प्रकरण की आयु',
  'Collection gap to target': 'लक्ष्य से वसूली का अंतर',
  'Exposure (Cr)': 'जोखिम राशि (करोड़)',
  'Nearest deadline': 'निकटतम समय-सीमा',
  'Officer workload': 'अधिकारी कार्यभार',
  'Open proceedings': 'लंबित कार्यवाहियाँ',
  'Filing compliance': 'विवरणी अनुपालन',
  'ITC ratio vs own benchmark': 'ITC अनुपात बनाम अपना मानक',
  'ITC to turnover': 'ITC से कारोबार',
  'ITC vs sector benchmark': 'ITC बनाम क्षेत्रीय मानक',
  'Nearest statutory deadline': 'निकटतम सांविधिक समय-सीमा',
  'No sectors match the current global filters.':
    'वर्तमान वैश्विक फ़िल्टर से कोई क्षेत्र मेल नहीं खाता।',
  'Refund to turnover': 'प्रतिदाय से कारोबार',
  'Tax ratio vs own benchmark': 'कर अनुपात बनाम अपना मानक',
  'Tax to turnover': 'कर से कारोबार',

  /* Peer-measure labels, declared beside the measures they name. */
  'High/Critical concentration': 'उच्च/गंभीर संकेंद्रण',
  'High/Critical taxpayers': 'उच्च/गंभीर करदाता',
  'Next officer-week buys': 'अगला अधिकारी-सप्ताह क्या दिलाता है',
  'Non-filers': 'विवरणी न भरने वाले',

  /* == Short lines — reasoning behind the disclosure ============================ */
  'Every district against its target, its peers and its statutory clock.':
    'प्रत्येक ज़िला अपने लक्ष्य, अपने समकक्षों और अपनी सांविधिक घड़ी के सापेक्ष।',
  'A band is about a place, not about any taxpayer inside it.':
    'पट्टी किसी स्थान के बारे में है, उसके किसी करदाता के बारे में नहीं।',
  'Shading and medians are computed on all districts, unfiltered.':
    'छाया और मध्यक सभी ज़िलों पर, बिना फ़िल्टर के परिकलित हैं।',
  'No district passes the outlier threshold on any measure.':
    'कोई ज़िला किसी भी माप पर असामान्य-मान सीमा पार नहीं करता।',
  'Method: median and median absolute deviation across the district peer group.':
    'पद्धति: ज़िला समकक्ष समूह पर मध्यक एवं मध्यक निरपेक्ष विचलन।',
  'A non-filer count without its denominator is not a compliance rate.':
    'हर के बिना विवरणी न भरने वालों की संख्या अनुपालन दर नहीं है।',
  'The denominator — active registrations per district — is not held here.':
    'हर — ज़िलावार सक्रिय पंजीयन — यहाँ उपलब्ध नहीं है।',
  'Feed required: active GST registrations per district.':
    'आवश्यक स्रोत: ज़िलावार सक्रिय GST पंजीयन।',
  'Recovery covers is audit recovery against that division\'s own shortfall.':
    'वसूली पूरा करती है अर्थात् उस संभाग की अपनी कमी के सापेक्ष लेखापरीक्षा वसूली।',
  'Deadlines are the binding statutory dates from the limitation engine.':
    'समय-सीमाएँ परिसीमा यंत्र की बाध्यकारी सांविधिक तिथियाँ हैं।',
  'Demand / supply is the worst-subscribed officer pool in that division.':
    'माँग / आपूर्ति अर्थात् उस संभाग का सर्वाधिक भार वाला अधिकारी समूह।',

  /* == Sector intelligence — short lines ============================ */
  'Each sector against its own benchmark, not against another sector\'s.':
    'प्रत्येक क्षेत्र अपने ही मानक से, किसी अन्य क्षेत्र के मानक से नहीं।',
  'A statement about a population, never about one taxpayer.':
    'यह समूह के बारे में कथन है, किसी एक करदाता के बारे में कभी नहीं।',
  'Sector membership is never grounds for a notice or an adverse inference.':
    'क्षेत्र-सदस्यता कभी नोटिस अथवा प्रतिकूल अनुमान का आधार नहीं है।',
  'The median taxpayer in each sector, against that sector\'s benchmark.':
    'प्रत्येक क्षेत्र का मध्यक करदाता, उस क्षेत्र के मानक के सापेक्ष।',
  'The median, not the mean — a mean is dragged by the outliers sought.':
    'मध्यक, माध्य नहीं — माध्य उन्हीं असामान्य मानों से खिंच जाता है जिन्हें खोजा जा रहा है।',
  'Scaled against the whole sector, so a third of the sector is a third of the bar.':
    'पूरे क्षेत्र के सापेक्ष मापित, इसलिए क्षेत्र का एक-तिहाई स्तंभ का एक-तिहाई है।',
  'Scored per taxpayer. The sector contributed nothing to the score.':
    'प्रत्येक करदाता हेतु पृथक अंक। क्षेत्र ने अंक में कुछ नहीं जोड़ा।',
  'Each sector against its own benchmark — ratios are not comparable across sectors.':
    'प्रत्येक क्षेत्र अपने मानक से — अनुपात क्षेत्रों के बीच तुलनीय नहीं हैं।',
  'Concentration is the flagged share divided by the population share.':
    'संकेंद्रण अर्थात् चिह्नितों का अंश भाग संख्या में अंश।',
  'Above the benchmark is a question, not a finding. No threshold applies here.':
    'मानक से ऊपर होना प्रश्न है, निष्कर्ष नहीं। यहाँ कोई सीमा लागू नहीं होती।',

  /* == Section eyebrows after the move into Case Priority ============================ */
  'Leadership · District Benchmarking':
    'नेतृत्व · ज़िला मानकीकरण',
  'Leadership · Sector Benchmarking':
    'नेतृत्व · क्षेत्रीय मानकीकरण'
})
