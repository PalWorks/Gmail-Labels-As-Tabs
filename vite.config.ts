import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
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
