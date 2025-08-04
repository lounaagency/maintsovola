
import React from "react";
import UserAvatar from "./UserAvatar";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import OnlineIndicator from "./OnlineIndicator";

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
      className="flex items-center p-4 cursor-pointer messenger-sidebar-hover transition-all duration-200 border-b border-border/50 last:border-0"
      onClick={onClick}
    >
      <div className="relative">
        <UserAvatar 
          src={user.avatar} 
          alt={user.name} 
          className="w-14 h-14"
        />
        <OnlineIndicator 
          isOnline={user.status === 'online'} 
          size="md"
          className="absolute -bottom-1 -right-1"
        />
      </div>
      
      <div className="ml-4 flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <h3 className={`font-medium text-sm truncate ${unread > 0 ? 'text-foreground font-semibold' : 'text-foreground'}`}>
            {user.name}
          </h3>
          <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">{timestamp}</span>
        </div>
        
        <div className="flex justify-between items-center mt-1">
          <p className={`text-sm truncate max-w-[75%] ${unread > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
            {lastMessage}
          </p>
          {unread > 0 && (
            <Badge className="rounded-full h-6 w-6 p-0 flex items-center justify-center bg-[hsl(var(--messenger-blue))] text-white text-xs font-bold ml-2">
              {unread > 99 ? '99+' : unread}
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
