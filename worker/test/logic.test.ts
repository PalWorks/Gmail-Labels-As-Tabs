import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  LIMITS,
  checkFiles,
  isAllowedOrigin,
  issueChallenge,
  leadingZeroBits,
  safeFilename,
  sniff,
  solve,
  validateFields,
  verifyChallenge,
  oneLine,
  buildEmail,
} from '../src/logic.ts';

const SECRET = 'test-secret';
const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);
const pdf = new TextEncoder().encode('%PDF-1.7 hello');
const text = new TextEncoder().encode('{"version":1,"tabs":[]}');

test('origins: the site and localhost only', () => {
  assert.equal(isAllowedOrigin('https://palworks.github.io'), true);
  assert.equal(isAllowedOrigin('http://localhost:3000'), true);
  assert.equal(isAllowedOrigin('https://palworks.github.io.evil.com'), false);
  assert.equal(isAllowedOrigin('https://evil.com'), false);
  assert.equal(isAllowedOrigin(null), false);
});

test('one-line fields cannot carry a header injection', () => {
  assert.equal(oneLine('Hi\r\nBcc: x@y.z', 100), 'Hi Bcc: x@y.z');
});

test('fields: required, plausible, capped', () => {
  const ok = { name: 'Priya', email: 'priya@example.com', topic: 'problem', subject: 'Bar', message: 'The bar is gone today.' };
  assert.ok('fields' in validateFields(ok));
  assert.deepEqual((validateFields({ ...ok, name: '' }) as { field: string }).field, 'name');
  assert.deepEqual((validateFields({ ...ok, email: 'priya@' }) as { field: string }).field, 'email');
  assert.deepEqual((validateFields({ ...ok, email: 'a@b.c, d@e.f' }) as { field: string }).field, 'email');
  assert.deepEqual((validateFields({ ...ok, message: 'short' }) as { field: string }).field, 'message');
  const links = Array.from({ length: 6 }, (_, i) => `https://x${i}.com`).join(' ');
  assert.deepEqual((validateFields({ ...ok, message: links }) as { field: string }).field, 'message');
  const r = validateFields({ ...ok, topic: 'nonsense' }) as { fields: { topic: string } };
  assert.equal(r.fields.topic, 'other');
});

test('files are judged by their bytes', () => {
  assert.equal(sniff(png), 'png');
  assert.equal(sniff(pdf), 'pdf');
  assert.equal(sniff(text), 'text');
  assert.equal(sniff(new Uint8Array([0x4d, 0x5a, 0x90, 0x00])), null); // a Windows executable
  assert.ok('files' in checkFiles([{ name: 'shot.png', bytes: png }, { name: 'tabs.json', bytes: text }]));
  assert.ok('error' in checkFiles([{ name: 'invoice.pdf', bytes: png }]), 'a PNG named .pdf');
  assert.ok('error' in checkFiles([{ name: 'setup.exe', bytes: new Uint8Array([0x4d, 0x5a, 0x90, 0x00]) }]));
  const four = Array.from({ length: 4 }, (_, i) => ({ name: `${i}.png`, bytes: png }));
  assert.ok('error' in checkFiles(four));
  const big = new Uint8Array(LIMITS.fileBytes + 1).fill(0x41);
  assert.ok('error' in checkFiles([{ name: 'big.txt', bytes: big }]));
  assert.equal(safeFilename('../../etc/pass wd.png', 'png', 0), 'pass-wd.png');
  assert.equal(safeFilename('noext', 'pdf', 1), 'noext.pdf');
});

test('the challenge: signed, aged, worked for, and nothing else', async () => {
  const t0 = 1_000_000_000_000;
  const ch = await issueChallenge(SECRET, t0);
  const sol = await solve(ch);
  assert.deepEqual((await verifyChallenge(SECRET, ch, sol, t0 + 5_000)).ok, true);
  assert.deepEqual(await verifyChallenge(SECRET, ch, sol, t0 + 1_000), { ok: false, reason: 'too-fast' });
  assert.deepEqual(await verifyChallenge(SECRET, ch, sol, t0 + LIMITS.maxAgeMs + 1), { ok: false, reason: 'expired' });
  assert.deepEqual(await verifyChallenge('other-secret', ch, sol, t0 + 5_000), { ok: false, reason: 'signature' });
  const forged = ch.replace(/^\d+/, String(t0 - 10_000));
  assert.deepEqual(await verifyChallenge(SECRET, forged, sol, t0 + 5_000), { ok: false, reason: 'signature' });
  const easier = ch.split('.');
  easier[2] = '1';
  assert.equal((await verifyChallenge(SECRET, easier.join('.'), '0', t0 + 5_000)).ok, false);
  // Any answer short of the work is refused. The solver returns the first
  // that works, so every smaller number is one that does not.
  if (Number(sol) > 0) assert.deepEqual(await verifyChallenge(SECRET, ch, '0', t0 + 5_000), { ok: false, reason: 'work' });
});

test('leading zero bits', () => {
  assert.equal(leadingZeroBits(new Uint8Array([0, 0, 0x80])), 16);
  assert.equal(leadingZeroBits(new Uint8Array([0, 0x01])), 15);
  assert.equal(leadingZeroBits(new Uint8Array([0xff])), 0);
});

test('the email escapes what the visitor typed', () => {
  const m = buildEmail(
    { name: '<b>x</b>', email: 'a@b.co', topic: 'question', subject: '', message: '<script>alert(1)</script>' },
    { country: 'IN', files: [] }
  );
  assert.ok(!m.html.includes('<script>'));
  assert.ok(m.subject.startsWith('[Gmail Tabs website] Question: '));
});
