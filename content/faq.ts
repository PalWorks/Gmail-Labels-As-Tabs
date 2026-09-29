/**
 * faq.ts
 *
 * The homepage FAQ, as data, in a module with no React in it.
 *
 * It imports nothing but site.ts on purpose: the prerender step reads this
 * list to write the FAQPage structured data and llms.txt, and the page renders
 * the same list, so the three cannot disagree.
 */

import { isLive } from './site';

export interface FaqItem {
    readonly question: string;
    readonly answer: string;
    /** The version whose behaviour the answer describes; hidden until it is live. */
    readonly since?: string;
}

/**
 * The questions people actually type, worded as they type them.
 *
 * Deliberately identical to the "Questions people ask" block in the Chrome Web
 * Store listing. Two surfaces answering the same question in the same words is
 * what lets a search or answer engine treat them as one product corroborating
 * itself, rather than two pages making similar noises. Change one, change both:
 * the store copy lives in STORE_LISTING.md in the extension repository.
 *
 * Every answer opens with Yes or No and reads on its own, because an answer
 * engine lifts a sentence, not a page.
 */
const ALL_FAQ_ITEMS: readonly FaqItem[] = [
  {
    question: "What is Gmail Labels and Search Queries as Tabs?",
    answer: "It is a free Chrome extension that puts your Gmail labels and saved searches in a tab bar across the top of Gmail, so every view you use all day is one click away instead of a scan down the sidebar. It also pins Gmail's own views, such as #starred and #sent."
  },
  {
    question: "Does it read my email?",
    answer: "No. It reads your label names and unread counts from the Gmail page in your browser. Message content is never read, stored or sent anywhere."
  },
  {
    question: "Is it free?",
    answer: "Yes. Free, no account, no upsell, and open source under the MIT license."
  },
  {
    question: "Does it work with multiple Gmail accounts?",
    answer: "Yes. Each account, identified by its address, keeps its own tabs, colours, order and rules, and switching accounts switches the bar."
  },
  {
    question: "Do my tabs follow me to another computer?",
    answer: "Yes. They sync through Chrome's own sync, the same mechanism as your bookmarks, so signing into Chrome elsewhere brings them with you."
  },
  {
    question: "Can I add custom tabs to Gmail?",
    answer: "Yes, with this extension. Gmail on its own offers only a fixed set of five category tabs (Primary, Promotions, Social, Updates and Forums). The extension adds a bar above the inbox where any label or any search can be a tab, alongside the categories rather than instead of them."
  },
  {
    question: "Can I pin a search, not just a label?",
    answer: "Yes. Any Gmail search works, for example is:unread from:boss or has:attachment older_than:30d, and becomes a tab you click like any other."
  },
  {
    question: "How do I add a Gmail label as a tab?",
    answer: "Two ways, both from the tab bar the extension adds above your inbox. Open the label in Gmail and press the + button at the end of the bar, which saves whatever view you are on, label or search, as a tab. Or press the settings icon on the bar, type the label's name (for example Invoices or Clients) and press Add Tab. The new tab appears immediately with its unread count, and you can drag it into place and give it a colour."
  },
  {
    question: "Can I add a label without opening settings?",
    answer: "Yes. Click the three dots beside any label in Gmail's sidebar and the menu ends with \"Show as Tabs\", or \"Remove from Tabs\" if it is already there. Sublabels work the same way.",
    since: "1.7.0"
  },
  {
    question: "Can it show who an email is from at a glance?",
    answer: "Yes, if you turn on sender icons in Settings. Each inbox row gets a small chip naming the sender's organisation, such as mashreq.com, with a coloured letter or, if you allow it, the organisation's own icon. It is off until you turn it on.",
    since: "1.8.0"
  },
  {
    question: "Does it work with Gmail dark mode?",
    answer: "Yes. Light, Dark and System are all supported, and System follows Gmail's own theme, so a light Gmail on a dark desktop still gets a light tab bar."
  },
  {
    question: "Does it slow Gmail down?",
    answer: "No. It draws one small bar on a page you have already loaded, and it fetches nothing of its own."
  },
  {
    question: "Does it work in Edge, Brave or Firefox?",
    answer: "It is built on Manifest V3 and published for Chrome. Chromium browsers that install from the Chrome Web Store, such as Edge, Brave and Opera, can run it. Firefox and Safari cannot."
  },
  {
    question: "How do I get my tabs back if something goes wrong?",
    answer: "Export your configuration to a JSON file from Settings at any time, and import it back into a fresh profile or a new machine."
  }
];

/** The questions whose answers are true of the version in the store today. */
export const FAQ_ITEMS: readonly FaqItem[] = ALL_FAQ_ITEMS.filter((item) => !item.since || isLive(item.since));
