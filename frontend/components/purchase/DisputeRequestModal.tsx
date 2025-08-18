import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface DisputeRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
  purchaseId: string;
  productTitle: string;
  isLoading?: boolean;
}

export default function DisputeRequestModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  purchaseId, 
  productTitle,
  isLoading = false 
}: DisputeRequestModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (reason.trim().length < 10) {
      setError('이의제기 사유는 최소 10자 이상 입력해주세요.');
      return;
    }

    if (reason.trim().length > 500) {
      setError('이의제기 사유는 500자를 초과할 수 없습니다.');
      return;
    }

    try {
      setError('');
      await onSubmit(reason.trim());
      setReason('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '이의제기 요청 중 오류가 발생했습니다.');
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setReason('');
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-gray-900">이의제기 요청</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">구매 상품</p>
            <p className="font-medium text-gray-900">{productTitle}</p>
            <p className="text-xs text-gray-500 mt-1">주문번호: {purchaseId}</p>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">이의제기 안내</p>
                <ul className="text-xs space-y-1">
                  <li>• 구매 후 7일 이내에만 이의제기가 가능합니다</li>
                  <li>• 이의제기 접수 후 3일간 판매자와 협의 기간이 주어집니다</li>
                  <li>• 협의 실패 시 플랫폼이 개입하여 최종 결정합니다</li>
                  <li>• 허위 이의제기는 계정 제재 사유가 될 수 있습니다</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="dispute-reason" className="block text-sm font-medium text-gray-700 mb-2">
              이의제기 사유 <span className="text-red-500">*</span>
            </label>
            <textarea
              id="dispute-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="이의제기 사유를 상세히 작성해주세요. (최소 10자, 최대 500자)"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={5}
              disabled={isLoading}
              maxLength={500}
            />
            <div className="flex justify-between mt-1">
              <div className="text-xs text-gray-500">
                {reason.length < 10 && reason.length > 0 && (
                  <span className="text-red-500">최소 {10 - reason.length}자 더 입력해주세요</span>
                )}
              </div>
              <div className="text-xs text-gray-500">
                {reason.length}/500
              </div>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isLoading || reason.trim().length < 10}
              className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '처리중...' : '이의제기 요청'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}