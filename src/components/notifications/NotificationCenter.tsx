import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCircle, Clock } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

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

  // Create some sample notifications for testing
  const sampleNotifications = [
    {
      id: '1',
      order_id: 'order-123',
      notification_type: 'order_assigned',
      recipient_type: 'shopper',
      recipient_identifier: 'shopper-1',
      channel: 'in-app',
      status: 'sent',
      message_content: 'New shopping order assigned to you - Grocery shopping for Jane Smith',
      created_at: new Date().toISOString(),
      read_at: null,
      metadata: {},
      order: {
        customer_name: 'Jane Smith',
        property_address: '123 Oak Street',
        status: 'assigned'
      }
    },
    {
      id: '2',
      order_id: 'order-124',
      notification_type: 'shopping_started',
      recipient_type: 'shopper',
      recipient_identifier: 'shopper-1',
      channel: 'in-app',
      status: 'sent',
      message_content: 'Shopping started for order #124 - Remember to check for substitutions',
      created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      read_at: new Date().toISOString(),
      metadata: {},
      order: {
        customer_name: 'Bob Johnson',
        property_address: '456 Pine Avenue',
        status: 'shopping'
      }
    }
  ];

  const displayNotifications = notifications.length > 0 ? notifications : sampleNotifications;

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
            {(unreadCount > 0 || sampleNotifications.filter(n => !n.read_at).length > 0) && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount || sampleNotifications.filter(n => !n.read_at).length}
              </Badge>
            )}
          </CardTitle>
          {(unreadCount > 0 || sampleNotifications.filter(n => !n.read_at).length > 0) && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="flex items-center gap-1"
            >
              <CheckCircle className="h-4 w-4" />
              Mark all read
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            displayNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border transition-colors ${
                  !notification.read_at ? 'bg-muted/30 border-blue-200' : 'bg-background'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <Bell className="h-4 w-4 text-blue-500" />
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm ${!notification.read_at ? 'font-semibold' : ''}`}>
                        {notification.message_content}
                      </p>
                      {!notification.read_at && (
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      )}
                    </div>
                    
                    {notification.order && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{notification.order.customer_name}</span>
                        <Badge variant="outline" className="text-xs">
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
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}