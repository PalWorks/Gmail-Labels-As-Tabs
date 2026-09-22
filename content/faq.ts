/**
 * faq.ts
 *
 * The homepage FAQ, as data, in a module that imports nothing.
 *
 * It has no imports on purpose: vite.config.ts reads this file to write the
 * FAQPage structured data into index.html at build time, and a module that
 * pulled in React or an icon set could not be loaded there. The page and the
 * markup therefore come from one list, so they cannot disagree.
 */

export interface FaqItem {
    readonly question: string;
    readonly answer: string;
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
export const FAQ_ITEMS: readonly FaqItem[] = [
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
    answer: "Yes. Each account, identified by its address, keeps its own tabs, colors, order and rules, and switching accounts switches the bar."
  },
  {
    question: "Do my tabs follow me to another computer?",
    answer: "Yes. They sync through Chrome's own sync, the same mechanism as your bookmarks, so signing into Chrome elsewhere brings them with you."
  },
  {
    question: "Can I pin a search, not just a label?",
    answer: "Yes. Any Gmail search works, for example is:unread from:boss or has:attachment older_than:30d, and becomes a tab you click like any other."
  },
  {
    question: "How do I add a Gmail label as a tab?",
    answer: "Open Gmail, click the settings icon on the tab bar, type the label name (for example Invoices or Clients), and click Add. The new tab appears immediately."
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
