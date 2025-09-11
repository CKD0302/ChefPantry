import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { fetchNotifications } from "@/lib/notifications";
import { NotificationsPanel } from "@/components/notifications/NotificationsPanel";

// Frontend notification type that matches Supabase API response format
interface NotificationRow {
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
}

interface NotificationsBellProps {
  userId: string;
  onNotificationUpdate?: () => void;
}

export function NotificationsBell({ userId, onNotificationUpdate }: NotificationsBellProps) {
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const loadNotifications = async () => {
    try {
      const data = await fetchNotifications(20, 0);
      setNotifications(data || []);
      const unread = (data || []).filter(n => !n.read_at).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  useEffect(() => {
    if (userId) {
      loadNotifications();
    }
  }, [userId]);

  const handleNotificationRead = async (notificationId?: string) => {
    // Optimistic update - immediately decrease count if we know which notification was read
    if (notificationId) {
      const notification = notifications.find(n => n.id === notificationId);
      if (notification && !notification.read_at) {
        setUnreadCount(prev => Math.max(0, prev - 1));
        // Update local notifications state
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId 
              ? { ...n, read_at: new Date().toISOString() }
              : n
          )
        );
      }
    }

    // Still refresh to ensure consistency
    loadNotifications();
    onNotificationUpdate?.();
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
        </SheetHeader>
        <NotificationsPanel 
          userId={userId}
          notifications={notifications}
          onNotificationRead={handleNotificationRead}
          onClose={() => setIsOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}