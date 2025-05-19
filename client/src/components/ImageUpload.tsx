import { useState, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Upload, X } from "lucide-react";

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
      // Create a data URL from the file (works without server storage)
      const reader = new FileReader();
      
      // Create a promise to handle the asynchronous file reading
      const dataUrlPromise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Failed to read file'));
          }
        };
        reader.onerror = () => reject(reader.error);
      });
      
      // Start reading the file as a data URL
      reader.readAsDataURL(file);
      
      // Wait for the file to be read
      const dataUrl = await dataUrlPromise;
      
      // Create a local preview
      setPreviewUrl(dataUrl);
      
      // Pass the data URL to parent component
      onUploadComplete(dataUrl);
      
      console.log("Image processed successfully");
    } catch (err: any) {
      console.error('Error processing image:', err);
      setError('Failed to process image. Please try again.');
      
      // Reset the preview if processing fails
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