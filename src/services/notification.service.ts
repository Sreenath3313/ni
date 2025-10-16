import { supabase } from '@/lib/supabaseClient';

export interface Notification {
  id: string; // UUID
  user_id: string; // UUID
  type: 'low_stock' | 'delayed_order' | 'system_alert' | 'info';
  message: string;
  is_read: boolean;
  created_at: string;
}

const NotificationService = {
  getAll: async (): Promise<{ count: number; notifications: Notification[] }> => {
    const { data, error, count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return { count: count ?? (data?.length ?? 0), notifications: (data as Notification[]) ?? [] };
  },
  
  getUnreadCount: async (): Promise<{ unread_count: number }> => {
    const { data, error, count } = await supabase
      .from('notifications')
      .select('id', { count: 'exact' })
      .eq('is_read', false);
    if (error) throw error;
    return { unread_count: count ?? (data?.length ?? 0) };
  },
  
  markAsRead: async (id: string): Promise<{ notification: Notification }> => {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return { notification: data as Notification };
  },
  
  markAllAsRead: async (): Promise<void> => {
    const { data: auth } = await supabase.auth.getUser();
    const authUser = auth.user;
    if (!authUser) throw new Error('Not authenticated');
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', authUser.id);
    if (error) throw error;
  },
  
  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

export default NotificationService;