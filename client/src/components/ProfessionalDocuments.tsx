import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card";
import {
  File, Trash2, Download, FileText, FileImage, FileArchive
} from "lucide-react";
import { format } from "date-fns";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

// --- Interfaces ---
interface Document {
  id: string;
  name: string;
  url: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

// --- Component ---
export default function ProfessionalDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  // --- Get authenticated user once ---
  useEffect(() => {
    // Configure auth state observer
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const id = session?.user?.id;
        console.log("Auth state changed:", event, "User ID:", id);
        
        if (id) {
          setUserId(id);
          fetchDocuments(id);
        } else {
          console.error("No authenticated user found");
          setDocuments([]);
        }
      }
    );

    // Initial auth check
    const getInitialUser = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const id = sessionData?.session?.user?.id;

      if (id) {
        console.log("Initial user found:", id);
        setUserId(id);
        fetchDocuments(id);
      } else {
        console.error("No initial user found");
      }
    };

    getInitialUser();

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // --- Fetch documents ---
  const fetchDocuments = async (uid: string | null) => {
    if (!uid) {
      console.error("Cannot fetch documents: No user ID provided");
      return;
    }
    
    setIsLoading(true);
    
    // Ensure we have a fresh session with valid auth
    const { data: sessionData } = await supabase.auth.getSession();
    const authUserId = sessionData?.session?.user?.id;
    
    if (!authUserId) {
      console.error("Authentication required to fetch documents");
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("chef_documents")
      .select("*")
      .eq("chef_id", authUserId) // Always use the authenticated user ID
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching documents:", error.message);
      toast({
        title: "Error",
        description: "Failed to load your documents.",
        variant: "destructive",
      });
    } else {
      setDocuments(data || []);
    }

    setIsLoading(false);
  };

  // --- Upload a document ---
  const uploadDocument = async (file: File) => {
    // Get fresh user session first and abort early if not authenticated
    const { data: freshSession } = await supabase.auth.getSession();
    const currentUserId = freshSession?.session?.user?.id;
    
    if (!currentUserId) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to upload documents.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("File size exceeds 10MB limit");
      }

      // Use the fresh session user ID for the file path
      const filePath = `user-${currentUserId}/${Date.now()}-${file.name}`;

      // Upload to storage with retry logic
      let uploadAttempts = 0;
      let uploadError = null;
      let uploadResult = null;
      
      // Sometimes Supabase needs a moment for auth to propagate
      // This retry approach helps ensure the upload succeeds
      while (uploadAttempts < 3 && !uploadResult) {
        uploadAttempts++;
        
        if (uploadAttempts > 1) {
          console.log(`Retry attempt ${uploadAttempts} for file upload...`);
          // Brief pause between retries
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        try {
          const result = await supabase.storage
            .from("chef-documents")
            .upload(filePath, file, { 
              cacheControl: "3600", 
              upsert: true 
            });
            
          if (result.error) {
            console.error(`Upload attempt ${uploadAttempts} error:`, result.error);
            uploadError = result.error;
          } else {
            console.log("Upload successful on attempt", uploadAttempts);
            uploadResult = result.data;
            break;
          }
        } catch (err) {
          console.error(`Upload attempt ${uploadAttempts} exception:`, err);
          uploadError = err;
        }
      }
      
      if (!uploadResult) {
        console.error("All upload attempts failed:", uploadError);
        throw new Error(`Storage error: ${uploadError?.message || "Upload failed after multiple attempts"}`);
      }

      // Get the URL of the uploaded file
      const { data: urlData } = supabase.storage
        .from("chef-documents")
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // Log the key values for debugging
      console.log("Inserting document with chef_id:", currentUserId);
      
      // Insert into database - critically important to use the auth user ID
      const { error: insertError } = await supabase.from("chef_documents").insert({
        chef_id: currentUserId,
        name: file.name,
        url: publicUrl,
        file_type: file.type,
        file_size: file.size,
      });

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: "Document uploaded successfully!",
      });

      if (userId) {
        fetchDocuments(userId);
      }
    } catch (err: any) {
      console.error("Upload error:", err.message);
      toast({
        title: "Error",
        description: err.message || "Upload failed.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // --- Delete a document ---
  const deleteDocument = async (doc: Document) => {
    // Get a fresh session to ensure proper authentication
    const { data: sessionData } = await supabase.auth.getSession();
    const authUserId = sessionData?.session?.user?.id;
    
    if (!authUserId) {
      toast({
        title: "Error",
        description: "Authentication required to delete documents",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("Deleting document:", doc.id, "for user:", authUserId);
      
      const pathParts = new URL(doc.url).pathname.split("/");
      const filePath = pathParts.slice(pathParts.indexOf("chef-documents") + 1).join("/");
      console.log("Storage path to delete:", filePath);

      // Ensure storage operations use authenticated session
      const { error: storageError } = await supabase.storage
        .from("chef-documents")
        .remove([filePath]);

      if (storageError) {
        console.error("Storage delete error:", storageError);
        throw storageError;
      }

      // Use the authenticated user ID for database operations
      console.log("Deleting from database, record ID:", doc.id);
      const { error: dbError } = await supabase
        .from("chef_documents")
        .delete()
        .match({ id: doc.id, chef_id: authUserId });

      if (dbError) {
        console.error("Database delete error:", dbError);
        throw dbError;
      }

      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));

      toast({ title: "Deleted", description: "Document removed." });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete document.",
        variant: "destructive",
      });
    }
  };

  // --- Helpers ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadDocument(file);
      e.target.value = "";
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1048576).toFixed(2)} MB`;
  };

  const getFileIcon = (type: string) => {
    if (type.includes("image")) return <FileImage className="h-5 w-5 text-blue-500" />;
    if (type.includes("pdf")) return <FileText className="h-5 w-5 text-red-500" />;
    if (type.includes("word")) return <FileText className="h-5 w-5 text-blue-700" />;
    if (type.includes("excel")) return <FileText className="h-5 w-5 text-green-600" />;
    if (type.includes("zip")) return <FileArchive className="h-5 w-5 text-yellow-600" />;
    return <File className="h-5 w-5 text-gray-500" />;
  };

  // --- JSX ---
  return (
    <Card>
      <CardHeader>
        <CardTitle>Professional Documents</CardTitle>
        <CardDescription>Upload and manage your documents</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
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
                onClick={() =>
                  document.getElementById("document-upload")?.click()
                }
              >
                {isUploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              Accept PDF, Word, Excel, and image files up to 10MB
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-4">Loading your documents...</div>
          ) : documents.length === 0 ? (
            <div className="text-center py-4 text-neutral-500">
              You haven't uploaded any documents yet
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <div className="divide-y">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 flex items-center justify-between flex-wrap gap-2 hover:bg-neutral-50"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {getFileIcon(doc.file_type)}
                      <div className="min-w-0">
                        <h4 className="font-medium text-sm truncate" title={doc.name}>
                          {doc.name}
                        </h4>
                        <div className="flex gap-2 text-xs text-neutral-500">
                          <span>{formatSize(doc.file_size)}</span>
                          <span>•</span>
                          <span>
                            {format(new Date(doc.created_at), "MMM d, yyyy")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                      >
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">Download</span>
                      </a>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-700 h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Document</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{doc.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteDocument(doc)}
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