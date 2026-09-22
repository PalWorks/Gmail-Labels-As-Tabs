/**
 * theme.ts
 *
 * The one type the vendored tour needs from the extension.
 *
 * In the extension this comes from src/utils/storage.ts, a chrome.storage
 * wrapper that has no meaning on a web page. Rather than vendor that module
 * and everything it drags with it, the three strings are declared here and
 * scripts/sync-wizard.mjs refuses to copy anything if the extension's own
 * definition stops matching this one.
 *
 * This file is hand-written. The others in this directory are generated.
 */

export type Theme = 'system' | 'light' | 'dark';
