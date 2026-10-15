import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/big-shoulders-stencil-display/700';
import '@fontsource/big-shoulders-stencil-display/800';
import '@fontsource/big-shoulders-stencil-display/900';
import '@fontsource/atkinson-hyperlegible/400';
import '@fontsource/atkinson-hyperlegible/400-italic';
import '@fontsource/atkinson-hyperlegible/700';
import '@fontsource/martian-mono/400';
import '@fontsource/martian-mono/500';
import '@fontsource/martian-mono/600';
import '@fontsource/martian-mono/700';
import '@fontsource/martian-mono/800';
import './styles/tokens.css';
import './styles/base.css';
import { App } from './app/App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
