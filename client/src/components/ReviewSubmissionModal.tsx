import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Star, CheckCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ReviewSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  gigId: string;
  recipientId: string;
  reviewerId: string;
  recipientName: string;
  recipientType: "chef" | "business";
  gigTitle: string;
}

export default function ReviewSubmissionModal({
  isOpen,
  onClose,
  gigId,
  recipientId,
  reviewerId,
  recipientName,
  recipientType,
  gigTitle
}: ReviewSubmissionModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a star rating",
        variant: "destructive",
      });
      return;
    }

    if (!comment.trim()) {
      toast({
        title: "Comment Required",
        description: "Please provide a comment with your review",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const reviewData = {
        gigId,
        reviewerId,
        recipientId,
        rating,
        comment: comment.trim()
      };

      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reviewData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit review");
      }

      toast({
        title: "Review Submitted",
        description: `Your review for ${recipientName} has been submitted successfully.`,
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/recipient", recipientId] });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/rating", recipientId] });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/check"] });

      onClose();
      setRating(0);
      setComment("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1;
      const isActive = starValue <= (hoverRating || rating);
      
      return (
        <button
          key={index}
          type="button"
          onClick={() => setRating(starValue)}
          onMouseEnter={() => setHoverRating(starValue)}
          onMouseLeave={() => setHoverRating(0)}
          className={`p-1 transition-colors ${
            isActive ? "text-yellow-400" : "text-gray-300 hover:text-yellow-200"
          }`}
        >
          <Star className="h-8 w-8 fill-current" />
        </button>
      );
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Leave a Review</DialogTitle>
          <DialogDescription>
            Share your experience working with {recipientName} on "{gigTitle}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Rating Selection */}
          <div className="space-y-2">
            <Label>Rating *</Label>
            <div className="flex items-center space-x-1">
              {renderStars()}
            </div>
            {rating > 0 && (
              <p className="text-sm text-gray-600">
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very Good"}
                {rating === 5 && "Excellent"}
              </p>
            )}
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">Comment *</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={`Share your experience working with ${recipientName}. What went well? What could be improved?`}
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-gray-500">
              {comment.length}/500 characters
            </p>
          </div>

          {/* Review Guidelines */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">Review Guidelines</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Be honest and constructive in your feedback</li>
              <li>• Focus on the work experience and professionalism</li>
              <li>• Avoid personal attacks or inappropriate language</li>
              <li>• Reviews cannot be edited once submitted</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || rating === 0}>
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}