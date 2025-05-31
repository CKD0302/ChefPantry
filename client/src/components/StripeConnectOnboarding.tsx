import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CreditCard, CheckCircle, AlertCircle, ExternalLink } from "lucide-react";

interface StripeConnectOnboardingProps {
  chefId: string;
}

interface StripeAccountStatus {
  hasAccount: boolean;
  accountConnected: boolean;
  accountId?: string;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
}

export default function StripeConnectOnboarding({ chefId }: StripeConnectOnboardingProps) {
  const { toast } = useToast();
  const [isOnboarding, setIsOnboarding] = useState(false);

  // Query Stripe account status
  const { data: stripeStatus, isLoading } = useQuery<StripeAccountStatus>({
    queryKey: ["/api/stripe/connect/status", chefId],
    queryFn: () => apiRequest("GET", `/api/stripe/connect/status/${chefId}`).then(res => res.json()),
  });

  // Create Stripe account mutation
  const createAccountMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/stripe/connect/account", { chefId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stripe/connect/status", chefId] });
      toast({
        title: "Account Created",
        description: "Your Stripe account has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create Stripe account",
        variant: "destructive",
      });
    },
  });

  // Generate onboarding link mutation
  const onboardingMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/stripe/connect/onboarding", { chefId }),
    onSuccess: (data: any) => {
      const response = data.json();
      response.then((result: any) => {
        if (result.onboardingUrl) {
          setIsOnboarding(true);
          window.open(result.onboardingUrl, '_blank');
          toast({
            title: "Onboarding Started",
            description: "Complete your setup in the new window to start receiving payments.",
          });
        }
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create onboarding link",
        variant: "destructive",
      });
    },
  });

  const handleCreateAccount = () => {
    createAccountMutation.mutate();
  };

  const handleStartOnboarding = () => {
    onboardingMutation.mutate();
  };

  const handleRefreshStatus = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/stripe/connect/status", chefId] });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = () => {
    if (!stripeStatus?.hasAccount) {
      return <Badge variant="outline">Not Set Up</Badge>;
    }
    if (!stripeStatus.accountConnected) {
      return <Badge variant="secondary">Setup In Progress</Badge>;
    }
    if (stripeStatus.chargesEnabled && stripeStatus.payoutsEnabled) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
    }
    return <Badge variant="secondary">Pending Review</Badge>;
  };

  const getStatusIcon = () => {
    if (!stripeStatus?.hasAccount || !stripeStatus.accountConnected) {
      return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
    if (stripeStatus.chargesEnabled && stripeStatus.payoutsEnabled) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    return <AlertCircle className="h-5 w-5 text-yellow-500" />;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CreditCard className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>Payment Setup</CardTitle>
              <CardDescription>
                Set up your account to receive payments for completed gigs
              </CardDescription>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
          {getStatusIcon()}
          <div className="flex-1">
            <h4 className="font-medium">
              {!stripeStatus?.hasAccount ? "Payment Account Required" :
               !stripeStatus.accountConnected ? "Complete Setup Required" :
               stripeStatus.chargesEnabled && stripeStatus.payoutsEnabled ? "Ready to Receive Payments" :
               "Account Under Review"}
            </h4>
            <p className="text-sm text-gray-600">
              {!stripeStatus?.hasAccount ? "Create a payment account to start receiving payments from businesses." :
               !stripeStatus.accountConnected ? "Complete your account setup to start receiving payments." :
               stripeStatus.chargesEnabled && stripeStatus.payoutsEnabled ? "Your account is ready to receive payments for completed gigs." :
               "Your account is being reviewed. You'll be able to receive payments once approved."}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {!stripeStatus?.hasAccount && (
            <Button 
              onClick={handleCreateAccount} 
              disabled={createAccountMutation.isPending}
              className="w-full"
            >
              {createAccountMutation.isPending ? "Creating Account..." : "Create Payment Account"}
            </Button>
          )}

          {stripeStatus?.hasAccount && !stripeStatus.accountConnected && (
            <Button 
              onClick={handleStartOnboarding} 
              disabled={onboardingMutation.isPending}
              className="w-full"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {onboardingMutation.isPending ? "Opening Setup..." : "Complete Account Setup"}
            </Button>
          )}

          {stripeStatus?.accountConnected && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Charges:</span>
                  <span className={stripeStatus.chargesEnabled ? "text-green-600" : "text-yellow-600"}>
                    {stripeStatus.chargesEnabled ? "Enabled" : "Pending"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payouts:</span>
                  <span className={stripeStatus.payoutsEnabled ? "text-green-600" : "text-yellow-600"}>
                    {stripeStatus.payoutsEnabled ? "Enabled" : "Pending"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {isOnboarding && (
            <Button 
              variant="outline" 
              onClick={handleRefreshStatus}
              className="w-full"
            >
              Refresh Status
            </Button>
          )}
        </div>

        {stripeStatus?.accountConnected && stripeStatus.chargesEnabled && stripeStatus.payoutsEnabled && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h4 className="font-medium text-green-800">Ready for Payments</h4>
            </div>
            <p className="text-sm text-green-700 mt-1">
              You can now receive direct payments for completed gigs. Payments will be automatically processed when you submit invoices.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}