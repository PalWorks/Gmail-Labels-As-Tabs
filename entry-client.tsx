import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import './styles/site.css';

const root = document.getElementById('root');
if (!root) throw new Error('Could not find root element to mount to');

const app = (
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// Every published page arrives prerendered, so React attaches to the HTML
// already there. The dev server serves an empty shell, so it renders instead.
if (root.firstElementChild) hydrateRoot(root, app);
else createRoot(root).render(app);
