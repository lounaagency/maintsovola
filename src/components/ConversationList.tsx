import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Search, Users, UserPlus, MessageCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import MessageItem from "./MessageItem";
import UserAvatar from "./UserAvatar";
import { UserProfile } from "@/types/userProfile";
import { ConversationMessage } from "@/types/message";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { markMessagesAsRead } from '@/lib/messagerie';
import { useUnreadMessagesCount } from '@/hooks/use-unread-messages';
import { useRealtimeChannels } from '@/hooks/useRealtimeChannels';

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
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  
  const { fetchUnreadCount } = useUnreadMessagesCount(userId);

  const fetchConversations = useCallback(async () => {
    if (!userId) return;
    
    setIsLoadingConversations(true);
    try {
      // Get all conversations for the current user
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversation')
        .select('id_conversation, id_utilisateur1, id_utilisateur2, derniere_activite')
        .or(`id_utilisateur1.eq.${userId},id_utilisateur2.eq.${userId}`)
        .order('derniere_activite', { ascending: false });

      if (conversationsError) {
        console.error("Error fetching conversations:", conversationsError);
        setIsLoadingConversations(false);
        return;
      }

      if (!conversationsData || conversationsData.length === 0) {
        setConversations([]);
        setFilteredConversations([]);
        setIsLoadingConversations(false);
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
    } finally {
      setIsLoadingConversations(false);
    }
  }, [userId]);

  const handleUserSearch = async () => {
    if (!userSearchQuery) return;
    try {
      const {
        data,
        error
      } = await supabase.from('utilisateur').select('id_utilisateur, nom, prenoms, photo_profil').or(`nom.ilike.%${userSearchQuery}%,prenoms.ilike.%${userSearchQuery}%`).neq('id_utilisateur', userId);
      if (error) throw error;
      const typedData = data as UserProfile[];
      setSearchResults(typedData || []);
    } catch (error) {
      console.error("Error searching for users:", error);
    }
  };

  const handleSelectConversation = useCallback(async (conversation: ConversationMessage) => {
    // If there are unread messages in this conversation, mark them as read
    if (conversation.unread && conversation.unread > 0) {
      try {
        // Mark messages as read server-side
        await markMessagesAsRead(conversation.id_conversation, userId);

        // Update the conversation in the local state
        setConversations(prev => prev.map(conv => 
          conv.id_conversation === conversation.id_conversation 
            ? { ...conv, unread: 0 }
            : conv
        ));

        // Update filtered conversations too
        setFilteredConversations(prev => prev.map(conv => 
          conv.id_conversation === conversation.id_conversation 
            ? { ...conv, unread: 0 }
            : conv
        ));

        // Update global unread count
        fetchUnreadCount();
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    }

    // Select the conversation
    onSelectConversation(conversation);
  }, [userId, onSelectConversation, fetchUnreadCount]);

  const startConversation = async (selectedUser: UserProfile) => {
    setIsSearchingUser(false);
    try {
      // Check if conversation already exists
      const {
        data: existingConversation,
        error: checkError
      } = await supabase.from('conversation').select('*').or(`and(id_utilisateur1.eq.${userId},id_utilisateur2.eq.${selectedUser.id_utilisateur}),and(id_utilisateur1.eq.${selectedUser.id_utilisateur},id_utilisateur2.eq.${userId})`).maybeSingle();
      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }
      let conversationId;
      if (existingConversation) {
        conversationId = existingConversation.id_conversation;
      } else {
        // Create new conversation
        const {
          data: newConversation,
          error: createError
        } = await supabase.from('conversation').insert({
          id_utilisateur1: userId,
          id_utilisateur2: selectedUser.id_utilisateur,
          derniere_activite: new Date().toISOString()
        }).select().single();
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
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: fr });
    } catch (error) {
      return dateString;
    }
  };

  // Stable callback for fetchConversations
  const stableFetchConversations = useCallback(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Configure realtime channels for conversations - stable callbacks
  const channelConfigs = useMemo(() => [
    {
      table: 'message',
      event: '*',
      filter: `id_destinataire=eq.${userId}`,
      callback: stableFetchConversations
    },
    {
      table: 'conversation',
      event: '*',
      filter: `id_utilisateur1=eq.${userId}`,
      callback: stableFetchConversations
    },
    {
      table: 'conversation',
      event: '*',
      filter: `id_utilisateur2=eq.${userId}`,
      callback: stableFetchConversations
    }
  ], [userId, stableFetchConversations]);

  // Use the centralized realtime hook
  useRealtimeChannels({
    userId,
    channelType: 'conversations',
    configs: channelConfigs
  });

  // Initial fetch of conversations
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = conversations.filter(conversation => 
        conversation.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (conversation.lastMessage?.text && conversation.lastMessage.text.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredConversations(filtered);
    } else {
      setFilteredConversations(conversations);
    }
  }, [searchQuery, conversations]);

  const conversationItems = useMemo(() => {
    return filteredConversations.map(conversation => (
      <div 
        key={conversation.id_conversation} 
        onClick={() => handleSelectConversation(conversation)}
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
  }, [filteredConversations, selectedConversation, handleSelectConversation]);

  return (
    <div className="h-full flex flex-col messenger-sidebar">
      {/* Header with Search */}
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">Messages</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSearchingUser(!isSearchingUser)}
                  className={`rounded-full h-9 w-9 p-0 ${isSearchingUser ? 'bg-[hsl(var(--messenger-blue))] text-white' : 'hover:bg-muted'}`}
                >
                  <UserPlus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Nouvelle conversation</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Rechercher dans Messenger"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background border-border rounded-full h-10 focus:border-[hsl(var(--messenger-blue))] focus:ring-[hsl(var(--messenger-blue))]"
          />
        </div>
      </div>
        
      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {isSearchingUser ? (
          // User Search Results
          <div className="p-2">
            <div className="px-4 py-2">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Contacts suggérés</h3>
            </div>
            <div className="flex gap-2 px-4 pb-4">
              <Input 
                placeholder="Rechercher un utilisateur..." 
                value={userSearchQuery} 
                onChange={(e) => setUserSearchQuery(e.target.value)} 
                className="flex-1 rounded-full h-9" 
              />
              <Button onClick={handleUserSearch} size="sm" className="rounded-full">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <div>
              {searchResults.map((user) => (
                <div
                  key={user.id_utilisateur}
                  onClick={() => startConversation(user)}
                  className="flex items-center p-4 cursor-pointer messenger-sidebar-hover transition-colors"
                >
                  <div className="relative">
                    <UserAvatar 
                      src={user.photo_profil} 
                      alt={`${user.nom} ${user.prenoms || ''}`}
                      className="w-12 h-12"
                    />
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-sm text-foreground">
                      {user.nom} {user.prenoms || ''}
                    </p>
                    <p className="text-xs text-muted-foreground">Commencer une conversation</p>
                  </div>
                </div>
              ))}
              {userSearchQuery && searchResults.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">Aucun utilisateur trouvé</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Conversations List
          <div>
            {isLoadingConversations ? (
              <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                <div className="animate-spin w-8 h-8 border-2 border-[hsl(var(--messenger-blue))] border-t-transparent rounded-full mb-4"></div>
                <p className="text-muted-foreground text-sm">Chargement des conversations...</p>
              </div>
            ) : conversationItems.length > 0 ? (
              conversationItems
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                <div className="w-16 h-16 rounded-full bg-[hsl(var(--messenger-blue))]/10 flex items-center justify-center mb-4">
                  <MessageCircle className="h-8 w-8 text-[hsl(var(--messenger-blue))]" />
                </div>
                <p className="text-foreground text-lg font-semibold mb-2">Pas encore de conversations</p>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Envoyez un message à vos contacts et <br />
                  commencez une conversation
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationList;
