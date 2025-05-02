
import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatRelativeTime } from '@/lib/utils';
import { Notification } from '@/types/notification';

// Define a type specifically for our notification items
interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'error' | 'success' | 'warning';
  link: string;
  entity_id: string | null;
  entity_type: 'terrain' | 'projet' | 'jalon' | 'investissement' | undefined;
  projet_id: string | null;
}

const Notifications: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();
  
  useEffect(() => {
    if (user) {
      fetchNotifications();
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
        .limit(10);
        
      if (error) throw error;
      
      const formattedNotifications = (data || []).map(notification => {
        // Map notification type to UI variant
        let notifType: 'info' | 'error' | 'success' | 'warning' = 'info';
        switch (notification.type) {
          case 'validation':
            notifType = 'success';
            break;
          case 'alerte':
            notifType = 'warning';
            break;
          case 'erreur':
            notifType = 'error';
            break;
          case 'assignment':
            notifType = 'info';
            break;
        }
        
        // Determine link based on entity type
        let link = '';
        if (notification.entity_type === 'projet' || notification.projet_id) {
          link = `/projects/${notification.entity_id || notification.projet_id}`;
        } else if (notification.entity_type === 'terrain') {
          link = `/terrain?id=${notification.entity_id}`;
        } else if (notification.entity_type === 'jalon') {
          link = `/projects/${notification.projet_id}?jalon=${notification.entity_id}`;
        }
        
        return {
          id: notification.id_notification.toString(),
          title: notification.titre,
          description: notification.message,
          timestamp: notification.date_creation,
          read: notification.lu,
          type: notifType,
          link: link,
          entity_id: notification.entity_id?.toString() || null,
          entity_type: notification.entity_type,
          projet_id: notification.projet_id?.toString() || null
        };
      });
      
      setNotifications(formattedNotifications);
      const unread = (data || []).filter(notif => !notif.lu).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };
  
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notification')
        .update({ lu: true })
        .eq('id_notification', parseInt(notificationId));
        
      if (error) throw error;
      
      // Update local state
      const updatedNotifications = notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      );
      setNotifications(updatedNotifications);
      
      // Update unread count
      const unread = updatedNotifications.filter(n => !n.read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  const markAllAsRead = async () => {
    if (notifications.length === 0 || !user) return;
    
    try {
      const { error } = await supabase
        .from('notification')
        .update({ lu: true })
        .eq('id_destinataire', user.id)
        .eq('lu', false);
        
      if (error) throw error;
      
      // Update local state
      const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
      setNotifications(updatedNotifications);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };
  
  const handleNotificationClick = (notification: NotificationItem) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    if (notification.link) {
      navigate(notification.link);
      setIsOpen(false);
    }
  };
  
  const getTimeAgo = (timestamp: string) => {
    return formatRelativeTime(new Date(timestamp).getTime());
  };
  
  const getNotificationIcon = (type: 'info' | 'error' | 'success' | 'warning') => {
    switch (type) {
      case 'info':
        return <div className="w-2 h-2 bg-blue-500 rounded-full"></div>;
      case 'success':
        return <div className="w-2 h-2 bg-green-500 rounded-full"></div>;
      case 'warning':
        return <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>;
      case 'error':
        return <div className="w-2 h-2 bg-red-500 rounded-full"></div>;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-4 w-4 text-[10px] font-bold flex items-center justify-center bg-red-500 text-white rounded-full">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h3 className="font-medium">Notifications</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="text-xs h-7 px-2"
            >
              Tout marquer comme lu
            </Button>
          )}
        </div>
        <div className="max-h-72 overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map(notification => (
              <div 
                key={notification.id}
                className={`
                  p-3 border-b border-border flex gap-3 cursor-pointer hover:bg-accent
                  ${!notification.read ? 'bg-muted/40' : ''}
                `}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="pt-0.5">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {notification.title}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                    {notification.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getTimeAgo(notification.timestamp)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-muted-foreground">
              <p>Aucune notification</p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default Notifications;
