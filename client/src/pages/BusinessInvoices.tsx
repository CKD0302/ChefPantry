import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, 
  DollarSign, 
  Clock, 
  Calendar, 
  MapPin, 
  ExternalLink, 
  AlertTriangle,
  CheckCircle,
  Receipt
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface InvoiceData {
  id: string;
  gigId: string;
  chefId: string;
  businessId: string;
  hoursWorked: number;
  ratePerHour: number;
  totalAmount: number;
  notes: string | null;
  status: string;
  submittedAt: Date;
  gig: {
    title: string;
    location: string;
    startDate: string;
    endDate: string;
  };
  chef: {
    fullName: string;
    stripeAccountId: string | null;
  };
}

export default function BusinessInvoices() {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState("pending");

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

  // Query invoices for this business
  const { data: invoices, isLoading } = useQuery<InvoiceData[]>({
    queryKey: ["/api/invoices/business", user.id],
    queryFn: () => apiRequest("GET", `/api/invoices/business/${user.id}`).then(res => res.json()),
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
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

  const handlePayInvoice = (invoice: InvoiceData) => {
    if (!invoice.chef.stripeAccountId) {
      return;
    }
    
    // Open Stripe Dashboard with payment link
    const stripePaymentUrl = `https://dashboard.stripe.com/payments?recipient=${invoice.chef.stripeAccountId}`;
    window.open(stripePaymentUrl, '_blank');
  };

  const filterInvoicesByStatus = (status: string) => {
    if (!invoices) return [];
    return invoices.filter(invoice => invoice.status.toLowerCase() === status);
  };

  const pendingInvoices = filterInvoicesByStatus('pending');
  const paidInvoices = filterInvoicesByStatus('paid');
  const processingInvoices = filterInvoicesByStatus('processing');

  const totalPending = pendingInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalPaid = paidInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

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
              <DollarSign className="h-4 w-4" />
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
                    <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No invoices being processed</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {processingInvoices.map((invoice) => (
                      <InvoiceCard 
                        key={invoice.id} 
                        invoice={invoice} 
                        onPayClick={handlePayInvoice}
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
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}

interface InvoiceCardProps {
  invoice: InvoiceData;
  onPayClick: (invoice: InvoiceData) => void;
}

function InvoiceCard({ invoice, onPayClick }: InvoiceCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
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
          <h3 className="font-semibold text-lg">{invoice.gig.title}</h3>
          <p className="text-sm text-gray-600">Chef: {invoice.chef.fullName}</p>
        </div>
        {getStatusBadge(invoice.status)}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
        <div>
          <span className="text-gray-500">Amount:</span>
          <div className="font-medium text-lg">{formatCurrency(invoice.totalAmount)}</div>
        </div>
        <div>
          <span className="text-gray-500">Hours:</span>
          <div className="font-medium">{invoice.hoursWorked}h</div>
        </div>
        <div>
          <span className="text-gray-500">Rate:</span>
          <div className="font-medium">{formatCurrency(invoice.ratePerHour)}/hr</div>
        </div>
        <div>
          <span className="text-gray-500">Submitted:</span>
          <div className="font-medium">{formatDate(invoice.submittedAt)}</div>
        </div>
      </div>

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

      {invoice.notes && (
        <div className="mb-4 p-3 bg-gray-100 rounded">
          <span className="text-gray-600 text-sm">Notes:</span>
          <p className="text-sm mt-1">{invoice.notes}</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t">
        {!invoice.chef.stripeAccountId ? (
          <Alert className="flex-1 mr-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This chef has not connected their payment account yet. Payment cannot be processed.
            </AlertDescription>
          </Alert>
        ) : invoice.status.toLowerCase() === 'pending' ? (
          <Button 
            onClick={() => onPayClick(invoice)}
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Pay with Stripe
          </Button>
        ) : (
          <div className="text-sm text-gray-500">
            Payment {invoice.status.toLowerCase() === 'paid' ? 'completed' : 'in progress'}
          </div>
        )}
      </div>
    </div>
  );
}