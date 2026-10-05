// WSD contact-form backend (replaces Formspree). Free: Cloudflare Workers + Email Routing "send_email" binding.
// Receives the site's contact form, rejects bots, emails the submission to Jason, and keeps a copy in KV (optional).
// Setup: see README.md in this folder. Nothing here stores or sends anything until you deploy it.
import { EmailMessage } from 'cloudflare:email';

const ALLOWED_ORIGINS = ['https://whitespacedesigns.co.za', 'https://www.whitespacedesigns.co.za'];
const FROM = 'forms@whitespacedesigns.co.za';       // must be an address on a domain with Email Routing enabled
const TO = 'whitespacedesigns.co.za@gmail.com';     // must be a VERIFIED destination address in Email Routing

const cors = (origin) => ({
  'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  Vary: 'Origin',
});
const clean = (v, max = 4000) => String(v ?? '').replace(/[\r\u0000]/g, '').trim().slice(0, max);
const header = (v) => clean(v, 200).replace(/[\r\n]/g, ' ');

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: cors(origin) });
    if (origin && !ALLOWED_ORIGINS.includes(origin)) return new Response('Forbidden', { status: 403 });

    let data = {};
    const ct = request.headers.get('Content-Type') || '';
    try {
      data = ct.includes('application/json') ? await request.json() : Object.fromEntries(await request.formData());
    } catch { return json({ ok: false, error: 'bad request' }, 400, origin); }

    if (clean(data._gotcha)) return json({ ok: true }, 200, origin); // honeypot: silently drop bots
    const name = header(data.name || data.first_name || '');
    const email = header(data.email);
    const message = clean(data.message);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email) || message.length < 3) return json({ ok: false, error: 'invalid input' }, 422, origin);

    const rest = Object.entries(data).filter(([k]) => !['_gotcha', 'name', 'first_name', 'email', 'message'].includes(k)).map(([k, v]) => `${header(k)}: ${clean(v, 500)}`).join('\n');
    const subject = `New enquiry from ${name || email}`;
    const body = `Name: ${name}\nEmail: ${email}\n\n${message}\n\n${rest}\n\nReceived: ${new Date().toISOString()}`;
    const raw = [`From: WSD website <${FROM}>`, `To: ${TO}`, `Reply-To: ${email}`, `Subject: ${subject}`, `Message-ID: <${crypto.randomUUID()}@whitespacedesigns.co.za>`, 'MIME-Version: 1.0', 'Content-Type: text/plain; charset=utf-8', '', body].join('\r\n');

    try { await env.EMAIL.send(new EmailMessage(FROM, TO, raw)); }
    catch (e) { if (env.LEADS) await env.LEADS.put(`failed-${Date.now()}`, JSON.stringify({ name, email, message })); return json({ ok: false, error: 'send failed' }, 502, origin); }
    if (env.LEADS) await env.LEADS.put(`lead-${Date.now()}`, JSON.stringify({ name, email, message, rest }), { expirationTtl: 60 * 60 * 24 * 365 });
    return json({ ok: true }, 200, origin);
  },
};
function json(obj, status, origin) { return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...cors(origin) } }); }
