
import React, { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Notification, DatabaseNotification } from "@/types/notification";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const typeIcons = {
  info: "💬",
  validation: "✅",
  alerte: "⚠️",
  erreur: "❌",
  assignment: "📋",
};

const Notifications: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      // Subscribe to new notifications
      const channel = supabase
        .channel('notification-changes')
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'notification',
            filter: `id_destinataire=eq.${user.id}`
          }, 
          (payload) => {
            console.log('Nouvelle notification:', payload);
            fetchNotifications();
            
            // Show toast for new notification
            const newNotif = payload.new as DatabaseNotification;
            toast.info(newNotif.titre, {
              description: newNotif.message?.substring(0, 100),
              duration: 5000,
            });
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('notification')
        .select('*')
        .eq('id_destinataire', user.id)
        .order('date_creation', { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching notifications:", error);
        return;
      }
      
      // Type conversion with proper casting
      const typedNotifications: Notification[] = (data || []).map(notif => ({
        ...notif,
        entity_id: notif.entity_id?.toString() || null,
        type: (notif.type || 'info') as Notification['type']
      }));
      
      setNotifications(typedNotifications);
      setUnreadCount(typedNotifications.filter(notif => !notif.lu).length);
    } catch (error) {
      console.error("Error in notification retrieval:", error);
    }
  };

  const markAsRead = async (notificationId: number) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('notification')
        .update({ lu: true })
        .eq('id_notification', notificationId);

      if (error) {
        console.error("Error marking notification as read:", error);
        return;
      }
      
      setNotifications(notifications.map(n => 
        n.id_notification === notificationId ? { ...n, lu: true } : n
      ));
      setUnreadCount(prevCount => Math.max(0, prevCount - 1));
    } catch (error) {
      console.error("Error updating notification:", error);
    }
  };
  
  const markAllAsRead = async () => {
    if (!user || unreadCount === 0) return;
    
    try {
      const { error } = await supabase
        .from('notification')
        .update({ lu: true })
        .eq('id_destinataire', user.id)
        .eq('lu', false);

      if (error) {
        console.error("Error marking all notifications as read:", error);
        return;
      }
      
      setNotifications(notifications.map(n => ({ ...n, lu: true })));
      setUnreadCount(0);
      toast.success("Toutes les notifications ont été marquées comme lues");
    } catch (error) {
      console.error("Error updating notifications:", error);
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `Aujourd'hui à ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Hier à ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
      return `${days[date.getDay()]} à ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (!user) return null;
  
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="p-2 rounded-md relative text-gray-700 hover:bg-gray-100" 
          title="Notifications"
        >
          <Bell size={22} />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 p-0 bg-red-500" 
              variant="destructive"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[380px]">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold">Notifications</h2>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Tout marquer comme lu
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-[400px] max-h-[70vh]">
          {notifications.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              Aucune notification
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id_notification}
                className={`flex flex-col items-start p-3 border-b cursor-pointer ${
                  !notification.lu ? 'bg-blue-50' : ''
                }`}
                onClick={() => markAsRead(notification.id_notification)}
              >
                <div className="flex w-full">
                  <Avatar className="h-10 w-10 mr-3 flex items-center justify-center bg-blue-100 text-lg">
                    {typeIcons[notification.type] || "📩"}
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start w-full">
                      <h4 className={`text-sm font-medium ${!notification.lu ? 'text-blue-600' : ''}`}>
                        {notification.titre}
                      </h4>
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                        {formatDate(notification.date_creation)}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 line-clamp-2 mt-0.5">
                      {notification.message}
                    </p>
                    
                    {!notification.lu && (
                      <div className="mt-1.5">
                        <span className="inline-block h-2 w-2 bg-blue-600 rounded-full"></span>
                      </div>
                    )}
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Notifications;
