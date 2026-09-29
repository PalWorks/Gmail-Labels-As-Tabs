import React from 'react';
import { SUPPORT_EMAIL } from '../content/site';
import { DocPage } from '../components/DocPage';
import { ContactForm } from '../components/ContactForm';

export const Contact: React.FC = () => (
  <DocPage
    title="Contact and support"
    crumb="Contact"
    lede="Ask a question, report a problem or suggest a feature. A person reads every message and replies."
  >
    <p>
      Use the form, or write to <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. Inside the extension, the
      Support and Feedback page in Settings sends a message too, and can attach your extension version and browser
      build, which makes a problem much quicker to find.
    </p>
    <ContactForm />
    <h2>Before you write</h2>
    <ul>
      <li>
        <strong>The tab bar is missing.</strong> Reload Gmail once. If it is still missing, say which browser you use and
        whether Gmail is in its default or a custom theme.
      </li>
      <li>
        <strong>A tab shows the wrong count.</strong> Counts come from Gmail itself. Say which label or search the tab
        is for, and what Gmail shows for the same view.
      </li>
      <li>
        <strong>You want your data removed.</strong> The extension keeps your setup in your own browser, and removing the
        extension removes it. We hold nothing about you unless you have written to us; ask and we delete that too.
      </li>
    </ul>
  </DocPage>
);
