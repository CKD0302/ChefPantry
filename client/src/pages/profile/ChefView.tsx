import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Star,
  ChefHat,
  Award,
  Clock,
  PoundSterling,
  ArrowLeft
} from "lucide-react";
import { format } from "date-fns";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ChefView() {
  const [match, params] = useRoute("/profiles/chef/:id");
  const chefId = params?.id;

  const { data: chefProfile, isLoading, error } = useQuery({
    queryKey: ['/api/profiles/chef', chefId],
    enabled: !!chefId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !chefProfile?.data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-6 text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Chef Profile Not Found</h2>
                <p className="text-gray-600 mb-4">
                  The chef profile you're looking for doesn't exist or has been removed.
                </p>
                <Button 
                  onClick={() => window.history.back()}
                  variant="outline"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const chef = chefProfile.data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Button 
              onClick={() => window.history.back()}
              variant="ghost" 
              size="sm"
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Applications
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Chef Profile</h1>
            <p className="text-gray-600">Professional culinary profile</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Profile Card */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="bg-orange-100 p-3 rounded-full">
                      <ChefHat className="h-8 w-8 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-2xl text-gray-900">
                        {chef.first_name} {chef.last_name}
                      </CardTitle>
                      <p className="text-gray-600 mt-1">{chef.specialty || "Professional Chef"}</p>
                      {chef.years_experience && (
                        <div className="flex items-center mt-2 text-sm text-gray-500">
                          <Award className="h-4 w-4 mr-1" />
                          {chef.years_experience} years of experience
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {chef.bio && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-900 mb-2">About</h3>
                      <p className="text-gray-700 leading-relaxed">{chef.bio}</p>
                    </div>
                  )}

                  {chef.specialties && chef.specialties.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-900 mb-3">Specialties</h3>
                      <div className="flex flex-wrap gap-2">
                        {chef.specialties.map((specialty, index) => (
                          <Badge key={index} variant="secondary" className="bg-orange-100 text-orange-800">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {chef.dietary_accommodations && chef.dietary_accommodations.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-semibold text-gray-900 mb-3">Dietary Accommodations</h3>
                      <div className="flex flex-wrap gap-2">
                        {chef.dietary_accommodations.map((accommodation, index) => (
                          <Badge key={index} variant="outline" className="border-green-200 text-green-700">
                            {accommodation}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Contact & Details Sidebar */}
            <div className="space-y-6">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-700">{chef.email}</span>
                  </div>
                  {chef.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-700">{chef.phone}</span>
                    </div>
                  )}
                  {chef.location && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-700">{chef.location}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Professional Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Professional Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {chef.hourly_rate && (
                    <div className="flex items-center gap-3">
                      <PoundSterling className="h-5 w-5 text-blue-600" />
                      <span className="text-gray-700">£{chef.hourly_rate}/hour</span>
                    </div>
                  )}
                  {chef.availability && chef.availability.length > 0 && (
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <Clock className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-700 font-medium">Availability</span>
                      </div>
                      <div className="ml-8 space-y-1">
                        {chef.availability.map((day, index) => (
                          <div key={index} className="text-sm text-gray-600">
                            {day}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-700 text-sm">
                      Joined {format(new Date(chef.created_at), "MMMM yyyy")}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Portfolio Images */}
              {chef.portfolio_images && chef.portfolio_images.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Portfolio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      {chef.portfolio_images.slice(0, 4).map((image, index) => (
                        <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                          <img 
                            src={image} 
                            alt={`Portfolio ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                    {chef.portfolio_images.length > 4 && (
                      <p className="text-sm text-gray-500 mt-2 text-center">
                        +{chef.portfolio_images.length - 4} more images
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}