import { useState, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Upload, X } from "lucide-react";
import { supabase } from "@/utils/supabaseClient";
import { v4 as uuidv4 } from 'uuid';

interface BusinessLogoUploadProps {
  onUploadComplete: (url: string) => void;
  existingImageUrl?: string | null;
  businessId: string;
}

export default function BusinessLogoUpload({ onUploadComplete, existingImageUrl, businessId }: BusinessLogoUploadProps) {
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
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // Generate a fixed filename for the logo
      const fileExt = file.name.split('.').pop();
      const fileName = `logo/${businessId}.${fileExt}`;
      
      console.log(`Uploading logo: ${file.name}, type: ${file.type}, size: ${(file.size / 1024).toFixed(2)} KB`);

      // Convert file to blob for upload
      const fileArrayBuffer = await file.arrayBuffer();
      const blob = new Blob([fileArrayBuffer], { type: file.type });
      
      // Upload to business-media bucket
      const { data, error: uploadError } = await supabase
        .storage
        .from('business-media')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Logo upload failed: ${uploadError.message}`);
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase
        .storage
        .from('business-media')
        .getPublicUrl(fileName);

      // Pass the URL to parent component
      onUploadComplete(publicUrl);
      
      console.log("Logo uploaded successfully to Supabase storage");
    } catch (err: any) {
      console.error('Error uploading logo:', err);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to upload logo. Please try again.';
      
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
  const getInitials = (businessId: string) => {
    return "BIZ";
  };

  return (
    <div className="w-full">
      <div className="flex flex-col w-full space-y-4">
        <div className="relative mx-auto">
          {previewUrl ? (
            <div className="w-24 h-24 rounded-full overflow-hidden border border-neutral-200 shadow-sm">
              <img 
                src={previewUrl} 
                alt="Business Logo" 
                className="w-full h-full object-cover"
                loading="eager"
                decoding="async"
                style={{ 
                  imageRendering: 'auto',
                  objectPosition: 'center'
                }}
              />
            </div>
          ) : (
            <Avatar className="w-24 h-24 border border-neutral-200 shadow-sm">
              <AvatarFallback className="bg-primary/10 text-primary text-xl">
                {getInitials(businessId)}
              </AvatarFallback>
            </Avatar>
          )}

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
            className="flex items-center gap-2 px-3 py-1.5"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                {previewUrl ? "Change Logo" : "Upload Logo"}
              </>
            )}
          </Button>

          {error && <p className="text-destructive text-sm">{error}</p>}
          <p className="text-xs text-neutral-500">
            Upload a business logo (JPG or PNG, max 5MB)
          </p>
        </div>
      </div>
    </div>
  );
}