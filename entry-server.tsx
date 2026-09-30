/**
 * entry-server.tsx
 *
 * Renders a page to HTML at build time, and exposes the content the
 * prerender step needs for the head, the sitemap and llms.txt. Never shipped
 * to a browser.
 */

import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom';
import { App } from './App';

const BASENAME = import.meta.env.BASE_URL.replace(/\/$/, '');

/** `pathname` is inside the site: '/' or '/privacy/'. */
export function render(pathname: string): string {
  return renderToString(
    <React.StrictMode>
      <StaticRouter location={BASENAME + pathname} basename={BASENAME}>
        <App />
      </StaticRouter>
    </React.StrictMode>
  );
}

export { ROUTES } from './content/routes';
export { graphFor, SCREENSHOTS } from './content/schema';
export { VIDEO, VIDEO_EMBED_URL, VIDEO_WATCH_URL, watchAt, clock } from './content/video';
export * as site from './content/site';
export { FAQ_ITEMS } from './content/faq';
export { FEATURES, LIVE_FEATURES, UPCOMING_FEATURES } from './content/features';
export { HOWTO_STEPS, HOWTO_TITLE } from './content/howto';
export { GUIDE_TITLE, GUIDE_SUMMARY, GUIDE_SECTIONS, GUIDE_COMPARISON } from './content/guide';
