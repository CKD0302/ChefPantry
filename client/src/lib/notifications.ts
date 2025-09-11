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
  // Get the current session for authentication
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`/api/notifications?limit=${limit}&offset=${offset}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch notifications: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  return result.data;
}

export async function markAsRead(id: string) {
  // Get the current session for authentication
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`/api/notifications/${id}/read`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to mark notification as read: ${response.status} ${errorText}`);
  }

  return response.json();
}