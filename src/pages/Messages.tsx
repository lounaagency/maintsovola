
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PanelRight } from "lucide-react";

import ConversationList from "@/components/ConversationList";
import ChatArea from "@/components/ChatArea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Conversation, ConversationMessage } from "@/types/message";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

const Messages: React.FC = () => {
  const [conversations, setConversations] = useState<ConversationMessage[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationMessage | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPanel, setShowPanel] = useState(true);
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile) {
      setShowPanel(!selectedConversation);
    } else {
      setShowPanel(true);
    }
  }, [selectedConversation, isMobile]);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    fetchConversations();
  }, [user, navigate]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id_conversation);
    }
  }, [selectedConversation]);

  const fetchConversations = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('conversation')
        .select('*')
        .or(`id_utilisateur1.eq.${user.id},id_utilisateur2.eq.${user.id}`)
        .order('derniere_activite', { ascending: false });

      if (error) throw error;
      
      if (data) {
        // Transform conversations into ConversationMessage format for compatibility with components
        const conversationsWithMappedFields = await Promise.all(data.map(async (conv) => {
          // Determine the other user in the conversation
          const otherUserId = conv.id_utilisateur1 === user.id ? conv.id_utilisateur2 : conv.id_utilisateur1;
          
          // Get user details
          const { data: userData, error: userError } = await supabase
            .from('utilisateur')
            .select('id_utilisateur, nom, prenoms, photo_profil')
            .eq('id_utilisateur', otherUserId)
            .single();
            
          if (userError) {
            console.error("Error fetching user details:", userError);
            return null;
          }
          
          return {
            id_message: 0, // Placeholder
            id_conversation: conv.id_conversation,
            id_expediteur: user.id,
            id_destinataire: otherUserId,
            contenu: "", // Will be populated when specific messages are loaded
            date_envoi: conv.derniere_activite,
            lu: false,
            created_at: conv.created_at,
            user: {
              id: userData.id_utilisateur,
              name: `${userData.nom} ${userData.prenoms || ''}`.trim(),
              photo_profil: userData.photo_profil,
              status: "online"
            },
            lastMessage: {
              text: "Conversation",
              timestamp: conv.derniere_activite
            },
            timestamp: conv.derniere_activite,
            unread: 0 // Will be calculated if needed
          } as ConversationMessage;
        }));
        
        setConversations(conversationsWithMappedFields.filter(Boolean) as ConversationMessage[]);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: number) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('message')
        .select('*')
        .eq('id_conversation', conversationId)
        .order('date_envoi', { ascending: true });

      if (error) throw error;
      
      if (data) {
        setMessages(data as ConversationMessage[]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSelectConversation = (conversation: ConversationMessage) => {
    setSelectedConversation(conversation);
    if (isMobile) {
      setShowPanel(false);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (!user || !selectedConversation || !message.trim()) return;
    
    try {
      const recipientId = selectedConversation.user?.id;
      if (!recipientId) {
        throw new Error("Recipient ID not found");
      }

      const { error } = await supabase.from('message').insert({
        id_conversation: selectedConversation.id_conversation,
        id_expediteur: user.id,
        id_destinataire: recipientId,
        contenu: message,
        lu: false
      });

      if (error) throw error;
      
      // Refresh messages
      fetchMessages(selectedConversation.id_conversation);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const togglePanel = () => {
    setShowPanel(!showPanel);
  };

  return (
    <div className="container px-0 sm:px-4 h-[calc(100vh-150px)] flex">
      {isMobile && !showPanel && (
        <Button 
          variant="ghost" 
          className="absolute top-20 left-4 z-10"
          onClick={togglePanel}
        >
          <PanelRight className="h-4 w-4 mr-2" />
          Conversations
        </Button>
      )}
      
      <div className="flex w-full h-full">
        {showPanel && (
          <div className={`${isMobile ? 'w-full' : 'w-1/3 border-r'} h-full`}>
            <ConversationList 
              userId={user?.id || ""}
              conversations={conversations} 
              selectedConversation={selectedConversation}
              onSelectConversation={handleSelectConversation}
            />
          </div>
        )}
        
        {(!isMobile || !showPanel) && (
          <div className={`${isMobile ? 'w-full' : 'w-2/3'} h-full`}>
            <ChatArea 
              userId={user?.id || ""}
              conversation={selectedConversation}
              onBack={() => setShowPanel(true)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
