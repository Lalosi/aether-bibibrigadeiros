import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string) ||
  'https://giqurnhijhrvhlunpbms.supabase.co';

const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpcXVybmhpamhydmhsdW5wYm1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MDU1NzAsImV4cCI6MjA5Mjk4MTU3MH0.Vl6rtoMp6rnRVELPDWJSoeE1UPSwKNsc7ItjzNuQxno';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type AppRole = 'funcionario' | 'admin' | 'master';