// SPDX-License-Identifier: AGPL-3.0-only
/**
 * UninstallForm.tsx
 *
 * The survey Chrome opens when someone removes the extension. It posts to the
 * same relay as the contact form (worker/, POST /v1/uninstall), with the same
 * challenge and honeypot, and the answer reaches support@palworks.ai. It
 * replaced a Tally form in 1.9.0, so nothing passes through a third party.
 *
 * Only the reason is asked for. Everything else is optional, and nothing
 * identifies the person unless they choose to leave an address. The version
 * comes from the address Chrome opened (?v=1.9.0), which the extension sets.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CONTACT_ENDPOINT, solve } from './ContactForm';
import { STORE_URL, SUPPORT_EMAIL } from '../content/site';

const REASONS: readonly { value: string; label: string }[] = [
  { value: 'broken', label: 'It stopped working or broke something in Gmail' },
  { value: 'conflict', label: 'It clashed with another extension' },
  { value: 'slow', label: 'It made Gmail slower' },
  { value: 'missing', label: 'It did not do something I needed' },
  { value: 'not-needed', label: 'I did not need it after all' },
  { value: 'temporary', label: 'Removing it for now; I will be back' },
  { value: 'other', label: 'Something else' },
];

type Status = 'idle' | 'sending' | 'sent' | 'error';

function versionFromAddress(): string {
  if (typeof window === 'undefined') return '';
  const v = new URLSearchParams(window.location.search).get('v') || '';
  return /^\d{1,3}(\.\d{1,5}){0,3}$/.test(v) ? v : '';
}

export const UninstallForm: React.FC = () => {
  const [status, setStatus] = useState<Status>('idle');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<{ message: string; field?: string } | null>(null);
  const proof = useRef<Promise<{ challenge: string; solution: string } | null> | null>(null);
  const issuedAt = useRef(0);
  const statusRef = useRef<HTMLParagraphElement>(null);

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

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === 'sending') return;
    if (!reason) {
      setStatus('error');
      setError({ message: 'Choose the reason closest to yours, then send.', field: 'reason' });
      return;
    }
    const formEl = e.currentTarget;
    setError(null);
    setStatus('sending');

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
    data.set('version', versionFromAddress());
    data.set('challenge', solved.challenge);
    data.set('solution', solved.solution);

    try {
      const res = await fetch(`${CONTACT_ENDPOINT}/v1/uninstall`, { method: 'POST', body: data });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; field?: string; retry?: boolean };
      if (res.ok && body.ok) {
        setStatus('sent');
        return;
      }
      setStatus('error');
      setError({ message: body.error || 'That could not be sent. Try again in a minute.', field: body.field });
      if (body.retry || res.status === 409) prepare();
    } catch {
      setStatus('error');
      setError({ message: `That could not be sent. Check your connection, or write to ${SUPPORT_EMAIL}.` });
    }
  };

  if (status === 'sent') {
    return (
      <div className="contact-done" role="status">
        <p ref={statusRef} tabIndex={-1} className="contact-done__title">
          Thank you. A person reads every answer.
        </p>
        <p>
          Changed your mind? <a href={STORE_URL}>Add it back from the Chrome Web Store</a>. Your tabs come back if you
          exported them first, or if Chrome sync kept them.
        </p>
      </div>
    );
  }

  const invalid = (field: string) => (error?.field === field ? true : undefined);

  return (
    <form className="contact-form" onSubmit={onSubmit} aria-describedby="uninstall-privacy">
      <fieldset className="field uninstall-reasons" aria-invalid={invalid('reason')}>
        <legend className="field__label">Why did you remove it?</legend>
        {REASONS.map((r) => (
          <label key={r.value} className="uninstall-reason">
            <input type="radio" name="reason" value={r.value} checked={reason === r.value} onChange={() => setReason(r.value)} />
            <span>{r.label}</span>
          </label>
        ))}
      </fieldset>

      {reason === 'conflict' && (
        <label className="field">
          <span className="field__label">
            Which extension? <span className="field__optional">(optional)</span>
          </span>
          <input name="otherExtension" type="text" maxLength={100} autoComplete="off" />
        </label>
      )}

      <label className="field">
        <span className="field__label">
          Anything we should fix? <span className="field__optional">(optional)</span>
        </span>
        <textarea name="details" rows={4} maxLength={2000} aria-invalid={invalid('details')} />
      </label>

      <label className="field">
        <span className="field__label">
          Your email, if you would like a reply <span className="field__optional">(optional)</span>
        </span>
        <input name="email" type="email" autoComplete="email" maxLength={254} aria-invalid={invalid('email')} />
      </label>

      <div className="hp" aria-hidden="true">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {error && (
        <p ref={statusRef} tabIndex={-1} className="contact-error" role="alert">
          {error.message}
        </p>
      )}

      <div className="contact-form__actions">
        <button type="submit" className="btn btn--primary btn--lg" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending...' : 'Send my answer'}
        </button>
        <p className="field__hint" id="uninstall-privacy">
          Sent to {SUPPORT_EMAIL} with the extension version, and nothing else unless you add it. See the{' '}
          <a href={`${import.meta.env.BASE_URL}privacy/#uninstall`}>privacy policy</a>.
        </p>
      </div>
    </form>
  );
};
