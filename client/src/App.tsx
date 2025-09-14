import { Switch, Route } from "wouter";
import { queryClient, apiRequest } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { MobileMenuProvider } from "@/hooks/use-mobile-menu";
import { NotificationProvider } from "@/hooks/useNotifications";
import Home from "@/pages/Home";
import NotFound from "@/pages/not-found";
import SignIn from "@/pages/auth/SignIn";
import SignUp from "@/pages/auth/SignUp";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import CreateProfile from "@/pages/profile/CreateProfile";
import ViewProfile from "@/pages/profile/View";
import ViewChefProfile from "@/pages/profile/ViewChefProfile";
import EditProfile from "@/pages/profile/Edit";
import PaymentSettings from "@/pages/profile/PaymentSettings";
import NotificationSettings from "@/pages/profile/NotificationSettings";
import BusinessInvoices from "@/pages/BusinessInvoices";
import ChefInvoices from "@/pages/ChefInvoices";
import AdminDashboard from "@/pages/admin/Dashboard";

import { useRoute, useLocation } from "wouter";

// Gig Management Pages
import CreateGig from "@/pages/gigs/Create";
import ManageGigs from "@/pages/gigs/Manage";
import BrowseGigs from "@/pages/gigs/Browse";
import ViewGig from "@/pages/gigs/View";
import MyApplications from "@/pages/gigs/MyApplications";
import GigApplications from "@/pages/gigs/applications/GigApplications";
import Reviews from "@/pages/Reviews";

// Company Management Pages
import CreateCompany from "@/pages/company/CreateCompany";
import MyCompanies from "@/pages/company/MyCompanies";
import CompanyMembers from "@/pages/company/CompanyMembers";
import CompanySettings from "@/pages/company/CompanySettings";
import AcceptInvite from "@/pages/company/AcceptInvite";

// Wrapper components for route parameters

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth/signin" component={SignIn} />
      <Route path="/auth/signup" component={SignUp} />
      <Route path="/auth/forgot-password" component={ForgotPassword} />
      <Route path="/auth/reset-password" component={ResetPassword} />
      <Route path="/dashboard" component={Dashboard} />
      
      {/* Profile Management Routes */}
      <Route path="/profile/create" component={CreateProfile} />
      <Route path="/profile/view" component={ViewProfile} />
      <Route path="/profile/chef/:id" component={ViewChefProfile} />
      <Route path="/profile/edit" component={EditProfile} />
      <Route path="/profile/payment-settings" component={PaymentSettings} />
      <Route path="/profile/notification-settings" component={NotificationSettings} />
      <Route path="/business/invoices" component={BusinessInvoices} />
      <Route path="/chef/invoices" component={ChefInvoices} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      
      
      {/* Gig Management Routes */}
      <Route path="/gigs/create" component={CreateGig} />
      <Route path="/gigs/manage" component={ManageGigs} />
      <Route path="/gigs/browse" component={BrowseGigs} />
      <Route path="/gigs/view/:id" component={ViewGig} />
      <Route path="/gigs/my-applications" component={MyApplications} />
      <Route path="/gigs/applications/:gigId" component={GigApplications} />
      <Route path="/reviews" component={Reviews} />
      
      {/* Company Management Routes */}
      <Route path="/company/create" component={CreateCompany} />
      <Route path="/company/mine" component={MyCompanies} />
      <Route path="/company/:id/members" component={CompanyMembers} />
      <Route path="/company/:id/settings" component={CompanySettings} />
      <Route path="/company/invites/accept" component={AcceptInvite} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <NotificationProvider>
            <MobileMenuProvider>
              <Toaster />
              <Router />
            </MobileMenuProvider>
          </NotificationProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
