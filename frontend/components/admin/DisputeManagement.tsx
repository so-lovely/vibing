import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, CheckCircle, XCircle, Eye, MessageSquare } from 'lucide-react';
import { formatPrice, convertUsdToKrw } from '../../utils/purchaseUtils';

interface DisputedPurchase {
  id: string;
  orderId: string;
  price: number;
  status: string;
  displayStatus: string;
  disputeReason: string;
  disputeRequestedAt: string;
  shouldPlatformIntervene: boolean;
  platformInterventionAt?: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
  product: {
    id: string;
    title: string;
    author: string;
  };
}

interface DisputeResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  dispute: DisputedPurchase | null;
  onResolve: (resolution: string, refund: boolean) => Promise<void>;
  isLoading: boolean;
}

function DisputeResolutionModal({ isOpen, onClose, dispute, onResolve, isLoading }: DisputeResolutionModalProps) {
  const [resolution, setResolution] = useState('');
  const [refund, setRefund] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (resolution.trim().length < 10) {
      setError('처리 결과는 최소 10자 이상 입력해주세요.');
      return;
    }

    try {
      setError('');
      await onResolve(resolution.trim(), refund);
      setResolution('');
      setRefund(false);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '처리 중 오류가 발생했습니다.');
    }
  };

  if (!isOpen || !dispute) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">이의제기 처리</h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Dispute Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">이의제기 정보</h3>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">주문번호:</span> {dispute.orderId}</div>
              <div><span className="font-medium">상품:</span> {dispute.product.title}</div>
              <div><span className="font-medium">판매자:</span> {dispute.product.author}</div>
              <div><span className="font-medium">구매자:</span> {dispute.user.name} ({dispute.user.email})</div>
              <div><span className="font-medium">구매금액:</span> {formatPrice(convertUsdToKrw(dispute.price))}</div>
              <div><span className="font-medium">접수일:</span> {new Date(dispute.disputeRequestedAt).toLocaleString('ko-KR')}</div>
            </div>
          </div>

          {/* Dispute Reason */}
          <div>
            <h3 className="font-medium text-gray-900 mb-2">이의제기 사유</h3>
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-gray-700">{dispute.disputeReason}</p>
            </div>
          </div>

          {/* Resolution Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="resolution" className="block text-sm font-medium text-gray-700 mb-2">
                처리 결과 <span className="text-red-500">*</span>
              </label>
              <textarea
                id="resolution"
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="이의제기에 대한 처리 결과를 상세히 작성해주세요."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={4}
                disabled={isLoading}
                maxLength={1000}
              />
              <div className="text-xs text-gray-500 mt-1">{resolution.length}/1000</div>
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="refund"
                checked={refund}
                onChange={(e) => setRefund(e.target.checked)}
                disabled={isLoading}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="refund" className="text-sm font-medium text-gray-700">
                환불 처리
              </label>
            </div>

            {refund && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  환불 처리를 선택하면 구매자에게 {formatPrice(convertUsdToKrw(dispute.price))}가 환불됩니다.
                </p>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isLoading || resolution.trim().length < 10}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '처리중...' : '이의제기 처리 완료'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function DisputeManagement() {
  const [disputes, setDisputes] = useState<DisputedPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolutionModal, setResolutionModal] = useState<{
    isOpen: boolean;
    dispute: DisputedPurchase | null;
  }>({
    isOpen: false,
    dispute: null
  });
  const [resolutionLoading, setResolutionLoading] = useState(false);

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth-token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/admin/disputes', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch disputes');
      }

      const data = await response.json();
      setDisputes(data.disputes || []);
    } catch (error) {
      console.error('Error fetching disputes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessDispute = async (disputeId: string) => {
    try {
      const token = localStorage.getItem('auth-token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/admin/disputes/${disputeId}/process`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to process dispute');
      }

      await fetchDisputes();
    } catch (error) {
      console.error('Error processing dispute:', error);
      alert('이의제기 처리 중 오류가 발생했습니다.');
    }
  };

  const handleResolveDispute = async (resolution: string, refund: boolean) => {
    if (!resolutionModal.dispute) return;

    try {
      setResolutionLoading(true);
      const token = localStorage.getItem('auth-token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/admin/disputes/${resolutionModal.dispute.id}/resolve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resolution, refund }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to resolve dispute');
      }

      await fetchDisputes();
    } catch (error) {
      throw error;
    } finally {
      setResolutionLoading(false);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'dispute_requested':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'dispute_processing':
        return <Clock className="h-5 w-5 text-purple-500" />;
      default:
        return <MessageSquare className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">이의제기 관리</h2>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">이의제기 관리</h2>
        <div className="text-sm text-gray-600">
          총 {disputes.length}건의 이의제기
        </div>
      </div>

      {disputes.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">처리할 이의제기가 없습니다</h3>
          <p className="text-gray-600">모든 이의제기가 처리되었습니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map((dispute) => (
            <div key={dispute.id} className="bg-white rounded-lg shadow-sm border">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-3">
                    {getStatusIcon(dispute.status)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {dispute.product.title}
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          dispute.status === 'dispute_requested' 
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {dispute.displayStatus}
                        </span>
                        {dispute.shouldPlatformIntervene && (
                          <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                            긴급
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>주문번호: {dispute.orderId}</div>
                        <div>구매자: {dispute.user.name} ({dispute.user.email})</div>
                        <div>접수일: {formatDate(dispute.disputeRequestedAt)}</div>
                        <div>금액: {formatPrice(convertUsdToKrw(dispute.price))}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-1">이의제기 사유</p>
                  <p className="text-sm text-gray-600">{dispute.disputeReason}</p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-gray-500">
                    {dispute.shouldPlatformIntervene && (
                      <span className="text-red-600 font-medium">
                        플랫폼 개입 필요
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {dispute.status === 'dispute_requested' && (
                      <button
                        onClick={() => handleProcessDispute(dispute.id)}
                        className="inline-flex items-center px-3 py-1.5 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                      >
                        <Clock className="h-4 w-4 mr-1.5" />
                        처리 시작
                      </button>
                    )}
                    
                    <button
                      onClick={() => setResolutionModal({ isOpen: true, dispute })}
                      className="inline-flex items-center px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <CheckCircle className="h-4 w-4 mr-1.5" />
                      처리 완료
                    </button>
                    
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

      <DisputeResolutionModal
        isOpen={resolutionModal.isOpen}
        onClose={() => setResolutionModal({ isOpen: false, dispute: null })}
        dispute={resolutionModal.dispute}
        onResolve={handleResolveDispute}
        isLoading={resolutionLoading}
      />
    </div>
  );
}