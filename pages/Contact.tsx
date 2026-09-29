import React, { useEffect } from 'react';
import { SUPPORT_EMAIL } from '../content/site';
import { DocPage } from '../components/DocPage';

const TALLY_SCRIPT = 'https://tally.so/widgets/embed.js';

export const Contact: React.FC = () => {
  // The form is Tally's, loaded only on this page and only once it is shown.
  useEffect(() => {
    const load = () => {
      const w = window as unknown as { Tally?: { loadEmbeds: () => void } };
      if (w.Tally) w.Tally.loadEmbeds();
      else
        document.querySelectorAll<HTMLIFrameElement>('iframe[data-tally-src]:not([src])').forEach((f) => {
          f.src = f.dataset.tallySrc ?? '';
        });
    };
    if (document.querySelector(`script[src="${TALLY_SCRIPT}"]`)) {
      load();
      return;
    }
    const s = document.createElement('script');
    s.src = TALLY_SCRIPT;
    s.async = true;
    s.onload = load;
    s.onerror = load;
    document.body.appendChild(s);
  }, []);

  return (
    <DocPage title="Contact and support" lede="Ask a question, report a problem or suggest a feature. We read every message.">
      <p>
        Write to <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>, or use the form below. Inside the extension,
        the Support and Feedback page in Settings sends the same message with your extension version attached, if you
        allow it, which makes a bug much quicker to find.
      </p>
      <iframe
        data-tally-src="https://tally.so/embed/Me17aA?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1"
        loading="lazy"
        width="100%"
        height="596"
        title="Contact form"
        className="tally-frame"
      />
    </DocPage>
  );
};
