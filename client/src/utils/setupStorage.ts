import { supabase } from './supabaseClient';

/**
 * Attempts to use Supabase storage and checks bucket access
 * This should be called when the application starts up
 */
export async function initializeStorageBuckets() {
  try {
    // Instead of trying to list all buckets (which requires admin rights),
    // we'll check each bucket individually using the from().list() method
    const requiredBuckets = [
      'chef-avatars',
      'business-media',
      'chef-dishes',
      'chef-documents'
    ];
    
    console.log('Checking Supabase storage buckets...');
    
    // Test access to each required bucket
    for (const bucketName of requiredBuckets) {
      try {
        const { data, error } = await supabase.storage.from(bucketName).list('', {
          limit: 1 // We only need to check access, not load all files
        });
        
        if (error) {
          console.log(`⚠️ ${bucketName} bucket issue: ${error.message}`);
          console.log(`Please ensure the "${bucketName}" bucket exists in your Supabase project with public access`);
        } else {
          console.log(`✓ ${bucketName} bucket is accessible`);
        }
      } catch (bucketError) {
        console.error(`Error checking ${bucketName} bucket:`, bucketError);
      }
    }
    
    // Verify Supabase connection
    console.log(`Connected to Supabase storage`);
  } catch (error) {
    console.error('Error initializing storage buckets:', error);
  }
}