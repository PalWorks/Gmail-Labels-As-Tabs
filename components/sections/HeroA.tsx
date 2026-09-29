/**
 * HeroA.tsx
 *
 * Design A, "Tab strip". The headline is the product's own promise, and under
 * it the bar itself, drawn at the size of a headline: the thing you get,
 * shown before anything is said about it. The saved search arrives last,
 * from the + button, which is the one gesture the product is built around.
 */

import React from 'react';
import { BarControls, TabPill } from '../TabPill';
import { storeLink } from '../../lib/links';

export const HeroA: React.FC = () => (
  <section className="hero-a" aria-labelledby="hero-title">
    <div className="wrap hero-a__copy">
      <p className="hero-a__eyebrow">Free Chrome extension for Gmail</p>
      <h1 id="hero-title">
        Your Gmail labels and searches, <span className="hero-a__em">as tabs.</span>
      </h1>
      <p className="hero-a__lede">
        The views you open all day, one click each, in a bar above the inbox. Live unread counts, your colours, your
        order. It never reads your mail.
      </p>
      <div className="hero-a__actions">
        <a className="btn btn--primary btn--lg" href={storeLink('hero')} target="_blank" rel="noopener">
          Add to Chrome, free
        </a>
        <a className="btn btn--quiet btn--lg" href="#tour">
          Take the one-minute tour
        </a>
      </div>
    </div>
    <figure className="hero-a__stage">
      <div className="hero-a__bar" aria-hidden="true">
        <TabPill label="Inbox" count={24} active className="hero-a__tab" style={{ '--i': 0 } as React.CSSProperties} />
        <TabPill label="Clients" count={6} colour="orange" className="hero-a__tab" style={{ '--i': 1 } as React.CSSProperties} />
        <TabPill label="Invoices" count={3} colour="green" className="hero-a__tab" style={{ '--i': 2 } as React.CSSProperties} />
        <TabPill label="Team" count={11} colour="purple" className="hero-a__tab" style={{ '--i': 3 } as React.CSSProperties} />
        <TabPill
          label="is:unread has:attachment"
          count={2}
          colour="teal"
          query
          className="hero-a__tab hero-a__tab--saved"
          style={{ '--i': 5 } as React.CSSProperties}
        />
        <BarControls />
      </div>
      <figcaption className="hero-a__caption">
        Labels and a saved search, as the extension draws them above Gmail's inbox.
      </figcaption>
    </figure>
  </section>
);
