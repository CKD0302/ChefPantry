import { createClient } from '@supabase/supabase-js';

// In Vite, we need to use import.meta.env instead of process.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validate that the environment variables exist
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase credentials. For development purposes, using placeholder values.');
  // We'll create the client with empty values for now, and it will be updated when proper values are set
}

export const supabase = createClient(
  supabaseUrl || 'https://wtmztvmvngqbxxbcbtgud.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);