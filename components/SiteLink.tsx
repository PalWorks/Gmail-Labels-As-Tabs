/**
 * SiteLink.tsx
 *
 * A link inside the site whose href is the page's real, canonical address.
 *
 * React Router's own Link writes the homepage as /Gmail-Labels-As-Tabs, with
 * no trailing slash, which GitHub Pages answers with a redirect and which is
 * not the address the canonical tag names. This writes the address as it is
 * published, and still navigates without a reload on an ordinary click.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';

const BASE = import.meta.env.BASE_URL; // '/Gmail-Labels-As-Tabs/'

export function siteHref(to: string): string {
  return BASE + to.replace(/^\//, '');
}

export const SiteLink: React.FC<{ to: string } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>> = ({
  to,
  onClick,
  children,
  ...rest
}) => {
  const navigate = useNavigate();
  return (
    <a
      {...rest}
      href={siteHref(to)}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        navigate(to);
      }}
    >
      {children}
    </a>
  );
};
