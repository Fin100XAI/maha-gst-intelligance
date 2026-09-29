// Dev-server plugin: local proxy to Together AI (OpenAI-compatible chat completions).
// Key source, in order: `x-together-key` header (saved by the officer in AI settings, this browser only)
// or TOGETHER_API_KEY from the environment / .env.local. Keys are never logged or echoed back.
const TOGETHER = 'https://api.together.xyz/v1';

export default function aiProxy(env = {}) {
  return {
    name: 'ai-proxy',
    configureServer(server) {
      const envKey = () => env.AI_API_KEY || env.TOGETHER_API_KEY || process.env.AI_API_KEY || process.env.TOGETHER_API_KEY || '';
      // GST_ALLOW_REMOTE=1 is needed behind Docker / a reverse proxy (pair it with BASIC_AUTH_* or network controls).
      const local = (req) => process.env.GST_ALLOW_REMOTE === '1' || ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(req.socket.remoteAddress);
      const json = (res, code, body) => { res.statusCode = code; res.setHeader('content-type', 'application/json'); res.setHeader('cache-control', 'no-store'); res.end(JSON.stringify(body)); };
      const keyFor = (req) => String(req.headers['x-together-key'] || '').trim() || envKey();
      const readBody = (req) => new Promise((resolve, reject) => {
        let b = '';
        req.on('data', (c) => { b += c; if (b.length > 2e6) { reject(new Error('request too large')); req.destroy(); } });
        req.on('end', () => { try { resolve(b ? JSON.parse(b) : {}); } catch { reject(new Error('invalid JSON')); } });
      });
      const explain = (status, body) => {
        const msg = body?.error?.message || body?.message || '';
        if (status === 401 || status === 403) return 'The AI service rejected the API key (401/403). Check the key in AI settings or .env.local.';
        if (status === 404) return `Model not found on the AI service${msg ? `: ${msg}` : ''}.`;
        if (status === 429) return 'AI rate limit or credit limit reached (429). Try again shortly or check your balance.';
        if (status >= 500) return `The AI service is unavailable (${status}). Try again shortly.`;
        return msg ? `AI error ${status}: ${msg}` : `AI error ${status}.`;
      };

      server.middlewares.use('/__ai/status', (req, res) => json(res, 200, { provider: 'together', envKey: !!envKey() }));

      server.middlewares.use('/__ai/models', async (req, res) => {
        if (!local(req)) return json(res, 403, { error: 'local only' });
        const key = keyFor(req);
        if (!key) return json(res, 400, { error: 'No AI key configured.' });
        try {
          const r = await fetch(`${TOGETHER}/models`, { headers: { authorization: `Bearer ${key}` }, signal: AbortSignal.timeout(20000) });
          const body = await r.json().catch(() => ({}));
          if (!r.ok) return json(res, r.status, { error: explain(r.status, body) });
          const list = (Array.isArray(body) ? body : body.data || []).filter((m) => (m.type || '').toLowerCase() === 'chat')
            .map((m) => ({ id: m.id, name: m.display_name || m.id, context: m.context_length || null })).sort((a, b) => a.id.localeCompare(b.id));
          json(res, 200, { models: list });
        } catch (e) {
          json(res, 502, { error: `Could not reach the AI service: ${e.name === 'TimeoutError' ? 'timed out' : e.message}` });
        }
      });

      server.middlewares.use('/__ai/chat', async (req, res) => {
        if (req.method !== 'POST') return json(res, 405, { error: 'POST only' });
        if (!local(req)) return json(res, 403, { error: 'AI calls are allowed from this computer only.' });
        const key = keyFor(req);
        if (!key) return json(res, 400, { error: 'No AI key configured. Add it in Configure → AI assistant, or set AI_API_KEY in .env.local.' });
        let input;
        try { input = await readBody(req); } catch (e) { return json(res, 400, { error: e.message }); }
        const { model, messages, temperature = 0.2, max_tokens = 1200, json: wantJson = true } = input;
        if (!model || !Array.isArray(messages) || !messages.length) return json(res, 400, { error: 'model and messages are required' });
        const payload = { model, messages, temperature: Math.max(0, Math.min(1, Number(temperature) || 0)), max_tokens: Math.max(64, Math.min(4000, Number(max_tokens) || 1200)) };
        if (wantJson) payload.response_format = { type: 'json_object' };
        const t0 = Date.now();
        try {
          let r = await fetch(`${TOGETHER}/chat/completions`, { method: 'POST', headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(90000) });
          let body = await r.json().catch(() => ({}));
          // Some models reject response_format: retry once without it.
          if (!r.ok && r.status === 400 && wantJson && /response_format|json/i.test(JSON.stringify(body))) {
            delete payload.response_format;
            r = await fetch(`${TOGETHER}/chat/completions`, { method: 'POST', headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(90000) });
            body = await r.json().catch(() => ({}));
          }
          if (!r.ok) return json(res, r.status, { error: explain(r.status, body) });
          const content = body?.choices?.[0]?.message?.content ?? '';
          json(res, 200, { content, model: body.model || model, usage: body.usage || null, ms: Date.now() - t0, finish: body?.choices?.[0]?.finish_reason || null });
        } catch (e) {
          json(res, 502, { error: `Could not reach the AI service: ${e.name === 'TimeoutError' ? 'timed out after 90 s' : e.message}` });
        }
      });
    },
  };
}
