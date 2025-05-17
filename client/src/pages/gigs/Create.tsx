import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Define the gig creation schema
const gigSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  gigDate: z.string().nonempty("Date is required"),
  startTime: z.string().nonempty("Start time is required"),
  endTime: z.string().nonempty("End time is required"),
  location: z.string().min(3, "Location is required"),
  payRate: z.coerce.number().min(1, "Pay rate must be a positive number"),
  role: z.string().min(2, "Role is required"),
  venueType: z.string().min(2, "Venue type is required"),
  dressCode: z.string().optional(),
  serviceExpectations: z.string().optional(),
  kitchenDetails: z.string().optional(),
  equipmentProvided: z.string().optional(),
  benefits: z.string().optional(),
  tipsAvailable: z.boolean().default(false),
});

type GigFormValues = z.infer<typeof gigSchema>;

// Role options for the select field
const roleOptions = [
  { value: "head_chef", label: "Head Chef" },
  { value: "sous_chef", label: "Sous Chef" },
  { value: "pastry_chef", label: "Pastry Chef" },
  { value: "line_cook", label: "Line Cook" },
  { value: "prep_cook", label: "Prep Cook" },
  { value: "kitchen_porter", label: "Kitchen Porter" },
  { value: "dishwasher", label: "Dishwasher" },
  { value: "server", label: "Server" },
  { value: "bartender", label: "Bartender" },
  { value: "barista", label: "Barista" },
  { value: "host", label: "Host/Hostess" },
  { value: "other", label: "Other" },
];

// Venue type options for the select field
const venueTypeOptions = [
  { value: "fine_dining", label: "Fine Dining" },
  { value: "casual_dining", label: "Casual Dining" },
  { value: "cafe", label: "Café" },
  { value: "bistro", label: "Bistro" },
  { value: "pub", label: "Pub/Gastropub" },
  { value: "bar", label: "Bar/Lounge" },
  { value: "hotel", label: "Hotel" },
  { value: "catering", label: "Catering" },
  { value: "food_truck", label: "Food Truck" },
  { value: "private_event", label: "Private Event" },
  { value: "other", label: "Other" },
];

export default function CreateGig() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Initialize the form
  const form = useForm<GigFormValues>({
    resolver: zodResolver(gigSchema),
    defaultValues: {
      title: "",
      gigDate: format(new Date(), "yyyy-MM-dd"),
      startTime: "09:00",
      endTime: "17:00",
      location: "",
      payRate: 0,
      role: "",
      venueType: "",
      dressCode: "",
      serviceExpectations: "",
      kitchenDetails: "",
      equipmentProvided: "",
      benefits: "",
      tipsAvailable: false,
    },
  });

  // Handle form submission
  const onSubmit = async (data: GigFormValues) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to post a gig",
        variant: "destructive",
      });
      navigate("/auth/signin");
      return;
    }

    setIsSubmitting(true);

    try {
      // Format the data for the API
      const gigData = {
        createdBy: user.id,
        title: data.title,
        gigDate: data.gigDate,
        startTime: data.startTime,
        endTime: data.endTime,
        location: data.location,
        payRate: data.payRate,
        role: data.role,
        venueType: data.venueType,
        dressCode: data.dressCode || null,
        serviceExpectations: data.serviceExpectations || null,
        kitchenDetails: data.kitchenDetails || null,
        equipmentProvided: data.equipmentProvided ? data.equipmentProvided.split(',').map(item => item.trim()) : [],
        benefits: data.benefits ? data.benefits.split(',').map(item => item.trim()) : [],
        tipsAvailable: data.tipsAvailable,
        isActive: true,
      };

      // Send the request to the API
      const response = await fetch("/api/gigs/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(gigData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create gig");
      }

      toast({
        title: "Success",
        description: "Your gig has been posted successfully!",
      });

      // Redirect to the gig management page
      navigate("/gigs/manage");
    } catch (error) {
      console.error("Error creating gig:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create gig",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12 mt-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Post a New Gig</h1>
          <p className="text-neutral-600 mb-8">
            Create a new gig posting to find the perfect chef for your establishment.
          </p>

          <Card>
            <CardHeader>
              <CardTitle>Gig Details</CardTitle>
              <CardDescription>
                Fill out the form below with the details of your gig
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gig Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Sous Chef Needed for Weekend Event" {...field} />
                        </FormControl>
                        <FormDescription>
                          Choose a clear title that summarizes the position
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="gigDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {roleOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
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
                      name="venueType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Venue Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select venue type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {venueTypeOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input placeholder="Address or area" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="payRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pay Rate ($ per hour)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" step="0.01" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="dressCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dress Code (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Black pants, white shirt, closed-toe shoes" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="serviceExpectations"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Expectations (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your service standards and expectations..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="kitchenDetails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kitchen Details (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your kitchen setup, equipment, etc..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="equipmentProvided"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Equipment Provided (Optional, comma-separated)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Knives, Chef coat, Apron" {...field} />
                        </FormControl>
                        <FormDescription>
                          List equipment you will provide, separated by commas
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="benefits"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Benefits (Optional, comma-separated)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Meals provided, Transportation allowance" {...field} />
                        </FormControl>
                        <FormDescription>
                          List any benefits, separated by commas
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tipsAvailable"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Tips Available</FormLabel>
                          <FormDescription>
                            Check if tips are available for this position
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary-dark"
                    size="lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Posting Gig..." : "Post Gig"}
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