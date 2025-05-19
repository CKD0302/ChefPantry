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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { format, parseISO, isBefore } from "date-fns";
import { 
  MapPin, 
  Clock, 
  DollarSign, 
  Info, 
  Award, 
  CalendarCheck, 
  ShoppingBag, 
  ChefHat, 
  Building, 
  ArrowLeft 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Gig interface
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
  dressCode?: string;
  serviceExpectations?: string;
  kitchenDetails?: string;
  equipmentProvided: string[];
  benefits: string[];
  tipsAvailable: boolean;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
}

// Application interface
interface Application {
  id: string;
  gigId: string;
  chefId: string;
  status: string;
  message: string;
  appliedAt: string;
}

export default function ViewGig() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [gig, setGig] = useState<Gig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applicationMessage, setApplicationMessage] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  // Get gig ID from URL
  const location = window.location.pathname;
  const gigId = location.split("/").pop() || "";

  useEffect(() => {
    // Redirect if not authenticated
    if (!user) {
      navigate("/auth/signin");
      return;
    }

    // If no gig ID, redirect to browse page
    if (!gigId) {
      navigate("/gigs/browse");
      return;
    }

    fetchGig();
    checkIfApplied();
  }, [user, gigId, navigate]);

  const fetchGig = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch gig directly from Supabase instead of using the API
      const { data, error } = await supabase
        .from("gigs")
        .select("*")
        .eq("id", gigId)
        .single();
      
      if (error) {
        console.error("Supabase error fetching gig:", error);
        throw new Error("Gig not found");
      }
      
      if (!data) {
        throw new Error("Gig not found");
      }
      
      console.log("Gig details fetched successfully:", data);
      
      // Transform the data from snake_case to camelCase to match the component expectations
      const formattedGig = {
        id: data.id,
        title: data.title,
        gigDate: data.date,
        startTime: data.start_time,
        endTime: data.end_time,
        location: data.location,
        payRate: data.pay_rate,
        role: data.role,
        venueType: data.venue_type,
        dressCode: data.dress_code,
        serviceExpectations: data.service_expectations,
        kitchenDetails: data.kitchen_details,
        equipmentProvided: data.equipment_provided || [],
        benefits: data.benefits || [],
        tipsAvailable: data.tips_available,
        isActive: data.is_active,
        createdAt: data.created_at,
        createdBy: data.created_by
      };
      
      setGig(formattedGig);
    } catch (error) {
      console.error("Error fetching gig:", error);
      setError("Failed to load gig details. The gig may not exist or has been removed.");
      toast({
        title: "Error",
        description: "Failed to load gig details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkIfApplied = async () => {
    if (!user?.id || !gigId) return;
    
    try {
      // Fetch applications directly from Supabase
      const { data, error } = await supabase
        .from("gig_applications")
        .select("*")
        .eq("chef_id", user.id);
      
      if (error) {
        console.error("Error checking application status:", error);
        return;
      }
      
      // Check if user has already applied to this gig
      const applications = data || [];
      console.log("Applications fetched successfully:", applications);
      
      const hasAppliedToThisGig = applications.some(app => app.gig_id === gigId);
      setHasApplied(hasAppliedToThisGig);
    } catch (error) {
      console.error("Error checking application status:", error);
    }
  };

  const applyForGig = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to apply for gigs",
        variant: "destructive",
      });
      navigate("/auth/signin");
      return;
    }

    if (!gig) return;

    setIsApplying(true);

    try {
      // Insert application directly to Supabase
      const { data, error } = await supabase
        .from("gig_applications")
        .insert({
          gig_id: gig.id,
          chef_id: user.id,
          status: "applied",
          message: applicationMessage,
          applied_at: new Date().toISOString()
        })
        .select();
      
      if (error) {
        console.error("Supabase error applying for gig:", error);
        throw new Error("Failed to submit application");
      }
      
      console.log("Application submitted successfully:", data);
      
      setHasApplied(true);
      setIsDialogOpen(false);
      
      toast({
        title: "Application Submitted",
        description: "Your application has been submitted successfully!",
      });
    } catch (error) {
      console.error("Error applying for gig:", error);
      toast({
        title: "Error",
        description: "Failed to submit your application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsApplying(false);
    }
  };

  // Helper functions for displaying data
  const formatDateTime = (date: string, time: string): { date: string; time: string } => {
    if (!date) return { date: "N/A", time: "" };
    try {
      const formattedDate = format(new Date(date), "EEEE, MMMM d, yyyy");
      // Convert time from HH:MM:SS to HH:MM format
      const formattedTime = time ? time.substring(0, 5) : "";
      return { date: formattedDate, time: formattedTime };
    } catch (error) {
      return { date: "Invalid date", time: "" };
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

  const isPastGig = (date: string) => {
    if (!date) return false;
    try {
      return isBefore(new Date(date), new Date());
    } catch (error) {
      return false;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-12 mt-16">
          <div className="max-w-4xl mx-auto">
            <Button 
              variant="ghost" 
              className="mb-6"
              onClick={() => navigate("/gigs/browse")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Browse
            </Button>
            <div className="text-center py-12">
              <h1 className="text-3xl font-bold mb-6">Loading Gig Details...</h1>
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

  if (error || !gig) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-12 mt-16">
          <div className="max-w-4xl mx-auto">
            <Button 
              variant="ghost" 
              className="mb-6"
              onClick={() => navigate("/gigs/browse")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Browse
            </Button>
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-red-50 p-3 mb-4">
                  <Info className="h-8 w-8 text-red-500" />
                </div>
                <h3 className="text-xl font-medium mb-2">Gig Not Found</h3>
                <p className="text-neutral-600 text-center max-w-md mb-6">
                  {error || "The gig you're looking for doesn't exist or may have been removed."}
                </p>
                <Button 
                  onClick={() => navigate("/gigs/browse")}
                  className="bg-primary hover:bg-primary-dark"
                >
                  Browse Available Gigs
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const { date: formattedDate, time: formattedStartTime } = formatDateTime(gig.gigDate, gig.startTime);
  const isPast = isPastGig(gig.gigDate);

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12 mt-16">
        <div className="max-w-4xl mx-auto">
          <Button 
            variant="ghost" 
            className="mb-6"
            onClick={() => navigate("/gigs/browse")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Browse
          </Button>

          <div className="bg-white shadow rounded-lg overflow-hidden">
            {/* Gig Header */}
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">{gig.title}</h1>
                  <div className="flex items-center mt-2 text-neutral-600">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{gig.location}</span>
                  </div>
                </div>
                <Badge className="text-lg py-1.5 px-3 bg-primary text-white">
                  £{gig.payRate}/hr
                </Badge>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center">
                  <CalendarCheck className="h-5 w-5 text-neutral-500 mr-2" />
                  <div>
                    <p className="text-sm text-neutral-500">Date</p>
                    <p className="font-medium">{formattedDate}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-neutral-500 mr-2" />
                  <div>
                    <p className="text-sm text-neutral-500">Time</p>
                    <p className="font-medium">{gig.startTime.substring(0, 5)} - {gig.endTime.substring(0, 5)}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <ChefHat className="h-5 w-5 text-neutral-500 mr-2" />
                  <div>
                    <p className="text-sm text-neutral-500">Role</p>
                    <p className="font-medium">{getRoleLabel(gig.role)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center">
                  <Building className="h-5 w-5 text-neutral-500 mr-2" />
                  <div>
                    <p className="text-sm text-neutral-500">Venue Type</p>
                    <p className="font-medium">{getVenueTypeLabel(gig.venueType)}</p>
                  </div>
                </div>
                {gig.tipsAvailable && (
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-green-500 mr-2" />
                    <div>
                      <p className="font-medium text-green-600">Tips Available</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Gig Details */}
            <div className="p-6 md:p-8">
              {gig.dressCode && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Dress Code</h3>
                  <p className="text-neutral-700">{gig.dressCode}</p>
                </div>
              )}

              {gig.serviceExpectations && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Service Expectations</h3>
                  <p className="text-neutral-700">{gig.serviceExpectations}</p>
                </div>
              )}

              {gig.kitchenDetails && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Kitchen Details</h3>
                  <p className="text-neutral-700">{gig.kitchenDetails}</p>
                </div>
              )}

              {gig.equipmentProvided && gig.equipmentProvided.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Equipment Provided</h3>
                  <div className="flex flex-wrap gap-2">
                    {gig.equipmentProvided.map((item, index) => (
                      <Badge key={index} variant="outline" className="bg-neutral-50">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {gig.benefits && gig.benefits.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Benefits</h3>
                  <div className="flex flex-wrap gap-2">
                    {gig.benefits.map((benefit, index) => (
                      <Badge key={index} variant="outline" className="bg-green-50 text-green-700">
                        {benefit}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Application Section */}
            <Separator />
            <div className="p-6 md:p-8 bg-neutral-50">
              {isPast ? (
                <div className="text-center py-4">
                  <Badge variant="secondary" className="mb-2">Expired</Badge>
                  <p className="text-neutral-600">This gig has already passed and is no longer accepting applications.</p>
                </div>
              ) : !gig.isActive ? (
                <div className="text-center py-4">
                  <Badge variant="secondary" className="mb-2">Closed</Badge>
                  <p className="text-neutral-600">This gig is no longer accepting applications.</p>
                </div>
              ) : hasApplied ? (
                <div className="text-center py-4">
                  <Badge variant="outline" className="bg-green-100 text-green-700 mb-2">Applied</Badge>
                  <p className="text-neutral-600">You have already applied for this gig.</p>
                </div>
              ) : (
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Interested in this gig?</h3>
                  <p className="text-neutral-600 mb-4">Submit your application now to express your interest.</p>
                  <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-primary hover:bg-primary-dark">
                        Apply Now
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Apply for "{gig.title}"</DialogTitle>
                        <DialogDescription>
                          Tell the business why you're a great fit for this gig.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <Textarea 
                          placeholder="Share your relevant experience, availability, and why you're interested in this gig..."
                          value={applicationMessage}
                          onChange={(e) => setApplicationMessage(e.target.value)}
                          className="min-h-[150px]"
                        />
                      </div>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button 
                          onClick={applyForGig} 
                          disabled={isApplying}
                          className="bg-primary hover:bg-primary-dark"
                        >
                          {isApplying ? "Submitting..." : "Submit Application"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}