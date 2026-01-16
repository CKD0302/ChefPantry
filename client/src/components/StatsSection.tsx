import useStats from "@/hooks/useStats";
import { formatNumber } from "@/utils/formatNumber";
import { Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StatsSection() {
  const { chefCount, businessCount, bookingCount, isLoading, error, retry } = useStats();
  
  const stats = [
    { 
      count: isLoading ? null : formatNumber(chefCount), 
      label: "Professional Chefs" 
    },
    { 
      count: isLoading ? null : formatNumber(businessCount), 
      label: "Hospitality Partners" 
    },
    { 
      count: isLoading ? null : formatNumber(bookingCount), 
      label: "Successful Bookings" 
    }
  ];
  
  return (
    <section className="bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-neutral-400 text-xs tracking-widest uppercase mb-3">LIVE STATS</p>
        
        {error ? (
          <div className="text-center py-4">
            <div className="flex items-center justify-center gap-2 text-neutral-500 mb-2">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Stats temporarily unavailable</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={retry}
              className="text-primary hover:text-primary/80"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            {stats.map((stat, index) => (
              <div className="p-3" key={index}>
                {isLoading ? (
                  <div className="flex justify-center items-center h-8 mb-1">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <p className="text-4xl font-bold text-primary mb-1">{stat.count}</p>
                )}
                <p className="text-neutral-800 font-medium text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
