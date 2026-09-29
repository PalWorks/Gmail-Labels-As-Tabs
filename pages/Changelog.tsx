import React from 'react';
import { DocPage } from '../components/DocPage';
import { REPO_URL } from '../content/site';
import { RELEASES } from '../content/releases';

export const Changelog: React.FC = () => (
  <DocPage
    title="Changelog"
    crumb="Changelog"
    lede="What changed in each release that has reached the Chrome Web Store, newest first."
  >
    <ol className="releases">
      {RELEASES.map((release) => (
        <li key={release.version} className="release">
          <h2 id={release.version}>
            {release.version} <span className="release__tag">{release.tag}</span>
          </h2>
          <p className="release__date">{release.date}</p>
          <p>{release.summary}</p>
          <ul>
            {release.points.map((point) => (
              <li key={point.title}>
                <strong>{point.title}.</strong> {point.body}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
    <p className="doc__aside">
      The full technical changelog, with every fix and the reasoning behind each decision, is in the{' '}
      <a href={`${REPO_URL}/blob/main/CHANGELOG.md`} target="_blank" rel="noopener">
        repository
      </a>
      .
    </p>
  </DocPage>
);
