import { User, Star, Package, MessageCircle, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { ContactSellerButton } from '../ContactSellerButton';
import type { Product } from '../../types/product';

interface SellerCardProps {
  product: Product;
}

export function SellerCard({ product }: SellerCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Mock seller stats - in a real app, these would come from the seller's profile
  const sellerStats = {
    totalProducts: 12,
    averageRating: 4.7,
    memberSince: '2023-06-15',
    totalSales: 2847
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          판매자 정보
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Seller Name and Badge */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg">{product.author}</h3>
            <Badge variant="outline" className="mt-1">
              Verified Seller
            </Badge>
          </div>
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
            <User className="w-6 h-6 text-primary-foreground" />
          </div>
        </div>

        {/* Seller Stats */}
        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Package className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold">{sellerStats.totalProducts}</span>
            </div>
            <p className="text-xs text-muted-foreground">상품</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span className="font-semibold">{sellerStats.averageRating}</span>
            </div>
            <p className="text-xs text-muted-foreground">평점</p>
          </div>
        </div>

        {/* Member Since */}
        <div className="flex items-center gap-2 py-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            가입일: {formatDate(sellerStats.memberSince)}
          </span>
        </div>

        {/* Contact Seller Button */}
        <ContactSellerButton
          sellerId={product.authorId}
          sellerName={product.author}
          productId={product.id}
          productName={product.title}
          variant="default"
          size="default"
          className="w-full"
        >
          판매자에게 문의하기
        </ContactSellerButton>

        {/* Additional Info */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          응답 시간: 평균 2-4시간 이내
        </div>
      </CardContent>
    </Card>
  );
}