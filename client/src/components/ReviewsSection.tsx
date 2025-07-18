import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Review {
  id: string;
  gigId: string;
  reviewerId: string;
  recipientId: string;
  rating: number;
  comment: string;
  createdAt: string;
  reviewer?: {
    id: string;
    fullName: string;
  };
  gig?: {
    id: string;
    title: string;
    startDate: string;
  };
}

interface ReviewsSectionProps {
  recipientId: string;
  recipientName: string;
  recipientType: "chef" | "business";
}

export default function ReviewsSection({ recipientId, recipientName, recipientType }: ReviewsSectionProps) {
  // Fetch reviews for this recipient
  const { data: reviews, isLoading: reviewsLoading } = useQuery({
    queryKey: ["/api/reviews/recipient", recipientId],
    queryFn: () => apiRequest("GET", `/api/reviews/recipient/${recipientId}`).then(res => res.json()) as Promise<Review[]>,
  });

  // Fetch average rating
  const { data: ratingData, isLoading: ratingLoading } = useQuery({
    queryKey: ["/api/reviews/rating", recipientId],
    queryFn: () => apiRequest("GET", `/api/reviews/rating/${recipientId}`).then(res => res.json()) as Promise<{ averageRating: number }>,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderStars = (rating: number, size: "sm" | "md" | "lg" = "md") => {
    const starSizes = {
      sm: "h-3 w-3",
      md: "h-4 w-4", 
      lg: "h-5 w-5"
    };

    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }, (_, index) => (
          <Star
            key={index}
            className={`${starSizes[size]} ${
              index < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  if (reviewsLoading || ratingLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const averageRating = parseFloat(ratingData?.averageRating?.toString() || '0');
  const reviewCount = reviews?.length || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          Reviews ({reviewCount})
        </CardTitle>
        <CardDescription>
          {reviewCount > 0 ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {renderStars(Math.round(averageRating), "sm")}
                <span className="text-sm font-medium">{averageRating.toFixed(1)}</span>
                <span className="text-sm text-gray-500">out of 5</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {reviewCount} review{reviewCount !== 1 ? 's' : ''}
              </Badge>
            </div>
          ) : (
            `No reviews yet for ${recipientName}`
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!reviews || reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Star className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No reviews yet</p>
            <p className="text-sm mt-2">
              Reviews will appear here after completed gigs
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="border-b pb-4 last:border-b-0 last:pb-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {review.reviewer?.fullName || 'Anonymous'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(review.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderStars(review.rating, "sm")}
                    <span className="text-sm font-medium">{review.rating}</span>
                  </div>
                </div>
                
                {review.gig && (
                  <div className="mb-2">
                    <p className="text-xs text-blue-600 bg-blue-50 inline-block px-2 py-1 rounded">
                      Gig: {review.gig.title}
                    </p>
                  </div>
                )}
                
                <p className="text-sm text-gray-700 leading-relaxed">
                  {review.comment}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}