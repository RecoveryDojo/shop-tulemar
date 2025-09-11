import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { 
  Send, 
  MessageCircle, 
  User, 
  Clock, 
  AlertTriangle,
  Archive,
  Plus,
  Search,
  Paperclip,
  Smile,
  MoreHorizontal,
  Edit3,
  Trash2,
  Reply,
  Forward,
  Phone,
  Video,
  Settings,
  Star,
  Pin,
  Eye,
  EyeOff,
  Download,
  Calendar,
  MapPin,
  Zap
} from 'lucide-react';
import { useEnhancedMessages } from '@/hooks/useEnhancedMessages';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

// Emoji picker component
const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '🔥', '✅', '❌'];

function EmojiPicker({ onSelect, className }: { onSelect: (emoji: string) => void; className?: string }) {
  return (
    <div className={cn("flex gap-2 p-2 bg-popover border rounded-lg shadow-lg", className)}>
      {EMOJI_LIST.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onSelect(emoji)}
          className="text-lg hover:bg-muted rounded p-1 transition-colors"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

// File upload component
function FileUploader({ onFilesSelected, maxFiles = 10, maxSize = 50 * 1024 * 1024 }: {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    
    // Validation
    if (fileArray.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const totalSize = fileArray.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > maxSize) {
      alert(`Total file size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`);
      return;
    }

    onFilesSelected(fileArray);
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    handleFiles(e.dataTransfer.files);
  }, []);

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors",
        dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
      )}
      onClick={() => fileInputRef.current?.click()}
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
      />
      <Paperclip className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        Click or drag files here to upload
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        Max {maxFiles} files, {Math.round(maxSize / 1024 / 1024)}MB total
      </p>
    </div>
  );
}

// Message bubble component
function MessageBubble({ message, isOwn, onReaction, onReply, onEdit, onDelete }: any) {
  const [showReactions, setShowReactions] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getPriorityIcon = () => {
    switch (message.priority) {
      case 'urgent': return <AlertTriangle className="h-3 w-3 text-red-500" />;
      case 'high': return <Zap className="h-3 w-3 text-orange-500" />;
      default: return null;
    }
  };

  return (
    <div className={cn("flex gap-3 group", isOwn ? "flex-row-reverse" : "flex-row")}>
      {!isOwn && (
        <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
          {message.sender_profile?.display_name?.charAt(0) || 'U'}
        </div>
      )}
      
      <div className={cn("max-w-[70%] space-y-1", isOwn ? "items-end" : "items-start")}>
        {!isOwn && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium">{message.sender_profile?.display_name}</span>
            {getPriorityIcon()}
            {message.metadata?.edited && <span className="italic">(edited)</span>}
          </div>
        )}
        
        <div
          className={cn(
            "relative px-3 py-2 rounded-lg text-sm",
            isOwn 
              ? "bg-primary text-primary-foreground ml-auto" 
              : "bg-muted",
            message.delivery_status === 'sending' && "opacity-50"
          )}
          onMouseEnter={() => setShowOptions(true)}
          onMouseLeave={() => setShowOptions(false)}
        >
          {/* Reply indicator */}
          {message.metadata?.reply_to && (
            <div className="text-xs opacity-70 mb-1 p-1 border-l-2 border-current">
              Replying to message
            </div>
          )}
          
          {/* Message content */}
          <div className="whitespace-pre-wrap break-words">
            {message.content}
          </div>
          
          {/* Attachments */}
          {message.attachments?.length > 0 && (
            <div className="mt-2 space-y-1">
              {message.attachments.map((attachment: any) => (
                <div key={attachment.id} className="flex items-center gap-2 text-xs bg-black/10 rounded p-1">
                  <Paperclip className="h-3 w-3" />
                  <span className="truncate">{attachment.filename}</span>
                  <Button size="sm" variant="ghost" className="h-4 w-4 p-0">
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          {/* Message metadata */}
          <div className="flex items-center justify-between mt-1 text-xs opacity-70">
            <span>{formatTime(message.created_at)}</span>
            <div className="flex items-center gap-1">
              {message.delivery_status === 'sending' && <Clock className="h-3 w-3" />}
              {message.delivery_status === 'delivered' && <Eye className="h-3 w-3" />}
              {message.is_read && <EyeOff className="h-3 w-3" />}
            </div>
          </div>

          {/* Message options */}
          {showOptions && (
            <div className={cn(
              "absolute top-0 flex items-center gap-1 bg-background border rounded shadow-lg p-1",
              isOwn ? "left-0 -translate-x-full" : "right-0 translate-x-full"
            )}>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setShowReactions(!showReactions)}>
                <Smile className="h-3 w-3" />
              </Button>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => onReply(message)}>
                <Reply className="h-3 w-3" />
              </Button>
              {isOwn && (
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => onEdit(message)}>
                  <Edit3 className="h-3 w-3" />
                </Button>
              )}
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
        
        {/* Reactions */}
        {message.reactions?.length > 0 && (
          <div className="flex gap-1 text-xs">
            {Object.entries(
              message.reactions.reduce((acc: any, reaction: any) => {
                acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
                return acc;
              }, {})
            ).map(([emoji, count]) => (
              <button
                key={emoji}
                className="bg-muted hover:bg-muted/80 rounded-full px-2 py-1 flex items-center gap-1"
                onClick={() => onReaction(message.id, emoji)}
              >
                <span>{emoji}</span>
                <span>{count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Emoji picker */}
        {showReactions && (
          <EmojiPicker
            onSelect={(emoji) => {
              onReaction(message.id, emoji);
              setShowReactions(false);
            }}
            className="absolute z-10"
          />
        )}
      </div>
    </div>
  );
}

// Typing indicator component
function TypingIndicator({ users }: { users: any[] }) {
  if (users.length === 0) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground p-2">
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span>
        {users.length === 1 
          ? `${users[0].display_name} is typing...`
          : `${users.length} people are typing...`
        }
      </span>
    </div>
  );
}

export function EnhancedMessageCenter() {
  const { user } = useAuth();
  const {
    messages,
    threads,
    unreadCount,
    searchResults,
    typingUsers,
    onlineUsers,
    loading,
    isSearching,
    connectionStatus,
    sendMessage,
    markAsRead,
    addReaction,
    searchMessages,
    sendTypingIndicator,
    refetch
  } = useEnhancedMessages({
    userId: user?.id,
    enableRealtime: true,
    enableTypingIndicators: true,
    enablePresence: true
  });

  const [activeTab, setActiveTab] = useState<'inbox' | 'compose' | 'threads' | 'search'>('inbox');
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState({
    recipientId: '',
    subject: '',
    content: '',
    priority: 'normal' as const,
    messageType: 'direct' as const,
    attachments: [] as File[],
    scheduledFor: '',
    replyTo: null as any
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [editingMessage, setEditingMessage] = useState<any>(null);
  
  const messageListRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle typing indicators
  const handleContentChange = useCallback((content: string) => {
    setNewMessage(prev => ({ ...prev, content }));
    
    if (content.length > 0 && !isComposing) {
      setIsComposing(true);
      sendTypingIndicator(true, selectedThread || undefined);
    } else if (content.length === 0 && isComposing) {
      setIsComposing(false);
      sendTypingIndicator(false, selectedThread || undefined);
    }
  }, [isComposing, selectedThread, sendTypingIndicator]);

  const handleSendMessage = async () => {
    if (!newMessage.content.trim() && newMessage.attachments.length === 0) return;
    
    try {
      await sendMessage(newMessage.recipientId, newMessage.content, {
        subject: newMessage.subject || undefined,
        messageType: newMessage.messageType,
        priority: newMessage.priority,
        threadId: selectedThread || undefined,
        attachments: newMessage.attachments,
        scheduledFor: newMessage.scheduledFor || undefined,
        replyTo: newMessage.replyTo?.id
      });

      // Reset form
      setNewMessage({
        recipientId: '',
        subject: '',
        content: '',
        priority: 'normal',
        messageType: 'direct',
        attachments: [],
        scheduledFor: '',
        replyTo: null
      });
      
      setIsComposing(false);
      sendTypingIndicator(false, selectedThread || undefined);
      
      if (activeTab === 'compose') {
        setActiveTab('inbox');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      await addReaction(messageId, emoji);
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  };

  const handleReply = (message: any) => {
    setNewMessage(prev => ({
      ...prev,
      recipientId: message.sender_id === user?.id ? message.recipient_id : message.sender_id,
      replyTo: message,
      subject: message.subject?.startsWith('Re:') ? message.subject : `Re: ${message.subject || 'Message'}`
    }));
    setActiveTab('compose');
    
    // Focus composer
    setTimeout(() => composerRef.current?.focus(), 100);
  };

  const handleEdit = (message: any) => {
    setEditingMessage(message);
    setNewMessage(prev => ({
      ...prev,
      content: message.content,
      subject: message.subject || '',
      priority: message.priority
    }));
  };

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      searchMessages({ query });
    }
  }, [searchMessages]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-500';
      case 'disconnected': return 'text-red-500';
      case 'reconnecting': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  const displayMessages = selectedThread 
    ? messages.filter(m => m.thread_id === selectedThread)
    : activeTab === 'search' 
      ? searchResults 
      : messages;

  return (
    <div className="flex flex-col h-[80vh] bg-background border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Enhanced Messaging</h2>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="px-2 py-0 text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          
          <div className={cn("flex items-center text-xs", getConnectionStatusColor())}>
            <div className="w-2 h-2 rounded-full bg-current mr-1" />
            {connectionStatus}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button size="sm" variant="outline" onClick={refetch}>
            <Clock className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b bg-muted/20">
        {[
          { key: 'inbox', label: 'Inbox', icon: MessageCircle },
          { key: 'compose', label: 'Compose', icon: Plus },
          { key: 'threads', label: 'Threads', icon: Archive },
          { key: 'search', label: 'Search', icon: Search }
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors",
              activeTab === key
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
            {key === 'inbox' && unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar for threads/search */}
        {(activeTab === 'threads' || activeTab === 'search') && (
          <div className="w-80 border-r bg-muted/20">
            {activeTab === 'search' && (
              <div className="p-4 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search messages..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            )}
            
            <ScrollArea className="flex-1">
              {activeTab === 'threads' ? (
                <div className="p-2 space-y-2">
                  {threads.map((thread) => (
                    <button
                      key={thread.id}
                      onClick={() => setSelectedThread(thread.id)}
                      className={cn(
                        "w-full p-3 text-left rounded-lg border transition-colors",
                        selectedThread === thread.id
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-muted/50"
                      )}
                    >
                      <div className="font-medium truncate">{thread.subject}</div>
                      <div className="text-sm text-muted-foreground">
                        {thread.participant_ids.length} participants
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(thread.last_message_at), { addSuffix: true })}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-2">
                  {isSearching ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Search className="h-8 w-8 mx-auto mb-2 animate-spin" />
                      <p>Searching...</p>
                    </div>
                  ) : searchResults.length === 0 && searchQuery ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No results found</p>
                    </div>
                  ) : null}
                </div>
              )}
            </ScrollArea>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {activeTab === 'compose' ? (
            /* Compose Interface */
            <div className="flex-1 p-4 space-y-4">
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
                    onValueChange={(value: any) => setNewMessage(prev => ({ ...prev, priority: value }))}
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

              {newMessage.replyTo && (
                <div className="p-3 bg-muted rounded-lg border-l-4 border-primary">
                  <div className="text-sm font-medium">Replying to:</div>
                  <div className="text-sm text-muted-foreground truncate">
                    {newMessage.replyTo.content}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setNewMessage(prev => ({ ...prev, replyTo: null }))}
                    className="mt-1 h-6 px-2"
                  >
                    Remove
                  </Button>
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  ref={composerRef}
                  placeholder="Type your message here..."
                  value={newMessage.content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Attachments</label>
                <FileUploader
                  onFilesSelected={(files) => 
                    setNewMessage(prev => ({ ...prev, attachments: [...prev.attachments, ...files] }))
                  }
                />
                {newMessage.attachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {newMessage.attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm truncate">{file.name}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setNewMessage(prev => ({
                              ...prev,
                              attachments: prev.attachments.filter((_, i) => i !== index)
                            }))
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium">Schedule For</label>
                  <Input
                    type="datetime-local"
                    value={newMessage.scheduledFor}
                    onChange={(e) => setNewMessage(prev => ({ ...prev, scheduledFor: e.target.value }))}
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Button onClick={handleSendMessage} disabled={!newMessage.content.trim() && newMessage.attachments.length === 0}>
                    <Send className="h-4 w-4 mr-2" />
                    {newMessage.scheduledFor ? 'Schedule' : 'Send'}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* Message List */
            <div className="flex-1 flex flex-col overflow-hidden">
              <ScrollArea className="flex-1 p-4" ref={messageListRef}>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
                    <p>Loading messages...</p>
                  </div>
                ) : displayMessages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No messages yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {displayMessages.map((message) => (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        isOwn={message.sender_id === user?.id}
                        onReaction={handleReaction}
                        onReply={handleReply}
                        onEdit={handleEdit}
                        onDelete={() => {}}
                      />
                    ))}
                  </div>
                )}
                
                {/* Typing Indicators */}
                <TypingIndicator users={typingUsers.filter(t => t.user_id !== user?.id)} />
              </ScrollArea>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}