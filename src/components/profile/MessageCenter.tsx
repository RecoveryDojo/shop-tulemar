import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Send, 
  MessageCircle, 
  User, 
  Clock, 
  AlertTriangle,
  Archive,
  Plus
} from 'lucide-react';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface MessageCenterProps {
  selectedUserId?: string;
  onSelectUser?: (userId: string) => void;
}

export function MessageCenter({ selectedUserId, onSelectUser }: MessageCenterProps) {
  const { user } = useAuth();
  const { messages, threads, unreadCount, sendMessage, markAsRead, archiveThread } = useMessages({
    userId: user?.id
  });
  
  const [activeTab, setActiveTab] = useState<'inbox' | 'compose' | 'threads'>('inbox');
  const [newMessage, setNewMessage] = useState({
    recipientId: selectedUserId || '',
    subject: '',
    content: '',
    priority: 'normal',
    messageType: 'direct'
  });
  const [selectedThread, setSelectedThread] = useState<string | null>(null);

  const handleSendMessage = async () => {
    try {
      if (!newMessage.recipientId || !newMessage.content) {
        return;
      }

      await sendMessage(
        newMessage.recipientId,
        newMessage.content,
        newMessage.subject || 'New Message',
        newMessage.messageType,
        newMessage.priority
      );

      // Reset form
      setNewMessage({
        recipientId: '',
        subject: '',
        content: '',
        priority: 'normal',
        messageType: 'direct'
      });

      setActiveTab('inbox');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'emergency': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'broadcast': return <MessageCircle className="h-4 w-4 text-blue-500" />;
      default: return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const inboxMessages = messages.filter(msg => 
    msg.recipient_id === user?.id || msg.sender_id === user?.id
  );

  return (
    <div className="space-y-6">
      {/* Header with tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant={activeTab === 'inbox' ? 'default' : 'outline'}
            onClick={() => setActiveTab('inbox')}
            className="relative"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Inbox
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2 px-1 py-0 text-xs">
                {unreadCount}
              </Badge>
            )}
          </Button>
          <Button
            variant={activeTab === 'compose' ? 'default' : 'outline'}
            onClick={() => setActiveTab('compose')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Compose
          </Button>
          <Button
            variant={activeTab === 'threads' ? 'default' : 'outline'}
            onClick={() => setActiveTab('threads')}
          >
            <Archive className="h-4 w-4 mr-2" />
            Threads
          </Button>
        </div>
      </div>

      {/* Inbox Tab */}
      {activeTab === 'inbox' && (
        <Card>
          <CardHeader>
            <CardTitle>Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              {inboxMessages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No messages yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {inboxMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        !message.is_read && message.recipient_id === user?.id
                          ? 'bg-blue-50 border-blue-200'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => {
                        if (!message.is_read && message.recipient_id === user?.id) {
                          markAsRead(message.id);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          {getMessageTypeIcon(message.message_type)}
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">
                                {message.sender_id === user?.id
                                  ? `To: ${message.recipient_profile?.display_name || 'Unknown User'}`
                                  : `From: ${message.sender_profile?.display_name || 'Unknown User'}`
                                }
                              </span>
                              <Badge variant={getPriorityColor(message.priority)} className="text-xs">
                                {message.priority}
                              </Badge>
                            </div>
                            <p className="text-sm font-medium mt-1">
                              {message.subject || 'No Subject'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                          </div>
                          {message.sent_via_email && (
                            <Badge variant="outline" className="text-xs mt-1">
                              Email Sent
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {message.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Compose Tab */}
      {activeTab === 'compose' && (
        <Card>
          <CardHeader>
            <CardTitle>Compose Message</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Recipient ID</label>
                <Input
                  placeholder="Enter recipient user ID"
                  value={newMessage.recipientId}
                  onChange={(e) => setNewMessage(prev => ({ ...prev, recipientId: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Priority</label>
                <Select 
                  value={newMessage.priority} 
                  onValueChange={(value) => setNewMessage(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Subject</label>
              <Input
                placeholder="Message subject"
                value={newMessage.subject}
                onChange={(e) => setNewMessage(prev => ({ ...prev, subject: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Message</label>
              <Textarea
                placeholder="Type your message here..."
                value={newMessage.content}
                onChange={(e) => setNewMessage(prev => ({ ...prev, content: e.target.value }))}
                rows={6}
              />
            </div>

            <Button onClick={handleSendMessage} className="w-full">
              <Send className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Threads Tab */}
      {activeTab === 'threads' && (
        <Card>
          <CardHeader>
            <CardTitle>Conversation Threads</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              {threads.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Archive className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No conversation threads</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {threads.map((thread) => (
                    <div
                      key={thread.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => setSelectedThread(thread.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{thread.subject}</h4>
                          <p className="text-sm text-muted-foreground">
                            {thread.participant_ids.length} participants
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDistanceToNow(new Date(thread.last_message_at), { addSuffix: true })}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              archiveThread(thread.id);
                            }}
                          >
                            <Archive className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}