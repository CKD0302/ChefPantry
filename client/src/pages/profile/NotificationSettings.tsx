import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Bell, Mail, MessageSquare, Calendar, DollarSign, Star, Settings } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface NotificationPreferences {
  // Application & Booking notifications
  chefAppliedApp: boolean;
  chefAppliedEmail: boolean;
  applicationAcceptedApp: boolean;
  applicationAcceptedEmail: boolean;
  applicationRejectedApp: boolean;
  applicationRejectedEmail: boolean;
  gigConfirmedApp: boolean;
  gigConfirmedEmail: boolean;
  gigDeclinedApp: boolean;
  gigDeclinedEmail: boolean;
  // Invoice notifications
  invoiceSubmittedApp: boolean;
  invoiceSubmittedEmail: boolean;
  invoicePaidApp: boolean;
  invoicePaidEmail: boolean;
  // Review notifications
  reviewReminderApp: boolean;
  reviewReminderEmail: boolean;
  reviewSubmittedApp: boolean;
  reviewSubmittedEmail: boolean;
  // Gig management notifications
  gigPostedApp: boolean;
  gigPostedEmail: boolean;
  gigUpdatedApp: boolean;
  gigUpdatedEmail: boolean;
  gigCancelledApp: boolean;
  gigCancelledEmail: boolean;
  gigDeadlineApp: boolean;
  gigDeadlineEmail: boolean;
  // System notifications
  profileUpdateApp: boolean;
  profileUpdateEmail: boolean;
  welcomeApp: boolean;
  welcomeEmail: boolean;
  platformUpdateApp: boolean;
  platformUpdateEmail: boolean;
}

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
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    try {
      const response = await apiRequest("GET", "/api/notifications/preferences");
      const data = await response.json();
      
      if (data.data) {
        setPreferences(data.data);
      }
    } catch (error) {
      console.error("Error loading notification preferences:", error);
      // Use default preferences if none exist
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const response = await apiRequest("PUT", "/api/notifications/preferences", preferences);
      const data = await response.json();
      
      toast({
        title: "Settings Saved",
        description: "Your notification preferences have been updated successfully.",
      });
      
      setPreferences(data.data);
    } catch (error) {
      console.error("Error saving notification preferences:", error);
      toast({
        title: "Error",
        description: "Failed to save notification preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key: keyof NotificationPreferences, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (loading) {
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

  const NotificationSection = ({ 
    title, 
    description, 
    icon: Icon, 
    items 
  }: { 
    title: string; 
    description: string; 
    icon: any; 
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

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">Notification Settings</h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-2">
              Manage how you receive notifications from Chef Pantry. You can control both in-app and email notifications for different types of activities.
            </p>
          </div>

          <div className="space-y-6">
            <NotificationSection
              title="Applications & Bookings"
              description="Get notified about gig applications, acceptances, and confirmations"
              icon={MessageSquare}
              items={[
                {
                  id: "chefApplied",
                  appKey: "chefAppliedApp",
                  emailKey: "chefAppliedEmail",
                  label: "Chef Applications",
                  description: "When a chef applies to your gig posting"
                },
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
                  description: "When your application is rejected"
                },
                {
                  id: "gigConfirmed",
                  appKey: "gigConfirmedApp",
                  emailKey: "gigConfirmedEmail",
                  label: "Gig Confirmed",
                  description: "When a chef confirms an accepted gig"
                },
                {
                  id: "gigDeclined",
                  appKey: "gigDeclinedApp",
                  emailKey: "gigDeclinedEmail",
                  label: "Gig Declined", 
                  description: "When a chef declines an accepted gig"
                }
              ]}
            />

            <NotificationSection
              title="Invoices & Payments"
              description="Stay updated on invoice submissions and payment confirmations"
              icon={DollarSign}
              items={[
                {
                  id: "invoiceSubmitted",
                  appKey: "invoiceSubmittedApp",
                  emailKey: "invoiceSubmittedEmail",
                  label: "Invoice Submitted",
                  description: "When a chef submits an invoice to your business"
                },
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

            <NotificationSection
              title="Gig Management"
              description="Notifications about gig postings, updates, and cancellations"
              icon={Calendar}
              items={[
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
                  description: "When gigs are cancelled"
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
                disabled={saving}
                data-testid="save-preferences-button"
                className="min-w-32"
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}