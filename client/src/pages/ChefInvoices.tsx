import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  PoundSterling, 
  Clock, 
  Calendar, 
  MapPin, 
  CheckCircle,
  Receipt,
  Star,
  Building
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ReviewSubmissionModal from "@/components/ReviewSubmissionModal";

interface ChefInvoiceData {
  id: string;
  gigId: string | null;
  chefId: string;
  businessId: string;
  hoursWorked: number;
  hourlyRate: number;
  totalAmount: number;
  description: string | null;
  status: string;
  submittedAt: Date;
  gigTitle: string | null;
  businessName: string | null;
  gigDate: string | null;
  gig?: {
    title: string;
    businessName: string;
    date: string;
  };
}

export default function ChefInvoices() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("pending");
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<ChefInvoiceData | null>(null);

  // Query invoices for this chef
  const { data: invoices, isLoading } = useQuery<ChefInvoiceData[]>({
    queryKey: ["/api/invoices/chef", user?.id],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/invoices/chef/${user?.id}`);
      const data = await response.json();
      return data;
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

  const handleReviewClick = (invoice: ChefInvoiceData) => {
    setSelectedInvoice(invoice);
    setReviewModalOpen(true);
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
          <h1 className="text-3xl font-bold text-gray-900">My Invoices</h1>
          <p className="text-gray-600 mt-2">Track payments and earnings from your gigs</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Amount</p>
                  <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalPending)}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Earned</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
                </div>
                <PoundSterling className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Paid Invoices</p>
                  <p className="text-2xl font-bold text-purple-600">{paidInvoices.length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-purple-600" />
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
                  Invoices waiting for payment from businesses
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
                        onReviewClick={handleReviewClick}
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
                  Invoices currently being processed for payment
                </CardDescription>
              </CardHeader>
              <CardContent>
                {processingInvoices.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <PoundSterling className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No invoices being processed</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {processingInvoices.map((invoice) => (
                      <InvoiceCard 
                        key={invoice.id} 
                        invoice={invoice} 
                        onReviewClick={handleReviewClick}
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
                  Successfully paid invoices - you can leave reviews for these gigs
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
                        onReviewClick={handleReviewClick}
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
        {selectedInvoice && selectedInvoice.gigId && (
          <ReviewSubmissionModal
            isOpen={reviewModalOpen}
            onClose={() => {
              setReviewModalOpen(false);
              setSelectedInvoice(null);
            }}
            gigId={selectedInvoice.gigId}
            recipientId={selectedInvoice.businessId}
            reviewerId={user.id}
            recipientName={selectedInvoice.businessName || "Business"}
            recipientType="business"
            gigTitle={selectedInvoice.gigTitle || "Gig"}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}

interface InvoiceCardProps {
  invoice: ChefInvoiceData;
  onReviewClick?: (invoice: ChefInvoiceData) => void;
  currentUserId?: string;
}

function InvoiceCard({ invoice, onReviewClick, currentUserId }: InvoiceCardProps) {
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
            {invoice.gigTitle || 'Manual Invoice'}
          </h3>
          <p className="text-sm text-gray-600 flex items-center gap-1">
            <Building className="h-4 w-4" />
            {invoice.businessName || 'Business'}
          </p>
        </div>
        {getStatusBadge(invoice.status)}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
        <div>
          <span className="text-gray-500">Amount:</span>
          <div className="font-medium">{formatCurrency(invoice.totalAmount)}</div>
        </div>
        <div>
          <span className="text-gray-500">Hours:</span>
          <div className="font-medium">{invoice.hoursWorked}h</div>
        </div>
        <div>
          <span className="text-gray-500">Rate:</span>
          <div className="font-medium">{formatCurrency(invoice.hourlyRate)}/hr</div>
        </div>
        <div>
          <span className="text-gray-500">Submitted:</span>
          <div className="font-medium">{formatDate(invoice.submittedAt)}</div>
        </div>
      </div>

      {invoice.gigDate && (
        <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(invoice.gigDate)}</span>
          </div>
        </div>
      )}

      {invoice.description && (
        <div className="mb-4 p-3 bg-gray-100 rounded">
          <span className="text-gray-600 text-sm">Notes:</span>
          <p className="text-sm mt-1">{invoice.description}</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            Status: {invoice.status}
          </div>
        </div>

        {/* Review Section for Paid Invoices */}
        {invoice.status.toLowerCase() === 'paid' && onReviewClick && currentUserId && invoice.gigId && (
          <div className="flex items-center gap-2">
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
          </div>
        )}
      </div>
    </div>
  );
}