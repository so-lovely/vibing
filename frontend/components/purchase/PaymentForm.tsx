import { CreditCard } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Product } from '../../data/products/mockData';

interface PaymentFormProps {
  product: Product;
  formData: {
    email: string;
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    name: string;
    country: string;
  };
  onInputChange: (field: string, value: string) => void;
  onPurchase: () => void;
  isProcessing: boolean;
}

export function PaymentForm({ 
  product, 
  formData, 
  onInputChange, 
  onPurchase, 
  isProcessing 
}: PaymentFormProps) {
  const total = (product.price + 0.99).toFixed(2);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CreditCard className="w-5 h-5" />
          <span>Payment Information</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => onInputChange('email', e.target.value)}
              placeholder="your@email.com"
            />
          </div>

          <div>
            <Label htmlFor="name">Cardholder Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => onInputChange('name', e.target.value)}
              placeholder="John Doe"
            />
          </div>

          <div>
            <Label htmlFor="cardNumber">Card Number</Label>
            <Input
              id="cardNumber"
              value={formData.cardNumber}
              onChange={(e) => onInputChange('cardNumber', e.target.value)}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                value={formData.expiryDate}
                onChange={(e) => onInputChange('expiryDate', e.target.value)}
                placeholder="MM/YY"
                maxLength={5}
              />
            </div>
            <div>
              <Label htmlFor="cvv">CVV</Label>
              <Input
                id="cvv"
                value={formData.cvv}
                onChange={(e) => onInputChange('cvv', e.target.value)}
                placeholder="123"
                maxLength={4}
              />
            </div>
          </div>
        </div>

        <Button 
          className="w-full" 
          size="lg"
          onClick={onPurchase}
          disabled={isProcessing}
        >
          {isProcessing ? 'Processing...' : `Complete Purchase - $${total}`}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          By completing this purchase, you agree to our Terms of Service and Privacy Policy.
          This is a secure SSL encrypted payment.
        </p>
      </CardContent>
    </Card>
  );
}