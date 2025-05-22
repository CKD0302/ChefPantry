import { Card, CardContent } from "@/components/ui/card";

export default function FeaturedDishes() {
  const dishes = [
    {
      image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600",
      title: "Fine Dining Excellence",
      description: "Exquisite presentation and innovative flavor combinations from our Michelin-trained chefs."
    },
    {
      image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600",
      title: "Culinary Creativity",
      description: "Unique culinary visions brought to life by passionate chefs for unforgettable dining experiences."
    },
    {
      image: "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=600",
      title: "Professional Expertise",
      description: "Technical mastery and consistent excellence from seasoned culinary professionals."
    }
  ];
  
  return (
    <section className="py-16 bg-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">Culinary Excellence</h2>
          <p className="text-lg text-neutral-800 max-w-3xl mx-auto">
            Our platform connects you with chefs who create exceptional culinary experiences.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {dishes.map((dish, index) => (
            <Card className="overflow-hidden rounded-xl shadow-md border-none" key={index}>
              <img 
                src={dish.image} 
                alt={dish.title} 
                className="w-full h-64 object-cover" 
              />
              <CardContent className="p-6 bg-white">
                <h3 className="font-medium text-lg text-neutral-900 mb-2">{dish.title}</h3>
                <p className="text-neutral-800">{dish.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
