import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { supabase } from "@/utils/supabaseClient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { useToast } from "@/hooks/use-toast";
import ImageUpload from "@/components/ImageUpload";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ChefDisclaimerModal } from "@/components/ChefDisclaimerModal";

// Define the chef profile schema
const chefProfileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  bio: z.string().min(10, "Bio must be at least 10 characters"),
  skills: z.string().min(2, "Please provide at least one skill"),
  experienceYears: z.coerce.number().min(0, "Experience must be a positive number"),
  location: z.string().min(2, "Location is required"),
  travelRadiusKm: z.coerce.number().min(0, "Travel radius must be a positive number").optional(),
  profileImageUrl: z.string().optional(),
  instagramUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  linkedinUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  portfolioUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  // New fields
  languages: z.string().optional(),
  certifications: z.string().optional(),
  isAvailable: z.boolean().default(true),
});

// Define the business profile schema
const businessProfileSchema = z.object({
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  location: z.string().min(2, "Location is required"),
  websiteUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  instagramUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  linkedinUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type ChefProfileFormValues = z.infer<typeof chefProfileSchema>;
type BusinessProfileFormValues = z.infer<typeof businessProfileSchema>;

export default function CreateProfile() {
  const { user } = useAuth();
  // Get the user role from metadata
  const userRole = user?.user_metadata?.role || "chef";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isDisclaimerModalOpen, setIsDisclaimerModalOpen] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const queryClient = useQueryClient();

  // Check disclaimer acceptance for chefs
  const { data: chefProfile } = useQuery({
    queryKey: ["/api/profiles/chef", user?.id],
    queryFn: () => {
      return apiRequest("GET", `/api/profiles/chef/${user!.id}`)
        .then(res => res.json())
        .catch(() => null);
    },
    enabled: !!user && userRole === "chef",
  });

  // Initialize chef profile form
  const chefForm = useForm<ChefProfileFormValues>({
    resolver: zodResolver(chefProfileSchema),
    defaultValues: {
      fullName: "",
      bio: "",
      skills: "",
      experienceYears: 0,
      location: "",
      travelRadiusKm: 50,
      profileImageUrl: "",
      instagramUrl: "",
      linkedinUrl: "",
      portfolioUrl: "",
      // New fields with default values
      languages: "",
      certifications: "",
      isAvailable: true,
    },
  });

  // Initialize business profile form
  const businessForm = useForm<BusinessProfileFormValues>({
    resolver: zodResolver(businessProfileSchema),
    defaultValues: {
      businessName: "",
      description: "",
      location: "",
      websiteUrl: "",
      instagramUrl: "",
      linkedinUrl: "",
    },
  });

  // Handle disclaimer acceptance
  const handleDisclaimerAccept = async () => {
    if (!user?.id) return;
    
    try {
      const response = await apiRequest("POST", `/api/profiles/chef/${user.id}/accept-disclaimer`);
      if (response.ok) {
        setDisclaimerAccepted(true);
        setIsDisclaimerModalOpen(false);
        toast({
          title: "Disclaimer Accepted",
          description: "You can now create your profile.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to accept disclaimer. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle chef profile submission
  const onChefSubmit = async (data: ChefProfileFormValues) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a profile",
        variant: "destructive",
      });
      return;
    }

    // Check if disclaimer has been accepted
    if (!disclaimerAccepted) {
      setIsDisclaimerModalOpen(true);
      return;
    }

    setIsSubmitting(true);

    try {
      // Transform skills string to array
      const skillsArray = data.skills.split(",").map(skill => skill.trim());

      const profileData = {
        id: user.id,
        fullName: data.fullName,
        bio: data.bio,
        skills: skillsArray,
        experienceYears: data.experienceYears,
        location: data.location,
        travelRadiusKm: data.travelRadiusKm || 50,
        profileImageUrl: data.profileImageUrl || null,
        instagramUrl: data.instagramUrl || null,
        linkedinUrl: data.linkedinUrl || null,
        portfolioUrl: data.portfolioUrl || null,
        chefDisclaimerAccepted: true, // Since disclaimer was accepted to reach this point
        chefDisclaimerAcceptedAt: new Date().toISOString(),
      };

      let profileCreated = false;
      let apiError = null;

      // Try the API first
      try {
        // Call API to create profile
        const response = await fetch("/api/profiles/chef", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(profileData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          apiError = new Error(errorData.message || "Failed to create chef profile");
          console.warn("API failed, attempting direct Supabase insert as fallback");
        } else {
          console.log("Chef profile created successfully via API");
          profileCreated = true;
        }
      } catch (error) {
        apiError = error;
        console.warn("API failed, attempting direct Supabase insert as fallback");
      }

      // If API failed, try direct Supabase insert as fallback
      if (!profileCreated) {
        try {
          // Parse languages and certifications into arrays if provided
          const languagesArray = data.languages 
            ? data.languages.split(",").map(lang => lang.trim()) 
            : [];
          
          const certificationsArray = data.certifications 
            ? data.certifications.split(",").map(cert => cert.trim()) 
            : [];

          // Convert to Supabase field naming convention (snake_case)
          const { error } = await supabase.from("chef_profiles").insert({
            id: user.id,
            full_name: data.fullName,
            bio: data.bio,
            skills: skillsArray,
            experience_years: data.experienceYears,
            location: data.location,
            travel_radius_km: data.travelRadiusKm || 50,
            profile_image_url: data.profileImageUrl || null,
            dish_photos_urls: [],
            intro_video_url: null,
            instagram_url: data.instagramUrl || null,
            linkedin_url: data.linkedinUrl || null,
            portfolio_url: data.portfolioUrl || null,
            // New fields
            languages: languagesArray,
            certifications: certificationsArray,
            is_available: data.isAvailable
          });

          if (error) {
            console.error("Supabase insert error:", error.message || error);
            throw error;
          }
          
          console.log("Chef profile created successfully via Supabase direct insert");
          profileCreated = true;
        } catch (supabaseError) {
          console.error("Supabase insert error:", supabaseError);
          if (apiError) {
            console.error("All profile creation methods failed:", apiError);
            throw apiError;
          }
          throw supabaseError;
        }
      }

      // Update user metadata in Supabase to track user type
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { role: "chef" }
      });

      if (metadataError) {
        console.error("Error updating user metadata:", metadataError.message || metadataError);
      }

      toast({
        title: "Profile Created",
        description: "Your chef profile has been created successfully!",
      });

      // Invalidate cache to ensure Dashboard updates immediately
      queryClient.invalidateQueries({ queryKey: ["/api/profiles/chef", user.id] });

      // Add a short delay to ensure data is persisted before redirecting
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (error) {
      console.error("Error creating chef profile:", error);
      toast({
        title: "Error",
        description: "Failed to create your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle business profile submission
  const onBusinessSubmit = async (data: BusinessProfileFormValues) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a profile",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare the profile data
      const profileData = {
        id: user.id,
        businessName: data.businessName,
        description: data.description,
        location: data.location,
        websiteUrl: data.websiteUrl || null,
        instagramUrl: data.instagramUrl || null,
        linkedinUrl: data.linkedinUrl || null,
      };

      let profileCreated = false;
      let apiError = null;

      // Try the API first
      try {
        // Call API to create profile
        const response = await fetch("/api/profiles/business", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(profileData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          apiError = new Error(errorData.message || "Failed to create business profile");
          console.warn("API failed, attempting direct Supabase insert as fallback");
        } else {
          console.log("Business profile created successfully via API");
          profileCreated = true;
        }
      } catch (error) {
        apiError = error;
        console.warn("API failed, attempting direct Supabase insert as fallback");
      }

      // If API failed, try direct Supabase insert as fallback
      if (!profileCreated) {
        try {
          // Convert to Supabase field naming convention (snake_case)
          const { error } = await supabase.from("business_profiles").insert({
            id: user.id,
            business_name: data.businessName,
            description: data.description,
            location: data.location,
            website_url: data.websiteUrl || null,
            instagram_url: data.instagramUrl || null,
            linkedin_url: data.linkedinUrl || null
          });

          if (error) {
            console.error("Supabase insert error:", error.message || error);
            throw error;
          }
          
          console.log("Business profile created successfully via Supabase direct insert");
          profileCreated = true;
        } catch (supabaseError) {
          console.error("Supabase insert error:", supabaseError);
          if (apiError) {
            console.error("All profile creation methods failed:", apiError);
            throw apiError;
          }
          throw supabaseError;
        }
      }

      // Update user metadata in Supabase to track user type
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { role: "business" }
      });

      if (metadataError) {
        console.error("Error updating user metadata:", metadataError.message || metadataError);
      }

      toast({
        title: "Profile Created",
        description: "Your business profile has been created successfully!",
      });

      // Invalidate cache to ensure Dashboard updates immediately
      queryClient.invalidateQueries({ queryKey: ["/api/profiles/business", user.id] });

      // Add a short delay to ensure data is persisted before redirecting
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (error) {
      console.error("Error creating business profile:", error);
      toast({
        title: "Error",
        description: "Failed to create your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler for chef profile image upload
  const handleChefProfileImageUpload = (url: string) => {
    chefForm.setValue("profileImageUrl", url);
  };

  // Redirect if user is not logged in
  useEffect(() => {
    if (!user) {
      navigate("/auth/signin");
      return;
    }
  }, [user, navigate]);

  return (
    <div className="container mx-auto max-w-4xl py-12 px-4">
      <h1 className="text-3xl font-bold text-center mb-6">Create Your Profile</h1>
      <p className="text-center mb-8 text-gray-600">
        Please complete your {userRole === "chef" ? "chef" : "business"} profile to get started.
      </p>

      {userRole === "chef" ? (
        // CHEF PROFILE FORM
        <Card>
          <CardHeader>
            <CardTitle>Chef Profile</CardTitle>
            <CardDescription>
              Create your chef profile to showcase your skills and experience to potential clients.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...chefForm}>
              <form onSubmit={chefForm.handleSubmit(onChefSubmit)} className="space-y-6">
                <div className="flex flex-col items-center mb-6">
                  <h3 className="text-lg font-medium mb-4">Profile Photo</h3>
                  {user && (
                    <ImageUpload 
                      userId={user.id}
                      onUploadComplete={handleChefProfileImageUpload}
                      existingImageUrl={chefForm.getValues().profileImageUrl}
                    />
                  )}
                </div>

                <FormField
                  control={chefForm.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={chefForm.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Tell potential clients about yourself, your cooking style, and your background..."
                          className="min-h-[120px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={chefForm.control}
                    name="skills"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Skills & Specialties</FormLabel>
                        <FormControl>
                          <Input placeholder="Italian cuisine, Pastry, Vegan, etc. (comma-separated)" {...field} />
                        </FormControl>
                        <FormDescription>
                          Enter your culinary skills separated by commas
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={chefForm.control}
                    name="experienceYears"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Years of Experience</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={chefForm.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="City, State" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={chefForm.control}
                    name="travelRadiusKm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Travel Radius (km)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormDescription>
                          How far are you willing to travel for work?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* New fields: Languages and Certifications */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <FormField
                    control={chefForm.control}
                    name="languages"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Languages Spoken</FormLabel>
                        <FormControl>
                          <Input placeholder="English, Spanish, French, etc. (comma-separated)" {...field} />
                        </FormControl>
                        <FormDescription>
                          Enter languages you speak, separated by commas
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={chefForm.control}
                    name="certifications"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Certifications</FormLabel>
                        <FormControl>
                          <Input placeholder="Food Hygiene Level 2, First Aid, etc. (comma-separated)" {...field} />
                        </FormControl>
                        <FormDescription>
                          List your professional certifications, separated by commas
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Availability toggle */}
                <FormField
                  control={chefForm.control}
                  name="isAvailable"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 my-6">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Available for Work</FormLabel>
                        <FormDescription>
                          Toggle on if you are currently available for new opportunities
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <h3 className="text-lg font-medium pt-4">Social Media & Portfolio</h3>
                <p className="text-sm text-gray-500 mb-4">Optional links to your online presence</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={chefForm.control}
                    name="instagramUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instagram URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://instagram.com/username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={chefForm.control}
                    name="linkedinUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LinkedIn URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://linkedin.com/in/username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={chefForm.control}
                    name="portfolioUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Portfolio/Website URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://yourwebsite.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Creating Profile..." : "Create Chef Profile"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      ) : (
        // BUSINESS PROFILE FORM
        <Card>
          <CardHeader>
            <CardTitle>Business Profile</CardTitle>
            <CardDescription>
              Create your business profile to connect with talented chefs for your events and venues.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...businessForm}>
              <form onSubmit={businessForm.handleSubmit(onBusinessSubmit)} className="space-y-6">
                <FormField
                  control={businessForm.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your Business Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={businessForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Tell chefs about your business, venue types, typical events, cuisine preferences..."
                          className="min-h-[120px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={businessForm.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Location</FormLabel>
                      <FormControl>
                        <Input placeholder="City, State" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <h3 className="text-lg font-medium pt-4">Web Presence</h3>
                <p className="text-sm text-gray-500 mb-4">Optional links to your online presence</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={businessForm.control}
                    name="websiteUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://yourbusiness.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={businessForm.control}
                    name="instagramUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instagram URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://instagram.com/yourbusiness" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={businessForm.control}
                    name="linkedinUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LinkedIn URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://linkedin.com/company/yourbusiness" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Creating Profile..." : "Create Business Profile"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
      
      {/* Chef Disclaimer Modal */}
      <ChefDisclaimerModal
        isOpen={isDisclaimerModalOpen}
        onClose={() => setIsDisclaimerModalOpen(false)}
        onConfirm={handleDisclaimerAccept}
        isLoading={false}
      />
    </div>
  );
}