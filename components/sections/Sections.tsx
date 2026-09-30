/**
 * Sections.tsx
 *
 * The homepage sections both designs share. Their words come from content/,
 * the same modules the structured data and llms.txt are written from; each
 * design styles them in its own stylesheet.
 */

import React from 'react';
import { SiteLink as Link } from '../SiteLink';
import { Check, Minus } from 'lucide-react';
import { Tour } from '../Tour';
import { SLIDES } from '../../vendor/onboarding/wizardContent';
import { LIVE_FEATURES, UPCOMING_FEATURES } from '../../content/features';
import { HOWTO_STEPS, HOWTO_TITLE } from '../../content/howto';
import { FAQ_ITEMS } from '../../content/faq';
import { GUIDE_COMPARISON } from '../../content/guide';
import { LIVE_VERSION, NEXT_VERSION, REPO_URL, isLive } from '../../content/site';
import { storeLink } from '../../lib/links';
import { VIDEO, clock, watchAt } from '../../content/video';
import { VideoPlayer } from '../VideoPlayer';

export const SectionHead: React.FC<{ id?: string; kicker: string; title: string; lede?: React.ReactNode }> = ({
  id,
  kicker,
  title,
  lede,
}) => (
  <div className="section-head">
    <p className="kicker">{kicker}</p>
    <h2 id={id ? `${id}-title` : undefined}>{title}</h2>
    {lede && <p className="lede">{lede}</p>}
  </div>
);

/** Five things anyone can check, in the repository or the store. */
export const FactsStrip: React.FC = () => (
  <ul className="facts" aria-label="At a glance">
    <li>
      <strong>Free</strong> and MIT licensed
    </li>
    <li>
      Runs only on <strong>mail.google.com</strong>
    </li>
    <li>
      <strong>Never reads</strong> your messages
    </li>
    <li>
      <strong>No analytics</strong> in the extension
    </li>
    <li>
      Syncs through <strong>Chrome</strong>
    </li>
  </ul>
);

export const TourSection: React.FC = () => (
  <section className="section section--tour" id="tour" aria-labelledby="tour-title">
    <div className="wrap">
      <SectionHead
        id="tour"
        kicker="Take the tour"
        title="See it work before you install"
        lede="This is the extension's own tour, the one it opens over Gmail on the day you install it, running here. Six steps, about a minute."
      />
      <div className="tour-layout">
        <ol className="tour-steps" aria-label="What the tour shows">
          {SLIDES.map((s) => (
            <li key={s.title}>
              <span className="tour-steps__title">{s.title}</span>
              <span className="tour-steps__caption">{s.caption}</span>
            </li>
          ))}
        </ol>
        <Tour />
      </div>
    </div>
  </section>
);

export const FeaturesSection: React.FC = () => (
  <section className="section section--features" id="features" aria-labelledby="features-title">
    <div className="wrap">
      <SectionHead
        id="features"
        kicker="Features"
        title="Everything a tab bar for Gmail should do"
        lede="And nothing that needs your mail to do it."
      />
      <ul className="feature-grid">
        {LIVE_FEATURES.map((f) => (
          <li key={f.key} className={`feature feature--${f.key}`}>
            <h3>{f.title}</h3>
            <p>{f.body}</p>
            {f.example && <code className="operator">{f.example}</code>}
          </li>
        ))}
      </ul>
      <p className="section-more">
        <Link to="/gmail-search-operators/">Every Gmail search operator, with the searches worth keeping as a tab</Link>
      </p>
    </div>
  </section>
);

/** Built and tested, not in the store: its own section, so nothing reads it as available. */
export const UpcomingSection: React.FC = () =>
  UPCOMING_FEATURES.length === 0 ? null : (
    <section className="section section--upcoming" id="next-release" aria-labelledby="next-release-title">
      <div className="wrap">
        <div className="upcoming">
          <p className="kicker">Not released yet</p>
          <h2 id="next-release-title">Coming in version {NEXT_VERSION}</h2>
          <p className="upcoming__note">
            Built and tested, and not yet in the Chrome Web Store. The version you install today is {LIVE_VERSION}.
          </p>
          <ul>
            {UPCOMING_FEATURES.map((f) => (
              <li key={f.key}>
                <strong>{f.title}.</strong> {f.body}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );

export const HowItWorks: React.FC = () => (
  <section className="section section--how" id="how-it-works" aria-labelledby="how-it-works-title">
    <div className="wrap">
      <SectionHead id="how-it-works" kicker="How it works" title={HOWTO_TITLE} lede="About a minute, the first time." />
      <ol className="steps">
        {HOWTO_STEPS.map((s, i) => (
          <li key={s.name} className="step">
            <span className="step__n" aria-hidden="true">
              {i + 1}
            </span>
            <h3>{s.name}</h3>
            <p>{s.text}</p>
          </li>
        ))}
      </ol>
    </div>
  </section>
);

const Cell: React.FC<{ value: string; ours: boolean; plain?: boolean }> = ({ value, ours, plain }) => {
  const yes = !plain && value.startsWith('Yes');
  const no = !plain && value.startsWith('No');
  return (
    <td className={ours ? 'is-ours' : undefined}>
      {yes && <Check className="cell-icon cell-icon--yes" aria-hidden="true" />}
      {no && <Minus className="cell-icon cell-icon--no" aria-hidden="true" />}
      <span>{value}</span>
    </td>
  );
};

export const CompareTable: React.FC<{ caption?: string }> = ({ caption }) => (
  <div className="compare-scroll">
    <table className="compare">
      {caption && <caption>{caption}</caption>}
      <thead>
        <tr>
          <td />
          {GUIDE_COMPARISON.columns.map((c, i) => (
            <th scope="col" key={c} className={i === GUIDE_COMPARISON.columns.length - 1 ? 'is-ours' : undefined}>
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {GUIDE_COMPARISON.rows.map((r) => (
          <tr key={r.label}>
            <th scope="row">{r.label}</th>
            {r.values.map((v, i) => (
              <Cell key={i} value={v} ours={i === r.values.length - 1} plain={'plain' in r && r.plain} />
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/** The product video: the real extension in a real Gmail, message content blurred. */
export const VideoSection: React.FC = () => (
  <section className="section section--video" id="video" aria-labelledby="video-title">
    <div className="wrap">
      <SectionHead
        id="video"
        kicker="Watch it"
        title="90 seconds in a real inbox"
        lede="Recorded from the extension in a signed-in Gmail. Message content is blurred, and there is no sound: the captions tell the story."
      />
      <div className="video-layout">
        <VideoPlayer />
        <ol className="chapters" aria-label="Chapters">
          {VIDEO.chapters.map((c) => (
            <li key={c.start}>
              <a href={watchAt(c.start)} target="_blank" rel="noopener">
                <time className="chapters__at" dateTime={`PT${c.start}S`}>
                  {clock(c.start)}
                </time>
                <span>{c.title}</span>
              </a>
            </li>
          ))}
        </ol>
      </div>
    </div>
  </section>
);

export const CompareSection: React.FC = () => (
  <section className="section section--compare" id="compare" aria-labelledby="compare-title">
    <div className="wrap">
      <SectionHead
        id="compare"
        kicker="Compared"
        title="What Gmail offers on its own"
        lede="Gmail has three ways to keep a view close. Each is good at something."
      />
      <CompareTable caption="Ways to keep a Gmail view one click away" />
      <p className="section-more">
        <Link to="/gmail-custom-tabs/">Read the full comparison, and when Gmail's own options are enough</Link>
      </p>
    </div>
  </section>
);

export const PrivacySection: React.FC = () => (
  <section className="section section--privacy" id="privacy" aria-labelledby="privacy-title">
    <div className="wrap">
      <SectionHead
        id="privacy"
        kicker="Privacy"
        title="Your mail stays in your browser"
        lede="The extension reads label names and unread counts from the Gmail page you already have open. Message content is never read, stored or sent."
      />
      <div className="privacy-grid">
        <div className="privacy-card">
          <h3>What it stores</h3>
          <p>Your tabs, colours, order, rules and theme, in Chrome's own storage, synced by Chrome like your bookmarks.</p>
        </div>
        <div className="privacy-card">
          <h3>What it never touches</h3>
          <p>Messages, subjects, contacts and attachments. It has no Gmail API access, no sign-in and no server holding your settings.</p>
        </div>
        <div className="privacy-card">
          <h3>What can leave</h3>
          <p>
            {isLive('1.8.0')
              ? "A feedback message when you press Send, an optional survey after you uninstall, and a sender's domain if you turn on website icons. Each is listed in full in the policy."
              : 'Only what you send: a feedback message when you press Send, and an optional survey after you uninstall. Both are listed in full in the policy.'}
          </p>
        </div>
      </div>
      <p className="section-more">
        <Link to="/privacy/">Read the privacy policy</Link>
        <span aria-hidden="true"> · </span>
        <a href={REPO_URL} target="_blank" rel="noopener">
          Read the source
        </a>
      </p>
    </div>
  </section>
);

export const FaqSection: React.FC = () => (
  <section className="section section--faq" id="faq" aria-labelledby="faq-title">
    <div className="wrap wrap--faq">
      <SectionHead id="faq" kicker="Questions" title="Questions people ask" />
      <div className="faq-list">
        {FAQ_ITEMS.map((item) => (
          <details key={item.question} className="faq">
            <summary>
              <h3>{item.question}</h3>
            </summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </div>
  </section>
);

export const FinalCta: React.FC<{ title: string; body: string }> = ({ title, body }) => (
  <section className="section section--cta" aria-labelledby="get-it">
    <div className="wrap cta-wrap">
      <h2 id="get-it">{title}</h2>
      <p>{body}</p>
      <a className="btn btn--primary btn--lg" href={storeLink('final-cta')} target="_blank" rel="noopener">
        Add to Chrome, free
      </a>
      <p className="cta-fine">Works in Chrome and in Chromium browsers that install from the Chrome Web Store.</p>
    </div>
  </section>
);
