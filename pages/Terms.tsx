import React from 'react';
import { DocPage } from '../components/DocPage';

// Updated by hand, so the page never claims to be fresher than the last
// time somebody actually read it. Same reason as in Privacy.tsx.
const LAST_UPDATED = '21 September 2026';

export const Terms: React.FC = () => (
  <DocPage title="Terms and conditions" crumb="Terms" meta={<>Last updated {LAST_UPDATED}.</>}>


            <h2>1. Acceptance of Terms</h2>
            <p>
              By downloading, installing, or using the Gmail Labels and Search Queries as Tabs Chrome Extension, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the extension.
            </p>

            <h2>2. License</h2>
            <p>
              We grant you a revocable, non-exclusive, non-transferable, limited license to download, install, and use the extension strictly in accordance with these terms.
            </p>

            <h2>3. Restrictions</h2>
            <p>
              You agree not to, and you will not permit others to:
            </p>
            <ul>
              <li>Reverse engineer, decompile, or disassemble the extension.</li>
              <li>Modify, make derivative works of, disassemble, or decrypt any part of the extension.</li>
              <li>Use the extension for any illegal purpose or in violation of any local, state, national, or international law.</li>
            </ul>

            <h2>4. Disclaimer of Warranties</h2>
            <p>
              The extension is provided "AS IS" and "AS AVAILABLE" with all faults and defects without warranty of any kind. To the maximum extent permitted under applicable law, we expressly disclaim all warranties, whether express, implied, statutory, or otherwise.
            </p>

            <h2>5. Limitation of Liability</h2>
            <p>
              In no event shall Gmail Labels and Search Queries as Tabs or its developers be liable for any special, incidental, indirect, or consequential damages whatsoever (including, but not limited to, damages for loss of profits, loss of data, or other information) arising out of or in any way related to the use of or inability to use the extension.
            </p>

            <h2>6. Changes to Terms</h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. By continuing to access or use our extension after those revisions become effective, you agree to be bound by the revised terms.
            </p>
  </DocPage>
);
