// WSD contact-form backend (replaces Formspree). Free: Cloudflare Workers + KV + Email Routing "send_email" binding.
//   POST /        site forms post here: bots dropped, lead saved to KV first, then emailed to Jason.
//   GET  /leads   dashboard feed (Mission Control). Needs header "Authorization: Bearer <ADMIN_KEY>" (Worker secret).
// Setup: see README.md in this folder. Nothing here stores or sends anything until you deploy it.
import { EmailMessage } from 'cloudflare:email';

const ALLOWED_ORIGINS = ['https://whitespacedesigns.co.za', 'https://www.whitespacedesigns.co.za'];
const FROM = 'forms@whitespacedesigns.co.za';       // must be an address on a domain with Email Routing enabled
const TO = 'contact.whitespacedesigns@gmail.com';     // must be a VERIFIED destination address in Email Routing

const cors = (origin) => ({
  'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  Vary: 'Origin',
});
const clean = (v, max = 4000) => String(v ?? '').replace(/[\r\u0000]/g, '').trim().slice(0, max);
const header = (v) => clean(v, 200).replace(/[\r\n]/g, ' ');
const json = (obj, status, origin) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...cors(origin) } });

// constant-time compare so the admin key cannot be guessed by timing
function safeEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });

    // ---- dashboard feed ----
    if (request.method === 'GET' && url.pathname === '/leads') {
      const auth = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
      if (!env.ADMIN_KEY || !safeEqual(auth, env.ADMIN_KEY)) return new Response('Unauthorized', { status: 401 });
      if (!env.LEADS) return json({ ok: false, error: 'KV not bound' }, 500, '');
      const leads = []; let cursor;
      do {
        const page = await env.LEADS.list({ prefix: 'lead-', cursor });
        for (const k of page.keys) { const v = await env.LEADS.get(k.name); if (v) { try { leads.push(JSON.parse(v)); } catch {} } }
        cursor = page.list_complete ? undefined : page.cursor;
      } while (cursor);
      leads.sort((a, b) => (b.ts || '').localeCompare(a.ts || ''));
      return new Response(JSON.stringify({ ok: true, count: leads.length, leads }), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
    }

    // ---- form submissions ----
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: cors(origin) });
    if (origin && !ALLOWED_ORIGINS.includes(origin)) return new Response('Forbidden', { status: 403 });

    let data = {};
    const ct = request.headers.get('Content-Type') || '';
    try {
      data = ct.includes('application/json') ? await request.json() : Object.fromEntries(await request.formData());
    } catch { return json({ ok: false, error: 'bad request' }, 400, origin); }

    if (clean(data._gotcha) || clean(data.gotcha)) return json({ ok: true }, 200, origin); // honeypot: silently drop bots
    // forms differ (home: first_name/last_name/message, intake: Full Name/Email), so match field names loosely
    const norm = (k) => k.toLowerCase().replace(/[\s_-]/g, '');
    const pick = (...keys) => { for (const want of keys) { const k = Object.keys(data).find((x) => norm(x) === want && clean(data[x])); if (k) return { key: k, value: data[k] }; } return { key: '', value: '' }; };
    const first = pick('firstname').value, last = pick('lastname').value;
    const name = header(pick('name', 'fullname').value || [first, last].filter(Boolean).join(' '));
    const email = header(pick('email').value);
    const msgPick = pick('message', 'additionalnotes', 'notes');
    const message = clean(msgPick.value);
    const subjectField = header(pick('subject').value);
    const used = new Set(['gotcha', 'name', 'fullname', 'firstname', 'lastname', 'email', 'message', 'source', 'subject']);
    const extra = Object.fromEntries(Object.entries(data).filter(([k, v]) => !used.has(norm(k)) && k !== msgPick.key && clean(v)).slice(0, 25).map(([k, v]) => [header(k), clean(v, 500)]));
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email) || (message.length < 3 && !Object.keys(extra).length)) return json({ ok: false, error: 'invalid input' }, 422, origin);

    let source = header(data.source || '');
    if (!source) { try { source = new URL(request.headers.get('Referer') || '').pathname; } catch { source = ''; } }
    const ts = new Date().toISOString();
    const id = `lead-${ts}-${crypto.randomUUID().slice(0, 8)}`;

    // save first so a lead is never lost if email delivery fails
    if (env.LEADS) await env.LEADS.put(id, JSON.stringify({ id, ts, name, email, message, source, extra, emailed: false }), { expirationTtl: 60 * 60 * 24 * 730 });

    const rest = Object.entries(extra).map(([k, v]) => `${k}: ${v}`).join('\n');
    const subject = subjectField ? `${subjectField}: ${name || email}` : `New enquiry from ${name || email}`;
    const body = `Name: ${name}\nEmail: ${email}\nPage: ${source || 'unknown'}\n\n${message}\n\n${rest}\n\nReceived: ${ts}`;
    const raw = [`From: WSD website <${FROM}>`, `To: ${TO}`, `Reply-To: ${email}`, `Subject: ${subject}`, `Message-ID: <${crypto.randomUUID()}@whitespacedesigns.co.za>`, 'MIME-Version: 1.0', 'Content-Type: text/plain; charset=utf-8', '', body].join('\r\n');

    let emailed = true;
    try { await env.EMAIL.send(new EmailMessage(FROM, TO, raw)); } catch { emailed = false; }
    if (env.LEADS && emailed) await env.LEADS.put(id, JSON.stringify({ id, ts, name, email, message, source, extra, emailed: true }), { expirationTtl: 60 * 60 * 24 * 730 });
    // saved lead counts as success for the visitor even if the notification email failed
    if (!emailed && !env.LEADS) return json({ ok: false, error: 'send failed' }, 502, origin);
    return json({ ok: true }, 200, origin);
  },
};
