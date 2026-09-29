/**
 * site.ts
 *
 * Facts about the product and the site, in one place, importing nothing.
 *
 * Everything that is said in more than one surface (the page, the structured
 * data, llms.txt, the sitemap) is read from here, so the surfaces cannot
 * disagree. An answer engine that finds the same claim in the same words on
 * the page, in the markup and in llms.txt treats it as corroborated; one that
 * finds three slightly different claims treats it as three guesses.
 */

/** The name in the Chrome Web Store and in the extension's manifest. */
export const PRODUCT_NAME = 'Gmail Labels and Search Queries as Tabs';

/** The one declared short form, used where the full name does not fit. */
export const SHORT_NAME = 'Gmail Labels as Tabs';

export const ORIGIN = 'https://palworks.github.io';
export const BASE_PATH = '/Gmail-Labels-As-Tabs/';
export const SITE_URL = ORIGIN + BASE_PATH;

export const STORE_URL =
  'https://chromewebstore.google.com/detail/gmail-labels-and-search-q/jemjnjlplglfoiipcjhoacneigdgfmde';
export const STORE_ITEM_ID = 'jemjnjlplglfoiipcjhoacneigdgfmde';
export const REPO_URL = 'https://github.com/PalWorks/Gmail-Labels-Queries-As-Tabs';
export const ORG_NAME = 'PalWorks';
export const ORG_GITHUB = 'https://github.com/PalWorks';
export const ORG_URL = 'https://palworks.ai/';
export const SUPPORT_EMAIL = 'support@palworks.ai';

/**
 * The version the Chrome Web Store is serving today.
 *
 * Not the newest version built: the newest one the store has approved. Every
 * feature and changelog entry carries the version it arrived in, and nothing
 * newer than this is described as available. When a submission is approved,
 * change this one line and redeploy; the features, the changelog, the
 * structured data and llms.txt all follow.
 */
export const LIVE_VERSION = '1.6.2';

/** The version the next submission carries, named where upcoming work is shown. */
export const NEXT_VERSION = '1.8.0';

/** Numeric comparison of dotted versions: 1.10.0 is newer than 1.9.0. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

/** True when a feature or release from `version` is in the store today. */
export function isLive(version: string): boolean {
  return compareVersions(version, LIVE_VERSION) <= 0;
}

/** An absolute URL for a path inside the site: url('privacy/') */
export function url(path = ''): string {
  return SITE_URL + path.replace(/^\//, '');
}

/** The summary used wherever one sentence has to describe the product. */
export const ONE_LINER =
  'A free Chrome extension that puts your Gmail labels and saved searches in a tab bar above the inbox, one click per view, with live unread counts.';
