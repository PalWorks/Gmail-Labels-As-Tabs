/**
 * The website's contact form relay.
 *
 * The site is static, on GitHub Pages, so it cannot hold a Resend key: any
 * key in a public page is a public key. This Worker holds it, accepts one
 * kind of request, and sends one kind of email, to one fixed address.
 *
 *   GET  /v1/challenge   a signed, timestamped puzzle the form must solve
 *   POST /v1/contact     the form, as multipart/form-data, with attachments
 *   GET  /health
 *
 * Defences, cheapest first, so a flood costs us as little as possible:
 *
 *   1. Origin must be the site (or localhost in development).
 *   2. Size is capped before the body is read.
 *   3. A honeypot field a person never sees; filled means dropped, silently.
 *   4. The challenge: signed by this Worker, at least 3 seconds and at most
 *      2 hours old, and solved with about 65,000 SHA-256 hashes in the
 *      visitor's browser. Cheap for one message, expensive for ten thousand.
 *   5. Every field and every file is validated; files by their bytes.
 *   6. Rate limits: a burst limit per IP, a daily cap per IP and a daily cap
 *      for everyone together, so the worst case is bounded however it comes.
 *   7. Each challenge works once.
 *
 * The recipient is fixed in configuration and the visitor's address is only
 * ever a Reply-To, never a To, so this cannot be used to send mail to anyone
 * else. It sends no confirmation to the visitor for the same reason: an
 * auto-reply to a typed-in address is a way to mail strangers.
 *
 * Nothing is stored except rate-limit counters and used challenge ids, keyed
 * by an HMAC of the IP rather than the IP, and each expires within a day.
 */

import {
  LIMITS,
  buildEmail,
  checkFiles,
  ipKey,
  isAllowedOrigin,
  issueChallenge,
  toBase64,
  validateFields,
  verifyChallenge,
} from './logic';

export interface Env {
  RESEND_API_KEY: string;
  /** Signs challenges and names IPs in rate-limit keys. */
  CHALLENGE_SECRET: string;
  CONTACT_FROM: string;
  CONTACT_TO: string;
  DAILY_PER_IP: string;
  DAILY_GLOBAL: string;
  COUNTERS: KVNamespace;
  BURST?: { limit: (o: { key: string }) => Promise<{ success: boolean }> };
}

function cors(origin: string | null): Record<string, string> {
  return isAllowedOrigin(origin)
    ? {
        'Access-Control-Allow-Origin': origin as string,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
        Vary: 'Origin',
      }
    : { Vary: 'Origin' };
}

function json(body: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...cors(origin) },
  });
}

const today = () => new Date().toISOString().slice(0, 10);
const SEND_TIMEOUT_MS = 8000;

/** Increment a daily counter; true when it was already at the cap. Fails open if KV is down. */
async function overCap(env: Env, key: string, cap: number): Promise<boolean> {
  try {
    const n = parseInt((await env.COUNTERS.get(key)) || '0', 10);
    if (n >= cap) return true;
    await env.COUNTERS.put(key, String(n + 1), { expirationTtl: 60 * 60 * 26 });
    return false;
  } catch {
    return false;
  }
}

async function handleContact(request: Request, env: Env, origin: string | null): Promise<Response> {
  const declared = Number(request.headers.get('content-length') || '0');
  if (declared > LIMITS.requestBytes) return json({ error: 'That is too large to send. Attachments can add up to 10 MB.' }, 413, origin);
  if (!(request.headers.get('content-type') || '').startsWith('multipart/form-data')) {
    return json({ error: 'Unexpected request.' }, 415, origin);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: 'Unexpected request.' }, 400, origin);
  }

  // A person never sees this field. Answer as if it worked, so a bot learns nothing.
  if (String(form.get('website') || '').trim()) return json({ ok: true }, 200, origin);

  const challenge = await verifyChallenge(env.CHALLENGE_SECRET, form.get('challenge'), form.get('solution'));
  if (!challenge.ok) {
    const message =
      challenge.reason === 'expired'
        ? 'This form has been open a long time. Reload the page and send it again.'
        : challenge.reason === 'too-fast'
          ? 'That was faster than a person can type. Wait a moment and send it again.'
          : 'The form could not be verified. Reload the page and try again.';
    return json({ error: message, retry: true }, 400, origin);
  }

  // Validate before counting anything, so a message that only needs a
  // correction keeps its challenge and costs no part of anyone's quota.
  const raw: Record<string, unknown> = {};
  for (const k of ['name', 'email', 'topic', 'subject', 'message']) raw[k] = form.get(k);
  const checked = validateFields(raw);
  if ('error' in checked) return json({ error: checked.error, field: checked.field }, 400, origin);

  const uploads: { name: string; bytes: Uint8Array }[] = [];
  for (const entry of form.getAll('attachments') as unknown as (string | File)[]) {
    if (typeof entry === 'string') continue;
    uploads.push({ name: entry.name, bytes: new Uint8Array(await entry.arrayBuffer()) });
  }
  const files = checkFiles(uploads);
  if ('error' in files) return json({ error: files.error, field: 'attachments' }, 400, origin);

  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const who = await ipKey(env.CHALLENGE_SECRET, ip);
  if (env.BURST) {
    try {
      const { success } = await env.BURST.limit({ key: who });
      if (!success) return json({ error: 'Too many messages in a short time. Wait a minute and try again.' }, 429, origin);
    } catch {
      /* the daily caps below still hold */
    }
  }
  if (await overCap(env, `ip:${today()}:${who}`, Number(env.DAILY_PER_IP || 10))) {
    return json({ error: 'You have sent a lot of messages today. Write to us by email instead.' }, 429, origin);
  }
  if (await overCap(env, `all:${today()}`, Number(env.DAILY_GLOBAL || 200))) {
    return json({ error: 'The form is busy today. Write to us by email instead.' }, 503, origin);
  }

  // One use per challenge, so a solved puzzle cannot be replayed.
  const usedKey = `used:${challenge.nonce}`;
  try {
    if (await env.COUNTERS.get(usedKey)) return json({ error: 'This form was already sent. Reload the page to send another.', retry: true }, 409, origin);
    await env.COUNTERS.put(usedKey, '1', { expirationTtl: Math.ceil(LIMITS.maxAgeMs / 1000) + 60 });
  } catch {
    /* fail open: the signature and the age still bound a replay */
  }

  const country = request.headers.get('cf-ipcountry') || 'unknown';
  const mail = buildEmail(checked.fields, { country, files: files.files });

  let res: Response;
  try {
    res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.CONTACT_FROM,
        to: [env.CONTACT_TO],
        reply_to: [checked.fields.email],
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
        attachments: files.files.map((f) => ({ filename: f.filename, content: toBase64(f.bytes) })),
      }),
      // Resend normally answers in well under a second. Past this, say so
      // rather than hold the visitor's form open.
      signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    });
  } catch (e) {
    if (e instanceof Error && (e.name === 'TimeoutError' || e.name === 'AbortError')) {
      return json({ error: 'Sending took too long. Try again in a few minutes, or write to us by email.' }, 504, origin);
    }
    return json({ error: 'The message could not be sent just now. Try again in a few minutes, or write to us by email.' }, 502, origin);
  }
  if (!res.ok) {
    // Never echo the provider's answer: it can name the account.
    return json({ error: 'The message could not be sent just now. Try again in a few minutes, or write to us by email.' }, 502, origin);
  }
  return json({ ok: true }, 200, origin);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('origin');

    if (url.pathname === '/health') return json({ ok: true }, 200, origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: isAllowedOrigin(origin) ? 204 : 403, headers: cors(origin) });
    }
    if (url.pathname !== '/v1/challenge' && url.pathname !== '/v1/contact') return json({ error: 'Not found' }, 404, origin);
    if (!isAllowedOrigin(origin)) return json({ error: 'Not allowed' }, 403, origin);

    try {
      if (url.pathname === '/v1/challenge') {
        if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405, origin);
        return json({ challenge: await issueChallenge(env.CHALLENGE_SECRET) }, 200, origin);
      }
      if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405, origin);
      return await handleContact(request, env, origin);
    } catch {
      return json({ error: 'Something went wrong on our side. Write to us by email instead.' }, 500, origin);
    }
  },
};
