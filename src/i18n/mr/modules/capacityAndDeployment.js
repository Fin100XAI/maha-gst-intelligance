import { registerMessages } from '../../locale.js'

/**
 * Marathi — Officer Capacity & Deployment.
 *
 *   capacity      → क्षमता
 *   deployment    → नियुक्ती
 *   eligibility   → पात्रता
 *   allocation    → वाटप
 *   officer-day   → अधिकारी-दिवस
 *   pool          → संच
 *   residual      → शिल्लक
 */
registerMessages('mr', {
  'Leadership · Deployment': 'नेतृत्व · नियुक्ती',
  'Officer Capacity & Deployment': 'अधिकारी क्षमता व नियुक्ती',
  'A week of officer capacity allocated against eligibility that is territorially and functionally binding, with limitation-critical work assigned before anything else competes for it. The finding is the residual — what nobody eligible can reach, and which specific constraint is responsible.':
    'एका आठवड्याची अधिकारी क्षमता, प्रादेशिक व कार्यात्मक दृष्ट्या बंधनकारक पात्रतेनुसार वाटलेली, आणि मुदतीच्या दृष्टीने निर्णायक काम इतर कशाशीही स्पर्धा करण्यापूर्वी नेमलेले. निष्कर्ष म्हणजे शिल्लक — ज्यापर्यंत कोणीही पात्र पोहोचू शकत नाही, आणि नेमकी कोणती मर्यादा त्यास कारणीभूत आहे.',
  'The allocation is a single statewide optimisation under territorial and role eligibility. Narrowing its input would re-run it on a subset and change every figure — a different answer presented as the same one — so it is computed across all divisions and the division breakdown below is where a single division is read.':
    'हे वाटप म्हणजे प्रादेशिक व पदनिहाय पात्रतेखालील एकच राज्यव्यापी अनुकूलन आहे. त्याची माहिती मर्यादित केल्यास ते उपसंचावर पुन्हा चालेल आणि प्रत्येक आकडा बदलेल — वेगळे उत्तर तेच म्हणून सादर होईल — म्हणून ते सर्व विभागांसाठी परिगणित केले जाते आणि खालील विभागनिहाय विभागणी हीच एका विभागाची माहिती वाचण्याची जागा आहे.',
  '{0}% of departmental capacity is used, and {1} cases worth {2} still cannot be worked this week.':
    'विभागाच्या क्षमतेपैकी {0}% वापरली जाते, तरीही {2} मूल्याची {1} प्रकरणे या आठवड्यात हाताळता येत नाहीत.',
  'These two facts are not in tension — they are the same fact. An unused officer-day in one division cannot be spent in another, and an audit officer cannot take an investigation case. Aggregate utilisation is the figure to distrust; the pools below are where the decision actually sits.':
    'या दोन बाबी परस्परविरोधी नाहीत — त्या एकच बाब आहेत. एका विभागातील न वापरलेला अधिकारी-दिवस दुसऱ्या विभागात वापरता येत नाही, आणि लेखापरीक्षा अधिकारी तपास प्रकरण घेऊ शकत नाही. एकत्रित वापराचा आकडाच अविश्वसनीय आहे; निर्णय प्रत्यक्षात खालील संचांमध्ये आहे.',
  '{0} of them are inside the statutory window and will be time-barred if not reached.':
    'त्यांपैकी {0} सांविधिक मुदतीच्या आत आहेत आणि त्यांपर्यंत न पोहोचल्यास ती मुदतबाह्य होतील.',
  'Field officers': 'क्षेत्रीय अधिकारी',
  '{0} case-days available': '{0} प्रकरण-दिवस उपलब्ध',
  'Cases placed': 'नेमलेली प्रकरणे',
  'of {0} workable': '{0} हाताळण्यायोग्यांपैकी',
  'Capacity spent': 'वापरलेली क्षमता',
  'of {0} days': '{0} दिवसांपैकी',
  'Recoverable value placed': 'नेमलेले वसूलपात्र मूल्य',
  '₹ Cr this week': '₹ कोटी या आठवड्यात',
  'How good is this allocation?': 'हे वाटप किती चांगले आहे?',
  'Generalised assignment is NP-hard. This is a greedy heuristic, and rather than assert optimality it is measured against a bound that is unreachable by construction.':
    'सामान्यीकृत नेमणूक ही NP-hard समस्या आहे. हे एक लोभी अनुमान आहे, आणि सर्वोत्तमतेचा दावा करण्याऐवजी ते अशा मर्यादेशी मोजले जाते जी रचनेनुसारच गाठता येत नाही.',
  'Achieved — this allocation': 'साध्य — हे वाटप',
  'Real. Every case respects division, role and effort.': 'वास्तविक. प्रत्येक प्रकरण विभाग, पद व श्रम यांचे पालन करते.',
  'Relaxed upper bound': 'शिथिल केलेली कमाल मर्यादा',
  'Unreachable. Ignores eligibility and allows cases to be split.':
    'गाठता न येणारी. पात्रता दुर्लक्षित करते आणि प्रकरणे विभागण्यास परवानगी देते.',
  'Share of the bound captured': 'मर्यादेपैकी साध्य वाटा',
  'The true optimum lies between the two figures.': 'खरे सर्वोत्तम या दोन आकड्यांदरम्यान आहे.',
  'Allocation for the coming week': 'येत्या आठवड्याचे वाटप',
  'Limitation-critical cases were placed first and ordered by expiry date, not by value. Everything else competed for the capacity that survived, ranked by recoverable value per officer-day.':
    'मुदतीच्या दृष्टीने निर्णायक प्रकरणे प्रथम नेमली आणि मुदत संपण्याच्या तारखेनुसार लावली, मूल्यानुसार नाही. उर्वरित सर्वांनी शिल्लक क्षमतेसाठी स्पर्धा केली, प्रति अधिकारी-दिवस वसूलपात्र मूल्याच्या क्रमाने.',
  'Assigned to': 'नेमून दिले',
  'Statutory — {0}d': 'सांविधिक — {0} दि.',
  'Value per day': 'प्रति दिवस मूल्य',
  Days: 'दिवस',
  Recoverable: 'वसूलपात्र',
  '{0} cases · {1} of recoverable value at stake': '{0} प्रकरणे · {1} वसूलपात्र मूल्य पणाला',
  'What would actually fix this': 'हे प्रत्यक्षात काय सोडवेल',
  '{0} of these are inside the statutory window and cannot be recovered once it closes.':
    'यांपैकी {0} सांविधिक मुदतीच्या आत आहेत आणि ती संपल्यावर वसूल करता येणार नाहीत.',
  'Days needed': 'आवश्यक दिवस',
  'Days to deadline': 'मुदतीस दिवस',
  'Excluded before allocation — already time-barred': 'वाटपापूर्वी वगळलेली — आधीच मुदतबाह्य',
  '{0} cases. Not a capacity problem and deliberately not competing for officer days: no demand can lawfully be raised, so an officer-day spent here returns nothing.':
    '{0} प्रकरणे. ही क्षमतेची समस्या नाही आणि जाणीवपूर्वक अधिकारी-दिवसांसाठी स्पर्धेत ठेवलेली नाहीत: कायदेशीररीत्या कोणतीही मागणी उभी करता येत नाही, त्यामुळे इथे खर्च केलेला अधिकारी-दिवस काहीही परत देत नाही.',
  'Deadline passed': 'मुदत संपली',
  'Days overdue': 'मुदतीनंतरचे दिवस',
  'Exposure forgone': 'गमावलेली जोखीम रक्कम',
  'Deployment gaps — no eligible officer posted at all': 'नियुक्तीतील त्रुटी — कोणताही पात्र अधिकारी नियुक्तच नाही',
  '{0} division-and-case-type pools have caseload but nobody who may lawfully take it. Scheduling cannot reach these; only a posting or a jurisdictional reassignment can.':
    '{0} विभाग-व-प्रकरणप्रकार संचांत कामाचा भार आहे पण तो कायदेशीररीत्या घेऊ शकेल असे कोणी नाही. नियोजन इथपर्यंत पोहोचू शकत नाही; केवळ नियुक्ती किंवा अधिकारक्षेत्रातील फेरबदलच पोहोचू शकतो.',
  'Cases unreachable': 'पोहोचता न येणारी प्रकरणे',
  'Value at stake': 'पणाला लागलेले मूल्य',
  'Capacity pools, most oversubscribed first': 'क्षमता संच, सर्वाधिक भारित प्रथम',
  'Pooled by division and case type, because that is the granularity at which an officer-week can actually be moved. Subscription is demand-days divided by supply-days — above 1.00 the pool cannot clear its caseload however well it is scheduled.':
    'विभाग व प्रकरणप्रकारानुसार संच केले आहेत, कारण त्याच पातळीवर अधिकारी-आठवडा प्रत्यक्षात हलवता येतो. भारांक म्हणजे मागणी-दिवस भागिले पुरवठा-दिवस — 1.00 च्या वर संच कितीही चांगले नियोजन केले तरी आपला कामाचा भार संपवू शकत नाही.',
  'Case type': 'प्रकरण प्रकार',
  Officers: 'अधिकारी',
  'Supply (days)': 'पुरवठा (दिवस)',
  'Demand (days)': 'मागणी (दिवस)',
  Subscription: 'भारांक',
  'no officer': 'अधिकारी नाही',
  Utilisation: 'वापर',
  '+1 officer-week unlocks': '+1 अधिकारी-आठवडा जे खुले करतो',
  'Marginal value of the next officer-week': 'पुढील अधिकारी-आठवड्याचे सीमांत मूल्य',
  'Computed from the specific cases that would become reachable, best value-per-day first — not from a pool average. This is the figure that answers where the next posting should go.':
    'जी विशिष्ट प्रकरणे पोहोचण्यायोग्य होतील त्यांवरून परिगणित, सर्वाधिक प्रति-दिवस मूल्य प्रथम — संचाच्या सरासरीवरून नाही. पुढील नियुक्ती कुठे व्हावी या प्रश्नाचे उत्तर हाच आकडा देतो.',
  'Assumptions behind this allocation': 'या वाटपामागील गृहीतके',
  'Policy inputs, not measurements. Each one changes the answer, so each is stated rather than embedded.':
    'ही धोरणात्मक माहिती आहे, मोजमाप नाही. प्रत्येक गृहीतक उत्तर बदलते, म्हणून प्रत्येक लपवण्याऐवजी स्पष्ट नमूद केले आहे.',
  'Eligibility rules': 'पात्रता नियम',
  'The hard constraint. Division is territorial and absolute; role determines the case type an officer may take.':
    'ही कठोर मर्यादा आहे. विभाग प्रादेशिक व निरपवाद आहे; अधिकारी कोणत्या प्रकारचे प्रकरण घेऊ शकतो हे पद ठरवते.',
  'An officer-week is {0} case-days after non-case work is removed. A case needing more than that is indivisible and cannot be placed inside a one-week horizon at all, however many officers are added.':
    'प्रकरणेतर काम वगळल्यावर अधिकारी-आठवडा म्हणजे {0} प्रकरण-दिवस. त्याहून अधिक लागणारे प्रकरण अविभाज्य असते आणि कितीही अधिकारी वाढवले तरी एका आठवड्याच्या मर्यादेत ते बसवता येत नाही.'
})
