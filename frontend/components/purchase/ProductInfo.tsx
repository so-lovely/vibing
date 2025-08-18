import { Badge } from '../ui/badge';
import { ImageWithFallback } from '../ui/image-with-fallback';
import type { Product } from '../../types/product';
import type { Product as PurchaseProduct } from '../../types/purchase';

interface ProductInfoProps {
  product: Product | PurchaseProduct;
  price?: number;
  showCategory?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ProductInfo({ 
  product, 
  price, 
  showCategory = true,
  size = 'md' 
}: ProductInfoProps) {
  // Handle both Product types - main Product has price, purchase Product doesn't
  const productPrice = price || ('price' in product ? product.price : 0);
  const imageSize = {
    sm: 'w-16 h-16',
    md: 'w-20 h-20',
    lg: 'w-24 h-24 lg:w-32 lg:h-32'
  }[size];

  const titleSize = {
    sm: 'text-sm font-medium',
    md: 'font-semibold',
    lg: 'text-xl font-semibold'
  }[size];

  return (
    <div className="flex space-x-4">
      <ImageWithFallback
        src={product.imageUrl || ''}
        alt={product.title}
        className={`${imageSize} rounded-lg object-cover flex-shrink-0`}
      />
      <div className="flex-1 min-w-0">
        <h3 className={`${titleSize} text-gray-900 truncate`}>
          {product.title}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          by {product.author}
        </p>
        {showCategory && 'category' in product && (
          <div className="flex items-center space-x-2 mt-2">
            <Badge variant={product.isPro ? "default" : "secondary"}>
              {product.isPro ? "PRO" : product.category}
            </Badge>
          </div>
        )}
        {productPrice > 0 && (
          <div className="text-lg font-bold text-gray-900 mt-2">
            ${productPrice.toFixed(2)}
          </div>
        )}
      </div>
    </div>
  );
}