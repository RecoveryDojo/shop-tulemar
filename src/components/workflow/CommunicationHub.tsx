import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  MessageSquare, 
  Send, 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Mic,
  Phone,
  Video,
  Bell,
  Star,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamValidation } from '@/hooks/useTeamValidation';
import { VoiceMessageRecorder } from './VoiceMessageRecorder';
import { StakeholderNotificationStatus } from './StakeholderNotificationStatus';
import { MessageTemplates } from './MessageTemplates';
import { supabase } from '@/integrations/supabase/client';

interface CommunicationHubProps {
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
  onClose?: () => void;
}

const QUICK_TEMPLATES = [
  { id: 'order_complete', text: 'Order completed successfully! All stakeholders have been notified.', category: 'completion' },
  { id: 'need_clarification', text: 'I need clarification on this order. Could you please provide more details?', category: 'question' },
  { id: 'delay_notification', text: 'There is a slight delay in processing. New ETA will be provided shortly.', category: 'delay' },
  { id: 'quality_check', text: 'Quality check completed. All items meet our standards.', category: 'quality' },
  { id: 'substitution_needed', text: 'Substitution required for unavailable item. Please approve alternative.', category: 'substitution' },
];

export function CommunicationHub({ orderId, orderPhase, stakeholders = [], onClose }: CommunicationHubProps) {
  const [activeTab, setActiveTab] = useState('messages');
  const [messageText, setMessageText] = useState('');
  const [selectedStakeholders, setSelectedStakeholders] = useState<string[]>([]);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [notificationProgress, setNotificationProgress] = useState<Record<string, 'sent' | 'delivered' | 'read'>>({});
  
  const { user } = useAuth();
  const { toast } = useToast();
  const { messages, sendMessage, markAsRead } = useMessages({
    userId: user?.id,
    includeArchived: false
  });
  const { validateTeamMember } = useTeamValidation();

  const sendQuickMessage = async (template: typeof QUICK_TEMPLATES[0]) => {
    if (!orderId) return;
    
    try {
      // Send to selected stakeholders or all if none selected
      const recipients = selectedStakeholders.length > 0 ? selectedStakeholders : stakeholders.map(s => s.id);
      
      // Validate each recipient is a team member
      for (const recipientId of recipients) {
        const isTeamMember = await validateTeamMember(recipientId);
        if (!isTeamMember) {
          toast({
            title: "Access Denied",
            description: `Cannot send message - recipient is not on your team`,
            variant: "destructive",
          });
          return;
        }
      }

      for (const recipientId of recipients) {
        await sendMessage(
          recipientId,
          template.text,
          `Order ${orderId.slice(-8)} - ${template.category}`,
          'direct',
          'normal'
        );
      }

      // Update notification status
      const newProgress: Record<string, 'sent'> = {};
      recipients.forEach(id => {
        newProgress[id] = 'sent';
      });
      setNotificationProgress(prev => ({ ...prev, ...newProgress }));

      toast({
        title: "Message Sent",
        description: `Notification sent to ${recipients.length} team member(s)`,
      });

      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const sendCustomMessage = async () => {
    if (!messageText.trim() || !orderId) return;
    
    try {
      const recipients = selectedStakeholders.length > 0 ? selectedStakeholders : stakeholders.map(s => s.id);
      
      // Validate each recipient is a team member
      for (const recipientId of recipients) {
        const isTeamMember = await validateTeamMember(recipientId);
        if (!isTeamMember) {
          toast({
            title: "Access Denied",
            description: `Cannot send message - recipient is not on your team`,
            variant: "destructive",
          });
          return;
        }
      }

      for (const recipientId of recipients) {
        await sendMessage(
          recipientId,
          messageText,
          `Order ${orderId.slice(-8)} - Message`,
          'direct',
          'normal'
        );
      }

      toast({
        title: "Message Sent",
        description: `Custom message sent to ${recipients.length} team member(s)`,
      });

      setMessageText('');
    } catch (error) {
      console.error('Error sending custom message:', error);
      toast({
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const handleStartCall = async () => {
    if (!stakeholders.length) {
      toast({
        title: "No Team Members",
        description: "No team members available to call",
        variant: "destructive"
      });
      return;
    }

    // Use selected stakeholders or find first online one
    const targetStakeholders = selectedStakeholders.length > 0 
      ? stakeholders.filter(s => selectedStakeholders.includes(s.id))
      : [stakeholders.find(s => s.status === 'online') || stakeholders[0]];

    try {
      for (const stakeholder of targetStakeholders) {
        const { data, error } = await supabase.functions.invoke('voice-call-service', {
          body: {
            orderId,
            recipientId: stakeholder.id,
            callType: 'voice',
            message: `Team call regarding order ${orderId?.slice(-8)}`
          }
        });

        if (error) {
          console.error(`Failed to call ${stakeholder.name}:`, error);
          continue;
        }

        toast({
          title: "Call Initiated",
          description: `Calling ${stakeholder.name}...`,
        });

        // For demo, only call the first stakeholder
        break;
      }
    } catch (error: any) {
      toast({
        title: "Call Failed",
        description: error.message || "Unable to initiate calls",
        variant: "destructive"
      });
    }
  };

  const notifyAllStakeholders = async (message: string) => {
    if (!orderId) return;

    try {
      await supabase.functions.invoke('notification-orchestrator', {
        body: {
          orderId,
          notificationType: 'status_update',
          phase: orderPhase || 'current_phase',
          metadata: {
            message,
            automated: false,
            sender_message: message
          }
        }
      });

      toast({
        title: "All Stakeholders Notified",
        description: `Team notification sent to ${stakeholders.length} members`,
      });
    } catch (error: any) {
      console.error('Error notifying stakeholders:', error);
      toast({
        title: "Error",
        description: "Failed to notify all stakeholders",
        variant: "destructive",
      });
    }
  };

  const getStakeholderStatus = (stakeholderId: string) => {
    const stakeholder = stakeholders.find(s => s.id === stakeholderId);
    return stakeholder?.status || 'offline';
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Communication Hub
          {orderId && (
            <Badge variant="outline">Order: {orderId.slice(-8)}</Badge>
          )}
        </CardTitle>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="stakeholders">Stakeholders</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="messages" className="space-y-4">
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={() => notifyAllStakeholders(`Step completed in ${orderPhase || 'current phase'}. Moving to next stage.`)}
                variant="default"
                size="sm"
              >
                <Bell className="h-4 w-4 mr-2" />
                Notify Step Complete
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowVoiceRecorder(true)}
              >
                <Mic className="h-4 w-4 mr-2" />
                Voice Message
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleStartCall}
              >
                <Phone className="h-4 w-4 mr-2" />
                Start Call
              </Button>
            </div>

            {/* Stakeholder Selection */}
            <div>
              <div className="text-sm font-medium mb-2">Send to:</div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedStakeholders.length === 0 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedStakeholders([])}
                >
                  All Stakeholders
                </Button>
                {stakeholders.map((stakeholder) => (
                  <Button
                    key={stakeholder.id}
                    variant={selectedStakeholders.includes(stakeholder.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedStakeholders(prev => 
                        prev.includes(stakeholder.id)
                          ? prev.filter(id => id !== stakeholder.id)
                          : [...prev, stakeholder.id]
                      );
                    }}
                  >
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      stakeholder.status === 'online' ? 'bg-green-500' :
                      stakeholder.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                    }`} />
                    {stakeholder.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Quick Templates */}
            <div>
              <div className="text-sm font-medium mb-2">Quick Messages:</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {QUICK_TEMPLATES.map((template) => (
                  <Button
                    key={template.id}
                    variant="outline"
                    size="sm"
                    className="justify-start text-left h-auto p-3"
                    onClick={() => sendQuickMessage(template)}
                  >
                    <div>
                      <div className="font-medium">{template.category}</div>
                      <div className="text-xs text-muted-foreground truncate">{template.text}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom Message */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Custom Message:</div>
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type your message here..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={sendCustomMessage} disabled={!messageText.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <StakeholderNotificationStatus 
              stakeholders={stakeholders}
              notificationProgress={notificationProgress}
              onUpdateProgress={setNotificationProgress}
            />
          </TabsContent>

          <TabsContent value="stakeholders" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stakeholders.map((stakeholder) => (
                <Card key={stakeholder.id} className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={stakeholder.avatar} />
                      <AvatarFallback>{stakeholder.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium">{stakeholder.name}</div>
                      <div className="text-sm text-muted-foreground capitalize">{stakeholder.role}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className={`w-2 h-2 rounded-full ${
                          stakeholder.status === 'online' ? 'bg-green-500' :
                          stakeholder.status === 'away' ? 'bg-yellow-500' : 'bg-gray-400'
                        }`} />
                        <span className="text-xs text-muted-foreground capitalize">
                          {stakeholder.status}
                        </span>
                        {stakeholder.lastSeen && stakeholder.status !== 'online' && (
                          <span className="text-xs text-muted-foreground">
                            Last seen: {stakeholder.lastSeen}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Phone className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <MessageTemplates 
              orderPhase={orderPhase}
              onSelectTemplate={(template) => setMessageText(template)}
            />
          </TabsContent>
        </Tabs>

        {showVoiceRecorder && (
          <VoiceMessageRecorder
            onClose={() => setShowVoiceRecorder(false)}
            onSend={(audioBlob) => {
              // Handle voice message sending
              toast({
                title: "Voice Message Sent",
                description: "Your voice message has been sent to selected stakeholders",
              });
              setShowVoiceRecorder(false);
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}