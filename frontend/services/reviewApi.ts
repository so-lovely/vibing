import { apiClient } from './api';

export interface User {
  id: string;
  username?: string;
  email: string;
  avatar?: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  user: User;
}

export interface CreateReviewRequest {
  productId: string;
  rating: number;
  comment: string;
}

export interface ReviewsResponse {
  reviews: Review[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface RatingDistribution {
  [rating: number]: number;
}

export const reviewApi = {
  // 제품의 리뷰 목록 조회
  getProductReviews: async (
    productId: string, 
    page: number = 1, 
    limit: number = 10
  ): Promise<ReviewsResponse> => {
    return await apiClient.get(`/reviews/product/${productId}?page=${page}&limit=${limit}`);
  },

  // 사용자가 제품에 대해 작성한 리뷰 조회
  getUserReviewForProduct: async (productId: string): Promise<Review | null> => {
    try {
      return await apiClient.get(`/reviews/user/product/${productId}`);
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  },

  // 리뷰 작성
  createReview: async (reviewData: CreateReviewRequest): Promise<Review> => {
    return await apiClient.post('/reviews', reviewData);
  },

  // 리뷰 수정
  updateReview: async (reviewId: string, reviewData: Partial<CreateReviewRequest>): Promise<Review> => {
    return await apiClient.put(`/reviews/${reviewId}`, reviewData);
  },

  // 리뷰 삭제
  deleteReview: async (reviewId: string): Promise<void> => {
    await apiClient.delete(`/reviews/${reviewId}`);
  },

  // 리뷰 작성 가능 여부 확인
  canUserReview: async (productId: string): Promise<boolean> => {
    const response = await apiClient.get<{canReview: boolean}>(`/reviews/can-review/${productId}`);
    return response.canReview;
  },

  // 제품의 평점 분포 조회
  getRatingDistribution: async (productId: string): Promise<RatingDistribution> => {
    return await apiClient.get(`/reviews/product/${productId}/rating-distribution`);
  }
};