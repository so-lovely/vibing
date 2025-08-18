import { Download, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import type { Product } from '../../types/product';

interface PurchaseSuccessProps {
  product: Product;
  onContinueShopping: () => void;
}

export function PurchaseSuccess({ product, onContinueShopping }: PurchaseSuccessProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <Card className="text-center">
        <CardHeader>
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Purchase Successful!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Thank you for purchasing <strong>{product.title}</strong>
          </p>
          <div className="flex flex-col space-y-2">
            <Button variant="outline" onClick={onContinueShopping}>
              Continue Shopping
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}