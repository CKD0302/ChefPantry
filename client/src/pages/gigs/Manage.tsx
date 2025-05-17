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
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { CalendarIcon, MoreHorizontal, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Interface for the gig data
interface Gig {
  id: string;
  title: string;
  gigDate: string;
  startTime: string;
  endTime: string;
  location: string;
  payRate: number;
  role: string;
  venueType: string;
  isActive: boolean;
  createdAt: string;
}

// Interface for the application data
interface GigApplication {
  id: string;
  gigId: string;
  chefId: string;
  status: string;
  message: string;
  appliedAt: string;
}

export default function ManageGigs() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applications, setApplications] = useState<{ [gigId: string]: number }>({});
  const { toast } = useToast();

  useEffect(() => {
    // Redirect if not authenticated
    if (!user) {
      navigate("/auth/signin");
      return;
    }

    // Fetch the gigs for this business
    fetchGigs();
  }, [user, navigate]);

  const fetchGigs = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch gigs directly from Supabase where created_by matches the current user ID
      const { data, error } = await supabase
        .from("gigs")
        .select("*")
        .eq("created_by", user?.id)
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Supabase error fetching gigs:", error);
        throw new Error("Failed to fetch gigs");
      }
      
      console.log("Business gigs fetched successfully:", data);
      
      // Transform data from snake_case to camelCase for component compatibility
      const formattedGigs = data.map(gig => ({
        id: gig.id,
        title: gig.title,
        gigDate: gig.date,
        startTime: gig.start_time,
        endTime: gig.end_time,
        location: gig.location,
        payRate: gig.pay_rate,
        role: gig.role,
        venueType: gig.venue_type,
        isActive: gig.is_active,
        createdAt: gig.created_at
      }));
      
      setGigs(formattedGigs || []);
      
      // For each gig, fetch the application count
      if (formattedGigs && formattedGigs.length > 0) {
        await Promise.all(formattedGigs.map(fetchApplicationCount));
      }
    } catch (error) {
      console.error("Error fetching gigs:", error);
      setError("Failed to load your gigs. Please try again later.");
      toast({
        title: "Error",
        description: "Failed to load your gigs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicationCount = async (gig: Gig) => {
    try {
      // Fetch applications directly from Supabase
      const { data, error } = await supabase
        .from("gig_applications")
        .select("*")
        .eq("gig_id", gig.id);
      
      if (error) {
        console.error(`Supabase error fetching applications for gig ${gig.id}:`, error);
        throw new Error(`Failed to fetch applications for gig ${gig.id}`);
      }
      
      console.log(`Applications for gig ${gig.id} fetched successfully:`, data);
      
      setApplications(prev => ({
        ...prev,
        [gig.id]: data?.length || 0
      }));
    } catch (error) {
      console.error(`Error fetching applications for gig ${gig.id}:`, error);
    }
  };

  const toggleGigStatus = async (gigId: string, currentStatus: boolean) => {
    try {
      // Update gig status directly in Supabase
      const { data, error } = await supabase
        .from("gigs")
        .update({ is_active: !currentStatus })
        .eq("id", gigId)
        .select();
      
      if (error) {
        console.error("Supabase error updating gig status:", error);
        throw new Error("Failed to update gig status");
      }
      
      console.log("Gig status updated successfully:", data);
      
      // Update the local gigs state
      setGigs(prev => 
        prev.map(gig => 
          gig.id === gigId 
            ? { ...gig, isActive: !currentStatus } 
            : gig
        )
      );
      
      toast({
        title: "Success",
        description: `Gig ${currentStatus ? "deactivated" : "activated"} successfully`,
      });
    } catch (error) {
      console.error("Error updating gig status:", error);
      toast({
        title: "Error",
        description: "Failed to update gig status",
        variant: "destructive",
      });
    }
  };

  const viewApplications = (gigId: string) => {
    navigate(`/gigs/applications/${gigId}`);
  };

  const editGig = (gigId: string) => {
    navigate(`/gigs/edit/${gigId}`);
  };

  const formatDateTime = (date: string, time: string) => {
    if (!date) return "N/A";
    try {
      const formattedDate = format(new Date(date), "MMM d, yyyy");
      const formattedTime = time ? ` at ${time}` : "";
      return `${formattedDate}${formattedTime}`;
    } catch (error) {
      return "Invalid date";
    }
  };

  // Helper function to get role and venue type display labels
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

  const getVenueTypeLabel = (venueValue: string) => {
    const venueMap: {[key: string]: string} = {
      "fine_dining": "Fine Dining",
      "casual_dining": "Casual Dining",
      "cafe": "Café",
      "bistro": "Bistro",
      "pub": "Pub/Gastropub",
      "bar": "Bar/Lounge",
      "hotel": "Hotel",
      "catering": "Catering",
      "food_truck": "Food Truck",
      "private_event": "Private Event",
      "other": "Other"
    };
    return venueMap[venueValue] || venueValue;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-12 mt-16">
          <div className="max-w-5xl mx-auto text-center py-12">
            <h1 className="text-3xl font-bold mb-6">Loading Your Gigs...</h1>
            <div className="animate-pulse flex justify-center">
              <div className="h-4 w-40 bg-neutral-300 rounded"></div>
            </div>
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
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">Manage Your Gigs</h1>
              <p className="text-neutral-600 mt-1">
                View, edit, and manage your posted gigs
              </p>
            </div>
            <Button 
              onClick={() => navigate("/gigs/create")}
              className="bg-primary hover:bg-primary-dark"
            >
              <Plus className="mr-2 h-4 w-4" /> Post New Gig
            </Button>
          </div>

          {error && (
            <Card className="mb-8 border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <p className="text-red-600">{error}</p>
              </CardContent>
            </Card>
          )}

          {gigs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-primary/10 p-3 mb-4">
                  <CalendarIcon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-medium mb-2">No Gigs Posted Yet</h3>
                <p className="text-neutral-600 text-center max-w-md mb-6">
                  You haven't posted any gigs yet. Create your first gig to find talented chefs.
                </p>
                <Button 
                  onClick={() => navigate("/gigs/create")}
                  className="bg-primary hover:bg-primary-dark"
                >
                  <Plus className="mr-2 h-4 w-4" /> Post Your First Gig
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Your Posted Gigs</CardTitle>
                <CardDescription>
                  Manage all your gigs and view applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Venue Type</TableHead>
                      <TableHead>Pay Rate</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Applications</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gigs.map((gig) => (
                      <TableRow key={gig.id}>
                        <TableCell className="font-medium">{gig.title}</TableCell>
                        <TableCell>
                          {formatDateTime(gig.gigDate, gig.startTime)}
                        </TableCell>
                        <TableCell>{getRoleLabel(gig.role)}</TableCell>
                        <TableCell>{getVenueTypeLabel(gig.venueType)}</TableCell>
                        <TableCell>${gig.payRate}/hr</TableCell>
                        <TableCell>
                          <Badge
                            variant={gig.isActive ? "outline" : "secondary"}
                            className={gig.isActive ? "bg-green-100 text-green-800" : ""}
                          >
                            {gig.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewApplications(gig.id)}
                          >
                            {applications[gig.id] || 0} Applications
                          </Button>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => viewApplications(gig.id)}>
                                View Applications
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => editGig(gig.id)}>
                                Edit Gig
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => toggleGigStatus(gig.id, gig.isActive)}
                                className={gig.isActive ? "text-red-600" : "text-green-600"}
                              >
                                {gig.isActive ? "Deactivate Gig" : "Activate Gig"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}