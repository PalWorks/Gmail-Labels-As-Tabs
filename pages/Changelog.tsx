import React from 'react';
import { DocPage } from '../components/DocPage';
import { REPO_URL, isLive } from '../content/site';

// Mirrors CHANGELOG.md in the extension repository, trimmed to what a user
// would care about. When a release ships, add an entry here too: the store
// listing links to this page. An entry for a version newer than the one the
// store serves is written ahead and stays hidden until LIVE_VERSION reaches it.
type Release = {
  version: string;
  date: string;
  tag: string;
  /** The dotted version this entry is for, to hide it until the store serves it. */
  release: string;
  summary: string;
  points: { title: string; body: string }[];
};

const RELEASES: Release[] = [
  {
    version: 'v1.8.0',
    release: '1.8.0',
    date: '29 September 2026',
    tag: 'Sender icons & Gmail menu',
    summary:
      'Add a label from Gmail\'s own menu, see who mail is from at a glance, and no reload after installing. Carries everything built since 1.6.2.',
    points: [
      {
        title: '"Show as Tabs" in Gmail\'s label menu',
        body:
          'The three dots beside any label in the sidebar now end with "Show as Tabs", or "Remove from Tabs" if it already has one. Sublabels work the same way.',
      },
      {
        title: 'Sender icons, off until you turn them on',
        body:
          'A small chip at the start of each inbox row names the organisation the mail is from, such as mashreq.com, with a coloured letter. Turn on Load website icons as well and the organisation\'s own icon replaces the letter; only the domain is sent, to Google\'s icon service.',
      },
      {
        title: 'No reload after installing or updating',
        body:
          'A Gmail tab that was already open gets the tab bar on its own, without losing an open draft. This is what the new scripting permission is for, and it runs only on mail.google.com.',
      },
      {
        title: 'Only the tab you are looking at is highlighted',
        body:
          'Opening a sublabel no longer lights its parent\'s tab as well, and a tab for "Delete" no longer reacts to "Deleted Items".',
      },
    ],
  },
  {
    version: 'v1.6.2',
    release: '1.6.2',
    date: '22 September 2026',
    tag: 'Onboarding & polish',
    summary:
      'A tour that shows you the extension instead of describing it, a menu behind the toolbar icon, and an end to the black flash while everything loads.',
    points: [
      {
        title: 'A one-minute tour, over your own inbox',
        body:
          'Six steps, each one demonstrating the tab bar in a working miniature inside the panel: labels moving up out of the sidebar, a search being saved as a tab, unread counts filling in, colours, dragging to reorder, and the cleanup script a rule generates. The last step is the theme picker, and your real tab bar changes behind the panel as you choose. It opens on install and you can reopen it any time from the toolbar icon or from Settings.',
      },
      {
        title: 'A menu behind the toolbar icon',
        body:
          'Configure tabs, Show me around, All settings, and Help & support. Clicking the icon used to do nothing at all unless you were already on Gmail; now it offers to open Gmail for you.',
      },
      {
        title: 'No more black flash',
        body:
          'The tab bar used to appear over Gmail as a dark strip for a moment before settling into your theme, and the settings page opened black before turning light. Both were the extension painting a colour before it knew which one you wanted. It now shows nothing rather than a guess, and the settings page opens in the theme you last used.',
      },
      {
        title: '"System" means Gmail\'s theme, not your computer\'s',
        body:
          "Gmail's theme is an account setting, so a dark desktop says nothing about the inbox the tab bar has to blend into. If your desktop is dark and your Gmail is light, the bar, the tour, the toolbar menu and the settings page now all follow Gmail. Your desktop is used only when no Gmail tab has reported a theme yet.",
      },
    ],
  },
  {
    version: 'v1.5.0',
    release: '1.5.0',
    date: '21 September 2026',
    tag: 'Hardening',
    summary:
      'No new features. This release is about correctness and safety, and about the tests that stop each problem coming back.',
    points: [
      {
        title: 'Automation rules could act on the wrong mail',
        body:
          'A label whose name contains a space was put into the Gmail search unquoted, so a rule on "Old Stuff" searched for Old AND Stuff and could match threads that were never in that label. With a trash rule, unattended. The label is now quoted, each run is capped at 200 threads, and every thread is re-checked for the exact label before anything touches it. If you already generated a script, regenerate it: the old copy on your account keeps the old query until you replace it.',
      },
      {
        title: 'Settings could be lost when two windows wrote at once',
        body:
          'Changing tabs in Gmail while the options page was open could silently overwrite one of the two. All changes now go through a single writer and are applied as operations, not as whole-list overwrites, so a reorder made against a stale list no longer drops a tab somebody else just added.',
      },
      {
        title: 'The options page follows changes made elsewhere',
        body:
          'It used to go stale the moment anything changed in a Gmail tab and stay stale. It now updates live, keeps your cursor where it was, and waits if you are mid-drag.',
      },
      {
        title: 'Unread counts no longer read as zero after a dropped request',
        body:
          'A failed check kept showing nothing for half a minute. It now keeps the last known count and retries with a growing delay.',
      },
      {
        title: 'The tab bar picks the right theme on a slow connection',
        body:
          "Gmail's own styling can arrive after the extension has already drawn. The bar now notices and corrects itself.",
      },
      {
        title: 'Safer imports, and two accessibility fixes',
        body:
          'A crafted backup file can no longer inject anything into the options page, and two remaining colours now meet WCAG AA contrast.',
      },
    ],
  },
  {
    version: 'v1.4.0',
    release: '1.4.0',
    date: '21 September 2026',
    tag: 'Feedback',
    summary: 'A way to reach us without leaving the extension.',
    points: [
      {
        title: 'Support & Feedback form, built in',
        body:
          'Pick a category, write a message, add a reply address if you want one, and send. Diagnostics (version, browser build, and how many tabs, rules and accounts you have) are attached only if you leave the tick box on, and never include label names, tab names, addresses or mail.',
      },
    ],
  },
  {
    version: 'v1.3.0',
    release: '1.3.0',
    date: '9 July 2026',
    tag: 'Colours & rules',
    summary: 'Make the bar yours, and automate the boring parts.',
    points: [
      {
        title: 'Custom tab colours',
        body:
          'Eight theme-safe colours, shown as a dot on the bar and a swatch in your lists. Colour is decorative, never the only way to tell tabs apart.',
      },
      {
        title: 'Automation rule templates',
        body:
          'One-click presets: Clean Promotions, Tidy Newsletters, Quiet Social, Archive Receipts, Clear Updates. Applying one creates the tab and the rule together.',
      },
      {
        title: 'System theme now follows Gmail, not your desktop',
        body:
          'Gmail\'s theme is an account setting, so a dark desktop with a light Gmail used to give you a dark bar over a light inbox. It now reads Gmail itself and keeps up when you switch.',
      },
    ],
  },
  {
    version: 'v1.2.1',
    release: '1.2.1',
    date: '7 July 2026',
    tag: 'Fixes',
    summary: 'Accessibility and multi-account polish.',
    points: [
      {
        title: 'Theme and counts across several accounts',
        body:
          'Theme changes now propagate across multiple Gmail accounts open in one window, and unread counts work for search-query tabs.',
      },
    ],
  },
  {
    version: 'v1.1.0 and v1.2.0',
    release: '1.2.0',
    date: '2025 to 2026',
    tag: 'Foundations',
    summary: 'Rebuilt internals, a real test suite and a real build pipeline.',
    points: [
      {
        title: 'Modular rewrite',
        body:
          'The extension was split into focused modules with continuous integration, which is what made everything after it possible.',
      },
    ],
  },
  {
    version: 'v1.0.0',
    release: '1.0.0',
    date: '2025',
    tag: 'Initial release',
    summary: 'The first version, with the core idea intact.',
    points: [
      {
        title: 'Pin labels and searches as tabs',
        body:
          'Per-account tabs, unread counts, drag-and-drop reordering, automation rules with generated Apps Script, onboarding and data export.',
      },
    ],
  },
];

export const Changelog: React.FC = () => (
  <DocPage
    title="Changelog"
    crumb="Changelog"
    lede="What changed in each release that has reached the Chrome Web Store, newest first."
  >
    <ol className="releases">
      {RELEASES.filter((r) => isLive(r.release)).map((release) => (
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
