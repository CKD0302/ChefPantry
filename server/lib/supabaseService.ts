import { createClient } from '@supabase/supabase-js';

if (!process.env.SUPABASE_URL) {
  throw new Error('Missing required environment variable: SUPABASE_URL');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY');
}

// Service role client - bypasses RLS and has admin privileges
export const supabaseService = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      fetch: (url, options = {}) => {
        // Use Node.js built-in fetch with better error handling
        return fetch(url, {
          ...options,
          // Add timeout and better headers for Node.js compatibility
          signal: AbortSignal.timeout(10000), // 10 second timeout
          headers: {
            'User-Agent': 'Node.js/Supabase-Client',
            ...(options.headers || {}),
          }
        }).catch(error => {
          console.error('Supabase fetch error:', error);
          throw error;
        });
      }
    }
  }
);

// Helper function to get user email by user ID
export async function getUserEmail(userId: string): Promise<string | null> {
  try {
    const { data, error } = await supabaseService.auth.admin.getUserById(userId);
    
    if (error) {
      console.error('Error getting user email:', error);
      return null;
    }
    
    return data?.user?.email || null;
  } catch (error) {
    console.error('Failed to get user email:', error);
    return null;
  }
}