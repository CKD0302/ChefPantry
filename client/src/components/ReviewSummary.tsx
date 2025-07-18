import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, TrendingUp, Users } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ReviewSummaryProps {
  recipientId: string;
  showDetails?: boolean;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  categoryAverages: {
    // For chefs
    organisationRating?: number;
    equipmentRating?: number;
    welcomingRating?: number;
    // For businesses
    timekeepingRating?: number;
    appearanceRating?: number;
    roleFulfilmentRating?: number;
  };
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

interface StarDisplayProps {
  rating: number;
  showNumber?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

function StarDisplay({ rating, showNumber = true, size = 'md' }: StarDisplayProps) {
  const roundedRating = Math.round(rating * 2) / 2; // Round to nearest 0.5
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClasses[size]} ${
            star <= Math.floor(roundedRating)
              ? "fill-orange-400 text-orange-400"
              : star - 0.5 === roundedRating
              ? "fill-orange-200 text-orange-400"
              : "text-gray-300"
          }`}
        />
      ))}
      {showNumber && (
        <span className="text-sm text-gray-600 ml-1">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

export default function ReviewSummary({ recipientId, showDetails = true }: ReviewSummaryProps) {
  const { data: stats, isLoading } = useQuery<ReviewStats>({
    queryKey: ["/api/reviews/summary", recipientId],
    queryFn: () => apiRequest("GET", `/api/reviews/summary/${recipientId}`).then(res => res.json()),
    enabled: !!recipientId,
  });

  if (isLoading) {
    return (
      <div className="w-full max-w-sm">
        <div className="animate-pulse">
          <div className="h-20 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!stats || stats.totalReviews === 0) {
    return (
      <div className="w-full max-w-sm">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Star className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm text-gray-500">No reviews yet</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-green-600";
    if (rating >= 4.0) return "text-blue-600";
    if (rating >= 3.5) return "text-yellow-600";
    if (rating >= 3.0) return "text-orange-600";
    return "text-red-600";
  };

  const getRatingBadge = (rating: number) => {
    if (rating >= 4.5) return { text: "Excellent", variant: "default" as const };
    if (rating >= 4.0) return { text: "Very Good", variant: "secondary" as const };
    if (rating >= 3.5) return { text: "Good", variant: "outline" as const };
    if (rating >= 3.0) return { text: "Fair", variant: "outline" as const };
    return { text: "Needs Improvement", variant: "destructive" as const };
  };

  const badge = getRatingBadge(stats.averageRating);
  const hasCategories = Object.values(stats.categoryAverages).some(rating => rating && rating > 0);

  return (
    <div className="w-full max-w-sm">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Review Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Overall Rating */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <span className={`text-3xl font-bold ${getRatingColor(stats.averageRating)}`}>
                {stats.averageRating.toFixed(1)}
              </span>
              <div className="flex flex-col items-start">
                <StarDisplay rating={stats.averageRating} showNumber={false} />
                <Badge variant={badge.variant} className="text-xs mt-1">
                  {badge.text}
                </Badge>
              </div>
            </div>
            <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
              <Users className="h-4 w-4" />
              <span>{stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Category Breakdown */}
          {showDetails && hasCategories && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-900">Category Ratings</h4>
              <div className="space-y-2">
                {stats.categoryAverages.organisationRating && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Organisation</span>
                    <StarDisplay rating={stats.categoryAverages.organisationRating} size="sm" />
                  </div>
                )}
                {stats.categoryAverages.equipmentRating && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Equipment</span>
                    <StarDisplay rating={stats.categoryAverages.equipmentRating} size="sm" />
                  </div>
                )}
                {stats.categoryAverages.welcomingRating && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Welcoming</span>
                    <StarDisplay rating={stats.categoryAverages.welcomingRating} size="sm" />
                  </div>
                )}
                {stats.categoryAverages.timekeepingRating && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Timekeeping</span>
                    <StarDisplay rating={stats.categoryAverages.timekeepingRating} size="sm" />
                  </div>
                )}
                {stats.categoryAverages.appearanceRating && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Appearance</span>
                    <StarDisplay rating={stats.categoryAverages.appearanceRating} size="sm" />
                  </div>
                )}
                {stats.categoryAverages.roleFulfilmentRating && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Role Fulfilment</span>
                    <StarDisplay rating={stats.categoryAverages.roleFulfilmentRating} size="sm" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rating Distribution */}
          {showDetails && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-900">Rating Distribution</h4>
              <div className="space-y-1">
                {[5, 4, 3, 2, 1].map((stars) => (
                  <div key={stars} className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600 w-3">{stars}</span>
                    <Star className="h-3 w-3 fill-orange-400 text-orange-400" />
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-orange-400 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${stats.totalReviews > 0 ? (stats.ratingDistribution[stars as keyof typeof stats.ratingDistribution] / stats.totalReviews) * 100 : 0}%`
                        }}
                      />
                    </div>
                    <span className="text-gray-600 w-6 text-right">
                      {stats.ratingDistribution[stars as keyof typeof stats.ratingDistribution]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}