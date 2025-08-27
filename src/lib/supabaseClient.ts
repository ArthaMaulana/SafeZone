// src/lib/supabaseClient.ts

import { createClient } from '@supabase/supabase-js';

// Ambil environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be defined in .env.local');
}

// Buat dan ekspor Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
