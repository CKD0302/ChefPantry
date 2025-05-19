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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, isAfter, parseISO } from "date-fns";
import { MapPin, Clock, DollarSign, CalendarIcon, Filter, Search } from "lucide-react";
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
  createdAt: string;
  createdBy: string;
}

// Role and venue type options for filtering
const roleOptions = [
  { value: "all_roles", label: "All Roles" },
  { value: "head_chef", label: "Head Chef" },
  { value: "sous_chef", label: "Sous Chef" },
  { value: "pastry_chef", label: "Pastry Chef" },
  { value: "line_cook", label: "Line Cook" },
  { value: "prep_cook", label: "Prep Cook" },
  { value: "kitchen_porter", label: "Kitchen Porter" },
  { value: "dishwasher", label: "Dishwasher" },
  { value: "server", label: "Server" },
  { value: "bartender", label: "Bartender" },
  { value: "barista", label: "Barista" },
  { value: "host", label: "Host/Hostess" },
  { value: "other", label: "Other" },
];

const venueTypeOptions = [
  { value: "all_venues", label: "All Venues" },
  { value: "fine_dining", label: "Fine Dining" },
  { value: "casual_dining", label: "Casual Dining" },
  { value: "cafe", label: "Café" },
  { value: "bistro", label: "Bistro" },
  { value: "pub", label: "Pub/Gastropub" },
  { value: "bar", label: "Bar/Lounge" },
  { value: "hotel", label: "Hotel" },
  { value: "catering", label: "Catering" },
  { value: "food_truck", label: "Food Truck" },
  { value: "private_event", label: "Private Event" },
  { value: "other", label: "Other" },
];

export default function BrowseGigs() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [filteredGigs, setFilteredGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [venueFilter, setVenueFilter] = useState("");
  const { toast } = useToast();

  // Check if the user's profile exists before allowing them to browse gigs
  const [profileExists, setProfileExists] = useState<boolean | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(true);

  useEffect(() => {
    // Redirect if not authenticated
    if (!user) {
      navigate("/auth/signin");
      return;
    }

    // Check if chef profile exists
    const checkProfileExists = async () => {
      try {
        // Check via Supabase directly to avoid API issues
        const { data, error } = await supabase
          .from("chef_profiles")
          .select("id")
          .eq("id", user.id)
          .single();
        
        if (data) {
          console.log("Chef profile found:", data);
          setProfileExists(true);
        } else {
          console.log("Chef profile not found, error:", error);
          setProfileExists(false);
        }
      } catch (error) {
        console.error("Error checking profile:", error);
        setProfileExists(false);
      } finally {
        setCheckingProfile(false);
      }
    };

    checkProfileExists();
    fetchGigs();
  }, [user, navigate]);

  // Filter gigs when search term or filters change
  useEffect(() => {
    if (!gigs.length) return;

    let filtered = [...gigs];

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        gig =>
          gig.title.toLowerCase().includes(term) ||
          gig.location.toLowerCase().includes(term) ||
          (gig.kitchenDetails && gig.kitchenDetails.toLowerCase().includes(term))
      );
    }

    // Filter by role
    if (roleFilter && roleFilter !== 'all_roles') {
      filtered = filtered.filter(gig => gig.role === roleFilter);
    }

    // Filter by venue type
    if (venueFilter && venueFilter !== 'all_venues') {
      filtered = filtered.filter(gig => gig.venueType === venueFilter);
    }

    // Sort by date (closest first)
    filtered.sort((a, b) => {
      // Past gigs at the end
      const now = new Date();
      const dateA = parseISO(a.gigDate);
      const dateB = parseISO(b.gigDate);
      
      const aIsPast = !isAfter(dateA, now);
      const bIsPast = !isAfter(dateB, now);
      
      if (aIsPast && !bIsPast) return 1;
      if (!aIsPast && bIsPast) return -1;
      
      // Both future or both past, sort by closest date
      return new Date(a.gigDate).getTime() - new Date(b.gigDate).getTime();
    });

    setFilteredGigs(filtered);
  }, [gigs, searchTerm, roleFilter, venueFilter]);

  const fetchGigs = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch gigs directly from Supabase instead of using API
      const { data, error } = await supabase
        .from("gigs")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
        
      if (error) {
        throw error;
      }
      
      console.log("Gigs fetched successfully:", data);
      
      // Transform the data from snake_case to camelCase
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
        dressCode: gig.dress_code,
        serviceExpectations: gig.service_expectations,
        kitchenDetails: gig.kitchen_details,
        equipmentProvided: gig.equipment_provided || [],
        benefits: gig.benefits || [],
        tipsAvailable: gig.tips_available,
        createdAt: gig.created_at,
        createdBy: gig.created_by
      }));
      
      setGigs(formattedGigs || []);
      setFilteredGigs(formattedGigs || []);
    } catch (error) {
      console.error("Error fetching gigs:", error);
      setError("Failed to load available gigs. Please try again later.");
      toast({
        title: "Error",
        description: "Failed to load available gigs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const viewGigDetails = (gigId: string) => {
    navigate(`/gigs/view/${gigId}`);
  };

  // Helper functions for displaying data
  const formatDateTime = (date: string, time: string) => {
    if (!date) return "N/A";
    try {
      const formattedDate = format(new Date(date), "MMM d, yyyy");
      // Convert time from HH:MM:SS to HH:MM format
      const formattedTime = time ? ` at ${time.substring(0, 5)}` : "";
      return `${formattedDate}${formattedTime}`;
    } catch (error) {
      return "Invalid date";
    }
  };

  const getRoleLabel = (roleValue: string) => {
    const option = roleOptions.find(opt => opt.value === roleValue);
    return option ? option.label : roleValue;
  };

  const getVenueTypeLabel = (venueValue: string) => {
    const option = venueTypeOptions.find(opt => opt.value === venueValue);
    return option ? option.label : venueValue;
  };

  if (checkingProfile) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-12 mt-16">
          <div className="max-w-5xl mx-auto text-center py-12">
            <h1 className="text-3xl font-bold mb-6">Checking your profile...</h1>
            <div className="animate-pulse flex justify-center">
              <div className="h-4 w-40 bg-neutral-300 rounded"></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (profileExists === false) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-12 mt-16">
          <div className="max-w-5xl mx-auto text-center py-12">
            <h1 className="text-3xl font-bold mb-3">Complete Your Profile</h1>
            <p className="text-gray-600 mb-8">
              You need to create a chef profile before you can browse and apply for gigs.
            </p>
            <Button 
              onClick={() => navigate("/profile/create")}
              className="bg-primary hover:bg-primary-dark"
              size="lg"
            >
              Create Your Chef Profile
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-12 mt-16">
          <div className="max-w-5xl mx-auto text-center py-12">
            <h1 className="text-3xl font-bold mb-6">Loading Available Gigs...</h1>
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Browse Available Gigs</h1>
            <p className="text-neutral-600 mt-1">
              Find and apply for culinary gigs that match your skills and schedule
            </p>
          </div>

          {/* Search and Filter Section */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by title, location, or details..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-4">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={venueFilter} onValueChange={setVenueFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Venue Type" />
                </SelectTrigger>
                <SelectContent>
                  {venueTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <Card className="mb-8 border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <p className="text-red-600">{error}</p>
              </CardContent>
            </Card>
          )}

          {filteredGigs.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-neutral-100 p-3 mb-4">
                  <CalendarIcon className="h-8 w-8 text-neutral-500" />
                </div>
                <h3 className="text-xl font-medium mb-2">No Gigs Found</h3>
                <p className="text-neutral-600 text-center max-w-md">
                  {searchTerm || roleFilter || venueFilter
                    ? "No gigs match your current filters. Try adjusting your search criteria."
                    : "There are no available gigs at the moment. Check back later!"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredGigs.map((gig) => (
                <Card key={gig.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between">
                      <CardTitle className="text-xl">{gig.title}</CardTitle>
                      <Badge variant="outline">£{gig.payRate}/hr</Badge>
                    </div>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3.5 w-3.5 text-neutral-500" />
                      {gig.location}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-neutral-500" />
                        <span className="text-sm">{formatDateTime(gig.gigDate, gig.startTime)}</span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mt-1">
                        <Badge variant="secondary">{getRoleLabel(gig.role)}</Badge>
                        <Badge variant="secondary">{getVenueTypeLabel(gig.venueType)}</Badge>
                        {gig.tipsAvailable && <Badge variant="secondary">Tips Available</Badge>}
                      </div>
                      
                      {gig.benefits && gig.benefits.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium mb-1">Benefits:</p>
                          <div className="flex flex-wrap gap-1">
                            {gig.benefits.map((benefit, index) => (
                              <Badge key={index} variant="outline" className="font-normal bg-green-50">
                                {benefit}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button 
                      onClick={() => viewGigDetails(gig.id)}
                      className="w-full bg-primary hover:bg-primary-dark"
                    >
                      View Details
                    </Button>
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