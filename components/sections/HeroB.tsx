/**
 * HeroB.tsx
 *
 * Design B, "Operator". The hero is the moment the product exists for: a
 * search you would otherwise type again tomorrow, typed once, then kept. The
 * query types itself into a search box at headline size, the + is pressed,
 * and the search drops into the bar as a tab with its count.
 *
 * The finished state is what is rendered on the server, so a crawler, a
 * visitor without JavaScript and anyone who prefers reduced motion all see
 * the whole query and the tab. Only a browser that allows motion rewinds it
 * and plays it.
 */

import React, { useEffect, useState } from 'react';
import { BarControls, TabPill } from '../TabPill';
import { storeLink } from '../../lib/links';

const QUERY = 'from:accounts@ has:attachment newer_than:30d';

type Phase = 'typing' | 'pressing' | 'saved';

export const HeroB: React.FC = () => {
  const [typed, setTyped] = useState(QUERY.length);
  const [phase, setPhase] = useState<Phase>('saved');

  useEffect(() => {
    let reduce = false;
    try {
      reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      reduce = false;
    }
    if (reduce) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    setTyped(0);
    setPhase('typing');
    const start = 500;
    for (let i = 1; i <= QUERY.length; i++) {
      timers.push(setTimeout(() => setTyped(i), start + i * 45));
    }
    const done = start + QUERY.length * 45;
    timers.push(setTimeout(() => setPhase('pressing'), done + 450));
    timers.push(setTimeout(() => setPhase('saved'), done + 900));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <section className={`hero-b is-${phase}`} aria-labelledby="hero-title">
      <div className="wrap hero-b__inner">
        <p className="hero-b__eyebrow">Gmail Labels and Search Queries as Tabs</p>
        <h1 id="hero-title">Stop retyping your Gmail searches.</h1>
        <p className="hero-b__lede">
          Any label or search becomes a tab above your inbox, with its unread count. Type it once. Click it forever.
        </p>

        <figure className="hero-b__demo">
          <div className="hero-b__search">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="hero-b__glass">
              <path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 10-.7.7l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0a4.5 4.5 0 110-9 4.5 4.5 0 010 9z" />
            </svg>
            <code className="hero-b__query">
              <span>{QUERY.slice(0, typed)}</span>
              <span className="hero-b__caret" aria-hidden="true" />
              {/* The full query, invisible, holds the box at its final width so nothing moves while it types. */}
              <span className="hero-b__ghost" aria-hidden="true">
                {QUERY.slice(typed)}
              </span>
            </code>
          </div>
          <div className="hero-b__bar" aria-hidden="true">
            <TabPill label="Inbox" count={24} active />
            <TabPill label="Clients" count={6} colour="orange" />
            <TabPill label="Supplier invoices" count={3} colour="yellow" className="hero-b__new" />
            <BarControls />
          </div>
          <figcaption className="visually-hidden">
            The search {QUERY} saved as a tab named Supplier invoices, showing three unread messages.
          </figcaption>
        </figure>

        <div className="hero-b__actions">
          <a className="btn btn--primary btn--lg" href={storeLink('hero')} target="_blank" rel="noopener">
            Add to Chrome, free
          </a>
          <a className="btn btn--ghost btn--lg" href="#tour">
            Watch the one-minute tour
          </a>
        </div>
      </div>
    </section>
  );
};

/** Searches worth a tab, each one a real Gmail query. */
const SHELF: readonly { title: string; query: string; why: string }[] = [
  { title: 'A client, everything', query: 'from:@northwind.com', why: 'Every message from one company, whoever sent it.' },
  { title: 'Invoices this month', query: 'subject:invoice newer_than:30d', why: 'The bills that arrived lately, and nothing older.' },
  { title: 'Unread with files', query: 'is:unread has:attachment', why: 'The messages that want something opened.' },
  { title: 'Starred, not done', query: 'is:starred is:unread', why: 'What you flagged and have not read yet.' },
  { title: 'Big attachments', query: 'has:attachment larger:10M', why: 'Where your storage went.' },
  { title: 'Old promotions', query: 'category:promotions older_than:30d', why: 'The pile a cleanup rule can clear for you.' },
];

export const OperatorShelf: React.FC = () => (
  <section className="section section--shelf" id="searches" aria-labelledby="shelf">
    <div className="wrap">
      <div className="section-head">
        <p className="kicker">Searches worth a tab</p>
        <h2 id="shelf">If you have typed it twice, it should be a tab</h2>
        <p className="lede">Every Gmail search operator works. A few that people keep:</p>
      </div>
      <ul className="shelf">
        {SHELF.map((s) => (
          <li key={s.query} className="shelf__item">
            <h3>{s.title}</h3>
            <code className="operator">{s.query}</code>
            <p>{s.why}</p>
          </li>
        ))}
      </ul>
    </div>
  </section>
);
