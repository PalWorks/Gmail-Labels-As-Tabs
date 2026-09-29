/**
 * schema.ts
 *
 * The structured data for every page, as one linked graph per page.
 *
 * Every node has a stable @id, so the Organization, the WebSite and the
 * SoftwareApplication are the same entities on every page rather than a new
 * copy each time. That is what lets a search engine or an answer engine join
 * "the privacy policy of", "the changelog of" and "the publisher of" into one
 * product.
 *
 * Nothing here is a claim the page does not make, and nothing is a claim the
 * public repository cannot back. In particular there is no aggregateRating
 * and no review: we publish no rating data, and inventing either is both
 * untrue and a structured-data violation.
 *
 * Checked against schema.org on 2026-09-29: privacyPolicy and termsOfService
 * are not properties of SoftwareApplication, and codeRepository belongs to
 * SoftwareSourceCode, which is why the repository is a node of its own.
 * FAQPage and HowTo no longer earn Google rich results for a site like this
 * one; they stay because answer engines read them.
 */

import {
  LIVE_VERSION,
  ONE_LINER,
  ORG_GITHUB,
  ORG_NAME,
  ORG_URL,
  PRODUCT_NAME,
  REPO_URL,
  SHORT_NAME,
  SITE_URL,
  STORE_URL,
  SUPPORT_EMAIL,
  url,
} from './site';
import { LIVE_FEATURES } from './features';
import { FAQ_ITEMS } from './faq';
import { HOWTO_STEPS, HOWTO_TITLE } from './howto';
import { GUIDE_SECTIONS, GUIDE_SUMMARY, GUIDE_TITLE, GUIDE_UPDATED } from './guide';
import { ROUTES, RouteMeta } from './routes';

type Node = Record<string, unknown>;

const ORG_ID = SITE_URL + '#organization';
const SITE_ID = SITE_URL + '#website';
const APP_ID = SITE_URL + '#software';
const SOURCE_ID = SITE_URL + '#source';

/** Real captures of the extension in Gmail, message content blurred. */
export const SCREENSHOTS: readonly { file: string; caption: string; width: number; height: number }[] = [
  { file: 'shots/tabs-in-gmail.jpg', caption: 'Labels and a saved search as tabs above a Gmail inbox, with unread counts', width: 1280, height: 800 },
  { file: 'shots/tour.jpg', caption: 'The one-minute tour the extension opens over Gmail on install', width: 1280, height: 800 },
  { file: 'shots/cleanup-rules.jpg', caption: 'Cleanup rule starter templates, which generate a Google Apps Script', width: 1280, height: 800 },
  { file: 'shots/dark-mode.jpg', caption: 'The settings page in the dark theme', width: 1280, height: 800 },
];

function organization(): Node {
  return {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: ORG_NAME,
    url: ORG_URL,
    logo: { '@type': 'ImageObject', url: url('logo.png'), width: 333, height: 333 },
    email: SUPPORT_EMAIL,
    sameAs: [ORG_URL, ORG_GITHUB],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: SUPPORT_EMAIL,
      url: url('contact/'),
      availableLanguage: ['English'],
    },
  };
}

function website(): Node {
  return {
    '@type': 'WebSite',
    '@id': SITE_ID,
    name: SHORT_NAME,
    alternateName: PRODUCT_NAME,
    url: SITE_URL,
    inLanguage: 'en',
    publisher: { '@id': ORG_ID },
    about: { '@id': APP_ID },
  };
}

function software(): Node {
  return {
    '@type': 'SoftwareApplication',
    '@id': APP_ID,
    name: PRODUCT_NAME,
    alternateName: SHORT_NAME,
    description: ONE_LINER,
    applicationCategory: 'BrowserApplication',
    applicationSubCategory: 'Chrome extension',
    operatingSystem: 'Any operating system that runs Google Chrome',
    softwareRequirements:
      'Google Chrome, or a Chromium browser that installs from the Chrome Web Store, such as Microsoft Edge, Brave or Opera',
    softwareVersion: LIVE_VERSION,
    releaseNotes: url('changelog/'),
    isAccessibleForFree: true,
    license: 'https://opensource.org/licenses/MIT',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', availability: 'https://schema.org/InStock', url: STORE_URL },
    featureList: LIVE_FEATURES.map((f) => f.name),
    screenshot: SCREENSHOTS.map((s) => ({
      '@type': 'ImageObject',
      url: url(s.file),
      caption: s.caption,
      width: s.width,
      height: s.height,
    })),
    image: url('og-image.jpg'),
    url: SITE_URL,
    downloadUrl: STORE_URL,
    installUrl: STORE_URL,
    sameAs: [STORE_URL, REPO_URL],
    softwareHelp: { '@type': 'CreativeWork', url: url('contact/') },
    author: { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
  };
}

/** The public repository, as its own entity, pointing at the product it builds. */
function sourceCode(): Node {
  return {
    '@type': 'SoftwareSourceCode',
    '@id': SOURCE_ID,
    name: `${PRODUCT_NAME} source code`,
    codeRepository: REPO_URL,
    programmingLanguage: 'TypeScript',
    license: 'https://opensource.org/licenses/MIT',
    targetProduct: { '@id': APP_ID },
    author: { '@id': ORG_ID },
  };
}

function breadcrumbs(route: RouteMeta): Node {
  const home = ROUTES[0];
  const items = [{ name: home.crumb, item: SITE_URL }];
  if (route.path !== '') items.push({ name: route.crumb, item: url(route.path) });
  return {
    '@type': 'BreadcrumbList',
    '@id': url(route.path) + '#breadcrumb',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.item })),
  };
}

const PAGE_TYPE: Record<RouteMeta['kind'], string> = {
  home: 'WebPage',
  guide: 'WebPage',
  privacy: 'WebPage',
  terms: 'WebPage',
  changelog: 'WebPage',
  contact: 'ContactPage',
};

function webpage(route: RouteMeta): Node {
  return {
    '@type': PAGE_TYPE[route.kind],
    '@id': url(route.path) + '#webpage',
    url: url(route.path),
    name: route.title,
    description: route.description,
    inLanguage: 'en',
    isPartOf: { '@id': SITE_ID },
    about: { '@id': APP_ID },
    dateModified: route.updated,
    ...(route.kind === 'home' ? {} : { breadcrumb: { '@id': url(route.path) + '#breadcrumb' } }),
    primaryImageOfPage: { '@type': 'ImageObject', url: url('og-image.jpg') },
    ...(route.kind === 'home' ? { mainEntity: { '@id': APP_ID } } : {}),
    ...(route.kind === 'guide' ? { mainEntity: { '@id': url(route.path) + '#article' } } : {}),
  };
}

function faqPage(route: RouteMeta): Node {
  return {
    '@type': 'FAQPage',
    '@id': url(route.path) + '#faq',
    isPartOf: { '@id': url(route.path) + '#webpage' },
    mainEntity: FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

function howTo(route: RouteMeta): Node {
  return {
    '@type': 'HowTo',
    '@id': url(route.path) + '#howto',
    name: HOWTO_TITLE,
    totalTime: 'PT1M',
    estimatedCost: { '@type': 'MonetaryAmount', currency: 'USD', value: '0' },
    tool: { '@type': 'HowToTool', name: PRODUCT_NAME },
    step: HOWTO_STEPS.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.name,
      text: s.text,
      url: url(route.path) + '#how-it-works',
    })),
  };
}

function guideArticle(route: RouteMeta): Node {
  return {
    '@type': 'TechArticle',
    '@id': url(route.path) + '#article',
    headline: GUIDE_TITLE,
    description: GUIDE_SUMMARY,
    abstract: GUIDE_SUMMARY,
    inLanguage: 'en',
    datePublished: '2026-09-29',
    dateModified: GUIDE_UPDATED,
    author: { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
    mainEntityOfPage: { '@id': url(route.path) + '#webpage' },
    about: [{ '@type': 'Thing', name: 'Gmail' }, { '@id': APP_ID }],
    mentions: { '@id': APP_ID },
    articleSection: GUIDE_SECTIONS.map((s) => s.heading),
    image: url('og-image.jpg'),
  };
}

/** The complete graph for one page. */
export function graphFor(route: RouteMeta): Node {
  const nodes: Node[] = [organization(), website(), software(), sourceCode(), webpage(route)];
  // A homepage trail would be one item long, which says nothing.
  if (route.kind !== 'home') nodes.push(breadcrumbs(route));
  if (route.kind === 'home') nodes.push(faqPage(route), howTo(route));
  if (route.kind === 'guide') nodes.push(guideArticle(route));
  return { '@context': 'https://schema.org', '@graph': nodes };
}
