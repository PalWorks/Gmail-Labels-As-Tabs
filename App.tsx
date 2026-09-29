import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Guide } from './pages/Guide';
import { Privacy } from './pages/Privacy';
import { Terms } from './pages/Terms';
import { Changelog } from './pages/Changelog';
import { Contact } from './pages/Contact';
import { NotFound } from './pages/NotFound';
import { usePageMeta } from './lib/usePageMeta';

/**
 * On a new page, start at the top; on a link to a section, go to it. A hash
 * on first load is the browser's job and already done, so this only acts on
 * navigations React performed.
 */
const ScrollManager: React.FC = () => {
  const { pathname, hash } = useLocation();
  const first = React.useRef(true);
  useEffect(() => {
    // React Router writes the homepage as /Gmail-Labels-As-Tabs, without the
    // slash its canonical address has. Put it back, so a copied address is
    // the published one.
    if (pathname === '/' && !window.location.pathname.endsWith('/')) {
      window.history.replaceState(window.history.state, '', window.location.pathname + '/' + window.location.search + window.location.hash);
    }
    if (first.current) {
      first.current = false;
      return;
    }
    // After the frame, so every effect of the new page (the tour mounting,
    // above all) has already given the page its height.
    const frame = requestAnimationFrame(() => {
      const target = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      else window.scrollTo(0, 0);
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname, hash]);
  return null;
};

const Meta: React.FC = () => {
  usePageMeta();
  return null;
};

/** The whole site, without a router: the client and the prerender each supply their own. */
export const App: React.FC = () => (
  <>
    <ScrollManager />
    <Meta />
    <a className="skip-link" href="#main">
      Skip to content
    </a>
    <Navbar />
    <main id="main" tabIndex={-1}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/gmail-custom-tabs/" element={<Guide />} />
        <Route path="/privacy/" element={<Privacy />} />
        <Route path="/terms/" element={<Terms />} />
        <Route path="/changelog/" element={<Changelog />} />
        <Route path="/contact/" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </main>
    <Footer />
  </>
);

export default App;
