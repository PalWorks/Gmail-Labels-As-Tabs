
const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const isWatch = process.argv.includes('--watch');

const commonConfig = {
    entryPoints: [
        'src/content.ts',
        'src/options.ts',
        'src/background.ts'
    ],
    bundle: true,
    outdir: 'dist/js',
    platform: 'browser',
    target: ['es2020'],
    sourcemap: true,
    logLevel: 'info',
};

async function build() {
    if (isWatch) {
        const ctx = await esbuild.context(commonConfig);
        await ctx.watch();
        console.log('Watching for changes...');
    } else {
        await esbuild.build(commonConfig);
        console.log('Build complete.');
    }
}

build().catch(() => process.exit(1));
