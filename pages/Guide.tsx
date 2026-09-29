import React from 'react';
import { DocPage } from '../components/DocPage';
import { SiteLink as Link } from '../components/SiteLink';
import { CompareTable } from '../components/sections/Sections';
import { GUIDE_SECTIONS, GUIDE_SUMMARY, GUIDE_TITLE, GUIDE_UPDATED } from '../content/guide';
import { storeLink } from '../lib/links';
import { readableDate } from '../lib/dates';

export const Guide: React.FC = () => (
  <DocPage
    title={GUIDE_TITLE}
    crumb="Custom tabs in Gmail"
    lede={GUIDE_SUMMARY}
    meta={
      <>
        Updated <time dateTime={GUIDE_UPDATED}>{readableDate(GUIDE_UPDATED)}</time> by PalWorks, who make the extension
        compared here.
      </>
    }
    wide
  >
    <nav aria-label="On this page" className="doc__toc">
      <h2>On this page</h2>
      <ul>
        <li>
          <a href="#at-a-glance">At a glance</a>
        </li>
        {GUIDE_SECTIONS.map((s) => (
          <li key={s.id}>
            <a href={`#${s.id}`}>{s.heading}</a>
          </li>
        ))}
      </ul>
    </nav>

    <h2 id="at-a-glance">At a glance</h2>
    <CompareTable caption="Ways to keep a Gmail view one click away" />

    {GUIDE_SECTIONS.map((s) => (
      <section key={s.id} aria-labelledby={s.id}>
        <h2 id={s.id}>{s.heading}</h2>
        {s.paragraphs.map((p) => (
          <p key={p.slice(0, 40)}>{p}</p>
        ))}
      </section>
    ))}

    <p>
      Not sure what to put in a tab? <Link to="/gmail-search-operators/">Every Gmail search operator, with examples</Link>{' '}
      lists the searches people keep.
    </p>

    <p className="doc__cta">
      <a className="btn btn--primary btn--lg" href={storeLink('guide')} target="_blank" rel="noopener">
        Add Gmail Labels as Tabs to Chrome, free
      </a>
    </p>
  </DocPage>
);
