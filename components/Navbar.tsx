import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { SiteLink as Link } from './SiteLink';
import { Menu, X } from 'lucide-react';
import { SHORT_NAME } from '../content/site';
import { storeLink } from '../lib/links';

/** Sections of the homepage, and the one page that answers the category question. */
const LINKS: readonly { name: string; to: string }[] = [
  { name: 'Tour', to: '/#tour' },
  { name: 'Features', to: '/#features' },
  { name: 'How it works', to: '/#how-it-works' },
  { name: 'Compare', to: '/gmail-custom-tabs/' },
  { name: 'FAQ', to: '/#faq' },
];

export const Navbar: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [location.pathname, location.hash]);

  return (
    <header className={`site-nav${scrolled ? ' is-scrolled' : ''}`}>
      <div className="site-nav__inner">
        <Link to="/" className="site-nav__brand" aria-label={`${SHORT_NAME}, home`}>
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="" width={32} height={32} />
          <span>{SHORT_NAME}</span>
        </Link>
        <nav aria-label="Main" className="site-nav__links">
          {LINKS.map((l) => (
            <Link key={l.name} to={l.to}>
              {l.name}
            </Link>
          ))}
        </nav>
        <a className="btn btn--primary btn--sm site-nav__cta" href={storeLink('nav')} target="_blank" rel="noopener">
          Add to Chrome, free
        </a>
        <button
          type="button"
          className="site-nav__toggle"
          aria-expanded={open}
          aria-controls="site-nav-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </div>
      <div id="site-nav-menu" className="site-nav__menu" hidden={!open}>
        {LINKS.map((l) => (
          <Link key={l.name} to={l.to}>
            {l.name}
          </Link>
        ))}
        <a className="btn btn--primary" href={storeLink('nav-mobile')} target="_blank" rel="noopener">
          Add to Chrome, free
        </a>
      </div>
    </header>
  );
};
