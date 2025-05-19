import { useState, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Upload, X } from "lucide-react";
import { supabase } from "@/utils/supabaseClient";
import { v4 as uuidv4 } from 'uuid';

interface ImageUploadProps {
  onUploadComplete: (url: string) => void;
  existingImageUrl?: string | null;
  userId: string;
}

export default function ImageUpload({ onUploadComplete, existingImageUrl, userId }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingImageUrl || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const acceptedFileTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Clear previous errors
    setError(null);

    // Validate file type
    if (!acceptedFileTypes.includes(file.type)) {
      setError("Please upload a JPG or PNG image");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
      return;
    }

    setIsUploading(true);

    try {
      // Create a preview of the file for immediate display
      // Using direct object URL for preview to maintain full quality
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // Generate a unique filename using UUID to avoid overwrites
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${uuidv4()}.${fileExt}`;
      
      // Log image details for debugging
      console.log(`Uploading image: ${file.name}, type: ${file.type}, size: ${(file.size / 1024).toFixed(2)} KB`);

      // Try a different approach for uploading that might preserve quality better
      // Use a Blob with explicit type to prevent quality loss during upload
      const fileArrayBuffer = await file.arrayBuffer();
      const blob = new Blob([fileArrayBuffer], { type: file.type });
      
      // Set specific options to prevent compression
      const { data, error: uploadError } = await supabase
        .storage
        .from('chef-avatars')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type,
          duplex: 'half'  // Additional option that might help with data transfer
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Image upload failed: ${uploadError.message}`);
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase
        .storage
        .from('chef-avatars')
        .getPublicUrl(fileName);

      // Pass the URL to parent component
      onUploadComplete(publicUrl);
      
      console.log("Image uploaded successfully to Supabase storage");
    } catch (err: any) {
      console.error('Error uploading image:', err);
      
      // Provide more specific error messages based on error type
      let errorMessage = 'Failed to upload image. Please try again.';
      
      if (err.message?.includes('bucket')) {
        errorMessage = 'Storage bucket access issue. Please check your Supabase configuration.';
      } else if (err.message?.includes('permission') || err.message?.includes('access')) {
        errorMessage = 'Permission denied. You may not have access to upload files.';
      } else if (err.message?.includes('network') || err.message?.includes('connection')) {
        errorMessage = 'Network error. Please check your internet connection.';
      }
      
      setError(errorMessage);
      
      // Reset the preview if upload fails
      if (existingImageUrl) {
        setPreviewUrl(existingImageUrl);
      } else {
        setPreviewUrl(null);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    onUploadComplete('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Generate initials for avatar fallback
  const getInitials = (userId: string) => {
    return "CH";
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <Avatar className="w-32 h-32 border-2 border-primary">
          {previewUrl ? (
            <AvatarImage 
              src={previewUrl} 
              alt="Profile" 
              className="object-cover" 
              style={{ imageRendering: 'auto' }}
            />
          ) : (
            <AvatarFallback className="bg-primary/10 text-primary text-xl">
              {getInitials(userId)}
            </AvatarFallback>
          )}
        </Avatar>

        {previewUrl && (
          <Button 
            size="icon"
            variant="destructive" 
            className="absolute -top-2 -right-2 rounded-full w-6 h-6"
            onClick={handleRemoveImage}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      <div className="flex flex-col items-center space-y-2">
        <input
          type="file"
          accept="image/jpeg, image/png, image/jpg, image/webp"
          onChange={handleFileChange}
          className="hidden"
          ref={fileInputRef}
          disabled={isUploading}
        />

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              {previewUrl ? "Change Photo" : "Upload Photo"}
            </>
          )}
        </Button>

        {error && <p className="text-destructive text-sm">{error}</p>}
        <p className="text-xs text-neutral-500">
          Upload a profile picture (JPG or PNG, max 5MB)
        </p>
      </div>
    </div>
  );
}