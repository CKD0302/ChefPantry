import { supabase } from "./supabaseClient";

/**
 * Setup storage buckets for the application
 * This should be called during application initialization
 */
export async function setupStorageBuckets() {
  try {
    // Check if chef-documents bucket exists
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error("Error checking storage buckets:", error);
      return;
    }
    
    const chefDocumentsBucket = buckets?.find(b => b.name === 'chef-documents');
    
    if (!chefDocumentsBucket) {
      console.warn("chef-documents bucket does not exist in your Supabase project");
      // Attempt to create the bucket - this may require admin privileges
      try {
        const { data, error: createError } = await supabase.storage.createBucket('chef-documents', {
          public: true,
          fileSizeLimit: 10485760, // 10MB in bytes
          allowedMimeTypes: ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        });
        
        if (createError) {
          console.error("Failed to create chef-documents bucket:", createError);
          console.warn("Please create this bucket manually in the Supabase dashboard with public access enabled");
        } else {
          console.log("Successfully created chef-documents bucket");
        }
      } catch (createErr) {
        console.error("Error creating chef-documents bucket:", createErr);
        console.warn("Please create this bucket manually in the Supabase dashboard with public access enabled");
      }
    } else {
      console.log("chef-documents bucket exists");
    }
  } catch (err) {
    console.error("Error setting up storage buckets:", err);
  }
}

/**
 * Configure public access for a storage bucket
 * This is used for testing only, in production this should be done through the Supabase dashboard
 */
export async function ensurePublicAccess() {
  // This would require admin privileges and should be done in Supabase dashboard
  console.log("Public access should be configured in the Supabase dashboard");
}