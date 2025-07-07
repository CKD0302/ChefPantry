import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BusinessDisclaimerModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function BusinessDisclaimerModal({
  isOpen,
  onAccept,
  onCancel,
  isLoading = false,
}: BusinessDisclaimerModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center">
            Business Terms & Disclaimer
          </DialogTitle>
          <DialogDescription className="text-center">
            Please read and accept these important terms before creating your business profile
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[50vh] p-4">
          <div className="space-y-4 text-sm leading-relaxed">
            <p className="font-medium text-gray-900">
              By proceeding to create your business profile, you acknowledge and agree to the following:
            </p>
            
            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
              <p className="text-gray-800">
                I understand that all chefs on Chef's Pantry are independent professionals and not employees of the platform. I accept full responsibility for compliance with employment, health & safety, and payment terms. I acknowledge that platform fees help maintain and develop the platform and that Chef's Pantry is not liable for disputes, claims, or unpaid work.
              </p>
            </div>
            
            <div className="space-y-3 text-gray-700">
              <h4 className="font-medium text-gray-900">Key Points:</h4>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2 mt-1">•</span>
                  <span>All chefs are independent contractors, not employees</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2 mt-1">•</span>
                  <span>You are responsible for employment law compliance</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2 mt-1">•</span>
                  <span>Health & safety compliance is your responsibility</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2 mt-1">•</span>
                  <span>Platform fees support service development</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2 mt-1">•</span>
                  <span>Chef's Pantry is not liable for disputes or unpaid work</span>
                </li>
              </ul>
            </div>
          </div>
        </ScrollArea>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-3">
          <Button 
            variant="outline" 
            onClick={onCancel}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button 
            onClick={onAccept}
            disabled={isLoading}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? "Processing..." : "I Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}