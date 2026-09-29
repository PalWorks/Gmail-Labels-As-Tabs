/**
 * operators.ts
 *
 * A reference of Gmail's search operators, and the searches worth keeping as
 * a tab. Data only: the page, its markup and llms-full.txt read it.
 *
 * Every operator here is on Google's own list, "Search operators you can use
 * with Gmail" (OPERATORS_SOURCE), or is a folder name Gmail's own advanced
 * search writes into the box (in:inbox, in:sent, in:spam, in:trash). None is
 * invented. When Google adds or drops one, change it here and nowhere else.
 */

export const OPERATORS_UPDATED = '2026-09-29';
export const OPERATORS_SOURCE = 'https://support.google.com/mail/answer/7190';

export const OPERATORS_TITLE = 'Gmail search operators: the complete list, with examples';

export const OPERATORS_SUMMARY =
  'Gmail search operators are words you type into the Gmail search box to narrow results: from: and to: for people, subject: for the subject line, has:attachment and filename: for files, after:, before:, older_than: and newer_than: for dates, larger: for size, is:unread and is:starred for status, and label: and category: for where mail is filed. They combine, so from:accounts@ has:attachment newer_than:30d finds recent mail with attachments from one sender. Any search you use often can be kept as a one-click tab.';

export interface Operator {
  readonly op: string;
  readonly finds: string;
  readonly example: string;
}

export interface OperatorGroup {
  readonly id: string;
  readonly heading: string;
  readonly intro: string;
  readonly operators: readonly Operator[];
}

export const OPERATOR_GROUPS: readonly OperatorGroup[] = [
  {
    id: 'people',
    heading: 'People: who sent it, who received it',
    intro: 'Match a name, a full address, or just a domain.',
    operators: [
      { op: 'from:', finds: 'Mail from a sender', example: 'from:priya@example.com' },
      { op: 'to:', finds: 'Mail sent to a recipient', example: 'to:team@example.com' },
      { op: 'cc:', finds: 'Mail with a recipient in Cc', example: 'cc:finance@example.com' },
      { op: 'bcc:', finds: 'Mail with a recipient in Bcc', example: 'bcc:me@example.com' },
      { op: 'deliveredto:', finds: 'Mail delivered to an address, useful with aliases and forwarding', example: 'deliveredto:sales@example.com' },
      { op: 'list:', finds: 'Mail from a mailing list', example: 'list:updates@example.com' },
    ],
  },
  {
    id: 'words',
    heading: 'Words: the subject and the text',
    intro: 'Narrow by what the message says.',
    operators: [
      { op: 'subject:', finds: 'Words in the subject line', example: 'subject:invoice' },
      { op: '"..."', finds: 'An exact phrase', example: '"payment received"' },
      { op: '+word', finds: 'That exact word, not variations of it', example: '+unicorn' },
      { op: 'AROUND', finds: 'Two words within a number of words of each other', example: 'meeting AROUND 5 friday' },
    ],
  },
  {
    id: 'dates',
    heading: 'Dates and size',
    intro: 'Dates are written year/month/day. Relative ages use d for days, m for months and y for years.',
    operators: [
      { op: 'after: / before:', finds: 'Mail sent after or before a date', example: 'after:2026/01/01 before:2026/04/01' },
      { op: 'older: / newer:', finds: 'Mail older or newer than a date', example: 'older:2025/12/31' },
      { op: 'older_than: / newer_than:', finds: 'Mail older or newer than an age', example: 'newer_than:7d' },
      { op: 'larger: / smaller:', finds: 'Mail larger or smaller than a size in bytes, K or M', example: 'larger:10M' },
      { op: 'size:', finds: 'Mail larger than a size in bytes', example: 'size:1000000' },
    ],
  },
  {
    id: 'status',
    heading: 'Status: read, starred, important, snoozed',
    intro: 'The state Gmail keeps for each message.',
    operators: [
      { op: 'is:unread / is:read', finds: 'Unread or read mail', example: 'is:unread' },
      { op: 'is:starred', finds: 'Starred mail', example: 'is:starred is:unread' },
      { op: 'has:yellow-star', finds: 'Mail with a particular star, when several star types are on', example: 'has:yellow-star' },
      { op: 'is:important', finds: 'Mail Gmail marked important', example: 'is:important newer_than:2d' },
      { op: 'is:snoozed', finds: 'Snoozed mail', example: 'is:snoozed' },
    ],
  },
  {
    id: 'files',
    heading: 'Attachments and files',
    intro: 'Find the message by what came with it.',
    operators: [
      { op: 'has:attachment', finds: 'Mail with any attachment', example: 'has:attachment from:accounts@' },
      { op: 'filename:', finds: 'An attachment by name or type', example: 'filename:pdf' },
      { op: 'has:drive / has:document / has:spreadsheet / has:presentation', finds: 'Mail with a Google Drive file, Doc, Sheet or Slides link', example: 'has:spreadsheet' },
      { op: 'has:youtube', finds: 'Mail with a YouTube video', example: 'has:youtube' },
    ],
  },
  {
    id: 'where',
    heading: 'Where it is filed: labels, categories, folders',
    intro: 'Search a label, one of the inbox categories, or everywhere including Spam and Trash.',
    operators: [
      { op: 'label:', finds: 'Mail with a label', example: 'label:clients' },
      { op: 'has:userlabels / has:nouserlabels', finds: 'Mail with, or without, any label of your own', example: 'has:nouserlabels in:inbox' },
      { op: 'category:', finds: 'An inbox category: primary, social, promotions, updates, forums, reservations or purchases', example: 'category:promotions' },
      { op: 'in:inbox / in:sent / in:spam / in:trash', finds: 'Mail in one place', example: 'in:sent to:priya@example.com' },
      { op: 'in:anywhere', finds: 'Mail anywhere, including Spam and Trash', example: 'in:anywhere subject:receipt' },
    ],
  },
  {
    id: 'combine',
    heading: 'Combining searches',
    intro: 'Any operators can be combined. A space between two means both must match.',
    operators: [
      { op: 'OR or { }', finds: 'Mail matching either term', example: 'from:amy OR from:david' },
      { op: '-', finds: 'Leaves out mail matching a term', example: 'invoice -paid' },
      { op: '( )', finds: 'Groups terms together', example: 'subject:(dinner movie)' },
      { op: 'rfc822msgid:', finds: 'One message by its Message-ID header', example: 'rfc822msgid:200503292@example.com' },
    ],
  },
];

/** Searches people keep, each a real combination of the operators above. */
export const WORTH_A_TAB: readonly { title: string; query: string; why: string }[] = [
  { title: 'A client, everything', query: 'from:northwind.com', why: 'Every message from one company, whoever sent it.' },
  { title: 'Invoices this month', query: 'subject:invoice newer_than:30d', why: 'The bills that arrived lately, and nothing older.' },
  { title: 'Unread with files', query: 'is:unread has:attachment', why: 'The messages that want something opened.' },
  { title: 'Starred, not read', query: 'is:starred is:unread', why: 'What you flagged and have not got to yet.' },
  { title: 'Big attachments', query: 'has:attachment larger:10M', why: 'Where your storage went.' },
  { title: 'Old promotions', query: 'category:promotions older_than:30d', why: 'The pile a cleanup rule can clear for you.' },
  { title: 'Waiting in your inbox, unfiled', query: 'in:inbox has:nouserlabels', why: 'Mail you have not sorted into any label yet.' },
  { title: 'Sent to one person', query: 'in:sent to:priya@example.com', why: 'What you told them, in one place.' },
];

export const OPERATOR_FAQ: readonly { question: string; answer: string }[] = [
  {
    question: 'How do I search Gmail by date?',
    answer:
      'Use after: and before: with a date written year/month/day, for example after:2026/01/01 before:2026/04/01. For a relative age use newer_than: or older_than: with d, m or y, for example newer_than:7d for the last week.',
  },
  {
    question: 'How do I find emails with attachments in Gmail?',
    answer:
      'Search has:attachment. Add filename:pdf for one type, larger:10M for big files, or from: to narrow it to one sender, for example has:attachment from:accounts@ larger:5M.',
  },
  {
    question: 'How do I save a Gmail search?',
    answer:
      'Gmail cannot save a search on its own; you can bookmark its address in the browser, or turn it into a filter. With the free Gmail Labels and Search Queries as Tabs extension, run the search and press + on the tab bar, and it stays as a one-click tab with its unread count.',
  },
  {
    question: 'How do I exclude something from a Gmail search?',
    answer: 'Put a minus sign before the term, with no space, for example invoice -paid, or from:@example.com -from:noreply@example.com.',
  },
];
