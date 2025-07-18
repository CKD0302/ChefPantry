import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, User, Building, MessageSquare, Calendar } from "lucide-react";

interface Review {
  id: string;
  gigId: string;
  reviewerId: string;
  recipientId: string;
  reviewerType: 'chef' | 'business';
  rating: number;
  comment?: string;
  // Category ratings for chefs reviewing venues
  organisationRating?: number;
  equipmentRating?: number;
  welcomingRating?: number;
  // Category ratings for venues reviewing chefs
  timekeepingRating?: number;
  appearanceRating?: number;
  roleFulfilmentRating?: number;
  createdAt: string;
  gig?: {
    id: string;
    title: string;
    startDate: string;
    businessName?: string;
  };
  reviewer?: {
    id: string;
    fullName: string;
  };
  recipient?: {
    id: string;
    fullName: string;
  };
}

interface ReviewListProps {
  reviews: Review[];
  isLoading: boolean;
  emptyMessage: string;
  emptySubtext: string;
  showGigDetails?: boolean;
}

interface StarDisplayProps {
  rating: number;
  showNumber?: boolean;
  size?: 'sm' | 'md';
}

function StarDisplay({ rating, showNumber = true, size = 'sm' }: StarDisplayProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5'
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClasses[size]} ${
            star <= rating
              ? "fill-orange-400 text-orange-400"
              : "text-gray-300"
          }`}
        />
      ))}
      {showNumber && (
        <span className="text-sm text-gray-600 ml-1">
          {rating}/5
        </span>
      )}
    </div>
  );
}

function CategoryRatings({ review }: { review: Review }) {
  const isChefReview = review.reviewerType === 'chef';
  
  if (isChefReview) {
    // Chef reviewing business
    const categories = [
      { name: 'Organisation', rating: review.organisationRating },
      { name: 'Equipment', rating: review.equipmentRating },
      { name: 'Welcoming', rating: review.welcomingRating },
    ].filter(cat => cat.rating && cat.rating > 0);

    if (categories.length === 0) return null;

    return (
      <div className="space-y-1">
        {categories.map((category) => (
          <div key={category.name} className="flex items-center justify-between text-xs">
            <span className="text-gray-600">{category.name}</span>
            <StarDisplay rating={category.rating!} showNumber={false} />
          </div>
        ))}
      </div>
    );
  } else {
    // Business reviewing chef
    const categories = [
      { name: 'Timekeeping', rating: review.timekeepingRating },
      { name: 'Appearance', rating: review.appearanceRating },
      { name: 'Role Fulfilment', rating: review.roleFulfilmentRating },
    ].filter(cat => cat.rating && cat.rating > 0);

    if (categories.length === 0) return null;

    return (
      <div className="space-y-1">
        {categories.map((category) => (
          <div key={category.name} className="flex items-center justify-between text-xs">
            <span className="text-gray-600">{category.name}</span>
            <StarDisplay rating={category.rating!} showNumber={false} />
          </div>
        ))}
      </div>
    );
  }
}

export default function ReviewList({ 
  reviews, 
  isLoading, 
  emptyMessage, 
  emptySubtext, 
  showGigDetails = true 
}: ReviewListProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-green-600";
    if (rating >= 4.0) return "text-blue-600";
    if (rating >= 3.5) return "text-yellow-600";
    if (rating >= 3.0) return "text-orange-600";
    return "text-red-600";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>{emptyMessage}</p>
        <p className="text-sm">{emptySubtext}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id} className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Review Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {review.reviewerType === 'business' ? (
                      <Building className="h-4 w-4 text-blue-600" />
                    ) : (
                      <User className="h-4 w-4 text-green-600" />
                    )}
                    <span className="font-medium text-gray-900">
                      {review.reviewer?.fullName || 'Anonymous'}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {review.reviewerType === 'business' ? 'Business' : 'Chef'}
                    </Badge>
                  </div>
                  
                  {showGigDetails && review.gig && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <Calendar className="h-4 w-4" />
                      <span>{review.gig.title}</span>
                      <span>•</span>
                      <span>{formatDate(review.gig.startDate)}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>{formatDate(review.createdAt)}</span>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-2xl font-bold ${getRatingColor(review.rating)}`}>
                      {review.rating}
                    </span>
                    <StarDisplay rating={review.rating} showNumber={false} />
                  </div>
                </div>
              </div>

              {/* Category Ratings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-sm text-gray-900 mb-2">Category Ratings</h4>
                  <CategoryRatings review={review} />
                </div>
              </div>

              {/* Comment */}
              {review.comment && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-sm text-gray-900 mb-2 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Feedback
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    "{review.comment}"
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}