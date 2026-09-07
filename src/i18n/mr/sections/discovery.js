import { registerMessages } from '../../locale.js'

/**
 * Marathi — Unknown Risk Discovery, Network Enforcement, ITC Risk
 * Intelligence, E-Way Bill Intelligence, Compliance Early Warning and
 * Refund Risk Intelligence.
 *
 *   unflagged            → चिन्हांकित नसलेले
 *   unassessed           → मूल्यमापन न झालेले (never “निर्दोष”)
 *   peer norm            → समकक्ष मानक
 *   cut / cut point      → छेद / छेदबिंदू (the entity a chain is broken at)
 *   blockable            → रोखता येण्याजोगे
 *   utilised             → वापरलेले
 *   chain                → साखळी
 *   lead strength        → सुगाव्याची ताकद
 *   consignment          → खेप
 *   unmatched            → न जुळलेले
 *   alert                → सूचना
 *   inflow               → आवक
 *   claim                → दावा
 *   sanction             → मंजुरी
 *   percentage point     → टक्केवारी बिंदू (pp)
 *
 * Form identifiers stay in Latin — GSTR-1, e-way bill, GSTIN.
 */
registerMessages('mr', {
  /* == Unknown Risk Discovery ============================================ */
  'of {0} taxpayers ({1}%) — trigger no encoded rule':
    '{0} करदात्यांपैकी ({1}%) — एकही संकेतबद्ध नियम लागू होत नाही',
  'Actually measured against peers': 'प्रत्यक्षात समकक्षांच्या तुलनेत मोजलेले',
  'of {0} screened — {1} sit in sectors too small to norm and are unassessed, not cleared':
    'छाननी केलेल्या {0} पैकी — {1} अशा क्षेत्रांत आहेत जी मानक काढण्याइतकी मोठी नाहीत; त्यांचे मूल्यमापन झालेले नाही, ते निर्दोष ठरलेले नाहीत',
  '{0}% of those screened — {1} recurring signatures worth encoding':
    'छाननी केलेल्यांपैकी {0}% — संकेतबद्ध करण्यालायक {1} पुनरावृत्त नमुने',
  'Closest approach to the threshold': 'उंबरठ्याच्या सर्वात जवळचे',
  'highest unflagged deviation — {0} short of the {1} cut, on {2}':
    'चिन्हांकित नसलेल्यांतील सर्वाधिक विचलन — {1} या मर्यादेपासून {0} ने कमी, {2} वर',
  'Who was actually measured': 'प्रत्यक्षात कोणाचे मोजमाप झाले',
  '{0} of the {1} screened taxpayers were scored against a peer norm. The remaining {2} were not — the answer for them is "unknown", not "clean".':
    'छाननी केलेल्या {1} करदात्यांपैकी {0} जणांना समकक्ष मानकाच्या तुलनेत गुण दिले गेले. उरलेल्या {2} जणांना नाही — त्यांच्याबाबतचे उत्तर "अज्ञात" आहे, "निर्दोष" नव्हे.',
  'Every screened taxpayer sits in a sector large enough to carry a peer norm, so the screen covers the whole unflagged population.':
    'छाननी केलेला प्रत्येक करदाता समकक्ष मानक पेलण्याइतक्या मोठ्या क्षेत्रात आहे, त्यामुळे ही छाननी चिन्हांकित नसलेल्या संपूर्ण संख्येला व्यापते.',
  'Sector with no peer norm': 'समकक्ष मानक नसलेले क्षेत्र',
  'Taxpayers in sector': 'क्षेत्रातील करदाते',
  '{0} — below the minimum of {1}': '{0} — किमान {1} पेक्षा कमी',
  'Unassessed among the screened': 'छाननी केलेल्यांपैकी मूल्यमापन न झालेले',
  'Exposure they carry': 'ते धारण करत असलेली जोखीम रक्कम',
  'These {0} taxpayers carry {1} of exposure and were never scored, because a peer median drawn from fewer than {2} businesses is not a norm. The action is a wider extract for these sectors — statewide rather than pilot — not a lower minimum group size, which would replace an honest gap with a fabricated benchmark.':
    'हे {0} करदाते {1} जोखीम रक्कम धारण करतात आणि त्यांना कधीही गुण दिले गेले नाहीत, कारण {2} पेक्षा कमी व्यवसायांवरून काढलेला समकक्ष मध्यक हे मानक नव्हे. यावरील कृती म्हणजे या क्षेत्रांसाठी अधिक व्यापक उतारा — प्रायोगिक नव्हे तर राज्यव्यापी — किमान गट आकार कमी करणे नव्हे, कारण त्याने प्रामाणिक त्रुटीच्या जागी बनावट मानक बसेल.',
  'Shortfall against the {0} cut': '{0} या मर्यादेपासूनची तूट',
  'reaches it': 'तिथवर पोहोचतो',
  '{0} short': '{0} ने कमी',
  'Flagged reach, as a multiple of unflagged':
    'चिन्हांकित नसलेल्यांच्या तुलनेत चिन्हांकितांची पोहोच, पटींत',
  '{0}×': '{0}×',
  'The nearest miss is {0}, where the most extreme unflagged taxpayer reaches {1} — {2} below the cut. How narrow that gap is does not change what should be done with it. The threshold is the Iglewicz–Hoaglin convention, not a dial set to whatever makes this screen produce output, and moving it far enough to catch a near miss would report every ordinary business at that same distance from its peers as a discovery.':
    'सर्वात थोडक्यात हुकलेले {0} आहे, जिथे चिन्हांकित नसलेला सर्वात टोकाचा करदाता {1} पर्यंत पोहोचतो — मर्यादेपेक्षा {2} ने कमी. हे अंतर किती अरुंद आहे यावरून त्याचे काय करावे हे बदलत नाही. हा उंबरठा म्हणजे Iglewicz–Hoaglin ही रूढ मर्यादा आहे — हा पडदा काहीतरी निकाल देईपर्यंत फिरवायचे बटण नव्हे; आणि थोडक्यात हुकलेले पकडण्याइतका तो हलवला, तर समकक्षांपासून तेवढ्याच अंतरावर असलेला प्रत्येक सामान्य व्यवसाय शोध म्हणून नोंदवला जाईल.',

  /* == Network Enforcement ============================================== */
  'across {0} divisions': '{0} विभागांमध्ये',
  '{0} entities · {1} chains span more than one division, up to {2}':
    '{0} संस्था · {1} साखळ्या एकाहून अधिक विभागांत पसरतात, कमाल {2} पर्यंत',
  '₹ Cr — {0}% of the credit in these chains; the other {1}% is already utilised':
    '₹ कोटी — या साखळ्यांतील श्रेयाच्या {0}%; उरलेले {1}% आधीच वापरले गेले आहे',
  'of {0} entities ({1}%), across {2} of {3} chains — acting on one changes nothing':
    '{0} संस्थांपैकी ({1}%), {3} पैकी {2} साखळ्यांमध्ये — एकावर कारवाई करून काहीही बदलत नाही',
  'of {0} chains — {1} Cr blockable behind a division with no investigation officer':
    '{0} साखळ्यांपैकी — तपास अधिकारी नसलेल्या विभागामागे {1} कोटी रोखता येण्याजोगे',
  'Act first on {0}: it carries the largest blockable value of any chain that every division in its span can close on one date — {1} across {2} divisions, {3} days old.':
    'प्रथम {0} वर कारवाई करा: तिच्या व्याप्तीतील प्रत्येक विभाग एकाच तारखेला बंद करू शकेल अशा साखळ्यांपैकी हिच्यात सर्वाधिक रोखता येण्याजोगे मूल्य आहे — {2} विभागांत मिळून {1}, वय {3} दिवस.',
  'Cut point: {0}': 'छेदबिंदू: {0}',
  'Which chain first': 'आधी कोणती साखळी',
  'Ranked by blockable value. A chain is only workable this week if its cut point sits in a division with an officer who may act — the last two columns decide that, and they override the first.':
    'रोखता येण्याजोग्या मूल्यानुसार क्रम. साखळीचा छेदबिंदू ज्या विभागात आहे तिथे कारवाई करू शकणारा अधिकारी असेल तरच ती या आठवड्यात हाताळता येते — ते शेवटचे दोन स्तंभ ठरवतात, आणि ते पहिल्या स्तंभावर मात करतात.',
  Chain: 'साखळी',
  '{0} entities · {1} divisions': '{0} संस्था · {1} विभाग',
  '{0}% of this chain’s credit': 'या साखळीच्या श्रेयाच्या {0}%',
  'Where the cut works': 'छेद कुठे लागू होतो',
  '{0}% of chain invoice value sits on its edges': 'साखळीच्या बीजक मूल्याच्या {0}% तिच्या कडांवर आहे',
  'No single cut works — group action only': 'एकही छेद पुरेसा नाही — केवळ सामूहिक कारवाई',
  'Margin over the next option': 'पुढच्या पर्यायावरील आघाडी',
  'only one effective cut': 'केवळ एकच परिणामकारक छेद',
  '{0}% better': '{0}% अधिक चांगला',
  'Entities that would not stop it': 'ज्या संस्थांवरील कारवाईने ती थांबणार नाही',
  'Workable now?': 'आता हाताळता येईल का?',
  'Cut point has no officer': 'छेदबिंदूवर अधिकारी नाही',
  'Cut is covered, span is not': 'छेदावर अधिकारी आहे, संपूर्ण व्याप्तीवर नाही',
  'The margin column is the one most easily missed. Where it is small, the ranking between the recommended entity and the next is inside the noise of the lead-strength weights, and the choice should be made on evidence an officer holds rather than on this ordering.':
    'आघाडीचा स्तंभ हाच सर्वात सहज नजरेतून सुटतो. तो लहान असेल, तिथे शिफारस केलेली संस्था आणि पुढची संस्था यांच्यातील क्रम सुगाव्याच्या ताकदीच्या वजनांतील गोंधळाच्या आतच असतो, आणि निवड या क्रमावर नव्हे तर अधिकाऱ्याकडील पुराव्यावर व्हावी.',
  '{0} still blockable ({1}% of this chain’s credit; {2} already utilised) of {3} that moved through the chain · signal age {4} days · {5} divisions':
    'साखळीतून फिरलेल्या {3} पैकी {0} अजून रोखता येण्याजोगे (या साखळीच्या श्रेयाच्या {1}%; {2} आधीच वापरलेले) · संकेताचे वय {4} दिवस · {5} विभाग',
  'Lead strength {0} of a possible 0.95': 'सुगाव्याची ताकद {0}, कमाल शक्य 0.95 पैकी',
  'No investigation officer in this division': 'या विभागात तपास अधिकारी नाही',
  '{0} of invoice value sits on the edges this entity is party to — {1}% of the {2} moving through the chain.':
    'ही संस्था ज्या कडांवर सहभागी आहे त्यांवर {0} इतके बीजक मूल्य आहे — साखळीतून फिरणाऱ्या {2} पैकी {1}%.',
  'Lead built from': 'सुगावा कशावरून बांधला',
  'Scores {0}% above the next effective cut, {1}. Below roughly 10% that ordering is inside the noise of the lead weights and should not decide the target on its own.':
    'पुढच्या परिणामकारक छेदापेक्षा, म्हणजे {1} पेक्षा, {0}% अधिक गुण. साधारण 10% खाली हा क्रम सुगावा वजनांतील गोंधळाच्या आतच असतो आणि त्याने एकट्याने लक्ष्य ठरवू नये.',
  'The only entity in this chain whose removal stops the circulation — there is no second option to weigh it against.':
    'या साखळीतील एकमेव अशी संस्था, जिला हटवल्यावर फेरफटका थांबतो — तिच्याशी तोलण्यासारखा दुसरा पर्यायच नाही.',
  'Division — officer available?': 'विभाग — अधिकारी उपलब्ध आहे का?',
  'Share of chain value': 'साखळीच्या मूल्यातील वाटा',
  'No investigation officer is posted in {0} — {1} of the {2} divisions this chain crosses. This chain cannot be closed as a unit until one is: a deployment decision, not a scheduling one.':
    '{0} मध्ये तपास अधिकारी नियुक्त नाही — ही साखळी ओलांडत असलेल्या {2} विभागांपैकी {1}. तो नियुक्त होईपर्यंत ही साखळी एक एकक म्हणून बंद करता येणार नाही: हा तैनातीचा निर्णय आहे, वेळापत्रकाचा नव्हे.',
  'The gap falls on the cut point itself: {0}, the only entity ranked worth acting against here, sits in {1}. Posting an officer there is what unlocks {2}, not better scheduling.':
    'ही त्रुटी नेमकी छेदबिंदूवरच येते: इथे कारवाईयोग्य ठरलेली एकमेव संस्था {0} ही {1} मध्ये आहे. {2} खुले करते ती तिथे अधिकारी नेमणे, अधिक चांगले वेळापत्रक नव्हे.',
  '{0} days — one division per week across {1}': '{0} दिवस — {1} मध्ये आठवड्याला एक विभाग',
  '{0} — {1}% of what is still blockable': '{0} — अजून रोखता येण्याजोग्यापैकी {1}%',
  'signal age {0}d · {1} already utilised': 'संकेताचे वय {0} दि · {1} आधीच वापरलेले',
  'If each chain were worked one division per week rather than on a single date — {0}% of the {1} Cr still blockable.':
    'प्रत्येक साखळी एकाच तारखेला न हाताळता आठवड्याला एक विभाग या गतीने हाताळली, तर — अजून रोखता येण्याजोग्या {1} कोटींपैकी {0}%.',
  'Utilised downstream and no longer blockable by any action — {0}% of the {1} Cr of credit these chains carried, and {2}× everything coordination could still save.':
    'पुढच्या टप्प्यांत वापरले गेलेले आणि आता कोणत्याही कारवाईने रोखता न येणारे — या साखळ्यांनी वाहून नेलेल्या {1} कोटी श्रेयाच्या {0}%, आणि समन्वयाने अजून वाचवता येईल त्या सर्वाच्या {2}×.',

  /* == ITC Risk Intelligence ============================================ */
  'Input tax credit scored against the filing and payment behaviour of the entity claiming it. Every ratio here is set against the benchmark for that taxpayer’s own sector, because credit intensity is a property of the trade before it is a property of the taxpayer.':
    'निविष्ट कर श्रेय हे त्याचा दावा करणाऱ्या संस्थेच्या विवरण भरण्याच्या व भरणा करण्याच्या वर्तनाच्या तुलनेत गुणांकित केले आहे. इथले प्रत्येक गुणोत्तर त्या करदात्याच्या स्वतःच्या क्षेत्राच्या मानकाच्या तुलनेत मांडले आहे, कारण श्रेयाची तीव्रता ही करदात्याचा गुणधर्म असण्याआधी त्या व्यापाराचा गुणधर्म असते.',
  'ITC behind a risk signal': 'जोखीम संकेतामागील ITC',
  'Cr of ₹{0} Cr claimed in scope — {1}% of the credit':
    'व्याप्तीत दावा केलेल्या ₹{0} कोटींपैकी कोटी — श्रेयाच्या {1}%',
  'Taxpayers carrying an ITC signal': 'ITC संकेत असलेले करदाते',
  'of {0} in scope ({1}%) — the statewide rate is {2}%':
    'व्याप्तीतील {0} पैकी ({1}%) — राज्यव्यापी दर {2}% आहे',
  'ITC-to-turnover against sector benchmark': 'क्षेत्रीय मानकाच्या तुलनेत ITC-ते-उलाढाल',
  'against a {0}% benchmark for this mix of sectors — {1} pp above':
    'या क्षेत्रांच्या मिश्रणासाठीच्या {0}% मानकाच्या तुलनेत — {1} टक्केवारी बिंदूंनी वर',
  'against a {0}% benchmark for this mix of sectors — {1} pp below':
    'या क्षेत्रांच्या मिश्रणासाठीच्या {0}% मानकाच्या तुलनेत — {1} टक्केवारी बिंदूंनी खाली',
  'Concentration of flagged credit': 'चिन्हांकित श्रेयाचे संकेंद्रण',
  'of flagged ITC sits with the {0} largest claimants — where officer time returns most':
    'चिन्हांकित ITC पैकी इतके {0} सर्वात मोठ्या दावेदारांकडे आहे — जिथे अधिकाऱ्याच्या वेळेचा परतावा सर्वाधिक आहे',
  'Credit intensity against filing and payment behaviour':
    'विवरण व भरणा वर्तनाच्या तुलनेत श्रेयाची तीव्रता',
  'The combination this module exists to surface: credit taken now, by an entity whose return and payment behaviour does not support it. Read the last column first.':
    'हा घटक ज्या संयोगासाठी अस्तित्वात आहे तो हाच: आत्ता घेतलेले श्रेय, आणि ज्या संस्थेचे विवरण व भरणा वर्तन त्याला आधार देत नाही अशी संस्था. शेवटचा स्तंभ प्रथम वाचा.',
  'Filing behaviour': 'विवरण भरण्याचे वर्तन',
  '{0}% of those in scope': 'व्याप्तीतील {0}%',
  'ITC / turnover vs benchmark': 'ITC / उलाढाल विरुद्ध मानक',
  'Tax paid / turnover vs benchmark': 'भरलेला कर / उलाढाल विरुद्ध मानक',
  'ITC claimed': 'दावा केलेला ITC',
  '{0}% of credit in scope': 'व्याप्तीतील श्रेयाच्या {0}%',
  'Credit held against headcount': 'संख्येच्या तुलनेत धारण केलेले श्रेय',
  'A value above 1.0 in the last column means that filing class holds more of the credit than its share of the taxpayers — credit concentrating in the group least able to substantiate it. Below 1.0 it is the opposite, and the class is not where scrutiny belongs. The comparison is only valid inside the current filters: narrow to a district and the benchmark column moves with the sector mix of that district.':
    'शेवटच्या स्तंभातील 1.0 वरील मूल्य म्हणजे त्या विवरण वर्गाकडे करदात्यांतील त्याच्या वाट्याहून अधिक श्रेय आहे — म्हणजे श्रेय अशा गटात एकवटत आहे जो ते सिद्ध करण्यास सर्वात कमी सक्षम आहे. 1.0 खाली याच्या उलट, आणि त्या वर्गात छाननीचे स्थान नाही. ही तुलना केवळ सध्याच्या गाळण्यांच्या आतच वैध आहे: एका जिल्ह्यापुरते मर्यादित केले, तर त्या जिल्ह्यातील क्षेत्रांच्या मिश्रणानुसार मानक स्तंभही हलतो.',
  'ITC-to-turnover deviation by sector': 'क्षेत्रनिहाय ITC-ते-उलाढाल विचलन',
  'Bar height is the gap in percentage points between the ratio actually claimed in scope and that sector’s benchmark. Colour is the concentration of High / Critical taxpayers in the sector.':
    'स्तंभाची उंची म्हणजे व्याप्तीत प्रत्यक्षात दावा केलेले गुणोत्तर आणि त्या क्षेत्राचे मानक यांतील टक्केवारी बिंदूंतील अंतर. रंग म्हणजे त्या क्षेत्रातील उच्च / अतिगंभीर करदात्यांचे संकेंद्रण.',
  'Taxpayers in scope': 'व्याप्तीतील करदाते',
  'ITC / turnover claimed': 'दावा केलेले ITC / उलाढाल',
  'ITC / turnover': 'ITC / उलाढाल',
  'Sector benchmark': 'क्षेत्रीय मानक',
  Gap: 'अंतर',
  '+{0} pp': '+{0} टक्केवारी बिंदू',
  '{0} pp': '{0} टक्केवारी बिंदू',
  'A positive gap is worth an analyst’s attention only where the taxpayer count behind it is large enough to mean something — a sector carrying three taxpayers in scope will swing several percentage points on one claim, and that is variance rather than a finding.':
    'धन अंतर विश्लेषकाच्या लक्षास पात्र तेव्हाच ठरते जेव्हा त्यामागील करदात्यांची संख्या अर्थपूर्ण असण्याइतकी मोठी असते — व्याप्तीत तीन करदाते असलेले क्षेत्र एका दाव्यावरच कित्येक टक्केवारी बिंदू हलेल, आणि तो चढउतार आहे, निष्कर्ष नव्हे.',
  'No taxpayers match the current filters, so no sector comparison can be drawn.':
    'सध्याच्या गाळण्यांशी एकही करदाता जुळत नाही, त्यामुळे कोणतीही क्षेत्रीय तुलना काढता येत नाही.',
  '{0} of {1} taxpayers in scope ({2}%), carrying ₹{3} Cr of claimed credit.':
    'व्याप्तीतील {1} पैकी {0} करदाते ({2}%), ₹{3} कोटी दावा केलेले श्रेय धारण करणारे.',
  'What to do': 'काय करावे',
  'no sector benchmark on record': 'नोंदीवर क्षेत्रीय मानक नाही',
  '{0}% benchmark · {1}× it': '{0}% मानक · त्याच्या {1}×',
  '{0}% benchmark': '{0}% मानक',
  'Supplier risk: {0}': 'पुरवठादार जोखीम: {0}',
  'Exposure ₹{0} L': 'जोखीम रक्कम ₹{0} लाख',
  '₹{0} L exposure': '₹{0} लाख जोखीम रक्कम',
  'Evidence — {0} of the {1} encoded rules triggered':
    'पुरावा — {1} संकेतबद्ध नियमांपैकी {0} लागू झाले',
  '(+{0} of {1} points)': '({1} पैकी +{0} गुण)',
  'Period {0} ({1} – {2})': 'कालावधी {0} ({1} – {2})',

  /* == E-Way Bill Intelligence ========================================== */
  '{0} ({1}) generated e-way bills valued at ₹{2} L across {3} movement record(s) in the {4} district, of which {5} ({6}% of the value, ₹{7} L) were not matched to filed returns. The unmatched share across the whole feed is {8}%.':
    '{0} ({1}) यांनी {4} जिल्ह्यात {3} वाहतूक नोंदींमध्ये मिळून ₹{2} लाख मूल्याची ई-वे बिले तयार केली, त्यांपैकी {5} ({6}% मूल्य, ₹{7} लाख) दाखल विवरणांशी जुळली नाहीत. संपूर्ण स्रोतातील न जुळलेला वाटा {8}% आहे.',
  'Current taxpayer risk rating: {0} ({1}/100). Sector: {2}. Filing behaviour: {3}. Declared movement stands at {4}× declared turnover on the return record.':
    'सध्याचे करदाता जोखीम मानांकन: {0} ({1}/100). क्षेत्र: {2}. विवरण वर्तन: {3}. विवरण नोंदीवरील घोषित उलाढालीच्या {4}× इतकी घोषित वाहतूक आहे.',
  'Movement not matched to a return': 'विवरणाशी न जुळलेली वाहतूक',
  '{0}% of their ₹{1} L moved': 'त्यांनी हलवलेल्या ₹{1} लाखांपैकी {0}%',
  Consignments: 'खेपा',
  '{0} unmatched of {1}': '{1} पैकी {0} न जुळलेल्या',
  '{0} cancelled · {1} flagged': '{0} रद्द · {1} चिन्हांकित',
  'not on record': 'नोंदीवर नाही',
  'Declared movement / turnover': 'घोषित वाहतूक / उलाढाल',
  'Transit records checked against filings. The question this screen answers is how much declared goods movement has no filed return behind it, whose movement that is, and how that compares with the rest of the state.':
    'वाहतूक नोंदी दाखल विवरणांशी ताडून पाहिलेल्या. हा पडदा ज्या प्रश्नाचे उत्तर देतो तो असा: घोषित मालवाहतुकीपैकी किती वाहतुकीमागे दाखल विवरणच नाही, ती वाहतूक कोणाची आहे, आणि उर्वरित राज्याच्या तुलनेत ते कसे दिसते.',
  'Movement with no matching return': 'जुळणारे विवरण नसलेली वाहतूक',
  '₹ Lakh of ₹{0} L moved in scope — {1}% of the value, against {2}% of records statewide':
    'व्याप्तीत हलवलेल्या ₹{0} लाखांपैकी ₹ लाख — मूल्याच्या {1}%, तर राज्यभरातील नोंदींपैकी {2}%',
  'Taxpayers behind the unmatched movement': 'न जुळलेल्या वाहतुकीमागील करदाते',
  'of {0} with movement in scope — this, not the consignment, is the unit of action':
    'व्याप्तीत वाहतूक असलेल्या {0} पैकी — कारवाईचे एकक खेप नव्हे, हेच आहे',
  'Records carrying an anomaly flag': 'विसंगती खूण असलेल्या नोंदी',
  'of {0} records ({1}%) — the statewide rate is {2}%':
    '{0} नोंदींपैकी ({1}%) — राज्यव्यापी दर {2}% आहे',
  'Cancellation rate': 'रद्द होण्याचा दर',
  '% — {0} of {1} records, ₹{2} L cancelled; statewide {3}%':
    '% — {1} पैकी {0} नोंदी, ₹{2} लाख रद्द; राज्यभर {3}%',
  'Unmatched movement value by period': 'कालावधीनिहाय न जुळलेल्या वाहतुकीचे मूल्य',
  'Value with no matching filed return, against a total of ₹{0} L moved in scope. Total movement rises and falls with trade; the unmatched share is what an officer is being asked to act on.':
    'जुळणारे दाखल विवरण नसलेले मूल्य, व्याप्तीत हलवलेल्या एकूण ₹{0} लाखांच्या तुलनेत. एकूण वाहतूक व्यापारासोबत वरखाली होते; अधिकाऱ्याला ज्यावर कारवाई करायची आहे तो न जुळलेला वाटा आहे.',
  '{0}: ₹{1} L unmatched of ₹{2} L ({3}%)': '{0}: ₹{2} लाखांपैकी ₹{1} लाख न जुळलेले ({3}%)',
  'District-wise unmatched rate': 'जिल्हानिहाय न जुळण्याचा दर',
  'Share of each district’s consignments with no matching return. The statewide rate is {0}% — a district below it is not a priority however many records it carries.':
    'प्रत्येक जिल्ह्याच्या खेपांपैकी जुळणारे विवरण नसलेल्यांचा वाटा. राज्यव्यापी दर {0}% आहे — त्याखालील जिल्हा कितीही नोंदी धारण करत असला तरी प्राधान्याचा नाही.',
  'Bars above {0}% are above the statewide unmatched rate. Districts with very few records will sit at 0% or 100% for reasons that are not risk — read the record count alongside.':
    '{0}% वरील स्तंभ राज्यव्यापी न जुळण्याच्या दरापेक्षा वर आहेत. फार थोड्या नोंदी असलेले जिल्हे जोखमीखेरीज इतर कारणांनी 0% किंवा 100% वर बसतील — सोबत नोंदींची संख्याही वाचा.',
  'Taxpayers ranked by unmatched movement': 'न जुळलेल्या वाहतुकीनुसार करदात्यांचा क्रम',
  '{0} taxpayers with at least one unmatched, cancelled or flagged consignment, ranked by the value with no return behind it.':
    'किमान एक न जुळलेली, रद्द झालेली किंवा चिन्हांकित खेप असलेले {0} करदाते, विवरणच नसलेल्या मूल्यानुसार क्रमवार.',
  'No taxpayer in the current filters carries an unmatched, cancelled or flagged consignment.':
    'सध्याच्या गाळण्यांतील एकाही करदात्याकडे न जुळलेली, रद्द झालेली किंवा चिन्हांकित खेप नाही.',
  'Not available on this platform: a period reconciliation of consignment value against declared outward supply. The e-way feed here carries individual consignments dated across a rolling window, while the return record carries a single monthly turnover figure per taxpayer — summing one against the other would compare two different periods and produce a mismatch out of arithmetic rather than behaviour. The match status shown is the one the e-way feed itself carries. A true reconciliation needs GSTR-1 outward supply at invoice level for the same tax period, which this platform does not hold. The "declared movement / turnover" column is the one like-for-like ratio available, and it comes from the taxpayer’s own return record rather than from these consignments.':
    'या मंचावर उपलब्ध नाही: घोषित जावक पुरवठ्याच्या तुलनेत खेप मूल्याचा कालावधीनिहाय ताळमेळ. इथला ई-वे स्रोत सरकत्या कालपटातील वेगवेगळ्या तारखांच्या स्वतंत्र खेपा धरतो, तर विवरण नोंद प्रत्येक करदात्याचा एकच मासिक उलाढाल आकडा धरते — एकाची दुसऱ्याशी बेरीज केल्यास दोन वेगळे कालावधी तोलले जातील आणि वर्तनातून नव्हे तर अंकगणितातून विसंगती निर्माण होईल. दाखवलेली जुळणीची स्थिती हीच ई-वे स्रोताने स्वतः दिलेली आहे. खऱ्या ताळमेळासाठी त्याच करकालावधीचा बीजक पातळीवरील GSTR-1 जावक पुरवठा लागतो, जो या मंचाकडे नाही. "घोषित वाहतूक / उलाढाल" हा एकमेव समरूप गुणोत्तर उपलब्ध स्तंभ असून तो या खेपांतून नव्हे, तर करदात्याच्या स्वतःच्या विवरण नोंदीतून येतो.',
  'Consignment register': 'खेप नोंदवही',
  '{0} of {1} records in scope carry an anomaly flag, a cancellation, or no matching return. Use this to check a specific movement; use the ranking above to decide who to open.':
    'व्याप्तीतील {1} पैकी {0} नोंदींवर विसंगती खूण, रद्दीकरण, किंवा जुळणारे विवरणच नाही. एखादी विशिष्ट वाहतूक तपासण्यासाठी हे वापरा; कोणावर प्रकरण उघडायचे हे ठरवण्यासाठी वरील क्रमवारी वापरा.',
  Age: 'वय',

  /* == Compliance Early Warning ========================================= */
  'Non-filers and slipping compliance, surfaced before the shortfall compounds. Every alert below carries how long it has been open and what is at stake behind it, because an early warning that has sat unworked for a quarter is no longer early.':
    'विवरण न भरणारे आणि ढासळते अनुपालन, तूट चक्रवाढीने वाढण्यापूर्वीच समोर आणलेले. खालील प्रत्येक सूचनेसोबत ती किती काळ प्रलंबित आहे आणि तिच्यामागे काय पणाला लागले आहे हे दिले आहे, कारण एक तिमाही काम न होता पडून राहिलेली पूर्वसूचना ही आता पूर्वसूचना उरत नाही.',
  'Unresolved alerts': 'निकाली न निघालेल्या सूचना',
  'of {0} in scope ({1}%) — ₹{2} Cr of exposure across {3} taxpayers':
    'व्याप्तीतील {0} पैकी ({1}%) — {3} करदात्यांमध्ये मिळून ₹{2} कोटी जोखीम रक्कम',
  'Open non-filer alerts': 'विवरण न भरल्याच्या प्रलंबित सूचना',
  '{0} taxpayers carrying ₹{1} Cr of monthly turnover with no return filed — the base the shortfall compounds on':
    'एकही विवरण दाखल न करता ₹{1} कोटी मासिक उलाढाल धारण करणारे {0} करदाते — तूट ज्यावर चक्रवाढीने वाढते तो पाया',
  'Open longer than 60 days': '60 दिवसांहून अधिक काळ प्रलंबित',
  'of {0} unresolved ({1}%) — ₹{2} Cr behind them; the median unresolved alert is {3} days old':
    'निकाली न निघालेल्या {0} पैकी ({1}%) — त्यांच्यामागे ₹{2} कोटी; मध्यक निकाली न निघालेली सूचना {3} दिवस जुनी आहे',
  '{0}% of alerts in scope — the statewide resolution rate is {1}%':
    'व्याप्तीतील सूचनांपैकी {0}% — राज्यव्यापी निपटारा दर {1}% आहे',
  'How long the unresolved queue has been waiting':
    'निकाली न निघालेली रांग किती काळ वाट पाहत आहे',
  '{0} unresolved alerts, banded by age. The band an alert falls into decides what should happen to it, not the alert type.':
    'निकाली न निघालेल्या {0} सूचना, वयानुसार पट्ट्यांत. सूचनेचे काय करायचे हे तिचा प्रकार नव्हे, तर ती कोणत्या पट्ट्यात येते ते ठरवते.',
  'Age band': 'वयाचा पट्टा',
  Alerts: 'सूचना',
  '{0}% of unresolved': 'निकाली न निघालेल्यांपैकी {0}%',
  'What it means': 'याचा अर्थ',
  'Exposure is summed over distinct taxpayers, not over alerts — most taxpayers here carry more than one signal, and summing per alert would count the same entity several times.':
    'जोखीम रक्कम सूचनांवर नव्हे, तर वेगवेगळ्या करदात्यांवर बेरीज केली आहे — इथले बहुतांश करदाते एकाहून अधिक संकेत धारण करतात, आणि सूचनानिहाय बेरीज केल्यास तीच संस्था अनेकदा मोजली जाईल.',
  'Alert inflow': 'सूचनांची आवक',
  'Alerts raised per 8-day period over the last ~48 days, out of {0} in scope. A rising inflow against a static resolution rate is a staffing signal, not a risk one.':
    'गेल्या सुमारे 48 दिवसांत दर 8 दिवसांच्या कालावधीत उभ्या राहिलेल्या सूचना, व्याप्तीतील {0} पैकी. स्थिर निपटारा दराच्या तुलनेत वाढती आवक हा मनुष्यबळाचा संकेत आहे, जोखमीचा नव्हे.',
  'Alerts by type — the value and recommended action for each are in the table below.':
    'प्रकारानुसार सूचना — प्रत्येकाचे मूल्य आणि शिफारस केलेली कार्यवाही खालील तक्त्यात आहे.',
  'Alert types — what each is worth and what to do about it':
    'सूचनांचे प्रकार — प्रत्येकाचे मूल्य किती आणि त्याचे काय करावे',
  '{0} of the {1} signal types are firing in the current scope, ranked by the exposure behind them rather than by count.':
    'सध्याच्या व्याप्तीत {1} पैकी {0} संकेत प्रकार लागू होत आहेत, संख्येनुसार नव्हे तर त्यांच्यामागील जोखीम रकमेनुसार क्रमवार.',
  Signal: 'संकेत',
  '{0} open of {1}': '{1} पैकी {0} प्रलंबित',
  '{0}% of all alerts in scope': 'व्याप्तीतील सर्व सूचनांपैकी {0}%',
  'Median age, open': 'प्रलंबितांचे मध्यक वय',
  'Recommended action': 'शिफारस केलेली कार्यवाही',
  '{0} of {1} taxpayers in scope are firing three or more distinct signals at once, carrying ₹{2} Cr.':
    'व्याप्तीतील {1} पैकी {0} करदात्यांवर एकाच वेळी तीन किंवा अधिक वेगवेगळे संकेत लागू होत आहेत, आणि ते ₹{2} कोटी धारण करतात.',
  'One signal is a lapse. Three at once, in the same window, is a trajectory — and it is the population this screen exists to reach before the shortfall compounds. These should be worked ahead of any single-signal alert of the same age, whatever their individual risk scores say.':
    'एक संकेत म्हणजे चूक. एकाच कालपटात एकाच वेळी तीन म्हणजे दिशा — आणि तूट चक्रवाढीने वाढण्यापूर्वी ज्यांच्यापर्यंत पोहोचण्यासाठी हा पडदा अस्तित्वात आहे तीच ही संख्या. त्यांचे वैयक्तिक जोखीम गुण काहीही सांगोत, त्याच वयाच्या एक-संकेती सूचनेच्या आधी यांच्यावर काम व्हावे.',
  '{0} signals': '{0} संकेत',
  'oldest {0} days': 'सर्वात जुनी {0} दिवस',
  'and {0} more': 'आणि आणखी {0}',
  'Showing {0} of {1} alerts in scope. Sort by age to find the ones the outreach never reached.':
    'व्याप्तीतील {1} पैकी {0} सूचना दाखवत आहोत. संपर्क कधीच न पोहोचलेल्या सूचना शोधण्यासाठी वयानुसार क्रम लावा.',
  '{0} days old': '{0} दिवस जुनी',
  'Open {0} days, raised {1}': '{0} दिवस प्रलंबित, {1} रोजी उभी राहिली',
  'Other signals on this taxpayer': 'या करदात्यावरील इतर संकेत',
  '{0} of {1} types': '{1} प्रकारांपैकी {0}',

  /* == Refund Risk Intelligence ========================================= */
  'Refund claims ranked by risk before sanction. Refund intensity is read against the benchmark for the claimant’s own sector rather than as an absolute percentage — a 15% refund ratio is ordinary in import/export and extreme in professional services.':
    'मंजुरीपूर्वी जोखमीनुसार क्रमवार लावलेले परतावा दावे. परताव्याची तीव्रता निरपेक्ष टक्केवारी म्हणून न वाचता दावेदाराच्या स्वतःच्या क्षेत्राच्या मानकाच्या तुलनेत वाचली जाते — 15% परतावा गुणोत्तर आयात/निर्यातीत सामान्य आणि व्यावसायिक सेवांत टोकाचे आहे.',
  Claimed: 'दावा केलेले',
  'Refund / turnover vs sector benchmark': 'परतावा / उलाढाल विरुद्ध क्षेत्रीय मानक',
  'benchmark {0}% · {1}× it': 'मानक {0}% · त्याच्या {1}×',
  'Days since filing': 'दाखल केल्यापासूनचे दिवस',
  'Claimant filing behaviour': 'दावेदाराचे विवरण वर्तन',
  'Value awaiting a decision': 'निर्णयाच्या प्रतीक्षेतील मूल्य',
  '₹ Lakh across {0} claims — {1}% of the ₹{2} L claimed in scope':
    '{0} दाव्यांमध्ये मिळून ₹ लाख — व्याप्तीत दावा केलेल्या ₹{2} लाखांपैकी {1}%',
  'High-risk claims': 'उच्च जोखमीचे दावे',
  'of {0} claims ({1}%), holding {2}% of the claimed value':
    '{0} दाव्यांपैकी ({1}%), दावा केलेल्या मूल्याच्या {2}% धारण करणारे',
  'Refund-to-turnover against sector benchmark': 'क्षेत्रीय मानकाच्या तुलनेत परतावा-ते-उलाढाल',
  'Claims above the sector band': 'क्षेत्रीय पट्ट्यावरील दावे',
  'at {0}× benchmark or more — {1}% of claims, ₹{2} L; this is the threshold the encoded refund rule uses':
    'मानकाच्या {0}× किंवा अधिक — दाव्यांपैकी {1}%, ₹{2} लाख; संकेतबद्ध परतावा नियम हाच उंबरठा वापरतो',
  'Refund intensity by sector, against that sector’s benchmark':
    'क्षेत्रनिहाय परतावा तीव्रता, त्या क्षेत्राच्या मानकाच्या तुलनेत',
  'Bar height is the gap in percentage points between the ratio claimed and the sector benchmark. A positive gap on a sector carrying few claims is variance, not a finding — read the claim count alongside it.':
    'स्तंभाची उंची म्हणजे दावा केलेले गुणोत्तर आणि क्षेत्रीय मानक यांतील टक्केवारी बिंदूंतील अंतर. थोडे दावे असलेल्या क्षेत्रावरील धन अंतर हा चढउतार आहे, निष्कर्ष नव्हे — सोबत दाव्यांची संख्याही वाचा.',
  Claims: 'दावे',
  'Refund / turnover': 'परतावा / उलाढाल',
  'Multiple of benchmark': 'मानकाच्या पटी',
  'Claims above band': 'पट्ट्यावरील दावे',
  'Claims by multiple of the sector benchmark': 'क्षेत्रीय मानकाच्या पटींनुसार दावे',
  'Bands are relative to the claimant’s own sector, not absolute. The benchmark refund ratio runs from 1% to 21% across these sectors, so a flat percentage band would put an ordinary exporter and an extreme domestic claim in the same bucket.':
    'पट्टे दावेदाराच्या स्वतःच्या क्षेत्राच्या तुलनेत आहेत, निरपेक्ष नाहीत. या क्षेत्रांमध्ये मानक परतावा गुणोत्तर 1% ते 21% पर्यंत जाते, त्यामुळे सपाट टक्केवारी पट्ट्याने सामान्य निर्यातदार आणि टोकाचा देशांतर्गत दावा एकाच कप्प्यात पडतील.',
  '{0} claims · ₹{1} L · {2}% of claims in scope':
    '{0} दावे · ₹{1} लाख · व्याप्तीतील दाव्यांपैकी {2}%',
  'At {0}× and above, the encoded refund rule fires and contributes to the taxpayer’s risk score — so those claims are already reflected in the Risk column of the register and should not be counted as a second, independent signal.':
    '{0}× आणि त्यावर संकेतबद्ध परतावा नियम लागू होतो आणि करदात्याच्या जोखीम गुणांत भर घालतो — त्यामुळे ते दावे नोंदवहीच्या जोखीम स्तंभात आधीच उमटले आहेत आणि त्यांना दुसरा, स्वतंत्र संकेत म्हणून मोजू नये.',
  '{0} claims in scope. Median claim has been pending {1} days since filing; the oldest, {2} days.':
    'व्याप्तीत {0} दावे. मध्यक दावा दाखल केल्यापासून {1} दिवस प्रलंबित आहे; सर्वात जुना, {2} दिवस.',
  'Days since filing is stated without a deadline against it. This platform does not encode the statutory refund timeline — the limitation engine covers assessment proceedings under sections 73, 74 and 74A only — so no claim here is described as overdue, and the ageing column is a workload signal rather than a statutory one.':
    'दाखल केल्यापासूनचे दिवस कोणतीही मुदत समोर न ठेवता सांगितले आहेत. हा मंच सांविधिक परतावा कालमर्यादा संकेतबद्ध करत नाही — परिसीमा यंत्र केवळ कलम 73, 74 आणि 74A खालील निर्धारण कार्यवाही व्यापते — त्यामुळे इथला कोणताही दावा मुदतबाह्य म्हणून वर्णिलेला नाही, आणि वयाचा स्तंभ हा सांविधिक नव्हे तर कामाच्या भाराचा संकेत आहे.',
  'Not available on this platform: repeat-claim detection. Identifying a taxpayer claiming refund period after period requires a refund history keyed by GSTIN and period, and this dataset holds one claim per taxpayer. A high-value threshold was previously shown in this position as a proxy for it; a large single claim is not a repeat pattern, so the figure has been removed rather than relabelled.':
    'या मंचावर उपलब्ध नाही: पुनरावृत्त दाव्यांचा शोध. कालावधीमागून कालावधी परताव्याचा दावा करणारा करदाता ओळखण्यासाठी GSTIN आणि कालावधीनुसार नोंदलेला परतावा इतिहास लागतो, आणि या माहिती संचात प्रत्येक करदात्यामागे एकच दावा आहे. याच जागी पूर्वी त्याचा पर्याय म्हणून उच्च मूल्याचा उंबरठा दाखवला जात होता; एकच मोठा दावा म्हणजे पुनरावृत्तीचा नमुना नव्हे, त्यामुळे तो आकडा नवे नाव देऊन ठेवण्याऐवजी काढून टाकला आहे.',
  '{0}× the sector benchmark': 'क्षेत्रीय मानकाच्या {0}×',
  '{0}% — no sector benchmark': '{0}% — क्षेत्रीय मानक नाही',
  '{0}% against {1}% benchmark': '{1}% मानकाच्या तुलनेत {0}%',
  '{0} — {1} days ago': '{0} — {1} दिवसांपूर्वी',

  /* Constant-declared recommendations and band labels passed to t(variable). */
  'Confirm the registered sector is correct first — a misclassified taxpayer deviates from the wrong benchmark and is not a case.':
    'आधी नोंदणीकृत क्षेत्र बरोबर आहे का याची खात्री करा — चुकीचे वर्गीकरण झालेला करदाता चुकीच्या मानकापासून विचलित होतो आणि ते प्रकरण ठरत नाही.',
  'Route to Network Intelligence rather than acting alone — a chain is broken at one entity, and which one is a question that screen answers.':
    'एकट्याने कारवाई करण्याऐवजी नेटवर्क इंटेलिजन्सकडे पाठवा — साखळी एकाच संस्थेवर तुटते, आणि ती कोणती हा प्रश्न तो पडदाच सोडवतो.',
  'Verify the upstream supplier’s own filing status before treating the credit as available — a credit is only as good as the return behind it.':
    'श्रेय उपलब्ध मानण्यापूर्वी वरच्या टप्प्यातील पुरवठादाराची स्वतःची विवरण स्थिती पडताळा — श्रेयाची किंमत त्याच्यामागील विवरणाइतकीच असते.',
  'Early warning has failed on these. They belong in the enforcement pipeline rather than in an outreach queue.':
    'यांच्याबाबत पूर्वसूचना अपयशी ठरली आहे. ती संपर्क रांगेत नव्हे, तर अंमलबजावणी मालिकेत जायला हवीत.',
  'No longer early. A quarter of filing periods has passed and the shortfall has compounded through each of them.':
    'आता ही पूर्वसूचना राहिलेली नाही. विवरण कालावधींची एक तिमाही उलटली असून प्रत्येक कालावधीत तूट चक्रवाढीने वाढत गेली आहे.',
  'Older than 90 days': '90 दिवसांहून जुनी',
  'Outreach has had time to work. Where it has not, this is where officer review belongs.':
    'संपर्काला काम करण्यास पुरेसा वेळ मिळाला आहे. जिथे तो चालला नाही, तिथेच अधिकारी पुनर्विलोकनाचे स्थान आहे.',
  'Raised within 30 days': '30 दिवसांत उभी राहिलेली',
  'Still early. Automated outreach resolves most of these without any officer time.':
    'अजूनही पूर्वसूचनेचा टप्पा. यांपैकी बहुतांश स्वयंचलित संपर्कानेच, अधिकाऱ्याचा वेळ न लागता निकाली निघतात.',
  'Below sector benchmark': 'क्षेत्रीय मानकाखाली',
  'No sector benchmark on record': 'नोंदीवर क्षेत्रीय मानक नाही',

  /* == Network enforcement — short lines ============================ */
  'Circular invoice chains, and which entity actually stops each one.':
    'वर्तुळाकार बीजक साखळ्या, आणि प्रत्येक साखळी नेमकी कोणती संस्था थांबवते.',
  'Lost before detection — this sets the scale of everything below.':
    'शोधापूर्वीच गमावलेले — खालील सर्व गोष्टींचे प्रमाण हेच ठरवते.',
  'Act first on the chain every division in its span can close on one date.':
    'ज्या साखळीचे सर्व विभाग एकाच तारखेला बंद करू शकतात तिच्यावर आधी कारवाई करा.',
  'Ranked by blockable value — but only workable where an officer can act.':
    'रोखता येण्याजोग्या मूल्यानुसार क्रम — पण अधिकारी कारवाई करू शकेल तिथेच हाताळता येते.',
  'Where the margin is small, the ordering is inside the noise.':
    'आघाडी लहान असेल तिथे क्रम हा गोंधळाच्या आतच असतो.',
  'A closed loop: removing any one entity breaks it, so lead strength decides.':
    'बंद वर्तुळ: कोणतीही एक संस्था हटवली तरी ते तुटते, त्यामुळे सुगाव्याची ताकद ठरवते.',
  'One economic unit, several jurisdictions — the chain crosses divisions.':
    'एक आर्थिक एकक, अनेक अधिकारक्षेत्रे — साखळी विभाग ओलांडते.',
  'A deployment decision, not a scheduling one.':
    'हा तैनातीचा निर्णय आहे, वेळापत्रकाचा नव्हे.',
  'The gap is on the cut point itself — posting an officer there unlocks it.':
    'त्रुटी नेमकी छेदबिंदूवरच आहे — तिथे अधिकारी नेमल्याने ती खुली होते.',
  'Already utilised downstream — no action can block it now.':
    'पुढच्या टप्प्यांत आधीच वापरलेले — आता कोणतीही कारवाई ते रोखू शकत नाही.',
  'The coordination loss is small, and stated as such rather than headlined.':
    'समन्वयातील हानी लहान आहे, आणि ती मथळा न करता तशीच सांगितली आहे.',
  'Centrality says how important a node looks, not whether removing it works.':
    'केंद्रीयता नोड किती महत्त्वाचा दिसतो हे सांगते, तो हटवल्याने काम होते का हे नाही.',

  /* == E-way and refund — short lines ============================ */
  'Declared movement with no filed return behind it, and whose it is.':
    'जिच्यामागे दाखल विवरण नाही अशी घोषित वाहतूक, आणि ती कोणाची आहे.',
  'Total movement follows trade; the unmatched share is what to act on.':
    'एकूण वाहतूक व्यापारासोबत बदलते; कारवाई करायची ती न जुळलेल्या वाट्यावर.',
  'A district below the statewide rate is not a priority, whatever its volume.':
    'राज्यव्यापी दराखालील जिल्हा, त्याचे प्रमाण कितीही असो, प्राधान्याचा नाही.',
  'Not available: a period reconciliation against declared outward supply.':
    'उपलब्ध नाही: घोषित जावक पुरवठ्याच्या तुलनेत कालावधीनिहाय ताळमेळ.',
  'Use this to check one movement; use the ranking above to decide who to open.':
    'एखादी वाहतूक तपासण्यासाठी हे वापरा; कोणावर प्रकरण उघडायचे यासाठी वरील क्रमवारी.',
  'Refund intensity against the claimant\'s own sector, not as a flat percentage.':
    'परताव्याची तीव्रता दावेदाराच्या स्वतःच्या क्षेत्राच्या तुलनेत, सपाट टक्केवारी म्हणून नव्हे.',
  'A positive gap on few claims is variance — read the claim count with it.':
    'थोड्या दाव्यांवरील धन अंतर हा चढउतार आहे — सोबत दाव्यांची संख्याही वाचा.',
  'Bands are relative to each sector, which runs from 1% to 21%.':
    'पट्टे प्रत्येक क्षेत्राच्या तुलनेत, जे 1% ते 21% पर्यंत जाते.',
  'Already counted in the Risk column — not a second, independent signal.':
    'जोखीम स्तंभात आधीच मोजलेले — हा दुसरा, स्वतंत्र संकेत नव्हे.',
  'No statutory refund clock is encoded, so nothing here is overdue.':
    'सांविधिक परतावा घड्याळ संकेतबद्ध केलेले नाही, त्यामुळे इथले काहीही मुदतबाह्य नाही.',
  'Not available: repeat-claim detection needs a history keyed by period.':
    'उपलब्ध नाही: पुनरावृत्त दाव्यांच्या शोधासाठी कालावधीनुसार नोंदलेला इतिहास लागतो.',
  'No auto-reject. Claims can only be routed to an officer.':
    'स्वयंचलित नकार नाही. दावे केवळ अधिकाऱ्याकडे पाठवता येतात.',

  /* == Unknown risk, ITC and early warning — short lines ============================ */
  'What the encoded rules do not look for — the unflagged population.':
    'संकेतबद्ध नियम ज्याचा शोध घेत नाहीत ते — चिन्हांकित नसलेली संख्या.',
  'Never scored: a peer median from a handful of businesses is not a norm.':
    'कधीही गुणांकित नाही: मूठभर व्यवसायांवरून काढलेला समकक्ष मध्यक हे मानक नव्हे.',
  'No unflagged taxpayer reaches the threshold; flagged ones pass it easily.':
    'चिन्हांकित नसलेला एकही करदाता उंबरठ्यापर्यंत पोहोचत नाही; चिन्हांकित सहज ओलांडतात.',
  'How narrow the miss is does not change what should be done with it.':
    'किती थोडक्यात हुकले यावरून त्याचे काय करावे हे बदलत नाही.',
  'Lowering the threshold would report ordinary variation as a discovery.':
    'उंबरठा खाली आणल्यास सामान्य चढउतारच शोध म्हणून नोंदवला जाईल.',
  'Credit scored against the filing and payment behaviour behind it.':
    'श्रेय त्यामागील विवरण व भरणा वर्तनाच्या तुलनेत गुणांकित.',
  'Credit taken now, by an entity whose behaviour does not support it.':
    'आत्ता घेतलेले श्रेय, आणि ज्या संस्थेचे वर्तन त्याला आधार देत नाही अशी संस्था.',
  'Above 1.0 means credit is concentrating where it is least substantiated.':
    '1.0 वर म्हणजे श्रेय जिथे सर्वात कमी सिद्ध होते तिथे एकवटत आहे.',
  'The gap between what was claimed and that sector\'s own benchmark.':
    'दावा केलेले आणि त्या क्षेत्राचे स्वतःचे मानक यांतील अंतर.',
  'Slipping compliance, surfaced before the shortfall compounds.':
    'ढासळते अनुपालन, तूट चक्रवाढीने वाढण्यापूर्वी समोर आणलेले.',
  'Summed over taxpayers, not alerts — most carry more than one signal.':
    'सूचनांवर नव्हे, करदात्यांवर बेरीज — बहुतांश एकाहून अधिक संकेत धारण करतात.',
  'A rising inflow against a static resolution rate is a staffing signal.':
    'स्थिर निपटारा दराच्या तुलनेत वाढती आवक हा मनुष्यबळाचा संकेत आहे.',
  'One signal is a lapse; three at once is a trajectory.':
    'एक संकेत म्हणजे चूक; एकाच वेळी तीन म्हणजे दिशा.',

  /* == Unknown risk — short lines ============================ */
  'Each ratio against the median of the taxpayer’s own sector, on a modified z.':
    'प्रत्येक गुणोत्तर करदात्याच्या स्वतःच्या क्षेत्राच्या मध्यकाच्या तुलनेत, सुधारित z वर.',
  'Every ratio here is already an encoded rule, so the extreme tail is taken.':
    'इथले प्रत्येक गुणोत्तर आधीच संकेतबद्ध नियम आहे, त्यामुळे टोकाचा भाग आधीच घेतलेला आहे.',
  'The method is correct; the empty result is the finding.':
    'पद्धत बरोबर आहे; रिकामा निकाल हाच निष्कर्ष आहे.'
})
