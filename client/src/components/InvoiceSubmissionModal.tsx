import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Calculator, Clock, MapPin, Calendar, Building } from "lucide-react";

interface GigData {
  id: string;
  title: string;
  location: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  pay_rate: number;
  created_by: string;
}

interface Application {
  id: string;
  gigId: string;
  chefId: string;
  gig?: GigData;
}

interface InvoiceSubmissionModalProps {
  application: Application;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function InvoiceSubmissionModal({
  application,
  isOpen,
  onClose,
  onSuccess
}: InvoiceSubmissionModalProps) {
  const [hoursWorked, setHoursWorked] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const gig = application.gig;

  // Query chef profile for payment preferences
  const { data: chefProfile } = useQuery({
    queryKey: ["/api/profiles/chef", application.chefId],
    queryFn: () => apiRequest("GET", `/api/profiles/chef/${application.chefId}`).then(res => res.json()),
    enabled: !!application.chefId,
  });

  // Calculate default hours worked from start_time and end_time
  useEffect(() => {
    if (gig?.start_time && gig?.end_time) {
      const start = new Date(`1970-01-01T${gig.start_time}`);
      const end = new Date(`1970-01-01T${gig.end_time}`);
      const diffMs = end.getTime() - start.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      setHoursWorked(diffHours.toString());
    }
  }, [gig]);

  const formatDateRange = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) return "Date not provided";
    
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return "Date not provided";
      }
      
      const options: Intl.DateTimeFormatOptions = {
        month: "short",
        day: "numeric",
        year: "numeric"
      };
      
      return startDate === endDate 
        ? start.toLocaleDateString("en-GB", options)
        : `${start.toLocaleDateString("en-GB", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-GB", options)}`;
    } catch {
      return "Date not provided";
    }
  };

  const formatTimeRange = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return "Time not provided";
    const start = startTime.substring(0, 5);
    const end = endTime.substring(0, 5);
    return `${start} - ${end}`;
  };

  const calculateTotal = () => {
    const hours = parseFloat(hoursWorked) || 0;
    const rate = gig?.pay_rate || 0;
    return (hours * rate).toFixed(2);
  };

  const handleSubmit = async () => {
    if (!gig || !hoursWorked) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const hours = parseFloat(hoursWorked);
    if (isNaN(hours) || hours <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid number of hours",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const invoiceData = {
        gigId: gig.id,
        chefId: application.chefId,
        businessId: gig.created_by,
        hoursWorked: hours.toString(),
        ratePerHour: gig.pay_rate.toString(),
        totalAmount: calculateTotal(),
        notes: notes || null,
        status: "pending"
      };

      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invoiceData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit invoice");
      }

      toast({
        title: "Invoice Submitted",
        description: "Your invoice has been submitted successfully. The business has been notified.",
      });

      onSuccess();
      onClose();
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

  if (!gig) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Submit Invoice
          </DialogTitle>
          <DialogDescription>
            Submit your invoice for the completed gig. Review the details and enter your hours worked.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Gig Information */}
          <div className="bg-neutral-50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-lg">{gig.title}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-neutral-500" />
                <span className="text-sm">{gig.location || "Location not provided"}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-neutral-500" />
                <span className="text-sm">{formatDateRange(gig.start_date, gig.end_date)}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-neutral-500" />
                <span className="text-sm">{formatTimeRange(gig.start_time, gig.end_time)}</span>
              </div>
              
              <div className="text-sm">
                <span className="text-neutral-500">Rate: </span>
                <span className="font-medium">£{gig.pay_rate}/hr</span>
              </div>
            </div>
          </div>

          {/* Invoice Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="hoursWorked">Hours Worked *</Label>
              <Input
                id="hoursWorked"
                type="number"
                step="0.5"
                min="0"
                value={hoursWorked}
                onChange={(e) => setHoursWorked(e.target.value)}
                placeholder="Enter hours worked"
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes about the work completed..."
                rows={3}
              />
            </div>

            {/* Payment Method Display */}
            {chefProfile && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Payment via Bank Transfer
                </h4>
                <div className="text-sm text-blue-600">
                  {`Payment will be sent to ${chefProfile.bankName || 'your bank account'} (${chefProfile.accountNumber ? `****${chefProfile.accountNumber.slice(-4)}` : 'Account on file'})`}
                </div>
              </div>
            )}

            {/* Total Calculation */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-green-800">Total Amount:</span>
                <span className="text-xl font-bold text-green-800">£{calculateTotal()}</span>
              </div>
              <div className="text-sm text-green-600 mt-1">
                {hoursWorked || 0} hours × £{gig.pay_rate}/hr
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Invoice"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}