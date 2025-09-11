import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationBadgeProps {
  count: number;
  className?: string;
  showIcon?: boolean;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
}

export function NotificationBadge({ 
  count, 
  className,
  showIcon = true,
  variant = 'destructive' 
}: NotificationBadgeProps) {
  if (count === 0) {
    return showIcon ? (
      <Bell className={cn("h-5 w-5 text-muted-foreground", className)} />
    ) : null;
  }

  return (
    <div className={cn("relative", className)}>
      {showIcon && <Bell className="h-5 w-5 text-foreground" />}
      <Badge 
        variant={variant}
        className={cn(
          "absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-bold",
          showIcon ? "" : "static"
        )}
      >
        {count > 99 ? '99+' : count}
      </Badge>
    </div>
  );
}