import { supabase } from "../utils/supabaseClient";

// Frontend notification type with consistent naming
export interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body?: string;
  entity_type?: string;
  entity_id?: string;
  meta?: any;
  read_at?: string;
  created_at: string;
  isRead: boolean;
}

// Normalize API response to consistent format
const normalizeNotification = (n: any): NotificationRow => ({
  id: n.id,
  user_id: n.user_id ?? n.userId,
  type: n.type,
  title: n.title,
  body: n.body,
  entity_type: n.entity_type ?? n.entityType,
  entity_id: n.entity_id ?? n.entityId,
  meta: n.meta,
  created_at: n.created_at ?? n.createdAt,
  read_at: n.read_at ?? n.readAt,
  isRead: Boolean(n.read_at ?? n.readAt),
});

export function subscribeToNotifications(userId: string, onNew: (row:any)=>void) {
  return supabase
    .channel('realtime:notifications')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${userId}`
    }, payload => onNew(payload.new))
    .subscribe();
}

export async function fetchNotifications(limit=20, offset=0): Promise<NotificationRow[]> {
  // Import apiRequest dynamically to avoid circular dependency
  const { apiRequest } = await import('@/lib/queryClient');
  
  const response = await apiRequest('GET', `/api/notifications?limit=${limit}&offset=${offset}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch notifications: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  return (result.data || []).map(normalizeNotification);
}

export async function markAsRead(id: string): Promise<NotificationRow> {
  // Import apiRequest dynamically to avoid circular dependency
  const { apiRequest } = await import('@/lib/queryClient');
  
  const response = await apiRequest('PATCH', `/api/notifications/${id}/read`);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to mark notification as read: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  return normalizeNotification(result.data);
}