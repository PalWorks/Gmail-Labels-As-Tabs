import path from 'path';
import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * The two designs under review. Each has its own typefaces; the page head
 * loads only the chosen one's. After the choice, the other entry, its
 * stylesheet and VITE_VARIANT go.
 */
const FONTS: Record<string, string> = {
  a: 'https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@500..800&family=Hanken+Grotesk:wght@400..600&family=Martian+Mono:wght@400..500&display=swap',
  b: 'https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..800&family=IBM+Plex+Mono:wght@400;500&display=swap',
};

function variantHead(variant: string): Plugin {
  return {
    name: 'variant-head',
    transformIndexHtml(html) {
      return html
        .replace('<!--FONTS-->', `<link rel="stylesheet" href="${FONTS[variant]}" />`)
        .replace('data-variant="a"', `data-variant="${variant}"`);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const variant = (process.env.VITE_VARIANT || env.VITE_VARIANT) === 'b' ? 'b' : 'a';
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    define: {
      'import.meta.env.VITE_VARIANT': JSON.stringify(variant),
    },
    plugins: [react(), variantHead(variant)],
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
      },
    },
    base: '/Gmail-Labels-As-Tabs/',
  };
});
