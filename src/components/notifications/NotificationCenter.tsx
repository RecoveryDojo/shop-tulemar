import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
import { cn } from '@/lib/utils';

interface NotificationCenterProps {
  userRole?: string;
  userId?: string;
  className?: string;
}

export function NotificationCenter({ userRole, userId, className }: NotificationCenterProps) {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications({
    userRole,
    userId
  });

  const getNotificationIcon = (type: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'order_confirmed': <CheckCircle2 className="h-4 w-4 text-green-500" />,
      'order_assigned': <Bell className="h-4 w-4 text-blue-500" />,
      'shopping_started': <Package className="h-4 w-4 text-orange-500" />,
      'shopping_complete': <CheckCircle2 className="h-4 w-4 text-green-500" />,
      'out_for_delivery': <Truck className="h-4 w-4 text-blue-500" />,
      'delivery_complete': <Home className="h-4 w-4 text-green-500" />,
      'stocking_complete': <CheckCircle2 className="h-4 w-4 text-green-500" />,
      'delay_notification': <AlertTriangle className="h-4 w-4 text-yellow-500" />,
      'substitution_request': <AlertTriangle className="h-4 w-4 text-orange-500" />,
      'escalation': <AlertTriangle className="h-4 w-4 text-red-500" />
    };
    
    return iconMap[type] || <Bell className="h-4 w-4 text-muted-foreground" />;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'confirmed': 'bg-blue-100 text-blue-800',
      'assigned': 'bg-purple-100 text-purple-800',
      'shopping': 'bg-orange-100 text-orange-800',
      'out_for_delivery': 'bg-blue-100 text-blue-800',
      'delivered': 'bg-green-100 text-green-800',
      'stocking': 'bg-indigo-100 text-indigo-800',
      'completed': 'bg-green-100 text-green-800'
    };
    
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read_at) {
      markAsRead(notification.id);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="flex items-center gap-1"
            >
              <CheckCircle2 className="h-4 w-4" />
              Mark all read
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <div
                    className={cn(
                      "p-4 hover:bg-muted/50 cursor-pointer transition-colors",
                      !notification.read_at && "bg-muted/30"
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.notification_type)}
                      </div>
                      
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className={cn(
                            "text-sm font-medium",
                            !notification.read_at && "font-semibold"
                          )}>
                            {notification.message_content}
                          </p>
                          {!notification.read_at && (
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          )}
                        </div>
                        
                        {notification.order && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{notification.order.customer_name}</span>
                            <Badge 
                              variant="outline" 
                              className={cn("text-xs", getStatusColor(notification.order.status))}
                            >
                              {notification.order.status}
                            </Badge>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  </div>
                  {index < notifications.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}