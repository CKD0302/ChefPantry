import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Building2, ArrowLeft, Settings } from "lucide-react";

const updateCompanySchema = z.object({
  name: z.string().min(2, "Company name must be at least 2 characters"),
  description: z.string().optional(),
});

type UpdateCompanyForm = z.infer<typeof updateCompanySchema>;

export default function CompanySettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/company/:id/settings");
  const queryClient = useQueryClient();
  const companyId = params?.id;

  // Fetch company details
  const { data: company, isLoading: loadingCompany } = useQuery({
    queryKey: ["company", companyId],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/company/${companyId}`);
      if (!response.ok) throw new Error("Failed to fetch company");
      return response.json();
    },
    enabled: !!companyId && !!user?.id,
  });

  const form = useForm<UpdateCompanyForm>({
    resolver: zodResolver(updateCompanySchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Update form when company data loads
  useState(() => {
    if (company?.data) {
      form.reset({
        name: company.data.name || "",
        description: company.data.description || "",
      });
    }
  });

  const updateCompanyMutation = useMutation({
    mutationFn: async (data: UpdateCompanyForm) => {
      const response = await apiRequest("PUT", `/api/company/${companyId}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Company Updated",
        description: "Your company settings have been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["company", companyId] });
      queryClient.invalidateQueries({ queryKey: ["/api/company/mine"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update company settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UpdateCompanyForm) => {
    updateCompanyMutation.mutate(data);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-100 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8 mt-16">
          <div className="bg-white shadow-sm rounded-lg p-6 text-center">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-neutral-600 mb-4">You need to be logged in to view this page.</p>
            <Button onClick={() => navigate("/auth/signin")}>Sign In</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!match || !companyId) {
    return (
      <div className="min-h-screen bg-neutral-100 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8 mt-16">
          <div className="bg-white shadow-sm rounded-lg p-6 text-center">
            <h1 className="text-2xl font-bold mb-4">Invalid Company</h1>
            <p className="text-neutral-600 mb-4">The company ID is invalid.</p>
            <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (loadingCompany) {
    return (
      <div className="min-h-screen bg-neutral-100 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8 mt-16">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 rounded mb-6"></div>
            <div className="h-64 bg-neutral-200 rounded"></div>
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
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard")}
              className="mb-4"
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold tracking-tight">Company Settings</h1>
            </div>
            <p className="text-neutral-600">
              Update your company information and preferences.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter your company name"
                            data-testid="input-company-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Describe your company and what services you provide"
                            rows={4}
                            data-testid="input-company-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-4 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate("/dashboard")}
                      className="flex-1"
                      data-testid="button-cancel"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={updateCompanyMutation.isPending}
                      className="flex-1"
                      data-testid="button-save-settings"
                    >
                      {updateCompanyMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}