/**
 * Tour.tsx
 *
 * The product tour, embedded in the marketing page.
 *
 * This is the same tour the extension shows on install, running the same
 * code: vendor/onboarding is copied out of the extension repository by
 * scripts/sync-wizard.mjs and is never edited here. A visitor who plays it and
 * then installs sees exactly what they were shown, which is the whole reason
 * for vendoring rather than rebuilding it in React.
 *
 * Everything the web needs and Gmail does not lives in this file:
 *
 *   - The wizard marks its root as a modal dialog, which is right over Gmail
 *     and wrong in the middle of a page. The roles are corrected after it is
 *     built rather than in the vendored file, so the next sync cannot undo it.
 *   - 'System' means the operating system here. In the extension it means
 *     Gmail's own theme, because a user on a dark desktop can be reading a
 *     light Gmail and the tab bar has to blend into the inbox, not the
 *     desktop. There is no Gmail on this page to ask, so the OS is not a
 *     fallback here, it is the only honest answer.
 *   - A theme chosen here is a preview. It retints the panel around the tour
 *     and is remembered for this browser, and it does not reach the extension.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createWizard, WizardHandle } from '../vendor/onboarding/wizardView';
import type { Theme } from '../vendor/onboarding/theme';
import '../vendor/onboarding/onboarding.css';
import '../styles/tour.css';

const STORE_URL =
    'https://chromewebstore.google.com/detail/gmail-labels-and-search-q/jemjnjlplglfoiipcjhoacneigdgfmde';

/** Namespaced so it cannot collide with anything else on this origin. */
const THEME_KEY = 'glt-site-tour-theme';

type Resolved = 'light' | 'dark';

function osTheme(): Resolved {
    try {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
        return 'light';
    }
}

function readStoredTheme(): Theme {
    try {
        const stored = window.localStorage.getItem(THEME_KEY);
        if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
    } catch {
        // Private mode, or storage blocked. The tour opens on light and works.
    }
    return 'light';
}

export const Tour: React.FC = () => {
    const mount = useRef<HTMLDivElement>(null);
    const wizard = useRef<WizardHandle | null>(null);
    const [resolved, setResolved] = useState<Resolved>('light');

    const restart = useCallback(() => {
        wizard.current?.goTo(0);
        mount.current?.querySelector<HTMLElement>('.glt-ob-next')?.focus();
    }, []);

    useEffect(() => {
        const host = mount.current;
        if (!host) return;

        const handle = createWizard({
            loadTheme: () => Promise.resolve(readStoredTheme()),
            saveTheme: (theme: Theme) => {
                try {
                    window.localStorage.setItem(THEME_KEY, theme);
                } catch {
                    // Nothing to do and nothing worth saying: the choice still
                    // applies for this visit.
                }
                return Promise.resolve();
            },
            applyTheme: (theme: Theme) => {
                setResolved(theme === 'system' ? osTheme() : theme);
            },
            resolveSystem: osTheme,
            onFinish: () => window.open(STORE_URL, '_blank', 'noopener,noreferrer'),
            showClose: false,
            onError: (error: unknown) => console.warn('Tour:', error),
        });

        // Correct for the host. Over Gmail the tour is a modal and announcing
        // itself as one is right; here it is a section of a page, and a screen
        // reader told it is a modal dialog would expect the rest of the page
        // to be inert.
        const root = handle.element;
        root.setAttribute('role', 'group');
        root.removeAttribute('aria-modal');
        root.setAttribute('aria-label', 'Interactive product tour');

        host.appendChild(root);
        wizard.current = handle;

        // Open on whatever this visitor last chose, so the frame and the panel
        // agree from the first frame rather than after loadTheme resolves.
        const stored = readStoredTheme();
        setResolved(stored === 'system' ? osTheme() : stored);

        return () => {
            handle.destroy();
            root.remove();
            wizard.current = null;
        };
    }, []);

    return (
        <div className="glt-tour-outer">
            <div className="glt-tour" data-resolved={resolved}>
                <div ref={mount} className="glt-tour-mount" />
            </div>
            <div className="glt-tour-foot">
                <button type="button" className="glt-tour-restart" onClick={restart}>
                    Start the tour again
                </button>
                <p className="glt-tour-note">
                    Six steps, about a minute. Choosing a theme on the last step retints the panel here; in Gmail it
                    retints your real tab bar while the tour is still open.
                </p>
            </div>
        </div>
    );
};
