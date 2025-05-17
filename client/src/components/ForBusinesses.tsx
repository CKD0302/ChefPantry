import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export default function ForBusinesses() {
  const benefits = [
    {
      title: "Access Vetted Talent",
      description: "Connect with pre-screened professional chefs for temporary or long-term engagements."
    },
    {
      title: "Simplified Staffing",
      description: "Quickly fill positions and manage scheduling through our streamlined platform."
    },
    {
      title: "Reduce Overhead",
      description: "Save on recruitment costs and adapt your staffing to meet changing demand."
    }
  ];
  
  return (
    <section id="for-businesses" className="py-16 bg-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-12 md:mb-0">
            <img 
              src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600" 
              alt="Modern restaurant interior" 
              className="rounded-xl shadow-xl w-full h-auto" 
            />
          </div>
          
          <div className="md:w-1/2 md:pl-12">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-6">For Hospitality Businesses</h2>
            <p className="text-lg text-neutral-800 mb-6">
              Find qualified culinary talent on demand to meet your specific needs and ensure exceptional dining experiences.
            </p>
            
            <div className="space-y-4 mb-8">
              {benefits.map((benefit, index) => (
                <div className="flex items-start" key={index}>
                  <div className="flex-shrink-0 mt-1">
                    <CheckCircle className="text-secondary h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-medium text-neutral-900">{benefit.title}</h4>
                    <p className="text-neutral-800">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <Button className="bg-secondary hover:bg-secondary-dark text-white font-medium px-6 py-3 h-auto shadow-lg">
              Register Your Business
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
