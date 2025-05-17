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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth/signin" component={SignIn} />
      <Route path="/auth/signup" component={SignUp} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/profile/create" component={CreateProfile} />
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
