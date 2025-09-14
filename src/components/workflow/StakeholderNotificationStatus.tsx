import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  CheckCircle2, 
  Clock, 
  Send, 
  Eye, 
  AlertCircle,
  RotateCcw
} from 'lucide-react';

interface Stakeholder {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  status: 'online' | 'away' | 'offline';
}

interface StakeholderNotificationStatusProps {
  stakeholders: Stakeholder[];
  notificationProgress: Record<string, 'sent' | 'delivered' | 'read'>;
  onUpdateProgress: (progress: Record<string, 'sent' | 'delivered' | 'read'>) => void;
}

export function StakeholderNotificationStatus({ 
  stakeholders, 
  notificationProgress, 
  onUpdateProgress 
}: StakeholderNotificationStatusProps) {
  
  const getStatusIcon = (status: 'sent' | 'delivered' | 'read' | undefined) => {
    switch (status) {
      case 'sent':
        return <Send className="h-4 w-4 text-blue-500" />;
      case 'delivered':
        return <Eye className="h-4 w-4 text-yellow-500" />;
      case 'read':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: 'sent' | 'delivered' | 'read' | undefined) => {
    switch (status) {
      case 'sent':
        return 'Sent';
      case 'delivered':
        return 'Delivered';
      case 'read':
        return 'Read';
      default:
        return 'Pending';
    }
  };

  const getStatusColor = (status: 'sent' | 'delivered' | 'read' | undefined) => {
    switch (status) {
      case 'sent':
        return 'bg-blue-500';
      case 'delivered':
        return 'bg-yellow-500';
      case 'read':
        return 'bg-green-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getOverallProgress = () => {
    if (stakeholders.length === 0) return 0;
    const notified = Object.keys(notificationProgress).length;
    return Math.round((notified / stakeholders.length) * 100);
  };

  const getReadProgress = () => {
    if (stakeholders.length === 0) return 0;
    const read = Object.values(notificationProgress).filter(status => status === 'read').length;
    return Math.round((read / stakeholders.length) * 100);
  };

  const simulateStatusUpdate = (stakeholderId: string) => {
    const currentStatus = notificationProgress[stakeholderId];
    let nextStatus: 'sent' | 'delivered' | 'read';
    
    if (!currentStatus || currentStatus === 'sent') {
      nextStatus = 'delivered';
    } else if (currentStatus === 'delivered') {
      nextStatus = 'read';
    } else {
      return; // Already read
    }

    onUpdateProgress({
      ...notificationProgress,
      [stakeholderId]: nextStatus
    });
  };

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Notifications Sent</span>
              <span className="text-lg font-bold">{getOverallProgress()}%</span>
            </div>
            <Progress value={getOverallProgress()} />
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Read by Recipients</span>
              <span className="text-lg font-bold">{getReadProgress()}%</span>
            </div>
            <Progress value={getReadProgress()} />
          </CardContent>
        </Card>
      </div>

      {/* Stakeholder Status Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Notification Status by Stakeholder</span>
            <div className="flex gap-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                <span>Pending</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span>Sent</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <span>Delivered</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>Read</span>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stakeholders.map((stakeholder) => {
              const status = notificationProgress[stakeholder.id];
              return (
                <div 
                  key={stakeholder.id} 
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={stakeholder.avatar} />
                      <AvatarFallback className="text-xs">
                        {stakeholder.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="font-medium">{stakeholder.name}</div>
                      <div className="text-sm text-muted-foreground capitalize">
                        {stakeholder.role}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        stakeholder.status === 'online' ? 'bg-green-500' :
                        stakeholder.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`} />
                      <span className="text-xs text-muted-foreground capitalize">
                        {stakeholder.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(status)}
                      <span className="text-sm font-medium">
                        {getStatusText(status)}
                      </span>
                    </div>
                    
                    <Badge variant={status === 'read' ? 'default' : status ? 'secondary' : 'outline'}>
                      <div className={`w-2 h-2 rounded-full mr-1 ${getStatusColor(status)}`} />
                      {getStatusText(status)}
                    </Badge>

                    {/* Simulate progression for demo */}
                    {status && status !== 'read' && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => simulateStatusUpdate(stakeholder.id)}
                        className="text-xs"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Update
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Notification Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Notification Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(notificationProgress).map(([stakeholderId, status]) => {
              const stakeholder = stakeholders.find(s => s.id === stakeholderId);
              if (!stakeholder) return null;

              return (
                <div key={stakeholderId} className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status)}
                    <span className="text-muted-foreground">
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                  <span>
                    Notification <strong>{getStatusText(status).toLowerCase()}</strong> to{' '}
                    <strong>{stakeholder.name}</strong> ({stakeholder.role})
                  </span>
                </div>
              );
            })}
            
            {Object.keys(notificationProgress).length === 0 && (
              <div className="text-center py-6 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <div>No notifications sent yet</div>
                <div className="text-sm">Send a message to see notification status here</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}