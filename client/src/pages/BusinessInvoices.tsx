import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  PoundSterling, 
  Clock, 
  Calendar, 
  MapPin, 
  ExternalLink, 
  AlertTriangle,
  CheckCircle,
  Receipt,
  Star,
  Download,
  Mail
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ReviewSubmissionModal from "@/components/ReviewSubmissionModal";
import { downloadInvoicePDF } from "@/utils/invoicePDF";

interface InvoiceData {
  id: string;
  gigId: string | null;
  chefId: string;
  businessId: string;
  hoursWorked: number;
  ratePerHour: number;
  totalAmount: number;
  notes: string | null;
  status: string;
  submittedAt: Date;
  isManual?: boolean;
  serviceTitle?: string;
  serviceDescription?: string;
  paymentType?: string;
  // Legacy bank fields (for backward compatibility)
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  sortCode?: string;
  // New payment method fields
  paymentMethod?: string;
  paymentLink?: string;
  gig?: {
    title: string;
    location: string;
    startDate: string;
    endDate: string;
  };
  chef: {
    fullName: string;
  };
}

export default function BusinessInvoices() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("pending");
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null);

  // Query invoices for this business
  const { data: invoices, isLoading } = useQuery<InvoiceData[]>({
    queryKey: ["/api/invoices/business", user?.id],
    queryFn: async () => {
      console.log("DEBUG - Fetching invoices for user:", user?.id);
      console.log("DEBUG - User email:", user?.email);
      const response = await apiRequest("GET", `/api/invoices/business/${user?.id}`);
      const data = await response.json();
      console.log("DEBUG - Invoice API response:", data);
      return data;
    },
    enabled: !!user?.id,
  });

  // Query business profile for PDF generation
  const { data: businessProfile } = useQuery({
    queryKey: ["/api/profiles/business", user?.id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/profiles/business/${user?.id}`);
      return response.json();
    },
    enabled: !!user?.id,
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8 mt-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Please sign in to view invoices</h1>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Paid</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending Payment</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Processing</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Payment handling removed - bank transfer only now
  const handlePayInvoice = (invoice: InvoiceData) => {
    // No longer used - bank transfer details are shown in invoice
    console.log('Bank transfer details:', invoice.sortCode, invoice.accountNumber);
  };

  const handleReviewClick = (invoice: InvoiceData) => {
    setSelectedInvoice(invoice);
    setReviewModalOpen(true);
  };

  const handleMarkAsPaid = async (invoice: InvoiceData) => {
    try {
      console.log("DEBUG - Marking invoice as paid:", invoice.id, "Current status:", invoice.status);
      
      // Optimistically update the cache immediately
      queryClient.setQueryData(["/api/invoices/business", user?.id], (oldData: InvoiceData[] | undefined) => {
        console.log("DEBUG - Old data:", oldData);
        if (!oldData) return oldData;
        const newData = oldData.map(inv => 
          inv.id === invoice.id ? { ...inv, status: 'paid' } : inv
        );
        console.log("DEBUG - New data after optimistic update:", newData);
        return newData;
      });

      // Make the API call
      await apiRequest("PUT", `/api/invoices/${invoice.id}/mark-paid`);
      
      // Force refetch to ensure we have latest data
      await queryClient.refetchQueries({ queryKey: ["/api/invoices/business", user?.id] });
      
      toast({
        title: "Invoice Updated",
        description: "Invoice has been marked as paid successfully.",
      });
    } catch (error) {
      console.error("Error marking invoice as paid:", error);
      
      // Revert optimistic update on error
      queryClient.invalidateQueries({ queryKey: ["/api/invoices/business", user?.id] });
      
      toast({
        title: "Error",
        description: "Failed to mark invoice as paid. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadInvoice = (invoice: InvoiceData) => {
    if (!businessProfile) {
      toast({
        title: "Error",
        description: "Business profile not found. Cannot generate invoice.",
        variant: "destructive",
      });
      return;
    }

    try {
      const businessData = {
        businessName: businessProfile.businessName || 'Business',
        location: businessProfile.location || 'Location not specified',
        description: businessProfile.description || ''
      };

      downloadInvoicePDF(invoice, businessData);
      
      toast({
        title: "Invoice Downloaded",
        description: "Your invoice PDF has been downloaded successfully.",
      });
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast({
        title: "Error",
        description: "Failed to download invoice. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filterInvoicesByStatus = (status: string) => {
    if (!invoices) return [];
    return invoices.filter(invoice => invoice.status.toLowerCase() === status);
  };

  const pendingInvoices = filterInvoicesByStatus('pending');
  const paidInvoices = filterInvoicesByStatus('paid');
  const processingInvoices = filterInvoicesByStatus('processing');

  const totalPending = pendingInvoices.reduce((sum, inv) => {
    const amount = parseFloat(String(inv.totalAmount)) || 0;
    return sum + amount;
  }, 0);
  
  const totalPaid = paidInvoices.reduce((sum, inv) => {
    const amount = parseFloat(String(inv.totalAmount)) || 0;
    return sum + amount;
  }, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8 mt-16">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8 mt-16">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Invoice Management</h1>
          <p className="text-gray-600 mt-2">Manage payments for completed gigs</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                  <p className="text-2xl font-bold text-yellow-600">{formatCurrency(totalPending)}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Paid</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Invoices</p>
                  <p className="text-2xl font-bold text-blue-600">{invoices?.length || 0}</p>
                </div>
                <Receipt className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invoice Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending ({pendingInvoices.length})
            </TabsTrigger>
            <TabsTrigger value="processing" className="flex items-center gap-2">
              <PoundSterling className="h-4 w-4" />
              Processing ({processingInvoices.length})
            </TabsTrigger>
            <TabsTrigger value="paid" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Paid ({paidInvoices.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Pending Invoices</CardTitle>
                <CardDescription>
                  Invoices awaiting payment from completed gigs
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingInvoices.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No pending invoices</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingInvoices.map((invoice) => (
                      <InvoiceCard 
                        key={invoice.id} 
                        invoice={invoice} 
                        onPayClick={handlePayInvoice}
                        onMarkAsPaid={handleMarkAsPaid}
                        onDownload={handleDownloadInvoice}
                        currentUserId={user.id}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="processing" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Processing Invoices</CardTitle>
                <CardDescription>
                  Payments currently being processed
                </CardDescription>
              </CardHeader>
              <CardContent>
                {processingInvoices.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <PoundSterling className="h-12 w-12 mx-auto mb-4 text-blue-300" />
                    <p>No invoices being processed</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {processingInvoices.map((invoice) => (
                      <InvoiceCard 
                        key={invoice.id} 
                        invoice={invoice} 
                        onPayClick={handlePayInvoice}
                        onMarkAsPaid={handleMarkAsPaid}
                        onDownload={handleDownloadInvoice}
                        currentUserId={user.id}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="paid" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Paid Invoices</CardTitle>
                <CardDescription>
                  Successfully completed payments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {paidInvoices.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No paid invoices yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {paidInvoices.map((invoice) => (
                      <InvoiceCard 
                        key={invoice.id} 
                        invoice={invoice} 
                        onPayClick={handlePayInvoice}
                        onReviewClick={handleReviewClick}
                        onMarkAsPaid={handleMarkAsPaid}
                        onDownload={handleDownloadInvoice}
                        currentUserId={user.id}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Review Submission Modal */}
        {selectedInvoice && selectedInvoice.gigId && selectedInvoice.gig && (
          <ReviewSubmissionModal
            isOpen={reviewModalOpen}
            onClose={() => {
              setReviewModalOpen(false);
              setSelectedInvoice(null);
            }}
            gigId={selectedInvoice.gigId}
            recipientId={selectedInvoice.chefId}
            reviewerId={user.id}
            recipientName={selectedInvoice.chef.fullName}
            recipientType="chef"
            gigTitle={selectedInvoice.gig.title}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}

interface InvoiceCardProps {
  invoice: InvoiceData;
  onPayClick: (invoice: InvoiceData) => void;
  onReviewClick?: (invoice: InvoiceData) => void;
  onMarkAsPaid?: (invoice: InvoiceData) => void;
  onDownload?: (invoice: InvoiceData) => void;
  currentUserId?: string;
}

function InvoiceCard({ invoice, onPayClick, onReviewClick, onMarkAsPaid, onDownload, currentUserId }: InvoiceCardProps) {
  // Check if review exists for this gig and reviewer
  const { data: reviewCheck } = useQuery({
    queryKey: ["/api/reviews/check", invoice.gigId, currentUserId],
    queryFn: () => apiRequest("GET", `/api/reviews/check?gigId=${invoice.gigId}&reviewerId=${currentUserId}`).then(res => res.json()),
    enabled: !!currentUserId && !!invoice.gigId && invoice.status.toLowerCase() === 'paid',
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Paid</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending Payment</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Processing</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="border rounded-lg p-6 hover:bg-gray-50 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-semibold text-lg">
            {invoice.gig ? invoice.gig.title : (invoice.serviceTitle || 'Manual Invoice')}
          </h3>
          <p className="text-sm text-gray-600">Chef: {invoice.chef.fullName}</p>
          {invoice.isManual && (
            <div className="flex items-center gap-1 mt-1">
              <Receipt className="h-3 w-3 text-blue-500" />
              <span className="text-xs text-blue-600">Manual Invoice</span>
            </div>
          )}
        </div>
        {getStatusBadge(invoice.status)}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
        <div>
          <span className="text-gray-500">Amount:</span>
          <div className="font-medium text-lg">{formatCurrency(parseFloat(String(invoice.totalAmount)) || 0)}</div>
        </div>
        <div>
          <span className="text-gray-500">
            {invoice.paymentType === 'hourly' ? 'Hours:' : 'Type:'}
          </span>
          <div className="font-medium">
            {invoice.paymentType === 'hourly' ? `${invoice.hoursWorked}h` : 'Fixed Rate'}
          </div>
        </div>
        <div>
          <span className="text-gray-500">Rate:</span>
          <div className="font-medium">
            {invoice.paymentType === 'hourly' 
              ? `${formatCurrency(parseFloat(String(invoice.ratePerHour)) || 0)}/hr`
              : formatCurrency(parseFloat(String(invoice.totalAmount)) || 0)
            }
          </div>
        </div>
        <div>
          <span className="text-gray-500">Submitted:</span>
          <div className="font-medium">{formatDate(invoice.submittedAt)}</div>
        </div>
      </div>

      {invoice.gig && (
        <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span>{invoice.gig.location}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(invoice.gig.startDate)}</span>
          </div>
        </div>
      )}

      {invoice.serviceDescription && (
        <div className="mb-4 p-3 bg-blue-50 rounded">
          <p className="text-sm text-gray-700">
            <strong>Service:</strong> {invoice.serviceDescription}
          </p>
        </div>
      )}

      {invoice.notes && (
        <div className="mb-4 p-3 bg-gray-100 rounded">
          <span className="text-gray-600 text-sm">Notes:</span>
          <p className="text-sm mt-1">{invoice.notes}</p>
        </div>
      )}

      {/* Payment Method Section */}
      {invoice.paymentMethod === 'bank' && (invoice.bankName || invoice.accountName || invoice.accountNumber || invoice.sortCode) && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h5 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Bank Details for Payment
          </h5>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {invoice.bankName && (
              <div>
                <span className="text-blue-700 font-medium">Bank Name:</span>
                <p className="text-blue-900">{invoice.bankName}</p>
              </div>
            )}
            {invoice.accountName && (
              <div>
                <span className="text-blue-700 font-medium">Account Name:</span>
                <p className="text-blue-900">{invoice.accountName}</p>
              </div>
            )}
            {invoice.sortCode && (
              <div>
                <span className="text-blue-700 font-medium">Sort Code:</span>
                <p className="text-blue-900">{invoice.sortCode}</p>
              </div>
            )}
            {invoice.accountNumber && (
              <div>
                <span className="text-blue-700 font-medium">Account Number:</span>
                <p className="text-blue-900">{invoice.accountNumber}</p>
              </div>
            )}
          </div>
          <p className="text-xs text-blue-600 mt-2">
            Please use bank transfer to pay this invoice using the details above.
          </p>
        </div>
      )}



      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center gap-4">
          {invoice.status.toLowerCase() === 'pending' ? (
            <>
              {/* Bank Transfer Payment */}
              {invoice.paymentMethod === 'bank' && (
                <div className="flex items-center gap-3">
                  <div className="text-sm text-blue-600 font-medium">
                    Pay via bank transfer using details above
                  </div>
                  {onMarkAsPaid && (
                    <Button 
                      onClick={() => onMarkAsPaid(invoice)}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Mark as Paid
                    </Button>
                  )}
                </div>
              )}
              

              
              {/* Fallback for old invoices without payment method */}
              {!invoice.paymentMethod && (
                <>
                  {/* Show bank payment if we have bank details */}
                  {invoice.bankName && invoice.accountName && invoice.accountNumber && invoice.sortCode ? (
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-blue-600 font-medium">
                        Pay via bank transfer using details above
                      </div>
                      {onMarkAsPaid && (
                        <Button 
                          onClick={() => onMarkAsPaid(invoice)}
                          className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                          size="sm"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Mark as Paid
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Alert className="flex-1">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        This chef has not set up their payment method yet. Payment cannot be processed.
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
              
              {/* No payment method available */}
              {invoice.paymentMethod && 
               invoice.paymentMethod !== 'bank' && (
                <Alert className="flex-1">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Payment method not properly configured. Please contact support.
                  </AlertDescription>
                </Alert>
              )}
            </>
          ) : (
            <div className="text-sm text-gray-500">
              Payment {invoice.status.toLowerCase() === 'paid' ? 'completed' : 'in progress'}
            </div>
          )}
        </div>

        {/* Action buttons section */}
        <div className="flex items-center gap-2">
          {/* Download Invoice Button - Available for all invoices */}
          {onDownload && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDownload(invoice)}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
          )}
          
          {/* Review Section for Paid Invoices */}
          {invoice.status.toLowerCase() === 'paid' && onReviewClick && currentUserId && (
            <>
              {reviewCheck?.exists ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Review Submitted</span>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onReviewClick(invoice)}
                  className="flex items-center gap-2"
                >
                  <Star className="h-4 w-4" />
                  Leave Review
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}