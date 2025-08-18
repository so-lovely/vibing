import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Check, X, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { paymentService } from '../services/paymentService';

export function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [paymentInfo, setPaymentInfo] = useState<{
    paymentId?: string;
    amount?: number;
    errorMessage?: string;
  }>({});

  useEffect(() => {
    const paymentId = searchParams.get('payment_id');
    const impUid = searchParams.get('imp_uid');
    const merchantUid = searchParams.get('merchant_uid');
    
    if (paymentId || impUid) {
      verifyPayment(paymentId || impUid || '');
    } else {
      setVerificationStatus('failed');
      setPaymentInfo({ errorMessage: 'Missing payment information' });
    }
  }, [searchParams]);

  const verifyPayment = async (paymentId: string) => {
    try {
      const result = await paymentService.verifyPayment(paymentId);
      
      if (result.success) {
        setVerificationStatus('success');
        setPaymentInfo({
          paymentId: result.paymentId,
          amount: result.amount,
        });
      } else {
        setVerificationStatus('failed');
        setPaymentInfo({
          errorMessage: result.errorMessage || 'Payment verification failed',
        });
      }
    } catch (error) {
      setVerificationStatus('failed');
      setPaymentInfo({
        errorMessage: error instanceof Error ? error.message : 'Verification error',
      });
    }
  };

  const handleContinue = () => {
    if (verificationStatus === 'success') {
      navigate('/purchase-history');
    } else {
      navigate('/products');
    }
  };

  return (
    <main className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {verificationStatus === 'loading' && (
              <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
            )}
            {verificationStatus === 'success' && (
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-green-600" />
              </div>
            )}
            {verificationStatus === 'failed' && (
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <X className="w-8 h-8 text-red-600" />
              </div>
            )}
          </div>
          
          <CardTitle className="text-2xl">
            {verificationStatus === 'loading' && 'Verifying Payment...'}
            {verificationStatus === 'success' && 'Payment Successful!'}
            {verificationStatus === 'failed' && 'Payment Failed'}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          {verificationStatus === 'loading' && (
            <p className="text-muted-foreground">
              Please wait while we verify your payment with Toss Pay...
            </p>
          )}
          
          {verificationStatus === 'success' && (
            <>
              <p className="text-green-600 font-medium">
                Your payment has been successfully processed!
              </p>
              {paymentInfo.paymentId && (
                <p className="text-sm text-muted-foreground">
                  Payment ID: {paymentInfo.paymentId}
                </p>
              )}
              {paymentInfo.amount && (
                <p className="text-sm text-muted-foreground">
                  Amount: ₩{paymentInfo.amount.toLocaleString()}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                You should receive a receipt via email shortly.
              </p>
              <Button onClick={handleContinue} className="mt-4">
                View Purchase History
              </Button>
            </>
          )}
          
          {verificationStatus === 'failed' && (
            <>
              <p className="text-red-600 font-medium">
                There was an issue with your payment.
              </p>
              {paymentInfo.errorMessage && (
                <p className="text-sm text-muted-foreground">
                  Error: {paymentInfo.errorMessage}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                Please try again or contact support if the issue persists.
              </p>
              <div className="flex gap-3 justify-center mt-4">
                <Button variant="outline" onClick={() => navigate(-1)}>
                  Try Again
                </Button>
                <Button onClick={handleContinue}>
                  Back to Products
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  );
}