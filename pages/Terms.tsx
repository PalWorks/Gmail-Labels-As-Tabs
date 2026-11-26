// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react';
import { DocPage } from '../components/DocPage';
import { SiteLink as Link } from '../components/SiteLink';
import { REPO_URL, SUPPORT_EMAIL } from '../content/site';

// Updated by hand, so the page never claims to be fresher than the last
// time somebody actually read it. Same reason as in Privacy.tsx.
//
// Rewritten 2026-09-29. The earlier text forbade reverse engineering,
// modifying and making derivative works of the extension, which its licence
// explicitly allows; terms cannot take back what the licence grants, so they
// say the licence governs the code. Updated 2026-11-26 for the move from MIT
// to the GNU AGPL 3.0 plus a commercial licence, from extension 1.9.0.
const LAST_UPDATED = '26 November 2026';

export const Terms: React.FC = () => (
  <DocPage
    title="Terms of use"
    crumb="Terms"
    meta={<>Last updated {LAST_UPDATED}.</>}
    lede="The short version: the extension is free and open source, you may do with its code what the GNU AGPL 3.0 allows, a commercial licence is available if you need other terms, and it comes with no warranty."
  >
    <h2>1. Who these terms are between</h2>
    <p>
      These terms are between you and PalWorks, who publish Gmail Labels and Search Queries as Tabs ("the extension")
      and this website. By installing the extension or using this site you accept them. If you do not accept them, do
      not install or use the extension.
    </p>

    <h2>2. The licence</h2>
    <p>
      From version 1.9.0 the extension's source code is published under the{' '}
      <a href={`${REPO_URL}/blob/main/LICENSE`} target="_blank" rel="noopener">
        GNU Affero General Public License 3.0
      </a>
      . It lets you use, study, change and share the code. If you distribute a modified version, or run one for others
      over a network, you must offer its complete source code under the same licence. Nothing in these terms limits
      what that licence allows. If these terms and the licence ever disagree about the code, the licence wins.
    </p>
    <p>
      To use the code without those obligations, for example inside a closed-source product, PalWorks offers a{' '}
      <a href={`${REPO_URL}/blob/main/COMMERCIAL-LICENSE.md`} target="_blank" rel="noopener">
        commercial licence
      </a>
      . Versions up to 1.8.1 were published under the MIT license, and copies of those versions keep it. Installing
      the extension from the Chrome Web Store is free for everyone and needs neither licence.
    </p>
    <p>
      The name "Gmail Labels and Search Queries as Tabs", the logo and this website's text and design are not part of
      that license. A modified copy you publish must not use the name or the logo in a way that suggests it is ours.
    </p>

    <h2>3. Using the extension</h2>
    <ul>
      <li>Use it lawfully, and only with Gmail accounts you are entitled to use.</li>
      <li>
        It works with Gmail and Google Chrome, which belong to Google and are governed by Google's own terms. The
        extension is not made, endorsed or supported by Google, and a change Google makes to Gmail can stop part of it
        working until we release a fix.
      </li>
      <li>
        It is free, has no paid tier, and we may change, improve or stop publishing it at any time. A version already
        installed keeps working as it is until you remove it or Chrome updates it.
      </li>
    </ul>

    <h2>4. Cleanup rules are yours to run</h2>
    <p>
      The extension can write a Google Apps Script from rules you set up, such as moving old promotions to Trash. It
      shows you the script; you decide whether to paste it into your own Google account, you schedule it, and it runs
      as you, under Google's terms, not ours. Read it before you run it. Mail it moves goes to Trash, where Gmail keeps
      it for 30 days, and you are responsible for the rules you choose to run.
    </p>

    <h2>5. Feedback and messages</h2>
    <p>
      When you send us feedback or a message, through the extension or the <Link to="/contact/">contact form</Link>,
      we use it to answer you and to improve the extension. Do not send anything you are not entitled to share, and do
      not send passwords or the contents of other people's mail. How we handle what you send is in the{' '}
      <Link to="/privacy/">privacy policy</Link>. Do not use the contact form to send spam, automated messages or
      anything harmful; we block traffic that does.
    </p>

    <h2>6. No warranty</h2>
    <p>
      The extension and this site are provided "as is" and "as available", without warranty of any kind, express or
      implied, including warranties of merchantability, fitness for a particular purpose and non-infringement, to the
      fullest extent the law allows. This matches the disclaimer in sections 15 and 16 of the GNU AGPL 3.0.
    </p>

    <h2>7. Limitation of liability</h2>
    <p>
      To the fullest extent the law allows, PalWorks and the extension's contributors are not liable for any indirect,
      incidental, special or consequential damages, or for any loss of data, mail, profits or business, arising from
      using or being unable to use the extension or this site. Some places do not allow these limits, and where they do
      not, they apply only as far as the law permits.
    </p>

    <h2>8. Changes to these terms</h2>
    <p>
      We may update these terms when the extension or this site changes. The date at the top moves when they do, and
      material changes are noted in the <Link to="/changelog/">changelog</Link>. Using the extension after a change
      means you accept the updated terms.
    </p>

    <h2>Contact</h2>
    <p>
      Questions about these terms: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>, or the{' '}
      <Link to="/contact/">contact page</Link>.
    </p>
  </DocPage>
);
