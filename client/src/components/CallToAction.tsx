import { Button } from "@/components/ui/button";

export default function CallToAction() {
  return (
    <section className="py-20 bg-primary">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
          Ready to Transform Your Culinary Career?
        </h2>
        <p className="text-xl text-white opacity-90 mb-8 max-w-3xl mx-auto">
          Join Chef Pantry today and be part of a community that values culinary talent and creates exceptional dining experiences.
        </p>
        <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
          <Button 
            variant="secondary" 
            className="bg-white text-primary font-medium px-8 py-3 h-auto shadow-lg hover:bg-neutral-100 transition-colors"
          >
            Join as a Chef
          </Button>
          <Button 
            className="bg-secondary hover:bg-secondary-dark text-white font-medium px-8 py-3 h-auto shadow-lg"
          >
            Register Your Business
          </Button>
        </div>
      </div>
    </section>
  );
}
