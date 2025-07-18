import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, User, Building } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ReviewFormProps {
  isOpen: boolean;
  onClose: () => void;
  gigId: string;
  recipientId: string;
  recipientName: string;
  recipientType: 'chef' | 'business';
  gigTitle: string;
}

interface StarRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  label: string;
  required?: boolean;
}

function StarRating({ rating, onRatingChange, label, required = true }: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRatingChange(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 rounded transition-colors"
          >
            <Star
              className={`h-6 w-6 transition-colors ${
                star <= (hoverRating || rating)
                  ? "fill-orange-400 text-orange-400"
                  : "text-gray-300 hover:text-orange-300"
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600">
          {rating > 0 ? `${rating}/5` : "Click to rate"}
        </span>
      </div>
    </div>
  );
}

export default function ReviewForm({ 
  isOpen, 
  onClose, 
  gigId, 
  recipientId, 
  recipientName, 
  recipientType, 
  gigTitle 
}: ReviewFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Common states
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Category ratings for chefs reviewing businesses
  const [organisationRating, setOrganisationRating] = useState(0);
  const [equipmentRating, setEquipmentRating] = useState(0);
  const [welcomingRating, setWelcomingRating] = useState(0);

  // Category ratings for businesses reviewing chefs
  const [timekeepingRating, setTimekeepingRating] = useState(0);
  const [appearanceRating, setAppearanceRating] = useState(0);
  const [roleFulfilmentRating, setRoleFulfilmentRating] = useState(0);

  const userRole = user?.user_metadata?.role || 'chef';
  const isChefReviewingBusiness = userRole === 'chef' && recipientType === 'business';
  const isBusinessReviewingChef = userRole === 'business' && recipientType === 'chef';

  const calculateOverallRating = () => {
    if (isChefReviewingBusiness) {
      const ratings = [organisationRating, equipmentRating, welcomingRating].filter(r => r > 0);
      return ratings.length > 0 ? Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length) : 0;
    } else if (isBusinessReviewingChef) {
      const ratings = [timekeepingRating, appearanceRating, roleFulfilmentRating].filter(r => r > 0);
      return ratings.length > 0 ? Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length) : 0;
    }
    return 0;
  };

  const validateForm = () => {
    if (isChefReviewingBusiness) {
      return organisationRating > 0 && equipmentRating > 0 && welcomingRating > 0;
    } else if (isBusinessReviewingChef) {
      return timekeepingRating > 0 && appearanceRating > 0 && roleFulfilmentRating > 0;
    }
    return false;
  };

  const submitReview = useMutation({
    mutationFn: async (reviewData: any) => {
      const response = await apiRequest("POST", "/api/reviews", reviewData);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit review");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Review Submitted",
        description: `Your review for ${recipientName} has been submitted successfully.`,
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/pending", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/recipient", recipientId] });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/given", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/summary", recipientId] });

      onClose();
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setComment("");
    setOrganisationRating(0);
    setEquipmentRating(0);
    setWelcomingRating(0);
    setTimekeepingRating(0);
    setAppearanceRating(0);
    setRoleFulfilmentRating(0);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({
        title: "Missing Ratings",
        description: "Please provide ratings for all categories",
        variant: "destructive",
      });
      return;
    }

    const reviewData = {
      gigId,
      reviewerId: user?.id,
      recipientId,
      reviewerType: userRole,
      rating: calculateOverallRating(),
      comment: comment.trim() || null,
      // Category ratings for chefs reviewing businesses
      organisationRating: isChefReviewingBusiness ? organisationRating : null,
      equipmentRating: isChefReviewingBusiness ? equipmentRating : null,
      welcomingRating: isChefReviewingBusiness ? welcomingRating : null,
      // Category ratings for businesses reviewing chefs
      timekeepingRating: isBusinessReviewingChef ? timekeepingRating : null,
      appearanceRating: isBusinessReviewingChef ? appearanceRating : null,
      roleFulfilmentRating: isBusinessReviewingChef ? roleFulfilmentRating : null,
    };

    submitReview.mutate(reviewData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {recipientType === 'business' ? (
              <Building className="h-5 w-5" />
            ) : (
              <User className="h-5 w-5" />
            )}
            Review {recipientName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Gig Information */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-1">Gig Details</h4>
            <p className="text-sm text-gray-600">{gigTitle}</p>
          </div>

          {/* Category Ratings */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Rate Your Experience</h4>
            
            {isChefReviewingBusiness && (
              <div className="space-y-4">
                <StarRating
                  rating={organisationRating}
                  onRatingChange={setOrganisationRating}
                  label="Organisation"
                />
                <StarRating
                  rating={equipmentRating}
                  onRatingChange={setEquipmentRating}
                  label="Equipment"
                />
                <StarRating
                  rating={welcomingRating}
                  onRatingChange={setWelcomingRating}
                  label="Welcoming"
                />
              </div>
            )}

            {isBusinessReviewingChef && (
              <div className="space-y-4">
                <StarRating
                  rating={timekeepingRating}
                  onRatingChange={setTimekeepingRating}
                  label="Timekeeping"
                />
                <StarRating
                  rating={appearanceRating}
                  onRatingChange={setAppearanceRating}
                  label="Appearance"
                />
                <StarRating
                  rating={roleFulfilmentRating}
                  onRatingChange={setRoleFulfilmentRating}
                  label="Role Fulfilment"
                />
              </div>
            )}
          </div>

          {/* Overall Rating Display */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-800">
                Overall Rating: {calculateOverallRating()}/5
              </span>
            </div>
            <p className="text-sm text-blue-600 mt-1">
              Calculated from your category ratings
            </p>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">Additional Comments (Optional)</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share any additional feedback about your experience..."
              className="min-h-[100px]"
              maxLength={500}
            />
            <p className="text-xs text-gray-500">
              {comment.length}/500 characters
            </p>
          </div>

          {/* Review Guidelines */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <h4 className="font-medium text-amber-800 mb-2">Review Guidelines</h4>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• Be honest and constructive in your feedback</li>
              <li>• Focus on the work experience and professionalism</li>
              <li>• Avoid personal attacks or inappropriate language</li>
              <li>• Reviews cannot be edited once submitted</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitReview.isPending}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={submitReview.isPending || !validateForm()}
          >
            {submitReview.isPending ? "Submitting..." : "Submit Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}