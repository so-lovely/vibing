import { Badge } from '../components/ui/badge';

export const PROCESSING_FEE = 0.99;

export function calculateTotal(productPrice: number): number {
  return productPrice + PROCESSING_FEE;
}

export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

export function getStatusBadge(status: string) {
  switch (status) {
    case 'completed':
      return <Badge variant="default" className="bg-green-100 text-green-800">완료</Badge>;
    case 'pending':
      return <Badge variant="default" className="bg-yellow-100 text-yellow-800">대기중</Badge>;
    case 'failed':
      return <Badge variant="destructive">실패</Badge>;
    case 'refunded':
      return <Badge variant="outline" className="bg-gray-100 text-gray-800">환불</Badge>;
    case 'active':
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    case 'rejected':
      return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}