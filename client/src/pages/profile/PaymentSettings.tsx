import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, CreditCard, PoundSterling, Clock, CheckCircle, Plus, Building } from "lucide-react";
import { Link } from "wouter";
import ManualInvoiceModal from "@/components/ManualInvoiceModal";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface GigInvoice {
  id: string;
  gigId: string;
  chefId: string;
  hoursWorked: number;
  hourlyRate: number;
  totalAmount: number;
  description: string;
  status: string;
  submittedAt: Date;
  gig: {
    title: string;
    businessName: string;
    date: string;
  };
}

export default function PaymentSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isManualInvoiceModalOpen, setIsManualInvoiceModalOpen] = useState(false);
  
  // Payment method form state - only bank transfer now
  const [bankSortCode, setBankSortCode] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  
  const chefId = user?.id;

  // Query chef profile for payment method
  const { data: chefProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["/api/profiles/chef", chefId],
    queryFn: () => apiRequest("GET", `/api/profiles/chef/${chefId}`).then(res => res.json()),
    enabled: !!chefId,
  });

  // Update form state when profile data loads
  useEffect(() => {
    if (chefProfile && !profileLoading) {
      setBankSortCode(chefProfile.bankSortCode || '');
      setBankAccountNumber(chefProfile.bankAccountNumber || '');
    }
  }, [chefProfile, profileLoading]);

  // Query invoices for this chef
  const { data: invoices, isLoading: invoicesLoading } = useQuery<GigInvoice[]>({
    queryKey: ["/api/invoices/chef", chefId],
    queryFn: () => apiRequest("GET", `/api/invoices/chef/${chefId}`).then(res => res.json()),
    enabled: !!chefId,
  });

  // Mutation to update payment method
  const updatePaymentMethod = useMutation({
    mutationFn: async (paymentData: {
      paymentMethod: string;
      bankSortCode?: string;
      bankAccountNumber?: string;
    }) => {
      return apiRequest("PUT", `/api/chefs/payment-method/${chefId}`, paymentData);
    },
    onSuccess: () => {
      toast({
        title: "Payment method updated",
        description: "Your payment method has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/profiles/chef", chefId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating payment method",
        description: error.message || "Failed to update payment method",
        variant: "destructive",
      });
    }
  });

  const handleSavePaymentMethod = async () => {
    const paymentData = {
      paymentMethod: 'bank', // Always bank transfer now
      bankSortCode,
      bankAccountNumber,
    };

    // Validate required fields for bank transfer
    if (!bankSortCode || !bankAccountNumber) {
      toast({
        title: "Validation Error",
        description: "Bank sort code and account number are required",
        variant: "destructive",
      });
      return;
    }

    updatePaymentMethod.mutate(paymentData);
  };
  
  if (!user || !chefId) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Please sign in to access payment settings</h1>
          </div>
        </div>
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
        return <Badge variant="secondary">Pending</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Processing</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalEarnings = invoices?.reduce((sum, invoice) => {
    const amount = parseFloat(String(invoice.totalAmount)) || 0;
    return sum + amount;
  }, 0) || 0;
  
  const pendingAmount = invoices?.filter(inv => inv.status === 'pending').reduce((sum, invoice) => {
    const amount = parseFloat(String(invoice.totalAmount)) || 0;
    return sum + amount;
  }, 0) || 0;
  
  const paidAmount = invoices?.filter(inv => inv.status === 'paid').reduce((sum, invoice) => {
    const amount = parseFloat(String(invoice.totalAmount)) || 0;
    return sum + amount;
  }, 0) || 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Payment Settings</h1>
          <p className="text-gray-600 mt-2">Manage your payment account and view your earnings</p>
        </div>

        <div className="space-y-6">
          {/* Payment Method Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Method
              </CardTitle>
              <CardDescription>
                Choose how you would like to receive payments for your gig invoices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Bank Transfer - Only Payment Method */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <Building className="h-6 w-6 text-blue-600" />
                  <div>
                    <h4 className="font-medium text-blue-900">Bank Transfer Only</h4>
                    <p className="text-sm text-blue-700">
                      All payments are now processed via bank transfer. No transaction fees.
                    </p>
                  </div>
                </div>
              </div>

              {/* Bank Details Form */}
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900">Bank Account Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bankSortCode">Sort Code</Label>
                    <Input
                      id="bankSortCode"
                      value={bankSortCode}
                      onChange={(e) => setBankSortCode(e.target.value)}
                      placeholder="12-34-56"
                      maxLength={8}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bankAccountNumber">Account Number</Label>
                    <Input
                      id="bankAccountNumber"
                      value={bankAccountNumber}
                        onChange={(e) => setBankAccountNumber(e.target.value)}
                        placeholder="12345678"
                        maxLength={8}
                      />
                    </div>
                  </div>
                </div>

              <Button 
                onClick={handleSavePaymentMethod} 
                disabled={updatePaymentMethod.isPending}
                className="w-full"
              >
                {updatePaymentMethod.isPending ? "Saving..." : "Save Payment Method"}
              </Button>
            </CardContent>
          </Card>

          {/* Earnings Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PoundSterling className="h-5 w-5 text-blue-600" />
                <span>Earnings Overview</span>
              </CardTitle>
              <CardDescription>Your earnings from completed gigs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalEarnings)}</div>
                  <div className="text-sm text-blue-800">Total Earnings</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{formatCurrency(pendingAmount)}</div>
                  <div className="text-sm text-yellow-800">Pending Payment</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(paidAmount)}</div>
                  <div className="text-sm text-green-800">Paid Out</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <span>Invoice History</span>
              </CardTitle>
              <CardDescription>Track your submitted invoices and payment status</CardDescription>
            </CardHeader>
            <CardContent>
              {invoicesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : !invoices || invoices.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No invoices submitted yet</p>
                  <p className="text-sm">Complete gigs and submit invoices to see them here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {invoices.map((invoice) => (
                    <div key={invoice.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{invoice.gig.title}</h4>
                          <p className="text-sm text-gray-600">{invoice.gig.businessName}</p>
                        </div>
                        {getStatusBadge(invoice.status)}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
                      
                      {invoice.description && (
                        <div className="mt-3 pt-3 border-t">
                          <span className="text-gray-500 text-sm">Description:</span>
                          <p className="text-sm mt-1">{invoice.description}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
              <CardDescription>How payments work on Chef Pantry</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Manual Bank Transfer</h4>
                    <p className="text-sm text-gray-600">
                      Businesses pay invoices via bank transfer using your provided bank details.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">No Transaction Fees</h4>
                    <p className="text-sm text-gray-600">
                      Direct bank transfers mean you receive 100% of your invoice amount with no platform fees.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Professional Invoices</h4>
                    <p className="text-sm text-gray-600">
                      Businesses can download professional PDF invoices with your bank details for their records.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Manual Invoice Creation */}
          <Card>
            <CardHeader>
              <CardTitle>Send Invoice (No Gig)</CardTitle>
              <CardDescription>Create and send invoices for work completed outside the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Need to invoice a business for work done off-platform? Use this feature to create and send professional invoices directly to businesses registered on Chef Pantry.
                </p>
                <Button 
                  onClick={() => setIsManualInvoiceModalOpen(true)}
                  className="w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Invoice
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Manual Invoice Modal */}
        <ManualInvoiceModal
          isOpen={isManualInvoiceModalOpen}
          onClose={() => setIsManualInvoiceModalOpen(false)}
          onSuccess={() => {
            // Refetch invoices when a new one is created
            window.location.reload();
          }}
          chefId={chefId}
        />
      </div>
    </div>
  );
}