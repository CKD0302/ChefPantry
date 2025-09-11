import { formatDistanceToNow } from "date-fns";
import { useLocation } from "wouter";
import { markAsRead } from "@/lib/notifications";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

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

interface NotificationsPanelProps {
  userId: string;
  notifications: NotificationRow[];
  onNotificationRead: (notificationId?: string) => void;
  onClose: () => void;
}

export function NotificationsPanel({ 
  userId, 
  notifications, 
  onNotificationRead,
  onClose 
}: NotificationsPanelProps) {
  const [, setLocation] = useLocation();

  const handleNotificationClick = async (notification: NotificationRow) => {
    // Mark as read if not already read
    if (!notification.read_at) {
      try {
        await markAsRead(notification.id);
        onNotificationRead(notification.id);
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    }

    // Navigate to relevant page
    if (notification.entity_type === 'invoice' && notification.entity_id) {
      if (notification.type === 'invoice_submitted') {
        // Business received an invoice - go to business invoices
        setLocation('/business/invoices');
      } else if (notification.type === 'invoice_paid') {
        // Chef got paid - go to chef invoices  
        setLocation('/chef/invoices');
      }
    }

    onClose();
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'Invalid date';
    }
  };

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <div className="text-muted-foreground">
          <p>No notifications yet</p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-8rem)] mt-4">
      <div className="space-y-2">
        {notifications.map((notification, index) => (
          <div key={notification.id}>
            <Button
              variant="ghost"
              className={`w-full h-auto p-4 text-left justify-start ${
                !notification.read_at ? 'bg-accent/50' : ''
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-medium leading-none">
                    {notification.title}
                  </h4>
                  {!notification.read_at && (
                    <Badge variant="secondary" className="ml-auto">
                      New
                    </Badge>
                  )}
                </div>
                {notification.body && (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                    {notification.body}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {formatTime(notification.created_at)}
                </p>
              </div>
            </Button>
            {index < notifications.length - 1 && <Separator />}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}