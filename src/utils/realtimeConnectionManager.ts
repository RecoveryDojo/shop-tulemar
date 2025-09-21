/**
 * Centralized Real-time Connection Manager
 * Fixes WebSocket disconnections, retry logic, and cross-browser compatibility
 */

import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface ConnectionConfig {
  channelName: string;
  table: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
  onMessage: (payload: any) => void;
  onError?: (error: any) => void;
  onReconnect?: () => void;
  retryAttempts?: number;
  retryDelay?: number;
}

export class RealtimeConnectionManager {
  private channels: Map<string, RealtimeChannel> = new Map();
  private reconnectTimers: Map<string, NodeJS.Timeout> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private configs: Map<string, ConnectionConfig> = new Map();
  private isOnline: boolean = navigator.onLine;

  constructor() {
    this.setupNetworkListeners();
    this.setupVisibilityListeners();
  }

  private setupNetworkListeners() {
    // Handle network status changes
    window.addEventListener('online', () => {
      console.log('[RealtimeManager] Network online - reconnecting channels');
      this.isOnline = true;
      this.reconnectAllChannels();
    });

    window.addEventListener('offline', () => {
      console.log('[RealtimeManager] Network offline - pausing connections');
      this.isOnline = false;
    });
  }

  private setupVisibilityListeners() {
    // Only reconnect when tab becomes visible after being hidden for >30 seconds
    let hiddenTime: number | null = null;
    
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        hiddenTime = Date.now();
      } else if (hiddenTime && this.isOnline) {
        const hiddenDuration = Date.now() - hiddenTime;
        if (hiddenDuration > 30000) { // Only if hidden for >30 seconds
          console.log('[RealtimeManager] Tab visible after long absence - checking connections');
          this.checkAndReconnectStaleChannels();
        }
        hiddenTime = null;
      }
    });
  }

  async subscribe(config: ConnectionConfig): Promise<RealtimeChannel> {
    const { channelName, table, event = '*', filter, onMessage, onError, onReconnect } = config;
    
    console.log(`[RealtimeManager] Subscribing to ${channelName}`);
    this.configs.set(channelName, config);

    // Clean up existing channel if it exists
    if (this.channels.has(channelName)) {
      await this.unsubscribe(channelName);
    }

    const channel = supabase.channel(channelName, {
      config: {
        presence: { key: channelName }
      }
    });

    // Add table subscription
    channel.on(
      'postgres_changes' as any,
      {
        event,
        schema: 'public',
        table,
        filter
      } as any,
      (payload: any) => {
        try {
          console.log(`[RealtimeManager] Message received on ${channelName}:`, payload);
          onMessage(payload);
          // Reset retry attempts on successful message
          this.reconnectAttempts.set(channelName, 0);
        } catch (error) {
          console.error(`[RealtimeManager] Error handling message on ${channelName}:`, error);
          onError?.(error);
        }
      }
    );

    // Handle connection status
    channel.on('presence', { event: 'sync' }, () => {
      console.log(`[RealtimeManager] Channel ${channelName} synced`);
    });

    // Handle subscription errors with more robust error catching
    channel.on('system', {}, (payload) => {
      console.log(`[RealtimeManager] System event on ${channelName}:`, payload);
      if (payload.type === 'close' || payload.status === 'error') {
        console.warn(`[RealtimeManager] Channel ${channelName} system error:`, payload);
        // Don't immediately disconnect on system events - they might be transient
        setTimeout(() => {
          if (this.getChannelStatus(channelName) === 'disconnected') {
            this.handleChannelDisconnection(channelName);
          }
        }, 1000);
      }
    });

    try {
      await channel.subscribe((status) => {
        console.log(`[RealtimeManager] Channel ${channelName} status:`, status);
        
        if (status === 'SUBSCRIBED') {
          console.log(`[RealtimeManager] Successfully subscribed to ${channelName}`);
          this.reconnectAttempts.set(channelName, 0);
          onReconnect?.();
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error(`[RealtimeManager] Channel ${channelName} error:`, status);
          this.handleChannelDisconnection(channelName);
          onError?.(new Error(`Channel status: ${status}`));
        } else if (status === 'CLOSED') {
          // Don't treat CLOSED as an error - it's normal during cleanup
          console.log(`[RealtimeManager] Channel ${channelName} closed normally`);
        }
      });

      this.channels.set(channelName, channel);
      return channel;
    } catch (error) {
      console.error(`[RealtimeManager] Failed to subscribe to ${channelName}:`, error);
      onError?.(error);
      throw error;
    }
  }

  private handleChannelDisconnection(channelName: string) {
    const config = this.configs.get(channelName);
    if (!config) return;

    const maxRetries = config.retryAttempts ?? 3;
    const retryDelay = config.retryDelay ?? 3000; // 3 second backoff as requested
    const currentAttempts = this.reconnectAttempts.get(channelName) ?? 0;

    if (currentAttempts >= maxRetries) {
      console.error(`[RealtimeManager] Max retry attempts reached for ${channelName}`);
      config.onError?.(new Error('Max retry attempts reached'));
      return;
    }

    // Clear existing timer
    const existingTimer = this.reconnectTimers.get(channelName);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Exponential backoff with 3s base: 3s, 9s, 27s
    const delay = retryDelay * Math.pow(3, currentAttempts);
    console.log(`[RealtimeManager] Scheduling reconnect for ${channelName} in ${delay}ms (attempt ${currentAttempts + 1})`);

    const timer = setTimeout(async () => {
      if (!this.isOnline) {
        console.log(`[RealtimeManager] Skipping reconnect for ${channelName} - offline`);
        return;
      }

      try {
        this.reconnectAttempts.set(channelName, currentAttempts + 1);
        console.log(`[RealtimeManager] Attempting to reconnect ${channelName}`);
        await this.subscribe(config);
      } catch (error) {
        console.error(`[RealtimeManager] Reconnect failed for ${channelName}:`, error);
        this.handleChannelDisconnection(channelName);
      }
    }, delay);

    this.reconnectTimers.set(channelName, timer);
  }

  async unsubscribe(channelName: string): Promise<void> {
    console.log(`[RealtimeManager] Unsubscribing from ${channelName}`);
    
    // Clear reconnect timer
    const timer = this.reconnectTimers.get(channelName);
    if (timer) {
      clearTimeout(timer);
      this.reconnectTimers.delete(channelName);
    }

    // Remove channel - handle already closed channels gracefully
    const channel = this.channels.get(channelName);
    if (channel) {
      try {
        await supabase.removeChannel(channel);
      } catch (error) {
        // Channel might already be closed, which is fine
        console.log(`[RealtimeManager] Channel ${channelName} was already closed during unsubscribe`);
      }
      this.channels.delete(channelName);
    }

    // Clean up tracking
    this.reconnectAttempts.delete(channelName);
    this.configs.delete(channelName);
  }

  private async reconnectAllChannels() {
    console.log('[RealtimeManager] Reconnecting all channels');
    const configs = Array.from(this.configs.entries());
    
    for (const [channelName, config] of configs) {
      try {
        await this.subscribe(config);
      } catch (error) {
        console.error(`[RealtimeManager] Failed to reconnect ${channelName}:`, error);
      }
    }
  }

  private async checkAndReconnectStaleChannels() {
    console.log('[RealtimeManager] Checking for stale channels');
    
    for (const [channelName, channel] of this.channels.entries()) {
      // Check if channel is still active by trying to track presence
      try {
        await channel.track({ status: 'checking' });
      } catch (error) {
        console.warn(`[RealtimeManager] Channel ${channelName} appears stale, reconnecting`);
        this.handleChannelDisconnection(channelName);
      }
    }
  }

  getChannelStatus(channelName: string): 'connected' | 'disconnected' | 'reconnecting' | 'unknown' {
    const channel = this.channels.get(channelName);
    const hasTimer = this.reconnectTimers.has(channelName);
    
    if (!channel) return 'disconnected';
    if (hasTimer) return 'reconnecting';
    
    // Try to determine if channel is actually connected
    try {
      // If we can access the channel state, assume it's connected
      return channel.state === 'joined' ? 'connected' : 'disconnected';
    } catch {
      return 'unknown';
    }
  }

  async cleanup() {
    console.log('[RealtimeManager] Cleaning up all connections');
    
    // Clear all timers
    for (const timer of this.reconnectTimers.values()) {
      clearTimeout(timer);
    }
    this.reconnectTimers.clear();

    // Unsubscribe from all channels
    const channelNames = Array.from(this.channels.keys());
    for (const channelName of channelNames) {
      await this.unsubscribe(channelName);
    }

    // Remove event listeners
    window.removeEventListener('online', this.reconnectAllChannels);
    window.removeEventListener('offline', () => {});
    document.removeEventListener('visibilitychange', this.checkAndReconnectStaleChannels);
    window.removeEventListener('focus', this.checkAndReconnectStaleChannels);
  }
}

// Singleton instance
export const realtimeManager = new RealtimeConnectionManager();

// Hook for React components - optimized with lazy connection
export const useRealtimeConnection = (config: ConnectionConfig) => {
  const [status, setStatus] = React.useState<'connected' | 'disconnected' | 'reconnecting' | 'unknown'>('disconnected');
  const [isConnected, setIsConnected] = React.useState(false);

  const connect = React.useCallback(async () => {
    if (isConnected) return;
    
    try {
      await realtimeManager.subscribe({
        ...config,
        onReconnect: () => {
          setStatus('connected');
          setIsConnected(true);
          config.onReconnect?.();
        },
        onError: (error) => {
          setStatus('disconnected');
          setIsConnected(false);
          config.onError?.(error);
        }
      });
      setStatus('connected');
      setIsConnected(true);
    } catch (error) {
      setStatus('disconnected');
      setIsConnected(false);
      config.onError?.(error);
    }
  }, [config, isConnected]);

  const disconnect = React.useCallback(async () => {
    if (!isConnected) return;
    await realtimeManager.unsubscribe(config.channelName);
    setIsConnected(false);
    setStatus('disconnected');
  }, [config.channelName, isConnected]);

  // Auto-connect on mount, disconnect on unmount
  React.useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, []);

  // Check status only when requested, not continuously
  const checkStatus = React.useCallback(() => {
    const currentStatus = realtimeManager.getChannelStatus(config.channelName);
    setStatus(currentStatus);
    return currentStatus;
  }, [config.channelName]);

  return { 
    status, 
    connect, 
    disconnect, 
    checkStatus,
    isConnected 
  };
};

// React import for the hook
import React from 'react';