import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  Search, 
  Plus,
  ArrowLeft,
  UserPlus,
  MapPin,
  Mail,
  Loader2
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useRoute, useLocation } from "wouter";

interface ChefSearchResult {
  id: string;
  fullName: string;
  email: string;
  location: string | null;
  profileImageUrl: string | null;
}

interface StaffMember {
  id: string;
  venueId: string;
  chefId: string;
  isActive: boolean;
  role: string | null;
  createdAt: string;
  chef: {
    id: string;
    fullName: string;
    profileImageUrl: string | null;
  } | null;
}

interface BusinessProfile {
  id: string;
  businessName: string;
  location: string;
}

export default function VenueStaff() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [, params] = useRoute("/business/:id/staff");
  const venueId = params?.id;
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const { data: businessProfile } = useQuery<BusinessProfile>({
    queryKey: ["/api/profiles/business", venueId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/profiles/business/${venueId}`);
      const data = await response.json();
      return data?.data || data;
    },
    enabled: !!venueId,
  });

  const { data: staff, isLoading: loadingStaff } = useQuery<StaffMember[]>({
    queryKey: ["/api/time/venue", venueId, "staff"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/time/venue/${venueId}/staff`);
      return response.json();
    },
    enabled: !!venueId && !!user?.id,
  });

  const { data: searchResults, refetch: searchChefs } = useQuery<{ data: ChefSearchResult[] }>({
    queryKey: ["/api/chefs/search", searchQuery, venueId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/chefs/search?q=${encodeURIComponent(searchQuery)}&venueId=${venueId}`);
      return response.json();
    },
    enabled: false,
  });

  const addStaffMutation = useMutation({
    mutationFn: async (chefId: string) => {
      const response = await apiRequest("POST", `/api/time/venue/${venueId}/staff`, { chefId });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add staff");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Staff Added",
        description: "The chef has been added to your venue staff.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/time/venue", venueId, "staff"] });
      setSearchQuery("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Add Staff",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateStaffMutation = useMutation({
    mutationFn: async ({ staffId, isActive }: { staffId: string; isActive: boolean }) => {
      const response = await apiRequest("PATCH", `/api/time/venue/${venueId}/staff/${staffId}`, { isActive });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update staff");
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.isActive ? "Staff Activated" : "Staff Deactivated",
        description: variables.isActive 
          ? "The staff member can now clock in at this venue." 
          : "The staff member can no longer clock in at this venue.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/time/venue", venueId, "staff"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Update Staff",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSearch = async () => {
    if (searchQuery.trim().length < 2) {
      toast({
        title: "Search Query Too Short",
        description: "Please enter at least 2 characters to search.",
        variant: "destructive",
      });
      return;
    }
    setIsSearching(true);
    await searchChefs();
    setIsSearching(false);
  };

  const handleAddStaff = (chefId: string) => {
    addStaffMutation.mutate(chefId);
  };

  const handleToggleActive = (staffId: string, currentStatus: boolean) => {
    updateStaffMutation.mutate({ staffId, isActive: !currentStatus });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const activeStaff = staff?.filter(s => s.isActive) || [];
  const inactiveStaff = staff?.filter(s => !s.isActive) || [];

  return (
    <div>
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button 
          onClick={() => navigate(`/business/${venueId}/dashboard`)} 
          variant="ghost" 
          className="mb-4"
          data-testid="back-to-venue"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to {businessProfile?.businessName || "Venue"}
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2" data-testid="page-title">
            Manage Staff
          </h1>
          <p className="text-neutral-600">
            Add chefs as staff members so they can clock in/out at your venue without a specific gig.
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add Staff Member
            </CardTitle>
            <CardDescription>
              Search for chefs by name or email to add them to your venue staff.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                  placeholder="Search chefs by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10"
                  data-testid="search-input"
                />
              </div>
              <Button 
                onClick={handleSearch} 
                disabled={isSearching || searchQuery.trim().length < 2}
                data-testid="search-button"
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>

            {searchResults?.data && searchResults.data.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-neutral-500 mb-2">
                  Found {searchResults.data.length} chef(s)
                </p>
                {searchResults.data.map((chef) => (
                  <div 
                    key={chef.id} 
                    className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
                    data-testid={`search-result-${chef.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={chef.profileImageUrl || undefined} />
                        <AvatarFallback>{getInitials(chef.fullName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{chef.fullName}</p>
                        <div className="flex items-center gap-2 text-sm text-neutral-500">
                          <Mail className="h-3 w-3" />
                          <span>{chef.email}</span>
                          {chef.location && (
                            <>
                              <span>•</span>
                              <MapPin className="h-3 w-3" />
                              <span>{chef.location}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAddStaff(chef.id)}
                      disabled={addStaffMutation.isPending}
                      data-testid={`add-staff-${chef.id}`}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {searchResults?.data && searchResults.data.length === 0 && (
              <p className="text-neutral-500 text-center py-4">
                No chefs found matching your search.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Current Staff ({staff?.length || 0})
            </CardTitle>
            <CardDescription>
              Toggle staff members active or inactive. Inactive staff cannot clock in at your venue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingStaff ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
              </div>
            ) : staff && staff.length > 0 ? (
              <div className="space-y-6">
                {activeStaff.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-neutral-500 mb-3">Active Staff</h3>
                    <div className="space-y-2">
                      {activeStaff.map((member) => (
                        <div 
                          key={member.id} 
                          className="flex items-center justify-between p-4 border rounded-lg"
                          data-testid={`staff-member-${member.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={member.chef?.profileImageUrl || undefined} />
                              <AvatarFallback>
                                {member.chef?.fullName ? getInitials(member.chef.fullName) : "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{member.chef?.fullName || "Unknown Chef"}</p>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="bg-green-100 text-green-800">
                                  Active
                                </Badge>
                                {member.role && (
                                  <Badge variant="outline">{member.role}</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-neutral-500">Active</span>
                            <Switch
                              checked={member.isActive}
                              onCheckedChange={() => handleToggleActive(member.id, member.isActive)}
                              disabled={updateStaffMutation.isPending}
                              data-testid={`toggle-staff-${member.id}`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {inactiveStaff.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-neutral-500 mb-3">Inactive Staff</h3>
                    <div className="space-y-2">
                      {inactiveStaff.map((member) => (
                        <div 
                          key={member.id} 
                          className="flex items-center justify-between p-4 border rounded-lg bg-neutral-50"
                          data-testid={`staff-member-${member.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-12 w-12 opacity-60">
                              <AvatarImage src={member.chef?.profileImageUrl || undefined} />
                              <AvatarFallback>
                                {member.chef?.fullName ? getInitials(member.chef.fullName) : "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-neutral-600">{member.chef?.fullName || "Unknown Chef"}</p>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="bg-neutral-200 text-neutral-600">
                                  Inactive
                                </Badge>
                                {member.role && (
                                  <Badge variant="outline">{member.role}</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-neutral-500">Active</span>
                            <Switch
                              checked={member.isActive}
                              onCheckedChange={() => handleToggleActive(member.id, member.isActive)}
                              disabled={updateStaffMutation.isPending}
                              data-testid={`toggle-staff-${member.id}`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                <p className="text-neutral-600 mb-2">No staff members yet</p>
                <p className="text-sm text-neutral-500">
                  Use the search above to find and add chefs as staff members.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
