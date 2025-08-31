// src/lib/supabaseClient.ts

import { createClient } from '@supabase/supabase-js';

// Simple approach - use working credentials
const supabaseUrl = 'https://gcqleqrzncjqkelrndhe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjcWxlcXJ6bmNqcWtlbHJuZGhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMDgyNzAsImV4cCI6MjA3MTg4NDI3MH0.QkiQJZND_IrDttL_8CWjzA_Frcqq4l7g28IIF9dapOs';

console.log('Supabase URL:', supabaseUrl);
console.log('API Key loaded:', supabaseAnonKey ? 'Yes' : 'No');

// Create client with proper session persistence
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'safezone-auth-token',
    flowType: 'pkce'
  }
});

// Simple connection test
if (typeof window !== 'undefined') {
  supabase.from('profiles').select('count').limit(1)
    .then(({ data, error }) => {
      if (error) {
        console.error('Supabase connection test failed:', error);
      } else {
        console.log('Supabase connection test successful');
      }
    });
}
