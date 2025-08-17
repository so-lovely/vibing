import { CheckCircle, Package, Eye } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface UploadSuccessProps {
  productTitle: string;
  onViewDashboard: () => void;
  onUploadAnother: () => void;
}

export function UploadSuccess({ 
  productTitle, 
  onViewDashboard, 
  onUploadAnother 
}: UploadSuccessProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <Card className="text-center">
        <CardHeader>
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Product Uploaded Successfully!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            <strong>{productTitle}</strong> has been uploaded and is now under review.
          </p>
          <p className="text-sm text-muted-foreground">
            Our team will review your product within 24-48 hours. You'll receive an email notification once it's approved and live on the marketplace.
          </p>
          
          <div className="flex flex-col space-y-2">
            <Button className="w-full" onClick={onViewDashboard}>
              <Package className="w-4 h-4 mr-2" />
              View Dashboard
            </Button>
            <Button variant="outline" onClick={onUploadAnother}>
              Upload Another Product
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}