import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Calendar, Settings, ArrowLeft, MapPin, Globe, Instagram, Linkedin, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function BusinessDashboard() {
  const { id: businessId } = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();

  // Fetch business details
  const { data: business, isLoading: loadingBusiness, error: businessError } = useQuery({
    queryKey: ["business-profile", businessId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/profiles/business/${businessId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch business profile: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!businessId && !!user,
  });

  // Verify user has access to this business
  const { data: accessibleBusinesses, isLoading: loadingAccess } = useQuery({
    queryKey: ["accessible-businesses", user?.id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/company/accessible-businesses?userId=${user?.id}`);
      if (!response.ok) throw new Error("Failed to fetch accessible businesses");
      return response.json();
    },
    enabled: !!user?.id,
  });

  if (loadingBusiness || loadingAccess) {
    return (
      <div>
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 rounded mb-6 w-1/3"></div>
            <div className="grid lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-neutral-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Check if user has access to this business
  const hasAccess = accessibleBusinesses?.data?.some(
    (accessibleBusiness: any) => accessibleBusiness.businessId === businessId
  );

  if (!hasAccess) {
    return (
      <div>
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <Building2 className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-neutral-800 mb-2">Access Denied</h1>
            <p className="text-neutral-600 mb-6">
              You don't have permission to manage this business venue.
            </p>
            <Button onClick={() => navigate("/dashboard")} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (businessError || !business?.data) {
    return (
      <div>
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <Building2 className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-neutral-800 mb-2">Business Not Found</h1>
            <p className="text-neutral-600 mb-6">
              The business you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate("/dashboard")} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const businessData = business.data;

  return (
    <div>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            onClick={() => navigate("/dashboard")} 
            variant="ghost" 
            className="mb-4"
            data-testid="back-to-dashboard"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Company Dashboard
          </Button>
          
          <div className="flex items-start gap-6">
            {businessData.profile_image_url && (
              <img
                src={businessData.profile_image_url}
                alt={businessData.business_name}
                className="w-24 h-24 rounded-lg object-cover"
              />
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold tracking-tight mb-2" data-testid="business-name">
                {businessData.business_name || businessData.businessName}
              </h1>
              <div className="flex items-center gap-2 text-neutral-600 mb-3">
                <MapPin className="h-4 w-4" />
                <span>{businessData.location}</span>
              </div>
              <p className="text-neutral-700 mb-4">
                {businessData.description}
              </p>
              <div className="flex gap-2 flex-wrap">
                {businessData.venue_type && (
                  <Badge variant="secondary">{businessData.venue_type}</Badge>
                )}
                {businessData.business_size && (
                  <Badge variant="outline">{businessData.business_size}</Badge>
                )}
                {businessData.is_hiring && (
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                    Actively Hiring
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Business Details */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <Button 
                    variant="outline" 
                    className="flex flex-col items-center p-4 h-auto"
                    onClick={() => navigate("/gigs/create")}
                    data-testid="create-gig-button"
                  >
                    <Calendar className="h-6 w-6 mb-2 text-blue-600" />
                    <span className="text-sm">Post Gig</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex flex-col items-center p-4 h-auto"
                    onClick={() => navigate("/gigs/manage")}
                    data-testid="manage-gigs-button"
                  >
                    <Building2 className="h-6 w-6 mb-2 text-green-600" />
                    <span className="text-sm">Manage Gigs</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex flex-col items-center p-4 h-auto"
                    onClick={() => navigate(`/business/${businessId}/timesheets`)}
                    data-testid="view-timesheets-button"
                  >
                    <Clock className="h-6 w-6 mb-2 text-cyan-600" />
                    <span className="text-sm">Timesheets</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex flex-col items-center p-4 h-auto"
                    onClick={() => navigate("/business/invoices")}
                    data-testid="view-invoices-button"
                  >
                    <Users className="h-6 w-6 mb-2 text-purple-600" />
                    <span className="text-sm">Invoices</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex flex-col items-center p-4 h-auto"
                    onClick={() => navigate("/reviews")}
                    data-testid="view-reviews-button"
                  >
                    <Settings className="h-6 w-6 mb-2 text-orange-600" />
                    <span className="text-sm">Reviews</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Cuisine Specialties */}
            {businessData.cuisine_specialties && businessData.cuisine_specialties.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Cuisine Specialties</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 flex-wrap">
                    {businessData.cuisine_specialties.map((cuisine: string, index: number) => (
                      <Badge key={index} variant="secondary">
                        {cuisine}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Availability Notes */}
            {businessData.availability_notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Availability Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-neutral-700">{businessData.availability_notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {businessData.website_url && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-neutral-500" />
                    <a 
                      href={businessData.website_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Website
                    </a>
                  </div>
                )}
                {businessData.instagram_url && (
                  <div className="flex items-center gap-2">
                    <Instagram className="h-4 w-4 text-neutral-500" />
                    <a 
                      href={businessData.instagram_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Instagram
                    </a>
                  </div>
                )}
                {businessData.linkedin_url && (
                  <div className="flex items-center gap-2">
                    <Linkedin className="h-4 w-4 text-neutral-500" />
                    <a 
                      href={businessData.linkedin_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      LinkedIn
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Gallery */}
            {businessData.gallery_image_urls && businessData.gallery_image_urls.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Gallery</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {businessData.gallery_image_urls.slice(0, 4).map((imageUrl: string, index: number) => (
                      <img
                        key={index}
                        src={imageUrl}
                        alt={`${businessData.business_name} gallery ${index + 1}`}
                        className="w-full h-20 object-cover rounded"
                      />
                    ))}
                  </div>
                  {businessData.gallery_image_urls.length > 4 && (
                    <p className="text-sm text-neutral-500 mt-2">
                      +{businessData.gallery_image_urls.length - 4} more images
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}