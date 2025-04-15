
import React, { useState, useEffect } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "./ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Notification, DatabaseNotification } from "@/types/notification";

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  type: "info" | "success" | "warning" | "error";
  link?: string;
  entity_id?: string;
  entity_type?: "terrain" | "projet" | "jalon" | "investissement";
}

const NotificationItem: React.FC<{ 
  notification: NotificationItem; 
  onRead: (id: string) => void 
}> = ({ 
  notification,
  onRead 
}) => {
  const typeStyles = {
    info: "bg-blue-50 border-blue-200",
    success: "bg-green-50 border-green-200",
    warning: "bg-amber-50 border-amber-200",
    error: "bg-red-50 border-red-200",
  };

  const handleClick = () => {
    if (!notification.read) {
      onRead(notification.id);
    }
  };

  const content = (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-3 border rounded-md mb-2 relative",
        notification.read ? "bg-gray-50 border-gray-200" : typeStyles[notification.type],
        !notification.read && "font-medium"
      )}
      onClick={handleClick}
    >
      {!notification.read && (
        <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-blue-500"></span>
      )}
      <h4 className="font-medium">{notification.title}</h4>
      <p className="text-sm text-gray-600 mt-1">{notification.description}</p>
      <p className="text-xs text-gray-500 mt-2">
        {new Date(notification.timestamp).toLocaleDateString()} • {new Date(notification.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
      </p>
    </motion.div>
  );

  return notification.link ? (
    <Link to={notification.link} className="block">
      {content}
    </Link>
  ) : (
    content
  );
};

const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('notification')
        .select('*')
        .eq('id_destinataire', user.id)
        .order('date_creation', { ascending: false })
        .limit(20);
        
      if (error) throw error;
      
      const transformedNotifications: NotificationItem[] = (data as unknown as DatabaseNotification[]).map((notification) => {
        let type: "info" | "success" | "warning" | "error" = "info";
        if (notification.type === "validation") type = "success";
        if (notification.type === "alerte") type = "warning";
        if (notification.type === "erreur") type = "error";
        
        let link = "";
        if (notification.entity_type === "terrain") {
          link = `/terrain?id=${notification.entity_id}`;
        } else if (notification.entity_type === "projet") {
          link = `/feed?project=${notification.entity_id}`;
        } else if (notification.entity_type === "jalon") {
          link = `/projet?id=${notification.projet_id}#jalons`;
        } else if (notification.entity_type === "investissement") {
          link = `/projet?id=${notification.projet_id}#investissements`;
        }
        
        // Convert entity_id to string if it exists
        const entityId = notification.entity_id !== undefined 
          ? String(notification.entity_id) 
          : undefined;
        
        return {
          id: String(notification.id_notification), // Convert to string
          title: notification.titre,
          description: notification.message,
          timestamp: notification.date_creation,
          read: notification.lu,
          type,
          link,
          entity_id: entityId,
          entity_type: notification.entity_type as "terrain" | "projet" | "jalon" | "investissement" | undefined
        };
      });
      
      setNotifications(transformedNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Impossible de charger les notifications");
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchNotifications();
    
    if (user) {
      const channel = supabase
        .channel('notification-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notification',
            filter: `id_destinataire=eq.${user.id}`
          },
          (payload) => {
            const newNotification = payload.new as DatabaseNotification;
            
            setNotifications(prev => {
              const exists = prev.some(n => n.id === String(newNotification.id_notification));
              if (exists) return prev;
              
              let type: "info" | "success" | "warning" | "error" = "info";
              if (newNotification.type === "validation") type = "success";
              if (newNotification.type === "alerte") type = "warning";
              if (newNotification.type === "erreur") type = "error";
              
              let link = "";
              if (newNotification.entity_type === "terrain") {
                link = `/terrain?id=${newNotification.entity_id}`;
              } else if (newNotification.entity_type === "projet") {
                link = `/feed?project=${newNotification.entity_id}`;
              } else if (newNotification.entity_type === "jalon") {
                link = `/projet?id=${newNotification.projet_id}#jalons`;
              } else if (newNotification.entity_type === "investissement") {
                link = `/projet?id=${newNotification.projet_id}#investissements`;
              }
              
              const formattedNotification: NotificationItem = {
                id: String(newNotification.id_notification),
                title: newNotification.titre,
                description: newNotification.message,
                timestamp: newNotification.date_creation,
                read: newNotification.lu,
                type,
                link,
                entity_id: newNotification.entity_id ? String(newNotification.entity_id) : undefined,
                entity_type: newNotification.entity_type as "terrain" | "projet" | "jalon" | "investissement" | undefined
              };
              
              toast(formattedNotification.title, {
                description: formattedNotification.description,
              });
              
              return [formattedNotification, ...prev];
            });
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notification')
        .update({ lu: true })
        .eq('id_notification', parseInt(notificationId));
        
      if (error) throw error;
      
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('notification')
        .update({ lu: true })
        .eq('id_destinataire', user.id)
        .eq('lu', false);
        
      if (error) throw error;
      
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({ ...notification, read: true }))
      );
      
      toast.success("Toutes les notifications ont été marquées comme lues");
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      toast.error("Une erreur s'est produite");
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs h-8"
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1.5" />
              Tout marquer comme lu
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px] p-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : notifications.length > 0 ? (
            notifications.map((notification) => (
              <NotificationItem 
                key={notification.id} 
                notification={notification} 
                onRead={markAsRead}
              />
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              Aucune notification
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
