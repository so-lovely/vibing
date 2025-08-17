import { usePurchase } from '../contexts/PurchaseContext';
import { PurchaseFilters } from '../components/purchase/PurchaseFilters';
import { PurchaseItem } from '../components/purchase/PurchaseItem';
import { Card } from '../components/ui/card';

export function PurchaseHistoryPage() {
  const { filteredHistory } = usePurchase();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">구매내역</h1>
        <p className="text-gray-600">구매하신 제품들을 확인하고 다운로드하세요.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <PurchaseFilters />
        </div>
        
        <div className="lg:col-span-3">
          {filteredHistory.length === 0 ? (
            <Card className="p-8 text-center">
              <div className="text-gray-500">
                <p className="text-lg font-medium mb-2">구매내역이 없습니다</p>
                <p>마켓플레이스에서 새로운 제품을 찾아보세요.</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredHistory.map((purchase) => (
                <PurchaseItem key={purchase.id} purchase={purchase} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}