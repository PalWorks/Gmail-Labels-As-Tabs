import React from 'react';
import { SiteLink as Link } from './SiteLink';

/** The frame for every page that is mostly reading: legal pages, the guide, the changelog. */
export const DocPage: React.FC<{
  title: string;
  lede?: React.ReactNode;
  meta?: React.ReactNode;
  crumb?: string;
  wide?: boolean;
  children: React.ReactNode;
}> = ({ title, lede, meta, crumb, wide, children }) => (
  <article className={`doc${wide ? ' doc--wide' : ''}`}>
    <header className="doc__head">
      {crumb && (
        <nav aria-label="Breadcrumb" className="doc__crumbs">
          <Link to="/">Home</Link>
          <span aria-hidden="true"> / </span>
          <span aria-current="page">{crumb}</span>
        </nav>
      )}
      <h1>{title}</h1>
      {lede && <p className="doc__lede">{lede}</p>}
      {meta && <p className="doc__meta">{meta}</p>}
    </header>
    <div className="doc__body">{children}</div>
  </article>
);
