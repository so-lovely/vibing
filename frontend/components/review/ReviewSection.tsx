import { useState, useEffect } from 'react';
import { Star, Plus, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { useAuth } from '../../contexts/AuthContext';
import { ReviewForm } from './ReviewForm';
import { SellerReviews } from '../product/SellerReviews';
import { reviewApi, Review } from '../../services/reviewApi';

interface ReviewSectionProps {
  productId: string;
  sellerName: string;
  averageRating: number;
  totalReviews: number;
}

export function ReviewSection({ 
  productId, 
  sellerName, 
  averageRating, 
  totalReviews 
}: ReviewSectionProps) {
  const { user } = useAuth();
  const [canReview, setCanReview] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const checkReviewStatus = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // 사용자가 이 제품을 리뷰할 수 있는지 확인
        const canReviewResponse = await reviewApi.canUserReview(productId);
        setCanReview(canReviewResponse);

        // 사용자가 이미 작성한 리뷰가 있는지 확인
        try {
          const existingReview = await reviewApi.getUserReviewForProduct(productId);
          setUserReview(existingReview);
          setCanReview(false); // 이미 리뷰를 작성했으면 더 이상 작성할 수 없음
        } catch (error: any) {
          if (error.response?.status !== 404) {
            console.error('Error fetching user review:', error);
          }
        }
      } catch (error) {
        console.error('Failed to check review status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkReviewStatus();
  }, [productId, user, refreshKey]);

  const handleReviewSubmitted = () => {
    setShowReviewForm(false);
    setRefreshKey(prev => prev + 1);
    // 리뷰가 작성되면 부모 컴포넌트에서 제품 정보를 다시 불러와야 할 수도 있습니다.
  };

  const handleCancelReview = () => {
    setShowReviewForm(false);
  };

  const handleDeleteReview = async () => {
    if (!userReview) return;

    try {
      await reviewApi.deleteReview(userReview.id);
      alert("리뷰가 삭제되었습니다.");
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Failed to delete review:', error);
      alert("리뷰 삭제에 실패했습니다. 다시 시도해주세요.");
    }
  };

  if (showReviewForm) {
    return (
      <ReviewForm
        productId={productId}
        onReviewSubmitted={handleReviewSubmitted}
        onCancel={handleCancelReview}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* 사용자 리뷰 상태 */}
      {user && (
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="text-center py-4 text-muted-foreground">
                <p>리뷰 상태를 확인하는 중...</p>
              </div>
            ) : userReview ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">내가 작성한 리뷰</h4>
                  <Badge variant="outline">작성 완료</Badge>
                </div>
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star}
                          className={`w-4 h-4 ${star <= userReview.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(userReview.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  <p className="text-sm">{userReview.comment}</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowReviewForm(true)}
                    >
                      수정
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleDeleteReview}
                    >
                      삭제
                    </Button>
                  </div>
                </div>
              </div>
            ) : canReview ? (
              <div className="text-center space-y-3">
                <div className="space-y-2">
                  <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground" />
                  <h4 className="font-medium">구매한 제품에 대한 리뷰를 남겨주세요</h4>
                  <p className="text-sm text-muted-foreground">
                    다른 사용자들에게 도움이 되는 솔직한 리뷰를 작성해주시면 감사하겠습니다.
                  </p>
                </div>
                <Button onClick={() => setShowReviewForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  리뷰 작성하기
                </Button>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <p>이 제품을 구매한 후 리뷰를 작성하실 수 있습니다.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* 제품 리뷰 목록 */}
      <SellerReviews
        productId={productId}
        sellerName={sellerName}
        averageRating={averageRating}
        totalReviews={totalReviews}
      />
    </div>
  );
}