import { usePurchase } from '../../contexts/PurchaseContext';
import { purchaseStatuses, purchaseSortOptions } from '../../constants/purchase';
import { Card } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Filter, SortAsc } from 'lucide-react';

export function PurchaseFilters() {
  const { statusFilter, sortBy, setStatusFilter, setSortBy, filteredHistory, purchaseHistory } = usePurchase();

  return (
    <Card className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Filter className="w-5 h-5" />
          필터 및 정렬
        </h3>
        
        {/* Status Filter */}
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              구매 상태
            </label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="상태 선택" />
              </SelectTrigger>
              <SelectContent>
                {purchaseStatuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort Options */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block flex items-center gap-1">
              <SortAsc className="w-4 h-4" />
              정렬
            </label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="정렬 방식 선택" />
              </SelectTrigger>
              <SelectContent>
                {purchaseSortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="border-t pt-4">
        <div className="text-sm text-gray-600 space-y-2">
          <div className="flex justify-between">
            <span>전체 구매:</span>
            <span className="font-medium">{purchaseHistory.length}개</span>
          </div>
          <div className="flex justify-between">
            <span>필터 결과:</span>
            <span className="font-medium">{filteredHistory.length}개</span>
          </div>
          <div className="flex justify-between">
            <span>총 구매액:</span>
            <span className="font-medium">
              ${purchaseHistory.reduce((sum, purchase) => sum + purchase.price, 0).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">빠른 필터</h4>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
              statusFilter === 'completed'
                ? 'bg-green-100 text-green-800 border-green-200'
                : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
            }`}
          >
            완료된 구매
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
              statusFilter === 'pending'
                ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
            }`}
          >
            처리중
          </button>
          <button
            onClick={() => setSortBy('newest')}
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
              sortBy === 'newest'
                ? 'bg-blue-100 text-blue-800 border-blue-200'
                : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
            }`}
          >
            최신순
          </button>
        </div>
      </div>
    </Card>
  );
}