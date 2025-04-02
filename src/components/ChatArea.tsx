
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { ConversationMessage } from "@/types/message";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeftCircle, Send, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import UserAvatar from "./UserAvatar";

interface ChatAreaProps {
  userId: string;
  conversation: ConversationMessage | null;
  onBack: () => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({ userId, conversation, onBack }) => {
  const [currentMessages, setCurrentMessages] = useState<ConversationMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async (conversationId: number) => {
    try {
      const { data, error } = await supabase
        .from('message')
        .select(`
          *,
          expediteur:utilisateur!id_expediteur(id_utilisateur, nom, prenoms, photo_profil)
        `)
        .eq('id_conversation', conversationId)
        .order('date_envoi', { ascending: true });
        
      if (error) {
        throw error;
      }
      
      if (data) {
        const formattedMessages = data.map(message => ({
          ...message,
          sender: {
            id_utilisateur: message.expediteur?.id_utilisateur || "",
            nom: message.expediteur?.nom || "",
            prenoms: message.expediteur?.prenoms || null,
            photo_profil: message.expediteur?.photo_profil || null
          }
        }));
        
        setCurrentMessages(formattedMessages as ConversationMessage[]);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des messages:', error);
    }
  }, []);

  const markMessagesAsRead = useCallback(async (conversationId: number) => {
    if (!userId) return;
    
    try {
      await supabase
        .from('message')
        .update({ lu: true })
        .eq('id_conversation', conversationId)
        .eq('id_destinataire', userId)
        .eq('lu', false);
    } catch (error) {
      console.error('Erreur lors du marquage des messages comme lus:', error);
    }
  }, [userId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userId || !conversation || !newMessage.trim()) return;
    
    setIsSendingMessage(true);
    
    try {
      const messageToSend = {
        id_conversation: conversation.id_conversation,
        id_expediteur: userId,
        id_destinataire: conversation.user?.id || "",
        contenu: newMessage.trim(),
        date_envoi: new Date().toISOString(),
        lu: false
      };
      
      const { data, error } = await supabase
        .from('message')
        .insert(messageToSend)
        .select();
        
      if (error) throw error;
      
      // Update conversation activity
      await supabase
        .from('conversation')
        .update({ derniere_activite: new Date().toISOString() })
        .eq('id_conversation', conversation.id_conversation);
      
      // Clear input
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const formatMessageDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true,
        locale: fr 
      });
    } catch (error) {
      return dateString;
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom();
  }, [currentMessages]);

  useEffect(() => {
    // Fetch messages when a conversation is selected
    if (conversation) {
      fetchMessages(conversation.id_conversation);
      // Mark messages as read
      markMessagesAsRead(conversation.id_conversation);
      
      // Set up real-time subscription for this conversation
      const channel = supabase
        .channel(`messages-${conversation.id_conversation}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'message',
          filter: `id_conversation=eq.${conversation.id_conversation}`
        }, (payload) => {
          // Fetch fresh message data with sender info
          fetchMessages(conversation.id_conversation);
          
          // Mark as read if user is the recipient
          if (payload.new && payload.new.id_destinataire === userId) {
            markMessagesAsRead(conversation.id_conversation);
          }
        })
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [conversation, fetchMessages, markMessagesAsRead, userId]);

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <MessageCircle className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Vos messages</h3>
          <p className="text-muted-foreground">
            Sélectionnez une conversation ou recherchez<br />
            un utilisateur pour commencer à discuter
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <>
      {/* Chat Header */}
      <div className="flex items-center p-4 border-b border-border">
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden mr-2"
          onClick={onBack}
        >
          <ArrowLeftCircle className="h-5 w-5" />
        </Button>
        <UserAvatar
          src={conversation.user?.photo_profil}
          alt={conversation.user?.name || ""}
          size="sm"
          status={conversation.user?.status || "none"}
        />
        <div className="ml-3">
          <h3 className="font-semibold">{conversation.user?.name}</h3>
        </div>
      </div>
      
      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {currentMessages.map((message, index) => (
            <div 
              key={message.id_message} 
              className={`flex ${message.id_expediteur === userId ? 'justify-end' : 'justify-start'}`}
            >
              <div className="flex max-w-[80%]">
                {message.id_expediteur !== userId && (
                  <UserAvatar
                    src={message.sender?.photo_profil || undefined}
                    alt={message.sender?.nom || ""}
                    size="sm"
                  />
                )}
                <div>
                  <div 
                    className={`rounded-2xl px-4 py-2 inline-block ${
                      message.id_expediteur === userId
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {message.contenu}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatMessageDate(message.date_envoi)}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-border">
        <div className="flex space-x-2">
          <Textarea
            placeholder="Écrivez un message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="min-h-[50px] max-h-[120px] resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (newMessage.trim()) {
                  handleSendMessage(e);
                }
              }
            }}
          />
          <Button type="submit" size="icon" disabled={isSendingMessage || !newMessage.trim()}>
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </form>
    </>
  );
};

export default ChatArea;
