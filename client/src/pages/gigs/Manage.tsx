import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/utils/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  CalendarCheck, 
  Clock, 
  MapPin, 
  User, 
  Mail, 
  CheckCircle, 
  XCircle,
  Eye
} from "lucide-react";
import { format } from "date-fns";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface Gig {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  location: string;
  pay_rate: number;
  role: string;
  venue_type: string;
  is_active: boolean;
}

interface Application {
  id: string;
  gig_id: string;
  chef_id: string;
  status: string;
  message: string;
  applied_at: string;
  chef_profile?: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    bio: string;
  };
}

interface GigWithApplications {
  gig: Gig;
  applications: Application[];
}

export default function ManageGigs() {
  const { user } = useAuth();
  const [gigsWithApplications, setGigsWithApplications] = useState<GigWithApplications[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      return;
    }
    fetchGigsWithApplications();
  }, [user]);

  const fetchGigsWithApplications = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch gigs created by this business
      const { data: gigs, error: gigsError } = await supabase
        .from("gigs")
        .select("*")
        .eq("created_by", user.id)
        .eq("is_active", true)
        .order("start_date", { ascending: true });

      if (gigsError) {
        throw gigsError;
      }

      const gigsWithApps: GigWithApplications[] = [];

      for (const gig of gigs || []) {
        // Fetch applications for each gig
        const { data: applications, error: appsError } = await supabase
          .from("gig_applications")
          .select(`
            *,
            chef_profiles!chef_id (
              first_name,
              last_name,
              email,
              phone,
              bio
            )
          `)
          .eq("gig_id", gig.id)
          .order("applied_at", { ascending: false });

        if (appsError) {
          console.error("Error fetching applications:", appsError);
          continue;
        }

        gigsWithApps.push({
          gig,
          applications: applications || []
        });
      }

      setGigsWithApplications(gigsWithApps);
    } catch (error) {
      console.error("Error fetching gigs and applications:", error);
      setError("Failed to load gigs and applications");
      toast({
        title: "Error",
        description: "Failed to load your gigs and applications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const acceptChef = async (applicationId: string, chefName: string, gigTitle: string) => {
    setAcceptingId(applicationId);

    try {
      const response = await fetch(`/api/applications/${applicationId}/accept`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to accept chef");
      }

      toast({
        title: "Chef Accepted",
        description: `${chefName} has been accepted for "${gigTitle}". Other applications have been automatically rejected.`,
      });

      // Refresh the data
      await fetchGigsWithApplications();
    } catch (error) {
      console.error("Error accepting chef:", error);
      toast({
        title: "Error",
        description: "Failed to accept chef. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAcceptingId(null);
    }
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (startDate === endDate) {
        return format(start, "MMM d, yyyy");
      } else {
        return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
      }
    } catch (error) {
      return "Invalid date";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accepted":
        return <Badge className="bg-green-100 text-green-800">Accepted</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case "applied":
        return <Badge className="bg-blue-100 text-blue-800">Applied</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRoleLabel = (roleValue: string) => {
    const roleMap: {[key: string]: string} = {
      "head_chef": "Head Chef",
      "sous_chef": "Sous Chef",
      "pastry_chef": "Pastry Chef",
      "line_cook": "Line Cook",
      "prep_cook": "Prep Cook",
      "kitchen_porter": "Kitchen Porter",
      "dishwasher": "Dishwasher",
      "server": "Server",
      "bartender": "Bartender",
      "barista": "Barista",
      "host": "Host/Hostess",
      "other": "Other"
    };
    return roleMap[roleValue] || roleValue;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-12 mt-16">
          <div className="max-w-6xl mx-auto">
            <div className="text-center py-12">
              <h1 className="text-3xl font-bold mb-6">Loading Your Gigs...</h1>
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

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-12 mt-16">
          <div className="max-w-6xl mx-auto">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <XCircle className="h-12 w-12 text-red-500 mb-4" />
                <h3 className="text-xl font-medium mb-2">Error Loading Gigs</h3>
                <p className="text-neutral-600 text-center max-w-md mb-6">{error}</p>
                <Button onClick={fetchGigsWithApplications}>Try Again</Button>
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Manage Your Gigs</h1>
            <p className="text-neutral-600">Review and manage applications for your posted gigs</p>
          </div>

          {gigsWithApplications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Eye className="h-12 w-12 text-neutral-400 mb-4" />
                <h3 className="text-xl font-medium mb-2">No Gigs Found</h3>
                <p className="text-neutral-600 text-center max-w-md mb-6">
                  You haven't posted any active gigs yet. Create your first gig to start receiving applications from talented chefs.
                </p>
                <Button onClick={() => window.location.href = "/gigs/create"}>
                  Create Your First Gig
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {gigsWithApplications.map(({ gig, applications }) => (
                <Card key={gig.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{gig.title}</CardTitle>
                        <CardDescription className="flex items-center mt-2">
                          <MapPin className="h-4 w-4 mr-1" />
                          {gig.location}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <Badge className="text-lg py-1 px-3 bg-primary text-white mb-2">
                          £{gig.pay_rate}/hr
                        </Badge>
                        <div className="text-sm text-neutral-500">
                          {applications.length} application{applications.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div className="flex items-center">
                        <CalendarCheck className="h-4 w-4 text-neutral-500 mr-2" />
                        <div>
                          <p className="text-sm text-neutral-500">Date</p>
                          <p className="font-medium">{formatDateRange(gig.start_date, gig.end_date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-neutral-500 mr-2" />
                        <div>
                          <p className="text-sm text-neutral-500">Time</p>
                          <p className="font-medium">
                            {gig.start_time.substring(0, 5)} - {gig.end_time.substring(0, 5)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-neutral-500 mr-2" />
                        <div>
                          <p className="text-sm text-neutral-500">Role</p>
                          <p className="font-medium">{getRoleLabel(gig.role)}</p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <Separator />

                  <CardContent className="pt-6">
                    {applications.length === 0 ? (
                      <div className="text-center py-8">
                        <User className="h-8 w-8 text-neutral-400 mx-auto mb-3" />
                        <p className="text-neutral-500">No applications yet</p>
                        <p className="text-sm text-neutral-400">Applications will appear here when chefs apply</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <h4 className="font-semibold">Applications ({applications.length})</h4>
                        {applications.map((application) => (
                          <div key={application.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h5 className="font-medium">
                                  {application.chef_profile?.first_name} {application.chef_profile?.last_name}
                                </h5>
                                <div className="flex items-center text-sm text-neutral-600 mt-1">
                                  <Mail className="h-3 w-3 mr-1" />
                                  {application.chef_profile?.email}
                                </div>
                                <p className="text-sm text-neutral-500 mt-1">
                                  Applied on {format(new Date(application.applied_at), "MMM d, yyyy 'at' h:mm a")}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {getStatusBadge(application.status)}
                                {application.status === "applied" && (
                                  <Button
                                    onClick={() => acceptChef(
                                      application.id,
                                      `${application.chef_profile?.first_name} ${application.chef_profile?.last_name}`,
                                      gig.title
                                    )}
                                    disabled={acceptingId === application.id}
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    {acceptingId === application.id ? (
                                      "Accepting..."
                                    ) : (
                                      <>
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Accept Chef
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>
                            </div>
                            
                            {application.message && (
                              <div className="bg-neutral-50 rounded p-3 mt-3">
                                <p className="text-sm font-medium mb-1">Application Message:</p>
                                <p className="text-sm text-neutral-700">{application.message}</p>
                              </div>
                            )}
                            
                            {application.chef_profile?.bio && (
                              <div className="mt-3">
                                <p className="text-sm font-medium mb-1">About the Chef:</p>
                                <p className="text-sm text-neutral-700">{application.chef_profile.bio}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
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