import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export default function ForChefs() {
  const benefits = [
    {
      title: "Showcase Your Expertise",
      description: "Build a professional profile highlighting your unique culinary talents and experience."
    },
    {
      title: "Flexible Scheduling",
      description: "Choose assignments that fit your lifestyle and availability."
    },
    {
      title: "Competitive Rates",
      description: "Set your own pricing and receive secure, timely payments."
    }
  ];
  
  return (
    <section id="for-chefs" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 md:pr-12 order-2 md:order-1">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-6">For Talented Chefs</h2>
            <p className="text-lg text-neutral-800 mb-6">
              Take control of your culinary career with flexible opportunities that match your skills and schedule.
            </p>
            
            <div className="space-y-4 mb-8">
              {benefits.map((benefit, index) => (
                <div className="flex items-start" key={index}>
                  <div className="flex-shrink-0 mt-1">
                    <CheckCircle className="text-primary h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-medium text-neutral-900">{benefit.title}</h4>
                    <p className="text-neutral-800">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <Button className="gradient-bg text-white font-medium px-6 py-3 h-auto shadow-lg hover:opacity-90 transition-opacity">
              Join as a Chef
            </Button>
          </div>
          
          <div className="md:w-1/2 mb-12 md:mb-0 order-1 md:order-2">
            <img 
              src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600" 
              alt="Chef preparing ingredients in a commercial kitchen" 
              className="rounded-xl shadow-xl w-full h-auto" 
            />
          </div>
        </div>
      </div>
    </section>
  );
}
