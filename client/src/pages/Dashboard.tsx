import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { CheckCircle, Calendar, MapPin, PoundSterling, Clock, Bell, ExternalLink, Building2, Users, Settings, Mail } from "lucide-react";
import { format } from "date-fns";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProfessionalDocuments from "@/components/ProfessionalDocuments";
import { ChefDisclaimerModal } from "@/components/ChefDisclaimerModal";
import BusinessDisclaimerModal from "@/components/BusinessDisclaimerModal";
import InviteCompanyModal from "@/components/InviteCompanyModal";
import ManageOutboundInvites from "@/components/ManageOutboundInvites";
import { apiRequest } from "@/lib/queryClient";

// Company Dashboard Section Component - Full Console Functionality
function CompanyDashboardSection({ user, navigate, signOut }: { user: any, navigate: any, signOut: () => void }) {
  // Get user's company
  const { data: userCompanies } = useQuery({
    queryKey: ['/api/company/mine', user?.id],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/company/mine`);
      return response.json();
    },
    enabled: !!user?.id
  });

  const hasExistingCompany = userCompanies?.data && userCompanies.data.length > 0;
  const firstCompany = hasExistingCompany ? userCompanies.data[0] : null;

  // If no company exists, show company creation
  if (!hasExistingCompany) {
    return (
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Company Setup</h2>
        <div className="bg-white border border-neutral-200 rounded p-6 text-center">
          <div className="max-w-md mx-auto">
            <p className="text-blue-600 font-medium mb-2">🏢 Welcome to Chef Pantry Company Portal</p>
            <p className="text-neutral-600 mb-4">Create your company to manage multiple venues.</p>
            <Button 
              className="bg-primary hover:bg-primary-dark text-white"
              onClick={() => navigate("/company/create")}
              data-testid="button-create-company"
            >
              Create Company
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If company exists, show full console functionality
  return <CompanyConsoleDashboard companyId={firstCompany.id} user={user} navigate={navigate} signOut={signOut} />;
}

// Full Company Console Dashboard Component
function CompanyConsoleDashboard({ companyId, user, navigate, signOut }: { companyId: string, user: any, navigate: any, signOut: () => void }) {
  // Fetch company details
  const { data: company, isLoading: loadingCompany } = useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/company/${companyId}`);
      if (!response.ok) throw new Error('Failed to fetch company');
      return response.json();
    },
    enabled: !!user?.id
  });

  // Fetch accessible businesses
  const { data: businesses, isLoading: loadingBusinesses } = useQuery({
    queryKey: ['accessible-businesses', user?.id],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/company/accessible-businesses?userId=${user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch businesses');
      return response.json();
    },
    enabled: !!user?.id
  });

  // Fetch company members
  const { data: members, isLoading: loadingMembers } = useQuery({
    queryKey: ['company-members', companyId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/company/${companyId}/members?userId=${user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch members');
      return response.json();
    },
    enabled: !!user?.id
  });

  if (loadingCompany || loadingBusinesses || loadingMembers) {
    return (
      <div className="mt-8">
        <div className="animate-pulse">
          <div className="h-8 bg-neutral-200 rounded mb-6"></div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-neutral-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const accessibleBusinesses = businesses?.data || [];
  const companyMembers = members?.data || [];

  return (
    <div className="mt-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight" data-testid="company-name">
                {company?.data?.name || 'Company Dashboard'}
              </h1>
              <p className="text-neutral-600">
                Manage your venues, team members, and operations from one central location
              </p>
            </div>
          </div>
          <Button variant="destructive" onClick={() => signOut()} className="mt-1">
            Sign Out
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-neutral-200 rounded p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">Managed Venues</p>
              <p className="text-2xl font-bold">{accessibleBusinesses.length}</p>
            </div>
            <Building2 className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white border border-neutral-200 rounded p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">Team Members</p>
              <p className="text-2xl font-bold">{companyMembers.length}</p>
            </div>
            <Users className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white border border-neutral-200 rounded p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-600">Active Invites</p>
              <p className="text-2xl font-bold">0</p>
            </div>
            <Bell className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Managed Venues */}
        <div className="bg-white border border-neutral-200 rounded">
          <div className="p-6 border-b border-neutral-200">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Managed Venues
            </h3>
          </div>
          <div className="p-6">
            {accessibleBusinesses.length > 0 ? (
              <div className="space-y-3">
                {accessibleBusinesses.map((business: any) => (
                  <div
                    key={business.businessId}
                    className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
                  >
                    <div>
                      <h4 className="font-medium">{business.businessName}</h4>
                      <p className="text-sm text-neutral-600">Business ID: {business.businessId}</p>
                    </div>
                    <div className="flex gap-2">
                      <ManageOutboundInvites
                        businessId={business.businessId}
                        trigger={
                          <Button
                            variant="outline"
                            size="sm"
                            data-testid={`manage-invites-${business.businessId}`}
                          >
                            <Mail className="h-4 w-4 mr-1" />
                            Invites
                          </Button>
                        }
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/business/${business.businessId}/dashboard`)}
                        data-testid={`open-venue-${business.businessId}`}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Open Venue
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                <p className="text-neutral-600">No venues assigned yet</p>
                <p className="text-sm text-neutral-500 mt-1">
                  Venues will appear here when they invite your company
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Team Members */}
        <div className="bg-white border border-neutral-200 rounded">
          <div className="p-6 border-b border-neutral-200">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Members
            </h3>
          </div>
          <div className="p-6">
            {companyMembers.length > 0 ? (
              <div className="space-y-3">
                {companyMembers.map((member: any) => (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg"
                  >
                    <div>
                      <h4 className="font-medium">{member.userId}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-neutral-200 px-2 py-1 rounded">
                          {member.role}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                <p className="text-neutral-600">No team members yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [isChefDisclaimerModalOpen, setIsChefDisclaimerModalOpen] = useState(false);
  const [isBusinessDisclaimerModalOpen, setIsBusinessDisclaimerModalOpen] = useState(false);
  
  const userRole = user?.user_metadata?.role || "chef";
  
  // Check if profile exists using API (only for chef and business users)
  const { data: profileResponse, isLoading: isCheckingProfile } = useQuery({
    queryKey: userRole === "chef" ? ["/api/profiles/chef", user?.id] : ["/api/profiles/business", user?.id],
    queryFn: () => {
      const endpoint = userRole === "chef" ? `/api/profiles/chef/${user!.id}` : `/api/profiles/business/${user!.id}`;
      return apiRequest("GET", endpoint).then(res => res.json()).catch(() => null);
    },
    enabled: !!user && (userRole === "chef" || userRole === "business")
  });
  
  // Company users don't need chef/business profiles, so they "have a profile" by default
  const hasProfile = userRole === "company" ? true : !!(profileResponse?.data || profileResponse?.id);

  // Chef disclaimer acceptance mutation
  const chefDisclaimerMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/profiles/chef/${user!.id}/accept-disclaimer`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Disclaimer Accepted",
        description: "You can now complete your profile.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/profiles/chef", user?.id] });
      setIsChefDisclaimerModalOpen(false);
      navigate("/profile/create");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to accept disclaimer. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Business disclaimer acceptance mutation
  const businessDisclaimerMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/profiles/business/${user!.id}/accept-disclaimer`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Disclaimer Accepted",
        description: "You can now complete your profile.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/profiles/business", user?.id] });
      setIsBusinessDisclaimerModalOpen(false);
      navigate("/profile/create");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to accept disclaimer. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Fetch accepted applications that need confirmation (for chefs)
  const { data: acceptedApplications, isLoading: loadingAccepted } = useQuery({
    queryKey: ['/api/applications/accepted', user?.id],
    enabled: !!user && user.user_metadata?.role === 'chef',
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/applications/accepted?chefId=${user!.id}`);
      return response.json();
    }
  });

  // Fetch notifications (for businesses)
  const { data: notifications, isLoading: loadingNotifications } = useQuery({
    queryKey: ['/api/notifications', user?.id],
    enabled: !!user && user.user_metadata?.role === 'business',
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/notifications?recipientId=${user!.id}`);
      return response.json();
    }
  });

  // Fetch confirmed bookings (for chefs)
  const { data: confirmedBookings, isLoading: loadingBookings } = useQuery({
    queryKey: ['/api/bookings/confirmed', user?.id],
    enabled: !!user && user.user_metadata?.role === 'chef',
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/bookings/confirmed?chefId=${user!.id}`);
      return response.json();
    }
  });

  // Mutation for confirming gigs
  const confirmGigMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      const response = await apiRequest("PUT", `/api/applications/${applicationId}/confirm`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Gig Confirmed",
        description: "You've successfully confirmed the gig. The business has been notified.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/applications/accepted'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings/confirmed'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to confirm gig. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const handleSignOut = async () => {
    const { error } = await signOut();
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
      navigate("/");
    }
  };

  // If not authenticated, show unauthorized message
  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-100 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8 mt-16">
          <div className="bg-white shadow-sm rounded-lg p-6 text-center">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-neutral-600 mb-4">You need to be logged in to access this page.</p>
            <Button onClick={() => navigate("/auth/signin")}>Sign In</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // If profile check is in progress, show loading
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
  
  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8 mt-16">
        <div className="bg-white shadow-sm rounded-lg p-6">
          {userRole !== "company" && (
            <>
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
            </>
          )}
          
          {userRole === "chef" && !hasProfile && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Your Chef Profile</h2>
              <div className="bg-neutral-100 p-4 rounded">
                <p className="text-center">Complete your chef profile to start receiving booking requests.</p>
                <div className="flex justify-center mt-4">
                  <Button 
                    className="bg-primary hover:bg-primary-dark text-white"
                    onClick={() => {
                      console.log("Complete Your Profile button clicked");
                      setIsChefDisclaimerModalOpen(true);
                    }}
                  >
                    Complete Your Profile
                  </Button>
                </div>
              </div>
            </div>
          )}

          {userRole === "chef" && hasProfile && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Your Chef Profile</h2>
              <div className="bg-white border border-neutral-200 rounded p-4">
                <div className="flex flex-col space-y-4">
                  <div>
                    <p className="text-green-600 font-medium mb-2">✓ Your profile is complete!</p>
                    <p className="text-neutral-600">You can now browse and apply for gigs.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <Button 
                      variant="outline"
                      onClick={() => navigate("/gigs/browse")}
                      className="w-full"
                    >
                      Browse Gigs
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => navigate("/gigs/my-applications")}
                      className="w-full"
                    >
                      Applied Gigs
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => navigate("/chef/invoices")}
                      className="flex items-center justify-center gap-2 w-full"
                    >
                      <PoundSterling className="h-4 w-4 text-green-600" />
                      My Invoices
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => navigate("/profile/payment-settings")}
                      className="w-full"
                    >
                      Payments
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => navigate("/reviews")}
                      className="w-full"
                    >
                      Reviews
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Gigs Offered to You Section (for chefs) */}
          {userRole === "chef" && hasProfile && acceptedApplications?.data && acceptedApplications.data.length > 0 && (
            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Gigs Offered to You
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-neutral-600 mb-4">
                    You've been selected for the following gigs. Please confirm your acceptance to secure your booking.
                  </p>
                  <div className="space-y-4">
                    {acceptedApplications.data.map((application: any) => (
                      <div key={application.id} className="border rounded-lg p-4 bg-green-50 border-green-200">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg text-green-800">
                              Gig Offer: {application.gig?.title || 'Gig Details'}
                            </h3>
                            <div className="flex items-center gap-4 mt-2 text-sm text-green-700">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>Applied: {application.applied_at ? format(new Date(application.applied_at), "MMM d, yyyy") : 'Date not available'}</span>
                              </div>
                              <Badge className="bg-green-600 text-white">Accepted</Badge>
                            </div>
                          </div>
                          <Button
                            onClick={() => confirmGigMutation.mutate(application.id)}
                            disabled={confirmGigMutation.isPending}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            {confirmGigMutation.isPending ? "Confirming..." : "Confirm Gig"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {userRole === "business" && !hasProfile && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Your Business Profile</h2>
              <div className="bg-neutral-100 p-4 rounded">
                <p className="text-center">Complete your business profile to start finding chefs.</p>
                <div className="flex justify-center mt-4">
                  <Button 
                    className="bg-primary hover:bg-primary-dark text-white"
                    onClick={() => setIsBusinessDisclaimerModalOpen(true)}
                  >
                    Complete Your Profile
                  </Button>
                </div>
              </div>
            </div>
          )}

          {userRole === "business" && hasProfile && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Your Business Profile</h2>
              <div className="bg-white border border-neutral-200 rounded p-4">
                <div className="flex flex-col space-y-4">
                  <div>
                    <p className="text-green-600 font-medium mb-2">✓ Your business profile is complete!</p>
                    <p className="text-neutral-600">You can now post gigs and find chefs.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                    <Button 
                      className="bg-primary hover:bg-primary-dark text-white w-full"
                      onClick={() => navigate("/gigs/create")}
                    >
                      Post a Gig
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => navigate("/gigs/manage")}
                      className="w-full"
                    >
                      Manage Gigs
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => navigate("/business/invoices")}
                      className="flex items-center justify-center gap-2 w-full"
                    >
                      <PoundSterling className="h-4 w-4 text-blue-600" />
                      Invoices
                    </Button>
                    <InviteCompanyModal
                      businessId={user.id}
                      trigger={
                        <Button 
                          variant="outline"
                          className="flex items-center justify-center gap-2 w-full"
                        >
                          <Building2 className="h-4 w-4 text-orange-600" />
                          Invite Company
                        </Button>
                      }
                    />
                    <ManageOutboundInvites
                      businessId={user.id}
                      trigger={
                        <Button
                          variant="outline"
                          className="flex items-center justify-center gap-2 w-full"
                          data-testid={`manage-invites-${user.id}`}
                        >
                          <Mail className="h-4 w-4 text-purple-600" />
                          Manage Invites
                        </Button>
                      }
                    />
                    <Button 
                      variant="outline"
                      onClick={() => navigate("/reviews")}
                      className="w-full"
                    >
                      Reviews
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}


          {userRole === "company" && (
            <CompanyDashboardSection user={user} navigate={navigate} signOut={signOut} />
          )}

          {!["chef", "business", "company"].includes(userRole) && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Create Your Profile</h2>
              <div className="bg-neutral-100 p-4 rounded">
                <p className="text-center">Choose what type of profile you want to create - Chef, Business, or Company.</p>
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

          {/* Recent Bookings Section */}
          {userRole === "chef" && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Recent Bookings</h2>
              {loadingBookings ? (
                <div className="bg-neutral-100 rounded p-8 text-center">
                  <p className="text-neutral-600">Loading bookings...</p>
                </div>
              ) : confirmedBookings && confirmedBookings.data && confirmedBookings.data.length > 0 ? (
                <div className="space-y-4">
                  {confirmedBookings.data.map((booking: any) => (
                    <Card key={booking.id} className="p-4">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{booking.gig.title}</h3>
                          <p className="text-gray-600 mb-2">{booking.business.businessName}</p>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span>{booking.gig.location}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>{format(new Date(booking.gig.startDate), 'PPP')}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>{booking.gig.startTime} - {booking.gig.endTime}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <PoundSterling className="h-4 w-4 text-blue-600" />
                              <span>£{booking.gig.payRate}/hr</span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 md:mt-0">
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            Confirmed
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="bg-neutral-100 rounded p-8 text-center">
                  <p className="text-neutral-600">You don't have any confirmed bookings yet.</p>
                </div>
              )}
            </div>
          )}

          {/* Professional Documents (for chefs only) */}
          {userRole === "chef" && (
            <div className="mt-8">
              <ProfessionalDocuments />
            </div>
          )}
        </div>
      </main>
      <Footer />
      
      {/* Chef Disclaimer Modal */}
      <ChefDisclaimerModal
        isOpen={isChefDisclaimerModalOpen}
        onClose={() => setIsChefDisclaimerModalOpen(false)}
        onConfirm={() => chefDisclaimerMutation.mutate()}
        isLoading={chefDisclaimerMutation.isPending}
      />
      
      {/* Business Disclaimer Modal */}
      <BusinessDisclaimerModal
        isOpen={isBusinessDisclaimerModalOpen}
        onAccept={() => businessDisclaimerMutation.mutate()}
        onCancel={() => setIsBusinessDisclaimerModalOpen(false)}
        isLoading={businessDisclaimerMutation.isPending}
      />
    </div>
  );
}