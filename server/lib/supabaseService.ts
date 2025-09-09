import { createClient } from '@supabase/supabase-js';
import { customFetch } from './customDNS';

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url) {
  throw new Error('Missing required environment variable: SUPABASE_URL');
}

if (!key) {
  throw new Error('Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY');
}

export const supabaseService = createClient(url, key, {
  global: { fetch: customFetch as any },
  auth: { persistSession: false, autoRefreshToken: false },
  realtime: {
    params: { eventsPerSecond: 2 },
    heartbeatIntervalMs: 10000,
  },
});

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