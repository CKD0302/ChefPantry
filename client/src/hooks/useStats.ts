import { useState, useEffect, useCallback } from 'react';

interface Stats {
  chefCount: number;
  businessCount: number;
  bookingCount: number;
  isLoading: boolean;
  error: string | null;
  retry: () => void;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

export default function useStats(): Stats {
  const [stats, setStats] = useState<Omit<Stats, 'retry'>>({
    chefCount: 0,
    businessCount: 0, 
    bookingCount: 0,
    isLoading: true,
    error: null
  });
  const [retryCount, setRetryCount] = useState(0);

  const fetchStats = useCallback(async (attempt: number = 0) => {
    setStats(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await fetch('/api/stats');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      setStats({
        chefCount: Number(data.chefCount) || 0,
        businessCount: Number(data.businessCount) || 0,
        bookingCount: Number(data.bookingCount) || 0,
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      
      if (attempt < MAX_RETRIES) {
        setTimeout(() => {
          fetchStats(attempt + 1);
        }, RETRY_DELAY * (attempt + 1));
      } else {
        setStats(prev => ({
          ...prev,
          isLoading: false,
          error: 'Unable to load stats. Please refresh the page.'
        }));
      }
    }
  }, []);

  const retry = useCallback(() => {
    setRetryCount(prev => prev + 1);
  }, []);

  useEffect(() => {
    fetchStats(0);
  }, [fetchStats, retryCount]);

  return { ...stats, retry };
}
