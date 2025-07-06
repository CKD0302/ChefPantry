import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { CheckCircle, Calendar, MapPin, PoundSterling, Clock, Bell, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProfessionalDocuments from "@/components/ProfessionalDocuments";

import { apiRequest } from "@/lib/queryClient";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  
  const userRole = user?.user_metadata?.role || "chef";
  
  // Check if profile exists using API
  const { data: profileResponse, isLoading: isCheckingProfile } = useQuery({
    queryKey: userRole === "chef" ? ["/api/profiles/chef", user?.id] : ["/api/profiles/business", user?.id],
    queryFn: () => {
      const endpoint = userRole === "chef" ? `/api/profiles/chef/${user!.id}` : `/api/profiles/business/${user!.id}`;
      return apiRequest("GET", endpoint).then(res => res.json()).catch(() => null);
    },
    enabled: !!user && (userRole === "chef" || userRole === "business")
  });
  
  const hasProfile = !!(profileResponse?.data || profileResponse?.id);
  const profileData = profileResponse?.data || profileResponse;
  const hasAcceptedDisclaimer = userRole === "chef" ? profileData?.chefDisclaimerAccepted : true;
  
  // Debug logging
  console.log("Dashboard debug:", { 
    userRole, 
    hasProfile, 
    profileData, 
    hasAcceptedDisclaimer,
    isCheckingProfile: isCheckingProfile,
    profileResponse: profileResponse
  });



  // Fetch accepted applications that need confirmation (for chefs)
  const { data: acceptedApplications, isLoading: loadingAccepted } = useQuery({
    queryKey: ['/api/applications/accepted', user?.id],
    enabled: !!user && user.user_metadata?.role === 'chef',
    queryFn: async () => {
      const response = await fetch(`/api/applications/accepted?chefId=${user!.id}`);
      if (!response.ok) throw new Error('Failed to fetch accepted applications');
      return response.json();
    }
  });

  // Fetch notifications (for businesses)
  const { data: notifications, isLoading: loadingNotifications } = useQuery({
    queryKey: ['/api/notifications', user?.id],
    enabled: !!user && user.user_metadata?.role === 'business',
    queryFn: async () => {
      const response = await fetch(`/api/notifications?recipientId=${user!.id}`);
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return response.json();
    }
  });

  // Fetch confirmed bookings (for chefs)
  const { data: confirmedBookings, isLoading: loadingBookings } = useQuery({
    queryKey: ['/api/bookings/confirmed', user?.id],
    enabled: !!user && user.user_metadata?.role === 'chef',
    queryFn: async () => {
      const response = await fetch(`/api/bookings/confirmed?chefId=${user!.id}`);
      if (!response.ok) throw new Error('Failed to fetch confirmed bookings');
      return response.json();
    }
  });

  // Mutation for confirming gigs
  const confirmGigMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      const response = await fetch(`/api/applications/${applicationId}/confirm`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to confirm gig');
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

  // Redirect chefs to disclaimer page if they haven't accepted it
  if (userRole === "chef" && !isCheckingProfile && !hasAcceptedDisclaimer) {
    navigate("/disclaimer");
    return null;
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
          
          {userRole === "chef" && !hasProfile && (
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
          )}

          {userRole === "chef" && hasProfile && (
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
                    <Button 
                      variant="outline"
                      onClick={() => navigate("/gigs/my-applications")}
                    >
                      Applied Gigs
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => navigate("/profile/payment-settings")}
                    >
                      Payments
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
                    onClick={() => navigate("/profile/create")}
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
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                  <div>
                    <p className="text-green-600 font-medium mb-2">✓ Your business profile is complete!</p>
                    <p className="text-neutral-600">You can now post gigs and find chefs.</p>
                  </div>
                  <div className="flex gap-3 mt-4 md:mt-0">
                    <Button 
                      className="bg-primary hover:bg-primary-dark text-white"
                      onClick={() => navigate("/gigs/create")}
                    >
                      Post a Gig
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => navigate("/gigs/manage")}
                    >
                      Manage Gigs
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => navigate("/business/invoices")}
                      className="flex items-center gap-2"
                    >
                      <PoundSterling className="h-4 w-4 text-blue-600" />
                      Invoices
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recent Notifications Section (for businesses) */}
          {userRole === "business" && hasProfile && (
            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-blue-600" />
                    Recent Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingNotifications ? (
                    <div className="text-center py-4">
                      <p className="text-neutral-600">Loading notifications...</p>
                    </div>
                  ) : notifications?.data && notifications.data.length > 0 ? (
                    <div className="space-y-3">
                      {notifications.data.slice(0, 5).map((notification: any) => (
                        <div key={notification.id} className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="text-sm text-blue-800 mb-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-blue-600">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  {notification.created_at ? format(new Date(notification.created_at), "MMM d, yyyy 'at' h:mm a") : 'Recently'}
                                </span>
                              </div>
                            </div>
                            {notification.link_url && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(notification.link_url)}
                                className="text-blue-600 border-blue-200 hover:bg-blue-100"
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                View Gig
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Bell className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
                      <p className="text-neutral-600">No notifications yet</p>
                      <p className="text-sm text-neutral-500">You'll see updates here when chefs confirm your gigs</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {!["chef", "business"].includes(userRole) && (
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
    </div>
  );
}