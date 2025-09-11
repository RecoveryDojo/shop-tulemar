import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { debounce } from 'lodash';

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  thread_id?: string;
  subject?: string;
  content: string;
  message_type: 'direct' | 'broadcast' | 'emergency' | 'system';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  is_read: boolean;
  read_at?: string;
  sent_via_email: boolean;
  email_sent_at?: string;
  attachments: MessageAttachment[];
  metadata: MessageMetadata;
  created_at: string;
  updated_at: string;
  edited_at?: string;
  reactions: MessageReaction[];
  delivery_status: 'sending' | 'sent' | 'delivered' | 'failed';
  sender_profile?: UserProfile;
  recipient_profile?: UserProfile;
}

interface MessageAttachment {
  id: string;
  filename: string;
  file_url: string;
  file_type: string;
  file_size: number;
  thumbnail_url?: string;
}

interface MessageReaction {
  id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

interface MessageMetadata {
  edited: boolean;
  forwarded_from?: string;
  reply_to?: string;
  mentions: string[];
  links: string[];
  location?: { lat: number; lng: number; address: string };
  scheduled_for?: string;
  expires_at?: string;
}

interface UserProfile {
  id: string;
  display_name: string;
  avatar_url?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  last_seen: string;
}

interface MessageThread {
  id: string;
  subject: string;
  participant_ids: string[];
  thread_type: 'direct' | 'group' | 'support' | 'announcement';
  is_archived: boolean;
  is_pinned: boolean;
  last_message_at: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  metadata: {
    auto_archive_days?: number;
    description?: string;
    tags: string[];
  };
}

interface TypingIndicator {
  user_id: string;
  thread_id?: string;
  is_typing: boolean;
  timestamp: string;
}

interface UseEnhancedMessagesOptions {
  userId?: string;
  threadId?: string;
  includeArchived?: boolean;
  enableRealtime?: boolean;
  enableTypingIndicators?: boolean;
  enablePresence?: boolean;
  messageLimit?: number;
  autoMarkAsRead?: boolean;
}

interface MessageSearchOptions {
  query?: string;
  fromUserId?: string;
  messageType?: string;
  priority?: string;
  dateRange?: { start: string; end: string };
  hasAttachments?: boolean;
  threadId?: string;
}

export function useEnhancedMessages({
  userId,
  threadId,
  includeArchived = false,
  enableRealtime = true,
  enableTypingIndicators = true,
  enablePresence = true,
  messageLimit = 50,
  autoMarkAsRead = true
}: UseEnhancedMessagesOptions = {}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [messageQueue, setMessageQueue] = useState<Message[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');
  
  const { toast } = useToast();
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const presenceChannelRef = useRef<any>();
  const messageChannelRef = useRef<any>();

  // Rate limiting state
  const [messageCounts, setMessageCounts] = useState<Map<string, { count: number; resetTime: number }>>(new Map());
  const RATE_LIMIT = 10; // messages per minute
  const RATE_WINDOW = 60000; // 1 minute

  // Optimistic updates cache
  const [optimisticMessages, setOptimisticMessages] = useState<Map<string, Message>>(new Map());

  const checkRateLimit = useCallback((userId: string): boolean => {
    const now = Date.now();
    const userLimits = messageCounts.get(userId) || { count: 0, resetTime: now + RATE_WINDOW };
    
    if (now > userLimits.resetTime) {
      setMessageCounts(prev => prev.set(userId, { count: 1, resetTime: now + RATE_WINDOW }));
      return true;
    }
    
    if (userLimits.count >= RATE_LIMIT) {
      return false;
    }
    
    setMessageCounts(prev => prev.set(userId, { ...userLimits, count: userLimits.count + 1 }));
    return true;
  }, [messageCounts]);

  const validateMessage = useCallback((content: string, attachments?: MessageAttachment[]): string | null => {
    if (!content.trim() && (!attachments || attachments.length === 0)) {
      return 'Message cannot be empty';
    }
    
    if (content.length > 5000) {
      return 'Message too long (max 5000 characters)';
    }
    
    if (attachments && attachments.length > 10) {
      return 'Too many attachments (max 10)';
    }
    
    const totalSize = attachments?.reduce((sum, att) => sum + att.file_size, 0) || 0;
    if (totalSize > 50 * 1024 * 1024) { // 50MB
      return 'Attachments too large (max 50MB total)';
    }
    
    return null;
  }, []);

  const sanitizeContent = useCallback((content: string): string => {
    // Basic XSS prevention
    return content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '');
  }, []);

  const fetchMessages = useCallback(async (offset = 0) => {
    if (!userId) return;

    try {
      setLoading(true);
      
      let query = supabase
        .from('user_messages')
        .select(`
          *,
          sender_profile:profiles!user_messages_sender_id_fkey(id, display_name, avatar_url, status),
          recipient_profile:profiles!user_messages_recipient_id_fkey(id, display_name, avatar_url, status)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + messageLimit - 1);

      if (threadId) {
        query = query.eq('thread_id', threadId);
      } else {
        query = query.or(`sender_id.eq.${userId},recipient_id.eq.${userId}`);
      }

      const { data, error } = await query;
      if (error) throw error;

      const messagesWithReactions = (data || []).map((message: any) => ({
        ...message,
        reactions: [], // We'll implement this after types are updated
        attachments: message.attachments || [],
        metadata: message.metadata || { edited: false, mentions: [], links: [] },
        delivery_status: 'delivered' as const
      }));

      if (offset === 0) {
        setMessages(messagesWithReactions);
      } else {
        setMessages(prev => [...prev, ...messagesWithReactions]);
      }

      // Calculate unread count
      if (userId) {
        const unread = messagesWithReactions.filter(msg => 
          msg.recipient_id === userId && !msg.is_read
        ).length;
        setUnreadCount(unread);
      }

      // Auto-mark as read if enabled
      if (autoMarkAsRead && userId) {
        const unreadMessages = messagesWithReactions.filter(msg => 
          msg.recipient_id === userId && !msg.is_read
        );
        
        if (unreadMessages.length > 0) {
          await markMultipleAsRead(unreadMessages.map(msg => msg.id));
        }
      }

    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [userId, threadId, messageLimit, autoMarkAsRead, toast]);

  const fetchThreads = useCallback(async () => {
    if (!userId) return;

    try {
      let query = supabase
        .from('message_threads')
        .select('*')
        .contains('participant_ids', [userId])
        .order('last_message_at', { ascending: false });

      if (!includeArchived) {
        query = query.eq('is_archived', false);
      }

      const { data, error } = await query;
      if (error) throw error;

      setThreads((data || []).map((thread: any) => ({
        ...thread,
        is_pinned: false,
        metadata: thread.metadata || { tags: [], auto_archive_days: 30 }
      })));
    } catch (error: any) {
      console.error('Error fetching threads:', error);
    }
  }, [userId, includeArchived]);

  const sendMessage = useCallback(async (
    recipientId: string,
    content: string,
    options: {
      subject?: string;
      messageType?: 'direct' | 'broadcast' | 'emergency' | 'system';
      priority?: 'low' | 'normal' | 'high' | 'urgent';
      threadId?: string;
      attachments?: File[];
      scheduledFor?: string;
      expiresAt?: string;
      mentions?: string[];
      replyTo?: string;
    } = {}
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Rate limiting
      if (!checkRateLimit(user.id)) {
        throw new Error('Rate limit exceeded. Please wait before sending more messages.');
      }

      // Validate message
      const validationError = validateMessage(content, []);
      if (validationError) {
        throw new Error(validationError);
      }

      // Sanitize content
      const sanitizedContent = sanitizeContent(content);

      // Handle file uploads if attachments exist
      let attachments: MessageAttachment[] = [];
      if (options.attachments && options.attachments.length > 0) {
        attachments = await uploadAttachments(options.attachments);
      }

      let finalThreadId = options.threadId;

      // Create thread if none exists for direct messages
      if (!options.threadId && options.subject && options.messageType !== 'broadcast') {
        const { data: newThread, error: threadError } = await supabase
          .from('message_threads')
          .insert({
            subject: options.subject,
            participant_ids: [user.id, recipientId],
            thread_type: 'direct',
            created_by: user.id,
            metadata: {
              tags: [],
              auto_archive_days: 30
            }
          })
          .select()
          .single();

        if (threadError) throw threadError;
        finalThreadId = newThread.id;
      }

      const messageId = crypto.randomUUID();
      const optimisticMessage: Message = {
        id: messageId,
        sender_id: user.id,
        recipient_id: recipientId,
        thread_id: finalThreadId,
        subject: options.subject,
        content: sanitizedContent,
        message_type: options.messageType || 'direct',
        priority: options.priority || 'normal',
        is_read: false,
        sent_via_email: false,
        attachments,
        metadata: {
          edited: false,
          mentions: options.mentions || [],
          links: extractLinks(sanitizedContent),
          reply_to: options.replyTo,
          scheduled_for: options.scheduledFor,
          expires_at: options.expiresAt
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        reactions: [],
        delivery_status: 'sending',
        sender_profile: {
          id: user.id,
          display_name: 'You',
          status: 'online',
          last_seen: new Date().toISOString()
        }
      };

      // Optimistic update
      setOptimisticMessages(prev => prev.set(messageId, optimisticMessage));
      setMessages(prev => [optimisticMessage, ...prev]);

      // Insert message to database
      const { data: message, error: messageError } = await supabase
        .from('user_messages')
        .insert({
          sender_id: user.id,
          recipient_id: recipientId,
          thread_id: finalThreadId,
          subject: options.subject,
          content: sanitizedContent,
          message_type: options.messageType || 'direct',
          priority: options.priority || 'normal',
          attachments: attachments || [],
          metadata: optimisticMessage.metadata || {}
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // Remove optimistic update and add real message
      setOptimisticMessages(prev => {
        const newMap = new Map(prev);
        newMap.delete(messageId);
        return newMap;
      });

      // Send email notification if not scheduled
      if (!options.scheduledFor) {
        try {
          await supabase.functions.invoke('send-message-email', {
            body: {
              messageId: message.id,
              senderId: user.id,
              recipientId,
              subject: options.subject || 'New Message',
              content: sanitizedContent,
              priority: options.priority || 'normal',
              messageType: options.messageType || 'direct'
            }
          });
        } catch (emailError) {
          console.warn('Email notification failed:', emailError);
        }
      }

      // Create notification
      await createNotification(recipientId, message.id, options.messageType || 'direct');

      toast({
        title: "Message sent",
        description: "Your message has been delivered",
      });

      // Refresh data
      await Promise.all([fetchMessages(), fetchThreads()]);

      return message;

    } catch (error: any) {
      console.error('Error sending message:', error);
      
      // Remove failed optimistic update
      setOptimisticMessages(prev => {
        const newMap = new Map(prev);
        newMap.delete(crypto.randomUUID());
        return newMap;
      });
      
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
      throw error;
    }
  }, [checkRateLimit, validateMessage, sanitizeContent, fetchMessages, fetchThreads, toast]);

  const markAsRead = useCallback(async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('user_messages')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', messageId);

      if (error) throw error;

      // Update local state
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, is_read: true, read_at: new Date().toISOString() }
          : msg
      ));

      setUnreadCount(prev => Math.max(0, prev - 1));

    } catch (error: any) {
      console.error('Error marking message as read:', error);
    }
  }, []);

  const markMultipleAsRead = useCallback(async (messageIds: string[]) => {
    try {
      const { error } = await supabase
        .from('user_messages')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .in('id', messageIds);

      if (error) throw error;

      // Update local state
      setMessages(prev => prev.map(msg => 
        messageIds.includes(msg.id)
          ? { ...msg, is_read: true, read_at: new Date().toISOString() }
          : msg
      ));

      setUnreadCount(prev => Math.max(0, prev - messageIds.length));

    } catch (error: any) {
      console.error('Error marking messages as read:', error);
    }
  }, []);

  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // For now, just update local state since types aren't ready
      console.log('Would add reaction:', { messageId, emoji, userId: user.id });
      
      // Update local state optimistically
      setMessages(prev => prev.map(msg => {
        if (msg.id === messageId) {
          const existingReaction = msg.reactions.find(r => r.user_id === user.id);
          if (existingReaction) {
            return {
              ...msg,
              reactions: msg.reactions.map(r => 
                r.user_id === user.id ? { ...r, emoji } : r
              )
            };
          } else {
            return {
              ...msg,
              reactions: [...msg.reactions, {
                id: crypto.randomUUID(),
                user_id: user.id,
                emoji,
                created_at: new Date().toISOString()
              }]
            };
          }
        }
        return msg;
      }));

    } catch (error: any) {
      console.error('Error adding reaction:', error);
    }
  }, []);

  const searchMessages = useCallback(
    debounce(async (options: MessageSearchOptions) => {
      if (!userId) return;

      try {
        setIsSearching(true);

        let query = supabase
          .from('user_messages')
          .select(`
            *,
            sender_profile:profiles!user_messages_sender_id_fkey(id, display_name, avatar_url),
            recipient_profile:profiles!user_messages_recipient_id_fkey(id, display_name, avatar_url)
          `)
          .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
          .order('created_at', { ascending: false })
          .limit(100);

        if (options.query) {
          query = query.ilike('content', `%${options.query}%`);
        }

        if (options.fromUserId) {
          query = query.eq('sender_id', options.fromUserId);
        }

        if (options.messageType) {
          query = query.eq('message_type', options.messageType);
        }

        if (options.priority) {
          query = query.eq('priority', options.priority);
        }

        if (options.threadId) {
          query = query.eq('thread_id', options.threadId);
        }

        if (options.dateRange) {
          query = query
            .gte('created_at', options.dateRange.start)
            .lte('created_at', options.dateRange.end);
        }

        const { data, error } = await query;
        if (error) throw error;

        setSearchResults((data as any) || []);

      } catch (error: any) {
        console.error('Error searching messages:', error);
        toast({
          title: "Search Error",
          description: "Failed to search messages",
          variant: "destructive",
        });
      } finally {
        setIsSearching(false);
      }
    }, 300),
    [userId, toast]
  );

  const sendTypingIndicator = useCallback(
    debounce(async (isTyping: boolean, threadId?: string) => {
      if (!userId || !enableTypingIndicators) return;

      try {
        // For now, just log since types aren't ready
        console.log('Would send typing indicator:', { userId, isTyping, threadId });
        
        if (isTyping) {
          // Clear typing indicator after 3 seconds
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          
          typingTimeoutRef.current = setTimeout(() => {
            sendTypingIndicator(false, threadId);
          }, 3000);
        }
      } catch (error: any) {
        console.error('Error sending typing indicator:', error);
      }
    }, 500),
    [userId, enableTypingIndicators]
  );

  // Helper functions
  const uploadAttachments = async (files: File[]): Promise<MessageAttachment[]> => {
    const attachments: MessageAttachment[] = [];

    for (const file of files) {
      const fileName = `${crypto.randomUUID()}-${file.name}`;
      const { error } = await supabase.storage
        .from('message-attachments')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('message-attachments')
        .getPublicUrl(fileName);

      attachments.push({
        id: crypto.randomUUID(),
        filename: file.name,
        file_url: publicUrl,
        file_type: file.type,
        file_size: file.size
      });
    }

    return attachments;
  };

  const extractLinks = (content: string): string[] => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return content.match(urlRegex) || [];
  };

  const createNotification = async (recipientId: string, messageId: string, messageType: string) => {
    try {
      await supabase.functions.invoke('create-notification', {
        body: {
          recipientId,
          type: 'new_message',
          messageId,
          messageType
        }
      });
    } catch (error) {
      console.warn('Failed to create notification:', error);
    }
  };

  // Set up real-time subscriptions
  useEffect(() => {
    if (!userId || !enableRealtime) return;

    // Message channel
    messageChannelRef.current = supabase
      .channel('user-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_messages',
          filter: `or(sender_id.eq.${userId},recipient_id.eq.${userId})`
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMessage = payload.new as any;
            
            // Don't add our own optimistic updates
            if (!optimisticMessages.has(newMessage.id)) {
              setMessages(prev => [newMessage, ...prev]);
              
              if (newMessage.recipient_id === userId) {
                setUnreadCount(prev => prev + 1);
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            setMessages(prev => prev.map(msg => 
              msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
            ));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators'
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const indicator = payload.new as TypingIndicator;
            if (indicator.user_id !== userId) {
              setTypingUsers(prev => {
                const filtered = prev.filter(t => t.user_id !== indicator.user_id);
                return indicator.is_typing ? [...filtered, indicator] : filtered;
              });
            }
          } else if (payload.eventType === 'DELETE') {
            const indicator = payload.old as TypingIndicator;
            setTypingUsers(prev => prev.filter(t => t.user_id !== indicator.user_id));
          }
        }
      )
      .subscribe();

    // Presence channel for online status
    if (enablePresence) {
      presenceChannelRef.current = supabase.channel('online-users')
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannelRef.current.presenceState();
          const users = new Set(Object.keys(state));
          setOnlineUsers(users);
        })
        .on('presence', { event: 'join' }, ({ key }) => {
          setOnlineUsers(prev => new Set([...prev, key]));
        })
        .on('presence', { event: 'leave' }, ({ key }) => {
          setOnlineUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(key);
            return newSet;
          });
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await presenceChannelRef.current.track({
              user_id: userId,
              online_at: new Date().toISOString()
            });
          }
        });
    }

    return () => {
      if (messageChannelRef.current) {
        supabase.removeChannel(messageChannelRef.current);
      }
      if (presenceChannelRef.current) {
        supabase.removeChannel(presenceChannelRef.current);
      }
    };
  }, [userId, enableRealtime, enablePresence, optimisticMessages]);

  // Initial data fetch
  useEffect(() => {
    fetchMessages();
    fetchThreads();
  }, [fetchMessages, fetchThreads]);

  // Connection status monitoring
  useEffect(() => {
    const handleOnline = () => setConnectionStatus('connected');
    const handleOffline = () => setConnectionStatus('disconnected');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    // Data
    messages: [...optimisticMessages.values(), ...messages],
    threads,
    unreadCount,
    searchResults,
    typingUsers,
    onlineUsers,
    
    // Status
    loading,
    isSearching,
    connectionStatus,
    
    // Actions
    sendMessage,
    markAsRead,
    markMultipleAsRead,
    addReaction,
    searchMessages,
    sendTypingIndicator,
    
    // Utility
    refetch: () => {
      fetchMessages();
      fetchThreads();
    },
    loadMore: () => fetchMessages(messages.length)
  };
}