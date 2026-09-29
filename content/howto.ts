/**
 * howto.ts
 *
 * The three steps from install to a working tab, as the homepage shows them
 * and as its HowTo markup states them. One list, so the two agree.
 */

export const HOWTO_TITLE = 'How to add a Gmail label or search as a tab';

export const HOWTO_STEPS: readonly { readonly name: string; readonly text: string }[] = [
  {
    name: 'Add the extension to Chrome',
    text: 'Install Gmail Labels and Search Queries as Tabs from the Chrome Web Store. It is free and asks for no account. Open Gmail and the tab bar appears under the toolbar.',
  },
  {
    name: 'Open the view you want to keep',
    text: 'Click a label in the sidebar, or run any Gmail search, for example is:unread has:attachment.',
  },
  {
    name: 'Press + on the tab bar',
    text: 'The view becomes a tab with its unread count. Drag it to reorder, give it a colour, and click it any time to open that view again.',
  },
];
