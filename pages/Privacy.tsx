import React from 'react';
import { SiteLink as Link } from '../components/SiteLink';
import { DocPage } from '../components/DocPage';

// Keep this in step with the extension. Every claim below is checked against
// SECURITY.md and DECISIONS.md in the extension repository, and the version
// and date are updated by hand so the page never claims to be fresher than
// the last time somebody actually read it.
const LAST_UPDATED = '30 September 2026';
const COVERS_VERSION = '1.8.0';

export const Privacy: React.FC = () => (
  <DocPage
    title="Privacy policy"
    crumb="Privacy policy"
    meta={<>Last updated {LAST_UPDATED}. Covers extension version {COVERS_VERSION}.</>}
  >


            <h2>1. The short version</h2>
            <p>
              Gmail Labels and Search Queries as Tabs ("the extension") reads your Gmail page to draw a
              tab bar and to count unread messages. It does that entirely inside your browser. It
              has no database, no account, no analytics and no advertising, and it never sends your
              mail, your contacts, your label names or your tab names anywhere. The one thing about
              your mail that can leave is a sender's domain, and only if you turn website icons on
              (section 4c). The one server of ours the extension ever talks to is the feedback
              relay described in section 4, which is reached only when you press Send and which
              stores nothing.
            </p>
            <p>
              Exactly three things can ever leave your browser, and all three are listed in full in
              section 4. One happens only when you press a button. One happens only after you have
              already uninstalled. The third happens only if you turn on two settings that are off
              by default, and it sends a sender's domain and nothing else.
            </p>

            <h2>2. What the extension stores, and where</h2>
            <ul>
              <li>
                <strong>Your tabs and automation rules</strong> are stored in
                {' '}<code>chrome.storage.sync</code>, keyed per Gmail account. Chrome syncs that
                between your own signed-in Chrome browsers, the same way it syncs your bookmarks.
                It goes to Google, under your own Google account, and never to us.
              </li>
              <li>
                <strong>Your theme preference</strong> is stored in <code>chrome.storage.local</code>,
                which stays on the one device.
              </li>
              <li>
                <strong>Two diagnostic records</strong> are also kept in <code>chrome.storage.local</code>:
                whether the parts of the extension that reach into Gmail worked the last time they
                were tried, and the names Gmail's page used for its inbox rows the last time sender
                icons drew them. Neither holds anything about your mail, and neither is ever sent.
              </li>
              <li>
                <strong>Nothing else is stored.</strong> No message, subject, sender, address or
                attachment is written to storage at any point.
              </li>
            </ul>
            <p>
              You can see everything the extension holds, export it as a JSON file, or delete it,
              from the extension's own Settings page. Removing the extension removes its storage.
            </p>

            <h2>3. What the extension reads from Gmail</h2>
            <p>
              To draw the bar and keep unread counts current, the extension reads Gmail's page, its
              own unread Atom feed and the responses to Gmail's own network requests, all on
              <code> mail.google.com</code>. This is how it learns your label list and how many
              unread messages each label has.
            </p>
            <p>
              That reading happens in your browser and stops there. It is not logged, not stored and
              not transmitted. The extension has no Gmail API access, no OAuth token and no API key.
            </p>

            <h2>4. The three things that can leave your browser</h2>
            <p>
              <strong>a. Feedback you choose to send.</strong> If you fill in the Support &amp;
              Feedback form inside the extension and press Send, we receive your message, the
              category you picked, and the reply address only if you typed one. A tick box, on by
              default and clearly labelled, also attaches the extension version, your browser build,
              and the number of tabs, rules and accounts you have. Never label names, tab names,
              contacts or mail. It is sent to our own relay at
              {' '}<code>gmail-tabs-feedback.sunmooncal.workers.dev</code>, which forwards it to our
              support mailbox and stores nothing. Nothing is sent if you do not press Send.
            </p>
            <p>
              <strong>b. A page that opens after you uninstall.</strong> When you remove the
              extension, Chrome opens a short feedback form hosted by Tally at
              {' '}<code>tally.so</code>, so we can learn why people leave. The extension sends
              nothing itself: Chrome navigates you to a plain form link that carries no email
              address, no settings and no identifier, so Tally learns only that somebody
              uninstalled, never who. Answering is optional and closing the tab sends nothing. If
              you do fill it in, Tally processes it under
              {' '}<a href="https://tally.so/help/privacy-policy" target="_blank" rel="noopener noreferrer">their privacy policy</a>.
            </p>
            <p>
              <strong>c. Website icons, only if you turn them on.</strong> Sender icons, added in
              1.8.0, put a small chip in each inbox row naming the organisation the mail is from.
              They are off by default, and turned on they draw a coloured letter and request
              nothing. Only if you also turn on <em>Load website icons</em> does the extension ask
              Google's icon service for each sender's website icon, at <code>t0.gstatic.com</code>,
              or at <code>www.google.com</code> if that cannot be reached. What it sends is the
              sender's domain alone, such as <code>example.com</code>: never the address, the name,
              the subject or anything in the message. The request carries no referrer, and each
              domain is asked once and remembered for the session. Google handles those requests
              under its own privacy policy.
            </p>

            <h2>5. Permissions, and why each one exists</h2>
            <ul>
              <li><code>storage</code>: save your tabs, rules, preferences and theme.</li>
              <li><code>downloads</code>: write the JSON backup file when you press Export.</li>
              <li><code>management</code>: let the Uninstall button in Settings remove the extension.</li>
              <li><code>scripting</code>: start the tab bar in a Gmail tab you already had open. Chrome
                only runs an extension in pages opened after it is installed or updated, so without this
                you would have to reload Gmail by hand before the bar appeared. Added in 1.7.3.</li>
              <li><code>host permission for https://mail.google.com/*</code>: run inside Gmail, which is the whole point.</li>
            </ul>
            <p>
              There is no <code>&lt;all_urls&gt;</code> and no access to any other site. The
              {' '}<code>scripting</code> permission injects one file, the extension's own content
              script, and only into <code>mail.google.com</code>: it cannot run on any page other
              than Gmail, and it never loads code from anywhere else.
            </p>

            <h2>6. Automation rules run under your account, not ours</h2>
            <p>
              The automation feature generates Google Apps Script code and shows it to you. You
              choose whether to paste it into your own Google account and run it. It executes as
              you, on Google's infrastructure, and we never see it run, never receive its output,
              and cannot trigger it.
            </p>

            <h2 id="website">7. This website</h2>
            <p>
              This site is measured, and the extension is not. The distinction matters, so here is
              exactly what runs on the pages you are reading now:
            </p>
            <ul>
              <li>
                <strong>Google Analytics</strong> (GA4), which counts visits, pages and referrers.
              </li>
              <li>
                <strong>Microsoft Clarity</strong>, which records how pages are used: clicks,
                scrolling and mouse movement, replayed as anonymised sessions and aggregated into
                heatmaps. It is a usability tool, and we use it to see which parts of a page people
                give up on.
              </li>
              <li>
                <strong>Google Fonts</strong>, which serves the typefaces, so your browser asks
                Google for them as it would for any site that uses them.
              </li>
              <li>
                <strong>YouTube</strong>, only if you press play on the homepage video. Until then
                the page shows a picture we host, and nothing is fetched from YouTube. Pressing play
                loads YouTube's privacy-enhanced player, from <code>youtube-nocookie.com</code>,
                under{' '}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Google's privacy policy</a>.
              </li>
            </ul>
            <p>
              <strong>The contact form.</strong> When you press Send on the{' '}
              <Link to="/contact/">contact page</Link>, your name, email address, topic, subject,
              message and any files you attached go to our own relay at{' '}
              <code>gmail-tabs-contact.palworks.ai</code>, which runs on Cloudflare. The relay
              checks the message and passes it to Resend, an email delivery service, which
              delivers it to our support mailbox, <code>support@palworks.ai</code>. Your address is
              used as the reply address, so that we can answer you, and for nothing else: we send
              no newsletter and add you to no list. The relay stores none of it. To limit abuse it
              keeps a count of messages per network for up to a day, under a keyed hash of your IP
              address rather than the address itself, and Cloudflare sees the IP address as it
              does for any site it serves. Resend keeps a copy of sent messages for a limited
              period under{' '}
              <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">its privacy policy</a>.
              We keep your message in the support mailbox for as long as it takes to deal with it,
              and delete it when you ask.
            </p>
            <p>
              Before you press Send, the form does a small amount of work in your browser to prove
              it is not an automated script. That work involves no tracking, no cookie and no
              third-party service.
            </p>
            <p>
              None of this is in the extension. The extension contains no analytics, no session
              recording and no third-party script of any kind. If you install it and never visit
              this site, nothing on this list ever runs.
            </p>

            <h2>8. Your data, and your rights</h2>
            <p>
              We hold personal data only when you send it to us: a feedback message from inside the
              extension, or a message through the contact form. You can ask us what we hold, ask us
              to correct it, or ask us to delete it, by writing to{' '}
              <a href="mailto:support@palworks.ai">support@palworks.ai</a>. Everything else the
              extension keeps is in your own browser, where you can see it, export it or delete it
              from the extension's Settings page, and removing the extension removes it.
            </p>
            <p>
              The extension and this site are not directed at children under 13, and we knowingly
              collect nothing from them.
            </p>

            <h2>9. Changes to this policy</h2>
            <p>
              If what the extension does changes, this page changes with it, and the date and
              version at the top move. Material changes are also recorded in the
              {' '}<Link to="/changelog/">changelog</Link>.
            </p>

            <h2>Contact</h2>
            <p>
              PalWorks publishes the extension and this site. Questions, corrections or a
              deletion request: use the Support &amp; Feedback page inside the extension, write to <a href="mailto:support@palworks.ai">support@palworks.ai</a>,
              or get in touch <Link to="/contact/">here</Link>.
            </p>
  </DocPage>
);
