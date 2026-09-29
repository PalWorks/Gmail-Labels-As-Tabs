import React from 'react';
import { SiteLink as Link } from './SiteLink';
import { LIVE_VERSION, ORG_NAME, PRODUCT_NAME, REPO_URL, SHORT_NAME, SUPPORT_EMAIL } from '../content/site';
import { storeLink } from '../lib/links';

export const Footer: React.FC = () => (
  <footer className="site-foot">
    <div className="site-foot__inner">
      <div className="site-foot__about">
        <Link to="/" className="site-foot__brand">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" width={28} height={28} />
          <span>{SHORT_NAME}</span>
        </Link>
        <p>
          {PRODUCT_NAME} is a free, open source Chrome extension by {ORG_NAME}. Version {LIVE_VERSION} is in the
          Chrome Web Store.
        </p>
      </div>
      <nav aria-label="Product" className="site-foot__col">
        <p className="site-foot__heading">Product</p>
        <a href={storeLink('footer')} target="_blank" rel="noopener">Chrome Web Store</a>
        <Link to="/#tour">Take the tour</Link>
        <Link to="/gmail-custom-tabs/">Custom tabs in Gmail, compared</Link>
        <Link to="/changelog/">Changelog</Link>
        <a href={REPO_URL} target="_blank" rel="noopener">Source code on GitHub</a>
      </nav>
      <nav aria-label="Support and legal" className="site-foot__col">
        <p className="site-foot__heading">Support</p>
        <Link to="/contact/">Contact and support</Link>
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
        <Link to="/privacy/">Privacy policy</Link>
        <Link to="/terms/">Terms</Link>
      </nav>
    </div>
    <p className="site-foot__legal">
      MIT licensed. Not affiliated with, endorsed by or sponsored by Google. Gmail and Chrome are trademarks of Google
      LLC.
    </p>
  </footer>
);
