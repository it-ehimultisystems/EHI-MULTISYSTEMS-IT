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
