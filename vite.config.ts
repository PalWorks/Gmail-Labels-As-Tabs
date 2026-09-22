import path from 'path';
import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { FAQ_ITEMS } from './content/faq';

/**
 * Write the FAQPage structured data into index.html at build time.
 *
 * It used to be rendered by the FAQ section itself, which meant it existed
 * only once React had run. Google executes JavaScript and would have seen it;
 * most of the crawlers that answer questions rather than return links do not,
 * and saw nothing. Injecting it here puts it in the HTML that is served.
 *
 * The source is content/faq.ts, the same list the page renders, so the markup
 * and the visible answers cannot drift apart. That is the whole point: FAQ
 * markup describing questions a visitor cannot find on the page is a
 * structured-data violation, not a clever trick.
 */
function faqStructuredData(): Plugin {
  return {
    name: 'faq-structured-data',
    transformIndexHtml(html) {
      const json = JSON.stringify(
        {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: FAQ_ITEMS.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: { '@type': 'Answer', text: item.answer },
          })),
        },
        null,
        2
      );
      return html.replace(
        '</head>',
        `  <!-- Structured Data: FAQPage, generated from content/faq.ts at build time -->\n  <script type="application/ld+json">\n${json}\n  </script>\n</head>`
      );
    },
  };
}

export default defineConfig(() => {
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react(), faqStructuredData()],
    // No `define` for GEMINI_API_KEY.
    //
    // The scaffold injected it into the client bundle, where `define` performs
    // a literal text substitution: whatever is in .env.local at build time
    // becomes plain text in a public file. Nothing in this site ever read
    // `process.env.API_KEY`, so it bought nothing and risked publishing a live
    // key on any local build. Removed 2026-09-21. If a key is ever genuinely
    // needed, it belongs behind a server, not in a static bundle.
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    base: '/Gmail-Labels-As-Tabs/',
  };
});
