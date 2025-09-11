import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Bell, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Package, 
  Truck,
  Home
} from 'lucide-react';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { NotificationBadge } from './NotificationBadge';
import { cn } from '@/lib/utils';

interface NotificationDropdownProps {
  userRole?: string;
  userId?: string;
  onViewAll?: () => void;
}

export function NotificationDropdown({ userRole, userId, onViewAll }: NotificationDropdownProps) {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications({
    userRole,
    userId
  });

  // Show only recent 5 notifications in dropdown
  const recentNotifications = notifications.slice(0, 5);

  const getNotificationIcon = (type: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'order_confirmed': <CheckCircle2 className="h-3 w-3 text-green-500" />,
      'order_assigned': <Bell className="h-3 w-3 text-blue-500" />,
      'shopping_started': <Package className="h-3 w-3 text-orange-500" />,
      'shopping_complete': <CheckCircle2 className="h-3 w-3 text-green-500" />,
      'out_for_delivery': <Truck className="h-3 w-3 text-blue-500" />,
      'delivery_complete': <Home className="h-3 w-3 text-green-500" />,
      'stocking_complete': <CheckCircle2 className="h-3 w-3 text-green-500" />,
      'delay_notification': <AlertTriangle className="h-3 w-3 text-yellow-500" />,
      'substitution_request': <AlertTriangle className="h-3 w-3 text-orange-500" />,
      'escalation': <AlertTriangle className="h-3 w-3 text-red-500" />
    };
    
    return iconMap[type] || <Bell className="h-3 w-3 text-muted-foreground" />;
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read_at) {
      markAsRead(notification.id);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <NotificationBadge count={unreadCount} showIcon />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold text-sm">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                markAllAsRead();
              }}
              className="text-xs h-7 px-2"
            >
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : recentNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No notifications</p>
            </div>
          ) : (
            <div className="space-y-0">
              {recentNotifications.map((notification, index) => (
                <div key={notification.id}>
                  <DropdownMenuItem
                    className={cn(
                      "p-3 cursor-pointer focus:bg-muted/50",
                      !notification.read_at && "bg-muted/30"
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.notification_type)}
                      </div>
                      
                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn(
                            "text-xs leading-relaxed line-clamp-2",
                            !notification.read_at && "font-medium"
                          )}>
                            {notification.message_content}
                          </p>
                          {!notification.read_at && (
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-1"></div>
                          )}
                        </div>
                        
                        {notification.order && (
                          <p className="text-xs text-muted-foreground truncate">
                            {notification.order.customer_name}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-2.5 w-2.5" />
                          <span className="truncate">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </DropdownMenuItem>
                  {index < recentNotifications.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 5 && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center text-xs"
                onClick={onViewAll}
              >
                View all notifications
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}