
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Search, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import MessageItem from "./MessageItem";
import { UserProfile } from "@/types/userProfile";
import { ConversationMessage } from "@/types/message";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface ConversationListProps {
  userId: string;
  selectedConversation: ConversationMessage | null;
  onSelectConversation: (conversation: ConversationMessage) => void;
}

const ConversationList: React.FC<ConversationListProps> = ({
  userId,
  selectedConversation,
  onSelectConversation
}) => {
  const [conversations, setConversations] = useState<ConversationMessage[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<ConversationMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  
  const fetchConversations = async () => {
    if (!userId) return;
    
    try {
      // Get all conversations for the current user
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversation')
        .select('id_conversation, id_utilisateur1, id_utilisateur2, derniere_activite')
        .or(`id_utilisateur1.eq.${userId},id_utilisateur2.eq.${userId}`)
        .order('derniere_activite', { ascending: false });
      
      if (conversationsError) {
        console.error("Error fetching conversations:", conversationsError);
        return;
      }
      
      if (!conversationsData || conversationsData.length === 0) {
        setConversations([]);
        setFilteredConversations([]);
        return;
      }
      
      const formattedConversations: ConversationMessage[] = [];
      
      for (const conv of conversationsData) {
        // Determine the other user in the conversation
        const otherUserId = conv.id_utilisateur1 === userId ? conv.id_utilisateur2 : conv.id_utilisateur1;
        
        // Get user details
        const { data: userData, error: userError } = await supabase
          .from('utilisateur')
          .select('id_utilisateur, nom, prenoms, photo_profil')
          .eq('id_utilisateur', otherUserId)
          .single();
        
        if (userError) {
          console.error("Error fetching user details:", userError);
          continue;
        }
        
        // Get last message in the conversation
        const { data: lastMessageData, error: lastMessageError } = await supabase
          .from('message')
          .select('*')
          .eq('id_conversation', conv.id_conversation)
          .order('date_envoi', { ascending: false })
          .limit(1);
        
        if (lastMessageError) {
          console.error("Error fetching last message:", lastMessageError);
          continue;
        }
        
        // Count unread messages
        const { count: unreadCount, error: unreadError } = await supabase
          .from('message')
          .select('*', { count: 'exact', head: true })
          .eq('id_conversation', conv.id_conversation)
          .eq('id_destinataire', userId)
          .eq('lu', false);
        
        if (unreadError) {
          console.error("Error counting unread messages:", unreadError);
        }

        const lastMessage = lastMessageData && lastMessageData.length > 0 ? lastMessageData[0] : null;
        
        formattedConversations.push({
          id_message: lastMessage?.id_message || 0,
          id_conversation: conv.id_conversation,
          id_expediteur: lastMessage?.id_expediteur || "",
          id_destinataire: lastMessage?.id_destinataire || "",
          contenu: lastMessage?.contenu || "",
          date_envoi: lastMessage?.date_envoi || conv.derniere_activite,
          lu: lastMessage?.lu || false,
          user: {
            id: userData.id_utilisateur,
            name: `${userData.nom} ${userData.prenoms || ''}`.trim(),
            photo_profil: userData.photo_profil,
            status: "online" // Default status
          },
          lastMessage: {
            text: lastMessage?.contenu || "Nouvelle conversation",
            timestamp: lastMessage?.date_envoi || conv.derniere_activite
          },
          timestamp: lastMessage?.date_envoi || conv.derniere_activite,
          unread: unreadCount || 0
        });
      }
      
      setConversations(formattedConversations);
      setFilteredConversations(formattedConversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };
  
  const handleUserSearch = async () => {
    if (!userSearchQuery) return;
    
    try {
      const { data, error } = await supabase
        .from('utilisateur')
        .select('id_utilisateur, nom, prenoms, photo_profil')
        .or(`nom.ilike.%${userSearchQuery}%,prenoms.ilike.%${userSearchQuery}%`)
        .neq('id_utilisateur', userId);
      
      if (error) throw error;
      
      const typedData = data as UserProfile[];
      setSearchResults(typedData || []);
    } catch (error) {
      console.error("Error searching for users:", error);
    }
  };
  
  const startConversation = async (selectedUser: UserProfile) => {
    setIsSearchingUser(false);
    
    try {
      // Check if conversation already exists
      const { data: existingConversation, error: checkError } = await supabase
        .from('conversation')
        .select('*')
        .or(`and(id_utilisateur1.eq.${userId},id_utilisateur2.eq.${selectedUser.id_utilisateur}),and(id_utilisateur1.eq.${selectedUser.id_utilisateur},id_utilisateur2.eq.${userId})`)
        .maybeSingle();
      
      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }
      
      let conversationId;
      
      if (existingConversation) {
        conversationId = existingConversation.id_conversation;
      } else {
        // Create new conversation
        const { data: newConversation, error: createError } = await supabase
          .from('conversation')
          .insert({
            id_utilisateur1: userId,
            id_utilisateur2: selectedUser.id_utilisateur,
            derniere_activite: new Date().toISOString()
          })
          .select()
          .single();
        
        if (createError) throw createError;
        
        conversationId = newConversation.id_conversation;
      }
      
      // Format the conversation and set as selected
      const newSelectedConversation: ConversationMessage = {
        id_message: 0,
        id_conversation: conversationId,
        id_expediteur: userId,
        id_destinataire: selectedUser.id_utilisateur,
        contenu: "",
        date_envoi: new Date().toISOString(),
        lu: false,
        user: {
          id: selectedUser.id_utilisateur,
          name: `${selectedUser.nom} ${selectedUser.prenoms || ''}`.trim(),
          photo_profil: selectedUser.photo_profil,
          status: "online"
        }
      };
      
      onSelectConversation(newSelectedConversation);
      
      // Refresh conversation list
      fetchConversations();
    } catch (error) {
      console.error("Error starting conversation:", error);
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
  
  useEffect(() => {
    if (userId) {
      fetchConversations();
      
      // Setup real-time subscription for new messages
      const channel = supabase
        .channel('conversation-updates')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'message',
          filter: `id_destinataire=eq.${userId}`
        }, () => {
          fetchConversations();
        })
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [userId]);
  
  useEffect(() => {
    if (searchQuery) {
      const filtered = conversations.filter(conversation => 
        conversation.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (conversation.lastMessage?.text && 
         conversation.lastMessage.text.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredConversations(filtered);
    } else {
      setFilteredConversations(conversations);
    }
  }, [searchQuery, conversations]);
  
  // Use memoization to avoid unnecessary re-renders
  const conversationItems = useMemo(() => {
    return filteredConversations.map((conversation) => (
      <div 
        key={conversation.id_conversation}
        onClick={() => onSelectConversation(conversation)}
        className={`cursor-pointer ${selectedConversation?.id_conversation === conversation.id_conversation ? 'bg-muted' : ''}`}
      >
        <MessageItem
          id={conversation.id_conversation.toString()}
          user={{
            name: conversation.user?.name || "",
            avatar: conversation.user?.photo_profil,
            status: conversation.user?.status || "none"
          }}
          lastMessage={conversation.lastMessage?.text || ""}
          timestamp={formatMessageDate(conversation.timestamp || "")}
          unread={conversation.unread || 0}
        />
      </div>
    ));
  }, [filteredConversations, selectedConversation, onSelectConversation]);
  
  return (
    <div className="flex flex-col w-full h-full border-r border-border bg-background">
      <div className="p-4 border-b border-border">
        <h1 className="text-xl font-bold mb-4">Messages</h1>
        
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher dans les messages..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsSearchingUser(!isSearchingUser)}
          >
            <Users className="h-5 w-5" />
          </Button>
        </div>
        
        {isSearchingUser ? (
          <div className="mt-4 space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Rechercher un utilisateur..."
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleUserSearch}>
                <Search className="h-4 w-4 mr-2" />
                Rechercher
              </Button>
            </div>
            
            <ScrollArea className="h-[400px] rounded-md border p-4">
              {searchResults.length > 0 ? (
                searchResults.map((result) => (
                  <div 
                    key={result.id_utilisateur} 
                    className="flex items-center p-2 hover:bg-muted rounded-md cursor-pointer mb-2"
                    onClick={() => startConversation(result)}
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden mr-3">
                      {result.photo_profil && (
                        <img 
                          src={result.photo_profil} 
                          alt={result.nom} 
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">
                        {result.nom} {result.prenoms || ''}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  {userSearchQuery ? "Aucun utilisateur trouvé" : "Recherchez un utilisateur pour démarrer une conversation"}
                </div>
              )}
            </ScrollArea>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-220px)] mt-4">
            <div className="space-y-1">
              {filteredConversations.length > 0 ? (
                conversationItems
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery 
                    ? "Aucun message ne correspond à votre recherche" 
                    : "Aucune conversation. Commencez à discuter !"}
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
};

export default ConversationList;
