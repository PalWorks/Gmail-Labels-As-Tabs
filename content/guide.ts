/**
 * guide.ts
 *
 * The long answer to the question this product exists for: how do you get
 * custom tabs in Gmail? Data only, so the page, its Article markup and
 * llms-full.txt are the same words.
 *
 * It describes Gmail's own options fairly, including when they are enough. A
 * guide that pretends the alternatives do not exist is an advert, and answer
 * engines quote the page that gives the whole answer.
 */

export const GUIDE_UPDATED = '2026-09-29';

export interface GuideSection {
  readonly id: string;
  readonly heading: string;
  readonly paragraphs: readonly string[];
}

export const GUIDE_TITLE = 'How to add custom tabs to Gmail';

export const GUIDE_SUMMARY =
  'Gmail cannot turn a label or a search into a tab on its own. Its category tabs are a fixed set of five, and Multiple Inboxes stacks up to five search results on the inbox page instead. A browser extension such as Gmail Labels and Search Queries as Tabs adds a bar above the inbox where any label or any search is a one-click tab.';

export const GUIDE_SECTIONS: readonly GuideSection[] = [
  {
    id: 'categories',
    heading: "Gmail's category tabs",
    paragraphs: [
      'Gmail sorts the inbox into up to five category tabs: Primary, Promotions, Social, Updates and Forums. You can switch each one on or off in Settings, under Inbox, but you cannot rename them, add a sixth, or make one show a label of your own.',
      'They suit mail that sorts itself by type. They do not help with the labels you made for your own work, such as a client, a project or a supplier.',
    ],
  },
  {
    id: 'multiple-inboxes',
    heading: 'Multiple Inboxes',
    paragraphs: [
      'Multiple Inboxes is an inbox type in Gmail settings. It shows up to five extra sections on the inbox page, each one the result of a search you define, such as is:starred or label:clients, placed above, below or beside the main list.',
      'It is the closest Gmail comes to custom views, with two costs. Every section is on screen at once, so five sections means a long page, and because it replaces the default inbox type, the category tabs go away while it is on.',
    ],
  },
  {
    id: 'bookmarks',
    heading: 'Bookmarking a search',
    paragraphs: [
      'Every Gmail search has its own address, so a search can be saved as a browser bookmark and opened from the bookmarks bar. It works with any operator. It also sits outside Gmail, shows no unread count, and opens the search as if you had typed it.',
    ],
  },
  {
    id: 'extension',
    heading: 'Tabs above the inbox, with an extension',
    paragraphs: [
      'Gmail Labels and Search Queries as Tabs adds a bar under Gmail\'s toolbar. Any label, any search and any of Gmail\'s own views can be a tab on it, each with a live unread count. The category tabs stay where they are, underneath.',
      'To add a search, run it in Gmail and press the + button at the end of the bar. To add a label, press the settings icon on the bar, type the label\'s name and press Add. Drag tabs to reorder them and give the important ones a colour. Your tabs sync through Chrome, and each Gmail account keeps its own.',
      'The extension is free and open source. It runs only on mail.google.com, reads label names and unread counts from the page you already have open, and never reads, stores or sends your messages.',
    ],
  },
  {
    id: 'which',
    heading: 'Which one to use',
    paragraphs: [
      'If one or two views are enough and you are happy to lose the category tabs, Multiple Inboxes needs nothing installed. If you use a search now and then, a bookmark is fine. If you move between more than a few labels or searches all day, a tab bar keeps each one a click away without stacking them all on one page.',
    ],
  },
];

/** The comparison, as rows. The last column is always this extension. */
export const GUIDE_COMPARISON = {
  columns: ['Category tabs', 'Multiple Inboxes', 'Bookmarked search', 'This extension'],
  // `plain` rows are facts, not a score: no tick or dash beside them.
  rows: [
    { label: 'Your own labels', values: ['No', 'Yes, as sections', 'Yes', 'Yes'] },
    { label: 'Any Gmail search', values: ['No', 'Yes, as sections', 'Yes', 'Yes'] },
    { label: 'How many', values: ['Five, fixed', 'Up to five', 'Any', 'Any'] },
    { label: 'One view at a time', values: ['Yes', 'No, all at once', 'Yes', 'Yes'] },
    { label: 'Unread count per view', values: ['New mail only', 'No', 'No', 'Yes'] },
    { label: 'Keeps the category tabs', values: ['Yes', 'No', 'Yes', 'Yes'] },
    { label: 'Needs an install', values: ['Nothing to install', 'Nothing to install', 'Nothing to install', 'A free extension'], plain: true },
  ],
} as const;
