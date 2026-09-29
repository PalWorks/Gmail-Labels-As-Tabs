<p align="center">
  <img src="public/logo.png" alt="Gmail Labels as Tabs" width="96" />
</p>

<h1 align="center">Gmail Labels and Search Queries as Tabs</h1>

<p align="center">
  <strong>Marketing website for the Gmail Labels and Search Queries as Tabs Chrome extension.</strong>
</p>

<p align="center">
  <a href="https://palworks.github.io/Gmail-Labels-As-Tabs/">Live Site</a> · 
  <a href="https://github.com/PalWorks/Gmail-Labels-Queries-As-Tabs">Extension Source Code</a> · 
  <a href="https://chromewebstore.google.com/detail/gmail-labels-and-search-q/jemjnjlplglfoiipcjhoacneigdgfmde">Chrome Web Store</a>
</p>

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Build Tool | Vite 6, with a prerender step (`scripts/prerender.mjs`) |
| Styling | Plain CSS with design tokens (`styles/site.css`), no framework |
| Routing | react-router-dom, real paths (`/privacy/`, not `#/privacy`) |
| Icons | lucide-react |
| Deployment | GitHub Pages via GitHub Actions, manual dispatch |

## Getting Started

```bash
npm install
npm run dev        # dev server on port 3000, client-rendered
npm run build      # client bundle, server bundle, then prerender every page into dist/
npm run preview    # serve dist/
npm run typecheck
```

## Every page is real HTML

Answer engines (ChatGPT, Claude, Perplexity, Copilot) mostly read the HTML they are
served and do not run JavaScript. So `npm run build` renders each route in
[content/routes.ts](content/routes.ts) to its own `dist/<path>/index.html`, with its own
title, description, canonical, Open Graph tags and JSON-LD graph, and React then hydrates
it. The same step writes:

| File | What it is | Source |
|---|---|---|
| `sitemap.xml` | Every route, `lastmod` from the date its content last changed | `content/routes.ts` |
| `llms.txt` | Curated summary for answer engines, per llmstxt.org | `content/*.ts` |
| `llms-full.txt` | Every page's text as markdown, extracted from the rendered pages | the rendered HTML |
| `404.html` | Served by GitHub Pages for unknown addresses, `noindex` | `pages/NotFound.tsx` |
| `robots.txt` | Static, in `public/`; see the caveat inside it | `public/robots.txt` |

The build fails if a page has other than one `h1`, if any JSON-LD does not parse, or if an
old `#/` link survives. Old `#/privacy`-style links, including the one in the Chrome Web
Store listing, are redirected to the real address by a script at the top of the page head.

## One source for every claim

The words on the page, the structured data and `llms.txt` are generated from the same
modules, so they cannot disagree:

| Module | Holds |
|---|---|
| [content/site.ts](content/site.ts) | Names, URLs, and `LIVE_VERSION`, the version the store serves |
| [content/features.ts](content/features.ts) | Features, each with the version it arrived in |
| [content/faq.ts](content/faq.ts) | The FAQ, worded as in the store listing |
| [content/howto.ts](content/howto.ts) | The three steps, for the page and its HowTo markup |
| [content/guide.ts](content/guide.ts) | The "custom tabs in Gmail" guide and its comparison table |
| [content/schema.ts](content/schema.ts) | The JSON-LD graph per page, linked by `@id` |

**When a release is approved in the Chrome Web Store, change `LIVE_VERSION` and redeploy.**
Features, FAQ answers and changelog entries from newer versions are written ahead and stay
hidden, or listed as coming, until then; the structured data's `featureList` and
`softwareVersion` follow the same constant.

## Two designs, until one is chosen

`VITE_VARIANT=a` (default, "Tab strip") or `VITE_VARIANT=b` ("Operator") picks the
homepage design at build time: `npm run build:a`, `npm run build:b`. Both share every word
and every section; they differ in the hero and the styling scoped under
`html[data-variant]` in `styles/site.css`. Once one is chosen, delete the other hero, its
CSS block, the fonts entry in `vite.config.ts` and the switch in `pages/Home.tsx`.

## Project structure

```
├── index.html            # Template: analytics, the #/ redirect, head markers
├── entry-client.tsx      # Hydrates the prerendered page
├── entry-server.tsx      # Renders a page at build time; never shipped
├── App.tsx               # Routes, scroll handling, head updates on navigation
├── content/              # Every claim, as data (see above)
├── components/           # Navbar, Footer, DocPage, TabPill, SiteLink, Tour
│   └── sections/         # Homepage sections; HeroA and HeroB are the two designs
├── pages/                # Home, Guide, Privacy, Terms, Changelog, Contact, NotFound
├── lib/                  # usePageMeta, store link helper
├── styles/site.css       # All styling; styles/tour.css frames the tour
├── scripts/
│   ├── prerender.mjs     # Pages, sitemap, llms.txt, llms-full.txt, 404, checks
│   └── sync-wizard.mjs   # The only thing that writes vendor/onboarding
├── vendor/onboarding/    # GENERATED. The tour itself, copied from the extension
└── public/               # robots.txt, logo, og-image (1200x630), shots/, verification file
```

## The product tour on the homepage

The tour under **Take the tour** is not a re-creation of the extension's
onboarding. It is that onboarding, the same code, copied out of the extension
repository by a script:

```bash
node scripts/sync-wizard.mjs [../Gmail-Labels-As-Tabs]   # copy
node scripts/sync-wizard.mjs --check                     # fail if stale
```

Everything under `vendor/onboarding/` is generated and must not be edited here;
the next sync discards whatever was changed. Anything the web needs and Gmail
does not lives in [components/Tour.tsx](components/Tour.tsx), which runs after
the tour is built and so survives a re-sync. Three things differ there:

- The tour marks its root as a modal dialog, correct over Gmail and wrong in
  the middle of a page. The role is corrected on mount.
- **System** means the operating system here. In the extension it means Gmail's
  own theme, because someone on a dark desktop can be reading a light Gmail and
  the tab bar has to blend into the inbox. There is no Gmail on this page to
  ask.
- A theme chosen here is a preview. It retints the panel and is remembered in
  this browser. It does not reach the extension, and the note under the tour
  says so.

The tour is worth the vendoring rather than a video or a carousel because a
visitor who plays it and then installs sees exactly what they were shown. A
marketing page that demonstrates a slightly different product is worse than one
that demonstrates nothing.

## Deployment

Deployment is **manual**, so that Actions minutes are spent deliberately. Pushing to `main`
changes nothing a visitor sees; the live site moves only when the workflow is run:

```bash
gh workflow run deploy.yml --ref main -f ref_note="what this deploy is for"
```

Or from the Actions tab: **Deploy to GitHub Pages** -> **Run workflow**.

Check `node scripts/sync-wizard.mjs --check` before a deploy if the extension's
onboarding has changed since the last one. Nothing in CI does this: the two
repositories are separate checkouts and a build here cannot see one there.

This matters most for the legal pages. [pages/Privacy.tsx](pages/Privacy.tsx) is the privacy
policy the Chrome Web Store listing links to, so a change to it is not live, and must not be
described as live, until this workflow has run and
<https://palworks.github.io/Gmail-Labels-As-Tabs/privacy/> shows it.

## License

This project is licensed under the MIT License.
