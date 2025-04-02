
import React from "react";
import UserAvatar from "./UserAvatar";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface MessageItemProps {
  id: string;
  user: {
    name: string;
    photo_profil?: string;
    status?: "online" | "offline" | "away" | "busy" | "none";
  };
  lastMessage: string; // Changed from object to string
  timestamp: string;
  unread: number; // Changed from boolean to number
  onClick?: () => void;
}
const MessageItem: React.FC<MessageItemProps> = ({
  user,
  lastMessage,
  timestamp,
  unread,
  onClick,
}) => {
  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className="flex items-center p-3 border-b border-border last:border-0 cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={onClick}
    >
      <UserAvatar 
        src={user.photo_profil} 
        alt={user.name} 
        status={user.status} 
      />
      
      <div className="ml-3 flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-sm text-gray-900 truncate">{user.name}</h3>
          <span className="text-xs text-gray-500">{timestamp}</span>
        </div>
        
        <div className="flex justify-between mt-1">
          <p className="text-xs text-gray-600 truncate max-w-[70%]">
            {lastMessage}
          </p>
          {unread > 0 && (
            <Badge variant="default" className="rounded-full h-5 w-5 p-0 flex items-center justify-center bg-primary">
              <span className="text-[10px]">{unread}</span>
            </Badge>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default MessageItem;
