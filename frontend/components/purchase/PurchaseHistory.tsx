import React, { useState, useEffect } from 'react';
import { Download, FileText, AlertTriangle, Clock, Eye, Star } from 'lucide-react';
import PurchaseStatusBadge from './PurchaseStatusBadge';
import DisputeRequestModal from './DisputeRequestModal';
import { ReviewForm } from '../review/ReviewForm';
import { reviewApi } from '../../services/reviewApi';
import { handleSessionExpiration } from '../../utils/auth';
import { formatPrice, convertUsdToKrw } from '../../utils/purchaseUtils';

interface Purchase {
  id: string;
  purchaseDate: string;
  price: number;
  status: string;
  displayStatus: string;
  orderId: string;
  paymentMethod: string;
  canRequestDispute: boolean;
  daysUntilAutoConfirm?: number;
  disputeReason?: string;
  downloadUrl?: string;
  licenseKey?: string;
  product: {
    id: string;
    title: string;
    imageUrl?: string;
    author: string;
  };
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export default function PurchaseHistory() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [disputeModal, setDisputeModal] = useState<{
    isOpen: boolean;
    purchaseId: string;
    productTitle: string;
  }>({
    isOpen: false,
    purchaseId: '',
    productTitle: ''
  });
  const [disputeLoading, setDisputeLoading] = useState(false);
  
  // 리뷰 관련 상태
  const [reviewModal, setReviewModal] = useState<{
    isOpen: boolean;
    productId: string;
    productTitle: string;
  }>({
    isOpen: false,
    productId: '',
    productTitle: ''
  });
  const [reviewStates, setReviewStates] = useState<Record<string, {
    canReview: boolean;
    hasReview: boolean;
    loading: boolean;
  }>>({});

  useEffect(() => {
    fetchPurchaseHistory();
  }, [currentPage]);

  const fetchPurchaseHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth-token');
      if (!token) {
        throw new Error('Authentication required');
      }

      console.log('Fetching purchase history...', { currentPage, token: token.substring(0, 20) + '...' });

      const response = await fetch(`/api/purchase/history?page=${currentPage}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          handleSessionExpiration();
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', { status: response.status, errorData });
        throw new Error(errorData.error?.message || `HTTP ${response.status}: Failed to fetch purchase history`);
      }

      const data = await response.json();
      console.log('Purchase history response:', data);
      
      // Validate response structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format');
      }
      
      const purchaseData = Array.isArray(data.purchases) ? data.purchases : [];
      setPurchases(purchaseData);
      setPagination(data.pagination || null);
      
      // 각 구매에 대한 리뷰 상태를 확인
      await checkReviewStates(purchaseData);
    } catch (error) {
      console.error('Error fetching purchase history:', error);
      // Show error to user
      alert(`구매 내역을 불러오는 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setLoading(false);
    }
  };

  // 리뷰 상태 확인
  const checkReviewStates = async (purchaseList: Purchase[]) => {
    const newReviewStates: Record<string, { canReview: boolean; hasReview: boolean; loading: boolean; }> = {};
    
    for (const purchase of purchaseList) {
      // 완료된 구매만 리뷰 가능
      if (purchase.status === 'completed' || purchase.status === 'confirmed') {
        newReviewStates[purchase.product.id] = { canReview: false, hasReview: false, loading: true };
        
        try {
          // 리뷰 작성 가능 여부 확인
          const canReview = await reviewApi.canUserReview(purchase.product.id);
          
          // 기존 리뷰 존재 여부 확인
          const existingReview = await reviewApi.getUserReviewForProduct(purchase.product.id);
          
          newReviewStates[purchase.product.id] = {
            canReview: canReview,
            hasReview: existingReview !== null,
            loading: false
          };
        } catch (error) {
          console.error(`Error checking review state for product ${purchase.product.id}:`, error);
          newReviewStates[purchase.product.id] = { canReview: false, hasReview: false, loading: false };
        }
      }
    }
    
    setReviewStates(newReviewStates);
  };

  // 리뷰 작성 완료 핸들러
  const handleReviewSubmitted = () => {
    setReviewModal({ isOpen: false, productId: '', productTitle: '' });
    // 리뷰 상태를 다시 확인
    checkReviewStates(purchases);
  };

  const handleDisputeRequest = async (reason: string) => {
    try {
      setDisputeLoading(true);
      const token = localStorage.getItem('auth-token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/purchase/${disputeModal.purchaseId}/dispute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to request dispute');
      }

      // Refresh purchase history to show updated status
      await fetchPurchaseHistory();
      
      setDisputeModal({ isOpen: false, purchaseId: '', productTitle: '' });
    } catch (error) {
      throw error; // Re-throw to be handled by the modal
    } finally {
      setDisputeLoading(false);
    }
  };

  const handleDownload = async (purchaseId: string) => {
    try {
      const token = localStorage.getItem('auth-token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/purchase/${purchaseId}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get download URL');
      }

      const data = await response.json();
      if (data.downloadUrl) {
        window.open(data.downloadUrl, '_blank');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('다운로드 중 오류가 발생했습니다.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">구매 내역</h2>
        {pagination && (
          <p className="text-sm text-gray-600">
            총 {pagination.totalItems}개의 구매 내역
          </p>
        )}
      </div>

      {purchases.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">구매 내역이 없습니다</h3>
          <p className="text-gray-600 mb-4">아직 구매한 제품이 없습니다.</p>
          <button
            onClick={() => window.location.href = '/products'}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            제품 둘러보기
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {purchases.map((purchase) => (
            <div key={purchase.id} className="bg-white rounded-lg shadow-sm border">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <img
                      src={purchase.product.imageUrl || '/placeholder-product.png'}
                      alt={purchase.product.title}
                      className="w-16 h-16 object-cover rounded-lg bg-gray-100"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {purchase.product.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        by {purchase.product.author}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{formatDate(purchase.purchaseDate)}</span>
                        <span>주문번호: {purchase.orderId}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900 mb-2">
                      {formatPrice(convertUsdToKrw(purchase.price))}
                    </div>
                    <PurchaseStatusBadge
                      status={purchase.status}
                      displayStatus={purchase.displayStatus}
                      daysUntilAutoConfirm={purchase.daysUntilAutoConfirm}
                      canRequestDispute={purchase.canRequestDispute}
                    />
                  </div>
                </div>

                {purchase.disputeReason && (
                  <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-orange-800">이의제기 사유</p>
                        <p className="text-sm text-orange-700 mt-1">{purchase.disputeReason}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-3">
                    {(purchase.status === 'completed' || purchase.status === 'confirmed') && (
                      <button
                        onClick={() => handleDownload(purchase.id)}
                        className="inline-flex items-center px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Download className="h-4 w-4 mr-1.5" />
                        다운로드
                      </button>
                    )}
                    
                    {purchase.licenseKey && (
                      <button
                        onClick={() => navigator.clipboard.writeText(purchase.licenseKey!)}
                        className="inline-flex items-center px-3 py-1.5 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                      >
                        <FileText className="h-4 w-4 mr-1.5" />
                        라이선스 복사
                      </button>
                    )}

                    {/* 리뷰 버튼 */}
                    {(purchase.status === 'completed' || purchase.status === 'confirmed') && (
                      <>
                        {reviewStates[purchase.product.id]?.loading ? (
                          <button
                            disabled
                            className="inline-flex items-center px-3 py-1.5 text-sm text-gray-400 cursor-not-allowed rounded-lg"
                          >
                            <Star className="h-4 w-4 mr-1.5" />
                            확인 중...
                          </button>
                        ) : reviewStates[purchase.product.id]?.hasReview ? (
                          <button
                            disabled
                            className="inline-flex items-center px-3 py-1.5 text-sm text-gray-600 bg-gray-100 rounded-lg cursor-not-allowed"
                          >
                            <Star className="h-4 w-4 mr-1.5 fill-yellow-400 text-yellow-400" />
                            리뷰 작성완료
                          </button>
                        ) : reviewStates[purchase.product.id]?.canReview ? (
                          <button
                            onClick={() => setReviewModal({
                              isOpen: true,
                              productId: purchase.product.id,
                              productTitle: purchase.product.title
                            })}
                            className="inline-flex items-center px-3 py-1.5 text-sm text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 rounded-lg transition-colors"
                          >
                            <Star className="h-4 w-4 mr-1.5" />
                            리뷰쓰기
                          </button>
                        ) : null}
                      </>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {purchase.canRequestDispute && (
                      <button
                        onClick={() => setDisputeModal({
                          isOpen: true,
                          purchaseId: purchase.id,
                          productTitle: purchase.product.title
                        })}
                        className="inline-flex items-center px-3 py-1.5 text-sm text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors"
                      >
                        <AlertTriangle className="h-4 w-4 mr-1.5" />
                        이의제기
                      </button>
                    )}
                    
                    <button className="inline-flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                      <Eye className="h-4 w-4 mr-1.5" />
                      상세보기
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 pt-6">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            이전
          </button>
          
          {[...Array(pagination.totalPages)].map((_, i) => {
            const page = i + 1;
            return (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 text-sm rounded ${
                  currentPage === page
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {page}
              </button>
            );
          })}
          
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === pagination.totalPages}
            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            다음
          </button>
        </div>
      )}

      <DisputeRequestModal
        isOpen={disputeModal.isOpen}
        onClose={() => setDisputeModal({ isOpen: false, purchaseId: '', productTitle: '' })}
        onSubmit={handleDisputeRequest}
        purchaseId={disputeModal.purchaseId}
        productTitle={disputeModal.productTitle}
        isLoading={disputeLoading}
      />

      {/* 리뷰 작성 모달 */}
      {reviewModal.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setReviewModal({ isOpen: false, productId: '', productTitle: '' })}></div>
            
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            
            <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  리뷰 작성 - {reviewModal.productTitle}
                </h3>
                <button
                  onClick={() => setReviewModal({ isOpen: false, productId: '', productTitle: '' })}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Close</span>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <ReviewForm
                productId={reviewModal.productId}
                onReviewSubmitted={handleReviewSubmitted}
                onCancel={() => setReviewModal({ isOpen: false, productId: '', productTitle: '' })}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}