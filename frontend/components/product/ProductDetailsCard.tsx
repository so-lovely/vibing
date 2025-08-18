import { Tag, Shield, Clock, ExternalLink } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import type { Product } from '../../types/product';

interface ProductDetailsCardProps {
  product: Product;
}

export function ProductDetailsCard({ product }: ProductDetailsCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="w-5 h-5" />
          상품 상세 정보
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tags */}
        <div>
          <h4 className="font-medium mb-2">태그</h4>
          <div className="flex flex-wrap gap-2">
            {(product.tags || []).map((tag, index) => (
              <Badge key={index} variant="outline" className="flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        {/* Product Meta */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Shield className="w-4 h-4" />
              카테고리
            </h4>
            <p className="text-muted-foreground capitalize">{product.category}</p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              생성일
            </h4>
            <p className="text-muted-foreground">{product.createdAt ? formatDate(product.createdAt) : 'N/A'}</p>
          </div>
        </div>
        
        <Separator />
        
        {/* Product Description */}
        <div className="space-y-3">
          <h4 className="font-medium">상품 설명</h4>
          <div className="text-sm text-muted-foreground whitespace-pre-wrap">
            {product.description || '상품 설명이 없습니다.'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}