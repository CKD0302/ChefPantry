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

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      // Create a preview
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);

      // Generate a unique filename using UUID to avoid overwrites
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${uuidv4()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase
        .storage
        .from('chef-avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true // Changed to true to allow replacing existing files
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Image upload failed: ${uploadError.message}`);
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase
        .storage
        .from('chef-avatars')
        .getPublicUrl(filePath);

      // Pass the URL to parent component
      onUploadComplete(publicUrl);
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image. Please try again.');
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

  const getInitials = (userId: string) => {
    return "CH";
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <Avatar className="w-32 h-32 border-2 border-primary">
          {previewUrl ? (
            <AvatarImage src={previewUrl} alt="Profile" />
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
          accept="image/*"
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
              Uploading...
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