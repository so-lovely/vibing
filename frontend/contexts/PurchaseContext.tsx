import { createContext, useContext, useState, ReactNode } from 'react';
import { Product } from '../data/products/mockData';
import { PurchaseHistoryItem, mockPurchases } from '../data/purchases/mockData';

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
  updateFormData: (field: string, value: string) => void;
  processPurchase: (product: Product) => Promise<void>;
  resetPurchase: () => void;
  setStatusFilter: (status: string) => void;
  setSortBy: (sort: string) => void;
  downloadProduct: (purchaseId: string) => void;
}

const PurchaseContext = createContext<PurchaseContextType | undefined>(undefined);

export function PurchaseProvider({ children }: { children: ReactNode }) {
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
  const [purchaseHistory] = useState<PurchaseHistoryItem[]>(mockPurchases);
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const processPurchase = async (product: Product) => {
    setIsProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In a real app, we would add the product to purchase history
    console.log('Processing purchase for:', product.title);
    
    setIsProcessing(false);
    setIsPurchased(true);
  };

  const resetPurchase = () => {
    setIsPurchased(false);
    setIsProcessing(false);
    setFormData({
      email: '',
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      name: '',
      country: 'US'
    });
  };

  // Filter and sort purchase history
  const filteredHistory = purchaseHistory
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

  const downloadProduct = (purchaseId: string) => {
    const purchase = purchaseHistory.find(p => p.id === purchaseId);
    if (purchase?.downloadUrl) {
      // In a real app, this would handle the download
      window.open(purchase.downloadUrl, '_blank');
    }
  };

  return (
    <PurchaseContext.Provider value={{
      formData,
      isProcessing,
      isPurchased,
      purchaseHistory,
      filteredHistory,
      statusFilter,
      sortBy,
      updateFormData,
      processPurchase,
      resetPurchase,
      setStatusFilter,
      setSortBy,
      downloadProduct
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