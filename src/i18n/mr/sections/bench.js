import { registerMessages } from '../../locale.js'

/**
 * Marathi — District & Division Performance and Sector Intelligence.
 *
 *   benchmark            → मानक
 *   peer / peer group    → समकक्ष / समकक्ष गट
 *   peer median          → समकक्ष मध्यक
 *   modified z           → सुधारित z
 *   outlier              → अपसामान्य
 *   deviation            → विचलन
 *   shading / band       → छटा / पट्टा
 *   concentration        → संकेंद्रण
 *   pooled               → एकत्रित
 *   denominator          → भाजक
 *   observed             → निरीक्षित
 *
 * “Sector” is क्षेत्र, “division” विभाग, “district” जिल्हा — kept distinct on
 * every screen because all three appear in the same sentence here.
 */
registerMessages('mr', {
  /* == District & Division — briefing note ============================== */
  'District & Division Performance — benchmarking summary':
    'जिल्हा व विभाग कामगिरी — मानकांकनाचा सारांश',
  'Cuts: mild deficit at {0}%, high at {1}%, severe at {2}% against target.':
    'मर्यादा: लक्ष्याच्या तुलनेत सौम्य तूट {0}%, मोठी {1}%, गंभीर {2}%.',
  'Cuts at the 40th / 70th / 90th percentile of all {0} districts: {1}, {2}, {3}.':
    'सर्व {0} जिल्ह्यांच्या 40व्या / 70व्या / 90व्या शततमकावरील मर्यादा: {1}, {2}, {3}.',
  '{0} of {1} districts in scope are below their collection target; the median district sits at {2}% against target.':
    'व्याप्तीतील {1} पैकी {0} जिल्हे त्यांच्या वसुली लक्ष्याखाली आहेत; मध्यक जिल्हा लक्ष्याच्या {2}% वर आहे.',
  'Combined shortfall is ₹{0} Cr, {1}% of the ₹{2} Cr combined target.':
    'एकत्रित तूट ₹{0} कोटी, म्हणजे ₹{2} कोटी एकत्रित लक्ष्याच्या {1}%.',
  'No district in scope is below target, so there is no shortfall for audit recovery to cover.':
    'व्याप्तीतील एकही जिल्हा लक्ष्याखाली नाही, त्यामुळे लेखापरीक्षण वसुलीने भरून काढावी अशी कोणतीही तूट नाही.',
  'Audit recovery of ₹{0} Cr covers {1}% of that shortfall.':
    '₹{0} कोटींची लेखापरीक्षण वसुली त्या तुटीच्या {1}% भरून काढते.',
  '{0} of {1} divisions carry a proceeding within 30 days of its binding statutory deadline, against ₹{2} Cr of exposure.':
    '{1} पैकी {0} विभागांमध्ये बंधनकारक सांविधिक मुदतीच्या 30 दिवसांच्या आत असलेली कार्यवाही आहे, आणि तिच्यावर ₹{2} कोटींची जोखीम रक्कम आहे.',
  'No division in scope carries a proceeding within 30 days of its binding statutory deadline.':
    'व्याप्तीतील कोणत्याही विभागात बंधनकारक सांविधिक मुदतीच्या 30 दिवसांच्या आत असलेली कार्यवाही नाही.',
  '{0} district(s) deviate beyond the peer threshold on at least one measure.':
    '{0} जिल्हे किमान एका मापावर समकक्ष उंबरठ्यापलीकडे विचलित होतात.',
  'No district in scope deviates beyond the peer outlier threshold on any measure.':
    'व्याप्तीतील कोणताही जिल्हा कोणत्याही मापावर समकक्ष अपसामान्य उंबरठ्यापलीकडे विचलित होत नाही.',
  'Severity shading and every peer median are computed on all {0} districts, unfiltered.':
    'तीव्रतेची छटा आणि प्रत्येक समकक्ष मध्यक हे सर्व {0} जिल्ह्यांवर, गाळणीविना मोजले जातात.',

  /* == District & Division — headline cards ============================= */
  'Every district and division measured against its target, its peers and its statutory clock — collection, compliance, enforcement and the capacity available to act.':
    'प्रत्येक जिल्हा आणि विभाग त्याचे लक्ष्य, त्याचे समकक्ष आणि त्याचे सांविधिक घड्याळ यांच्या तुलनेत मोजलेला — वसुली, अनुपालन, अंमलबजावणी आणि कारवाईसाठी उपलब्ध क्षमता.',
  'Districts Below Target': 'लक्ष्याखालील जिल्हे',
  'median district gap to target': 'लक्ष्यापासून मध्यक जिल्ह्याचे अंतर',
  'Collection Shortfall': 'वसुलीतील तूट',
  '{0}% of ₹{1} Cr target': '₹{1} कोटी लक्ष्याच्या {0}%',
  'Audit Recovery Against Shortfall': 'तुटीच्या तुलनेत लेखापरीक्षण वसुली',
  'No shortfall': 'तूट नाही',
  '₹{0} Cr recovered': '₹{0} कोटी वसूल',
  'Divisions Inside 30-Day Limitation': '30 दिवसांच्या परिसीमेतील विभाग',
  'of {0} · ₹{1} Cr exposure': '{0} पैकी · ₹{1} कोटी जोखीम रक्कम',
  'no register coverage in scope': 'व्याप्तीत नोंदवहीची व्याप्ती नाही',

  /* == District & Division — what the shading is ======================== */
  'What this shading is, and what it is not': 'ही छटा काय आहे, आणि काय नाही',
  'A band is a cut on a district-level figure — a governance signal about a place. It is not a risk rating of any taxpayer inside that place: taxpayer risk is scored individually by the risk engine from the rules that actually fired, and a taxpayer in a red district is not thereby high-risk.':
    'पट्टा म्हणजे जिल्हा-पातळीवरील आकड्यावरील मर्यादा — एका ठिकाणाबद्दलचा प्रशासकीय संकेत. त्या ठिकाणातील कोणत्याही करदात्याचे ते जोखीम मानांकन नव्हे: करदात्याची जोखीम, प्रत्यक्षात लागू झालेल्या नियमांवरून जोखीम यंत्र स्वतंत्रपणे मोजते, आणि लाल जिल्ह्यातील करदाता केवळ त्यामुळे उच्च-जोखमीचा ठरत नाही.',
  'Shading and every peer median on this page are computed on all {0} districts, unfiltered. Sector, risk-level and search filters narrow the per-district risk-taxpayer count on the cards below, but never the shading or the benchmark — an incidental filter must not silently recolour a governance map or move the line a district is being measured against.':
    'या पानावरील छटा आणि प्रत्येक समकक्ष मध्यक सर्व {0} जिल्ह्यांवर, गाळणीविना मोजले आहेत. क्षेत्र, जोखीम-पातळी आणि शोध या गाळण्या खालील कार्डांवरील जिल्हानिहाय जोखीम-करदात्यांची संख्या मर्यादित करतात, पण छटा किंवा मानक कधीही नाही — एखाद्या आनुषंगिक गाळणीने प्रशासकीय नकाशाचे रंग गुपचूप बदलू नयेत, किंवा ज्या रेषेच्या तुलनेत जिल्हा मोजला जातो ती हलवू नये.',
  'Narrowing filter active — card risk counts are scoped, shading and medians are not':
    'मर्यादित करणारी गाळणी सुरू — कार्डांवरील जोखीम संख्या व्याप्तीनुसार आहेत, छटा आणि मध्यक नाहीत',

  /* == District & Division — peer deviation ============================= */
  'Peer-Relative Deviation': 'समकक्षांच्या तुलनेतील विचलन',
  'Each district against the median of all {0} districts, scaled by median absolute deviation':
    'प्रत्येक जिल्हा सर्व {0} जिल्ह्यांच्या मध्यकाच्या तुलनेत, मध्यक निरपेक्ष विचलनानुसार प्रमाणित',
  'peer median': 'समकक्ष मध्यक',
  'peer median {0}': 'समकक्ष मध्यक {0}',
  'peer median {0}%': 'समकक्ष मध्यक {0}%',
  'peer median ₹{0} Cr': 'समकक्ष मध्यक ₹{0} कोटी',
  'peer median {0} days': 'समकक्ष मध्यक {0} दिवस',
  'Peer outlier: {0}': 'समकक्षांतील अपसामान्य: {0}',
  'Peer median gap {0}% · shortfall {1}': 'समकक्ष मध्यकापासून अंतर {0}% · तूट {1}',
  '{0}: {1} vs {2} median': '{0}: {1} विरुद्ध {2} मध्यक',
  'No district in scope deviates beyond a modified z of {0} on any measure. That is the expected result on a peer group of {1}: the threshold is the conventional outlier cut, and on twelve districts an ordinary spread will not reach it. It is reported rather than lowered — a threshold moved until it produces results reports ordinary variation as an outlier. Read the medians above as the comparator instead.':
    'व्याप्तीतील कोणताही जिल्हा कोणत्याही मापावर {0} या सुधारित z पलीकडे विचलित होत नाही. {1} इतक्या समकक्ष गटावर हाच अपेक्षित निकाल आहे: हा उंबरठा ही रूढ अपसामान्य मर्यादा आहे, आणि बारा जिल्ह्यांवर सामान्य विखुरलेपण तिथवर पोहोचत नाही. उंबरठा खाली आणण्याऐवजी हे तसेच नोंदवले आहे — निकाल मिळेपर्यंत हलवलेला उंबरठा सामान्य चढउतारालाच अपसामान्य म्हणून नोंदवतो. त्याऐवजी वरील मध्यकच तुलनेचा आधार म्हणून वाचा.',
  'Method: median and median absolute deviation, cut at a modified z of {0} — the platform-wide peer method owned by the discovery engine, applied here across districts rather than across a taxpayer’s sector. Mean and standard deviation are not used because a single extreme district would inflate the spread until it stopped registering as extreme. The peer group is {1} districts, above the {2}-district minimum the method requires before a norm is worth computing. Only the adverse tail is reported: a district unusually better than its peers is not a finding.':
    'पद्धत: मध्यक आणि मध्यक निरपेक्ष विचलन, {0} या सुधारित z वर मर्यादा — ही शोध यंत्राच्या मालकीची, संपूर्ण मंचावर वापरली जाणारी समकक्ष पद्धत असून इथे ती करदात्याच्या क्षेत्राऐवजी जिल्ह्यांवर लावली आहे. सरासरी आणि प्रमाण विचलन वापरलेले नाही, कारण एकच टोकाचा जिल्हा विखुरलेपण इतके फुगवेल की तो स्वतःच टोकाचा दिसेनासा होईल. समकक्ष गट {1} जिल्ह्यांचा आहे, जो मानक मोजण्यालायक ठरण्यासाठी पद्धतीला लागणाऱ्या किमान {2} जिल्ह्यांहून अधिक आहे. केवळ प्रतिकूल टोक नोंदवले जाते: समकक्षांहून असामान्यरीत्या चांगला असलेला जिल्हा हे निष्कर्ष नव्हे.',

  /* == District & Division — table ====================================== */
  'Recovery vs Shortfall': 'वसुली विरुद्ध तूट',
  'Recovery Covers': 'वसुली भरून काढते',
  'recovery covers {0}%': 'वसुली {0}% भरून काढते',
  Shortfall: 'तूट',
  'Shortfall (Cr)': 'तूट (कोटी)',
  'at or above target': 'लक्ष्यावर किंवा त्याहून वर',
  'Division Deadline': 'विभागाची मुदत',
  '{0} within 30 days': '30 दिवसांत {0}',
  'not in register': 'नोंदवहीत नाही',
  'current filter scope': 'सध्याची गाळणी व्याप्ती',
  none: 'एकही नाही',
  'n/a': 'लागू नाही',
  'Division Collection Ranking': 'विभागनिहाय वसुली क्रमवारी',
  'Target, actual and the share of each shortfall that enforcement recovered':
    'लक्ष्य, प्रत्यक्ष वसुली, आणि प्रत्येक तुटीपैकी अंमलबजावणीने वसूल केलेला वाटा',
  'vs Division Median': 'विभागीय मध्यकाच्या तुलनेत',
  'No divisions match the current global filters.':
    'सध्याच्या जागतिक गाळण्यांशी जुळणारा एकही विभाग नाही.',
  '{0} divisions covering {1} districts across Maharashtra. "Recovery covers" is audit recovery as a share of that division’s own collection shortfall — a division above target has no shortfall to cover and is shown as n/a rather than as a perfect score. The risk-taxpayer column follows the current filter scope; every other column does not.':
    'महाराष्ट्रातील {1} जिल्हे व्यापणारे {0} विभाग. "वसुली भरून काढते" म्हणजे त्या विभागाच्याच वसुली तुटीच्या तुलनेत लेखापरीक्षण वसुलीचा वाटा — लक्ष्यावर असलेल्या विभागाकडे भरून काढण्यासारखी तूटच नसते, म्हणून तिथे पूर्ण गुण न दाखवता "लागू नाही" दाखवले आहे. जोखीम-करदाता स्तंभ सध्याच्या गाळणी व्याप्तीनुसार बदलतो; इतर एकही स्तंभ बदलत नाही.',

  /* == District & Division — non-filer denominator ====================== */
  'Non-Filer Compliance Rate': 'विवरण न भरणाऱ्यांचा अनुपालन दर',
  'A parameter this platform cannot currently answer':
    'हा मंच सध्या उत्तर देऊ न शकणारा एक घटक',
  '{0} non-filers are counted across the districts in scope, but a non-filer count without its denominator is not a compliance rate and is not comparable between a metropolitan district and a rural one.':
    'व्याप्तीतील जिल्ह्यांत मिळून {0} विवरण न भरणारे मोजले गेले आहेत, पण भाजकाशिवाय ही संख्या म्हणजे अनुपालन दर नव्हे, आणि महानगरी जिल्हा व ग्रामीण जिल्हा यांच्यात ती तुलनीयही नाही.',
  'The denominator needed is the count of ACTIVE registrations per district from the registration register, which this platform does not hold. The {0} taxpayers in the demonstration extract are a sample, not the register, and dividing by them would produce a rate that looks precise and is wrong by orders of magnitude.':
    'लागणारा भाजक म्हणजे नोंदणी नोंदवहीतील जिल्हानिहाय सक्रिय नोंदण्यांची संख्या, जी या मंचाकडे नाही. प्रात्यक्षिक उताऱ्यातील {0} करदाते हा नमुना आहे, नोंदवही नव्हे; त्यांनी भागल्यास मिळणारा दर अचूक दिसेल आणि कैक पटींनी चुकीचा असेल.',
  'Feed required: active GST registrations per district, as at the reference date. Until it is connected, non-filers are shown as a raw count against the peer median only.':
    'आवश्यक स्रोत: संदर्भ दिनांकास जिल्हानिहाय सक्रिय GST नोंदण्या. तो जोडला जाईपर्यंत विवरण न भरणारे केवळ समकक्ष मध्यकाच्या तुलनेत कच्ची संख्या म्हणून दाखवले आहेत.',

  /* == District & Division — deadlines and capacity ===================== */
  'Division Deadlines & Capacity to Act': 'विभागनिहाय मुदती व कारवाईची क्षमता',
  'What is about to expire in each division, and what one more officer-week there would actually buy':
    'प्रत्येक विभागात काय संपण्याच्या मार्गावर आहे, आणि तिथे आणखी एक अधिकारी-आठवडा प्रत्यक्षात काय मिळवून देईल',
  'Deadlines are the binding statutory dates from the limitation engine — the notice date where no notice has issued, which falls months before the order date and is the one most often missed. A division with no open proceeding in the register is shown as such, not as zero risk.':
    'मुदती म्हणजे परिसीमा यंत्रातील बंधनकारक सांविधिक तारखा — जिथे नोटीस बजावलेली नाही तिथे नोटिशीची तारीख, जी आदेशाच्या तारखेच्या कित्येक महिने आधी येते आणि तीच सर्वाधिक वेळा चुकते. नोंदवहीत एकही प्रलंबित कार्यवाही नसलेला विभाग तसाच दाखवला आहे — शून्य जोखीम म्हणून नव्हे.',
  'Demand / supply is the single worst-subscribed officer pool in that division, taken from the capacity engine rather than averaged across the division. The engine states the reason: {0}':
    'मागणी / पुरवठा म्हणजे त्या विभागातील सर्वाधिक ताण असलेला एकच अधिकारी गट, जो विभागभर सरासरी न काढता क्षमता यंत्रातून घेतला आहे. यंत्र त्याचे कारण सांगते: {0}',
  'Statutory clock in {0}': '{0} मधील सांविधिक घड्याळ',
  'This division carries no open proceeding in the limitation register.':
    'या विभागात परिसीमा नोंदवहीत एकही प्रलंबित कार्यवाही नाही.',
  '{0} open proceedings carrying ₹{1} Cr. Nearest binding deadline in {2} days; {3} within 30 days.':
    '₹{1} कोटी धारण करणाऱ्या {0} प्रलंबित कार्यवाही. सर्वात जवळची बंधनकारक मुदत {2} दिवसांत; {3} 30 दिवसांत.',
  'Capacity in {0}': '{0} मधील क्षमता',
  'No field officer pool is modelled for this division.':
    'या विभागासाठी कोणताही क्षेत्रीय अधिकारी गट प्रारूपात घेतलेला नाही.',
  'Worst-subscribed pool: {0}, demanding {1}x the {2} officers available. One more officer-week there would reach {3} further case(s), worth ₹{4} L.':
    'सर्वाधिक ताण असलेला गट: {0}, उपलब्ध {2} अधिकाऱ्यांच्या {1} पट मागणी. तिथे आणखी एक अधिकारी-आठवडा दिल्यास ₹{4} लाख मूल्याची आणखी {3} प्रकरणे गाठता येतील.',
  '{0} officers · {1} cases assigned · {2} closed month to date':
    '{0} अधिकारी · {1} प्रकरणे नेमून दिली · महिन्यात आजवर {2} निकाली',
  'No open proceeding': 'प्रलंबित कार्यवाही नाही',
  'No field pool': 'क्षेत्रीय गट नाही',
  'Nothing reachable': 'काहीही गाठता येण्याजोगे नाही',
  '{0}x': '{0} पट',
  '{0} · {1} officers': '{0} · {1} अधिकारी',
  '{0} case(s)': '{0} प्रकरणे',
  'Ranked by each taxpayer’s own rule-based risk score. District shading played no part in these ratings.':
    'प्रत्येक करदात्याच्या स्वतःच्या नियम-आधारित जोखीम गुणांनुसार क्रम. या मानांकनांत जिल्ह्याच्या छटेचा कोणताही भाग नाही.',

  /* == Sector Intelligence — briefing note ============================== */
  'Sector Intelligence — cross-sector benchmarking summary':
    'क्षेत्र इंटेलिजन्स — आंतर-क्षेत्रीय मानकांकनाचा सारांश',
  '{0} of {1} sectors with observations sit below their own tax-to-turnover benchmark.':
    'निरीक्षणे असलेल्या {1} पैकी {0} क्षेत्रे त्यांच्या स्वतःच्या कर-ते-उलाढाल मानकाखाली आहेत.',
  'Widest observed gap to an own benchmark: {0}, ITC at {1}% of turnover against a {2}% benchmark ({3}%).':
    'स्वतःच्या मानकापासूनचे सर्वात मोठे निरीक्षित अंतर: {0}, उलाढालीच्या {1}% इतका ITC, तर मानक {2}% ({3}%).',
  'No sector in scope has enough observations to compare against its ITC benchmark.':
    'व्याप्तीतील कोणत्याही क्षेत्राकडे त्याच्या ITC मानकाशी तुलना करण्याइतकी निरीक्षणे नाहीत.',
  'Highest risk concentration: {0} holds {1}% of taxpayers in scope and {2}% of the High/Critical ratings, {3}x its population share.':
    'सर्वाधिक जोखीम संकेंद्रण: {0} कडे व्याप्तीतील {1}% करदाते आणि उच्च/अतिगंभीर मानांकनांपैकी {2}% आहेत, म्हणजे त्याच्या संख्या-वाट्याच्या {3} पट.',
  'No sector in scope meets the minimum group size for a risk-concentration figure.':
    'जोखीम संकेंद्रणाचा आकडा देण्यासाठी लागणारा किमान गट आकार व्याप्तीतील एकाही क्षेत्राचा नाही.',
  'Selected sector {0}: {1} taxpayers, {2}% of pooled tax paid, filing compliance {3}% against a cross-sector median of {4}%.':
    'निवडलेले क्षेत्र {0}: {1} करदाते, एकत्रित भरलेल्या करापैकी {2}%, विवरण अनुपालन {3}% तर आंतर-क्षेत्रीय मध्यक {4}%.',
  'Sector is a descriptive dimension carrying {0}% weight in the comparability engine. Nothing on this page is evidence about an individual taxpayer.':
    'क्षेत्र ही वर्णनात्मक मिती असून तुलनात्मकता यंत्रात तिचे वजन {0}% आहे. या पानावरील काहीही एखाद्या स्वतंत्र करदात्याबद्दलचा पुरावा नाही.',

  /* == Sector Intelligence — headline cards ============================= */
  'Each sector measured against its own benchmark, its share of the population and its statutory clock — what behaviour actually looks like inside a sector, not what the reference table says it should.':
    'प्रत्येक क्षेत्र त्याचे स्वतःचे मानक, संख्येतील त्याचा वाटा आणि त्याचे सांविधिक घड्याळ यांच्या तुलनेत मोजलेले — क्षेत्रात वर्तन प्रत्यक्षात कसे दिसते, संदर्भ तक्ता ते कसे असावे म्हणतो ते नव्हे.',
  'Sectors Below Own Tax Benchmark': 'स्वतःच्या कर मानकाखालील क्षेत्रे',
  'of {0} with observations': 'निरीक्षणे असलेल्या {0} पैकी',
  'Widest Gap to Own ITC Benchmark': 'स्वतःच्या ITC मानकापासूनचे सर्वात मोठे अंतर',
  'None observed': 'एकही निरीक्षित नाही',
  'no observations': 'निरीक्षणे नाहीत',
  'observed {0}% vs benchmark {1}%': 'निरीक्षित {0}% विरुद्ध मानक {1}%',
  'no sector has observations in scope': 'व्याप्तीत कोणत्याही क्षेत्राची निरीक्षणे नाहीत',
  'Highest Risk Concentration': 'सर्वाधिक जोखीम संकेंद्रण',
  '{0}x its share of the population': 'त्याच्या संख्या-वाट्याच्या {0} पट',
  '{0}x its population share': 'त्याच्या संख्या-वाट्याच्या {0} पट',
  '{0}x share': '{0} पट वाटा',
  'no sector meets the minimum group size': 'किमान गट आकार कोणतेही क्षेत्र गाठत नाही',
  'below peer-norm size': 'समकक्ष-मानक आकाराहून लहान',
  'Largest Revenue Share': 'सर्वात मोठा महसूल वाटा',
  '{0}% of ₹{1}L pooled tax paid': 'एकत्रित भरलेल्या ₹{1} लाख करापैकी {0}%',
  '{0}% of pooled tax paid': 'एकत्रित भरलेल्या करापैकी {0}%',
  '{0}% of pool': 'एकत्रित संचाच्या {0}%',
  'no taxpayers in scope': 'व्याप्तीत करदाते नाहीत',
  '{0}% vs {1}%': '{0}% विरुद्ध {1}%',
  'median {0}%': 'मध्यक {0}%',
  '{0} of {1} flagged': '{1} पैकी {0} चिन्हांकित',
  'all past deadline': 'सर्व मुदत उलटलेली',
  '{0} cases · ₹{1} Cr': '{0} प्रकरणे · ₹{1} कोटी',

  /* == Sector Intelligence — what it can and cannot support ============= */
  'What a sector comparison can and cannot support':
    'क्षेत्रीय तुलना कशाला आधार देऊ शकते आणि कशाला नाही',
  'Sector is a descriptive attribute. The comparability engine weights it at {0}% — the lowest weight of any dimension it carries — because it is the dimension that looks most relevant and predicts outcomes least. Everything on this page is therefore a statement about a POPULATION: where a sector as a whole sits against its own benchmark, and where the department should look first.':
    'क्षेत्र हा वर्णनात्मक गुणधर्म आहे. तुलनात्मकता यंत्र त्याला {0}% वजन देते — त्याच्याकडील कोणत्याही मितीतले सर्वात कमी — कारण हीच ती मिती आहे जी सर्वाधिक समर्पक दिसते आणि निकालांचा अंदाज सर्वात कमी देते. म्हणून या पानावरील सर्व काही एका समूहाविषयीचे विधान आहे: संपूर्ण क्षेत्र त्याच्या स्वतःच्या मानकाच्या तुलनेत कुठे उभे आहे, आणि विभागाने प्रथम कुठे पाहावे.',
  'It is never evidence about an individual taxpayer. A taxpayer does not become suspect by belonging to a deviating sector, and no notice, scrutiny selection or adverse inference may rest on sector membership. Individual risk is scored separately, per taxpayer, from the rules that actually fired against that taxpayer.':
    'ते कधीही एखाद्या स्वतंत्र करदात्याबद्दलचा पुरावा नसते. विचलित क्षेत्रात असल्याने करदाता संशयित ठरत नाही, आणि कोणतीही नोटीस, छाननीसाठी निवड किंवा प्रतिकूल अनुमान क्षेत्र-सदस्यत्वावर आधारित असू शकत नाही. वैयक्तिक जोखीम प्रत्येक करदात्यासाठी स्वतंत्रपणे, त्याच्याविरुद्ध प्रत्यक्षात लागू झालेल्या नियमांवरून मोजली जाते.',
  'Sector is also taken from the registration record. A misclassified taxpayer is measured against the wrong peers and will appear anomalous for that reason alone.':
    'क्षेत्रही नोंदणी नोंदीतूनच घेतले जाते. चुकीचे वर्गीकरण झालेला करदाता चुकीच्या समकक्षांशी तोलला जातो आणि केवळ त्याच कारणाने विसंगत दिसतो.',

  /* == Sector Intelligence — charts and benchmarks ====================== */
  'Tax paid by the {0} taxpayers in scope, ₹{1}L pooled — bar height is absolute, the share of the pool is in the tooltip':
    'व्याप्तीतील {0} करदात्यांनी भरलेला कर, एकत्रित ₹{1} लाख — स्तंभाची उंची निरपेक्ष आहे, एकत्रित संचातील वाटा टूलटिपमध्ये आहे',
  '₹{0}L · {1}% of pooled tax paid': '₹{0} लाख · एकत्रित भरलेल्या करापैकी {1}%',
  'Observed Behaviour Against the Department Benchmark':
    'विभागीय मानकाच्या तुलनेत निरीक्षित वर्तन',
  'Median observed ratio in each sector against the reference benchmark set for that sector — the benchmark alone says nothing until something is measured against it':
    'प्रत्येक क्षेत्रातील मध्यक निरीक्षित गुणोत्तर, त्या क्षेत्रासाठी ठरवलेल्या संदर्भ मानकाच्या तुलनेत — मानकाच्या तुलनेत काही मोजले जाईपर्यंत केवळ मानक काहीही सांगत नाही',
  'Observed median (%)': 'निरीक्षित मध्यक (%)',
  'Department benchmark (%)': 'विभागीय मानक (%)',
  'Observed is the MEDIAN taxpayer in the sector, not the mean: a mean would be dragged by the same outliers the department is looking for. A sector with no bar has no taxpayers in the current filter scope, which is not the same as a sector at zero.':
    'निरीक्षित म्हणजे क्षेत्रातील मध्यक करदाता, सरासरी नव्हे: विभाग ज्यांचा शोध घेत आहे त्याच अपसामान्यांनी सरासरी ओढली गेली असती. ज्या क्षेत्राला स्तंभ नाही त्याचे सध्याच्या गाळणी व्याप्तीत करदाते नाहीत — आणि हे क्षेत्र शून्यावर असण्यासारखे नाही.',
  'Tax to Turnover': 'कर ते उलाढाल',
  'ITC to Turnover': 'ITC ते उलाढाल',
  'Refund to Turnover': 'परतावा ते उलाढाल',
  'benchmark {0}%': 'मानक {0}%',
  'cross-sector median {0}%': 'आंतर-क्षेत्रीय मध्यक {0}%',
  '{0}% of the {1} in scope': 'व्याप्तीतील {1} पैकी {0}%',
  'Open Proceedings': 'प्रलंबित कार्यवाही',
  'not in the limitation register': 'परिसीमा नोंदवहीत नाही',
  '₹{0} Cr · nearest {1}d': '₹{0} कोटी · सर्वात जवळची {1} दि',
  'This sector holds fewer than {0} taxpayers, the minimum the platform requires before a peer norm is worth computing. Its taxpayers are UNASSESSED against a peer median, which is not the same as being clear of one.':
    'या क्षेत्रात {0} पेक्षा कमी करदाते आहेत, आणि समकक्ष मानक मोजण्यालायक ठरण्यासाठी मंचाला तेवढे किमान लागतात. त्यातील करदात्यांचे समकक्ष मध्यकाच्या तुलनेत मूल्यमापनच झालेले नाही — आणि हे मध्यकातून निर्दोष सुटण्यासारखे नाही.',
  'Sector Benchmark Variance': 'क्षेत्रीय मानकातील विचलन',
  'No taxpayer in this sector falls inside the current filter scope, so no observed ratio can be stated. This is an absence of data, not a clean result.':
    'या क्षेत्रातील एकही करदाता सध्याच्या गाळणी व्याप्तीत येत नाही, त्यामुळे कोणतेही निरीक्षित गुणोत्तर सांगता येत नाही. हा माहितीचा अभाव आहे, निर्दोष निकाल नव्हे.',
  'The median taxpayer in {0} claims ITC at {1}% of turnover against the {2}% benchmark set for this sector':
    '{0} मधील मध्यक करदाता उलाढालीच्या {1}% इतका ITC दावा करतो, तर या क्षेत्रासाठी ठरवलेले मानक {2}% आहे',
  'Within this sector the encoded rules have already fired on {0} taxpayers for an ITC spike, {1} for refund ratio and {2} for deviation from the sector benchmark, out of {3} in scope. Those are the taxpayers with an individual case to answer; the sector figure is not.':
    'या क्षेत्रात व्याप्तीतील {3} पैकी {0} करदात्यांवर ITC उसळीसाठी, {1} वर परतावा गुणोत्तरासाठी आणि {2} वर क्षेत्रीय मानकापासूनच्या विचलनासाठी संकेतबद्ध नियम आधीच लागू झाले आहेत. ज्यांना वैयक्तिक उत्तर द्यायचे आहे ते हेच करदाते; क्षेत्राचा आकडा नव्हे.',
  'Sector-level finding — verify per taxpayer before any action':
    'क्षेत्र-पातळीवरील निष्कर्ष — कोणतीही कारवाई करण्यापूर्वी करदातानिहाय पडताळणी करा',
  'Share of the {0} taxpayers in this sector on which each rule fired':
    'या क्षेत्रातील {0} करदात्यांपैकी प्रत्येक नियम ज्यांच्यावर लागू झाला त्यांचा वाटा',
  '{0} of {1} · {2}%': '{1} पैकी {0} · {2}%',
  'Bars are scaled against the whole sector population, so a rule firing on a third of the sector reads as a third of the bar. The rules are the department’s own encoded indicators; a count here is a count of taxpayers who each independently triggered it.':
    'स्तंभ संपूर्ण क्षेत्रीय संख्येच्या तुलनेत प्रमाणित आहेत, त्यामुळे क्षेत्राच्या एक तृतीयांश भागावर लागू झालेला नियम स्तंभाचा एक तृतीयांश भाग व्यापतो. हे नियम म्हणजे विभागाचेच संकेतबद्ध निर्देशक; इथली संख्या म्हणजे प्रत्येकाने स्वतंत्रपणे तो नियम लागू करवला अशा करदात्यांची संख्या.',
  'Ranked by their own risk score, respecting global district / risk filters':
    'त्यांच्या स्वतःच्या जोखीम गुणांनुसार क्रम, जिल्हा / जोखीम या जागतिक गाळण्या पाळून',
  '{0} rule(s) fired': '{0} नियम लागू झाले',
  'These scores come from the rules that fired against each taxpayer individually. Their sector contributed nothing to the score, and appearing in a deviating sector is not itself an indicator.':
    'हे गुण प्रत्येक करदात्याविरुद्ध स्वतंत्रपणे लागू झालेल्या नियमांतून येतात. त्यांच्या क्षेत्राने गुणांत काहीही भर घातलेली नाही, आणि विचलित क्षेत्रात दिसणे हा स्वतःच निर्देशक नाही.',
  'Cross-Sector Benchmark Table': 'आंतर-क्षेत्रीय मानक तक्ता',
  'Every sector against its own benchmark, its share of the population and its nearest statutory deadline':
    'प्रत्येक क्षेत्र त्याच्या स्वतःच्या मानकाच्या, संख्येतील वाट्याच्या आणि सर्वात जवळच्या सांविधिक मुदतीच्या तुलनेत',
  'Each sector is compared to ITS OWN benchmark, never to another sector’s: an ITC ratio that is ordinary in wholesale trading is extraordinary in professional services, so a single cross-sector line would mostly rediscover which sectors exist.':
    'प्रत्येक क्षेत्र त्याच्या स्वतःच्याच मानकाशी तोलले जाते, दुसऱ्या क्षेत्राच्या मानकाशी कधीही नाही: घाऊक व्यापारात सामान्य असलेले ITC गुणोत्तर व्यावसायिक सेवांत असामान्य ठरते, त्यामुळे एकच आंतर-क्षेत्रीय रेषा बहुतांशी कोणती क्षेत्रे अस्तित्वात आहेत एवढेच पुन्हा शोधून काढेल.',
  'Concentration is a sector’s share of the High/Critical population divided by its share of the taxpayer population — 1.0x means exactly as many flagged taxpayers as its size predicts. Sectors below the {0}-taxpayer minimum are marked, because a ratio drawn from three businesses is not a norm. Deadlines and exposure are the limitation engine’s own figures, grouped by sector here and computed nowhere but there.':
    'संकेंद्रण म्हणजे उच्च/अतिगंभीर संख्येतील क्षेत्राचा वाटा भागिले करदाता संख्येतील त्याचा वाटा — 1.0 पट म्हणजे त्याच्या आकारावरून अपेक्षित तितकेच चिन्हांकित करदाते. {0} करदात्यांच्या किमान संख्येखालील क्षेत्रे स्वतंत्रपणे खुणावली आहेत, कारण तीन व्यवसायांवरून काढलेले गुणोत्तर हे मानक नव्हे. मुदती आणि जोखीम रक्कम हे परिसीमा यंत्राचेच आकडे असून इथे केवळ क्षेत्रानुसार गटबद्ध केले आहेत; ते तिथेच मोजले जातात, इतरत्र कुठेही नाही.',
  'Every taxpayer in this sector with their own ITC ratio against the sector benchmark (respects global filters)':
    'या क्षेत्रातील प्रत्येक करदाता, त्याचे स्वतःचे ITC गुणोत्तर क्षेत्रीय मानकाच्या तुलनेत (जागतिक गाळण्या पाळतो)',
  'A taxpayer above the sector benchmark is a question, not a finding. Peer-relative outlier detection across the unflagged population is a separate screen with a stated threshold (modified z of {0}); this column is a plain ratio against the reference benchmark and carries no threshold at all.':
    'क्षेत्रीय मानकाच्या वर असलेला करदाता हा प्रश्न आहे, निष्कर्ष नव्हे. चिन्हांकित नसलेल्या संख्येत समकक्षांच्या तुलनेत अपसामान्य शोधणे हा वेगळा पडदा असून त्याचा उंबरठा सांगितलेला आहे ({0} इतका सुधारित z); हा स्तंभ म्हणजे संदर्भ मानकाच्या तुलनेतले साधे गुणोत्तर असून त्याला कोणताही उंबरठा नाही.',

  /* Constant-declared column and card labels passed to t(variable). */
  'Audit recovery': 'लेखापरीक्षण वसुली',
  'Case ageing': 'प्रकरणाचे वय',
  'Collection gap to target': 'लक्ष्यापासून वसुलीतील अंतर',
  'Exposure (Cr)': 'जोखीम रक्कम (कोटी)',
  'Nearest deadline': 'सर्वात जवळची मुदत',
  'Officer workload': 'अधिकारी कामाचा भार',
  'Open proceedings': 'प्रलंबित कार्यवाही',
  'Filing compliance': 'विवरण अनुपालन',
  'ITC ratio vs own benchmark': 'ITC गुणोत्तर विरुद्ध स्वतःचे मानक',
  'ITC to turnover': 'ITC ते उलाढाल',
  'ITC vs sector benchmark': 'ITC विरुद्ध क्षेत्रीय मानक',
  'Nearest statutory deadline': 'सर्वात जवळची सांविधिक मुदत',
  'No sectors match the current global filters.':
    'सध्याच्या जागतिक गाळण्यांशी जुळणारे एकही क्षेत्र नाही.',
  'Refund to turnover': 'परतावा ते उलाढाल',
  'Tax ratio vs own benchmark': 'कर गुणोत्तर विरुद्ध स्वतःचे मानक',
  'Tax to turnover': 'कर ते उलाढाल',

  /* Peer-measure labels, declared beside the measures they name. */
  'High/Critical concentration': 'उच्च/अतिगंभीर संकेंद्रण',
  'High/Critical taxpayers': 'उच्च/अतिगंभीर करदाते',
  'Next officer-week buys': 'पुढील अधिकारी-आठवडा काय मिळवून देतो',
  'Non-filers': 'विवरण न भरणारे',

  /* == Short lines — reasoning behind the disclosure ============================ */
  'Every district against its target, its peers and its statutory clock.':
    'प्रत्येक जिल्हा त्याचे लक्ष्य, त्याचे समकक्ष आणि त्याचे सांविधिक घड्याळ यांच्या तुलनेत.',
  'A band is about a place, not about any taxpayer inside it.':
    'पट्टा हा ठिकाणाविषयी असतो, त्यातील कोणत्याही करदात्याविषयी नव्हे.',
  'Shading and medians are computed on all districts, unfiltered.':
    'छटा आणि मध्यक सर्व जिल्ह्यांवर, गाळणीविना मोजले जातात.',
  'No district passes the outlier threshold on any measure.':
    'कोणताही जिल्हा कोणत्याही मापावर अपसामान्य उंबरठा ओलांडत नाही.',
  'Method: median and median absolute deviation across the district peer group.':
    'पद्धत: जिल्हा समकक्ष गटावर मध्यक आणि मध्यक निरपेक्ष विचलन.',
  'A non-filer count without its denominator is not a compliance rate.':
    'भाजकाशिवाय विवरण न भरणाऱ्यांची संख्या म्हणजे अनुपालन दर नव्हे.',
  'The denominator — active registrations per district — is not held here.':
    'भाजक — जिल्हानिहाय सक्रिय नोंदण्या — इथे उपलब्ध नाही.',
  'Feed required: active GST registrations per district.':
    'आवश्यक स्रोत: जिल्हानिहाय सक्रिय GST नोंदण्या.',
  'Recovery covers is audit recovery against that division\'s own shortfall.':
    'वसुली भरून काढते म्हणजे त्या विभागाच्या स्वतःच्या तुटीच्या तुलनेत लेखापरीक्षण वसुली.',
  'Deadlines are the binding statutory dates from the limitation engine.':
    'मुदती म्हणजे परिसीमा यंत्रातील बंधनकारक सांविधिक तारखा.',
  'Demand / supply is the worst-subscribed officer pool in that division.':
    'मागणी / पुरवठा म्हणजे त्या विभागातील सर्वाधिक ताण असलेला अधिकारी गट.',

  /* == Sector intelligence — short lines ============================ */
  'Each sector against its own benchmark, not against another sector\'s.':
    'प्रत्येक क्षेत्र त्याच्या स्वतःच्या मानकाशी, दुसऱ्या क्षेत्राच्या मानकाशी नव्हे.',
  'A statement about a population, never about one taxpayer.':
    'हे समूहाविषयीचे विधान आहे, एका करदात्याविषयी कधीही नाही.',
  'Sector membership is never grounds for a notice or an adverse inference.':
    'क्षेत्र-सदस्यत्व हा नोटीस किंवा प्रतिकूल अनुमानाचा आधार कधीही नाही.',
  'The median taxpayer in each sector, against that sector\'s benchmark.':
    'प्रत्येक क्षेत्रातील मध्यक करदाता, त्या क्षेत्राच्या मानकाच्या तुलनेत.',
  'The median, not the mean — a mean is dragged by the outliers sought.':
    'मध्यक, सरासरी नव्हे — सरासरी ज्या अपसामान्यांचा शोध आहे त्यांनीच ओढली जाते.',
  'Scaled against the whole sector, so a third of the sector is a third of the bar.':
    'संपूर्ण क्षेत्राच्या तुलनेत प्रमाणित, त्यामुळे क्षेत्राचा एक तृतीयांश म्हणजे स्तंभाचा एक तृतीयांश.',
  'Scored per taxpayer. The sector contributed nothing to the score.':
    'प्रत्येक करदात्यासाठी स्वतंत्र गुण. क्षेत्राने गुणांत काहीही भर घातलेली नाही.',
  'Each sector against its own benchmark — ratios are not comparable across sectors.':
    'प्रत्येक क्षेत्र त्याच्या स्वतःच्या मानकाशी — गुणोत्तरे क्षेत्रांमध्ये तुलनीय नाहीत.',
  'Concentration is the flagged share divided by the population share.':
    'संकेंद्रण म्हणजे चिन्हांकितांचा वाटा भागिले संख्येतील वाटा.',
  'Above the benchmark is a question, not a finding. No threshold applies here.':
    'मानकाच्या वर असणे हा प्रश्न आहे, निष्कर्ष नव्हे. इथे कोणताही उंबरठा लागू नाही.'
})
