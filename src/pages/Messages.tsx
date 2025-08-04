import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ConversationMessage } from "@/types/message";
import ConversationList from "@/components/ConversationList";
import ChatArea from "@/components/ChatArea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
const Messages: React.FC = () => {
  const {
    user
  } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<ConversationMessage | null>(null);

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  return <TooltipProvider>
      <div className="h-screen flex overflow-hidden">
        {/* Conversations Sidebar */}
        <div className={`${selectedConversation ? 'hidden md:block' : 'block'} w-full md:w-80 h-full border-r border-border flex-shrink-0`}>
          <ConversationList userId={user.id} selectedConversation={selectedConversation} onSelectConversation={setSelectedConversation} />
        </div>
        
        {/* Chat Area */}
        <div className={`${selectedConversation ? 'flex' : 'hidden md:flex'} flex-col flex-1 bg-background h-full`}>
          <ChatArea userId={user.id} conversation={selectedConversation} onBack={() => setSelectedConversation(null)} />
        </div>
      </div>
    </TooltipProvider>;
};
export default Messages;