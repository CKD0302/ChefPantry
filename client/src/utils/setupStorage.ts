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
    
    // If chef-documents bucket doesn't exist, we can't create it from the client
    // This would need to be created in Supabase dashboard
    const chefDocumentsBucket = buckets?.find(b => b.name === 'chef-documents');
    
    if (!chefDocumentsBucket) {
      console.warn("chef-documents bucket does not exist in your Supabase project");
      console.warn("Please create this bucket manually in the Supabase dashboard with public access enabled");
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