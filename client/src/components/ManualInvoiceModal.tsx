import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Search, Building2, MapPin, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";

interface Business {
  id: string;
  businessName: string;
  location: string;
  description: string;
}

interface ManualInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  chefId: string;
}

export default function ManualInvoiceModal({ isOpen, onClose, onSuccess, chefId }: ManualInvoiceModalProps) {
  const [step, setStep] = useState<'search' | 'form'>('search');
  const [searchName, setSearchName] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [searchResults, setSearchResults] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form fields
  const [serviceTitle, setServiceTitle] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [paymentType, setPaymentType] = useState<'hourly' | 'fixed'>('hourly');
  const [hourlyRate, setHourlyRate] = useState('');
  const [hoursWorked, setHoursWorked] = useState('');
  const [fixedAmount, setFixedAmount] = useState('');
  const [notes, setNotes] = useState('');
  
  // Payment method - bank transfer only
  const paymentMethod = 'bank'; // Fixed to bank transfer only
  
  // Bank details fields
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [sortCode, setSortCode] = useState('');
  
  const { toast } = useToast();

  const handleSearchBusinesses = async () => {
    if (!searchName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a business name",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      const params = new URLSearchParams({ name: searchName });
      if (searchLocation.trim()) {
        params.append('location', searchLocation);
      }

      const response = await fetch(`/api/businesses/search?${params}`);
      if (!response.ok) throw new Error('Failed to search businesses');
      
      const data = await response.json();
      setSearchResults(data.data || []);
      
      if (data.data.length === 0) {
        toast({
          title: "No Results",
          description: "No businesses found matching your search criteria. Please check the name and location.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error searching businesses:', error);
      toast({
        title: "Error",
        description: "Failed to search businesses. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectBusiness = (business: Business) => {
    setSelectedBusiness(business);
    setStep('form');
  };

  const calculateTotal = () => {
    if (paymentType === 'hourly') {
      const rate = parseFloat(hourlyRate) || 0;
      const hours = parseFloat(hoursWorked) || 0;
      return (rate * hours).toFixed(2);
    } else {
      const amount = parseFloat(fixedAmount) || 0;
      return amount.toFixed(2);
    }
  };

  const handleSubmitInvoice = async () => {
    if (!selectedBusiness || !serviceTitle.trim() || !serviceDescription.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (paymentType === 'hourly') {
      if (!hourlyRate || !hoursWorked || parseFloat(hourlyRate) <= 0 || parseFloat(hoursWorked) <= 0) {
        toast({
          title: "Error",
          description: "Please enter valid hourly rate and hours worked",
          variant: "destructive",
        });
        return;
      }
    } else {
      if (!fixedAmount || parseFloat(fixedAmount) <= 0) {
        toast({
          title: "Error",
          description: "Please enter a valid fixed amount",
          variant: "destructive",
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const invoiceData = {
        chefId,
        businessId: selectedBusiness.id,
        isManual: true,
        serviceTitle,
        serviceDescription,
        paymentType,
        hoursWorked: paymentType === 'hourly' ? hoursWorked : '1',
        ratePerHour: paymentType === 'hourly' ? hourlyRate : fixedAmount,
        totalAmount: calculateTotal(),
        notes: notes || null,
        status: "pending",
        ...(paymentMethod === 'bank' && {
          bankName: bankName.trim(),
          accountName: accountName.trim(),
          accountNumber: accountNumber.trim(),
          sortCode: sortCode.trim()
        })
      };

      const response = await apiRequest("POST", "/api/invoices", invoiceData);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit invoice");
      }

      toast({
        title: "Invoice Submitted",
        description: `Your invoice has been sent to ${selectedBusiness.businessName}. They have been notified.`,
      });

      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      console.error("Error submitting invoice:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit invoice",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep('search');
    setSearchName('');
    setSearchLocation('');
    setSearchResults([]);
    setSelectedBusiness(null);
    setServiceTitle('');
    setServiceDescription('');
    setPaymentType('hourly');
    setHourlyRate('');
    setHoursWorked('');
    setFixedAmount('');
    setNotes('');
    // Payment method is fixed to bank transfer
    setBankName('');
    setAccountName('');
    setAccountNumber('');
    setSortCode('');
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Invoice (No Gig)</DialogTitle>
          <DialogDescription>
            Create and send an invoice for work completed outside the platform
          </DialogDescription>
        </DialogHeader>

        {step === 'search' && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Find Business</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    placeholder="Enter business name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="location">Location (Optional)</Label>
                  <Input
                    id="location"
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    placeholder="Enter city or area"
                  />
                </div>
              </div>

              <Button 
                onClick={handleSearchBusinesses} 
                disabled={isSearching}
                className="w-full"
              >
                <Search className="h-4 w-4 mr-2" />
                {isSearching ? "Searching..." : "Search Businesses"}
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">Search Results</h4>
                {searchResults.map((business) => (
                  <Card 
                    key={business.id} 
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleSelectBusiness(business)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Building2 className="h-4 w-4 text-gray-500" />
                            <h4 className="font-semibold">{business.businessName}</h4>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span className="text-sm text-gray-600">{business.location}</span>
                          </div>
                          <p className="text-sm text-gray-600">{business.description}</p>
                        </div>
                        <Button variant="outline" size="sm">
                          Select
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 'form' && selectedBusiness && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Create Invoice</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setStep('search')}
              >
                <X className="h-4 w-4 mr-2" />
                Change Business
              </Button>
            </div>

            {/* Selected Business */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="h-4 w-4 text-gray-500" />
                  <span className="font-semibold">{selectedBusiness.businessName}</span>
                  <Badge variant="secondary">Selected</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{selectedBusiness.location}</span>
                </div>
              </CardContent>
            </Card>

            {/* Invoice Form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="serviceTitle">Service Title *</Label>
                <Input
                  id="serviceTitle"
                  value={serviceTitle}
                  onChange={(e) => setServiceTitle(e.target.value)}
                  placeholder="e.g., Catering Services, Private Chef Evening"
                />
              </div>

              <div>
                <Label htmlFor="serviceDescription">Description of Work *</Label>
                <Textarea
                  id="serviceDescription"
                  value={serviceDescription}
                  onChange={(e) => setServiceDescription(e.target.value)}
                  placeholder="Describe the work completed..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Payment Type *</Label>
                <RadioGroup value={paymentType} onValueChange={(value: 'hourly' | 'fixed') => setPaymentType(value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hourly" id="hourly" />
                    <Label htmlFor="hourly">Hourly Rate</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fixed" id="fixed" />
                    <Label htmlFor="fixed">Fixed Amount</Label>
                  </div>
                </RadioGroup>
              </div>

              {paymentType === 'hourly' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="hourlyRate">Hourly Rate (£) *</Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      step="0.01"
                      min="0"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="hoursWorked">Hours Worked *</Label>
                    <Input
                      id="hoursWorked"
                      type="number"
                      step="0.5"
                      min="0"
                      value={hoursWorked}
                      onChange={(e) => setHoursWorked(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <Label htmlFor="fixedAmount">Fixed Amount (£) *</Label>
                  <Input
                    id="fixedAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={fixedAmount}
                    onChange={(e) => setFixedAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any additional details or payment instructions..."
                  rows={2}
                />
              </div>

              {/* Payment Method - Bank Transfer Only */}
              <div className="border-t pt-4">
                <Label>Payment Method</Label>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Bank Transfer (Manual Payment)</span>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">
                    Invoice will include your bank details for manual payment.
                  </p>
                </div>
              </div>

              {/* Bank Details Section - Only show if bank transfer is selected */}
              {paymentMethod === 'bank' && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Bank Details for Payment</h4>
                  <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input
                      id="bankName"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g., Barclays Bank"
                    />
                  </div>
                  <div>
                    <Label htmlFor="accountName">Account Name</Label>
                    <Input
                      id="accountName"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder="Account holder name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sortCode">Sort Code</Label>
                    <Input
                      id="sortCode"
                      value={sortCode}
                      onChange={(e) => setSortCode(e.target.value)}
                      placeholder="12-34-56"
                      maxLength={8}
                    />
                  </div>
                  <div>
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input
                      id="accountNumber"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="12345678"
                      maxLength={8}
                    />
                  </div>
                  </div>
                </div>
              )}

              {/* Total Display */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-green-800">Total Amount:</span>
                  <span className="text-xl font-bold text-green-800">£{calculateTotal()}</span>
                </div>
                {paymentType === 'hourly' && (
                  <div className="text-sm text-green-600 mt-1">
                    {hoursWorked || 0} hours × £{hourlyRate || 0}/hr
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitInvoice} 
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? "Submitting..." : "Send Invoice"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}