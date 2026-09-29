// The generated workbooks and registers label their companies "[TEST]" or "[SYN]".
// Officers see the name without the label; the ZZ PAN block in every generated GSTIN
// still marks the taxpayer as generated. Applied wherever a name is read in.
export const cleanName = (v) => String(v ?? '').replace(/\s*\[(?:TEST|SYN)\]/gi, '').trim();
