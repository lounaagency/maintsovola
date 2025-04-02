
import React from "react";
import UserAvatar from "./UserAvatar";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";

interface MessageItemProps {
  id: string;
  user: {
    name: string;
    avatar?: string;
    status?: "online" | "offline" | "away" | "busy" | "none";
  };
  lastMessage: string;
  timestamp: string;
  unread: number;
  onClick?: () => void;
}

const MessageItem: React.FC<MessageItemProps> = React.memo(({
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
        src={user.avatar} 
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
});

MessageItem.displayName = "MessageItem";

// Add MessageCircle as a static property 
const MessageItemWithIcon = MessageItem as typeof MessageItem & { 
  Icon: typeof MessageCircle 
};
MessageItemWithIcon.Icon = MessageCircle;

export default MessageItemWithIcon;
