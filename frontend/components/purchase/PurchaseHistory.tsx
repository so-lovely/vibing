import React, { useState, useEffect } from 'react';
import { Download, FileText, AlertTriangle, Clock, Eye } from 'lucide-react';
import PurchaseStatusBadge from './PurchaseStatusBadge';
import DisputeRequestModal from './DisputeRequestModal';
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
    imageUrl: string;
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

      const response = await fetch(`/api/purchase/history?page=${currentPage}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch purchase history');
      }

      const data = await response.json();
      setPurchases(data.purchases || []);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching purchase history:', error);
    } finally {
      setLoading(false);
    }
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
                      src={purchase.product.imageUrl}
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
    </div>
  );
}