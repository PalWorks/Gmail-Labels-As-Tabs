/**
 * TabPill.tsx
 *
 * One tab as the extension draws it in Gmail: an optional colour dot, the
 * name, the unread count and the chevron that opens its menu. The colours are
 * the extension's own palette (src/ui/toolbar.css), so a tab on this page
 * looks like the tab you get.
 */

import React from 'react';

export type TabColour = 'red' | 'orange' | 'yellow' | 'green' | 'teal' | 'blue' | 'purple' | 'pink';

export interface TabPillProps {
  label: string;
  count?: number;
  colour?: TabColour;
  active?: boolean;
  /** A search rather than a label: the name is set in the monospace face. */
  query?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const TabPill: React.FC<TabPillProps> = ({ label, count, colour, active, query, className, style }) => (
  <span
    className={[
      'tab-pill',
      colour ? `tab-pill--${colour}` : '',
      active ? 'is-active' : '',
      query ? 'is-query' : '',
      className ?? '',
    ]
      .filter(Boolean)
      .join(' ')}
    style={style}
  >
    {colour && <span className="tab-pill__dot" aria-hidden="true" />}
    <span className="tab-pill__name">{label}</span>
    {count !== undefined && <span className="tab-pill__count">{count}</span>}
    <svg className="tab-pill__chev" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 10l5 5 5-5z" />
    </svg>
  </span>
);

/** The + and settings buttons that end the bar. Decorative here. */
export const BarControls: React.FC = () => (
  <>
    <span className="bar-plus" aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4z" />
      </svg>
    </span>
    <span className="bar-gear" aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <path d="M19.14 12.94a7.6 7.6 0 000-1.88l2.03-1.58a.5.5 0 00.12-.64l-1.92-3.32a.5.5 0 00-.6-.22l-2.39.96a7.03 7.03 0 00-1.63-.94l-.36-2.54a.5.5 0 00-.5-.42h-3.84a.5.5 0 00-.5.42l-.36 2.54c-.59.24-1.13.56-1.63.94l-2.39-.96a.5.5 0 00-.6.22L2.66 8.84a.5.5 0 00.12.64l2.03 1.58a7.6 7.6 0 000 1.88l-2.03 1.58a.5.5 0 00-.12.64l1.92 3.32c.13.22.39.31.6.22l2.39-.96c.5.38 1.04.7 1.63.94l.36 2.54c.05.24.26.42.5.42h3.84c.24 0 .45-.18.5-.42l.36-2.54c.59-.24 1.13-.56 1.63-.94l2.39.96c.22.09.47 0 .6-.22l1.92-3.32a.5.5 0 00-.12-.64l-2.03-1.58zM12 15.6a3.6 3.6 0 110-7.2 3.6 3.6 0 010 7.2z" />
      </svg>
    </span>
  </>
);
