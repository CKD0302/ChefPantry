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
  Globe,
  Instagram,
  Linkedin,
  MapPin,
  PenSquare,
  ShieldAlert,
  User,
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

export default function ViewProfile() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Redirect if not authenticated
    if (!user) {
      navigate("/auth/signin");
      return;
    }

    // Check user role
    const userRole = user.user_metadata?.role;
    if (userRole !== "business") {
      navigate("/dashboard");
      toast({
        title: "Access Restricted",
        description: "This page is only available for business accounts.",
        variant: "destructive",
      });
      return;
    }

    fetchBusinessProfile();
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

      setProfile(data);
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
                  You haven't created a business profile yet.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-600 mb-6">
                  Create your business profile to start finding talented chefs for your
                  establishment.
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
              {profile?.profile_image_url ? (
                <div className="w-24 h-24 mx-auto mb-4 overflow-hidden rounded-full bg-neutral-100">
                  <img
                    src={profile.profile_image_url}
                    alt={profile.business_name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 mx-auto mb-4 flex items-center justify-center rounded-full bg-neutral-100">
                  <User className="h-12 w-12 text-neutral-400" />
                </div>
              )}
              <CardTitle className="text-2xl text-center">
                {profile?.business_name}
              </CardTitle>
              <div className="flex items-center justify-center mt-2 text-neutral-600">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{profile?.location}</span>
              </div>
            </CardHeader>

            <Separator />

            <CardContent className="pt-6">
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">About</h3>
                <p className="text-neutral-700 whitespace-pre-line">
                  {profile?.description}
                </p>
              </div>

              {(profile?.website_url || profile?.instagram_url || profile?.linkedin_url) && (
                <>
                  <h3 className="text-lg font-medium mb-3">Links</h3>
                  <div className="flex flex-wrap gap-3">
                    {profile?.website_url && (
                      <a
                        href={profile.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition-colors"
                      >
                        <Globe className="h-4 w-4" />
                        Website
                      </a>
                    )}
                    {profile?.instagram_url && (
                      <a
                        href={profile.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pink-50 hover:bg-pink-100 text-pink-600 transition-colors"
                      >
                        <Instagram className="h-4 w-4" />
                        Instagram
                      </a>
                    )}
                    {profile?.linkedin_url && (
                      <a
                        href={profile.linkedin_url}
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
                  Profile created: {new Date(profile?.created_at || "").toLocaleDateString()}
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
}