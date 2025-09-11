import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Bell, Mail, MessageSquare, Calendar, DollarSign, Star, Settings, LucideIcon } from "lucide-react";
import { NotificationPreferences } from "@shared/schema";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";


const defaultPreferences: NotificationPreferences = {
  // Application & Booking notifications
  chefAppliedApp: true,
  chefAppliedEmail: true,
  applicationAcceptedApp: true,
  applicationAcceptedEmail: true,
  applicationRejectedApp: true,
  applicationRejectedEmail: false,
  gigConfirmedApp: true,
  gigConfirmedEmail: true,
  gigDeclinedApp: true,
  gigDeclinedEmail: true,
  // Invoice notifications
  invoiceSubmittedApp: true,
  invoiceSubmittedEmail: true,
  invoicePaidApp: true,
  invoicePaidEmail: true,
  // Review notifications
  reviewReminderApp: true,
  reviewReminderEmail: false,
  reviewSubmittedApp: true,
  reviewSubmittedEmail: true,
  // Gig management notifications
  gigPostedApp: true,
  gigPostedEmail: false,
  gigUpdatedApp: true,
  gigUpdatedEmail: false,
  gigCancelledApp: true,
  gigCancelledEmail: true,
  gigDeadlineApp: true,
  gigDeadlineEmail: false,
  // System notifications
  profileUpdateApp: true,
  profileUpdateEmail: false,
  welcomeApp: true,
  welcomeEmail: true,
  platformUpdateApp: true,
  platformUpdateEmail: false,
};

export default function NotificationSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  
  // Get user role from metadata (same pattern as other components)
  const userRole = user?.user_metadata?.role || null;

  // Fetch notification preferences using useQuery (always called, enabled only when user exists)
  const {
    data: preferencesData,
    isLoading,
    error: queryError,
  } = useQuery<{ data: NotificationPreferences }>({
    queryKey: ["notification-preferences", user?.id || "no-user"],
    queryFn: async () => {
      if (!user?.id) throw new Error("No user");
      const response = await apiRequest("GET", "/api/notifications/preferences");
      if (!response.ok) {
        throw new Error(`Failed to fetch preferences: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!user?.id,
    retry: 1,
  });

  // Update mutation with cache invalidation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (updatedPreferences: NotificationPreferences) => {
      const response = await apiRequest("PUT", "/api/notifications/preferences", updatedPreferences);
      if (!response.ok) {
        throw new Error(`Failed to update preferences: ${response.status}`);
      }
      return response.json();
    },
    onSuccess: (data) => {
      // Update local state
      if (data.data) {
        setPreferences(data.data);
      }
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["notification-preferences", user.id] });
      
      toast({
        title: "Settings Saved",
        description: "Your notification preferences have been updated successfully.",
      });
    },
    onError: (error) => {
      console.error("Error saving notification preferences:", error);
      toast({
        title: "Error",
        description: "Failed to save notification preferences. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Initialize preferences from query data
  const currentPreferences = preferencesData?.data || defaultPreferences;
  
  // Update preferences state when query data changes
  if (preferencesData?.data && JSON.stringify(preferences) !== JSON.stringify(preferencesData.data)) {
    setPreferences(preferencesData.data);
  }

  const savePreferences = () => {
    updatePreferencesMutation.mutate(preferences);
  };

  const updatePreference = (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // If not authenticated, show unauthorized message
  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-neutral-800 shadow-sm rounded-lg p-6 text-center">
              <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
              <p className="text-neutral-600 dark:text-neutral-400 mb-4">You need to be logged in to access notification settings.</p>
              <Button onClick={() => navigate("/auth/signin")} data-testid="signin-button">Sign In</Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Show loading state while fetching preferences
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-neutral-200 dark:bg-neutral-800 rounded mb-6"></div>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Show error state if query failed
  if (queryError) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-neutral-800 shadow-sm rounded-lg p-6 text-center">
              <h1 className="text-2xl font-bold mb-4">Error Loading Preferences</h1>
              <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                Failed to load your notification preferences. Please try refreshing the page.
              </p>
              <Button onClick={() => window.location.reload()} data-testid="refresh-button">
                Refresh Page
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const NotificationSection = ({ 
    title, 
    description, 
    icon: Icon, 
    items 
  }: { 
    title: string; 
    description: string; 
    icon: LucideIcon; 
    items: Array<{ id: string; appKey: keyof NotificationPreferences; emailKey: keyof NotificationPreferences; label: string; description: string }> 
  }) => (
    <Card data-testid={`notification-section-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">{description}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {items.map((item) => (
          <div key={item.id} className="space-y-3">
            <div>
              <h4 className="font-medium">{item.label}</h4>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">{item.description}</p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="h-4 w-4 text-neutral-500" />
                <Label htmlFor={`${item.id}-app`} className="text-sm">App notifications</Label>
              </div>
              <Switch
                id={`${item.id}-app`}
                data-testid={`switch-${item.id}-app`}
                checked={preferences[item.appKey]}
                onCheckedChange={(checked) => updatePreference(item.appKey, checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-neutral-500" />
                <Label htmlFor={`${item.id}-email`} className="text-sm">Email notifications</Label>
              </div>
              <Switch
                id={`${item.id}-email`}
                data-testid={`switch-${item.id}-email`}
                checked={preferences[item.emailKey]}
                onCheckedChange={(checked) => updatePreference(item.emailKey, checked)}
              />
            </div>
            <Separator />
          </div>
        ))}
      </CardContent>
    </Card>
  );

  const toggleAllNotifications = (enable: boolean) => {
    const allKeys = Object.keys(defaultPreferences) as Array<keyof NotificationPreferences>;
    const newPreferences = { ...preferences };
    
    allKeys.forEach(key => {
      newPreferences[key] = enable;
    });
    
    setPreferences(newPreferences);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <Navbar />
      <div className="container mx-auto px-4 pt-20 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">Notification Settings</h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-2">
              Manage how you receive notifications from Chef Pantry. You can control both in-app and email notifications for different types of activities.
            </p>
          </div>

          {/* Toggle All Controls */}
          <div className="mb-8 p-4 bg-white dark:bg-neutral-800 rounded-lg shadow-sm border">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="font-medium text-lg">Quick Actions</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Enable or disable all notifications at once</p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => toggleAllNotifications(true)}
                  className="text-green-700 border-green-200 hover:bg-green-50"
                  data-testid="toggle-all-on"
                >
                  Enable All
                </Button>
                <Button
                  variant="outline"
                  onClick={() => toggleAllNotifications(false)}
                  className="text-red-700 border-red-200 hover:bg-red-50"
                  data-testid="toggle-all-off"
                >
                  Disable All
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Applications & Bookings - Role-specific */}
            <NotificationSection
              title="Applications & Bookings"
              description={userRole === "business" ? "Get notified about chef applications and confirmations" : "Get notified about application responses and gig confirmations"}
              icon={MessageSquare}
              items={userRole === "business" ? [
                {
                  id: "chefApplied",
                  appKey: "chefAppliedApp",
                  emailKey: "chefAppliedEmail",
                  label: "Chef Applications",
                  description: "When a chef applies to your gig posting"
                },
                {
                  id: "gigConfirmed",
                  appKey: "gigConfirmedApp",
                  emailKey: "gigConfirmedEmail",
                  label: "Gig Confirmed",
                  description: "When a chef confirms their accepted gig"
                },
                {
                  id: "gigDeclined",
                  appKey: "gigDeclinedApp",
                  emailKey: "gigDeclinedEmail",
                  label: "Gig Declined", 
                  description: "When a chef declines their accepted gig"
                }
              ] : [
                {
                  id: "applicationAccepted",
                  appKey: "applicationAcceptedApp", 
                  emailKey: "applicationAcceptedEmail",
                  label: "Application Accepted",
                  description: "When your application is accepted by a business"
                },
                {
                  id: "applicationRejected",
                  appKey: "applicationRejectedApp",
                  emailKey: "applicationRejectedEmail", 
                  label: "Application Rejected",
                  description: "When your application is rejected by a business"
                }
              ]}
            />

            {/* Invoices & Payments - Role-specific */}
            <NotificationSection
              title="Invoices & Payments"
              description={userRole === "business" ? "Get notified when chefs submit invoices" : "Get notified about invoice payments"}
              icon={DollarSign}
              items={userRole === "business" ? [
                {
                  id: "invoiceSubmitted",
                  appKey: "invoiceSubmittedApp",
                  emailKey: "invoiceSubmittedEmail",
                  label: "Invoice Submitted",
                  description: "When a chef submits an invoice to your business"
                }
              ] : [
                {
                  id: "invoicePaid",
                  appKey: "invoicePaidApp",
                  emailKey: "invoicePaidEmail",
                  label: "Invoice Paid",
                  description: "When your invoice has been marked as paid"
                }
              ]}
            />

            <NotificationSection
              title="Reviews & Feedback"
              description="Manage notifications about reviews and feedback requests"
              icon={Star}
              items={[
                {
                  id: "reviewReminder",
                  appKey: "reviewReminderApp",
                  emailKey: "reviewReminderEmail",
                  label: "Review Reminders",
                  description: "Reminders to leave reviews after completed gigs"
                },
                {
                  id: "reviewSubmitted",
                  appKey: "reviewSubmittedApp",
                  emailKey: "reviewSubmittedEmail",
                  label: "New Reviews",
                  description: "When someone leaves a review for you"
                }
              ]}
            />

            {/* Gig Management - Role-specific */}
            <NotificationSection
              title="Gig Management"
              description={userRole === "business" ? "Manage notifications for your gig postings" : "Stay updated on available gigs and deadlines"}
              icon={Calendar}
              items={userRole === "business" ? [
                {
                  id: "gigUpdated",
                  appKey: "gigUpdatedApp",
                  emailKey: "gigUpdatedEmail",
                  label: "Your Gig Updates",
                  description: "When your posted gigs are updated"
                },
                {
                  id: "gigCancelled",
                  appKey: "gigCancelledApp",
                  emailKey: "gigCancelledEmail",
                  label: "Gig Cancellations",
                  description: "When your gigs are cancelled"
                },
                {
                  id: "gigDeadline",
                  appKey: "gigDeadlineApp",
                  emailKey: "gigDeadlineEmail",
                  label: "Gig Deadline Reminders",
                  description: "Reminders about upcoming deadlines for your gigs"
                }
              ] : [
                {
                  id: "gigPosted",
                  appKey: "gigPostedApp",
                  emailKey: "gigPostedEmail",
                  label: "New Gig Opportunities",
                  description: "When new gigs are posted that match your preferences"
                },
                {
                  id: "gigUpdated",
                  appKey: "gigUpdatedApp",
                  emailKey: "gigUpdatedEmail",
                  label: "Gig Updates",
                  description: "When gigs you've applied to are updated"
                },
                {
                  id: "gigCancelled",
                  appKey: "gigCancelledApp",
                  emailKey: "gigCancelledEmail",
                  label: "Gig Cancellations",
                  description: "When gigs you've applied to are cancelled"
                },
                {
                  id: "gigDeadline",
                  appKey: "gigDeadlineApp",
                  emailKey: "gigDeadlineEmail",
                  label: "Deadline Reminders",
                  description: "Reminders about upcoming gig deadlines"
                }
              ]}
            />

            <NotificationSection
              title="System & Platform"
              description="Platform updates, profile changes, and welcome messages"
              icon={Settings}
              items={[
                {
                  id: "profileUpdate",
                  appKey: "profileUpdateApp",
                  emailKey: "profileUpdateEmail",
                  label: "Profile Updates",
                  description: "Confirmations when your profile is updated"
                },
                {
                  id: "welcome",
                  appKey: "welcomeApp",
                  emailKey: "welcomeEmail",
                  label: "Welcome Messages",
                  description: "Welcome messages and onboarding tips"
                },
                {
                  id: "platformUpdate",
                  appKey: "platformUpdateApp",
                  emailKey: "platformUpdateEmail",
                  label: "Platform Updates",
                  description: "Important platform announcements and feature updates"
                }
              ]}
            />

            <div className="flex justify-end pt-6">
              <Button 
                onClick={savePreferences} 
                disabled={updatePreferencesMutation.isPending}
                data-testid="save-preferences-button"
                className="min-w-32"
              >
                {updatePreferencesMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}