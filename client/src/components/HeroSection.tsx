import { Button } from "@/components/ui/button";

export default function HeroSection() {
  return (
    <section className="pt-24 pb-16 md:pt-32 md:pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 md:pr-12">
            <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 leading-tight mb-6">
              Connecting <span className="text-primary">Talented Chefs</span> with{" "}
              <span className="text-secondary">Hospitality Businesses</span>
            </h1>
            <p className="text-lg md:text-xl text-neutral-800 mb-8">
              Chefy is a chef-first platform that makes it easy for freelance culinary talent to find meaningful work with top hospitality businesses.
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-8">
              <Button className="gradient-bg text-white font-medium px-6 py-3 h-auto shadow-lg hover:opacity-90 transition-opacity">
                I'm a Chef
              </Button>
              <Button className="bg-secondary hover:bg-secondary-dark text-white font-medium px-6 py-3 h-auto shadow-lg">
                I'm a Business
              </Button>
            </div>
          </div>
          <div className="md:w-1/2 mt-12 md:mt-0">
            <img 
              src="https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600" 
              alt="Professional chef plating a gourmet dish" 
              className="rounded-xl shadow-xl w-full h-auto"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
