import { useState, useCallback } from 'react';
import { paymentService, PaymentResult } from '../services/paymentService';
import { calculateTotal } from '../utils/purchaseUtils';
import type { Product } from '../types/product';

interface UsePaymentReturn {
  isProcessing: boolean;
  error: string | null;
  processPayment: (product: Product, customerEmail: string) => Promise<PaymentResult>;
  clearError: () => void;
}

export function usePayment(): UsePaymentReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processPayment = useCallback(async (product: Product, customerEmail: string): Promise<PaymentResult> => {
    setIsProcessing(true);
    setError(null);

    try {
      // Calculate total amount in KRW (USD product price -> KRW)
      const totalAmount = calculateTotal(product.price);
      const orderName = `${product.title} - ${product.id} - Vibing Marketplace`;
      
      console.log('Payment Info:', {
        productId: product.id,
        productTitle: product.title,
        orderName,
        totalAmount,
        customerEmail
      });
      
      const result = await paymentService.initiateTossPayTest(
        orderName,
        totalAmount,
        customerEmail
      );

      if (!result.success) {
        setError(result.errorMessage || 'Payment failed');
        return result;
      }

      console.log('Payment initiated successfully, now verifying...', result);

      // After successful payment, verify it with backend to create purchase record
      if (result.paymentId) {
        try {
          const verificationResult = await paymentService.verifyPayment(
            result.paymentId,
            orderName,
            totalAmount,
            customerEmail
          );
          
          console.log('Payment verification result:', verificationResult);
          
          if (verificationResult.success) {
            return {
              ...result,
              purchaseInfo: verificationResult.purchaseInfo
            };
          } else {
            console.error('Payment verification failed:', verificationResult.errorMessage);
            setError(verificationResult.errorMessage || 'Payment verification failed');
            return verificationResult;
          }
        } catch (verifyError) {
          console.error('Payment verification error:', verifyError);
          const errorMessage = verifyError instanceof Error ? verifyError.message : 'Payment verification failed';
          setError(errorMessage);
          return {
            success: false,
            errorMessage,
          };
        }
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment processing failed';
      setError(errorMessage);
      return {
        success: false,
        errorMessage,
      };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isProcessing,
    error,
    processPayment,
    clearError,
  };
}