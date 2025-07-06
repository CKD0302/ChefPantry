import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { apiRequest } from "@/lib/queryClient";

export default function DisclaimerPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [agreed, setAgreed] = useState(false);

  const disclaimerMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/profiles/chef/${user!.id}/accept-disclaimer`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Disclaimer Accepted",
        description: "Thank you! You can now access all chef features.",
      });
      // Invalidate cache to ensure dashboard updates
      queryClient.invalidateQueries({ queryKey: ["/api/profiles/chef", user?.id] });
      navigate("/dashboard");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to accept disclaimer. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAccept = () => {
    if (!agreed) {
      toast({
        title: "Agreement Required",
        description: "Please check the box to confirm you have read and agree to the disclaimer.",
        variant: "destructive",
      });
      return;
    }
    disclaimerMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8 mt-16">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-neutral-900">
                Chef Disclaimer Agreement
              </CardTitle>
              <CardDescription>
                Please read and accept this disclaimer before accessing chef features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-neutral-50 p-6 rounded-lg border">
                <h3 className="text-lg font-semibold mb-4">Important Notice for Chefs</h3>
                <div className="space-y-4 text-sm text-neutral-700">
                  <p>
                    <strong>Independent Contractor Status:</strong> By using this platform, you acknowledge that you are an independent contractor and not an employee of Chef Pantry or any business that hires you through our platform.
                  </p>
                  
                  <p>
                    <strong>Professional Responsibility:</strong> You are solely responsible for:
                  </p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Maintaining all required food safety certifications and licenses</li>
                    <li>Following all local health and safety regulations</li>
                    <li>Providing your own professional insurance coverage</li>
                    <li>Ensuring the quality and safety of all food preparation</li>
                    <li>Professional conduct and punctuality for all bookings</li>
                  </ul>

                  <p>
                    <strong>Tax Obligations:</strong> You are responsible for reporting and paying all applicable taxes on income earned through this platform. Chef Pantry will provide necessary tax documentation as required by law.
                  </p>

                  <p>
                    <strong>Platform Usage:</strong> This platform facilitates connections between chefs and businesses. Chef Pantry is not responsible for the outcome of any booking or the actions of any party involved in a booking arrangement.
                  </p>

                  <p>
                    <strong>Payment Terms:</strong> Payment processing is handled through our secure payment system. You agree to our standard payment terms and fee structure as outlined in our Terms of Service.
                  </p>

                  <p>
                    <strong>Limitation of Liability:</strong> Chef Pantry's liability is limited to the technical provision of the platform. We are not liable for any damages, losses, or disputes that may arise from chef-business interactions.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Checkbox
                  id="disclaimer-agreement"
                  checked={agreed}
                  onCheckedChange={(checked) => setAgreed(checked as boolean)}
                  className="mt-1"
                />
                <label 
                  htmlFor="disclaimer-agreement" 
                  className="text-sm text-neutral-700 cursor-pointer"
                >
                  I have read, understood, and agree to the above disclaimer. I acknowledge my responsibilities as an independent contractor and agree to comply with all applicable laws and regulations.
                </label>
              </div>

              <div className="flex justify-center pt-4">
                <Button
                  onClick={handleAccept}
                  disabled={!agreed || disclaimerMutation.isPending}
                  className="bg-primary hover:bg-primary-dark text-white px-8 py-2"
                >
                  {disclaimerMutation.isPending ? "Processing..." : "Accept and Continue"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}