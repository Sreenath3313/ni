import api from './api';

export interface Notification {
  id: number;
  user_id?: number;
  title: string;
  message: string;
  type: 'low_stock' | 'order_update' | 'system';
  is_read: boolean;
  created_at: string;
}

const NotificationService = {
  getAll: async (): Promise<{ count: number; notifications: Notification[] }> => {
    const response = await api.get('/notifications');
    return response.data;
  },
  
  getUnreadCount: async (): Promise<{ unread_count: number }> => {
    const response = await api.get('/notifications/unread');
    return response.data;
  },
  
  markAsRead: async (id: number): Promise<{ notification: Notification }> => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },
  
  markAllAsRead: async (): Promise<void> => {
    await api.put('/notifications/read/all');
  },
  
  delete: async (id: number): Promise<void> => {
    await api.delete(`/notifications/${id}`);
  }
};

export default NotificationService;