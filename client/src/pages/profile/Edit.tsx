import { useEffect, useState } from "react";
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
// ChefDocumentUpload component has been removed
import SaveChangesButton from "./SaveChangesButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ImageUpload from "@/components/ImageUpload";
import DishPhotoUpload from "@/components/DishPhotoUpload";
import BusinessLogoUpload from "@/components/BusinessLogoUpload";
import BusinessPhotoUpload from "@/components/BusinessPhotoUpload";
import { ChefTags } from "@/components/ChefTags";

// Chef profile schema
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
  // Payment method fields
  paymentMethod: z.enum(["stripe", "bank"]).default("bank"),
  stripePaymentLink: z.string().url("Must be a valid Stripe payment link").optional().or(z.literal("")),
  bankSortCode: z.string().regex(/^\d{2}-\d{2}-\d{2}$/, "Sort code must be in format XX-XX-XX").optional().or(z.literal("")),
  bankAccountNumber: z.string().regex(/^\d{8}$/, "Account number must be 8 digits").optional().or(z.literal("")),
});

// Business profile schema
const businessProfileSchema = z.object({
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  location: z.string().min(2, "Location is required"),
  profileImageUrl: z.string().optional(),
  galleryImageUrls: z.string().array().optional(),
  websiteUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  instagramUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  linkedinUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  // New fields
  venueType: z.string().optional(),
  cuisineSpecialties: z.string().optional(), // We'll handle the array in the component
  businessSize: z.string().optional(),
  isHiring: z.boolean().default(false),
  availabilityNotes: z.string().optional(),
});

type ChefProfileFormValues = z.infer<typeof chefProfileSchema>;
type BusinessProfileFormValues = z.infer<typeof businessProfileSchema>;

export default function EditProfile() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [userRole, setUserRole] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dishPhotos, setDishPhotos] = useState<string[]>([]);
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [certifications, setCertifications] = useState<string[]>([]);
  const [cuisineSpecialties, setCuisineSpecialties] = useState<string[]>([]);
  const { toast } = useToast();

  // Create forms with empty default values
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
      // Payment method defaults
      paymentMethod: "bank",
      stripePaymentLink: "",
      bankSortCode: "",
      bankAccountNumber: "",
    },
    // This allows the document upload to not interfere with form submission
    shouldUseNativeValidation: false,
  });

  const businessForm = useForm<BusinessProfileFormValues>({
    resolver: zodResolver(businessProfileSchema),
    defaultValues: {
      businessName: "",
      description: "",
      location: "",
      profileImageUrl: "",
      galleryImageUrls: [],
      websiteUrl: "",
      instagramUrl: "",
      linkedinUrl: "",
      // New fields
      venueType: "",
      cuisineSpecialties: "",
      businessSize: "",
    },
  });

  useEffect(() => {
    // Redirect if not authenticated
    if (!user) {
      navigate("/auth/signin");
      return;
    }

    // Get user role from metadata
    const role = user.user_metadata?.role || "";
    setUserRole(role);

    // Fetch profile data based on role
    if (role === "chef") {
      fetchChefProfile();
    } else if (role === "business") {
      fetchBusinessProfile();
    } else {
      // No recognized role, redirect to dashboard
      navigate("/dashboard");
      toast({
        title: "Profile Error",
        description: "You need to create a profile first.",
        variant: "destructive",
      });
    }
  }, [user, navigate, toast]);

  const fetchChefProfile = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("chef_profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        // Load skills as array
        if (Array.isArray(data.skills)) {
          setSkills(data.skills);
        }
        
        // Load languages as array if exists
        if (Array.isArray(data.languages)) {
          setLanguages(data.languages);
        }
        
        // Load certifications as array if exists
        if (Array.isArray(data.certifications)) {
          setCertifications(data.certifications);
        }
        
        // Load dish photos if they exist
        if (Array.isArray(data.dish_photos_urls)) {
          setDishPhotos(data.dish_photos_urls);
        }
          
        // Update form with existing data (convert from snake_case to camelCase)
        chefForm.reset({
          fullName: data.full_name,
          bio: data.bio,
          skills: "", // We'll handle skills with TagInput component
          experienceYears: data.experience_years,
          location: data.location,
          travelRadiusKm: data.travel_radius_km || 50,
          profileImageUrl: data.profile_image_url || "",
          instagramUrl: data.instagram_url || "",
          linkedinUrl: data.linkedin_url || "",
          portfolioUrl: data.portfolio_url || "",
          // New fields
          languages: "", // We'll handle languages with TagInput component
          certifications: "", // We'll handle certifications with TagInput component
          isAvailable: data.is_available !== false, // Default to true if not set
          // Payment method fields
          paymentMethod: data.payment_method || "bank",
          stripePaymentLink: data.stripe_payment_link || "",
          bankSortCode: data.bank_sort_code || "",
          bankAccountNumber: data.bank_account_number || "",
        });
      } else {
        // No profile found, redirect to create
        navigate("/profile/create");
        toast({
          title: "Profile Not Found",
          description: "You need to create a profile first.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching chef profile:", error);
      toast({
        title: "Error",
        description: "Failed to load your profile. Please try again later.",
        variant: "destructive",
      });
      navigate("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBusinessProfile = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("business_profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        // Load gallery photos if they exist
        if (Array.isArray(data.gallery_image_urls)) {
          setGalleryPhotos(data.gallery_image_urls);
        }
        
        // Load cuisine specialties if they exist
        if (Array.isArray(data.cuisine_specialties)) {
          setCuisineSpecialties(data.cuisine_specialties);
        }
        
        // Update form with existing data (convert from snake_case to camelCase)
        businessForm.reset({
          businessName: data.business_name,
          description: data.description,
          location: data.location,
          profileImageUrl: data.profile_image_url || "",
          galleryImageUrls: [], // We'll handle gallery photos separately with BusinessPhotoUpload component
          websiteUrl: data.website_url || "",
          instagramUrl: data.instagram_url || "",
          linkedinUrl: data.linkedin_url || "",
          // New fields
          venueType: data.venue_type || "",
          cuisineSpecialties: "", // We'll handle cuisine specialties with TagInput component
          businessSize: data.business_size || "",
          isHiring: data.is_hiring || false,
          availabilityNotes: data.availability_notes || "",
        });
      } else {
        // No profile found, redirect to create
        navigate("/profile/create");
        toast({
          title: "Profile Not Found",
          description: "You need to create a profile first.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching business profile:", error);
      toast({
        title: "Error",
        description: "Failed to load your profile. Please try again later.",
        variant: "destructive",
      });
      navigate("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const onChefSubmit = async (data: ChefProfileFormValues) => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      // Use the tag arrays from state directly instead of converting strings
      // This ensures we're using the data from our TagInput components
      
      // Convert to snake_case for Supabase
      const updateData = {
        full_name: data.fullName,
        bio: data.bio,
        skills: skills,
        experience_years: data.experienceYears,
        location: data.location,
        travel_radius_km: data.travelRadiusKm || 50,
        profile_image_url: data.profileImageUrl || null,
        instagram_url: data.instagramUrl || null,
        linkedin_url: data.linkedinUrl || null,
        portfolio_url: data.portfolioUrl || null,
        // New fields - using arrays from state directly
        languages: languages,
        certifications: certifications,
        is_available: data.isAvailable,
        // Payment method fields
        payment_method: data.paymentMethod,
        stripe_payment_link: data.paymentMethod === 'stripe' ? data.stripePaymentLink : null,
        bank_sort_code: data.paymentMethod === 'bank' ? data.bankSortCode : null,
        bank_account_number: data.paymentMethod === 'bank' ? data.bankAccountNumber : null,
        // Dish photos
        dish_photos_urls: dishPhotos,
      };
      
      const { error } = await supabase
        .from("chef_profiles")
        .update(updateData)
        .eq("id", user.id);
        
      if (error) {
        console.error("Error updating chef profile:", error.message || error);
        throw error;
      }
      
      toast({
        title: "Profile Updated",
        description: "Your chef profile has been updated successfully!",
      });
      
      navigate("/profile/view");
    } catch (error) {
      console.error("Error updating chef profile:", error);
      toast({
        title: "Error",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const onBusinessSubmit = async (data: BusinessProfileFormValues) => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      // Convert to snake_case for Supabase
      const updateData = {
        business_name: data.businessName,
        description: data.description,
        location: data.location,
        profile_image_url: data.profileImageUrl || null,
        gallery_image_urls: galleryPhotos, // Use the gallery photos from state
        website_url: data.websiteUrl || null,
        instagram_url: data.instagramUrl || null,
        linkedin_url: data.linkedinUrl || null,
        // New fields
        venue_type: data.venueType || null,
        cuisine_specialties: cuisineSpecialties, // Use the cuisine specialties from state
        business_size: data.businessSize || null,
        is_hiring: data.isHiring,
        availability_notes: data.availabilityNotes || null,
      };
      
      const { error } = await supabase
        .from("business_profiles")
        .update(updateData)
        .eq("id", user.id);
        
      if (error) {
        console.error("Error updating business profile:", error.message || error);
        throw error;
      }
      
      toast({
        title: "Profile Updated",
        description: "Your business profile has been updated successfully!",
      });
      
      navigate("/profile/view");
    } catch (error) {
      console.error("Error updating business profile:", error);
      toast({
        title: "Error",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-12 mt-16">
          <div className="max-w-3xl mx-auto flex items-center justify-center min-h-[50vh]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <h2 className="text-xl font-semibold">Loading Profile...</h2>
              <p className="text-neutral-500 mt-1">Please wait while we fetch your profile data</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12 mt-16">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Edit Profile</h1>
            <Button
              onClick={() => navigate("/profile/view")}
              variant="outline"
            >
              Cancel
            </Button>
          </div>

          {userRole === "chef" ? (
            <Card>
              <CardHeader>
                <CardTitle>Chef Profile</CardTitle>
                <CardDescription>
                  Update your profile information to showcase your skills and experience
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...chefForm}>
                  <form className="space-y-6" onSubmit={(e) => {
                    e.preventDefault();
                    onChefSubmit(chefForm.getValues());
                  }}>
                    <div className="flex flex-col items-center mb-6">
                      <h3 className="text-lg font-medium mb-4">Profile Photo</h3>
                      {user && (
                        <ImageUpload 
                          userId={user.id}
                          onUploadComplete={(url) => chefForm.setValue("profileImageUrl", url)}
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
                            <Input {...field} />
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
                              className="min-h-[120px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Tell potential clients about your culinary style and background
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={chefForm.control}
                        name="skills"
                        render={({ field }) => {
                          // Custom field handling to satisfy form validation
                          // This allows the form to validate even when using separate state
                          return (
                            <FormItem>
                              <FormLabel>Skills & Specialties</FormLabel>
                              <FormControl>
                                <ChefTags 
                                  value={skills}
                                  onChange={(newValue) => {
                                    setSkills(newValue);
                                    // Update form field with a dummy value to satisfy validation
                                    field.onChange(newValue.length > 0 ? "valid" : "");
                                  }}
                                  placeholder="Add a skill (e.g., Italian cuisine)"
                                  className="border-input"
                                />
                              </FormControl>
                              <FormDescription>
                                Add your culinary skills and specialties (press Enter or comma to add each one)
                              </FormDescription>
                              {skills.length === 0 && <p className="text-sm font-medium text-destructive">Please provide at least one skill</p>}
                              <FormMessage />
                            </FormItem>
                          );
                        }}
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
                        render={({ field }) => {
                          return (
                            <FormItem>
                              <FormLabel>Languages Spoken</FormLabel>
                              <FormControl>
                                <ChefTags 
                                  value={languages}
                                  onChange={(newValue) => {
                                    setLanguages(newValue);
                                    // Update form field with a dummy value to satisfy validation
                                    field.onChange(newValue.length > 0 ? "valid" : "");
                                  }}
                                  placeholder="Add a language (e.g., English)"
                                  className="border-input"
                                />
                              </FormControl>
                              <FormDescription>
                                Add languages you speak (press Enter or comma to add each one)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />
                      
                      <FormField
                        control={chefForm.control}
                        name="certifications"
                        render={({ field }) => {
                          return (
                            <FormItem>
                              <FormLabel>Certifications</FormLabel>
                              <FormControl>
                                <ChefTags 
                                  value={certifications}
                                  onChange={(newValue) => {
                                    setCertifications(newValue);
                                    // Update form field with a dummy value to satisfy validation
                                    field.onChange(newValue.length > 0 ? "valid" : "");
                                  }}
                                  placeholder="Add a certification (e.g., Food Hygiene Level 2)"
                                  className="border-input"
                                />
                              </FormControl>
                              <FormDescription>
                                Add your professional certifications (press Enter or comma to add each one)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
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

                    {/* Payment Method Section */}
                    <div className="space-y-6 pt-4">
                      <h3 className="text-lg font-medium">Payment Preferences</h3>
                      <p className="text-sm text-gray-500 mb-4">Choose how you'd like to receive payments from businesses</p>
                      
                      <FormField
                        control={chefForm.control}
                        name="paymentMethod"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Payment Method</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select payment method" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="bank">Bank Transfer</SelectItem>
                                <SelectItem value="stripe">Stripe Payment Link</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Conditional fields based on payment method */}
                      {chefForm.watch("paymentMethod") === "stripe" && (
                        <FormField
                          control={chefForm.control}
                          name="stripePaymentLink"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Stripe Payment Link</FormLabel>
                              <FormControl>
                                <Input placeholder="https://buy.stripe.com/abc123..." {...field} />
                              </FormControl>
                              <FormDescription>
                                Enter your Stripe payment link (e.g., from Stripe Dashboard)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {chefForm.watch("paymentMethod") === "bank" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={chefForm.control}
                            name="bankSortCode"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Sort Code</FormLabel>
                                <FormControl>
                                  <Input placeholder="12-34-56" {...field} />
                                </FormControl>
                                <FormDescription>
                                  UK bank sort code (XX-XX-XX format)
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={chefForm.control}
                            name="bankAccountNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Account Number</FormLabel>
                                <FormControl>
                                  <Input placeholder="12345678" {...field} />
                                </FormControl>
                                <FormDescription>
                                  8-digit UK bank account number
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* Dish Photos Upload Section */}
                    <div className="border rounded-lg p-6 my-6 bg-neutral-50">
                      {user && (
                        <DishPhotoUpload
                          userId={user.id}
                          existingPhotos={dishPhotos}
                          onPhotosChange={(urls) => setDishPhotos(urls)}
                        />
                      )}
                    </div>
                    
                    {/* Chef Documents Upload Section has been removed */}

                    <h3 className="text-lg font-medium">Social Media & Portfolio</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    </div>
                    
                    <FormField
                      control={chefForm.control}
                      name="portfolioUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Portfolio URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://yourportfolio.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end pt-4 space-x-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate("/profile/view")}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        className="bg-primary hover:bg-primary-dark"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          ) : userRole === "business" ? (
            <Card>
              <CardHeader>
                <CardTitle>Business Profile</CardTitle>
                <CardDescription>
                  Update your business information to help chefs understand your establishment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...businessForm}>
                  <form onSubmit={businessForm.handleSubmit(onBusinessSubmit)} className="space-y-6">
                    <h3 className="text-lg font-medium">Business Logo or Profile Picture</h3>
                    <div className="flex justify-center">
                      <FormField
                        control={businessForm.control}
                        name="profileImageUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              {user && (
                                <BusinessLogoUpload
                                  businessId={user.id}
                                  existingImageUrl={field.value}
                                  onUploadComplete={(url) => field.onChange(url)}
                                />
                              )}
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={businessForm.control}
                      name="businessName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
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
                              className="min-h-[120px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Describe your business, cuisine style, and what makes it unique
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={businessForm.control}
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
                      control={businessForm.control}
                      name="isHiring"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Currently hiring chefs</FormLabel>
                            <FormDescription>
                              Turn this on if you're looking to hire chefs right now
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
                    
                    <FormField
                      control={businessForm.control}
                      name="availabilityNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Availability Notes</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe your typical shift patterns or availability requirements (e.g., 'Looking for weekend evening staff' or 'Flexible shifts available')"
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            This information helps chefs understand your scheduling needs
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={businessForm.control}
                        name="venueType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Venue Type</FormLabel>
                            <FormControl>
                              <select 
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={field.value}
                                onChange={field.onChange}
                              >
                                <option value="">Select venue type</option>
                                <option value="restaurant">Restaurant</option>
                                <option value="food_truck">Food Truck</option>
                                <option value="bar">Bar</option>
                                <option value="cafe">Café</option>
                                <option value="hotel">Hotel</option>
                                <option value="catering">Catering Service</option>
                                <option value="private_events">Private Events Venue</option>
                                <option value="other">Other</option>
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={businessForm.control}
                        name="businessSize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Business Size</FormLabel>
                            <FormControl>
                              <select 
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={field.value}
                                onChange={field.onChange}
                              >
                                <option value="">Select business size</option>
                                <option value="1-10">1–10 employees</option>
                                <option value="11-50">11–50 employees</option>
                                <option value="51+">51+ employees</option>
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={businessForm.control}
                      name="cuisineSpecialties"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cuisine Specialties</FormLabel>
                          <FormControl>
                            <ChefTags
                              value={cuisineSpecialties}
                              onChange={setCuisineSpecialties}
                              placeholder="Add cuisine (e.g., Italian, Sushi)"
                              className="min-h-10"
                            />
                          </FormControl>
                          <FormDescription>
                            Add your cuisine specialties. Common examples: Italian, French, Japanese, Mexican, Vegan, BBQ, Seafood, Pastry
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Business Gallery Photos Upload Section */}
                    <div className="border rounded-lg p-6 my-6 bg-neutral-50">
                      <h3 className="text-lg font-medium mb-4">Gallery Photos</h3>
                      {user && (
                        <BusinessPhotoUpload
                          businessId={user.id}
                          existingPhotos={galleryPhotos}
                          onPhotosChange={(urls) => setGalleryPhotos(urls)}
                        />
                      )}
                    </div>
                    
                    <h3 className="text-lg font-medium">Business Links</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    </div>
                    
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
                    
                    <div className="flex justify-end pt-4 space-x-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate("/profile/view")}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        className="bg-primary hover:bg-primary-dark"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p>Please select your profile type from the dashboard first.</p>
                <Button 
                  onClick={() => navigate("/dashboard")}
                  className="mt-4"
                >
                  Go to Dashboard
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}