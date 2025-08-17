import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Download, Heart, User, Calendar } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { Separator } from '../ui/separator';
import { ImageWithFallback } from '../ui/image-with-fallback';
import { ContactSellerButton } from '../ContactSellerButton';
import type { Product } from '../../types/product';

interface ProductImageCardProps {
  product: Product;
}

export function ProductImageCard({ product }: ProductImageCardProps) {
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(product.isLiked || false);

  const handlePurchase = () => {
    navigate(`/purchase/${product.id}`);
  };

  const toggleLike = () => {
    setIsLiked(!isLiked);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="relative">
          <ImageWithFallback 
            src={product.imageUrl}
            alt={product.title}
            className="w-full h-64 object-cover rounded-lg"
          />
          <div className="absolute top-3 left-3">
            <Badge variant={product.isPro ? "default" : "secondary"}>
              {product.isPro ? "PRO" : product.category}
            </Badge>
          </div>
          <button 
            onClick={toggleLike}
            className="absolute top-3 right-3 p-2 rounded-full bg-background/80 backdrop-blur hover:bg-background transition-colors"
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
          </button>
        </div>
        
        <div className="mt-6 space-y-4">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              {product.originalPrice && (
                <span className="text-lg text-muted-foreground line-through">
                  ${product.originalPrice}
                </span>
              )}
              <span className="text-3xl font-bold">
                {product.price === 0 ? 'Free' : `$${product.price}`}
              </span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-center space-x-2">
                <Button size="lg" className="flex-1" onClick={handlePurchase}>
                  {product.price === 0 ? '다운로드' : '구매하기'}
                </Button>
                <Button size="lg" variant="outline">
                  상품설명
                </Button>
              </div>
              
              <ContactSellerButton
                sellerId={product.authorId}
                sellerName={product.author}
                productId={product.id}
                productName={product.title}
                variant="outline"
                size="lg"
                className="w-full"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{product.rating}</span>
                <span className="text-sm text-muted-foreground">({product.reviewCount} 리뷰)</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Download className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{product.downloads.toLocaleString()} 다운로드</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">by {product.author}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">업데이트: {formatDate(product.updatedAt)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}