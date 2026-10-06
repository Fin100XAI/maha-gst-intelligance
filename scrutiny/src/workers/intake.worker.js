// Reads a returns workbook off the main thread for the upload staging step and sends back only what the officer needs
// to confirm: who and which year, what was found, what could not be read. Same parser as the server, so what is shown
// here is what will be analysed.
import * as XLSX from 'xlsx';
import { parseWorkbook } from '../engine/parse.js';

self.onmessage = ({ data: { id, name, buf, correction } }) => {
  try {
    const tp = parseWorkbook(XLSX.read(buf, { type: 'array' }), name, correction || {});
    self.postMessage({ id, ok: true, summary: { gstin: tp.gstin || '', name: tp.name, fy: tp.fy, fyStart: tp.fyStart, intake: tp.intake } });
  } catch (e) {
    self.postMessage({ id, ok: false, error: `Not a readable Excel workbook (${e.message})` });
  }
};
