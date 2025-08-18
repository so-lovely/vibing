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
      
      const result = await paymentService.initiateTossPayTest(
        `${product.title} - Vibing Marketplace`,
        totalAmount,
        customerEmail
      );

      if (!result.success) {
        setError(result.errorMessage || 'Payment failed');
        return result;
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