/**
 * routes.ts
 *
 * Every page the site publishes, with what its head says about it.
 *
 * The prerender step writes one index.html per entry, with this title,
 * description and canonical in the served HTML, and the sitemap lists exactly
 * these. A page missing here is not built; a page built but missing here
 * cannot happen.
 *
 * `updated` is the date the page's content last changed, by hand, for the
 * sitemap's lastmod. A build date would claim every page changed on every
 * deploy, and crawlers learn to ignore a lastmod that always moves.
 */

import { PRODUCT_NAME, SHORT_NAME } from './site';
import { GUIDE_TITLE, GUIDE_UPDATED } from './guide';
import { OPERATORS_UPDATED } from './operators';

export type RouteKind = 'home' | 'guide' | 'operators' | 'about' | 'privacy' | 'terms' | 'changelog' | 'contact';

export interface RouteMeta {
  /** Path inside the site, '' for the homepage, always ending in '/' otherwise. */
  readonly path: string;
  readonly kind: RouteKind;
  readonly title: string;
  readonly description: string;
  /** Short name, for breadcrumbs. */
  readonly crumb: string;
  readonly updated: string;
  readonly changefreq: 'weekly' | 'monthly' | 'yearly';
  readonly priority: number;
}

export const ROUTES: readonly RouteMeta[] = [
  {
    path: '',
    kind: 'home',
    title: `${PRODUCT_NAME}: custom Gmail tabs`,
    description:
      'Turn Gmail labels and saved searches into tabs above your inbox. Live unread counts, tab colours, one bar per account. Free, open source, and it never reads your mail.',
    crumb: 'Home',
    updated: '2026-09-29',
    changefreq: 'weekly',
    priority: 1,
  },
  {
    path: 'gmail-custom-tabs/',
    kind: 'guide',
    title: `${GUIDE_TITLE}: every option compared`,
    description:
      "Gmail's category tabs are fixed and Multiple Inboxes stacks sections on one page. Here is what each option does, and how to put any label or search in a tab bar above the inbox.",
    crumb: 'Custom tabs in Gmail',
    updated: GUIDE_UPDATED,
    changefreq: 'monthly',
    priority: 0.8,
  },
  {
    path: 'gmail-search-operators/',
    kind: 'operators',
    title: 'Gmail search operators: the complete list, with examples',
    description:
      'Every Gmail search operator, with an example of each: from:, subject:, has:attachment, older_than:, larger:, label:, category: and more, plus the searches worth keeping as a tab.',
    crumb: 'Gmail search operators',
    updated: OPERATORS_UPDATED,
    changefreq: 'monthly',
    priority: 0.8,
  },
  {
    path: 'about/',
    kind: 'about',
    title: `About ${SHORT_NAME}: who makes it, and what it promises`,
    description: `Who makes ${PRODUCT_NAME}, what it promises about your mail, and how it is kept working when Gmail changes.`,
    crumb: 'About',
    updated: '2026-09-29',
    changefreq: 'yearly',
    priority: 0.5,
  },
  {
    path: 'changelog/',
    kind: 'changelog',
    title: `Changelog | ${SHORT_NAME}`,
    description: `What changed in each release of ${PRODUCT_NAME} that has reached the Chrome Web Store.`,
    crumb: 'Changelog',
    updated: '2026-09-29',
    changefreq: 'monthly',
    priority: 0.6,
  },
  {
    path: 'privacy/',
    kind: 'privacy',
    title: `Privacy policy | ${SHORT_NAME}`,
    description:
      'What the extension stores, what it never reads, the only three things that can leave your browser, and what the contact form sends.',
    crumb: 'Privacy policy',
    updated: '2026-09-29',
    changefreq: 'monthly',
    priority: 0.5,
  },
  {
    path: 'terms/',
    kind: 'terms',
    title: `Terms of use | ${SHORT_NAME}`,
    description: `The terms for using ${PRODUCT_NAME}: an MIT licensed, free extension with no warranty.`,
    crumb: 'Terms',
    updated: '2026-09-29',
    changefreq: 'yearly',
    priority: 0.3,
  },
  {
    path: 'contact/',
    kind: 'contact',
    title: `Contact and support | ${SHORT_NAME}`,
    description: 'Ask a question, report a problem or suggest a feature, with screenshots attached. A person reads every message.',
    crumb: 'Contact',
    updated: '2026-09-29',
    changefreq: 'yearly',
    priority: 0.5,
  },
];

export function routeFor(path: string): RouteMeta | undefined {
  const clean = path.replace(/^\//, '');
  const withSlash = clean === '' || clean.endsWith('/') ? clean : clean + '/';
  return ROUTES.find((r) => r.path === withSlash);
}
