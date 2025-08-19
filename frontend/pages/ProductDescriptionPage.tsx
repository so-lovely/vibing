import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { ProductImageCard } from '../components/product/ProductImageCard';
import { ProductDetailsCard } from '../components/product/ProductDetailsCard';
import { ReviewSection } from '../components/review/ReviewSection';
import { SellerCard } from '../components/product/SellerCard';
import type { Product } from '../types/product';
import { productApi } from '../services/productApi';

export function ProductDescriptionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (id) {
      productApi.getProduct(id)
        .then(setProduct)
        .catch((error) => {
          console.error('Failed to fetch product:', error);
          setProduct(null);
        });
    }
  }, [id]);

  if (!product) {
    return (
      <main className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">상품을 찾을 수 없습니다</h1>
          <Button onClick={() => navigate('/products')}>
            상품 목록으로 돌아가기
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto py-8 max-w-6xl">
      <Button 
        variant="ghost" 
        onClick={() => navigate(-1)}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        뒤로 가기
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Product Image and Purchase Info */}
        <div className="lg:col-span-1 space-y-6">
          <ProductImageCard product={product} />
          <SellerCard product={product} />
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Header */}
          <div>
            <h1 className="text-3xl font-bold mb-3">{product.title}</h1>
            <p className="text-lg text-muted-foreground">{product.description}</p>
          </div>

          {/* Product Details */}
          <ProductDetailsCard product={product} />

          {/* Reviews Section */}
          <ReviewSection 
            productId={product.id}
            sellerName={product.author}
            averageRating={product.rating || 0}
            totalReviews={product.reviewCount || 0}
          />
        </div>
      </div>
    </main>
  );
}