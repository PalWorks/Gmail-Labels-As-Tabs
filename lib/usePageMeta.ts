/**
 * usePageMeta.ts
 *
 * Keeps the head right after a client-side navigation.
 *
 * The first load needs none of this: the prerender step wrote the title,
 * description, canonical and structured data into that page's own HTML. But
 * once React has the page, following a link swaps the content without a new
 * document, and the head would still describe the page you came from. This
 * updates the parts a person or a share preview reads. The structured data is
 * left as it was served, since only a fresh load is ever crawled.
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { routeFor } from '../content/routes';
import { url } from '../content/site';

function setMeta(selector: string, attr: string, value: string): void {
  const el = document.head.querySelector<HTMLElement>(selector);
  if (el) el.setAttribute(attr, value);
}

export function usePageMeta(): void {
  const { pathname } = useLocation();
  useEffect(() => {
    const route = routeFor(pathname);
    if (!route) return;
    document.title = route.title;
    const canonical = url(route.path);
    setMeta('meta[name="description"]', 'content', route.description);
    setMeta('link[rel="canonical"]', 'href', canonical);
    setMeta('meta[property="og:url"]', 'content', canonical);
    setMeta('meta[property="og:title"]', 'content', route.title);
    setMeta('meta[property="og:description"]', 'content', route.description);
    setMeta('meta[name="twitter:title"]', 'content', route.title);
    setMeta('meta[name="twitter:description"]', 'content', route.description);
  }, [pathname]);
}
