import React from 'react';
import { SiteLink as Link } from '../components/SiteLink';
import { DocPage } from '../components/DocPage';

export const NotFound: React.FC = () => (
  <DocPage title="This page is not here" lede="The address may be mistyped, or the page may have moved.">
    <p>
      <Link to="/">Go to the homepage</Link>, or read <Link to="/gmail-custom-tabs/">how to add custom tabs to Gmail</Link>.
    </p>
  </DocPage>
);
