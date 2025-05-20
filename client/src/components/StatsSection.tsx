import useStats from "@/hooks/useStats";
import { formatNumber } from "@/utils/formatNumber";
import { Loader2 } from "lucide-react";

export default function StatsSection() {
  const { chefCount, businessCount, bookingCount, isLoading, error } = useStats();
  
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
  
  // Fallback if there's an error
  if (error) {
    console.error('Error loading stats:', error);
  }
  
  return (
    <section className="bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-neutral-400 text-xs tracking-widest uppercase mb-6">LIVE STATS</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {stats.map((stat, index) => (
            <div className="p-6" key={index}>
              {isLoading ? (
                <div className="flex justify-center items-center h-10 mb-2">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <p className="text-4xl font-bold text-primary mb-2">{stat.count}</p>
              )}
              <p className="text-neutral-800 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
