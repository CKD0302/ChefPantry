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
        
        // Count confirmed gig applications (accepted or confirmed status)
        const confirmedBookingsPromise = supabase
          .from('gig_applications')
          .select('*', { count: 'exact', head: true })
          .in('status', ['accepted', 'confirmed']);
        
        // Count paid invoices
        const paidInvoicesPromise = supabase
          .from('gig_invoices')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'paid');
        
        // Execute all queries in parallel
        const [chefResult, businessResult, bookingResult, invoiceResult] = await Promise.all([
          chefCountPromise,
          businessCountPromise,
          confirmedBookingsPromise,
          paidInvoicesPromise
        ]);

        // Check for errors
        if (chefResult.error) throw new Error(`Chef count error: ${chefResult.error.message}`);
        if (businessResult.error) throw new Error(`Business count error: ${businessResult.error.message}`);
        if (bookingResult.error) throw new Error(`Booking count error: ${bookingResult.error.message}`);
        if (invoiceResult.error) throw new Error(`Invoice count error: ${invoiceResult.error.message}`);

        // Combine confirmed bookings + paid invoices for "Successful Bookings"
        const successfulCount = (bookingResult.count || 0) + (invoiceResult.count || 0);

        // Log results for debugging
        console.log('Stats query results:', {
          chefs: chefResult.count,
          businesses: businessResult.count,
          confirmedBookings: bookingResult.count,
          paidInvoices: invoiceResult.count,
          successfulTotal: successfulCount
        });

        // Update the stats
        setStats({
          chefCount: chefResult.count || 0,
          businessCount: businessResult.count || 0,
          bookingCount: successfulCount,
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