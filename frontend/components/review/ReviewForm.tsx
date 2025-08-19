import { useState } from 'react';
import { Star, Send, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { reviewApi, CreateReviewRequest } from '../../services/reviewApi';

interface ReviewFormProps {
  productId: string;
  onReviewSubmitted: () => void;
  onCancel: () => void;
}

export function ReviewForm({ productId, onReviewSubmitted, onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      alert("1~5점 사이의 평점을 선택해주세요.");
      return;
    }

    if (comment.trim().length === 0) {
      alert("제품에 대한 의견을 간단히 작성해주세요.");
      return;
    }

    try {
      setIsSubmitting(true);
      const reviewData: CreateReviewRequest = {
        productId,
        rating,
        comment: comment.trim(),
      };

      await reviewApi.createReview(reviewData);
      
      alert("리뷰가 작성되었습니다. 소중한 의견 감사합니다!");
      
      onReviewSubmitted();
    } catch (error: any) {
      console.error('Failed to create review:', error);
      const errorMessage = error.response?.data?.error || "리뷰 작성에 실패했습니다.";
      alert(`리뷰 작성 실패: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStarClick = (selectedRating: number) => {
    setRating(selectedRating);
  };

  const handleStarHover = (hoveredRating: number) => {
    setHoverRating(hoveredRating);
  };

  const handleStarLeave = () => {
    setHoverRating(0);
  };

  const displayRating = hoverRating || rating;

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1: return '매우 불만족';
      case 2: return '불만족';
      case 3: return '보통';
      case 4: return '만족';
      case 5: return '매우 만족';
      default: return '평점을 선택해주세요';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5" />
          리뷰 작성하기
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 평점 선택 */}
          <div className="space-y-3">
            <Label className="text-base font-medium">평점</Label>
            <div className="flex items-center gap-3">
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                    onClick={() => handleStarClick(star)}
                    onMouseEnter={() => handleStarHover(star)}
                    onMouseLeave={handleStarLeave}
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        star <= displayRating
                          ? 'fill-yellow-400 text-yellow-400 hover:fill-yellow-500 hover:text-yellow-500'
                          : 'text-muted-foreground hover:text-yellow-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {getRatingText(displayRating)}
              </span>
            </div>
          </div>

          {/* 리뷰 내용 */}
          <div className="space-y-2">
            <Label htmlFor="comment" className="text-base font-medium">
              리뷰 내용
            </Label>
            <Textarea
              id="comment"
              placeholder="제품에 대한 솔직한 의견을 남겨주세요. 다른 사용자들에게 도움이 되는 리뷰를 작성해주시면 감사하겠습니다."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[120px] resize-none"
              maxLength={1000}
              disabled={isSubmitting}
            />
            <div className="text-xs text-muted-foreground text-right">
              {comment.length}/1000
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || rating === 0}
              className="min-w-[100px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  작성 중...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  리뷰 작성
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}