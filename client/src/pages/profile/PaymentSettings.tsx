import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CreditCard, DollarSign, Clock, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import StripeConnectOnboarding from "@/components/StripeConnectOnboarding";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

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
  
  if (!user) {
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

  const chefId = user.id;

  // Query invoices for this chef
  const { data: invoices, isLoading: invoicesLoading } = useQuery<GigInvoice[]>({
    queryKey: ["/api/invoices/chef", chefId],
    queryFn: () => apiRequest("GET", `/api/invoices/chef/${chefId}`).then(res => res.json()),
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
        return <Badge variant="secondary">Pending</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Processing</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalEarnings = invoices?.reduce((sum, invoice) => sum + invoice.totalAmount, 0) || 0;
  const pendingAmount = invoices?.filter(inv => inv.status === 'pending').reduce((sum, invoice) => sum + invoice.totalAmount, 0) || 0;
  const paidAmount = invoices?.filter(inv => inv.status === 'paid').reduce((sum, invoice) => sum + invoice.totalAmount, 0) || 0;

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
          {/* Stripe Connect Onboarding */}
          <StripeConnectOnboarding chefId={chefId} />

          {/* Earnings Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
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
                    <h4 className="font-medium">Automatic Processing</h4>
                    <p className="text-sm text-gray-600">
                      Payments are automatically processed when you submit invoices for completed gigs.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Direct Deposit</h4>
                    <p className="text-sm text-gray-600">
                      Funds are deposited directly to your connected bank account within 2-7 business days.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Secure & Reliable</h4>
                    <p className="text-sm text-gray-600">
                      All payments are processed securely through Stripe Connect with full fraud protection.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}