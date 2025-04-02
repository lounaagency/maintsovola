
import React, { useState, useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import MessageItem from "@/components/MessageItem";
import MessageDialog from "@/components/MessageDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, Users, MessageCircle, Send, Smile } from "lucide-react";
import { ConversationMessage } from "@/types/message";
import { UserProfile } from "@/types/userProfile";
import { toast } from "sonner";
import UserAvatar from "@/components/UserAvatar";

const Messages: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<ConversationMessage[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<UserProfile | null>(null);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [conversationMessages, setConversationMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  useEffect(() => {
    if (user) {
      fetchConversations();

      // Set up real-time subscription
      const channel = supabase
        .channel('messages-changes')
        .on('postgres_changes', 
          {
            event: 'INSERT',
            schema: 'public',
            table: 'message',
            filter: `id_destinataire=eq.${user.id}`
          }, 
          (payload) => {
            console.log('New message received:', payload);
            // Refetch conversations to update last message and unread count
            fetchConversations();
            
            // If conversation is active, also update its messages
            if (activeConversation && payload.new.id_conversation === parseInt(activeConversation)) {
              openConversation({ id: activeConversation } as ConversationMessage);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, activeConversation]);
  
  useEffect(() => {
    if (searchQuery) {
      const filtered = messages.filter(message => 
        message.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (message.lastMessage && typeof message.lastMessage === 'string' && message.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredMessages(filtered);
    } else {
      setFilteredMessages(messages);
    }
  }, [searchQuery, messages]);
  
  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationMessages]);
  
  const fetchConversations = async () => {
    if (!user) return;
    
    try {
      // First get all conversations for the current user
      const { data: conversationsData, error: conversationsError } = await supabase
        .from('conversation')
        .select('id_conversation, id_utilisateur1, id_utilisateur2, derniere_activite')
        .or(`id_utilisateur1.eq.${user.id},id_utilisateur2.eq.${user.id}`);
      
      if (conversationsError) {
        console.error("Error fetching conversations:", conversationsError);
        return;
      }
      
      if (!conversationsData || conversationsData.length === 0) {
        setMessages([]);
        return;
      }
      
      // Get user details for conversation participants
      const conversationIds = conversationsData.map(conv => conv.id_conversation);
      const formattedMessages: ConversationMessage[] = [];
      
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
          .limit(1)
          .single();
        
        if (lastMessageError && lastMessageError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
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
        
        formattedMessages.push({
          id_message: 0,
          id_conversation: conv.id_conversation,
          id_expediteur: "",
          id_destinataire: "",
          contenu: "",
          date_envoi: "",
          lu: false,
          id: conv.id_conversation.toString(),
          user: {
            id: userData.id_utilisateur,
            name: `${userData.nom} ${userData.prenoms || ''}`.trim(),
            photo_profil: userData.photo_profil,
            status: "online" // Default status
          },
          lastMessage: lastMessageData?.contenu || "Nouvelle conversation",
          timestamp: lastMessageData?.date_envoi || conv.derniere_activite,
          unread: unreadCount || 0
        });
      }
      
      setMessages(formattedMessages);
      setFilteredMessages(formattedMessages);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast.error("Impossible de charger les conversations");
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
      toast.error("Impossible de rechercher des utilisateurs");
    }
  };
  
  const startConversation = (selectedUser: UserProfile) => {
    setSelectedUser({
      ...selectedUser,
      id: selectedUser.id_utilisateur,
      name: `${selectedUser.nom} ${selectedUser.prenoms || ''}`.trim()
    });
    setIsSearchingUser(false);
    setIsDialogOpen(true);
  };
  
  const openConversation = async (conversation: ConversationMessage) => {
    if (!conversation.id) return;
    
    setActiveConversation(conversation.id);
    
    try {
      // First get conversation details to ensure it exists
      const { data: convData, error: convError } = await supabase
        .from('conversation')
        .select('*')
        .eq('id_conversation', parseInt(conversation.id))
        .single();
        
      if (convError) throw convError;
      
      // Then get messages
      const { data, error } = await supabase
        .from('message')
        .select(`
          id_message,
          id_expediteur,
          id_destinataire,
          contenu,
          date_envoi,
          lu,
          sender:id_expediteur(id_utilisateur, nom, prenoms, photo_profil)
        `)
        .eq('id_conversation', parseInt(conversation.id))
        .order('date_envoi', { ascending: true });
      
      if (error) throw error;
      
      setConversationMessages(data || []);
      
      // Mark messages as read
      await supabase
        .from('message')
        .update({ lu: true })
        .eq('id_conversation', parseInt(conversation.id))
        .eq('id_destinataire', user.id)
        .eq('lu', false);
      
      // Refresh conversations to update unread count
      fetchConversations();
    } catch (error) {
      console.error("Error opening conversation:", error);
      toast.error("Impossible de charger les messages");
    }
  };
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!activeConversation || !newMessage.trim()) return;
    
    try {
      const recipientId = messages.find(m => m.id === activeConversation)?.user?.id;
      if (!recipientId) throw new Error("Destinataire introuvable");
      
      // Send message
      const { error } = await supabase.from("message").insert({
        id_conversation: parseInt(activeConversation),
        id_expediteur: user.id,
        id_destinataire: recipientId,
        contenu: newMessage.trim(),
        date_envoi: new Date().toISOString(),
      });
      
      if (error) throw error;
      
      // Update conversation activity
      await supabase
        .from('conversation')
        .update({ derniere_activite: new Date().toISOString() })
        .eq('id_conversation', parseInt(activeConversation));
      
      // Clear input and refresh messages
      setNewMessage('');
      openConversation({ id: activeConversation } as ConversationMessage);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Impossible d'envoyer le message");
    }
  };
  
  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  const onMessageSent = () => {
    fetchConversations();
    if (activeConversation) {
      openConversation({ id: activeConversation } as ConversationMessage);
    }
  };
  
  return (
    <div className="flex h-screen pt-16 overflow-hidden bg-gray-50">
      {/* Left sidebar - Conversations list */}
      <div className="w-full md:w-1/3 bg-white border-r flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h1 className="text-xl font-bold">Messages</h1>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsSearchingUser(!isSearchingUser)}
            className="hover:bg-gray-100"
          >
            <Users className="h-5 w-5" />
          </Button>
        </div>
        
        {isSearchingUser ? (
          <div className="p-4 space-y-4">
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
            
            <ScrollArea className="h-[calc(100vh-180px)] pr-4">
              {searchResults.length > 0 ? (
                searchResults.map((result) => (
                  <div 
                    key={result.id_utilisateur} 
                    className="flex items-center p-3 hover:bg-gray-100 rounded-md cursor-pointer mb-2 transition-colors"
                    onClick={() => startConversation(result)}
                  >
                    <UserAvatar
                      src={result.photo_profil || undefined}
                      alt={result.nom}
                      size="md"
                      className="mr-3"
                    />
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
          <>
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher dans les messages..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <ScrollArea className="flex-1">
              {filteredMessages.length > 0 ? (
                filteredMessages.map((message) => (
                  <div 
                    key={message.id}
                    onClick={() => openConversation(message)}
                    className={`cursor-pointer transition-colors ${activeConversation === message.id ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                  >
                    <MessageItem
                      id={message.id || ""}
                      user={{
                        name: message.user?.name || "",
                        photo_profil: message.user?.photo_profil,
                        status: message.user?.status || "none"
                      }}
                      lastMessage={message.lastMessage || ""}
                      timestamp={new Date(message.timestamp || "").toLocaleDateString()}
                      unread={message.unread || 0}
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
            </ScrollArea>
          </>
        )}
      </div>
      
      {/* Right side - Active conversation */}
      <div className="hidden md:flex w-2/3 flex-col bg-white">
        {activeConversation ? (
          <>
            {/* Conversation header */}
            <div className="p-4 border-b flex items-center shadow-sm">
              <UserAvatar
                src={messages.find(m => m.id === activeConversation)?.user?.photo_profil || undefined}
                alt={messages.find(m => m.id === activeConversation)?.user?.name || "User"}
                size="md"
                status="online"
                className="mr-3"
              />
              <div>
                <h2 className="font-semibold">
                  {messages.find(m => m.id === activeConversation)?.user?.name}
                </h2>
                <div className="text-xs text-green-500">
                  En ligne
                </div>
              </div>
            </div>
            
            {/* Messages */}
            <ScrollArea className="flex-1 p-4 bg-gray-50">
              <div className="space-y-4">
                {conversationMessages.map(msg => (
                  <div key={msg.id_message} className={`flex ${msg.id_expediteur === user?.id ? 'justify-end' : 'justify-start'}`}>
                    {msg.id_expediteur !== user?.id && (
                      <UserAvatar
                        src={msg.sender?.photo_profil || undefined}
                        alt={msg.sender?.nom || "User"}
                        size="sm"
                        className="mr-2 self-end mb-1"
                      />
                    )}
                    <div 
                      className={`max-w-[70%] p-3 rounded-lg ${
                        msg.id_expediteur === user?.id 
                          ? 'bg-blue-500 text-white rounded-br-none' 
                          : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
                      }`}
                    >
                      <p className="break-words">{msg.contenu}</p>
                      <div className={`text-xs mt-1 text-right ${msg.id_expediteur === user?.id ? 'text-blue-100' : 'text-gray-500'}`}>
                        {formatMessageTime(msg.date_envoi)}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            
            {/* Message input */}
            <div className="p-3 border-t bg-white">
              <form 
                className="flex items-center"
                onSubmit={handleSendMessage}
              >
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="text-gray-500"
                  aria-label="Add emoji"
                >
                  <Smile className="h-5 w-5" />
                </Button>
                
                <Input 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Écrivez un message..." 
                  className="flex-1 mx-2 bg-gray-100"
                />
                
                <Button 
                  type="submit"
                  disabled={!newMessage.trim()}
                  size="icon"
                  className={!newMessage.trim() ? "text-gray-400" : ""}
                >
                  <Send className="h-5 w-5" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-gray-50">
            <div className="bg-white p-8 rounded-lg shadow-sm flex flex-col items-center max-w-md text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <MessageCircle className="h-8 w-8 text-blue-500" strokeWidth={1.5} />
              </div>
              <h2 className="text-xl font-semibold mb-2 text-gray-800">Vos messages</h2>
              <p className="text-gray-600">
                Sélectionnez une conversation ou démarrez-en une nouvelle en recherchant un utilisateur.
              </p>
              <Button 
                onClick={() => setIsSearchingUser(true)}
                className="mt-6"
                variant="outline"
              >
                <Users className="h-4 w-4 mr-2" />
                Nouvelle conversation
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* Mobile view - Show placeholder when no conversation is selected */}
      {!activeConversation && (
        <div className="md:hidden flex flex-col items-center justify-center flex-1 p-6 text-center text-gray-500 bg-gray-50">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <MessageCircle className="h-8 w-8 text-blue-500" strokeWidth={1.5} />
          </div>
          <h2 className="text-lg font-semibold mb-2">Bienvenue dans vos messages</h2>
          <p className="text-sm text-gray-600 mb-4">
            Sélectionnez une conversation pour commencer à discuter
          </p>
          <Button
            onClick={() => setIsSearchingUser(true)}
            variant="outline"
            size="sm"
          >
            <Users className="h-4 w-4 mr-2" />
            Nouvelle conversation
          </Button>
        </div>
      )}
      
      {isDialogOpen && selectedUser && (
        <MessageDialog
          isOpen={isDialogOpen}
          onClose={() => {
            setIsDialogOpen(false);
            setSelectedUser(null);
            fetchConversations();
          }}
          recipient={{
            id: selectedUser.id || selectedUser.id_utilisateur,
            name: selectedUser.name || `${selectedUser.nom} ${selectedUser.prenoms || ''}`.trim()
          }}
        />
      )}
    </div>
  );
};

export default Messages;
