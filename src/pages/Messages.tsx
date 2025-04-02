import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import MessageItem from "@/components/MessageItem";
import MessageDialog from "@/components/MessageDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, Users } from "lucide-react";
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
      const filtered = messages.filter(message => 
        message.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.lastMessage.text.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredMessages(filtered);
    } else {
      setFilteredMessages(messages);
    }
  }, [searchQuery, messages]);
  
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
    setSelectedUser(selectedUser);
    setIsSearchingUser(false);
    setIsDialogOpen(true);
  };
  
  const onMessageSent = () => {
    fetchConversations();
  };
  
  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Messages</h1>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsSearchingUser(!isSearchingUser)}
        >
          <Users className="h-5 w-5" />
        </Button>
      </div>
      
      {isSearchingUser ? (
        <div className="mb-6 space-y-4">
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
          
          <ScrollArea className="h-[300px] rounded-md border p-4">
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
        <div className="flex items-center space-x-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher dans les messages..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      )}
      
      <div className="space-y-2">
        {filteredMessages.length > 0 ? (
          filteredMessages.map((message) => (
            <div 
              key={message.id}
              onClick={() => {
                if (!message.user?.id) return;
                setSelectedUser({
                  id_utilisateur: message.user.id,
                  name: message.user.name,
                  photo_profil: message.user.photo_profil
                });
                setIsDialogOpen(true);
              }}
              className="cursor-pointer"
            >
              <MessageItem
                id={message.id}
                user={{
                  name: message.user.name,
                  photo_profil: message.user.photo_profil,
                  status: message.user.status || "none"
                }}
                lastMessage={message.lastMessage}
                timestamp={new Date(message.timestamp).toLocaleDateString()}
                unread={message.unread}
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
      
      {isDialogOpen && selectedUser && (
        <MessageDialog
          isOpen={isDialogOpen}
          onClose={() => {
            setIsDialogOpen(false);
            setSelectedUser(null);
          }}
          recipient={{
            id: selectedUser.id,
            name: selectedUser.name
          }}
        />
      )}
      
      {isMessageDialogOpen && selectedRecipient && (
        <MessageDialog
          isOpen={isMessageDialogOpen}
          onClose={() => {
            setIsMessageDialogOpen(false);
            fetchConversations(); // Refresh conversations list after sending a message
          }}
          recipient={{
            id: selectedRecipient.id,
            name: selectedRecipient.name
          }}
        />
      )}
    </div>
  );
};

export default Messages;
