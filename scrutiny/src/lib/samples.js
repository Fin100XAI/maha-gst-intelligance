// The sample input files served from public/samples/ingestion/ (written by scripts/make-ingestion-samples.mjs).
// tests/samples.ingestion.test.mjs checks every path here exists, so the Upload data page never links to a missing file.
const BASE = '/samples/ingestion/';
export const sampleUrl = (rel) => BASE + rel.split('/').map(encodeURIComponent).join('/');

export const SAMPLE_GUIDE = '00 READ ME - Format guide.xlsx';
export const SAMPLE_RETURNS = '1 Returns/Get Download All Report_27ZZXCS0001S1ZN_2025 - 2026_SAMPLE Traders.xlsx';
export const SAMPLE_REGISTER = (type) => `2 Registers/${type}.xlsx`;
export const SAMPLE_LETTER = '3 Reply letters/EIU-SAMPLE-0001 reply.pdf';
