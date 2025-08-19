import { Star, User, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Separator } from '../ui/separator';
import { useState, useEffect } from 'react';
import { reviewApi } from '../../services/reviewApi';

interface SellerReview {
  id: string;
  reviewer: string;
  reviewerAvatar?: string;
  rating: number;
  comment: string;
  date: string;
  verifiedPurchase: boolean;
}

interface SellerReviewsProps {
  productId: string;
  sellerName: string;
  averageRating: number;
  totalReviews: number;
}

export function SellerReviews({ 
  productId,
  sellerName, 
  averageRating, 
  totalReviews
}: SellerReviewsProps) {
  const [reviews, setReviews] = useState<SellerReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const response = await reviewApi.getProductReviews(productId, 1, 10);
        setReviews(response.reviews.map(review => ({
          id: review.id,
          reviewer: review.user.username || review.user.email,
          reviewerAvatar: review.user.avatar,
          rating: review.rating,
          comment: review.comment,
          date: review.createdAt,
          verifiedPurchase: true
        })));
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [productId]);
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getInitials = (name: string) => {
    return name.slice(0, 1);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          판매자 리뷰
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Seller Rating Overview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">{sellerName}님에 대한 평가</h4>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star}
                    className={`w-4 h-4 ${star <= Math.floor(averageRating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                  />
                ))}
              </div>
              <span className="font-medium">{averageRating}</span>
              <span className="text-muted-foreground">({totalReviews}개 리뷰)</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Reviews List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>리뷰를 불러오는 중...</p>
            </div>
          ) : reviews.length > 0 ? (
            reviews.map((review, index) => (
              <div key={review.id}>
                <div className="flex gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={review.reviewerAvatar} />
                    <AvatarFallback className="text-xs">
                      {getInitials(review.reviewer)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{review.reviewer}</span>
                        {review.verifiedPurchase && (
                          <Badge variant="outline" className="text-xs px-1 py-0">
                            구매 확인
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="flex items-center space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star}
                              className={`w-3 h-3 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                            />
                          ))}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {formatDate(review.date)}
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {review.comment}
                    </p>
                  </div>
                </div>
                
                {index < reviews.length - 1 && <Separator className="mt-4" />}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>아직 판매자에 대한 리뷰가 없습니다.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}