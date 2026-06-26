import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { appLogger } from './logger';

let _client: SupabaseClient;

// A custom fetch wrapper to intercept and log Supabase network failures
const customFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  try {
    const start = Date.now();
    const response = await fetch(input, init);
    const duration = Date.now() - start;

    if (!response.ok) {
      // Log failed Supabase network requests
      const urlStr = typeof input === 'string' ? input : (input instanceof Request ? input.url : input.toString());
      // we only want to clone to read body if it's not a head request
      let errorBody = '';
      try {
        const cloned = response.clone();
        errorBody = await cloned.text();
      } catch (e) {
        errorBody = 'Could not read error body';
      }
      
      appLogger.log('ERROR', 'SUPABASE_API', `HTTP ${response.status} on ${urlStr} (${duration}ms) - ${errorBody.slice(0, 200)}`);
    } else if (duration > 1500) {
      const urlStr = typeof input === 'string' ? input : (input instanceof Request ? input.url : input.toString());
      appLogger.log('WARN', 'SUPABASE_API', `Slow API response on ${urlStr} (${duration}ms)`);
    }
    
    return response;
  } catch (error) {
    const urlStr = typeof input === 'string' ? input : (input instanceof Request ? input.url : input.toString());
    appLogger.log('ERROR', 'SUPABASE_API', `Network failure on ${urlStr}: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
};

function buildClient(): SupabaseClient {
  const url =
    (import.meta as any).env?.VITE_SUPABASE_URL ||
    localStorage.getItem('ehi_supabase_url') ||
    'https://dummy.supabase.co';
  const key =
    (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
    localStorage.getItem('ehi_supabase_anon_key') ||
    'dummy-key';

  return createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true },
    global: { fetch: customFetch }
  });
}

_client = buildClient();

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_t, prop) {
    return (_client as any)[prop];
  },
});

export function reinitSupabase(): void {
  _client = buildClient();
}

export function getConnectionMode(): 'live' | 'unconfigured' {
  const url =
    (import.meta as any).env?.VITE_SUPABASE_URL ||
    localStorage.getItem('ehi_supabase_url') ||
    '';
  return url && url.includes('supabase.co') && !url.includes('dummy') ? 'live' : 'unconfigured';
}

export async function testSupabaseConnection(): Promise<{
  ok: boolean;
  error?: string;
}> {
  try {
    const { error } = await _client.auth.getSession();
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e.message || 'Connection failed' };
  }
}

export async function fetchAndApplyServerConfig(): Promise<boolean> {
  const currentUrl = localStorage.getItem('ehi_supabase_url');
  if (currentUrl && currentUrl.includes('supabase.co')) {
    return true; // Already configured
  }

  try {
    const response = await fetch('/api/config', {
      signal: AbortSignal.timeout(4000)
    });
    
    if (!response.ok) return false;
    
    const config = await response.json();
    if (config.configured && config.supabaseUrl && config.supabaseAnonKey) {
      localStorage.setItem('ehi_supabase_url', config.supabaseUrl);
      localStorage.setItem('ehi_supabase_anon_key', config.supabaseAnonKey);
      reinitSupabase();
      return true;
    }
    return false;
  } catch (error) {
    return false; // Silently fail and remain unconfigured
  }
}
