export default function HowItWorks() {
  const steps = [
    {
      step: 1,
      title: "Create Your Profile",
      description: "Chefs showcase their skills, experience, and specialties. Businesses detail their venues and staffing needs."
    },
    {
      step: 2,
      title: "Match & Connect",
      description: "Our algorithm matches chefs with businesses based on skills, availability, location, and specific requirements."
    },
    {
      step: 3,
      title: "Book & Collaborate",
      description: "Handle bookings, payments, and scheduling all in one platform, with transparent fees and secure transactions."
    }
  ];
  
  return (
    <section id="how-it-works" className="py-16 bg-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">How Chef Pantry Works</h2>
          <p className="text-lg text-neutral-800 max-w-3xl mx-auto">
            Our platform makes it simple to connect culinary talent with businesses that need them, creating perfect matches for both parties.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div className="bg-white p-8 rounded-xl shadow-md" key={step.step}>
              <div className="w-12 h-12 gradient-bg rounded-full flex items-center justify-center text-white font-bold mb-6">
                {step.step}
              </div>
              <h3 className="text-xl font-bold text-neutral-900 mb-3">{step.title}</h3>
              <p className="text-neutral-800">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
