import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, User, Clock } from 'lucide-react';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface MessageInterfaceProps {
  orderId: string;
  customerEmail: string;
  customerName: string;
  isVisible: boolean;
  onClose: () => void;
}

export function MessageInterface({ 
  orderId, 
  customerEmail, 
  customerName, 
  isVisible, 
  onClose 
}: MessageInterfaceProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Mock messages for now - in real implementation, would use useMessages hook
  const [messages, setMessages] = useState([
    {
      id: '1',
      content: 'Hi! I need to request a substitution for the organic milk. The store is out of the brand you requested.',
      sender_id: user?.id || '',
      sender_name: 'Shopper',
      timestamp: '2 minutes ago',
      isFromShopper: true
    }
  ]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    setIsLoading(true);
    try {
      // Mock sending - in real implementation, would call useMessages
      const message = {
        id: Date.now().toString(),
        content: newMessage,
        sender_id: user?.id || '',
        sender_name: 'Shopper',
        timestamp: 'Just now',
        isFromShopper: true
      };
      
      setMessages(prev => [...prev, message]);
      setNewMessage('');
      
      toast({
        title: "Message Sent",
        description: "Customer will be notified about your message",
      });
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <Card className="fixed inset-4 z-50 overflow-hidden flex flex-col max-h-[80vh]">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            <CardTitle>Message Customer</CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="h-4 w-4" />
          <span>{customerName} ({customerEmail})</span>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isFromShopper ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  message.isFromShopper
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <div className="flex items-center gap-1 mt-1 text-xs opacity-70">
                  <Clock className="h-3 w-3" />
                  <span>{message.timestamp}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Message Input */}
        <div className="flex-shrink-0 space-y-2">
          <Textarea
            placeholder="Type your message to the customer..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="min-h-[80px]"
          />
          <div className="flex gap-2">
            <Button 
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isLoading}
              className="flex-1"
            >
              <Send className="h-4 w-4 mr-2" />
              {isLoading ? 'Sending...' : 'Send Message'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Customer will receive an email notification and can respond via the app or email.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}