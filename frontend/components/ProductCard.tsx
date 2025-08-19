import { Star, Download, Heart, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { ImageWithFallback } from "./ui/image-with-fallback";
import { convertUsdToKrw, formatPrice } from "../utils/purchaseUtils";

interface ProductCardProps {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  downloads: number;
  category: string;
  author: string;
  authorId?: string;
  imageUrl?: string;
  isPro?: boolean;
  isLiked?: boolean;
}

export function ProductCard({
  id,
  title,
  description,
  price,
  originalPrice,
  rating,
  reviewCount,
  downloads,
  category,
  author,
  imageUrl,
  isPro = false,
  isLiked = false
}: ProductCardProps) {
  const navigate = useNavigate();
  
  const handlePurchase = () => {
    navigate(`/purchase/${id}`);
  };

  const handleViewDetails = () => {
    navigate(`/product/${id}`);
  };
  return (
    <Card className="group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 bg-card border">
      <CardHeader className="p-0">
        <div className="relative overflow-hidden rounded-t-lg">
          <ImageWithFallback 
            src={imageUrl || ""}
            alt={title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
          />
          <div className="absolute top-3 left-3">
            <Badge variant={isPro ? "default" : "secondary"} className="text-xs">
              {isPro ? "PRO" : category}
            </Badge>
          </div>
          <button className="absolute top-3 right-3 p-2 rounded-full bg-background/80 backdrop-blur hover:bg-background transition-colors">
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
          </button>
          <div className="absolute bottom-3 right-3 flex items-center space-x-1 bg-background/90 backdrop-blur px-2 py-1 rounded-md text-xs">
            <Download className="w-3 h-3" />
            <span>{downloads.toLocaleString()}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold line-clamp-1 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <Button variant="ghost" size="icon" className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity">
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
        
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {description}
        </p>
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{rating}</span>
            <span className="text-xs text-muted-foreground">({reviewCount})</span>
          </div>
          <span className="text-xs text-muted-foreground">by {author}</span>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-2">
            {originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(convertUsdToKrw(originalPrice))}
              </span>
            )}
            <span className="text-lg font-bold">
              {price === 0 ? 'Free' : formatPrice(convertUsdToKrw(price))}
            </span>
          </div>
          <div className="flex space-x-2">
            <Button size="sm" variant="outline" onClick={handleViewDetails}>
              상품설명
            </Button>
            <Button size="sm" className="px-6" onClick={handlePurchase}>
              {price === 0 ? '다운로드' : '구매하기'}
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}