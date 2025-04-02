import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import MessageItem from "@/components/MessageItem";
import MessageDialog from "@/components/MessageDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, Users, MessageCircle } from "lucide-react";
import { ConversationMessage } from "@/types/message";
import { UserProfile } from "@/types/userProfile";
import { useToast } from "@/components/ui/use-toast";

const Messages: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
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
      const filtered = messages.filter(message => 
        message.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (typeof message.lastMessage === 'string' && message.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredMessages(filtered);
    } else {
      setFilteredMessages(messages);
    }
  }, [searchQuery, messages]);
  
  const fetchConversations = async () => {
    if (!user) return;
    
    try {
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
      
      const conversationIds = conversationsData.map(conv => conv.id_conversation);
      const formattedMessages: ConversationMessage[] = [];
      
      for (const conv of conversationsData) {
        const otherUserId = conv.id_utilisateur1 === user.id ? conv.id_utilisateur2 : conv.id_utilisateur1;
        
        const { data: userData, error: userError } = await supabase
          .from('utilisateur')
          .select('id_utilisateur, nom, prenoms, photo_profil')
          .eq('id_utilisateur', otherUserId)
          .single();
        
        if (userError) {
          console.error("Error fetching user details:", userError);
          continue;
        }
        
        const { data: lastMessageData, error: lastMessageError } = await supabase
          .from('message')
          .select('*')
          .eq('id_conversation', conv.id_conversation)
          .order('date_envoi', { ascending: false })
          .limit(1)
          .single();
        
        if (lastMessageError && lastMessageError.code !== 'PGRST116') {
          console.error("Error fetching last message:", lastMessageError);
          continue;
        }
        
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
          id: conv.id_conversation.toString(),
          id_conversation: conv.id_conversation,
          id_expediteur: "",
          id_destinataire: "",
          contenu: "",
          date_envoi: "",
          lu: false,
          user: {
            id: userData.id_utilisateur,
            name: `${userData.nom} ${userData.prenoms || ''}`.trim(),
            photo_profil: userData.photo_profil,
            status: "online"
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
      toast({
        title: "Erreur",
        description: "Impossible de charger les conversations",
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
  
  const startConversation = (selectedUser: UserProfile) => {
    setSelectedUser({
      ...selectedUser,
      id_utilisateur: selectedUser.id_utilisateur,
      name: `${selectedUser.nom} ${selectedUser.prenoms || ''}`.trim()
    });
    setIsSearchingUser(false);
    setIsDialogOpen(true);
  };
  
  const openConversation = async (conversation: ConversationMessage) => {
    if (!conversation.id) return;
    
    setActiveConversation(conversation.id);
    
    try {
      const { data, error } = await supabase
        .from('message')
        .select(`
          id_message,
          id_expediteur,
          id_destinataire,
          contenu,
          date_envoi,
          lu
        `)
        .eq('id_conversation', parseInt(conversation.id))
        .order('date_envoi', { ascending: true });
      
      if (error) throw error;
      
      setConversationMessages(data || []);
      
      await supabase
        .from('message')
        .update({ lu: true })
        .eq('id_conversation', parseInt(conversation.id))
        .eq('id_destinataire', user.id)
        .eq('lu', false);
      
      fetchConversations();
    } catch (error) {
      console.error("Error opening conversation:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les messages",
        variant: "destructive"
      });
    }
  };
  
  const onMessageSent = () => {
    fetchConversations();
    if (activeConversation) {
      openConversation({ id: activeConversation } as ConversationMessage);
    }
  };
  
  return (
    <div className="flex h-screen overflow-hidden">
      <div className="w-1/3 border-r flex flex-col">
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
            
            <ScrollArea className="flex-1 h-[calc(100vh-120px)]">
              {filteredMessages.length > 0 ? (
                filteredMessages.map((message) => (
                  <div 
                    key={message.id}
                    onClick={() => openConversation(message)}
                    className={`cursor-pointer ${activeConversation === message.id ? 'bg-gray-100' : ''}`}
                  >
                    <MessageItem
                      id={message.id}
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
      
      <div className="w-2/3 flex flex-col">
        {activeConversation ? (
          <>
            <div className="p-4 border-b flex items-center">
              {messages.find(m => m.id === activeConversation)?.user?.photo_profil && (
                <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden mr-3">
                  <img 
                    src={messages.find(m => m.id === activeConversation)?.user?.photo_profil} 
                    alt="User" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div>
                <h2 className="font-semibold">
                  {messages.find(m => m.id === activeConversation)?.user?.name}
                </h2>
                <div className="text-xs text-green-500">
                  En ligne
                </div>
              </div>
            </div>
            
            <ScrollArea className="flex-1 p-4">
              {conversationMessages.map(msg => (
                <div key={msg.id_message} className={`mb-4 flex ${msg.id_expediteur === user?.id ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`max-w-[70%] p-3 rounded-lg ${
                      msg.id_expediteur === user?.id 
                        ? 'bg-blue-500 text-white rounded-br-none' 
                        : 'bg-gray-200 text-gray-800 rounded-bl-none'
                    }`}
                  >
                    <p>{msg.contenu}</p>
                    <div className={`text-xs mt-1 ${msg.id_expediteur === user?.id ? 'text-blue-100' : 'text-gray-500'}`}>
                      {new Date(msg.date_envoi).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </ScrollArea>
            
            <div className="p-4 border-t">
              <form 
                className="flex items-center"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const input = e.currentTarget.elements.namedItem('message') as HTMLInputElement;
                  const message = input.value.trim();
                  
                  if (!message) return;
                  
                  try {
                    const recipientId = messages.find(m => m.id === activeConversation)?.user?.id;
                    if (!recipientId) throw new Error("Destinataire introuvable");
                    
                    const { error } = await supabase.from("message").insert({
                      id_conversation: parseInt(activeConversation),
                      id_expediteur: user.id,
                      id_destinataire: recipientId,
                      contenu: message,
                      date_envoi: new Date().toISOString(),
                    });
                    
                    if (error) throw error;
                    
                    await supabase
                      .from('conversation')
                      .update({ derniere_activite: new Date().toISOString() })
                      .eq('id_conversation', parseInt(activeConversation));
                    
                    openConversation({ id: activeConversation } as ConversationMessage);
                    input.value = '';
                  } catch (error) {
                    console.error("Error sending message:", error);
                    toast({
                      title: "Erreur",
                      description: "Impossible d'envoyer le message",
                      variant: "destructive"
                    });
                  }
                }}
              >
                <Input 
                  name="message"
                  placeholder="Écrivez un message..." 
                  className="flex-1 mr-2"
                />
                <Button type="submit">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Envoyer
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <MessageCircle className="h-16 w-16 mb-4" strokeWidth={1} />
            <h2 className="text-xl font-semibold mb-2">Vos messages</h2>
            <p className="max-w-sm text-center">
              Sélectionnez une conversation ou démarrez-en une nouvelle en cherchant un utilisateur.
            </p>
          </div>
        )}
      </div>
      
      {isDialogOpen && selectedUser && (
        <MessageDialog
          isOpen={isDialogOpen}
          onClose={() => {
            setIsDialogOpen(false);
            setSelectedUser(null);
            fetchConversations();
          }}
          recipient={{
            id: selectedUser.id_utilisateur,
            name: selectedUser.name || `${selectedUser.nom} ${selectedUser.prenoms || ''}`.trim()
          }}
        />
      )}
    </div>
  );
};

export default Messages;
