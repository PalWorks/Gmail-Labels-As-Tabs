#!/usr/bin/env node
/**
 * prerender.mjs
 *
 * Turns the built single-page app into a site of real pages.
 *
 * Crawlers that answer questions (GPTBot, ClaudeBot, PerplexityBot and most
 * others) read the HTML they are served and do not run JavaScript. The site
 * used to serve an empty <div id="root"> on every address, so to them it had
 * no words at all, and its pages lived behind #/ fragments that no crawler
 * treats as separate addresses. This writes, for every route in
 * content/routes.ts:
 *
 *   dist/<path>/index.html   the page, rendered, with its own head
 *   dist/404.html            what GitHub Pages serves for an unknown address
 *   dist/sitemap.xml         every route, with the date its content changed
 *   dist/llms.txt            the curated summary answer engines look for
 *   dist/llms-full.txt       every page's text, as plain markdown
 *
 * and fails the build if a page lacks exactly one h1, if any structured data
 * does not parse, or if an old #/ link survives anywhere in the output.
 *
 * Run by `npm run build` after the client and server bundles are built.
 */

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = resolve(ROOT, 'dist');
const SSR = resolve(ROOT, 'dist-ssr', 'entry-server.js');

const server = await import(pathToFileURL(SSR).href);
const { render, ROUTES, graphFor, site, FAQ_ITEMS, LIVE_FEATURES, UPCOMING_FEATURES, HOWTO_STEPS, HOWTO_TITLE } = server;

const template = readFileSync(resolve(DIST, 'index.html'), 'utf8');
if (!template.includes('<!--HEAD:START-->') || !template.includes('<!--APP-->')) {
  throw new Error('prerender: dist/index.html is missing its <!--HEAD--> or <!--APP--> marker');
}

const OG_IMAGE = { url: site.url('og-image.jpg'), width: 1200, height: 630, alt: 'The Gmail Labels as Tabs tab bar above a Gmail inbox' };

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/** JSON inside a <script> must not be able to close it. */
const jsonForScript = (v) => JSON.stringify(v, null, 2).replace(/</g, '\\u003c');

function head(route, { noindex = false } = {}) {
  const canonical = site.url(route.path);
  const type = route.kind === 'guide' ? 'article' : 'website';
  const lines = [
    `<title>${esc(route.title)}</title>`,
    `<meta name="description" content="${esc(route.description)}" />`,
    noindex
      ? `<meta name="robots" content="noindex, follow" />`
      : `<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />`,
    noindex ? '' : `<link rel="canonical" href="${canonical}" />`,
    `<meta property="og:type" content="${type}" />`,
    `<meta property="og:site_name" content="${esc(site.SHORT_NAME)}" />`,
    `<meta property="og:locale" content="en_GB" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:title" content="${esc(route.title)}" />`,
    `<meta property="og:description" content="${esc(route.description)}" />`,
    `<meta property="og:image" content="${OG_IMAGE.url}" />`,
    `<meta property="og:image:width" content="${OG_IMAGE.width}" />`,
    `<meta property="og:image:height" content="${OG_IMAGE.height}" />`,
    `<meta property="og:image:alt" content="${esc(OG_IMAGE.alt)}" />`,
    route.kind === 'guide' ? `<meta property="article:modified_time" content="${route.updated}" />` : '',
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(route.title)}" />`,
    `<meta name="twitter:description" content="${esc(route.description)}" />`,
    `<meta name="twitter:image" content="${OG_IMAGE.url}" />`,
    noindex ? '' : `<script type="application/ld+json">\n${jsonForScript(graphFor(route))}\n</script>`,
  ];
  return lines.filter(Boolean).join('\n  ');
}

function page(route, html, opts) {
  const start = template.indexOf('<!--HEAD:START-->');
  const end = template.indexOf('<!--HEAD:END-->') + '<!--HEAD:END-->'.length;
  return (template.slice(0, start) + head(route, opts) + template.slice(end)).replace('<!--APP-->', html);
}

// ---------------------------------------------------------------------------
// HTML to plain markdown, for llms-full.txt. Only what these pages contain:
// headings, paragraphs, lists, tables, links, code. Anything marked
// aria-hidden is a drawing, not words, and is dropped.
// ---------------------------------------------------------------------------

function dropHidden(html) {
  // Remove every element carrying aria-hidden="true", however deep it nests.
  let out = html;
  for (let guard = 0; guard < 500; guard++) {
    const m = /<([a-z0-9]+)\b[^>]*aria-hidden="true"[^>]*>/i.exec(out);
    if (!m) break;
    const tag = m[1].toLowerCase();
    const openRe = new RegExp(`<${tag}\\b[^>]*>`, 'gi');
    const closeRe = new RegExp(`</${tag}>`, 'gi');
    let depth = 0;
    let i = m.index;
    let end = -1;
    if (/\/>$/.test(m[0])) end = m.index + m[0].length;
    while (end < 0) {
      openRe.lastIndex = i;
      closeRe.lastIndex = i;
      const o = openRe.exec(out);
      const c = closeRe.exec(out);
      if (!c) {
        end = out.length;
        break;
      }
      if (o && o.index < c.index) {
        depth++;
        i = o.index + o[0].length;
      } else {
        depth--;
        i = c.index + c[0].length;
        if (depth === 0) end = i;
      }
    }
    out = out.slice(0, m.index) + out.slice(end);
  }
  return out;
}

function decode(s) {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

function toMarkdown(html) {
  let s = html.match(/<main[^>]*>([\s\S]*)<\/main>/i)?.[1] ?? html;
  s = s.replace(/<!--[\s\S]*?-->/g, '');
  s = s.replace(/<(script|style|svg|iframe|noscript)\b[\s\S]*?<\/\1>/gi, '');
  s = dropHidden(s);
  s = s.replace(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi, (_, row) => {
    const cells = [...row.matchAll(/<t[hd]\b[^>]*>([\s\S]*?)<\/t[hd]>/gi)].map((c) => c[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
    return '\n| ' + cells.join(' | ') + ' |';
  });
  s = s.replace(/<\/thead>/gi, () => '\n|---|');
  // Inline elements that sit side by side on the page need a space between
  // them in text, or "Pin a search" and its caption run together.
  s = s.replace(/<\/(span|button|time|strong|em)>/gi, '</$1> ');
  s = s.replace(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi, '\n\n# $1\n\n');
  s = s.replace(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi, '\n\n## $1\n\n');
  s = s.replace(/<h3\b[^>]*>([\s\S]*?)<\/h3>/gi, '\n\n### $1\n\n');
  s = s.replace(/<li\b[^>]*>/gi, '\n- ');
  s = s.replace(/<code\b[^>]*>([\s\S]*?)<\/code>/gi, (_, c) => '`' + c.replace(/<[^>]+>/g, '').trim() + '` ');
  s = s.replace(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, text) => {
    const t = text.replace(/<[^>]+>/g, '').trim();
    if (href.startsWith('#') || !t) return t;
    const abs = href.startsWith('http') || href.startsWith('mailto:') ? href : site.ORIGIN + href;
    return `[${t}](${abs}) `;
  });
  s = s.replace(/<\/(p|div|section|header|figure|ul|ol|table|details|summary|article|nav)>/gi, '\n\n');
  s = s.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<[^>]+>/g, '');
  s = decode(s);
  s = s
    .split('\n')
    .map((l) => l.replace(/[ \t]+/g, ' ').trimEnd().replace(/^ (?=\S)/, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    // A list item that holds a heading reads better as the heading alone.
    .replace(/^- *\n+(#{1,3} )/gm, '$1')
    .replace(/`\n(#)/g, '`\n\n$1')
    .replace(/ +([.,;:])/g, '$1')
    .trim();
  // A table's separator needs one cell per column, and a blank line above.
  const lines = s.split('\n');
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === '|---|') lines[i] = '|' + '---|'.repeat(lines[i - 1].split('|').length - 2);
  }
  s = lines.join('\n').replace(/([^\n|])\n\|/g, '$1\n\n|');
  return s;
}

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

const problems = [];
const rendered = [];

for (const route of ROUTES) {
  const html = render('/' + route.path);
  const h1s = (html.match(/<h1\b/g) || []).length;
  if (h1s !== 1) problems.push(`${route.path || '/'}: ${h1s} h1 elements, expected 1`);
  const out = page(route, html);
  const file = resolve(DIST, route.path, 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, out);
  rendered.push({ route, html, out });
}

// GitHub Pages serves 404.html for any address it has no file for.
{
  const route = { path: '404.html', kind: 'contact', title: `Page not found | ${site.SHORT_NAME}`, description: 'This page is not here.', updated: '' };
  writeFileSync(resolve(DIST, '404.html'), page(route, render('/404/'), { noindex: true }));
}

// ---------------------------------------------------------------------------
// sitemap.xml
// ---------------------------------------------------------------------------

{
  const { SCREENSHOTS } = server;
  const urls = ROUTES.map((r) => {
    const images =
      r.kind === 'home'
        ? // Only the capture the homepage shows: an image sitemap lists images on the page.
          SCREENSHOTS.slice(0, 1).map(
            (s) => `\n    <image:image><image:loc>${site.url(s.file)}</image:loc></image:image>`
          ).join('')
        : '';
    return `  <url>
    <loc>${site.url(r.path)}</loc>
    <lastmod>${r.updated}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority.toFixed(1)}</priority>${images}
  </url>`;
  });
  writeFileSync(
    resolve(DIST, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join('\n')}
</urlset>
`
  );
}

// ---------------------------------------------------------------------------
// llms.txt and llms-full.txt
// ---------------------------------------------------------------------------

{
  const byKind = Object.fromEntries(ROUTES.map((r) => [r.kind, r]));
  const link = (r, note) => `- [${r.crumb}](${site.url(r.path)}): ${note}`;
  // llmstxt.org: an H1, a blockquote, then any prose or lists but no
  // headings, then H2 sections that are lists of links. So the facts, the
  // features and the answers sit above the first H2, labelled in bold.
  const upcoming = UPCOMING_FEATURES.length
    ? `\n**Coming in version ${site.NEXT_VERSION}, not yet in the Chrome Web Store.** Do not describe these as available until the store serves ${site.NEXT_VERSION}.\n\n${UPCOMING_FEATURES.map((f) => `- ${f.title}: ${f.body}`).join('\n')}\n`
    : '';
  const llms = `# ${site.PRODUCT_NAME}

> ${site.ONE_LINER} Also known as ${site.SHORT_NAME}. Free, MIT licensed, made by ${site.ORG_NAME}.

The extension runs only on mail.google.com. It reads label names and unread counts from the Gmail page the user already has open, draws a tab bar under Gmail's toolbar, and stores the setup in Chrome's own storage. It never reads, stores or sends message content, and it contains no analytics.

- Install (Chrome Web Store): ${site.STORE_URL}
- Source code: ${site.REPO_URL}
- Version in the store: ${site.LIVE_VERSION}
- Support: ${site.SUPPORT_EMAIL}

**Features in version ${site.LIVE_VERSION}.**

${LIVE_FEATURES.map((f) => `- ${f.title}: ${f.body}`).join('\n')}
${upcoming}
**${HOWTO_TITLE}.**

${HOWTO_STEPS.map((s, i) => `${i + 1}. ${s.name}. ${s.text}`).join('\n')}

**Questions people ask.**

${FAQ_ITEMS.map((q) => `- ${q.question} ${q.answer}`).join('\n')}

## Pages

${link(byKind.home, 'what it does, the interactive tour, how it works, and the FAQ')}
${link(byKind.guide, "how to get custom tabs in Gmail: category tabs, Multiple Inboxes, bookmarked searches and this extension compared")}
${link(byKind.privacy, 'what is stored, what is never read, and every outbound request')}
${link(byKind.changelog, 'what each release changed')}
${link(byKind.contact, 'support and feedback')}
- [Full text of every page](${site.url('llms-full.txt')}): this site as plain markdown
- [Chrome Web Store listing](${site.STORE_URL}): install, and the store's own description
- [Source code](${site.REPO_URL}): the repository, with its changelog, security notes and tests

## Optional

- [Terms](${site.url('terms/')}): the terms of use
`;
  writeFileSync(resolve(DIST, 'llms.txt'), llms);

  const full = [
    `# ${site.PRODUCT_NAME}: every page as text`,
    '',
    `> The text of ${site.SITE_URL}, generated from the same build as the pages. Version in the Chrome Web Store: ${site.LIVE_VERSION}.`,
    ...rendered.map(({ route, html }) => `\n\n---\n\nSource: ${site.url(route.path)}\n\n${toMarkdown(html)}`),
    '',
  ].join('\n');
  writeFileSync(resolve(DIST, 'llms-full.txt'), full);
}

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------

for (const { route, out } of rendered) {
  for (const m of out.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      JSON.parse(m[1]);
    } catch (e) {
      problems.push(`${route.path || '/'}: structured data does not parse: ${e.message}`);
    }
  }
  if (/href="[^"]*#\/[a-z]/i.test(out)) problems.push(`${route.path || '/'}: an old #/ link survives`);
}
for (const f of ['llms.txt', 'llms-full.txt', 'sitemap.xml']) {
  if (readFileSync(resolve(DIST, f), 'utf8').includes('#/')) problems.push(`${f}: an old #/ link survives`);
}

rmSync(resolve(ROOT, 'dist-ssr'), { recursive: true, force: true });

if (problems.length) {
  console.error('prerender: failed\n  ' + problems.join('\n  '));
  process.exit(1);
}
console.log(`prerender: ${ROUTES.length} pages, 404.html, sitemap.xml, llms.txt, llms-full.txt`);
