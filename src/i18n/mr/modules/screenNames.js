import { registerMessages } from '../../locale.js'

/**
 * Marathi — the name of every screen, and every navigation section.
 *
 * WHY THIS FILE EXISTS SEPARATELY
 *
 * Where no exact entry exists the composer assembles a translation from
 * fragments, and on a short title that produces a mongrel rather than a
 * sentence: "Statutory वेळ इंटेलिजन्स", "प्रकरण प्राधान्य Engine",
 * "Counterfactual प्रकरण इंटेलिजन्स". Half-translated reads as broken, which is
 * worse than plainly untranslated. An exact entry beats the composer, so every
 * screen name is pinned here rather than left to be assembled.
 *
 * "Intelligence" stays as इंटेलिजन्स by earlier instruction — the transliteration
 * rather than बुद्धिमत्ता. "Engine" is यंत्रणा and "Command Centre" is सूत्र केंद्र,
 * following the labels already in the catalogue.
 */
registerMessages('mr', {
  /* == Navigation sections ================================================ */
  'Command Centre': 'नियंत्रण कक्ष',
  'Revenue at Risk': 'जोखमीतील महसूल',
  'Case Priority': 'प्रकरण प्राधान्य',
  'Risk Discovery': 'जोखीम शोध',
  'Missed Revenue': 'निसटलेला महसूल',
  'Legal Standing': 'विधी स्थिती',
  Benchmarking: 'तुलनात्मक मूल्यमापन',
  'Data Resources': 'डेटा संसाधने',
  Governance: 'कारभार',

  /* == Command Centre ===================================================== */
  'Executive Command Center': 'कार्यकारी सूत्र केंद्र',
  'Revenue Protection Command Centre': 'महसूल संरक्षण सूत्र केंद्र',

  /* == Revenue at Risk ==================================================== */
  'Revenue Intelligence': 'महसूल इंटेलिजन्स',
  'Statutory Time Intelligence': 'सांविधिक मुदत इंटेलिजन्स',
  'Revenue at Risk & Recovery': 'जोखमीतील महसूल व वसुली',

  /* == Case Priority ====================================================== */
  'Case Priority Engine': 'प्रकरण प्राधान्य यंत्रणा',
  'Officer Capacity & Deployment': 'अधिकारी क्षमता व नियुक्ती',
  'Audit & Scrutiny Engine': 'लेखापरीक्षा व तपासणी यंत्रणा',
  'Officer AI Copilot': 'अधिकारी AI सहवैमानिक',
  'Officer Copilot': 'अधिकारी सहवैमानिक',

  /* == Risk Discovery ===================================================== */
  'Unknown Risk Discovery': 'अज्ञात जोखीम शोध',
  'Network Intelligence': 'नेटवर्क इंटेलिजन्स',
  'ITC Risk Intelligence': 'ITC जोखीम इंटेलिजन्स',
  'E-Way Bill Intelligence': 'ई-वे बिल इंटेलिजन्स',
  'Compliance Early Warning': 'अनुपालन पूर्वसूचना',
  'Refund Risk Intelligence': 'परतावा जोखीम इंटेलिजन्स',

  /* == Missed Revenue ===================================================== */
  'Case Digital Twin': 'प्रकरण डिजिटल ट्विन',
  'Missed Revenue Discovery': 'निसटलेल्या महसुलाचा शोध',
  'Counterfactual Case Intelligence': 'प्रति-तथ्य प्रकरण इंटेलिजन्स',

  /* == Legal Standing ===================================================== */
  'Precedent Intelligence': 'पूर्वनिर्णय इंटेलिजन्स',
  'Litigation Intelligence': 'खटला इंटेलिजन्स',

  /* == Benchmarking ======================================================= */
  'District & Division Performance': 'जिल्हा व विभाग कामगिरी',
  'Sector Intelligence': 'क्षेत्र इंटेलिजन्स',

  /* == Data Resources ===================================================== */
  'Project Resources': 'प्रकल्प संसाधने',
  'Engine Stack & Data Readiness': 'यंत्रणा संच व डेटा सज्जता',
  'Pilot Extract Specification': 'पायलट एक्सट्रॅक्ट विनिर्देश',
  'Official Statistics': 'अधिकृत सांख्यिकी',

  /* == Governance ========================================================= */
  'AI Governance & Security': 'AI कारभार व सुरक्षा',
  'Reports & Briefing Notes': 'अहवाल व माहिती टिपण',

  /* == Product name ======================================================= */
  'Maha GST Intelligence': 'महा GST इंटेलिजन्स',
  'MAHA GST INTELLIGENCE': 'महा GST इंटेलिजन्स'
})
