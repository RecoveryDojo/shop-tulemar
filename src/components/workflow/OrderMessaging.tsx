import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, Send, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getQuickMessagesForRole, type QuickMessage } from '@/lib/quickMessages';
import { formatDistanceToNow } from 'date-fns';

interface OrderMessage {
  id: string;
  order_id: string;
  event_type: string;
  actor_role: string;
  data: {
    message: string;
    sender_name?: string;
    sender_id?: string;
  };
  created_at: string;
}

interface OrderMessagingProps {
  orderId: string;
  userRole: 'customer' | 'shopper' | 'concierge' | 'admin';
  userName?: string;
}

export function OrderMessaging({ orderId, userRole, userName }: OrderMessagingProps) {
  const [messages, setMessages] = useState<OrderMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showQuickMessages, setShowQuickMessages] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const quickMessages = getQuickMessagesForRole(userRole);

  // Fetch messages from new_order_events
  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('new_order_events')
        .select('*')
        .eq('order_id', orderId)
        .eq('event_type', 'MESSAGE_SENT')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data || []) as OrderMessage[]);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Send message
  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || !user) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('new_order_events')
        .insert({
          order_id: orderId,
          event_type: 'MESSAGE_SENT',
          actor_role: userRole,
          data: {
            message: messageText,
            sender_name: userName || user.email,
            sender_id: user.id
          }
        });

      if (error) throw error;

      setNewMessage('');
      setShowQuickMessages(false);
      
      toast({
        title: "Message sent",
        description: "Your message has been delivered",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  // Handle quick message selection
  const handleQuickMessage = (quickMsg: QuickMessage) => {
    sendMessage(quickMsg.text);
  };

  // Real-time subscription
  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel(`order-messages-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'new_order_events',
          filter: `order_id=eq.${orderId}`
        },
        (payload) => {
          if (payload.new.event_type === 'MESSAGE_SENT') {
            setMessages(prev => [...prev, payload.new as OrderMessage]);
            
            // Show toast notification if message is from someone else
            const messageData = payload.new.data as any;
            if (messageData.sender_id !== user?.id) {
              toast({
                title: "New message",
                description: messageData.message,
              });
            }
            
            // Scroll to bottom
            setTimeout(() => {
              scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, user?.id]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'customer': return 'bg-blue-100 text-blue-700';
      case 'shopper': return 'bg-green-100 text-green-700';
      case 'concierge': return 'bg-purple-100 text-purple-700';
      case 'admin': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getRoleInitial = (role: string) => {
    return role.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading messages...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Order Messages
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Messages List */}
        <ScrollArea className="h-[400px] rounded border p-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No messages yet</p>
                <p className="text-sm">Start a conversation below</p>
              </div>
            ) : (
              messages.map((message) => {
                const isOwnMessage = message.data.sender_id === user?.id;
                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className={getRoleColor(message.actor_role)}>
                        {getRoleInitial(message.actor_role)}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex-1 ${isOwnMessage ? 'text-right' : ''}`}>
                      <div className="flex items-center gap-2 mb-1">
                        {!isOwnMessage && (
                          <Badge variant="outline" className="text-xs">
                            {message.actor_role}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <div
                        className={`inline-block rounded-lg px-4 py-2 ${
                          isOwnMessage
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{message.data.message}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        {/* Quick Messages */}
        {showQuickMessages && (
          <div className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Quick Messages
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowQuickMessages(false)}
              >
                ×
              </Button>
            </div>
            <div className="grid gap-2">
              {quickMessages.map((qm) => (
                <Button
                  key={qm.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickMessage(qm)}
                  disabled={sending}
                  className="justify-start text-left h-auto py-2"
                >
                  <span className="text-xs">{qm.text}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Message Input */}
        <div className="space-y-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="min-h-[80px]"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(newMessage);
              }
            }}
          />
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQuickMessages(!showQuickMessages)}
              disabled={sending}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Quick Messages
            </Button>
            <Button
              onClick={() => sendMessage(newMessage)}
              disabled={!newMessage.trim() || sending}
              className="ml-auto"
            >
              <Send className="h-4 w-4 mr-2" />
              {sending ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
