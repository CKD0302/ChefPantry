import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { ArrowLeft, Star, MessageSquare, Plus, User, Building } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import ReviewForm from "@/components/ReviewForm";
import ReviewSummary from "@/components/ReviewSummary";
import ReviewList from "@/components/ReviewList";

interface PendingReview {
  gigId: string;
  gigTitle: string;
  recipientId: string;
  recipientName: string;
  recipientType: 'chef' | 'business';
  gigDate: string;
  businessName?: string;
}

export default function Reviews() {
  const { user } = useAuth();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [selectedReview, setSelectedReview] = useState<PendingReview | null>(null);

  // Get pending reviews (gigs that need reviews)
  const { data: pendingReviews, isLoading: pendingLoading } = useQuery<PendingReview[]>({
    queryKey: ["/api/reviews/pending", user?.id],
    queryFn: () => apiRequest("GET", `/api/reviews/pending/${user?.id}`).then(res => res.json()),
    enabled: !!user?.id,
  });

  // Get reviews I've received
  const { data: receivedReviews, isLoading: receivedLoading } = useQuery({
    queryKey: ["/api/reviews/recipient", user?.id],
    queryFn: () => apiRequest("GET", `/api/reviews/recipient/${user?.id}`).then(res => res.json()),
    enabled: !!user?.id,
  });

  // Get reviews I've given
  const { data: givenReviews, isLoading: givenLoading } = useQuery({
    queryKey: ["/api/reviews/given", user?.id],
    queryFn: () => apiRequest("GET", `/api/reviews/given/${user?.id}`).then(res => res.json()),
    enabled: !!user?.id,
  });

  const handleLeaveReview = (pendingReview: PendingReview) => {
    setSelectedReview(pendingReview);
    setShowReviewForm(true);
  };

  const handleCloseReviewForm = () => {
    setShowReviewForm(false);
    setSelectedReview(null);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Please sign in to access reviews</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Reviews</h1>
            <p className="text-gray-600 mt-2">Manage your reviews and feedback</p>
          </div>
          <div className="flex justify-start">
            <ReviewSummary recipientId={user.id} />
          </div>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Pending Reviews
              {pendingReviews && pendingReviews.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {pendingReviews.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="received" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Received
            </TabsTrigger>
            <TabsTrigger value="given" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Given
            </TabsTrigger>
          </TabsList>

          {/* Pending Reviews Tab */}
          <TabsContent value="pending" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Pending Reviews
                </CardTitle>
                <CardDescription>
                  Leave reviews for recently completed gigs
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : !pendingReviews || pendingReviews.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No pending reviews</p>
                    <p className="text-sm">Complete gigs to leave reviews</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingReviews.map((pendingReview) => (
                      <div key={pendingReview.gigId} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{pendingReview.gigTitle}</h4>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                              <span className="flex items-center gap-1">
                                {pendingReview.recipientType === 'business' ? (
                                  <Building className="h-4 w-4" />
                                ) : (
                                  <User className="h-4 w-4" />
                                )}
                                {pendingReview.recipientName}
                              </span>
                              <span>•</span>
                              <span>{formatDate(pendingReview.gigDate)}</span>
                            </div>
                          </div>
                          <Button onClick={() => handleLeaveReview(pendingReview)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Leave Review
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Received Reviews Tab */}
          <TabsContent value="received" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Reviews Received
                </CardTitle>
                <CardDescription>
                  Reviews and feedback from your clients and collaborators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ReviewList 
                  reviews={receivedReviews || []} 
                  isLoading={receivedLoading}
                  emptyMessage="No reviews received yet"
                  emptySubtext="Complete gigs to receive reviews from clients"
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Given Reviews Tab */}
          <TabsContent value="given" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Reviews Given
                </CardTitle>
                <CardDescription>
                  Reviews and feedback you've provided to others
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ReviewList 
                  reviews={givenReviews || []} 
                  isLoading={givenLoading}
                  emptyMessage="No reviews given yet"
                  emptySubtext="Complete gigs and leave reviews to help others"
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Review Form Modal */}
        {showReviewForm && selectedReview && (
          <ReviewForm
            isOpen={showReviewForm}
            onClose={handleCloseReviewForm}
            gigId={selectedReview.gigId}
            recipientId={selectedReview.recipientId}
            recipientName={selectedReview.recipientName}
            recipientType={selectedReview.recipientType}
            gigTitle={selectedReview.gigTitle}
          />
        )}
      </div>
    </div>
  );
}