import { CreditCard, Shield, Zap, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { calculateTotal, formatPrice } from '../../utils/purchaseUtils';
import type { Product } from '../../types/product';

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
  error?: string | null;
}

export function PaymentForm({ 
  product, 
  formData, 
  onInputChange, 
  onPurchase, 
  isProcessing,
  error 
}: PaymentFormProps) {
  const total = calculateTotal(product.price);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5" />
            <span>Payment Information</span>
          </div>
          <Badge variant="secondary" className="flex items-center space-x-1">
            <Zap className="w-3 h-3" />
            <span>Toss Pay</span>
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900">Test Payment Mode</p>
              <p className="text-blue-700 mt-1">
                This is a test integration with Toss Pay via Iamport. No real charges will be made.
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => onInputChange('email', e.target.value)}
              placeholder="your@email.com"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Required for payment processing and receipt delivery
            </p>
          </div>

          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => onInputChange('name', e.target.value)}
              placeholder="Enter your full name"
            />
          </div>

          <div className="bg-gray-50 border rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-2">
              Payment will be processed through Toss Pay's secure gateway.
            </p>
            <p className="text-xs text-gray-500">
              Card details will be entered on Toss Pay's secure page after clicking "Complete Purchase".
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-red-900">Payment Error</p>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        <Button 
          className="w-full bg-blue-600 hover:bg-blue-700" 
          size="lg"
          onClick={onPurchase}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Processing Payment...</span>
            </div>
          ) : (
            `Pay with Toss Pay - ${formatPrice(total)}`
          )}
        </Button>

        <div className="text-xs text-center space-y-1">
          <p className="text-muted-foreground">
            By completing this purchase, you agree to our Terms of Service and Privacy Policy.
          </p>
          <p className="text-blue-600">
            ✓ Secure payment powered by Toss Pay & Iamport
          </p>
        </div>
      </CardContent>
    </Card>
  );
}