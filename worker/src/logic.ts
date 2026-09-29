/**
 * logic.ts
 *
 * Everything the contact worker decides, with no Cloudflare in it, so it can
 * be tested in plain Node. index.ts does the I/O: KV, the rate limit binding
 * and Resend.
 */

export const LIMITS = {
  nameChars: 100,
  emailChars: 254,
  subjectChars: 150,
  messageMin: 10,
  messageChars: 5000,
  maxLinks: 5,
  maxFiles: 3,
  fileBytes: 5 * 1024 * 1024,
  totalFileBytes: 10 * 1024 * 1024,
  /** Everything above, plus room for the form's own fields and boundaries. */
  requestBytes: 11 * 1024 * 1024,
  /** A person takes longer than this to read a form and write a message. */
  minAgeMs: 3_000,
  maxAgeMs: 2 * 60 * 60 * 1000,
  powBits: 16,
} as const;

export const TOPICS = {
  question: 'Question',
  problem: 'Something is not working',
  idea: 'Feature idea',
  privacy: 'Privacy or data request',
  other: 'Something else',
} as const;
export type Topic = keyof typeof TOPICS;

/** Origins the form is served from. Anything else is refused. */
export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (origin === 'https://palworks.github.io') return true;
  return /^http:\/\/(localhost|127\.0\.0\.1):\d{2,5}$/.test(origin);
}

/** One line, trimmed, capped. Header injection needs a newline; this has none. */
export function oneLine(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

/** Multi-line text: control characters other than newline and tab removed. */
export function multiLine(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '')
    .trim()
    .slice(0, max);
}

export function isPlausibleEmail(value: string): boolean {
  return value.length <= LIMITS.emailChars && /^[^@\s,;<>"]+@[^@\s,;<>".]+(\.[^@\s,;<>".]+)+$/.test(value);
}

export function countLinks(text: string): number {
  return (text.match(/https?:\/\/|www\./gi) || []).length;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ---------------------------------------------------------------------------
// Fields
// ---------------------------------------------------------------------------

export interface ContactFields {
  name: string;
  email: string;
  topic: Topic;
  subject: string;
  message: string;
}

export type FieldError = { field: keyof ContactFields; error: string };

export function validateFields(raw: Record<string, unknown>): { fields: ContactFields } | FieldError {
  const name = oneLine(raw.name, LIMITS.nameChars);
  const email = oneLine(raw.email, LIMITS.emailChars);
  const topicRaw = oneLine(raw.topic, 20);
  const subject = oneLine(raw.subject, LIMITS.subjectChars);
  const message = multiLine(raw.message, LIMITS.messageChars);

  if (!name) return { field: 'name', error: 'Enter your name.' };
  if (!email) return { field: 'email', error: 'Enter your email address, so we can reply.' };
  if (!isPlausibleEmail(email)) return { field: 'email', error: 'That email address does not look complete.' };
  if (message.length < LIMITS.messageMin) return { field: 'message', error: 'Write a little more, so we can help.' };
  if (countLinks(message) > LIMITS.maxLinks) return { field: 'message', error: `Include at most ${LIMITS.maxLinks} links.` };
  const topic: Topic = topicRaw in TOPICS ? (topicRaw as Topic) : 'other';
  return { fields: { name, email, topic, subject, message } };
}

// ---------------------------------------------------------------------------
// Attachments: checked by what the bytes are, not by what the name says
// ---------------------------------------------------------------------------

export type Kind = 'png' | 'jpeg' | 'gif' | 'webp' | 'pdf' | 'text';

const EXTENSIONS: Record<Kind, readonly string[]> = {
  png: ['png'],
  jpeg: ['jpg', 'jpeg'],
  gif: ['gif'],
  webp: ['webp'],
  pdf: ['pdf'],
  text: ['txt', 'json', 'log', 'csv'],
};

export const ACCEPTED_EXTENSIONS = Object.values(EXTENSIONS).flat();

function startsWith(bytes: Uint8Array, sig: number[], at = 0): boolean {
  if (bytes.length < at + sig.length) return false;
  return sig.every((b, i) => bytes[at + i] === b);
}

/** The file's real type from its first bytes, or null if it is none we accept. */
export function sniff(bytes: Uint8Array): Kind | null {
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png';
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return 'jpeg';
  if (startsWith(bytes, [0x47, 0x49, 0x46, 0x38])) return 'gif';
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) return 'webp';
  if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) return 'pdf';
  // Text: valid UTF-8 with no NUL byte. Anything executable or binary fails one or the other.
  if (bytes.includes(0)) return null;
  try {
    new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(bytes);
    return 'text';
  } catch {
    return null;
  }
}

/** A filename safe for an email header: letters, digits, dot, dash, underscore. */
export function safeFilename(name: string, kind: Kind, index: number): string {
  const base = name.split(/[\\/]/).pop() || '';
  const dot = base.lastIndexOf('.');
  const ext = dot > 0 ? base.slice(dot + 1).toLowerCase() : '';
  const stem = (dot > 0 ? base.slice(0, dot) : base).replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^[-.]+|[-.]+$/g, '').slice(0, 60);
  const finalExt = EXTENSIONS[kind].includes(ext) ? ext : EXTENSIONS[kind][0];
  return `${stem || `attachment-${index + 1}`}.${finalExt}`;
}

export interface CheckedFile {
  filename: string;
  bytes: Uint8Array;
}

export type FileError = { error: string };

export function checkFiles(files: { name: string; bytes: Uint8Array }[]): { files: CheckedFile[] } | FileError {
  const real = files.filter((f) => f.bytes.length > 0);
  if (real.length > LIMITS.maxFiles) return { error: `Attach at most ${LIMITS.maxFiles} files.` };
  let total = 0;
  const out: CheckedFile[] = [];
  for (const [i, f] of real.entries()) {
    if (f.bytes.length > LIMITS.fileBytes) return { error: `${oneLine(f.name, 80)} is larger than 5 MB.` };
    total += f.bytes.length;
    if (total > LIMITS.totalFileBytes) return { error: 'Attachments add up to more than 10 MB.' };
    const kind = sniff(f.bytes);
    if (!kind) return { error: `${oneLine(f.name, 80)} is not a type we accept. Send an image, a PDF or a text file.` };
    const ext = (f.name.split('.').pop() || '').toLowerCase();
    // A PNG called report.pdf is either a mistake or a disguise. Refuse both.
    if (ext && ACCEPTED_EXTENSIONS.includes(ext) && !EXTENSIONS[kind].includes(ext)) {
      return { error: `${oneLine(f.name, 80)} is not the kind of file its name says.` };
    }
    out.push({ filename: safeFilename(f.name, kind, i), bytes: f.bytes });
  }
  return { files: out };
}

// ---------------------------------------------------------------------------
// The challenge: signed by the worker, aged, and paid for with a little work
// ---------------------------------------------------------------------------

const enc = new TextEncoder();

export function b64url(bytes: ArrayBuffer | Uint8Array): string {
  const u = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = '';
  for (const b of u) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hmac(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64url(await crypto.subtle.sign('HMAC', key, enc.encode(data)));
}

/** Constant-time comparison, so the signature cannot be guessed a byte at a time. */
function sameString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function issueChallenge(secret: string, now = Date.now(), bits: number = LIMITS.powBits): Promise<string> {
  const nonce = b64url(crypto.getRandomValues(new Uint8Array(16)));
  const body = `${now}.${nonce}.${bits}`;
  return `${body}.${await hmac(secret, body)}`;
}

export function leadingZeroBits(hash: Uint8Array): number {
  let n = 0;
  for (const byte of hash) {
    if (byte === 0) {
      n += 8;
      continue;
    }
    return n + Math.clz32(byte) - 24;
  }
  return n;
}

export type ChallengeResult = { ok: true; nonce: string } | { ok: false; reason: 'malformed' | 'signature' | 'too-fast' | 'expired' | 'work' };

export async function verifyChallenge(secret: string, challenge: unknown, solution: unknown, now = Date.now()): Promise<ChallengeResult> {
  if (typeof challenge !== 'string' || typeof solution !== 'string' || !/^\d{1,12}$/.test(solution)) return { ok: false, reason: 'malformed' };
  const parts = challenge.split('.');
  if (parts.length !== 4) return { ok: false, reason: 'malformed' };
  const [issuedRaw, nonce, bitsRaw, sig] = parts;
  const issued = Number(issuedRaw);
  const bits = Number(bitsRaw);
  if (!Number.isFinite(issued) || !Number.isInteger(bits) || bits < LIMITS.powBits || bits > 24) return { ok: false, reason: 'malformed' };
  if (!sameString(sig, await hmac(secret, `${issuedRaw}.${nonce}.${bitsRaw}`))) return { ok: false, reason: 'signature' };
  const age = now - issued;
  if (age < LIMITS.minAgeMs) return { ok: false, reason: 'too-fast' };
  if (age > LIMITS.maxAgeMs) return { ok: false, reason: 'expired' };
  const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(`${nonce}:${solution}`)));
  if (leadingZeroBits(hash) < bits) return { ok: false, reason: 'work' };
  return { ok: true, nonce };
}

/** The client's side of the work, here so the test and the page solve it the same way. */
export async function solve(challenge: string): Promise<string> {
  const [, nonce, bitsRaw] = challenge.split('.');
  const bits = Number(bitsRaw);
  for (let i = 0; ; i++) {
    const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(`${nonce}:${i}`)));
    if (leadingZeroBits(hash) >= bits) return String(i);
  }
}

/** A stable, unreadable name for an IP, for rate-limit keys. The IP itself is never stored. */
export async function ipKey(secret: string, ip: string): Promise<string> {
  return (await hmac(secret, `ip:${ip}`)).slice(0, 22);
}

// ---------------------------------------------------------------------------
// The email
// ---------------------------------------------------------------------------

export function buildEmail(f: ContactFields, meta: { country: string; files: CheckedFile[] }) {
  const topic = TOPICS[f.topic];
  const subject = `[Gmail Tabs website] ${topic}: ${f.subject || f.message.slice(0, 60).replace(/\s+/g, ' ')}`;
  const fileList = meta.files.map((x) => `${x.filename} (${Math.ceil(x.bytes.length / 1024)} KB)`);
  const text = [
    `From: ${f.name} <${f.email}>`,
    `Topic: ${topic}`,
    `Subject: ${f.subject || '(none)'}`,
    `Country: ${meta.country}`,
    fileList.length ? `Attachments: ${fileList.join(', ')}` : 'Attachments: none',
    '',
    f.message,
  ].join('\n');
  const html = `<h2>Gmail Labels as Tabs: website contact form</h2>
<p><strong>From:</strong> ${escapeHtml(f.name)} &lt;${escapeHtml(f.email)}&gt;<br />
<strong>Topic:</strong> ${escapeHtml(topic)}<br />
<strong>Subject:</strong> ${escapeHtml(f.subject || '(none)')}<br />
<strong>Country:</strong> ${escapeHtml(meta.country)}<br />
<strong>Attachments:</strong> ${fileList.length ? escapeHtml(fileList.join(', ')) : 'none'}</p>
<hr />
<p style="white-space:pre-wrap">${escapeHtml(f.message)}</p>`;
  return { subject: subject.slice(0, 200), text, html };
}

export function toBase64(bytes: Uint8Array): string {
  let s = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) s += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(s);
}
