import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, CheckCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const investorInterestFormSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  postcode: z.string().min(3, "Postcode is required"),
  country: z.string().default("UK"),
  investmentInterest: z.string().min(1, "Please select an investment range"),
  investorType: z.string().optional(),
  notes: z.string().optional(),
});

type InvestorInterestFormData = z.infer<typeof investorInterestFormSchema>;

const INVESTMENT_RANGES = [
  { value: "5k-10k", label: "£5,000 - £10,000" },
  { value: "10k-25k", label: "£10,000 - £25,000" },
  { value: "25k-50k", label: "£25,000 - £50,000" },
  { value: "50k-100k", label: "£50,000 - £100,000" },
  { value: "100k+", label: "£100,000+" },
];

const INVESTOR_TYPES = [
  { value: "angel", label: "Angel Investor" },
  { value: "vc", label: "Venture Capital" },
  { value: "family-office", label: "Family Office" },
  { value: "hnwi", label: "High Net Worth Individual" },
  { value: "institutional", label: "Institutional Investor" },
  { value: "other", label: "Other" },
];

export default function InvestorInterest() {
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<InvestorInterestFormData>({
    resolver: zodResolver(investorInterestFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      postcode: "",
      country: "UK",
      investmentInterest: "",
      investorType: "",
      notes: "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: InvestorInterestFormData) => {
      const response = await apiRequest("POST", "/api/investor-interest", data);
      return response.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Registration Successful",
        description: "Thank you for registering your interest. We will be in touch soon.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit your interest. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InvestorInterestFormData) => {
    submitMutation.mutate(data);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-12 mt-16">
          <div className="max-w-2xl mx-auto">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-8 pb-8 text-center">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-green-800 mb-2">Thank You!</h2>
                <p className="text-green-700">
                  Your expression of interest has been received. Our team will review your submission and be in touch soon.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12 mt-16">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Investor Registration</CardTitle>
              <CardDescription>
                Register your interest in investing with Chef Pantry
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-6 bg-green-50 border-green-200">
                <Info className="h-4 w-4 text-green-700" />
                <AlertDescription className="text-green-800">
                  <strong>Investor Registration Notice</strong><br />
                  Chef Pantry intends to seek SEIS advance assurance. The details you provide will 
                  be used to register expressions of interest and, if applicable, to support SEIS-related 
                  submissions and communications. Submitting this form does not constitute an offer or 
                  commitment to invest.
                </AlertDescription>
              </Alert>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="John Smith" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="john@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="+44 7700 900000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address *</FormLabel>
                        <FormControl>
                          <Input placeholder="123 High Street" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City *</FormLabel>
                          <FormControl>
                            <Input placeholder="London" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="postcode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Postcode *</FormLabel>
                          <FormControl>
                            <Input placeholder="SW1A 1AA" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input placeholder="UK" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="investmentInterest"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Investment Interest *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select range" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {INVESTMENT_RANGES.map((range) => (
                                <SelectItem key={range.value} value={range.value}>
                                  {range.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="investorType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Investor Type (optional)</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {INVESTOR_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Any additional information..." 
                            rows={4}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={submitMutation.isPending}
                  >
                    {submitMutation.isPending ? "Submitting..." : "Register Interest"}
                  </Button>
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
