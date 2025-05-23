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
  CheckCircle, 
  XCircle,
  FileText,
  Award
} from "lucide-react";
import { format } from "date-fns";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface Application {
  id: string;
  gig_id: string;
  chef_id: string;
  status: string;
  message: string;
  applied_at: string;
  gig?: {
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
    created_by: string;
  };
}

export default function MyApplications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      return;
    }
    fetchMyApplications();
  }, [user]);

  const fetchMyApplications = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch applications for this chef with gig details
      const { data: applications, error: appsError } = await supabase
        .from("gig_applications")
        .select(`
          *,
          gigs!gig_id (
            id,
            title,
            start_date,
            end_date,
            start_time,
            end_time,
            location,
            pay_rate,
            role,
            venue_type,
            created_by
          )
        `)
        .eq("chef_id", user.id)
        .order("applied_at", { ascending: false });

      if (appsError) {
        throw appsError;
      }

      console.log("Applications fetched successfully:", applications);
      setApplications(applications || []);
    } catch (error) {
      console.error("Error fetching applications:", error);
      setError("Failed to load your applications");
      toast({
        title: "Error",
        description: "Failed to load your applications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmGig = async (applicationId: string, gigTitle: string) => {
    setConfirmingId(applicationId);

    try {
      const response = await fetch(`/api/applications/${applicationId}/confirm`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to confirm gig");
      }

      toast({
        title: "Gig Confirmed",
        description: `You have confirmed the gig "${gigTitle}". The business has been notified.`,
      });

      // Refresh the data
      await fetchMyApplications();
    } catch (error) {
      console.error("Error confirming gig:", error);
      toast({
        title: "Error",
        description: "Failed to confirm gig. Please try again.",
        variant: "destructive",
      });
    } finally {
      setConfirmingId(null);
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
        return <Badge className="bg-green-100 text-green-800">Accepted - Awaiting Confirmation</Badge>;
      case "confirmed":
        return <Badge className="bg-blue-100 text-blue-800">Confirmed</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case "applied":
        return <Badge className="bg-yellow-100 text-yellow-800">Under Review</Badge>;
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

  // Filter applications that need confirmation (accepted but not confirmed)
  const acceptedApplications = applications.filter(app => app.status === "accepted");
  const otherApplications = applications.filter(app => app.status !== "accepted");

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-12 mt-16">
          <div className="max-w-6xl mx-auto">
            <div className="text-center py-12">
              <h1 className="text-3xl font-bold mb-6">Loading Your Applications...</h1>
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
                <h3 className="text-xl font-medium mb-2">Error Loading Applications</h3>
                <p className="text-neutral-600 text-center max-w-md mb-6">{error}</p>
                <Button onClick={fetchMyApplications}>Try Again</Button>
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
            <h1 className="text-3xl font-bold mb-2">My Gig Applications</h1>
            <p className="text-neutral-600">Track your applications and confirm accepted gigs</p>
          </div>

          {/* Accepted Applications - Need Confirmation */}
          {acceptedApplications.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <Award className="h-5 w-5 text-green-600 mr-2" />
                <h2 className="text-xl font-semibold text-green-700">Gigs Awaiting Your Confirmation</h2>
              </div>
              <div className="space-y-4">
                {acceptedApplications.map((application) => (
                  <Card key={application.id} className="border-green-200 bg-green-50">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl text-green-800">{application.gig?.title}</CardTitle>
                          <CardDescription className="flex items-center mt-2 text-green-700">
                            <MapPin className="h-4 w-4 mr-1" />
                            {application.gig?.location}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <Badge className="text-lg py-1 px-3 bg-green-600 text-white mb-2">
                            £{application.gig?.pay_rate}/hr
                          </Badge>
                          <div className="mt-2">
                            {getStatusBadge(application.status)}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div className="flex items-center">
                          <CalendarCheck className="h-4 w-4 text-green-600 mr-2" />
                          <div>
                            <p className="text-sm text-green-600">Date</p>
                            <p className="font-medium text-green-800">
                              {formatDateRange(application.gig?.start_date || "", application.gig?.end_date || "")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-green-600 mr-2" />
                          <div>
                            <p className="text-sm text-green-600">Time</p>
                            <p className="font-medium text-green-800">
                              {application.gig?.start_time.substring(0, 5)} - {application.gig?.end_time.substring(0, 5)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 text-green-600 mr-2" />
                          <div>
                            <p className="text-sm text-green-600">Role</p>
                            <p className="font-medium text-green-800">{getRoleLabel(application.gig?.role || "")}</p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <Separator />

                    <CardContent className="pt-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-green-700 mb-1">
                            <strong>Congratulations!</strong> You have been accepted for this gig.
                          </p>
                          <p className="text-sm text-green-600">
                            Please confirm your participation to finalize the booking.
                          </p>
                        </div>
                        <Button
                          onClick={() => confirmGig(application.id, application.gig?.title || "")}
                          disabled={confirmingId === application.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {confirmingId === application.id ? (
                            "Confirming..."
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Confirm Gig
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Other Applications */}
          <div>
            <h2 className="text-xl font-semibold mb-4">All Applications</h2>
            {applications.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-neutral-400 mb-4" />
                  <h3 className="text-xl font-medium mb-2">No Applications Yet</h3>
                  <p className="text-neutral-600 text-center max-w-md mb-6">
                    You haven't applied to any gigs yet. Browse available gigs to start applying.
                  </p>
                  <Button onClick={() => window.location.href = "/gigs/browse"}>
                    Browse Available Gigs
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {applications.map((application) => (
                  <Card key={application.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl">{application.gig?.title}</CardTitle>
                          <CardDescription className="flex items-center mt-2">
                            <MapPin className="h-4 w-4 mr-1" />
                            {application.gig?.location}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <Badge className="text-lg py-1 px-3 bg-primary text-white mb-2">
                            £{application.gig?.pay_rate}/hr
                          </Badge>
                          <div className="mt-2">
                            {getStatusBadge(application.status)}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div className="flex items-center">
                          <CalendarCheck className="h-4 w-4 text-neutral-500 mr-2" />
                          <div>
                            <p className="text-sm text-neutral-500">Date</p>
                            <p className="font-medium">
                              {formatDateRange(application.gig?.start_date || "", application.gig?.end_date || "")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-neutral-500 mr-2" />
                          <div>
                            <p className="text-sm text-neutral-500">Time</p>
                            <p className="font-medium">
                              {application.gig?.start_time.substring(0, 5)} - {application.gig?.end_time.substring(0, 5)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 text-neutral-500 mr-2" />
                          <div>
                            <p className="text-sm text-neutral-500">Role</p>
                            <p className="font-medium">{getRoleLabel(application.gig?.role || "")}</p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <Separator />

                    <CardContent className="pt-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-neutral-600 mb-1">
                            Applied on {format(new Date(application.applied_at), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                          {application.message && (
                            <p className="text-sm text-neutral-700 bg-neutral-50 rounded p-2 mt-2">
                              <strong>Your message:</strong> {application.message}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}