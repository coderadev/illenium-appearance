import React from 'react';
import { createRoot } from 'react-dom/client';
import '../node_modules/@fontsource/bebas-neue/400.css';
import '../node_modules/@fontsource/oswald/400.css';
import '../node_modules/@fontsource/oswald/500.css';
import '../node_modules/@fontsource/oswald/700.css';
import '../node_modules/@fontsource/barlow-condensed/500.css';
import '../node_modules/@fontsource/barlow-condensed/600.css';
import '../node_modules/@fontsource/barlow-condensed/700.css';
import './index.css';
import App from './App';
import Nui, { EventListener } from './Nui';

if (!import.meta.env.PROD) {
  window.Nui = Nui;
}

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <App />
    <EventListener />
  </React.StrictMode>,
);
