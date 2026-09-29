import React from 'react';
import { DocPage } from '../components/DocPage';
import {
  OPERATOR_FAQ,
  OPERATOR_GROUPS,
  OPERATORS_SOURCE,
  OPERATORS_SUMMARY,
  OPERATORS_TITLE,
  OPERATORS_UPDATED,
  WORTH_A_TAB,
} from '../content/operators';
import { storeLink } from '../lib/links';
import { readableDate } from '../lib/dates';

export const Operators: React.FC = () => (
  <DocPage
    title={OPERATORS_TITLE}
    crumb="Gmail search operators"
    lede={OPERATORS_SUMMARY}
    meta={
      <>
        Updated <time dateTime={OPERATORS_UPDATED}>{readableDate(OPERATORS_UPDATED)}</time> by PalWorks. Checked
        against{' '}
        <a href={OPERATORS_SOURCE} target="_blank" rel="noopener">
          Google's own list of Gmail search operators
        </a>
        .
      </>
    }
    wide
  >
    <nav aria-label="On this page" className="doc__toc">
      <h2>On this page</h2>
      <ul>
        {OPERATOR_GROUPS.map((g) => (
          <li key={g.id}>
            <a href={`#${g.id}`}>{g.heading}</a>
          </li>
        ))}
        <li>
          <a href="#worth-a-tab">Searches worth keeping as a tab</a>
        </li>
        <li>
          <a href="#questions">Questions</a>
        </li>
      </ul>
    </nav>

    {OPERATOR_GROUPS.map((g) => (
      <section key={g.id} aria-labelledby={g.id}>
        <h2 id={g.id}>{g.heading}</h2>
        <p>{g.intro}</p>
        <div className="compare-scroll">
          <table className="compare ops">
            <thead>
              <tr>
                <th scope="col">Operator</th>
                <th scope="col">Finds</th>
                <th scope="col">Example</th>
              </tr>
            </thead>
            <tbody>
              {g.operators.map((o) => (
                <tr key={o.op}>
                  <th scope="row">
                    <code>{o.op}</code>
                  </th>
                  <td>{o.finds}</td>
                  <td>
                    <code>{o.example}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    ))}

    <section aria-labelledby="worth-a-tab">
      <h2 id="worth-a-tab">Searches worth keeping as a tab</h2>
      <p>
        A search you type more than twice a week is a view you use. Gmail cannot save a search, but the free Gmail
        Labels and Search Queries as Tabs extension keeps any of these one click away above your inbox, with its unread
        count: run the search, then press + on the tab bar.
      </p>
      <ul className="worth">
        {WORTH_A_TAB.map((s) => (
          <li key={s.query}>
            <strong>{s.title}</strong>
            <code className="operator">{s.query}</code>
            <span>{s.why}</span>
          </li>
        ))}
      </ul>
    </section>

    <section aria-labelledby="questions">
      <h2 id="questions">Questions</h2>
      {OPERATOR_FAQ.map((q) => (
        <div key={q.question} className="qa">
          <h3>{q.question}</h3>
          <p>{q.answer}</p>
        </div>
      ))}
    </section>

    <p className="doc__cta">
      <a className="btn btn--primary btn--lg" href={storeLink('operators')} target="_blank" rel="noopener">
        Keep your searches as tabs: add it to Chrome, free
      </a>
    </p>
  </DocPage>
);
