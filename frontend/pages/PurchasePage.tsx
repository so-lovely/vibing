import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { OrderSummary } from '../components/purchase/OrderSummary';
import { PaymentForm } from '../components/purchase/PaymentForm';
import { PurchaseSuccess } from '../components/purchase/PurchaseSuccess';
import { PurchaseProvider, usePurchase } from '../contexts/PurchaseContext';
import { useAuth } from '../contexts/AuthContext';
import { mockProducts, type Product } from '../data/products/mockData';

function PurchasePageContent() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formData, isProcessing, isPurchased, updateFormData, processPurchase, resetPurchase } = usePurchase();
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (id) {
      const foundProduct = mockProducts.find(p => p.id === id);
      setProduct(foundProduct || null);
    }
  }, [id]);

  useEffect(() => {
    if (user?.email && formData.email === '') {
      updateFormData('email', user.email);
    }
  }, [user, formData.email, updateFormData]);

  const handlePurchase = async () => {
    if (!product) return;
    await processPurchase(product);
  };

  const handleContinueShopping = () => {
    resetPurchase();
    navigate('/products');
  };

  if (!product) {
    return (
      <main className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product not found</h1>
          <Button onClick={() => navigate('/products')}>
            Return to Products
          </Button>
        </div>
      </main>
    );
  }

  if (isPurchased) {
    return (
      <main className="container mx-auto py-8">
        <PurchaseSuccess 
          product={product} 
          onContinueShopping={handleContinueShopping}
        />
      </main>
    );
  }

  return (
    <main className="container mx-auto py-8">
      <Button 
        variant="ghost" 
        onClick={() => navigate(-1)}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
        <OrderSummary product={product} />
        <PaymentForm 
          product={product}
          formData={formData}
          onInputChange={updateFormData}
          onPurchase={handlePurchase}
          isProcessing={isProcessing}
        />
      </div>
    </main>
  );
}

export function PurchasePage() {
  return (
    <PurchaseProvider>
      <PurchasePageContent />
    </PurchaseProvider>
  );
}