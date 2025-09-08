import { createContext, useContext, useEffect, useState } from "react";
import { subscribeToNotifications } from "@/lib/notifications";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface NotificationContextType {
  unreadCount: number;
  refreshNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to real-time notifications
    const subscription = subscribeToNotifications(user.id, (newNotification) => {
      // Show toast notification
      toast({
        title: newNotification.title,
        description: newNotification.body,
      });

      // Increment unread count
      setUnreadCount(prev => prev + 1);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id, toast]);

  const refreshNotifications = () => {
    // This will be called when notifications are read to refresh the count
    // The actual count will be managed by the NotificationsBell component
  };

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}