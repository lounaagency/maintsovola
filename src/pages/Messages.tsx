
import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import MessageItem from "@/components/MessageItem";
import MessageDialog from "@/components/MessageDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, Users } from "lucide-react";
import { Message, UserInfo } from "@/types/message";
import { UserProfile } from "@/types/userProfile";

const Messages: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSearchingUser, setIsSearchingUser] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  
  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);
  
  useEffect(() => {
    if (searchQuery) {
      const filtered = messages.filter(message => 
        message.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredMessages(filtered);
    } else {
      setFilteredMessages(messages);
    }
  }, [searchQuery, messages]);
  
  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversation')
        .select(`
          id_conversation,
          derniere_mise_a_jour,
          dernier_message,
          utilisateur1:utilisateurs!conversation_id_utilisateur1_fkey(id_utilisateur, nom, prenoms, photo_profil),
          utilisateur2:utilisateurs!conversation_id_utilisateur2_fkey(id_utilisateur, nom, prenoms, photo_profil),
          messages_non_lus(count)
        `)
        .or(`id_utilisateur1.eq.${user?.id},id_utilisateur2.eq.${user?.id}`);
      
      if (error) throw error;
      
      // Transform data into the expected format
      const formattedMessages: Message[] = data.map(conv => {
        // Determine if the current user is utilisateur1 or utilisateur2
        const isUser1 = conv.utilisateur1.id_utilisateur === user?.id;
        const otherUser = isUser1 ? conv.utilisateur2 : conv.utilisateur1;
        
        return {
          id: conv.id_conversation.toString(),
          user: {
            id: otherUser.id_utilisateur,
            name: `${otherUser.nom} ${otherUser.prenoms || ''}`.trim(),
            avatar: otherUser.photo_profil,
            status: "online" // Default status, can be updated later
          },
          lastMessage: conv.dernier_message || "Aucun message",
          timestamp: new Date(conv.derniere_mise_a_jour).toISOString(),
          unread: conv.messages_non_lus[0]?.count || 0
        };
      });
      
      setMessages(formattedMessages);
      setFilteredMessages(formattedMessages);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };
  
  const handleUserSearch = async () => {
    if (!userSearchQuery) return;
    
    try {
      const { data, error } = await supabase
        .from('utilisateurs')
        .select('id_utilisateur, nom, prenoms, photo_profil')
        .or(`nom.ilike.%${userSearchQuery}%,prenoms.ilike.%${userSearchQuery}%`)
        .neq('id_utilisateur', user?.id);
      
      if (error) throw error;
      setSearchResults(data);
    } catch (error) {
      console.error("Error searching for users:", error);
    }
  };
  
  const startConversation = (selectedUser: UserProfile) => {
    setSelectedUser(selectedUser);
    setIsSearchingUser(false);
    setIsDialogOpen(true);
  };
  
  const onMessageSent = () => {
    setIsDialogOpen(false);
    setSelectedUser(null);
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
                      {result.nom} {result.prenoms}
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
            <MessageItem
              key={message.id}
              message={message}
              onClick={() => {
                const userInfo: UserInfo = {
                  id: message.user.id,
                  name: message.user.name,
                  avatar: message.user.avatar
                };
                setSelectedUser(userInfo);
                setIsDialogOpen(true);
              }}
            />
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
          recipient={selectedUser}
          onMessageSent={onMessageSent}
        />
      )}
    </div>
  );
};

export default Messages;
