/**
 * Enhanced Notification Manager
 * Fixes instant notification delivery and cross-browser compatibility
 */

import { toast } from 'sonner';

export interface NotificationConfig {
  title: string;
  description?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export class NotificationManager {
  private permission: NotificationPermission = 'default';
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private notificationQueue: NotificationConfig[] = [];
  private isProcessingQueue = false;

  constructor() {
    this.initializePermissions();
    this.registerServiceWorker();
    this.setupVisibilityHandling();
  }

  private async initializePermissions() {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.warn('[NotificationManager] Browser does not support notifications');
      return;
    }

    this.permission = Notification.permission;
    
    // Auto-request permission for better UX
    if (this.permission === 'default') {
      try {
        this.permission = await Notification.requestPermission();
        console.log('[NotificationManager] Permission status:', this.permission);
      } catch (error) {
        console.error('[NotificationManager] Failed to request permission:', error);
      }
    }
  }

  private async registerServiceWorker() {
    // Register service worker for background notifications
    if ('serviceWorker' in navigator) {
      try {
        // Avoid duplicate registrations by checking existing controller
        const registrations = await navigator.serviceWorker.getRegistrations();
        const alreadyRegistered = registrations.some((r) => r.active?.scriptURL.endsWith('/sw.js'));
        if (!alreadyRegistered) {
          this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');
          console.log('[NotificationManager] Service worker registered');
        } else {
          this.serviceWorkerRegistration = registrations.find((r) => r.active?.scriptURL.endsWith('/sw.js')) || null;
          console.log('[NotificationManager] Service worker already registered');
        }
      } catch (error) {
        console.warn('[NotificationManager] Service worker registration failed:', error);
        // Fallback to regular notifications
      }
    }
  }

  private setupVisibilityHandling() {
    // Process queued notifications when app becomes visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.notificationQueue.length > 0) {
        console.log('[NotificationManager] App visible - processing queued notifications');
        this.processNotificationQueue();
      }
    });
  }

  async showNotification(config: NotificationConfig) {
    // Always show toast notification (works in all browsers)
    this.showToastNotification(config);

    // Queue for native notification if app is not visible
    if (document.hidden || !document.hasFocus()) {
      this.notificationQueue.push(config);
      this.processNotificationQueue();
    }
  }

  private showToastNotification(config: NotificationConfig) {
    const { title, description, type = 'info', duration = 4000, action } = config;
    
    try {
      switch (type) {
        case 'success':
          toast.success(title, {
            description,
            duration: duration,
            action: action ? {
              label: action.label,
              onClick: action.onClick
            } : undefined
          });
          break;
        case 'error':
          toast.error(title, {
            description,
            duration: duration,
            action: action ? {
              label: action.label,
              onClick: action.onClick
            } : undefined
          });
          break;
        case 'warning':
          toast.warning(title, {
            description,
            duration: duration,
            action: action ? {
              label: action.label,
              onClick: action.onClick
            } : undefined
          });
          break;
        default:
          toast(title, {
            description,
            duration: duration,
            action: action ? {
              label: action.label,
              onClick: action.onClick
            } : undefined
          });
      }
    } catch (error) {
      console.error('[NotificationManager] Toast notification failed:', error);
    }
  }

  private async processNotificationQueue() {
    if (this.isProcessingQueue || this.notificationQueue.length === 0) return;

    this.isProcessingQueue = true;

    try {
      while (this.notificationQueue.length > 0) {
        const config = this.notificationQueue.shift()!;
        await this.showNativeNotification(config);
        
        // Small delay to prevent overwhelming the user
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } finally {
      this.isProcessingQueue = false;
    }
  }

  private async showNativeNotification(config: NotificationConfig) {
    // Skip if no permission
    if (this.permission !== 'granted') {
      console.log('[NotificationManager] No permission for native notifications');
      return;
    }

    try {
      const options: NotificationOptions = {
        body: config.description,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: `notification-${Date.now()}`,
        requireInteraction: config.persistent ?? false,
        silent: false
      };

      // Add browser-specific options safely
      const extendedOptions = options as any;
      if ('vibrate' in navigator) {
        extendedOptions.vibrate = [200, 100, 200];
      }
      extendedOptions.timestamp = Date.now();

      let notification: Notification;

      // Use service worker for better reliability if available
      if (this.serviceWorkerRegistration) {
        await this.serviceWorkerRegistration.showNotification(config.title, extendedOptions);
      } else {
        // Fallback to regular notification
        notification = new Notification(config.title, extendedOptions);
        
        // Handle click events
        notification.onclick = () => {
          window.focus();
          config.action?.onClick();
          notification.close();
        };

        // Auto-close after duration (for browsers that don't respect requireInteraction)
        if (!config.persistent) {
          setTimeout(() => {
            notification.close();
          }, config.duration ?? 6000);
        }
      }

      console.log('[NotificationManager] Native notification shown:', config.title);
    } catch (error) {
      console.error('[NotificationManager] Native notification failed:', error);
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }

    try {
      this.permission = await Notification.requestPermission();
      console.log('[NotificationManager] Permission updated:', this.permission);
      return this.permission;
    } catch (error) {
      console.error('[NotificationManager] Permission request failed:', error);
      return 'denied';
    }
  }

  getPermissionStatus(): NotificationPermission {
    return this.permission;
  }

  clearQueue() {
    this.notificationQueue = [];
    console.log('[NotificationManager] Notification queue cleared');
  }

  // Browser-specific optimizations
  private isMobileSafari(): boolean {
    return /iP(ad|od|hone)/.test(navigator.userAgent) && /WebKit/.test(navigator.userAgent);
  }

  private isFirefox(): boolean {
    return navigator.userAgent.toLowerCase().includes('firefox');
  }

  private isChrome(): boolean {
    return /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
  }

  // Enhanced notification for specific use cases
  showOrderNotification(orderData: any) {
    this.showNotification({
      title: 'New Order Received',
      description: `Order #${orderData.id} from ${orderData.customer_name}`,
      type: 'info',
      persistent: true,
      action: {
        label: 'View Order',
        onClick: () => {
          window.location.href = `/admin?order=${orderData.id}`;
        }
      }
    });
  }

  showAssignmentNotification(assignmentData: any) {
    this.showNotification({
      title: 'New Assignment',
      description: `You've been assigned to ${assignmentData.role} for order #${assignmentData.order_id}`,
      type: 'success',
      persistent: true,
      action: {
        label: 'View Assignment',
        onClick: () => {
          const role = assignmentData.role.toLowerCase();
          window.location.href = `/${role}`;
        }
      }
    });
  }

  showSystemNotification(message: string, type: 'info' | 'warning' | 'error' = 'info') {
    this.showNotification({
      title: 'System Update',
      description: message,
      type,
      duration: type === 'error' ? 8000 : 4000
    });
  }
}

// Singleton instance
export const notificationManager = new NotificationManager();

// React hook for notifications
export const useNotificationManager = () => {
  const [permission, setPermission] = React.useState<NotificationPermission>('default');

  React.useEffect(() => {
    setPermission(notificationManager.getPermissionStatus());
  }, []);

  const requestPermission = async () => {
    const newPermission = await notificationManager.requestPermission();
    setPermission(newPermission);
    return newPermission;
  };

  const showNotification = (config: NotificationConfig) => {
    notificationManager.showNotification(config);
  };

  return {
    permission,
    requestPermission,
    showNotification,
    showOrderNotification: notificationManager.showOrderNotification.bind(notificationManager),
    showAssignmentNotification: notificationManager.showAssignmentNotification.bind(notificationManager),
    showSystemNotification: notificationManager.showSystemNotification.bind(notificationManager)
  };
};

// React import
import React from 'react';