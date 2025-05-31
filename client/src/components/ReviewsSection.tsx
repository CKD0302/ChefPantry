import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MessageSquare } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Review {
  id: string;
  gigId: string;
  reviewerId: string;
  recipientId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

interface ReviewsSectionProps {
  recipientId: string;
  recipientType: "chef" | "business";
  showTitle?: boolean;
}

export default function ReviewsSection({ recipientId, recipientType, showTitle = true }: ReviewsSectionProps) {
  // Query reviews for this recipient
  const { data: reviews, isLoading: reviewsLoading } = useQuery<Review[]>({
    queryKey: ["/api/reviews/recipient", recipientId],
    queryFn: () => apiRequest("GET", `/api/reviews/recipient/${recipientId}`).then(res => res.json()),
  });

  // Query average rating
  const { data: ratingData, isLoading: ratingLoading } = useQuery<{ averageRating: number }>({
    queryKey: ["/api/reviews/rating", recipientId],
    queryFn: () => apiRequest("GET", `/api/reviews/rating/${recipientId}`).then(res => res.json()),
  });

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < rating ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };

  const averageRating = ratingData?.averageRating || 0;
  const reviewCount = reviews?.length || 0;

  if (reviewsLoading || ratingLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        {showTitle && (
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Reviews & Ratings
          </CardTitle>
        )}
        
        {/* Rating Summary */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {renderStars(Math.round(averageRating))}
            </div>
            <span className="text-lg font-semibold">
              {averageRating > 0 ? averageRating.toFixed(1) : "No ratings yet"}
            </span>
          </div>
          
          {reviewCount > 0 && (
            <Badge variant="secondary">
              {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {!reviews || reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No reviews yet</p>
            <p className="text-sm">Reviews will appear here after completed gigs</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.slice(0, 5).map((review) => (
              <div key={review.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {renderStars(review.rating)}
                    <span className="font-medium">{review.rating}/5</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {formatDate(review.createdAt)}
                  </span>
                </div>
                
                <p className="text-gray-700 leading-relaxed">{review.comment}</p>
              </div>
            ))}
            
            {reviews.length > 5 && (
              <div className="text-center pt-4">
                <p className="text-sm text-gray-500">
                  Showing latest 5 reviews of {reviews.length} total
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}