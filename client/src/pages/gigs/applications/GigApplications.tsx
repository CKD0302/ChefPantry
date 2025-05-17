import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/utils/supabaseClient";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Briefcase, Clock, Hash, UserCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

// Interface for chef profile data
interface ChefProfile {
  id: string;
  full_name: string;
  bio: string;
  skills: string[];
  experience_years: number;
  location: string;
  profile_image_url: string | null;
}

// Interface for gig application data
interface GigApplication {
  id: string;
  gig_id: string;
  chef_id: string;
  status: string;
  message: string;
  applied_at: string;
  chef_profile?: ChefProfile;
}

// Interface for gig data
interface Gig {
  id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  created_by: string;
}

export default function GigApplications() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [applications, setApplications] = useState<GigApplication[]>([]);
  const [gig, setGig] = useState<Gig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const { toast } = useToast();

  // Get gig ID from URL params
  const location = window.location.pathname;
  const gigId = location.split("/").pop() || "";

  useEffect(() => {
    // Redirect if not authenticated
    if (!user) {
      navigate("/auth/signin");
      return;
    }

    // If no gig ID, redirect to manage page
    if (!gigId) {
      navigate("/gigs/manage");
      return;
    }

    fetchGigDetails();
  }, [user, gigId, navigate]);

  // Fetch gig details first to check authorization
  const fetchGigDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch gig directly from Supabase
      const { data: gigData, error: gigError } = await supabase
        .from("gigs")
        .select("*")
        .eq("id", gigId)
        .single();

      if (gigError) {
        console.error("Error fetching gig:", gigError);
        throw new Error("Gig not found");
      }

      setGig(gigData);

      // Check if the current user is the creator of the gig
      if (gigData.created_by === user?.id) {
        setIsAuthorized(true);
        fetchApplications();
      } else {
        setIsAuthorized(false);
        setLoading(false);
        setError("You are not authorized to view these applications");
      }
    } catch (error) {
      console.error("Error fetching gig details:", error);
      setError("Failed to load gig details");
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      // Fetch applications for this gig, joining with chef profiles
      const { data, error } = await supabase
        .from("gig_applications")
        .select(`
          *,
          chef_profile:chef_profiles!chef_id(
            id,
            full_name,
            bio,
            skills,
            experience_years,
            location,
            profile_image_url
          )
        `)
        .eq("gig_id", gigId)
        .order("applied_at", { ascending: false });

      if (error) {
        console.error("Error fetching applications:", error);
        throw new Error("Failed to fetch applications");
      }

      console.log("Applications fetched:", data);

      // Format the application data
      const formattedApplications = data.map((app) => ({
        id: app.id,
        gig_id: app.gig_id,
        chef_id: app.chef_id,
        status: app.status,
        message: app.message,
        applied_at: app.applied_at,
        chef_profile: app.chef_profile
      }));

      setApplications(formattedApplications);
    } catch (error) {
      console.error("Error:", error);
      setError("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId: string, newStatus: string) => {
    try {
      const { data, error } = await supabase
        .from("gig_applications")
        .update({ status: newStatus })
        .eq("id", applicationId)
        .select();

      if (error) {
        throw error;
      }

      // Update local state
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId ? { ...app, status: newStatus } : app
        )
      );

      toast({
        title: "Status Updated",
        description: `Application status updated to ${newStatus}`,
      });

    } catch (error) {
      console.error("Error updating application status:", error);
      toast({
        title: "Error",
        description: "Failed to update application status",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch(status) {
      case "applied":
      case "pending":
        return "outline";
      case "accepted":
        return "default";
      case "rejected":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "CH";
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const formatAppliedDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return "Unknown date";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-12 mt-16">
          <div className="max-w-6xl mx-auto">
            <Button 
              variant="ghost" 
              className="mb-6"
              onClick={() => navigate("/gigs/manage")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Manage Gigs
            </Button>
            <div className="text-center py-12">
              <h1 className="text-3xl font-bold mb-6">Loading Applications...</h1>
              <div className="animate-pulse flex justify-center">
                <div className="h-4 w-40 bg-neutral-300 rounded"></div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !isAuthorized) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-12 mt-16">
          <div className="max-w-6xl mx-auto">
            <Button 
              variant="ghost" 
              className="mb-6"
              onClick={() => navigate("/gigs/manage")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Manage Gigs
            </Button>
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-red-50 p-3 mb-4">
                  <Hash className="h-8 w-8 text-red-500" />
                </div>
                <h3 className="text-xl font-medium mb-2">Access Denied</h3>
                <p className="text-neutral-600 text-center max-w-md mb-6">
                  {error || "You don't have permission to view applications for this gig."}
                </p>
                <Button 
                  onClick={() => navigate("/gigs/manage")}
                  className="bg-primary hover:bg-primary-dark"
                >
                  Return to Manage Gigs
                </Button>
              </CardContent>
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
        <div className="max-w-6xl mx-auto">
          <Button 
            variant="ghost" 
            className="mb-6"
            onClick={() => navigate("/gigs/manage")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Manage Gigs
          </Button>
          
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Applications for "{gig?.title}"</h1>
            <p className="text-neutral-600 mt-1">
              Review and manage chef applications for this gig
            </p>
          </div>

          {applications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-blue-50 p-3 mb-4">
                  <Briefcase className="h-8 w-8 text-blue-500" />
                </div>
                <h3 className="text-xl font-medium mb-2">No Applications Yet</h3>
                <p className="text-neutral-600 text-center max-w-md mb-6">
                  This gig hasn't received any applications yet. Check back later or promote your gig to attract more chefs.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {applications.map((application) => (
                <Card key={application.id} className="overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <Avatar className="h-12 w-12 mr-4">
                          <AvatarImage 
                            src={application.chef_profile?.profile_image_url || ""} 
                            alt={application.chef_profile?.full_name || "Chef"}
                          />
                          <AvatarFallback>
                            {getInitials(application.chef_profile?.full_name || "")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-xl">
                            {application.chef_profile?.full_name || "Chef"}
                          </CardTitle>
                          <CardDescription>
                            {application.chef_profile?.location || "Location not specified"} • Applied {formatAppliedDate(application.applied_at)}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant={getStatusBadgeVariant(application.status)}>
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <Separator />
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-semibold text-sm text-neutral-500 mb-1">Cover Message</h3>
                        <p className="text-neutral-800">
                          {application.message || "No cover message provided."}
                        </p>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold text-sm text-neutral-500 mb-1">Experience</h3>
                          <p className="text-neutral-800 flex items-center">
                            <Clock className="h-4 w-4 mr-1 text-neutral-500" />
                            {application.chef_profile?.experience_years || 0} years
                          </p>
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm text-neutral-500 mb-1">Skills</h3>
                          <div className="flex flex-wrap gap-1">
                            {application.chef_profile?.skills && application.chef_profile.skills.length > 0 ? (
                              application.chef_profile.skills.map((skill, index) => (
                                <Badge key={index} variant="secondary" className="mr-1 mb-1">
                                  {skill}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-neutral-600">No skills listed</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-neutral-50 justify-between">
                    <Button 
                      variant="outline"
                      onClick={() => navigate(`/profile/chef/${application.chef_id}`)}
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      View Full Profile
                    </Button>
                    <Select
                      defaultValue={application.status}
                      onValueChange={(value) => updateApplicationStatus(application.id, value)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Update status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="accepted">Accept</SelectItem>
                        <SelectItem value="rejected">Reject</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}