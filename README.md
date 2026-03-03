<p align="center">
  <img src="public/logo.png" alt="Gmail Labels as Tabs" width="96" />
</p>

<h1 align="center">Gmail Labels as Tabs</h1>

<p align="center">
  <strong>Marketing website for the Gmail Labels as Tabs Chrome extension.</strong>
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
└── public/
    ├── logo.png        # Extension logo
    ├── og-image.jpg    # Social share image
    └── banner-*.png    # Product screenshots
```

## Deployment

Pushing to `main` automatically triggers a GitHub Actions workflow that builds and deploys to GitHub Pages.

## License

This project is licensed under the MIT License.
