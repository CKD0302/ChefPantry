import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';

interface Stats {
  chefCount: number;
  businessCount: number;
  bookingCount: number;
  isLoading: boolean;
  error: string | null;
}

export default function useStats(): Stats {
  const [stats, setStats] = useState<Stats>({
    chefCount: 0,
    businessCount: 0, 
    bookingCount: 0,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        // Create promises for all three count queries
        const chefCountPromise = supabase
          .from('chef_profiles')
          .select('*', { count: 'exact', head: true });
        
        const businessCountPromise = supabase
          .from('business_profiles')
          .select('*', { count: 'exact', head: true });
        
        const bookingCountPromise = supabase
          .from('gig_applications')
          .select('*', { count: 'exact', head: true });
        
        // Execute all queries in parallel
        const [chefResult, businessResult, bookingResult] = await Promise.all([
          chefCountPromise,
          businessCountPromise,
          bookingCountPromise
        ]);

        // Check for errors
        if (chefResult.error) throw new Error(`Chef count error: ${chefResult.error.message}`);
        if (businessResult.error) throw new Error(`Business count error: ${businessResult.error.message}`);
        if (bookingResult.error) throw new Error(`Booking count error: ${bookingResult.error.message}`);

        // Update the stats
        setStats({
          chefCount: chefResult.count || 0,
          businessCount: businessResult.count || 0,
          bookingCount: bookingResult.count || 0,
          isLoading: false,
          error: null
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        setStats(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'An unknown error occurred'
        }));
      }
    }

    fetchStats();
  }, []);

  return stats;
}