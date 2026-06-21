/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const isMock = !supabaseUrl || !supabaseAnonKey;

const realSupabase = createClient(
  supabaseUrl || 'https://mock.supabase.co', 
  supabaseAnonKey || 'mock-key'
);

// If no environment variables, intercept and provide fully mocked responses to avoid "Failed to fetch" errors.
export const supabase = isMock ? {
  ...realSupabase,
  auth: {
    ...realSupabase.auth,
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: async () => { throw new Error('Invalid credentials. Please use one of the demo credentials below.'); },
    signOut: async () => ({ error: null })
  },
  channel: () => ({
    on: () => ({
      subscribe: () => {}
    }),
    unsubscribe: async () => {} 
  }),
  removeChannel: async () => {},
  from: (table: string) => ({
    select: () => ({
      eq: () => ({
        single: async () => ({ data: null, error: { message: 'Mock offline logic' } })
      })
    }),
    insert: async () => ({ error: { message: 'Mock offline logic' } }),
    upsert: async () => ({ error: { message: 'Mock offline logic' } })
  })
} as any : realSupabase;
