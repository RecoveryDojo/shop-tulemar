import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  thread_id?: string;
  subject?: string;
  content: string;
  message_type: string;
  priority: string;
  is_read: boolean;
  read_at?: string;
  sent_via_email: boolean;
  email_sent_at?: string;
  attachments: any;
  metadata: any;
  created_at: string;
  updated_at: string;
  sender_profile?: {
    display_name: string;
    avatar_url?: string;
  };
  recipient_profile?: {
    display_name: string;
    avatar_url?: string;
  };
}

interface MessageThread {
  id: string;
  subject: string;
  participant_ids: string[];
  thread_type: string;
  is_archived: boolean;
  last_message_at: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface UseMessagesOptions {
  userId?: string;
  threadId?: string;
  includeArchived?: boolean;
}

export function useMessages({ userId, threadId, includeArchived = false }: UseMessagesOptions = {}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchMessages = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('user_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (threadId) {
        query = query.eq('thread_id', threadId);
      } else {
        query = query.or(`sender_id.eq.${userId},recipient_id.eq.${userId}`);
      }

      const { data: messages, error } = await query;

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      // Fetch profile data separately for all unique user IDs
      const userIds = new Set<string>();
      messages?.forEach(message => {
        userIds.add(message.sender_id);
        userIds.add(message.recipient_id);
      });

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', Array.from(userIds));

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      // Create a profiles map for easy lookup
      const profilesMap = new Map();
      profiles?.forEach(profile => {
        profilesMap.set(profile.id, profile);
      });

      // Enhance messages with profile data
      const enhancedMessages = messages?.map(message => ({
        ...message,
        sender_profile: profilesMap.get(message.sender_id) || { display_name: 'Unknown User', avatar_url: null },
        recipient_profile: profilesMap.get(message.recipient_id) || { display_name: 'Unknown User', avatar_url: null }
      })) || [];

      setMessages(enhancedMessages);

      // Calculate unread count for current user
      const unreadCount = enhancedMessages.filter(
        msg => msg.recipient_id === userId && !msg.is_read
      ).length;
      setUnreadCount(unreadCount);
    } catch (error) {
      console.error('Error in fetchMessages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchThreads = async () => {
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

      setThreads(data || []);
    } catch (error: any) {
      console.error('Error fetching threads:', error);
    }
  };

  const sendMessage = async (
    recipientId: string,
    content: string,
    subject?: string,
    messageType: string = 'direct',
    priority: string = 'normal',
    threadId?: string
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Validate that recipient is a team member
      const { data: teamValidation, error: validationError } = await supabase
        .from('stakeholder_assignments')
        .select('order_id')
        .eq('user_id', user.id);

      if (validationError) {
        throw new Error('Failed to validate team membership');
      }

      const userOrderIds = teamValidation.map(assignment => assignment.order_id);

      const { data: recipientValidation, error: recipientError } = await supabase
        .from('stakeholder_assignments')
        .select('order_id')
        .eq('user_id', recipientId)
        .in('order_id', userOrderIds);

      if (recipientError || !recipientValidation || recipientValidation.length === 0) {
        throw new Error('You can only send messages to team members');
      }

      let finalThreadId = threadId;

      // Create thread if none exists
      if (!threadId && subject) {
        const { data: newThread, error: threadError } = await supabase
          .from('message_threads')
          .insert({
            subject,
            participant_ids: [user.id, recipientId],
            thread_type: 'direct',
            created_by: user.id
          })
          .select()
          .single();

        if (threadError) throw threadError;
        finalThreadId = newThread.id;
      }

      // Insert message
      const { data: message, error: messageError } = await supabase
        .from('user_messages')
        .insert({
          sender_id: user.id,
          recipient_id: recipientId,
          thread_id: finalThreadId,
          subject,
          content,
          message_type: messageType,
          priority
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // Send email notification
      try {
        await supabase.functions.invoke('send-message-email', {
          body: {
            messageId: message.id,
            senderId: user.id,
            recipientId,
            subject: subject || 'New Message',
            content,
            priority,
            messageType
          }
        });
      } catch (emailError) {
        console.warn('Email notification failed:', emailError);
        // Don't fail the whole operation if email fails
      }

      toast({
        title: "Message sent",
        description: "Your message has been delivered",
      });

      // Refresh messages
      await fetchMessages();
      await fetchThreads();

      return message;

    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
      throw error;
    }
  };

  const markAsRead = async (messageId: string) => {
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

      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));

    } catch (error: any) {
      console.error('Error marking message as read:', error);
    }
  };

  const archiveThread = async (threadId: string) => {
    try {
      const { error } = await supabase
        .from('message_threads')
        .update({ is_archived: true })
        .eq('id', threadId);

      if (error) throw error;

      await fetchThreads();
      
      toast({
        title: "Thread archived",
        description: "Conversation has been archived",
      });

    } catch (error: any) {
      console.error('Error archiving thread:', error);
      toast({
        title: "Error",
        description: "Failed to archive thread",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (userId) {
        setLoading(true);
        await Promise.all([fetchMessages(), fetchThreads()]);
        setLoading(false);
      }
    };

    loadData();
  }, [userId, threadId, includeArchived]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!userId) return;

    const messageChannel = supabase
      .channel('user-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_messages',
          filter: `or(sender_id.eq.${userId},recipient_id.eq.${userId})`
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    const threadChannel = supabase
      .channel('message-threads')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_threads'
        },
        () => {
          fetchThreads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
      supabase.removeChannel(threadChannel);
    };
  }, [userId]);

  return {
    messages,
    threads,
    unreadCount,
    loading,
    sendMessage,
    markAsRead,
    archiveThread,
    refetch: () => {
      fetchMessages();
      fetchThreads();
    }
  };
}