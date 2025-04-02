
import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useUnreadMessagesCount } from '@/hooks/use-unread-messages';
import { cn } from '@/lib/utils';

interface MessageBadgeProps {
  isActive: boolean;
  className?: string;
}

const MessageBadge: React.FC<MessageBadgeProps> = ({ isActive, className }) => {
  const { user } = useAuth();
  const { unreadCount } = useUnreadMessagesCount(user?.id);
  
  return (
    <Link 
      to="/messages" 
      className={cn(
        `p-2 rounded-md relative ${isActive ? "text-green-600 bg-gray-100" : "text-gray-700 hover:bg-gray-100"}`,
        className
      )}
      title="Messages"
    >
      <MessageCircle size={22} />
      {unreadCount > 0 && (
        <Badge 
          variant="default" 
          className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center rounded-full bg-red-500 text-white border border-white"
        >
          <span className="text-[10px]">{unreadCount > 99 ? '99+' : unreadCount}</span>
        </Badge>
      )}
    </Link>
  );
};

export default MessageBadge;
