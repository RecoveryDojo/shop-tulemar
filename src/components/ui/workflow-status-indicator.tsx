import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, AlertTriangle, Truck, Package } from 'lucide-react';

interface WorkflowStatusIndicatorProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

export function WorkflowStatusIndicator({ status, size = 'md' }: WorkflowStatusIndicatorProps) {
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'placed':
        return {
          icon: Clock,
          label: 'Order Placed',
          variant: 'secondary' as const,
          color: 'text-blue-600'
        };
      case 'claimed':
        return {
          icon: CheckCircle2,
          label: 'Assigned to Shopper',
          variant: 'default' as const,
          color: 'text-purple-600'
        };
      case 'shopping':
        return {
          icon: Package,
          label: 'Shopping in Progress',
          variant: 'default' as const,
          color: 'text-orange-600'
        };
      case 'ready':
        return {
          icon: Package,
          label: 'Ready for Delivery',
          variant: 'default' as const,
          color: 'text-green-600'
        };
      case 'delivered':
        return {
          icon: Truck,
          label: 'Delivered',
          variant: 'default' as const,
          color: 'text-emerald-600'
        };
      case 'closed':
        return {
          icon: CheckCircle2,
          label: 'Completed',
          variant: 'default' as const,
          color: 'text-gray-600'
        };
      case 'canceled':
        return {
          icon: AlertTriangle,
          label: 'Canceled',
          variant: 'destructive' as const,
          color: 'text-red-600'
        };
      default:
        return {
          icon: AlertTriangle,
          label: status,
          variant: 'outline' as const,
          color: 'text-gray-600'
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;
  
  const iconSize = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';

  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <Icon className={`${iconSize} ${config.color}`} />
      {config.label}
    </Badge>
  );
}