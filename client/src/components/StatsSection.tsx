export default function StatsSection() {
  const stats = [
    { count: "500+", label: "Professional Chefs" },
    { count: "350+", label: "Hospitality Partners" },
    { count: "5,000+", label: "Successful Bookings" }
  ];
  
  return (
    <section className="bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {stats.map((stat, index) => (
            <div className="p-6" key={index}>
              <p className="text-4xl font-bold text-primary mb-2">{stat.count}</p>
              <p className="text-neutral-800 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
