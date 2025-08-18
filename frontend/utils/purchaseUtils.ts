export const PROCESSING_FEE = 1290; // KRW 처리 수수료
export const USD_TO_KRW_RATE = 1300; // USD to KRW conversion rate

export function convertUsdToKrw(usdPrice: number): number {
  return Math.round(usdPrice * USD_TO_KRW_RATE);
}

export function calculateTotal(productPriceUsd: number): number {
  const krwPrice = convertUsdToKrw(productPriceUsd);
  return krwPrice + PROCESSING_FEE;
}

export function formatPrice(priceKrw: number): string {
  return `₩${priceKrw.toLocaleString('ko-KR')}`;
}

export function getStatusBadgeProps(status: string) {
  switch (status) {
    case 'completed':
      return { variant: 'default' as const, className: 'bg-blue-100 text-blue-800', text: '구매완료' };
    case 'confirmed':
      return { variant: 'default' as const, className: 'bg-green-100 text-green-800', text: '구매확정' };
    case 'dispute_requested':
      return { variant: 'default' as const, className: 'bg-orange-100 text-orange-800', text: '이의제기중' };
    case 'dispute_processing':
      return { variant: 'default' as const, className: 'bg-purple-100 text-purple-800', text: '플랫폼 검토중' };
    case 'dispute_resolved':
      return { variant: 'default' as const, className: 'bg-gray-100 text-gray-800', text: '이의제기 완료' };
    case 'pending':
      return { variant: 'default' as const, className: 'bg-yellow-100 text-yellow-800', text: '결제대기' };
    case 'failed':
      return { variant: 'destructive' as const, className: '', text: '결제실패' };
    case 'refunded':
      return { variant: 'outline' as const, className: 'bg-red-100 text-red-800', text: '환불완료' };
    case 'cancelled':
      return { variant: 'outline' as const, className: 'bg-gray-100 text-gray-800', text: '취소됨' };
    case 'active':
      return { variant: 'default' as const, className: 'bg-green-100 text-green-800', text: 'Active' };
    case 'rejected':
      return { variant: 'default' as const, className: 'bg-red-100 text-red-800', text: 'Rejected' };
    default:
      return { variant: 'outline' as const, className: '', text: status };
  }
}