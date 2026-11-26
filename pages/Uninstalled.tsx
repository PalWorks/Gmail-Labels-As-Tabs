// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react';
import { DocPage } from '../components/DocPage';
import { UninstallForm } from '../components/UninstallForm';
import { STORE_URL } from '../content/site';

/**
 * Chrome opens this page when the extension is removed. Not in the sitemap,
 * and marked noindex: it is only useful to someone who just uninstalled.
 */
export const Uninstalled: React.FC = () => (
  <DocPage
    title="Gmail Labels as Tabs is removed"
    crumb="Removed"
    lede="Your Gmail is back to how it was. One question, if you have a moment: it is how we decide what to fix next."
  >
    <UninstallForm />
    <p>
      Removed it by mistake? <a href={STORE_URL}>Add it back from the Chrome Web Store</a>.
    </p>
  </DocPage>
);
