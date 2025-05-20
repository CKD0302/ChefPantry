import { Button } from "@/components/ui/button";

interface SaveChangesButtonProps {
  isSubmitting: boolean;
  onSave: () => void;
}

export default function SaveChangesButton({ isSubmitting, onSave }: SaveChangesButtonProps) {
  return (
    <Button 
      type="button" 
      className="bg-primary hover:bg-primary-dark"
      disabled={isSubmitting}
      onClick={onSave}
    >
      {isSubmitting ? "Saving..." : "Save Changes"}
    </Button>
  );
}