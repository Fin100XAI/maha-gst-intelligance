import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import reportLibrary from './scripts/report-library.js';
import aiProxy from './scripts/ai-proxy.js';
import dataStore from './scripts/data-store.js';
import caseStore from './scripts/case-store.js';
import registerStore from './scripts/register-store.js';
import docStore from './scripts/doc-store.js';
import governance from './scripts/governance.js';
import ewbStore from './scripts/ewb-store.js';
import alertStore from './scripts/alert-store.js';

export default defineConfig(({ mode }) => {
  // TOGETHER_API_KEY may live in .env.local (not bundled into the client: no VITE_ prefix).
  const env = loadEnv(mode, path.dirname(fileURLToPath(import.meta.url)), ''); // this folder's .env.local, wherever vite is started
  return {
    plugins: [react(), dataStore(), caseStore(), registerStore(), docStore(), governance(), ewbStore(), alertStore(), reportLibrary(), aiProxy(env)],
    // 5182 inside the Maha GST Intelligence repo, so the stand-alone GST v4 (5180/5181) can run alongside.
    server: { port: 5182, open: false },
  };
});
