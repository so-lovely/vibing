import React from 'react';
import { Clock, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';

interface PurchaseStatusBadgeProps {
  status: string;
  displayStatus: string;
  daysUntilAutoConfirm?: number;
  canRequestDispute?: boolean;
  className?: string;
}

export default function PurchaseStatusBadge({ 
  status, 
  displayStatus, 
  daysUntilAutoConfirm,
  canRequestDispute,
  className = '' 
}: PurchaseStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'completed':
        return {
          icon: Clock,
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-200'
        };
      case 'confirmed':
        return {
          icon: CheckCircle,
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          borderColor: 'border-green-200'
        };
      case 'dispute_requested':
        return {
          icon: AlertTriangle,
          bgColor: 'bg-orange-100',
          textColor: 'text-orange-800',
          borderColor: 'border-orange-200'
        };
      case 'dispute_processing':
        return {
          icon: RefreshCw,
          bgColor: 'bg-purple-100',
          textColor: 'text-purple-800',
          borderColor: 'border-purple-200'
        };
      case 'refunded':
        return {
          icon: XCircle,
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          borderColor: 'border-red-200'
        };
      case 'failed':
        return {
          icon: XCircle,
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          borderColor: 'border-red-200'
        };
      case 'pending':
        return {
          icon: Clock,
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-200'
        };
      default:
        return {
          icon: Clock,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={`inline-flex flex-col ${className}`}>
      <div className={`inline-flex items-center px-2.5 py-1 rounded-full border ${config.bgColor} ${config.textColor} ${config.borderColor}`}>
        <Icon className="h-3.5 w-3.5 mr-1.5" />
        <span className="text-xs font-medium">{displayStatus}</span>
      </div>
      
      {status === 'completed' && daysUntilAutoConfirm !== undefined && daysUntilAutoConfirm > 0 && (
        <div className="mt-1 text-xs text-gray-500 text-center">
          {daysUntilAutoConfirm}일 후 자동확정
        </div>
      )}
      
      {status === 'dispute_requested' && (
        <div className="mt-1 text-xs text-orange-600 text-center">
          판매자 응답 대기중
        </div>
      )}
      
      {status === 'dispute_processing' && (
        <div className="mt-1 text-xs text-purple-600 text-center">
          플랫폼 검토중
        </div>
      )}
    </div>
  );
}