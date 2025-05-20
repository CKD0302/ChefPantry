import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { File, Trash2, Download, FileText, FileImage, FileArchive } from "lucide-react";
import { format } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Document {
  id: string;
  name: string;
  url: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
}

export default function ProfessionalDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [user, setUser] = useState<{ id: string } | null>(null);

  useEffect(() => {
    // Get the current authenticated user
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching user:", error);
        return;
      }
      
      if (data?.user) {
        setUser({ id: data.user.id });
        fetchDocuments(data.user.id);
      }
    };

    getUser();
  }, []);

  const fetchDocuments = async (userId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('chef_documents')
        .select('*')
        .eq('chef_id', userId)
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
        description: "Failed to load your documents. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const uploadDocument = async (file: File) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to upload documents.",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    setError(null);
    
    try {
      // Check file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("File size exceeds 10MB limit");
      }
      
      // We'll proceed with the upload attempt even if we're not sure the bucket exists
      // The upload operation will fail with a specific error if the bucket doesn't exist
      
      // Generate file path in the bucket
      const filePath = `user-${user.id}/${file.name}`;
      
      // Upload file to storage
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('chef-documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) {
        throw uploadError;
      }
      
      // Get public URL
      const { data: publicUrlData } = supabase
        .storage
        .from('chef-documents')
        .getPublicUrl(filePath);
      
      const publicUrl = publicUrlData.publicUrl;
      
      // Create record in database
      const { data: documentData, error: documentError } = await supabase
        .from('chef_documents')
        .insert({
          chef_id: user.id,
          name: file.name,
          url: publicUrl,
          file_type: file.type,
          file_size: file.size
        })
        .select();
      
      if (documentError) {
        throw documentError;
      }
      
      toast({
        title: "Success",
        description: "Document uploaded successfully!",
      });
      
      // Refresh the documents list
      fetchDocuments(user.id);
    } catch (err: any) {
      console.error('Error uploading document:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to upload document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const deleteDocument = async (document: Document) => {
    if (!user) return;
    
    try {
      // Get the file path from the public URL
      const { pathname } = new URL(document.url);
      
      // Extract the path after the bucket name
      const segments = pathname.split('/');
      const bucketIndex = segments.findIndex(segment => segment === 'chef-documents');
      
      if (bucketIndex === -1 || bucketIndex === segments.length - 1) {
        console.error("Invalid file URL structure:", document.url);
        return;
      }
      
      // Everything after 'chef-documents' in the path is our storage path
      const filePath = segments.slice(bucketIndex + 1).join('/');
      
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
        description: "The document has been deleted successfully",
      });
    } catch (err: any) {
      console.error('Error deleting document:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadDocument(file);
      // Reset the input value so the same file can be uploaded again if needed
      event.target.value = '';
    }
  };

  const formatFile_size = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file_type: string) => {
    if (file_type.startsWith('image/')) {
      return <FileImage className="h-5 w-5 text-blue-500" />;
    } else if (file_type === 'application/pdf') {
      return <FileText className="h-5 w-5 text-red-500" />;
    } else if (file_type.includes('word') || file_type.includes('document')) {
      return <FileText className="h-5 w-5 text-blue-700" />;
    } else if (file_type.includes('spreadsheet') || file_type.includes('excel')) {
      return <FileText className="h-5 w-5 text-green-600" />;
    } else if (file_type.includes('zip') || file_type.includes('compressed')) {
      return <FileArchive className="h-5 w-5 text-yellow-600" />;
    }
    return <File className="h-5 w-5 text-gray-500" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Professional Documents</CardTitle>
        <CardDescription>
          Upload and manage your certifications, licenses, and other professional documents
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* File upload section */}
          <div className="border rounded-lg p-4 bg-neutral-50">
            <h3 className="text-sm font-medium mb-2">Upload Document</h3>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                id="document-upload"
                onChange={handleFileChange}
                disabled={isUploading}
                className="max-w-md"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              />
              <Button 
                disabled={isUploading} 
                size="sm"
                onClick={() => document.getElementById('document-upload')?.click()}
              >
                {isUploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              Accept PDF, Word, Excel, and image files up to 10MB
            </p>
          </div>

          {/* Document list */}
          {isLoading ? (
            <div className="text-center py-4">Loading your documents...</div>
          ) : error ? (
            <div className="text-center py-4 text-red-500">{error}</div>
          ) : documents.length === 0 ? (
            <div className="text-center py-4 text-neutral-500">
              You haven't uploaded any documents yet
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <div className="divide-y">
                {documents.map((document) => (
                  <div 
                    key={document.id} 
                    className="p-4 flex items-center justify-between flex-wrap gap-2 hover:bg-neutral-50"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {getFileIcon(document.file_type)}
                      <div className="min-w-0">
                        <h4 className="font-medium text-sm truncate" title={document.name}>
                          {document.name}
                        </h4>
                        <div className="flex gap-2 text-xs text-neutral-500">
                          <span>
                            {formatFile_size(document.file_size)}
                          </span>
                          <span>•</span>
                          <span>
                            {format(new Date(document.uploaded_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <a 
                        href={document.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                      >
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">Download</span>
                      </a>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 h-8 w-8">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Document</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{document.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteDocument(document)}
                              className="bg-red-500 hover:bg-red-600 text-white"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
