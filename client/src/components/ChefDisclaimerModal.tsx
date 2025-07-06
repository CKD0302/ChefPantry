import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ChefDisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function ChefDisclaimerModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  isLoading = false 
}: ChefDisclaimerModalProps) {
  console.log("ChefDisclaimerModal props:", { isOpen, isLoading });
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Disclaimer Confirmation
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800 leading-relaxed">
              I confirm I am an independent contractor responsible for my own taxes, insurance, and legal obligations. 
              I understand that Chef's Pantry is not my employer and accepts no liability for any work-related disputes, 
              incidents, or unpaid invoices. I acknowledge that platform fees contribute to the development, 
              maintenance, and improvement of the service.
            </p>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : "I Confirm"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}