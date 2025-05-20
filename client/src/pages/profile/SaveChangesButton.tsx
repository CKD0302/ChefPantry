import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

interface SaveChangesButtonProps {
  isSubmitting: boolean;
  onSave: () => void;
}

export default function SaveChangesButton({ isSubmitting, onSave }: SaveChangesButtonProps) {
  // Force button to be enabled regardless of form state
  const [forceEnabled, setForceEnabled] = useState(false);
  
  useEffect(() => {
    // Enable the button after component mounts
    setForceEnabled(true);
  }, []);
  
  return (
    <Button 
      type="button" 
      className="bg-primary hover:bg-primary-dark"
      disabled={isSubmitting && !forceEnabled}
      onClick={onSave}
    >
      {isSubmitting ? "Saving..." : "Save Changes"}
    </Button>
  );
}