import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star } from "lucide-react";

export default function Testimonials() {
  const testimonials = [
    {
      text: "Chefy has transformed how I find work in the culinary industry. I'm able to connect with amazing restaurants and events that truly value my skills. The platform is intuitive and the staff is incredibly supportive.",
      author: "Marcus Johnson",
      role: "Executive Chef, San Francisco",
      initials: "MJ"
    },
    {
      text: "As a boutique hotel, we often need specialized culinary talent for special events. Chefy makes it easy to find the perfect chef for any occasion. The quality of talent on the platform is exceptional.",
      author: "Sarah Thompson",
      role: "Events Director, Lakeview Hotel",
      initials: "ST"
    }
  ];
  
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">What People Are Saying</h2>
          <p className="text-lg text-neutral-800 max-w-3xl mx-auto">
            Hear from the chefs and businesses who've found success with our platform.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card className="bg-neutral-100 border-none shadow-sm" key={index}>
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  <div className="text-primary flex">
                    {[...Array(5)].map((_, i) => (
                      <Star className="fill-current h-5 w-5" key={i} />
                    ))}
                  </div>
                </div>
                <p className="text-neutral-800 mb-6 italic">
                  "{testimonial.text}"
                </p>
                <div className="flex items-center">
                  <Avatar className="h-12 w-12 mr-4 bg-neutral-300">
                    <AvatarFallback className="text-sm font-medium">
                      {testimonial.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium text-neutral-900">{testimonial.author}</h4>
                    <p className="text-sm text-neutral-800">{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
