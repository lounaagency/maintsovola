
import React, { useState, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import MessageItem from "@/components/MessageItem";
import MessageDialog from "@/components/MessageDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, Users, Send, ArrowLeftCircle } from "lucide-react";
import { ConversationMessage, Message } from "@/types/message";
import { UserProfile } from "@/types/userProfile";
import { useToast } from "@/components/ui/use-toast";
import UserAvatar from "@/components/UserAvatar";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const Messages: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<ConversationMessage[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<ConversationMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationMessage | null>(null);
  const [currentMessages, setCurrentMessages] = useState<ConversationMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);
  
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

  useEffect(() => {
    // Fetch messages when a conversation is selected
    if (selectedConversation) {
      fetchMessages(selectedConversation.id_conversation);
      // Mark messages as read
      markMessagesAsRead(selectedConversation.id_conversation);
    }
  }, [selectedConversation]);

  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom();
  }, [currentMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  const fetchConversations = async () => {
    if (!user) return;
    
    try {
      // Get all conversations for the current user
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversation')
        .select('id_conversation, id_utilisateur1, id_utilisateur2, derniere_activite')
        .or(`id_utilisateur1.eq.${user.id},id_utilisateur2.eq.${user.id}`)
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
        const otherUserId = conv.id_utilisateur1 === user.id ? conv.id_utilisateur2 : conv.id_utilisateur1;
        
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
          .eq('id_destinataire', user.id)
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
      toast({
        title: "Erreur",
        description: "Impossible de charger les conversations",
        variant: "destructive"
      });
    }
  };

  const fetchMessages = async (conversationId: number) => {
    try {
      const { data, error } = await supabase
        .from('message')
        .select(`
          *,
          expediteur:id_expediteur(id_utilisateur, nom, prenoms, photo_profil),
          destinataire:id_destinataire(id_utilisateur, nom, prenoms, photo_profil)
        `)
        .eq('id_conversation', conversationId)
        .order('date_envoi', { ascending: true });
        
      if (error) {
        throw error;
      }
      
      if (data) {
        const formattedMessages: ConversationMessage[] = data.map(message => ({
          ...message,
          sender: message.expediteur
        }));
        
        setCurrentMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des messages:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les messages",
        variant: "destructive"
      });
    }
  };
  
  const handleUserSearch = async () => {
    if (!userSearchQuery) return;
    
    try {
      const { data, error } = await supabase
        .from('utilisateur')
        .select('id_utilisateur, nom, prenoms, photo_profil')
        .or(`nom.ilike.%${userSearchQuery}%,prenoms.ilike.%${userSearchQuery}%`)
        .neq('id_utilisateur', user?.id);
      
      if (error) throw error;
      
      const typedData = data as UserProfile[];
      setSearchResults(typedData || []);
    } catch (error) {
      console.error("Error searching for users:", error);
      toast({
        title: "Erreur",
        description: "Impossible de rechercher des utilisateurs",
        variant: "destructive"
      });
    }
  };

  const startConversation = async (selectedUser: UserProfile) => {
    setIsSearchingUser(false);
    
    try {
      // Check if conversation already exists
      const { data: existingConversation, error: checkError } = await supabase
        .from('conversation')
        .select('*')
        .or(`and(id_utilisateur1.eq.${user?.id},id_utilisateur2.eq.${selectedUser.id_utilisateur}),and(id_utilisateur1.eq.${selectedUser.id_utilisateur},id_utilisateur2.eq.${user?.id})`)
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
            id_utilisateur1: user?.id,
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
        id_expediteur: user?.id || "",
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
      
      setSelectedConversation(newSelectedConversation);
      
      // Refresh conversation list
      fetchConversations();
    } catch (error) {
      console.error("Error starting conversation:", error);
      toast({
        title: "Erreur",
        description: "Impossible de démarrer la conversation",
        variant: "destructive"
      });
    }
  };

  const markMessagesAsRead = async (conversationId: number) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('message')
        .update({ lu: true })
        .eq('id_conversation', conversationId)
        .eq('id_destinataire', user.id)
        .eq('lu', false);
        
      if (error) throw error;
      
      // Update local unread count
      if (selectedConversation) {
        setSelectedConversation({
          ...selectedConversation,
          unread: 0
        });
      }
      
      // Update conversations list
      setConversations(prevConversations => 
        prevConversations.map(conv => 
          conv.id_conversation === conversationId 
            ? {...conv, unread: 0} 
            : conv
        )
      );
      
      setFilteredConversations(prevConversations => 
        prevConversations.map(conv => 
          conv.id_conversation === conversationId 
            ? {...conv, unread: 0} 
            : conv
        )
      );
    } catch (error) {
      console.error('Erreur lors du marquage des messages comme lus:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !selectedConversation || !newMessage.trim()) return;
    
    setIsSendingMessage(true);
    
    try {
      const messageToSend = {
        id_conversation: selectedConversation.id_conversation,
        id_expediteur: user.id,
        id_destinataire: selectedConversation.user?.id || "",
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
        .eq('id_conversation', selectedConversation.id_conversation);
      
      // Add message to current messages
      if (data && data.length > 0) {
        const newSentMessage = {
          ...data[0],
          sender: {
            id_utilisateur: user.id,
            nom: user.name || "",
            prenoms: null,
            photo_profil: user.photo_profil || null
          }
        };
        
        setCurrentMessages([...currentMessages, newSentMessage]);
      }
      
      // Clear input
      setNewMessage("");
      
      // Refresh conversations
      fetchConversations();
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive"
      });
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
  
  return (
    <div className="container mx-auto max-w-6xl px-4 py-6">
      <div className="flex h-[calc(100vh-150px)] rounded-lg border border-border overflow-hidden">
        {/* Conversations Sidebar */}
        <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-1/3 border-r border-border bg-background`}>
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
                    filteredConversations.map((conversation) => (
                      <div 
                        key={conversation.id_conversation}
                        onClick={() => setSelectedConversation(conversation)}
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
                    ))
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
        
        {/* Chat Area */}
        <div className={`${selectedConversation ? 'flex' : 'hidden md:flex'} flex-col w-full md:w-2/3 bg-background`}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center p-4 border-b border-border">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="md:hidden mr-2"
                  onClick={() => setSelectedConversation(null)}
                >
                  <ArrowLeftCircle className="h-5 w-5" />
                </Button>
                <UserAvatar
                  src={selectedConversation.user?.photo_profil}
                  alt={selectedConversation.user?.name || ""}
                  size="sm"
                  status={selectedConversation.user?.status || "none"}
                />
                <div className="ml-3">
                  <h3 className="font-semibold">{selectedConversation.user?.name}</h3>
                </div>
              </div>
              
              {/* Chat Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {currentMessages.map((message, index) => (
                    <div 
                      key={message.id_message} 
                      className={`flex ${message.id_expediteur === user?.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className="flex max-w-[80%]">
                        {message.id_expediteur !== user?.id && (
                          <UserAvatar
                            src={message.sender?.photo_profil || undefined}
                            alt={message.sender?.nom || ""}
                            size="xs"
                            className="mr-2 mt-1 flex-shrink-0"
                          />
                        )}
                        <div>
                          <div 
                            className={`rounded-2xl px-4 py-2 inline-block ${
                              message.id_expediteur === user?.id
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
                        handleSendMessage(e);
                      }
                    }}
                  />
                  <Button type="submit" size="icon" disabled={isSendingMessage || !newMessage.trim()}>
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-8">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <MessageItem.Icon className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Vos messages</h3>
                <p className="text-muted-foreground">
                  Sélectionnez une conversation ou recherchez<br />
                  un utilisateur pour commencer à discuter
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
