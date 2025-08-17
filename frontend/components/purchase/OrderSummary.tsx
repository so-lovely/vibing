import { Shield, Download } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { ImageWithFallback } from '../ui/image-with-fallback';
import type { Product } from '../../types/product';

interface OrderSummaryProps {
  product: Product;
}

export function OrderSummary({ product }: OrderSummaryProps) {
  const processingFee = 0.99;
  const total = product.price + processingFee;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-4">
          <ImageWithFallback
            src={product.imageUrl}
            alt={product.title}
            className="w-20 h-20 rounded-lg object-cover"
          />
          <div className="flex-1">
            <h3 className="font-semibold">{product.title}</h3>
            <p className="text-sm text-muted-foreground">by {product.author}</p>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant={product.isPro ? "default" : "secondary"}>
                {product.isPro ? "PRO" : product.category}
              </Badge>
            </div>
          </div>
        </div>
        
        <Separator />
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Price</span>
            <span>${product.price}</span>
          </div>
          <div className="flex justify-between">
            <span>Processing Fee</span>
            <span>${processingFee}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
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