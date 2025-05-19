import { supabase } from './supabaseClient';

/**
 * Attempts to use Supabase storage and checks bucket access
 * This should be called when the application starts up
 */
export async function initializeStorageBuckets() {
  try {
    // Note: Creating buckets should be done in the Supabase dashboard or server-side
    // with appropriate admin privileges - this just checks if we can access storage
    
    // Test if we can access storage buckets
    const { data: buckets, error } = await supabase
      .storage
      .listBuckets();

    if (error) {
      console.log('Note: Unable to list storage buckets - this might be a permissions restriction');
      console.log('Please ensure the "chef-avatars" bucket exists in your Supabase project');
      
      // Try to upload to chef-avatars anyway - it might work if bucket exists but listing is restricted
      console.log('Will attempt uploads to chef-avatars bucket when needed');
      return;
    }
    
    // If we can list buckets, check if chef-avatars exists
    const chefAvatarsBucketExists = buckets?.some(bucket => bucket.name === 'chef-avatars');
    
    if (!chefAvatarsBucketExists) {
      console.log('Note: chef-avatars bucket not found in your Supabase project');
      console.log('Please create this bucket in the Supabase dashboard with public access enabled');
    } else {
      console.log('chef-avatars bucket found and accessible');
    }
  } catch (error) {
    console.error('Error checking storage buckets:', error);
  }
}