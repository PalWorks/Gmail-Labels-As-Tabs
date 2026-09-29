/**
 * ContactForm.tsx
 *
 * The site's contact form. It posts to our own relay (worker/ in this
 * repository), which sends the message to support@palworks.ai through
 * Resend. The page never holds a key.
 *
 * What the visitor does not see, and why:
 *
 *   - A challenge is fetched as soon as the form is on screen and solved in
 *     the background (about 65,000 SHA-256 hashes, under a second on a
 *     phone). By the time anyone has typed a message it is long done. A bot
 *     posting ten thousand forms has to do that ten thousand times.
 *   - A field named "website", off screen and out of the tab order, which
 *     only a bot fills in.
 *   - Files are checked here for count, size and type so a person hears
 *     about a problem before uploading; the relay checks all of it again,
 *     by the bytes, because a check in the browser is a courtesy, not a
 *     defence.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Paperclip, X } from 'lucide-react';
import { SUPPORT_EMAIL } from '../content/site';

export const CONTACT_ENDPOINT = 'https://gmail-tabs-contact.palworks.ai';

const TOPICS: readonly { value: string; label: string }[] = [
  { value: 'question', label: 'A question' },
  { value: 'problem', label: 'Something is not working' },
  { value: 'idea', label: 'A feature idea' },
  { value: 'privacy', label: 'A privacy or data request' },
  { value: 'other', label: 'Something else' },
];

const MAX_FILES = 3;
const MAX_FILE = 5 * 1024 * 1024;
const MAX_TOTAL = 10 * 1024 * 1024;
const ACCEPT = '.png,.jpg,.jpeg,.gif,.webp,.pdf,.txt,.json,.log,.csv';
const ACCEPT_EXT = ACCEPT.split(',').map((e) => e.slice(1));

type Status = 'idle' | 'sending' | 'sent' | 'error';

const enc = new TextEncoder();

function leadingZeroBits(hash: Uint8Array): number {
  let n = 0;
  for (const b of hash) {
    if (b === 0) {
      n += 8;
      continue;
    }
    return n + Math.clz32(b) - 24;
  }
  return n;
}

async function solve(challenge: string, cancelled: () => boolean): Promise<string | null> {
  const [, nonce, bitsRaw] = challenge.split('.');
  const bits = Number(bitsRaw);
  for (let i = 0; ; i++) {
    if (i % 2000 === 0 && cancelled()) return null;
    const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(`${nonce}:${i}`)));
    if (leadingZeroBits(hash) >= bits) return String(i);
  }
}

function kb(bytes: number): string {
  return bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export const ContactForm: React.FC = () => {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<{ message: string; field?: string } | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const proof = useRef<Promise<{ challenge: string; solution: string } | null> | null>(null);
  const issuedAt = useRef(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);

  /** Fetch and solve a fresh challenge. Called on mount and after any refusal that used one up. */
  const prepare = useCallback(() => {
    let dead = false;
    issuedAt.current = Date.now();
    proof.current = (async () => {
      try {
        const res = await fetch(`${CONTACT_ENDPOINT}/v1/challenge`, { cache: 'no-store' });
        if (!res.ok) return null;
        const { challenge } = (await res.json()) as { challenge: string };
        const solution = await solve(challenge, () => dead);
        return solution === null ? null : { challenge, solution };
      } catch {
        return null;
      }
    })();
    return () => {
      dead = true;
    };
  }, []);

  useEffect(() => prepare(), [prepare]);

  useEffect(() => {
    if (status === 'sent' || status === 'error') statusRef.current?.focus();
  }, [status]);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const next = [...files];
    for (const f of Array.from(list)) {
      const ext = (f.name.split('.').pop() || '').toLowerCase();
      if (!ACCEPT_EXT.includes(ext)) {
        setError({ message: `${f.name} is not a type we accept. Attach an image, a PDF or a text file.`, field: 'attachments' });
        continue;
      }
      if (f.size > MAX_FILE) {
        setError({ message: `${f.name} is larger than 5 MB.`, field: 'attachments' });
        continue;
      }
      if (next.length >= MAX_FILES) {
        setError({ message: `Attach at most ${MAX_FILES} files.`, field: 'attachments' });
        break;
      }
      if (next.reduce((t, x) => t + x.size, 0) + f.size > MAX_TOTAL) {
        setError({ message: 'Attachments can add up to 10 MB.', field: 'attachments' });
        break;
      }
      next.push(f);
    }
    setFiles(next);
    if (fileInput.current) fileInput.current.value = '';
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === 'sending') return;
    const formEl = e.currentTarget;
    setError(null);
    setStatus('sending');

    // A person who opens the page and sends within three seconds is rare;
    // the relay refuses it, so wait out the remainder rather than fail.
    const wait = 3200 - (Date.now() - issuedAt.current);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));

    const solved = await proof.current;
    if (!solved) {
      setStatus('error');
      setError({ message: `The form could not reach our server. Check your connection, or write to ${SUPPORT_EMAIL}.` });
      prepare();
      return;
    }

    const data = new FormData(formEl);
    data.delete('attachments');
    for (const f of files) data.append('attachments', f, f.name);
    data.set('challenge', solved.challenge);
    data.set('solution', solved.solution);

    try {
      const res = await fetch(`${CONTACT_ENDPOINT}/v1/contact`, { method: 'POST', body: data });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; field?: string; retry?: boolean };
      if (res.ok && body.ok) {
        setStatus('sent');
        formEl.reset();
        setFiles([]);
        return;
      }
      setStatus('error');
      setError({ message: body.error || 'The message could not be sent. Try again in a minute.', field: body.field });
      if (body.retry || res.status === 409) prepare();
    } catch {
      setStatus('error');
      setError({ message: `The message could not be sent. Check your connection, or write to ${SUPPORT_EMAIL}.` });
    }
  };

  if (status === 'sent') {
    return (
      <div className="contact-done" role="status">
        <p ref={statusRef} tabIndex={-1} className="contact-done__title">
          Message sent.
        </p>
        <p>A person reads every message and replies to the address you gave.</p>
        <button
          type="button"
          className="btn btn--quiet"
          onClick={() => {
            setStatus('idle');
            prepare();
          }}
        >
          Send another message
        </button>
      </div>
    );
  }

  const invalid = (field: string) => (error?.field === field ? true : undefined);
  const describedBy = (field: string) => (error?.field === field ? 'contact-error' : undefined);

  return (
    <form className="contact-form" onSubmit={onSubmit} noValidate={false} aria-describedby="contact-privacy">
      <div className="contact-form__row">
        <label className="field">
          <span className="field__label">Your name</span>
          <input name="name" type="text" autoComplete="name" required maxLength={100} aria-invalid={invalid('name')} aria-describedby={describedBy('name')} />
        </label>
        <label className="field">
          <span className="field__label">Email, so we can reply</span>
          <input name="email" type="email" autoComplete="email" required maxLength={254} aria-invalid={invalid('email')} aria-describedby={describedBy('email')} />
        </label>
      </div>
      <div className="contact-form__row">
        <label className="field">
          <span className="field__label">What is it about?</span>
          <select name="topic" defaultValue="question">
            {TOPICS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field__label">
            Subject <span className="field__optional">(optional)</span>
          </span>
          <input name="subject" type="text" maxLength={150} />
        </label>
      </div>
      <label className="field">
        <span className="field__label">Message</span>
        <textarea
          name="message"
          rows={7}
          required
          minLength={10}
          maxLength={5000}
          aria-invalid={invalid('message')}
          aria-describedby={describedBy('message') ?? 'message-hint'}
        />
        <span className="field__hint" id="message-hint">
          For a problem, say what you expected and what happened instead. Your browser and extension version help.
        </span>
      </label>

      <div className="field">
        <span className="field__label" id="attach-label">
          Attachments <span className="field__optional">(optional)</span>
        </span>
        <div className="attach">
          <label className="btn btn--quiet btn--sm attach__pick">
            <Paperclip aria-hidden="true" size={16} />
            Add files
            <input
              ref={fileInput}
              className="visually-hidden"
              type="file"
              name="attachments"
              multiple
              accept={ACCEPT}
              aria-labelledby="attach-label"
              aria-describedby="attach-hint"
              onChange={(e) => addFiles(e.target.files)}
            />
          </label>
          <span className="field__hint" id="attach-hint">
            Up to 3 files, 5 MB each: screenshots, a PDF, or your exported settings (.json).
          </span>
        </div>
        {files.length > 0 && (
          <ul className="attach__list">
            {files.map((f, i) => (
              <li key={`${f.name}-${i}`}>
                <span>
                  {f.name} <span className="attach__size">{kb(f.size)}</span>
                </span>
                <button type="button" aria-label={`Remove ${f.name}`} onClick={() => setFiles(files.filter((_, j) => j !== i))}>
                  <X aria-hidden="true" size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Off screen and out of the tab order. A person never fills it; a bot fills everything. */}
      <div className="hp" aria-hidden="true">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {error && (
        <p id="contact-error" ref={statusRef} tabIndex={-1} className="contact-error" role="alert">
          {error.message}
        </p>
      )}

      <div className="contact-form__actions">
        <button type="submit" className="btn btn--primary btn--lg" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending...' : 'Send message'}
        </button>
        <p className="field__hint" id="contact-privacy">
          Sent to {SUPPORT_EMAIL} and used only to answer you. See the <a href={`${import.meta.env.BASE_URL}privacy/#website`}>privacy policy</a>.
        </p>
      </div>
    </form>
  );
};
