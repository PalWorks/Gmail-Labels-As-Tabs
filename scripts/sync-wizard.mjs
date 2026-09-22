#!/usr/bin/env node
/**
 * sync-wizard.mjs
 *
 * Copy the product tour out of the extension repository and into this site.
 *
 * The tour a visitor plays here is the same code a user gets in Gmail, not a
 * re-implementation of it. That matters more than it sounds: a marketing page
 * that demonstrates a slightly different product is worse than one that
 * demonstrates nothing, and this project has already paid once for two copies
 * of the same thing drifting apart (two websites, two privacy policies, and
 * the correct one was on the copy nobody pointed at).
 *
 * So the files under vendor/onboarding are generated, never hand-edited, and
 * this script is the only thing that writes them. Everything the web needs
 * that Gmail does not lives outside them, in components/Tour.tsx.
 *
 * Usage:
 *   node scripts/sync-wizard.mjs [path-to-extension-repo]   # copy
 *   node scripts/sync-wizard.mjs --check [path]             # fail if stale
 *
 * The default path is ../Gmail-Labels-As-Tabs, the sibling checkout. The
 * output is deterministic: running it twice with an unchanged source produces
 * no diff, which is what makes --check meaningful.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const OUT = resolve(ROOT, 'vendor', 'onboarding');

const args = process.argv.slice(2);
const check = args.includes('--check');
const given = args.find((a) => !a.startsWith('--'));
const SOURCE = resolve(given || resolve(ROOT, '..', 'Gmail-Labels-As-Tabs'));

const FILES = [
    { from: 'src/modules/onboarding/wizardContent.ts', to: 'wizardContent.ts' },
    { from: 'src/modules/onboarding/wizardView.ts', to: 'wizardView.ts' },
    { from: 'src/ui/onboarding.css', to: 'onboarding.css' },
];

/**
 * The one import the extension's copy makes that does not exist here. The
 * extension takes `Theme` from its storage module, which is a chrome.* wrapper
 * this site has no use for; vendor/onboarding/theme.ts declares the same three
 * strings and nothing else.
 */
const REWRITES = [[/from '\.\.\/\.\.\/utils\/storage'/g, "from './theme'"]];

/** The Theme type is copied by hand, so a change to it must not pass quietly. */
const EXPECTED_THEME = "export type Theme = 'system' | 'light' | 'dark';";

function banner(sourcePath, comment) {
    const lines = [
        'GENERATED FILE. Do not edit here.',
        '',
        `Copied from the extension repository, ${sourcePath}, by`,
        'scripts/sync-wizard.mjs. Edit it there and re-run the script, or the',
        'next sync will silently discard whatever was changed here.',
    ];
    return comment === 'css'
        ? `/*\n * ${lines.join('\n * ')}\n */\n\n`
        : `/**\n * ${lines.join('\n * ')}\n */\n\n`;
}

if (!existsSync(SOURCE)) {
    console.error(`No extension repository at ${SOURCE}.`);
    console.error('Pass its path: node scripts/sync-wizard.mjs ../Gmail-Labels-As-Tabs');
    process.exit(2);
}

// The hand-written half of the contract, checked before anything is copied.
const storage = readFileSync(resolve(SOURCE, 'src/utils/storage.ts'), 'utf8');
if (!storage.includes(EXPECTED_THEME)) {
    console.error('The extension changed its Theme type. vendor/onboarding/theme.ts no longer matches it.');
    console.error(`Expected to find: ${EXPECTED_THEME}`);
    process.exit(1);
}

mkdirSync(OUT, { recursive: true });

let stale = 0;
for (const file of FILES) {
    const src = resolve(SOURCE, file.from);
    if (!existsSync(src)) {
        console.error(`Missing in the extension repository: ${file.from}`);
        process.exit(1);
    }

    let body = readFileSync(src, 'utf8');
    for (const [pattern, replacement] of REWRITES) body = body.replace(pattern, replacement);
    const next = banner(file.from, file.to.endsWith('.css') ? 'css' : 'ts') + body;

    const dest = resolve(OUT, file.to);
    const current = existsSync(dest) ? readFileSync(dest, 'utf8') : null;

    if (current === next) {
        console.log(`unchanged  ${file.to}`);
        continue;
    }

    stale++;
    if (check) {
        console.error(`STALE      ${file.to}  (differs from ${file.from})`);
        continue;
    }
    writeFileSync(dest, next);
    console.log(`written    ${file.to}`);
}

if (check && stale > 0) {
    console.error(`\n${stale} vendored file(s) are behind the extension. Run: node scripts/sync-wizard.mjs`);
    process.exit(1);
}
console.log(check ? '\nThe vendored tour matches the extension.' : `\nDone. ${stale} file(s) updated.`);
