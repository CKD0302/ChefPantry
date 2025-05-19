import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/utils/supabaseClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Globe,
  Instagram,
  Linkedin,
  MapPin,
  PenSquare,
  Route,
  ShieldAlert,
  Star,
  User,
  Utensils,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Business profile interface
interface BusinessProfile {
  id: string;
  business_name: string;
  description: string;
  location: string;
  profile_image_url?: string;
  website_url?: string;
  instagram_url?: string;
  linkedin_url?: string;
  created_at: string;
}

// Chef profile interface
interface ChefProfile {
  id: string;
  full_name: string;
  bio: string;
  skills: string[];
  experience_years: number;
  location: string;
  travel_radius_km?: number;
  profile_image_url?: string;
  dish_photos_urls?: string[];
  intro_video_url?: string;
  instagram_url?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  created_at: string;
}

export default function ViewProfile() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [chefProfile, setChefProfile] = useState<ChefProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    // Redirect if not authenticated
    if (!user) {
      navigate("/auth/signin");
      return;
    }

    // Check user role
    const role = user.user_metadata?.role || "";
    setUserRole(role);
    
    if (role === "business") {
      fetchBusinessProfile();
    } else if (role === "chef") {
      fetchChefProfile();
    } else {
      navigate("/dashboard");
      toast({
        title: "Profile Required",
        description: "Please create a profile first.",
        variant: "destructive",
      });
    }
  }, [user, navigate, toast]);

  const fetchBusinessProfile = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("Fetching business profile for user ID:", user?.id);
      const { data, error } = await supabase
        .from("business_profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      console.log("Supabase response:", { data, error });

      if (error) {
        throw error;
      }

      setBusinessProfile(data);
    } catch (error: any) {
      console.error("Error fetching business profile:", error);
      if (error.code === "PGRST116") {
        // No profile found, this is a special case
        setError("profile_not_found");
      } else {
        setError("An error occurred while fetching your profile. Please try again later.");
        toast({
          title: "Error",
          description: "Failed to load your business profile",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };
  
  const fetchChefProfile = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("Chef profile check:", { userId: user?.id });
      const { data, error } = await supabase
        .from("chef_profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      console.log("Chef profile data:", { data, error });

      if (error) {
        throw error;
      }

      setChefProfile(data);
    } catch (error: any) {
      console.error("Error fetching chef profile:", error);
      if (error.code === "PGRST116") {
        // No profile found, this is a special case
        setError("profile_not_found");
      } else {
        setError("An error occurred while fetching your profile. Please try again later.");
        toast({
          title: "Error",
          description: "Failed to load your chef profile",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-12 mt-16">
          <div className="max-w-3xl mx-auto">
            <Card className="w-full">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-pulse space-y-4 w-full">
                    <div className="h-8 bg-neutral-200 rounded w-1/3 mx-auto"></div>
                    <div className="h-32 bg-neutral-200 rounded"></div>
                    <div className="h-4 bg-neutral-200 rounded w-2/3 mx-auto"></div>
                    <div className="h-4 bg-neutral-200 rounded w-1/2 mx-auto"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Render profile not found state
  if (error === "profile_not_found") {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-12 mt-16">
          <div className="max-w-3xl mx-auto">
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto bg-orange-100 p-3 rounded-full">
                  <User className="h-8 w-8 text-orange-500" />
                </div>
                <CardTitle className="text-2xl mt-4">Profile Not Found</CardTitle>
                <CardDescription>
                  {userRole === "chef" 
                    ? "You haven't created a chef profile yet." 
                    : "You haven't created a business profile yet."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-600 mb-6">
                  {userRole === "chef" 
                    ? "Create your chef profile to showcase your skills and experience to potential clients."
                    : "Create your business profile to start finding talented chefs for your establishment."}
                </p>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Button
                  onClick={() => navigate("/profile/create")}
                  className="bg-primary hover:bg-primary-dark"
                >
                  Create Your Profile
                </Button>
              </CardFooter>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-12 mt-16">
          <div className="max-w-3xl mx-auto">
            <Card className="text-center border-red-100">
              <CardHeader>
                <div className="mx-auto bg-red-100 p-3 rounded-full">
                  <ShieldAlert className="h-8 w-8 text-red-500" />
                </div>
                <CardTitle className="text-2xl mt-4">Something Went Wrong</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-600 mb-6">{error}</p>
              </CardContent>
              <CardFooter className="flex justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => navigate("/dashboard")}
                >
                  Return to Dashboard
                </Button>
                <Button
                  onClick={fetchBusinessProfile}
                  className="bg-primary hover:bg-primary-dark"
                >
                  Try Again
                </Button>
              </CardFooter>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Render the profile content
  const renderBusinessProfile = () => {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-12 mt-16">
          <div className="max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">Business Profile</h1>
              <Button
                onClick={() => navigate("/profile/edit")}
                variant="outline"
                className="gap-2"
              >
                <PenSquare className="h-4 w-4" /> Edit Profile
              </Button>
            </div>

            <Card>
              <CardHeader className="pb-3">
                {businessProfile?.profile_image_url ? (
                  <div className="w-24 h-24 mx-auto mb-4 overflow-hidden rounded-full bg-neutral-100">
                    <img
                      src={businessProfile.profile_image_url}
                      alt={businessProfile.business_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center rounded-full bg-neutral-100">
                    <User className="h-12 w-12 text-neutral-400" />
                  </div>
                )}
                <CardTitle className="text-2xl text-center">
                  {businessProfile?.business_name}
                </CardTitle>
                <div className="flex items-center justify-center mt-2 text-neutral-600">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{businessProfile?.location}</span>
                </div>
              </CardHeader>

              <Separator />

              <CardContent className="pt-6">
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">About</h3>
                  <p className="text-neutral-700 whitespace-pre-line">
                    {businessProfile?.description}
                  </p>
                </div>

                {(businessProfile?.website_url || businessProfile?.instagram_url || businessProfile?.linkedin_url) && (
                  <>
                    <h3 className="text-lg font-medium mb-3">Links</h3>
                    <div className="flex flex-wrap gap-3">
                      {businessProfile?.website_url && (
                        <a
                          href={businessProfile.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition-colors"
                        >
                          <Globe className="h-4 w-4" />
                          Website
                        </a>
                      )}
                      {businessProfile?.instagram_url && (
                        <a
                          href={businessProfile.instagram_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-50 hover:bg-pink-100 text-pink-600 transition-colors"
                        >
                          <Instagram className="h-4 w-4" />
                          Instagram
                        </a>
                      )}
                      {businessProfile?.linkedin_url && (
                        <a
                          href={businessProfile.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
                        >
                          <Linkedin className="h-4 w-4" />
                          LinkedIn
                        </a>
                      )}
                    </div>
                  </>
                )}
              </CardContent>

              <CardFooter className="pt-2 pb-6 flex flex-col items-start">
                <div className="w-full flex justify-between items-center">
                  <p className="text-sm text-neutral-500">
                    Profile created: {new Date(businessProfile?.created_at || "").toLocaleDateString()}
                  </p>
                  <Button
                    onClick={() => navigate("/dashboard")}
                    variant="ghost"
                    size="sm"
                  >
                    Return to Dashboard
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  };

  // Render the chef profile
  const renderChefProfile = () => {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-12 mt-16">
          <div className="max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">Chef Profile</h1>
              <Button
                onClick={() => navigate("/profile/edit")}
                variant="outline"
                className="gap-2"
              >
                <PenSquare className="h-4 w-4" /> Edit Profile
              </Button>
            </div>

            <Card>
              <CardHeader className="pb-3">
                {chefProfile?.profile_image_url ? (
                  <div className="w-48 h-48 mx-auto mb-4 overflow-hidden rounded-full bg-neutral-100 shadow-md">
                    <img
                      src={chefProfile.profile_image_url}
                      alt={chefProfile.full_name}
                      className="w-full h-full object-cover rounded-full"
                      style={{ imageRendering: 'auto' }}
                    />
                  </div>
                ) : (
                  <div className="w-48 h-48 mx-auto mb-4 flex items-center justify-center rounded-full bg-neutral-100 shadow-md">
                    <User className="h-12 w-12 text-neutral-400" />
                  </div>
                )}
                <CardTitle className="text-2xl text-center">
                  {chefProfile?.full_name}
                </CardTitle>
                <div className="flex items-center justify-center mt-2 text-neutral-600">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{chefProfile?.location}</span>
                </div>
                
                {/* Skills badges */}
                <div className="flex flex-wrap justify-center gap-2 mt-3">
                  {chefProfile?.skills && chefProfile.skills.map((skill, index) => (
                    <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 rounded-full">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardHeader>

              <Separator />

              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Experience</h3>
                    <div className="flex items-center text-neutral-700">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>{chefProfile?.experience_years} years</span>
                    </div>
                  </div>
                  
                  {chefProfile?.travel_radius_km && (
                    <div>
                      <h3 className="text-lg font-medium mb-2">Travel Range</h3>
                      <div className="flex items-center text-neutral-700">
                        <Route className="h-4 w-4 mr-2" />
                        <span>Up to {chefProfile.travel_radius_km} km</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">About</h3>
                  <p className="text-neutral-700 whitespace-pre-line">
                    {chefProfile?.bio}
                  </p>
                </div>

                {/* Social media and portfolio links */}
                {(chefProfile?.portfolio_url || chefProfile?.instagram_url || chefProfile?.linkedin_url) && (
                  <>
                    <h3 className="text-lg font-medium mb-3">Links</h3>
                    <div className="flex flex-wrap gap-3">
                      {chefProfile?.portfolio_url && (
                        <a
                          href={chefProfile.portfolio_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition-colors"
                        >
                          <Globe className="h-4 w-4" />
                          Portfolio
                        </a>
                      )}
                      {chefProfile?.instagram_url && (
                        <a
                          href={chefProfile.instagram_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-50 hover:bg-pink-100 text-pink-600 transition-colors"
                        >
                          <Instagram className="h-4 w-4" />
                          Instagram
                        </a>
                      )}
                      {chefProfile?.linkedin_url && (
                        <a
                          href={chefProfile.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
                        >
                          <Linkedin className="h-4 w-4" />
                          LinkedIn
                        </a>
                      )}
                    </div>
                  </>
                )}
              </CardContent>

              <CardFooter className="pt-2 pb-6 flex flex-col items-start">
                <div className="w-full flex justify-between items-center">
                  <p className="text-sm text-neutral-500">
                    Profile created: {new Date(chefProfile?.created_at || "").toLocaleDateString()}
                  </p>
                  <Button
                    onClick={() => navigate("/dashboard")}
                    variant="ghost"
                    size="sm"
                  >
                    Return to Dashboard
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  };

  // Determine which profile to render based on user role
  return userRole === "chef" ? renderChefProfile() : renderBusinessProfile();
}