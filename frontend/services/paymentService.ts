import * as PortOne from '@portone/browser-sdk/v2';

export interface PaymentConfig {
  storeId: string;
  paymentId: string;
  orderName: string;
  totalAmount: number;
  currency: string;
  channelKey: string;
  payMethod: PortOne.PaymentPayMethod;
  customer: {
    customerId: string;
    fullName: string;
    phoneNumber?: string;
    email: string;
  };
  redirectUrl: string;
  noticeUrls?: string[];
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  transactionId?: string;
  amount?: number;
  status?: string;
  errorCode?: string;
  errorMessage?: string;
}

class PaymentService {
  // Toss Pay test channel key (replace with your actual test key)
  private readonly testChannelKey = 'channel-key-0d521b1a-98cf-4d41-b678-2bc2781a2b70';
  private readonly testStoreId = 'store-e4dbd984-dcc9-4f49-8911-58725611a1a5';

  async initiatePayment(config: Omit<PaymentConfig, 'storeId' | 'channelKey'>): Promise<PaymentResult> {
    try {
      const paymentConfig: PaymentConfig = {
        ...config,
        storeId: this.testStoreId,
        channelKey: this.testChannelKey,
      };

      const response = await PortOne.requestPayment({
        storeId: paymentConfig.storeId,
        paymentId: paymentConfig.paymentId,
        orderName: paymentConfig.orderName,
        totalAmount: paymentConfig.totalAmount,
        currency: paymentConfig.currency as any,
        channelKey: paymentConfig.channelKey,
        payMethod: paymentConfig.payMethod,
        customer: paymentConfig.customer,
        redirectUrl: paymentConfig.redirectUrl,
        noticeUrls: paymentConfig.noticeUrls,
        // Toss Pay v2 specific configuration
        bypass: {
          tosspay_v2: {
            expiredTime: new Date(Date.now() + 15 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' '),
            cashReceiptTradeOption: 'GENERAL',
          },
        },
      });

      if (response && response.code != null) {
        // Payment failed
        return {
          success: false,
          errorCode: response.code,
          errorMessage: response.message,
        };
      }

      if (!response) {
        return {
          success: false,
          errorMessage: 'No response from payment service',
        };
      }

      // Payment succeeded
      return {
        success: true,
        paymentId: response.paymentId,
        transactionId: response.txId,
        amount: paymentConfig.totalAmount, // Use the original amount from config
        status: 'completed',
      };
    } catch (error) {
      console.error('Payment initiation failed:', error);
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown payment error',
      };
    }
  }

  async verifyPayment(paymentId: string): Promise<PaymentResult> {
    try {
      // In a real implementation, this would call your backend to verify the payment
      // For now, we'll simulate a successful verification
      const response = await fetch(`/api/payments/verify/${paymentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Payment verification failed');
      }

      const result = await response.json();
      return {
        success: result.verified,
        paymentId: result.paymentId,
        amount: result.amount,
        status: result.status,
      };
    } catch (error) {
      console.error('Payment verification failed:', error);
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Verification failed',
      };
    }
  }

  generatePaymentId(): string {
    return `payment-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  // Test payment methods for different scenarios
  async initiateTossPayTest(orderName: string, amountKrw: number, customerEmail: string): Promise<PaymentResult> {
    const paymentId = this.generatePaymentId();
    
    return this.initiatePayment({
      paymentId,
      orderName,
      totalAmount: amountKrw, // Already in KRW
      currency: "CURRENCY_KRW",
      payMethod: PortOne.PaymentPayMethod.EASY_PAY,
      customer: {
        customerId: customerEmail,
        fullName: 'Test User',
        email: customerEmail,
      },
      redirectUrl: `${window.location.origin}/purchase/success?payment_id=${paymentId}`,
      noticeUrls: [`${window.location.origin}/api/payments/webhook`],
    });
  }
}

export const paymentService = new PaymentService();
export default paymentService;