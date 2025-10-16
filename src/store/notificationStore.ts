import { create } from 'zustand';
import NotificationService, { Notification } from '../services/notification.service';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  
  fetchNotifications: async () => {
    set({ loading: true, error: null });
    try {
      const notifications = await NotificationService.getNotifications();
      set({ notifications, loading: false });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch notifications', 
        loading: false 
      });
    }
  },
  
  fetchUnreadCount: async () => {
    try {
      const count = await NotificationService.getUnreadCount();
      set({ unreadCount: count });
    } catch (error: any) {
      console.error('Failed to fetch unread count:', error);
    }
  },
  
  markAsRead: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await NotificationService.markAsRead(id);
      
      // Update the notification in the list
      const updatedNotifications = get().notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      );
      
      // Update unread count
      const unreadCount = get().unreadCount > 0 ? get().unreadCount - 1 : 0;
      
      set({ 
        notifications: updatedNotifications, 
        unreadCount,
        loading: false 
      });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to mark notification as read', 
        loading: false 
      });
    }
  },
  
  markAllAsRead: async () => {
    set({ loading: true, error: null });
    try {
      await NotificationService.markAllAsRead();
      
      // Update all notifications in the list
      const updatedNotifications = get().notifications.map(n => ({ ...n, read: true }));
      
      set({ 
        notifications: updatedNotifications, 
        unreadCount: 0,
        loading: false 
      });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to mark all notifications as read', 
        loading: false 
      });
    }
  },
  
  deleteNotification: async (id: number) => {
    set({ loading: true, error: null });
    try {
      await NotificationService.deleteNotification(id);
      
      // Remove the notification from the list
      const notification = get().notifications.find(n => n.id === id);
      const updatedNotifications = get().notifications.filter(n => n.id !== id);
      
      // Update unread count if the deleted notification was unread
      const unreadCount = notification && !notification.read 
        ? (get().unreadCount > 0 ? get().unreadCount - 1 : 0)
        : get().unreadCount;
      
      set({ 
        notifications: updatedNotifications, 
        unreadCount,
        loading: false 
      });
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || 'Failed to delete notification', 
        loading: false 
      });
    }
  }
}));