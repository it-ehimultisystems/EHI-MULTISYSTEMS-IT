import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient;

function buildClient(): SupabaseClient {
  const url =
    (import.meta as any).env?.VITE_SUPABASE_URL ||
    localStorage.getItem('ehi_supabase_url');
  const key =
    (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
    localStorage.getItem('ehi_supabase_anon_key');

  return createClient(url || '', key || '', {
    auth: { persistSession: true, autoRefreshToken: true },
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
  return url && url.includes('supabase.co') ? 'live' : 'unconfigured';
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
