
import React, { useState, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ConversationMessage } from "@/types/message";
import ConversationList from "@/components/ConversationList";
import ChatArea from "@/components/ChatArea";
import { useUnreadMessagesCount } from "@/hooks/use-unread-messages";

const Messages: React.FC = () => {
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<ConversationMessage | null>(null);
  const { markConversationAsRead } = useUnreadMessagesCount(user?.id);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Mark messages as read when conversation is selected
  useEffect(() => {
    if (selectedConversation && user) {
      markConversationAsRead(selectedConversation.id);
    }
  }, [selectedConversation, user, markConversationAsRead]);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6">
      <div ref={containerRef} className="flex h-[calc(100vh-150px)] rounded-lg border border-border overflow-hidden">
        {/* Conversations Sidebar */}
        <div className={`${selectedConversation ? 'hidden md:block' : 'block'} w-full md:w-1/3 h-full overflow-hidden flex-shrink-0`}>
          <ConversationList 
            userId={user.id}
            selectedConversation={selectedConversation}
            onSelectConversation={setSelectedConversation}
          />
        </div>
        
        {/* Chat Area */}
        <div className={`${selectedConversation ? 'flex' : 'hidden md:flex'} flex-col w-full md:w-2/3 bg-background h-full overflow-hidden`}>
          <ChatArea 
            userId={user.id}
            conversation={selectedConversation}
            onBack={() => setSelectedConversation(null)}
          />
        </div>
      </div>
    </div>
  );
};

export default Messages;
