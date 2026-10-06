// The generated workbooks and registers label their companies "[TEST]" or "[SYN]".
// Officers see the name without the label; the ZZ PAN block in every generated GSTIN
// still marks the taxpayer as generated. Applied wherever a name is read in.
export const cleanName = (v) => String(v ?? '').replace(/\s*\[(?:TEST|SYN)\]/gi, '').trim();

/**
 * Is this taxpayer test data rather than a real registration? Generated data uses PANs that begin "ZZ" (reserved for
 * this purpose across the project) and generated workbooks carry a marker in the file name (_GEN, _SYN, _TEST, _SAMPLE).
 * Shown as a badge wherever the name appears, so test cases are never mistaken for real dealers.
 */
export const isTestData = (gstin, fileName = '') => String(gstin ?? '').slice(2, 4).toUpperCase() === 'ZZ' || /_(?:GEN|SYN|TEST|SAMPLE)\s/i.test(String(fileName ?? ''));
