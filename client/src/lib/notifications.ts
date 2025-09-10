import { supabase } from "../utils/supabaseClient";

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

export async function fetchNotifications(limit=20, offset=0) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset+limit-1);
  if (error) throw error;
  return data;
}

export async function markAsRead(id: string) {
  const response = await fetch(`/api/notifications/${id}/read`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to mark notification as read');
  }

  return response.json();
}