
import React, { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell } from "lucide-react";
import { Button } from "./ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: "info" | "success" | "warning" | "error";
}

// Sample notifications data
const sampleNotifications: NotificationItem[] = [
  {
    id: "1",
    title: "Nouveau message",
    message: "Vous avez reçu un nouveau message de Jean Dupont",
    timestamp: "2023-07-15T10:30:00",
    read: false,
    type: "info",
  },
  {
    id: "2",
    title: "Terrain validé",
    message: "Votre terrain 'Parcelle Sud' a été validé par le technicien",
    timestamp: "2023-07-14T16:45:00",
    read: true,
    type: "success",
  },
  {
    id: "3",
    title: "Nouvel investissement",
    message: "Un investisseur a financé votre projet à hauteur de 500 000 Ar",
    timestamp: "2023-07-13T09:15:00",
    read: true,
    type: "success",
  },
  {
    id: "4",
    title: "Jalon à réaliser",
    message: "Le jalon 'Semis' doit être réalisé dans les 3 prochains jours",
    timestamp: "2023-07-12T14:20:00",
    read: false,
    type: "warning",
  },
  {
    id: "5",
    title: "Problème détecté",
    message: "Le technicien a signalé un problème sur votre terrain",
    timestamp: "2023-07-11T11:10:00",
    read: false,
    type: "error",
  },
];

const NotificationItem: React.FC<{ notification: NotificationItem }> = ({ notification }) => {
  const typeStyles = {
    info: "bg-blue-50 border-blue-200",
    success: "bg-green-50 border-green-200",
    warning: "bg-amber-50 border-amber-200",
    error: "bg-red-50 border-red-200",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-3 border rounded-md mb-2 relative",
        notification.read ? "bg-gray-50 border-gray-200" : typeStyles[notification.type],
        !notification.read && "font-medium"
      )}
    >
      {!notification.read && (
        <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-blue-500"></span>
      )}
      <h4 className="font-medium">{notification.title}</h4>
      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
      <p className="text-xs text-gray-500 mt-2">
        {new Date(notification.timestamp).toLocaleDateString()} • {new Date(notification.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
      </p>
    </motion.div>
  );
};

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(sampleNotifications);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
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
              Tout marquer comme lu
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px] p-4">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <NotificationItem key={notification.id} notification={notification} />
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

export default Notifications;
