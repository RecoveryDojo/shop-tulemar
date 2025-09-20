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
      case 'pending':
        return {
          icon: Clock,
          label: 'Pending',
          variant: 'secondary' as const,
          color: 'text-yellow-600'
        };
      case 'assigned':
        return {
          icon: CheckCircle2,
          label: 'Assigned',
          variant: 'default' as const,
          color: 'text-blue-600'
        };
      case 'shopping':
        return {
          icon: Package,
          label: 'Shopping',
          variant: 'default' as const,
          color: 'text-orange-600'
        };
      case 'packed':
        return {
          icon: Package,
          label: 'Packed',
          variant: 'default' as const,
          color: 'text-green-600'
        };
      case 'in_transit':
        return {
          icon: Truck,
          label: 'In Transit',
          variant: 'default' as const,
          color: 'text-purple-600'
        };
      case 'delivered':
        return {
          icon: CheckCircle2,
          label: 'Delivered',
          variant: 'default' as const,
          color: 'text-green-700'
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