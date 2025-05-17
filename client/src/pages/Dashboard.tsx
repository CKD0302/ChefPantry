import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { supabase } from "@/utils/supabaseClient";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [hasProfile, setHasProfile] = useState(false);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  
  // Check if the user's profile exists in the database
  useEffect(() => {
    if (!user) return;
    
    const checkProfile = async () => {
      setIsCheckingProfile(true);
      const userRole = user.user_metadata?.role || "user";
      
      try {
        // Different check based on user role
        if (userRole === "chef") {
          // Check if chef profile exists
          const { data, error } = await supabase
            .from("chef_profiles")
            .select("id")
            .eq("id", user.id)
            .single();
            
          console.log("Chef profile check:", { data, error });
          setHasProfile(!!data);
        } else if (userRole === "business") {
          // Check if business profile exists
          const { data, error } = await supabase
            .from("business_profiles")
            .select("id")
            .eq("id", user.id)
            .single();
            
          console.log("Business profile check:", { data, error, userId: user.id });
          
          // Always check localStorage for a profile, regardless of error
          const savedProfile = localStorage.getItem(`businessProfile_${user.id}`);
          if (savedProfile) {
            try {
              const profile = JSON.parse(savedProfile);
              console.log("Found business profile in localStorage:", profile);
              setHasProfile(true);
              return;
            } catch (e) {
              console.error("Error parsing localStorage profile:", e);
            }
          }
          
          setHasProfile(!!data);
        } else {
          // No profile to check for other roles
          setHasProfile(false);
        }
      } catch (error) {
        console.error("Error checking profile:", error);
        setHasProfile(false);
      } finally {
        setIsCheckingProfile(false);
      }
    };
    
    checkProfile();
  }, [user]);
  
  const handleSignOut = async () => {
    const { error } = await signOut();
    
    if (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign out. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Success",
      description: "You have been signed out successfully!",
    });
    
    // Redirect to home page
    navigate("/");
  };
  
  // Redirect if not authenticated
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-neutral-800 mb-6">Please sign in to access your dashboard.</p>
        <Button onClick={() => navigate("/auth/signin")}>
          Sign In
        </Button>
      </div>
    );
  }
  
  // Show loading state while checking profile
  if (isCheckingProfile) {
    return (
      <div className="min-h-screen bg-neutral-100 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8 mt-16">
          <div className="bg-white shadow-sm rounded-lg p-6 text-center">
            <h1 className="text-2xl font-bold mb-4">Loading Dashboard...</h1>
            <p className="text-neutral-600">Please wait while we load your information.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const userRole = user.user_metadata?.role || "user";
  
  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8 mt-16">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Welcome to Your Dashboard</h1>
              <p className="text-neutral-800">
                {userRole === "chef" 
                  ? "Manage your chef profile and bookings" 
                  : "Manage your business and chef bookings"}
              </p>
            </div>
            <Button variant="destructive" onClick={handleSignOut} className="mt-4 md:mt-0">
              Sign Out
            </Button>
          </div>
          
          <div className="border-t border-neutral-200 pt-6">
            <h2 className="text-xl font-semibold mb-4">Account Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-neutral-500">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-500">Account Type</p>
                <p className="font-medium capitalize">{userRole}</p>
              </div>
            </div>
          </div>
          
          {userRole === "chef" && !hasProfile ? (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Your Chef Profile</h2>
              <div className="bg-neutral-100 p-4 rounded">
                <p className="text-center">Complete your chef profile to start receiving booking requests.</p>
                <div className="flex justify-center mt-4">
                  <Button 
                    className="bg-primary hover:bg-primary-dark text-white"
                    onClick={() => navigate("/profile/create")}
                  >
                    Complete Your Profile
                  </Button>
                </div>
              </div>
            </div>
          ) : userRole === "chef" && hasProfile ? (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Your Chef Profile</h2>
              <div className="bg-white border border-neutral-200 rounded p-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                  <div>
                    <p className="text-green-600 font-medium mb-2">✓ Your profile is complete!</p>
                    <p className="text-neutral-600">You can now browse and apply for gigs.</p>
                  </div>
                  <div className="flex gap-3 mt-4 md:mt-0">
                    <Button 
                      variant="outline"
                      onClick={() => navigate("/gigs/browse")}
                    >
                      Browse Gigs
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : userRole === "business" && !hasProfile ? (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Your Business Profile</h2>
              <div className="bg-neutral-100 p-4 rounded">
                <p className="text-center">Complete your business profile to start finding chefs.</p>
                <div className="flex justify-center mt-4">
                  <Button 
                    className="bg-primary hover:bg-primary-dark text-white"
                    onClick={() => navigate("/profile/create")}
                  >
                    Complete Your Profile
                  </Button>
                </div>
              </div>
            </div>
          ) : userRole === "business" && hasProfile ? (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Your Business Profile</h2>
              <div className="bg-white border border-neutral-200 rounded p-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                  <div>
                    <p className="text-green-600 font-medium mb-2">✓ Your profile is complete!</p>
                    <p className="text-neutral-600">You can now post gigs to find chefs.</p>
                  </div>
                  <div className="flex gap-3 mt-4 md:mt-0">
                    <Button 
                      onClick={() => navigate("/gigs/create")}
                      className="bg-primary hover:bg-primary-dark text-white"
                    >
                      Post a Gig
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => navigate("/gigs/manage")}
                    >
                      Manage Gigs
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Create Your Profile</h2>
              <div className="bg-neutral-100 p-4 rounded">
                <p className="text-center">Choose what type of profile you want to create - Chef or Business.</p>
                <div className="flex justify-center gap-4 mt-4">
                  <Button 
                    className="bg-primary hover:bg-primary-dark text-white"
                    onClick={() => navigate("/profile/create")}
                  >
                    Create Profile
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Recent Bookings</h2>
            <div className="bg-neutral-100 p-6 rounded text-center">
              <p>You don't have any bookings yet.</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}