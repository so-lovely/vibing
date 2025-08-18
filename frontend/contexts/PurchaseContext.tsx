import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { purchaseApi } from '../services/purchaseApi';
import { usePayment } from '../hooks/usePayment';
import type { PurchaseHistoryItem, Product } from '../types/purchase';

interface PurchaseFormData {
  email: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  name: string;
  country: string;
}

interface PurchaseContextType {
  formData: PurchaseFormData;
  isProcessing: boolean;
  isPurchased: boolean;
  purchaseHistory: PurchaseHistoryItem[];
  filteredHistory: PurchaseHistoryItem[];
  statusFilter: string;
  sortBy: string;
  loading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  } | null;
  updateFormData: (field: string, value: string) => void;
  processPurchase: (product: Product) => Promise<void>;
  resetPurchase: () => void;
  setStatusFilter: (status: string) => void;
  setSortBy: (sort: string) => void;
  downloadProduct: (purchaseId: string) => Promise<void>;
  loadPurchaseHistory: (page?: number) => Promise<void>;
  generateLicense: (purchaseId: string) => Promise<void>;
}

const PurchaseContext = createContext<PurchaseContextType | undefined>(undefined);

export function PurchaseProvider({ children }: { children: ReactNode }) {
  const { 
    isProcessing: paymentProcessing, 
    error: paymentError, 
    processPayment, 
    clearError: clearPaymentError 
  } = usePayment();
  
  const [formData, setFormData] = useState<PurchaseFormData>({
    email: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    name: '',
    country: 'US'
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPurchased, setIsPurchased] = useState(false);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistoryItem[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  } | null>(null);

  // Load purchase history from API
  const loadPurchaseHistory = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const response = await purchaseApi.getPurchaseHistory(page, 10);
      setPurchaseHistory(response.purchases || []);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load purchase history');
      // Don't set purchaseHistory to null on error, keep existing data
    } finally {
      setLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    const token = localStorage.getItem('auth-token');
    if (token) {
      loadPurchaseHistory();
    }
  }, []);

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const processPurchase = async (product: Product) => {
    if (!formData.email) {
      setError('Email is required for payment');
      return;
    }

    setIsProcessing(true);
    clearPaymentError();
    
    try {
      // Process payment with Toss Pay via Iamport
      const result = await processPayment(product, formData.email);
      
      if (result.success) {
        console.log('Payment completed:', result);
        setIsPurchased(true);
        // Reload purchase history after successful purchase
        await loadPurchaseHistory();
      } else {
        setError(result.errorMessage || 'Payment failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetPurchase = () => {
    setIsPurchased(false);
    setIsProcessing(false);
    setError(null);
    clearPaymentError();
    setFormData({
      email: '',
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      name: '',
      country: 'US'
    });
  };

  const downloadProduct = async (purchaseId: string) => {
    try {
      const response = await purchaseApi.getDownloadUrl(purchaseId);
      window.open(response.downloadUrl, '_blank');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get download URL');
    }
  };

  const generateLicense = async (purchaseId: string) => {
    try {
      const response = await purchaseApi.generateLicense(purchaseId);
      // Update the purchase in history with new license key
      setPurchaseHistory(prev => 
        prev.map(purchase => 
          purchase.id === purchaseId 
            ? { ...purchase, licenseKey: response.licenseKey }
            : purchase
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate license');
    }
  };

  // Filter and sort purchase history
  const filteredHistory = (purchaseHistory || [])
    .filter(purchase => {
      if (statusFilter === 'all') return true;
      return purchase.status === statusFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime();
        case 'oldest':
          return new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime();
        case 'price-high':
          return b.price - a.price;
        case 'price-low':
          return a.price - b.price;
        case 'product-name':
          return a.product.title.localeCompare(b.product.title);
        default:
          return 0;
      }
    });


  return (
    <PurchaseContext.Provider value={{
      formData,
      isProcessing: isProcessing || paymentProcessing,
      isPurchased,
      purchaseHistory,
      filteredHistory,
      statusFilter,
      sortBy,
      loading,
      error: error || paymentError,
      pagination,
      updateFormData,
      processPurchase,
      resetPurchase,
      setStatusFilter,
      setSortBy,
      downloadProduct,
      loadPurchaseHistory,
      generateLicense
    }}>
      {children}
    </PurchaseContext.Provider>
  );
}

export function usePurchase() {
  const context = useContext(PurchaseContext);
  if (context === undefined) {
    throw new Error('usePurchase must be used within a PurchaseProvider');
  }
  return context;
}