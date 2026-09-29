import React from 'react';
import { DocPage } from '../components/DocPage';
import { SiteLink as Link } from '../components/SiteLink';
import { REPO_URL, SUPPORT_EMAIL } from '../content/site';

// Updated by hand, so the page never claims to be fresher than the last
// time somebody actually read it. Same reason as in Privacy.tsx.
//
// Rewritten 2026-09-29. The earlier text forbade reverse engineering,
// modifying and making derivative works of the extension, which the MIT
// license it is published under explicitly allows; terms cannot take back
// what the license grants, so they now say the license governs the code.
const LAST_UPDATED = '29 September 2026';

export const Terms: React.FC = () => (
  <DocPage
    title="Terms of use"
    crumb="Terms"
    meta={<>Last updated {LAST_UPDATED}.</>}
    lede="The short version: the extension is free and open source, you may do with its code what the MIT license allows, and it comes with no warranty."
  >
    <h2>1. Who these terms are between</h2>
    <p>
      These terms are between you and PalWorks, who publish Gmail Labels and Search Queries as Tabs ("the extension")
      and this website. By installing the extension or using this site you accept them. If you do not accept them, do
      not install or use the extension.
    </p>

    <h2>2. The license</h2>
    <p>
      The extension's source code is published under the{' '}
      <a href={`${REPO_URL}/blob/main/LICENSE`} target="_blank" rel="noopener">
        MIT license
      </a>
      . It lets you use, copy, modify, merge, publish, distribute, sublicense and sell copies of the code, provided the
      copyright notice and the license are kept with it. Nothing in these terms limits what that license allows. If
      these terms and the license ever disagree about the code, the license wins.
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
      fullest extent the law allows. This is the same disclaimer the MIT license makes.
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
