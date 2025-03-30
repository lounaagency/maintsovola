
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

// Interface for frontend conversation representation
interface ConversationMessage {
  id: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
    status: string;
  };
  lastMessage: string;
  timestamp: string;
  unread: number;
}

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
          derniere_activite,
          id_utilisateur1,
          id_utilisateur2,
          utilisateur1:id_utilisateur1(id_utilisateur, nom, prenoms, photo_profil),
          utilisateur2:id_utilisateur2(id_utilisateur, nom, prenoms, photo_profil)
        `)
        .or(`id_utilisateur1.eq.${user?.id},id_utilisateur2.eq.${user?.id}`);
      
      if (error) throw error;
      
      // Get all conversation IDs
      const conversationIds = data.map(conv => conv.id_conversation);
      
      // Get last messages for each conversation
      const { data: lastMessages, error: lastMsgError } = await supabase
        .from('message')
        .select('id_conversation, contenu, date_envoi, lu, id_expediteur')
        .in('id_conversation', conversationIds)
        .order('date_envoi', { ascending: false });
        
      if (lastMsgError) throw lastMsgError;
      
      // Group by conversation and find last message
      const conversationToLastMessage = lastMessages.reduce((acc, msg) => {
        if (!acc[msg.id_conversation] || new Date(msg.date_envoi) > new Date(acc[msg.id_conversation].date_envoi)) {
          acc[msg.id_conversation] = msg;
        }
        return acc;
      }, {});
      
      // Count unread messages
      const unreadCounts = lastMessages.reduce((acc, msg) => {
        if (!msg.lu && msg.id_expediteur !== user?.id) {
          acc[msg.id_conversation] = (acc[msg.id_conversation] || 0) + 1;
        }
        return acc;
      }, {});
      
      // Transform data into the expected format
      const formattedMessages: ConversationMessage[] = data.map(conv => {
        // Determine if the current user is utilisateur1 or utilisateur2
        const isUser1 = conv.utilisateur1.id_utilisateur === user?.id;
        const otherUser = isUser1 ? conv.utilisateur2 : conv.utilisateur1;
        const lastMsg = conversationToLastMessage[conv.id_conversation];
        
        return {
          id: conv.id_conversation.toString(),
          user: {
            id: otherUser.id_utilisateur,
            name: `${otherUser.nom} ${otherUser.prenoms || ''}`.trim(),
            avatar: otherUser.photo_profil,
            status: "online" // Default status, can be updated later
          },
          lastMessage: lastMsg?.contenu || "Aucun message",
          timestamp: lastMsg?.date_envoi || conv.derniere_activite,
          unread: unreadCounts[conv.id_conversation] || 0
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
        .from('utilisateur')
        .select('id_utilisateur, nom, prenoms, photo_profil')
        .or(`nom.ilike.%${userSearchQuery}%,prenoms.ilike.%${userSearchQuery}%`)
        .neq('id_utilisateur', user?.id);
      
      if (error) throw error;
      setSearchResults(data || []);
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
            <div 
              key={message.id}
              onClick={() => {
                setSelectedUser({
                  id_utilisateur: message.user.id,
                  nom: message.user.name,
                  photo_profil: message.user.avatar
                });
                setIsDialogOpen(true);
              }}
              className="cursor-pointer"
            >
              <div className="flex items-center p-3 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden mr-3">
                  {message.user.avatar && (
                    <img 
                      src={message.user.avatar} 
                      alt={message.user.name} 
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold">{message.user.name}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(message.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 truncate max-w-[180px]">
                      {message.lastMessage}
                    </p>
                    {message.unread > 0 && (
                      <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-1 ml-2">
                        {message.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
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
          recipientId={selectedUser.id_utilisateur}
          recipientName={selectedUser.nom}
          recipientAvatar={selectedUser.photo_profil}
          onMessageSent={onMessageSent}
        />
      )}
    </div>
  );
};

export default Messages;
