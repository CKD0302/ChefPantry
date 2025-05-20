import { useState, useRef, ChangeEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  Upload, 
  Trash, 
  FileIcon, 
  FileText, 
  File, 
  FileImage,
  Download
} from "lucide-react";
import { supabase } from "@/utils/supabaseClient";
import { v4 as uuidv4 } from 'uuid';
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";

interface ChefDocument {
  id: string;
  chef_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
}

interface ChefDocumentUploadProps {
  chefId: string;
}

export default function ChefDocumentUpload({ chefId }: ChefDocumentUploadProps) {
  const [documents, setDocuments] = useState<ChefDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const acceptedFileTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
    "image/jpg",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain"
  ];
  
  const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10MB

  useEffect(() => {
    fetchDocuments();
    checkBucket();
  }, [chefId]);

  async function checkBucket() {
    try {
      const { data, error } = await supabase.storage.getBucket('chef-documents');
      if (error && !data) {
        console.log("Note: chef-documents bucket not found in your Supabase project");
        console.log("Please create this bucket in the Supabase dashboard with public access enabled");
      }
    } catch (err) {
      console.error("Error checking bucket:", err);
    }
  }

  async function fetchDocuments() {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('chef_documents')
        .select('*')
        .eq('chef_id', chefId)
        .order('uploaded_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setDocuments(data || []);
    } catch (err: any) {
      console.error('Error fetching documents:', err);
      setError(err.message || 'Failed to load documents');
      toast({
        title: "Error",
        description: "Failed to load your documents. Please try refreshing the page.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Clear previous errors
    setError(null);
    setIsUploading(true);

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate file type
      if (!acceptedFileTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported file type.`,
          variant: "destructive"
        });
        continue;
      }

      // Validate file size
      if (file.size > MAX_UPLOAD_SIZE) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds the 10MB size limit.`,
          variant: "destructive"
        });
        continue;
      }

      try {
        await uploadDocument(file);
      } catch (err: any) {
        console.error('Error uploading document:', err);
        toast({
          title: "Upload failed",
          description: err.message || "Failed to upload document",
          variant: "destructive"
        });
      }
    }

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    setIsUploading(false);
    // Refresh document list
    fetchDocuments();
  };

  const uploadDocument = async (file: File) => {
    // Generate a unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `documents/${chefId}/${fileName}`;
    
    try {
      // Create a high-quality blob for upload
      const fileArrayBuffer = await file.arrayBuffer();
      const blob = new Blob([fileArrayBuffer], { type: file.type });
      
      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('chef-documents')
        .upload(filePath, blob, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type
        });

      if (uploadError) {
        throw new Error(`Document upload failed: ${uploadError.message}`);
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase
        .storage
        .from('chef-documents')
        .getPublicUrl(filePath);

      // Determine file type category
      let fileType = 'document';
      if (file.type.includes('pdf')) {
        fileType = 'pdf';
      } else if (file.type.includes('image')) {
        fileType = 'image';
      } else if (file.type.includes('word')) {
        fileType = 'word';
      } else if (file.type.includes('excel') || file.type.includes('spreadsheet')) {
        fileType = 'spreadsheet';
      } else if (file.type.includes('text')) {
        fileType = 'text';
      }

      // Insert document record into database
      const { error: insertError } = await supabase
        .from('chef_documents')
        .insert({
          chef_id: chefId,
          file_name: file.name,
          file_url: publicUrl,
          file_type: fileType,
          file_size: file.size
        });

      if (insertError) {
        throw new Error(`Failed to save document record: ${insertError.message}`);
      }

      toast({
        title: "Document uploaded",
        description: `${file.name} has been uploaded successfully.`,
      });

    } catch (err) {
      console.error('Error in document upload:', err);
      throw err;
    }
  };

  const handleDeleteDocument = async (document: ChefDocument) => {
    try {
      // Extract the file path from the URL
      const filePathMatch = document.file_url.match(/\/chef-documents\/(.+)$/);
      
      if (!filePathMatch || !filePathMatch[1]) {
        console.error("Could not extract file path from URL:", document.file_url);
        return;
      }
      
      const filePath = decodeURIComponent(filePathMatch[1]);
      
      // Delete from Supabase storage
      const { error: storageError } = await supabase
        .storage
        .from('chef-documents')
        .remove([filePath]);

      if (storageError) {
        throw new Error(`Failed to delete file: ${storageError.message}`);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('chef_documents')
        .delete()
        .eq('id', document.id);

      if (dbError) {
        throw new Error(`Failed to delete document record: ${dbError.message}`);
      }

      // Update local state
      setDocuments(documents.filter(doc => doc.id !== document.id));
      
      toast({
        title: "Document deleted",
        description: `${document.file_name} has been removed.`
      });
    } catch (err: any) {
      console.error('Error deleting document:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to delete the document. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Helper to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  // Helper to get icon by file type
  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return <File className="h-10 w-10 text-red-500" />;
      case 'word':
        return <FileText className="h-10 w-10 text-blue-500" />;
      case 'spreadsheet':
        return <FileText className="h-10 w-10 text-green-500" />;
      case 'image':
        return <FileImage className="h-10 w-10 text-purple-500" />;
      default:
        return <FileIcon className="h-10 w-10 text-neutral-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h3 className="text-lg font-medium">Professional Documents</h3>
        <p className="text-sm text-neutral-500">
          Upload certificates, licenses, or other professional documents
        </p>
        
        <input
          type="file"
          onChange={handleFileChange}
          className="hidden"
          ref={fileInputRef}
          disabled={isUploading}
          accept={acceptedFileTypes.join(',')}
        />
        
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="flex items-center justify-center"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload Document
            </>
          )}
        </Button>
        
        {error && <p className="text-destructive text-sm">{error}</p>}
        <p className="text-xs text-neutral-500">
          Accepted formats: PDF, Word, Excel, JPG, PNG (max 10MB)
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-300" />
        </div>
      ) : documents.length > 0 ? (
        <div className="border rounded-md">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Document
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Date Uploaded
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {documents.map((document) => (
                  <tr key={document.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 mr-4">
                          {getFileIcon(document.file_type)}
                        </div>
                        <div className="truncate max-w-[200px]">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="link" className="font-medium text-primary p-0 h-auto">
                                {document.file_name}
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Document Details</DialogTitle>
                                <DialogDescription>
                                  View or download this document
                                </DialogDescription>
                              </DialogHeader>
                              
                              <div className="flex items-center justify-center py-4">
                                {getFileIcon(document.file_type)}
                              </div>
                              
                              <div className="space-y-4">
                                <div>
                                  <h4 className="text-sm font-medium text-neutral-500">Name</h4>
                                  <p className="text-base">{document.file_name}</p>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="text-sm font-medium text-neutral-500">Type</h4>
                                    <p className="text-base capitalize">{document.file_type}</p>
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-medium text-neutral-500">Size</h4>
                                    <p className="text-base">{formatFileSize(document.file_size)}</p>
                                  </div>
                                </div>
                                
                                <div>
                                  <h4 className="text-sm font-medium text-neutral-500">Uploaded</h4>
                                  <p className="text-base">
                                    {format(new Date(document.uploaded_at), 'PPP')}
                                  </p>
                                </div>
                              </div>
                              
                              <DialogFooter>
                                <a 
                                  href={document.file_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="inline-flex"
                                >
                                  <Button>
                                    <Download className="mr-2 h-4 w-4" />
                                    Download
                                  </Button>
                                </a>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      {format(new Date(document.uploaded_at), 'PP')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      {formatFileSize(document.file_size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <a 
                          href={document.file_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Button size="icon" variant="ghost" className="h-8 w-8">
                            <Download className="h-4 w-4" />
                          </Button>
                        </a>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive">
                              <Trash className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete {document.file_name}.
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => handleDeleteDocument(document)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-md bg-neutral-50">
          <FileText className="h-12 w-12 text-neutral-300 mb-4" />
          <p className="text-neutral-500 text-center">
            No documents uploaded yet
          </p>
          <p className="text-neutral-400 text-sm text-center mt-1">
            Upload your certificates, licenses, or qualifications
          </p>
        </div>
      )}
    </div>
  );
}