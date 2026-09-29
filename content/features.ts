/**
 * features.ts
 *
 * What the extension does, as data. Imports nothing but site.ts.
 *
 * `since` is the version a feature arrived in. Anything newer than the
 * version the store serves (LIVE_VERSION) is shown as coming in the next
 * release and left out of the structured data's featureList, because a page
 * that promises what the install does not deliver is the fastest way to lose
 * the visitor who believed it.
 */

import { isLive } from './site';

export type FeatureKey =
  | 'labels'
  | 'searches'
  | 'counts'
  | 'colours'
  | 'reorder'
  | 'accounts'
  | 'themes'
  | 'rules'
  | 'backup'
  | 'labelMenu'
  | 'openTabs'
  | 'senderIcons';

export interface Feature {
  readonly key: FeatureKey;
  readonly since: string;
  /** Short name, for featureList and compact lists. */
  readonly name: string;
  readonly title: string;
  readonly body: string;
  /** A Gmail search, shown in the monospace face where the feature is about one. */
  readonly example?: string;
}

export const FEATURES: readonly Feature[] = [
  {
    key: 'labels',
    since: '1.0.0',
    name: 'Gmail labels as tabs',
    title: 'Any label becomes a tab',
    body: 'Clients, Invoices, Travel: the labels you open all day sit in a bar above the inbox instead of somewhere down the sidebar. Sublabels work too, and Gmail views such as Starred and Sent.',
  },
  {
    key: 'searches',
    since: '1.0.0',
    name: 'Saved Gmail searches as tabs',
    title: 'Any search becomes a tab',
    body: 'Run a search once, press + on the bar, and it stays. Every Gmail operator works, and the tab runs the search live each time you click it.',
    example: 'from:accounts@ has:attachment newer_than:30d',
  },
  {
    key: 'counts',
    since: '1.0.0',
    name: 'Live unread counts on every tab',
    title: 'Unread counts that keep up',
    body: 'Each tab shows how many unread messages it holds, read from Gmail itself and updated as mail arrives.',
  },
  {
    key: 'colours',
    since: '1.3.0',
    name: 'Tab colours from an accessible palette',
    title: 'Colour for the views that matter',
    body: 'Eight colours, chosen to stay readable in light and dark. Colour is never the only signal, so the bar still reads without it.',
  },
  {
    key: 'reorder',
    since: '1.0.0',
    name: 'Drag to reorder, synced across Chrome',
    title: 'Drag to reorder, and it follows you',
    body: 'Put the tabs in the order you work. The order syncs through Chrome, the same way your bookmarks do.',
  },
  {
    key: 'accounts',
    since: '1.0.0',
    name: 'Separate configuration per Gmail account',
    title: 'One bar per account',
    body: 'Work and personal Gmail in the same browser each keep their own tabs, colours, order and rules. Switch accounts and the bar switches with you.',
  },
  {
    key: 'themes',
    since: '1.4.0',
    name: "Light, dark, and a System theme that follows Gmail's own theme",
    title: 'Matches the Gmail you are looking at',
    body: "Light, Dark or System, where System follows Gmail's own theme rather than your desktop's, so a light Gmail on a dark computer still gets a light bar.",
  },
  {
    key: 'rules',
    since: '1.3.0',
    name: 'Cleanup rules generated as a Google Apps Script',
    title: 'Cleanup rules that run in your account',
    body: 'Clear Promotions after 30 days, archive newsletters after 14. The extension writes a Google Apps Script that you read, paste into your own account and schedule. Mail goes to Trash, where Gmail keeps it for 30 days.',
  },
  {
    key: 'backup',
    since: '1.0.0',
    name: 'Export and import configuration as JSON',
    title: 'Your setup, in a file',
    body: 'Export every tab, colour and rule to a JSON file, and import it into a new computer or a fresh profile.',
  },
  {
    key: 'labelMenu',
    since: '1.7.0',
    name: "Add a label from Gmail's own label menu",
    title: "Add a label from Gmail's own menu",
    body: 'The three dots beside any label in the sidebar gain "Show as Tabs", or "Remove from Tabs" when it is already there.',
  },
  {
    key: 'openTabs',
    since: '1.7.3',
    name: 'Starts in Gmail tabs that were already open',
    title: 'No reload after installing',
    body: 'A Gmail tab that was open before you installed or updated gets the bar on its own, without losing an open draft.',
  },
  {
    key: 'senderIcons',
    since: '1.8.0',
    name: 'Optional sender icons in the inbox',
    title: 'See who mail is from, at a glance',
    body: "Optional, and off until you turn it on. Each inbox row gets a small chip naming the sender's organisation, such as mashreq.com, with a coloured letter, or the organisation's own icon if you allow it.",
  },
];

export const LIVE_FEATURES = FEATURES.filter((f) => isLive(f.since));
export const UPCOMING_FEATURES = FEATURES.filter((f) => !isLive(f.since));
