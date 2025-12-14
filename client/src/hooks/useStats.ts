import { useState, useEffect } from 'react';

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
        const response = await fetch('/api/stats');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch stats: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        setStats({
          chefCount: data.chefCount || 0,
          businessCount: data.businessCount || 0,
          bookingCount: data.bookingCount || 0,
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
