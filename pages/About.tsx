import React from 'react';
import { DocPage } from '../components/DocPage';
import { SiteLink as Link } from '../components/SiteLink';
import { LIVE_VERSION, ORG_URL, PRODUCT_NAME, REPO_URL, SUPPORT_EMAIL } from '../content/site';

export const About: React.FC = () => (
  <DocPage
    title="About Gmail Labels as Tabs"
    crumb="About"
    lede={`${PRODUCT_NAME} is a free, open source Chrome extension made by PalWorks. It exists because Gmail has no way to keep a label or a search one click away, and people who live in their labels spend the day scanning a sidebar.`}
  >
    <h2>Who makes it</h2>
    <p>
      PalWorks, a small product studio that builds and runs software (<a href={ORG_URL}>palworks.ai</a>). The extension
      is one of its products. The source code, the full changelog, the security notes and the tests are public in the{' '}
      <a href={REPO_URL} target="_blank" rel="noopener">
        GitHub repository
      </a>
      , so every claim on this site can be checked against the code. Version {LIVE_VERSION} is in the Chrome Web Store.
    </p>

    <h2>What it promises</h2>
    <ul>
      <li>
        <strong>Your mail stays in your browser.</strong> It reads label names and unread counts from the Gmail page you
        already have open, and never reads, stores or sends message content.
      </li>
      <li>
        <strong>No analytics, no tracking, no account.</strong> The extension contains no analytics and no third-party
        script, and needs no sign-in.
      </li>
      <li>
        <strong>Free, with nothing held back.</strong> No paid tier, no upsell, no ads, under the MIT license.
      </li>
      <li>
        <strong>It looks like Gmail.</strong> The bar follows Gmail's own theme and spacing, so it reads as part of the
        inbox rather than something laid over it.
      </li>
    </ul>

    <h2>How it is kept working</h2>
    <p>
      Gmail changes its page often and without notice, which is what breaks most Gmail extensions. Every change to the
      extension runs a full automated test suite first. A separate check runs every day against a real Gmail inbox and
      raises an alert when Gmail changes something the extension depends on, so a fix can ship before most people
      notice. Every release, and why each decision was made, is written down in the{' '}
      <Link to="/changelog/">changelog</Link> and in the repository.
    </p>

    <h2>Get in touch</h2>
    <p>
      A person reads every message. Use the <Link to="/contact/">contact page</Link> or write to{' '}
      <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
    </p>
  </DocPage>
);
