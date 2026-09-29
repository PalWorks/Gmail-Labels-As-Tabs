# The contact form relay

**Deployed and live** at `https://gmail-tabs-contact.palworks.ai`, a Cloudflare Worker on
the account pinned in `wrangler.toml`. The site's [/contact/](../pages/Contact.tsx) form
posts here, and this sends the message to `support@palworks.ai` through Resend, from
`support.gmailtabs@palworks.ai`, with the visitor's address as Reply-To. Verified end to
end on 2026-09-29: the message, with a JSON attachment, was delivered.

The site is static, so it cannot hold a Resend key: a key in a public page is a public key.

## What it is made of

| | |
|---|---|
| Worker | `gmail-tabs-contact` |
| Hostname | `gmail-tabs-contact.palworks.ai`, a custom domain created by `wrangler deploy`. No workers.dev, no preview URLs |
| Secrets | `RESEND_API_KEY`: a Resend **sending_access** key named `gmail-tabs-website-contact`, scoped to the `palworks.ai` domain alone. `CHALLENGE_SECRET`: random, signs challenges and names IPs in counters |
| KV | `gmail-tabs-contact-counters`: rate-limit counters and used challenge ids, every key expiring within 26 hours. Never any message content |
| Rate limit | Cloudflare's binding, about 5 a minute per IP, plus daily caps: 10 per IP, 200 for everyone |

Its own key and its own KV, shared with no other PalWorks product, so revoking either stops
nothing else.

## Endpoints

| | |
|---|---|
| `GET /v1/challenge` | A challenge: `issued.nonce.bits.signature` |
| `POST /v1/contact` | `multipart/form-data`: `name`, `email`, `topic`, `subject`, `message`, up to 3 `attachments`, `challenge`, `solution`, and the honeypot `website` |
| `GET /health` | `{"ok":true}` |

## Defences, in the order they run

1. **Origin** must be `https://palworks.github.io`, or localhost in development. Anything
   else gets 403 before any work is done.
2. **Size** is capped at 11 MB from the declared length, before the body is read.
3. **Honeypot.** A field a person never sees. Filled means dropped, answered with 200 so a
   bot learns nothing.
4. **Challenge.** Signed by this Worker (HMAC-SHA256), at least 3 seconds and at most
   2 hours old, and solved by finding a number whose SHA-256 with the nonce starts with
   16 zero bits: about 65,000 hashes, under a second in a browser, and paid again for
   every message a bot sends.
5. **Validation.** Name, a single plausible email, a message of 10 to 5,000 characters with
   at most 5 links; control characters stripped, so nothing can inject a header.
   Attachments: at most 3, 5 MB each, 10 MB together, and judged by their bytes (PNG, JPEG,
   GIF, WebP, PDF, or UTF-8 text with no NUL byte). A file whose name claims a different
   type than its bytes is refused. Filenames are rewritten to a safe alphabet.
6. **Rate limits**, only after validation, so a message that needs a correction costs no
   quota and keeps its challenge.
7. **Each challenge works once.**

It can only ever mail `support@palworks.ai`: the recipient is configuration, and the
visitor's address is only a Reply-To. For the same reason it sends the visitor no
confirmation, since an auto-reply to a typed-in address is a way to mail strangers.

## Test and deploy

```bash
npm test               # logic tests, plain Node
npm run typecheck
npx wrangler deploy
bash test/live.sh      # against the deployed worker; sends ONE real email. NO_SEND=1 to skip it
```

`test/live.sh` checks every refusal above against the live Worker. On a machine whose DNS
still caches the name as missing, pin it: `RESOLVE=$(dig +short gmail-tabs-contact.palworks.ai @1.1.1.1 | head -1) bash test/live.sh`.

## Rotating a secret

```bash
resend api-keys create --name gmail-tabs-website-contact --permission sending_access \
  --domain-id <palworks.ai domain id> -p support_palworks.ai --json   # prints the token once
npx wrangler secret put RESEND_API_KEY      # paste it
# then delete the old key in Resend
openssl rand -base64 48 | npx wrangler secret put CHALLENGE_SECRET
```

Rotating `CHALLENGE_SECRET` invalidates any challenge a visitor already holds; their next
send gets a fresh one.
