import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { MobileMenuProvider } from "@/hooks/use-mobile-menu";
import Home from "@/pages/Home";
import NotFound from "@/pages/not-found";
import SignIn from "@/pages/auth/SignIn";
import SignUp from "@/pages/auth/SignUp";
import Dashboard from "@/pages/Dashboard";
import CreateProfile from "@/pages/profile/CreateProfile";
import AdminDashboard from "@/pages/admin/Dashboard";

// Gig Management Pages
import CreateGig from "@/pages/gigs/Create";
import ManageGigs from "@/pages/gigs/Manage";
import BrowseGigs from "@/pages/gigs/Browse";
import ViewGig from "@/pages/gigs/View";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth/signin" component={SignIn} />
      <Route path="/auth/signup" component={SignUp} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/profile/create" component={CreateProfile} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      
      {/* Gig Management Routes */}
      <Route path="/gigs/create" component={CreateGig} />
      <Route path="/gigs/manage" component={ManageGigs} />
      <Route path="/gigs/browse" component={BrowseGigs} />
      <Route path="/gigs/view/:id" component={ViewGig} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <MobileMenuProvider>
            <Toaster />
            <Router />
          </MobileMenuProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
