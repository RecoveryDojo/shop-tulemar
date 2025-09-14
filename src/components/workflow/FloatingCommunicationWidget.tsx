import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Bell, 
  Phone, 
  Users, 
  X,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { CommunicationHub } from './CommunicationHub';

interface FloatingCommunicationWidgetProps {
  orderId?: string;
  orderPhase?: string;
  stakeholders?: Array<{
    id: string;
    name: string;
    role: string;
    avatar?: string;
    status: 'online' | 'away' | 'offline';
    lastSeen?: string;
  }>;
  unreadCount?: number;
  className?: string;
}

export function FloatingCommunicationWidget({ 
  orderId, 
  orderPhase, 
  stakeholders = [], 
  unreadCount = 0,
  className = "" 
}: FloatingCommunicationWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    if (isMinimized) setIsMinimized(false);
  };

  const toggleMinimized = () => {
    setIsMinimized(!isMinimized);
    if (isExpanded) setIsExpanded(false);
  };

  const onlineStakeholders = stakeholders.filter(s => s.status === 'online').length;

  if (isMinimized) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <Button
          onClick={toggleMinimized}
          className="rounded-full w-12 h-12 shadow-lg"
          size="lg"
        >
          <MessageSquare className="h-6 w-6" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  if (isExpanded) {
    return (
      <div className={`fixed inset-4 z-50 ${className}`}>
        <CommunicationHub
          orderId={orderId}
          orderPhase={orderPhase}
          stakeholders={stakeholders}
          onClose={() => setIsExpanded(false)}
        />
      </div>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <div className="bg-background border rounded-lg shadow-lg p-4 min-w-80">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="font-medium text-sm">Quick Comm</span>
            {orderId && (
              <Badge variant="outline" className="text-xs">
                {orderId.slice(-8)}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={toggleExpanded}>
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={toggleMinimized}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Status */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Users className="h-3 w-3" />
              <span>{onlineStakeholders}/{stakeholders.length} online</span>
            </div>
            {orderPhase && (
              <Badge variant="secondary" className="text-xs">
                {orderPhase}
              </Badge>
            )}
          </div>
          
          {unreadCount > 0 && (
            <div className="flex items-center gap-2 text-xs text-orange-600">
              <Bell className="h-3 w-3" />
              <span>{unreadCount} unread message{unreadCount !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleExpanded}
            className="text-xs"
          >
            <MessageSquare className="h-3 w-3 mr-1" />
            Open Chat
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            className="text-xs"
          >
            <Bell className="h-3 w-3 mr-1" />
            Notify All
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            className="text-xs"
          >
            <Phone className="h-3 w-3 mr-1" />
            Quick Call
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={toggleExpanded}
            className="text-xs"
          >
            <Users className="h-3 w-3 mr-1" />
            Team View
          </Button>
        </div>

        {/* Recent Activity Preview */}
        {stakeholders.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <div className="text-xs text-muted-foreground mb-2">Active Team:</div>
            <div className="flex -space-x-2">
              {stakeholders.slice(0, 4).map((stakeholder) => (
                <div
                  key={stakeholder.id}
                  className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center border-2 border-background"
                  title={stakeholder.name}
                >
                  {stakeholder.name.slice(0, 2).toUpperCase()}
                </div>
              ))}
              {stakeholders.length > 4 && (
                <div className="w-6 h-6 rounded-full bg-muted text-muted-foreground text-xs flex items-center justify-center border-2 border-background">
                  +{stakeholders.length - 4}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}