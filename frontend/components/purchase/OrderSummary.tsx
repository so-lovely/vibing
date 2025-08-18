import { Shield, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { ProductInfo } from './ProductInfo';
import { PROCESSING_FEE, calculateTotal, formatPrice } from '../../utils/purchaseUtils';
import type { Product } from '../../types/product';

interface OrderSummaryProps {
  product: Product;
}

export function OrderSummary({ product }: OrderSummaryProps) {
  const total = calculateTotal(product.price);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ProductInfo product={product} showCategory={true} size="md" />
        
        <Separator />
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Price</span>
            <span>{formatPrice(product.price)}</span>
          </div>
          <div className="flex justify-between">
            <span>Processing Fee</span>
            <span>{formatPrice(PROCESSING_FEE)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-green-600" />
            <span className="text-sm">Secure 256-bit SSL encryption</span>
          </div>
          <div className="flex items-center space-x-2">
            <Download className="w-4 h-4 text-blue-600" />
            <span className="text-sm">Instant download after purchase</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}