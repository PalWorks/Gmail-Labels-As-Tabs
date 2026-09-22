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
| Build Tool | Vite 6 |
| Styling | TailwindCSS (CDN) |
| Routing | react-router-dom (HashRouter) |
| Icons | lucide-react |
| Deployment | GitHub Pages via GitHub Actions |

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server (port 3000)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
├── index.html          # Entry point (analytics, meta tags)
├── index.tsx           # React DOM root
├── App.tsx             # Router + Layout
├── constants.ts        # Static content (features, testimonials)
├── vite.config.ts      # Vite config
├── components/
│   ├── Navbar.tsx      # Fixed navigation bar
│   ├── Footer.tsx      # Site footer
│   └── Button.tsx      # Reusable button component
├── pages/
│   ├── Home.tsx        # Landing page
│   ├── Privacy.tsx     # Privacy Policy
│   ├── Terms.tsx       # Terms and Conditions
│   └── Changelog.tsx   # Version history
├── components/Tour.tsx # Mounts the extension's own tour on this page
├── vendor/onboarding/  # GENERATED. The tour itself, copied from the extension
├── scripts/
│   └── sync-wizard.mjs # The only thing that writes vendor/onboarding
├── styles/tour.css     # The frame around the tour, not the tour
└── public/
    ├── logo.png        # Extension logo
    ├── og-image.jpg    # Social share image
    ├── llms.txt        # Plain-text product summary for answer engines
    ├── robots.txt      # See the caveat inside it about project Pages sites
    └── banner-*.png    # Product screenshots
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
<https://palworks.github.io/Gmail-Labels-As-Tabs/#/privacy> shows it.

## License

This project is licensed under the MIT License.
