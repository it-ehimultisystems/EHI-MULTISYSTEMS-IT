import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App.tsx';
import './index.css';
import { cleanupOldPings } from './lib/privacy';
import { fetchAndApplyServerConfig } from './lib/supabase';

// Error monitoring. Deliberately minimal: error capture only, no
// tracesSampleRate/replay/profiling — this app previously had zero
// centralized error visibility (only a 100-entry in-memory per-tab log
// that vanished on refresh), so the priority is knowing an error
// happened at all, not full distributed tracing. VITE_SENTRY_DSN is not
// secret (Sentry DSNs are designed to be public, same as the Supabase
// anon key) so it's safe to bundle client-side. If it's unset, Sentry.init
// is skipped entirely rather than throwing.
const sentryDsn = (import.meta as any).env?.VITE_SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: (import.meta as any).env?.MODE || 'production',
  });
}

// Suppress Vite HMR WebSocket error in embedded previews
window.addEventListener('unhandledrejection', (event) => {
  if (
    event.reason?.message?.includes('WebSocket') ||
    event.reason?.message?.includes('websocket')
  ) {
    event.preventDefault();
  }
});

// Vite's dynamic-import runtime dispatches this event when a lazily-loaded
// chunk 404s -- this hits any tab (especially an installed PWA, which stays
// open for days) that was already loaded before a new deploy went out: the
// hashed chunk filenames baked into the code already running in that tab
// no longer exist on the server, so import() rejects and every button that
// lazy-loads a print/report module (e.g. escposVJPrinting,
// escposMarketingPrinting) fails with a "Failed to fetch dynamically
// imported module" error that has nothing to do with the feature itself.
// A reload re-fetches the current index.html and gets the right hashes.
// Guarded with sessionStorage so a genuinely broken deploy (still 404ing
// after the reload) surfaces its real error instead of reloading forever.
window.addEventListener('vite:preloadError', () => {
  const key = 'ehi_preload_error_reloaded';
  if (!sessionStorage.getItem(key)) {
    sessionStorage.setItem(key, '1');
    window.location.reload();
  }
});

// Run data retention policies
cleanupOldPings();

// CRITICAL: Await Supabase config BEFORE mounting React.
// Without this, getSession() fires against the dummy URL (race condition)
// and users are shown the login screen even with a valid session.
fetchAndApplyServerConfig()
  .catch(() => {})
  .finally(() => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  });
