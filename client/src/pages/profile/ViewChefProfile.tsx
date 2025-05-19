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
  ArrowLeft,
  Calendar,
  Globe,
  Instagram,
  Linkedin,
  MapPin,
  Route,
  ShieldAlert,
  Star,
  User,
  Utensils,
  Image,
  Briefcase,
  Clock,
  Languages,
  Award,
  Check,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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
  languages?: string[];
  certifications?: string[];
  is_available?: boolean;
  created_at: string;
}

export default function ViewChefProfile() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [chefProfile, setChefProfile] = useState<ChefProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  // Extract chef ID from URL
  const location = window.location.pathname;
  const chefId = location.split("/").pop() || "";
  
  useEffect(() => {
    // Redirect if not authenticated
    if (!user) {
      navigate("/auth/signin");
      return;
    }
    
    if (!chefId) {
      setError("No chef ID provided");
      setLoading(false);
      return;
    }
    
    // Check authorization and fetch chef profile
    checkAuthorizationAndFetchProfile();
  }, [user, chefId, navigate]);
  
  // Check if business is authorized to view this chef profile
  // by confirming they own a gig that this chef has applied to
  const checkAuthorizationAndFetchProfile = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!user) return;
      
      // First check if any applications exist for gigs created by this business
      // and applied to by this chef
      const { data: applications, error: applicationsError } = await supabase
        .from("gig_applications")
        .select("*, gigs!inner(*)")
        .eq("chef_id", chefId)
        .eq("gigs.created_by", user.id);
      
      if (applicationsError) {
        console.error("Error checking authorization:", applicationsError);
        throw new Error("Failed to verify access permissions");
      }
      
      // If there are matching applications, the business is authorized
      if (applications && applications.length > 0) {
        setIsAuthorized(true);
        await fetchChefProfile();
      } else {
        console.log("Not authorized to view this chef profile");
        setIsAuthorized(false);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error in authorization check:", error);
      setError("Failed to verify access permissions");
      setLoading(false);
    }
  };
  
  const fetchChefProfile = async () => {
    try {
      // Fetch chef profile using the chef ID from URL
      const { data, error } = await supabase
        .from("chef_profiles")
        .select("*")
        .eq("id", chefId)
        .single();
      
      if (error) {
        console.error("Error fetching chef profile:", error);
        throw new Error("Chef profile not found");
      }
      
      console.log("Chef profile data:", data);
      setChefProfile(data);
    } catch (error) {
      console.error("Error fetching chef profile:", error);
      setError("Failed to load chef profile");
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
            <Button 
              variant="ghost" 
              className="mb-6"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
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
  
  // Render unauthorized state
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-12 mt-16">
          <div className="max-w-3xl mx-auto">
            <Button 
              variant="ghost" 
              className="mb-6"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto bg-red-100 p-3 rounded-full">
                  <ShieldAlert className="h-8 w-8 text-red-500" />
                </div>
                <CardTitle className="text-2xl mt-4">Access Denied</CardTitle>
                <CardDescription>
                  You don't have permission to view this chef's profile
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-600 mb-6">
                  You can only view profiles of chefs who have applied to gigs you've created.
                </p>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Button
                  onClick={() => navigate("/gigs/manage")}
                  className="bg-primary hover:bg-primary-dark"
                >
                  Return to Manage Gigs
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
            <Button 
              variant="ghost" 
              className="mb-6"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
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
                  onClick={() => navigate("/gigs/manage")}
                >
                  Return to Manage Gigs
                </Button>
                <Button
                  onClick={checkAuthorizationAndFetchProfile}
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
  
  // Render the chef profile
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12 mt-16">
        <div className="max-w-3xl mx-auto">
          <Button 
            variant="ghost" 
            className="mb-6"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Chef Profile</h1>
          </div>

          <Card>
            <CardHeader className="pb-3">
              {chefProfile?.profile_image_url ? (
                <div className="mx-auto mb-4 relative" style={{ width: '192px', height: '192px' }}>
                  {/* Optimized high-quality image rendering */}
                  <img
                    src={chefProfile.profile_image_url}
                    alt={chefProfile.full_name}
                    className="absolute inset-0 rounded-full shadow-md"
                    loading="eager"
                    decoding="async"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: 'center',
                      imageRendering: 'auto',
                      backfaceVisibility: 'hidden', /* Prevents artifacts in some browsers */
                    }}
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
              
              {/* Availability badge */}
              {chefProfile?.is_available !== undefined && (
                <div className="flex justify-center mt-2">
                  <Badge variant={chefProfile.is_available ? "default" : "outline"} className="gap-1">
                    {chefProfile.is_available ? (
                      <>
                        <Check className="h-3 w-3" /> Available for Work
                      </>
                    ) : (
                      "Currently Unavailable"
                    )}
                  </Badge>
                </div>
              )}
              
              {/* Skills badges */}
              <div className="flex flex-wrap justify-center gap-2 mt-3">
                {chefProfile?.skills && chefProfile.skills.map((skill, index) => (
                  <Badge key={index} variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardHeader>

            <Separator />

            <CardContent className="pt-6">
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">About</h3>
                <p className="text-neutral-700 whitespace-pre-line">
                  {chefProfile?.bio}
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Experience</h3>
                  <div className="flex items-center gap-2 text-neutral-700 mb-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <span>{chefProfile?.experience_years} years of culinary experience</span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-700">
                    <Route className="h-5 w-5 text-primary" />
                    <span>Willing to travel up to {chefProfile?.travel_radius_km || 0} km</span>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-3">Languages & Certifications</h3>
                  {chefProfile?.languages && chefProfile.languages.length > 0 && (
                    <div className="flex items-start gap-2 text-neutral-700 mb-2">
                      <Languages className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <span className="font-medium">Languages:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {chefProfile.languages.map((language, index) => (
                            <Badge key={index} variant="outline" className="bg-neutral-50">
                              {language}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {chefProfile?.certifications && chefProfile.certifications.length > 0 && (
                    <div className="flex items-start gap-2 text-neutral-700">
                      <Award className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                      <div>
                        <span className="font-medium">Certifications:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {chefProfile.certifications.map((cert, index) => (
                            <Badge key={index} variant="outline" className="bg-neutral-50">
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Dish Photos */}
              {chefProfile?.dish_photos_urls && chefProfile.dish_photos_urls.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-3">Signature Dishes</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {chefProfile.dish_photos_urls.map((url, index) => (
                      <div key={index} className="overflow-hidden rounded-md bg-neutral-100 aspect-square relative">
                        <img
                          src={url}
                          alt={`Dish ${index + 1}`}
                          className="absolute inset-0 w-full h-full object-cover"
                          loading={index < 3 ? "eager" : "lazy"}
                          decoding="async"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(chefProfile?.instagram_url || chefProfile?.linkedin_url || chefProfile?.portfolio_url) && (
                <>
                  <h3 className="text-lg font-medium mb-3 mt-6">Links</h3>
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
                  onClick={() => window.history.back()}
                  variant="outline"
                  size="sm"
                >
                  Back to Applications
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}