import { useState, useRef, ChangeEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, Trash, Image } from "lucide-react";
import { supabase } from "@/utils/supabaseClient";
import { v4 as uuidv4 } from 'uuid';
import { toast } from "@/hooks/use-toast";

interface BusinessPhotoUploadProps {
  existingPhotos: string[];
  businessId: string;
  onPhotosChange: (urls: string[]) => void;
}

export default function BusinessPhotoUpload({ existingPhotos, businessId, onPhotosChange }: BusinessPhotoUploadProps) {
  const [photos, setPhotos] = useState<string[]>(existingPhotos || []);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrls, setPreviewUrls] = useState<{ [key: string]: string }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const acceptedFileTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
  const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5MB
  const MAX_PHOTOS = 10;

  // Initialize previews from existing photos
  useEffect(() => {
    const previews: { [key: string]: string } = {};
    existingPhotos.forEach(url => {
      previews[url] = url;
    });
    setPreviewUrls(previews);
  }, [existingPhotos]);

  // Check if business-media bucket exists
  useEffect(() => {
    async function checkBucket() {
      try {
        const { data, error } = await supabase.storage.getBucket('business-media');
        if (error && !data) {
          console.log("Note: business-media bucket not found in your Supabase project");
          console.log("Please create this bucket in the Supabase dashboard with public access enabled");
        }
      } catch (err) {
        console.error("Error checking bucket:", err);
      }
    }
    
    checkBucket();
  }, []);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Clear previous errors
    setError(null);

    // Check total number of photos
    if (photos.length + files.length > MAX_PHOTOS) {
      setError(`You can upload a maximum of ${MAX_PHOTOS} gallery photos`);
      return;
    }

    setIsUploading(true);
    const newPhotos = [...photos];
    const newPreviewUrls = { ...previewUrls };
    const uploadPromises = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate file type
      if (!acceptedFileTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported image type. Please upload JPG or PNG images.`,
          variant: "destructive"
        });
        continue;
      }

      // Validate file size
      if (file.size > MAX_UPLOAD_SIZE) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds the 5MB size limit.`,
          variant: "destructive"
        });
        continue;
      }

      // Create preview for immediate display
      const objectUrl = URL.createObjectURL(file);
      const tempId = `temp-${uuidv4()}`;
      newPreviewUrls[tempId] = objectUrl;

      // Add upload promise to queue
      uploadPromises.push(
        uploadBusinessPhoto(file, businessId, tempId, newPreviewUrls, newPhotos)
      );
    }

    setPreviewUrls(newPreviewUrls);

    try {
      // Process all uploads concurrently
      await Promise.all(uploadPromises);
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Notify parent component of changes
      onPhotosChange(newPhotos);
    } catch (err: any) {
      console.error('Error handling image uploads:', err);
      setError('Some images failed to upload. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const uploadBusinessPhoto = async (
    file: File, 
    businessId: string, 
    tempId: string,
    previewUrlsRef: { [key: string]: string },
    photosRef: string[]
  ) => {
    try {
      // Generate a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${businessId}-${uuidv4()}.${fileExt}`;
      
      console.log(`Uploading business photo: ${file.name}, type: ${file.type}, size: ${(file.size / 1024).toFixed(2)} KB`);

      // Create a high-quality blob for upload
      const fileArrayBuffer = await file.arrayBuffer();
      const blob = new Blob([fileArrayBuffer], { type: file.type });
      
      // Upload to Supabase storage - Use gallery subfolder
      const filePath = `gallery/${businessId}/${fileName}`;
      
      const { data, error: uploadError } = await supabase
        .storage
        .from('business-media')
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Image upload failed: ${uploadError.message}`);
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase
        .storage
        .from('business-media')
        .getPublicUrl(filePath);

      // Replace the temporary preview with the actual URL
      delete previewUrlsRef[tempId];
      previewUrlsRef[publicUrl] = publicUrl;
      
      // Add the public URL to the photos array
      photosRef.push(publicUrl);
      
      // Update state
      setPhotos([...photosRef]);
      setPreviewUrls({ ...previewUrlsRef });
      
      console.log("Business photo uploaded successfully");
    } catch (err) {
      console.error('Error uploading business photo:', err);
      // Remove the temporary preview
      delete previewUrlsRef[tempId];
      setPreviewUrls({ ...previewUrlsRef });
      throw err;
    }
  };

  const handleDeletePhoto = async (photoUrl: string) => {
    try {
      // Extract the file path from the URL
      const filePathMatch = photoUrl.match(/\/business-media\/(.+)$/);
      
      if (!filePathMatch || !filePathMatch[1]) {
        console.error("Could not extract file path from URL:", photoUrl);
        return;
      }
      
      const filePath = decodeURIComponent(filePathMatch[1]);
      
      // Delete from Supabase storage
      const { error } = await supabase
        .storage
        .from('business-media')
        .remove([filePath]);

      if (error) {
        console.error('Error deleting photo:', error);
        throw error;
      }

      // Remove from state
      const updatedPhotos = photos.filter(url => url !== photoUrl);
      setPhotos(updatedPhotos);
      
      // Remove from previews
      const updatedPreviews = { ...previewUrls };
      delete updatedPreviews[photoUrl];
      setPreviewUrls(updatedPreviews);
      
      // Notify parent component
      onPhotosChange(updatedPhotos);
      
      toast({
        title: "Photo deleted",
        description: "The gallery photo was successfully removed."
      });
    } catch (err) {
      console.error('Error deleting photo:', err);
      toast({
        title: "Error",
        description: "Failed to delete the photo. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-col space-y-2">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Gallery Photos</h3>
          <span className="text-sm text-neutral-500">
            {photos.length}/{MAX_PHOTOS} photos
          </span>
        </div>
        
        <p className="text-sm text-neutral-500">
          Showcase your business venue, events, and atmosphere
        </p>
        
        <input
          type="file"
          accept="image/jpeg, image/png, image/jpg, image/webp"
          onChange={handleFileChange}
          className="hidden"
          ref={fileInputRef}
          disabled={isUploading || photos.length >= MAX_PHOTOS}
          multiple
        />

        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || photos.length >= MAX_PHOTOS}
          className="flex items-center w-full justify-center"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Gallery Photos
            </>
          )}
        </Button>

        {error && <p className="text-destructive text-sm">{error}</p>}
        <p className="text-xs text-neutral-500">
          Upload JPG or PNG images (max 5MB each)
        </p>
      </div>

      {Object.keys(previewUrls).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
          {Object.entries(previewUrls).map(([key, url]) => (
            <div key={key} className="relative group">
              <div className="aspect-square rounded-md overflow-hidden bg-neutral-100 border">
                <img
                  src={url}
                  alt="Gallery"
                  className="w-full h-full object-cover transition-opacity duration-200"
                  loading="lazy"
                  decoding="async"
                  style={{ imageRendering: 'auto' }}
                />

                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => handleDeletePhoto(key.startsWith('temp-') ? '' : key)}
                    className="h-8 w-8"
                    disabled={key.startsWith('temp-')}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {key.startsWith('temp-') && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {photos.length === 0 && (
        <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-md bg-neutral-50">
          <Image className="h-12 w-12 text-neutral-300 mb-2" />
          <p className="text-neutral-500 text-center">
            No gallery photos uploaded yet
          </p>
        </div>
      )}
    </div>
  );
}