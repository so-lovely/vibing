import type { PurchaseHistoryItem } from '../../types/purchase';
import { usePurchase } from '../../contexts/PurchaseContext';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ProductInfo } from './ProductInfo';
import { getStatusBadgeProps } from '../../utils/purchaseUtils';
import { Download, Calendar, CreditCard, ExternalLink } from 'lucide-react';

interface PurchaseItemProps {
  purchase: PurchaseHistoryItem;
}

export function PurchaseItem({ purchase }: PurchaseItemProps) {
  const { downloadProduct } = usePurchase();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Product Details */}
        <div className="flex-grow space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1">
              <ProductInfo 
                product={purchase.product} 
                price={purchase.price}
                showCategory={false}
                size="lg"
              />
            </div>
            
            <div className="flex flex-col items-start lg:items-end gap-2">
              {(() => {
                const badgeProps = getStatusBadgeProps(purchase.status);
                return (
                  <Badge variant={badgeProps.variant} className={badgeProps.className}>
                    {badgeProps.text}
                  </Badge>
                );
              })()}
            </div>
          </div>

          {/* Purchase Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>구매일: {formatDate(purchase.purchaseDate)}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              <span>{purchase.paymentMethod}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                주문번호: {purchase.orderId}
              </span>
            </div>
          </div>



          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            {purchase.status === 'completed' && purchase.downloadUrl && (
              <Button 
                onClick={() => downloadProduct(purchase.id)}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                다운로드
              </Button>
            )}
            
            <Button 
              variant="outline" 
              onClick={() => window.open(`/products/${purchase.product.id}`, '_blank')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              제품 페이지
            </Button>

            {purchase.status === 'failed' && (
              <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                다시 시도
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}