
import React, { useState, useEffect } from "react";
import MessageItem from "@/components/MessageItem";
import { Input } from "@/components/ui/input";
import { Search, UserPlus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getConversations } from "@/lib/messagerie";
import { UserProfile } from "@/types/userProfile";
import { Button } from "@/components/ui/button";
import MessageDialog from "@/components/MessageDialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";

interface Message {
  id: string;
  user: {
    name: string;
    avatar?: string;
    status?: "online" | "offline" | "away" | "busy" | "none";
    id: string;
  };
  lastMessage: string;
  timestamp: string;
  unread: number;
}

const Messages: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);
  
  const loadConversations = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const conversations = await getConversations(user.id);
      
      if (conversations) {
        const formattedMessages = conversations.map(conv => {
          // Déterminer l'autre utilisateur dans la conversation
          const otherUser = conv.id_utilisateur1 === user.id 
            ? conv.utilisateur2 
            : conv.utilisateur1;
          
          return {
            id: conv.id_conversation?.toString() || "",
            user: {
              id: otherUser.id_utilisateur,
              name: `${otherUser.nom} ${otherUser.prenoms || ''}`.trim(),
              avatar: otherUser.photo_profil,
              status: "offline" // Par défaut
            },
            lastMessage: "Cliquez pour voir les messages",
            timestamp: new Date(conv.derniere_activite || conv.created_at || "").toLocaleDateString(),
            unread: 0 // À implémenter plus tard
          };
        });
        
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des conversations:", error);
      toast.error("Impossible de charger les conversations");
    } finally {
      setLoading(false);
    }
  };
  
  const searchUsers = async () => {
    if (!userSearchTerm.trim() || !user) return;
    
    try {
      setSearchLoading(true);
      
      const { data, error } = await supabase
        .from('utilisateur')
        .select('*')
        .neq('id_utilisateur', user.id)
        .or(`nom.ilike.%${userSearchTerm}%,prenoms.ilike.%${userSearchTerm}%,email.ilike.%${userSearchTerm}%`)
        .limit(5);
      
      if (error) throw error;
      
      setSearchResults(data);
    } catch (error) {
      console.error("Erreur lors de la recherche d'utilisateurs:", error);
      toast.error("Impossible de rechercher des utilisateurs");
    } finally {
      setSearchLoading(false);
    }
  };
  
  useEffect(() => {
    if (userSearchTerm) {
      const timer = setTimeout(() => {
        searchUsers();
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [userSearchTerm]);
  
  const handleOpenChat = (id: string) => {
    console.log(`Opening chat ${id}`);
    // Ici vous pourriez naviguer vers la conversation spécifique ou ouvrir un modal
  };
  
  const handleStartNewConversation = (selectedUser: UserProfile) => {
    setSelectedUser(selectedUser);
    setIsMessageDialogOpen(true);
  };
  
  const filteredMessages = messages.filter((message) =>
    message.user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.07
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="max-w-md mx-auto h-full">
      <header className="sticky top-0 z-10 bg-background px-4 py-4 border-b border-border">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon">
                <UserPlus className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="end">
              <div className="p-2">
                <Input
                  placeholder="Rechercher un utilisateur..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                />
                <div className="mt-2 max-h-48 overflow-auto">
                  {searchLoading && (
                    <div className="py-2 text-center text-sm text-gray-500">
                      Recherche en cours...
                    </div>
                  )}
                  
                  {!searchLoading && searchResults.length === 0 && userSearchTerm && (
                    <div className="py-2 text-center text-sm text-gray-500">
                      Aucun utilisateur trouvé
                    </div>
                  )}
                  
                  {searchResults.map((result) => (
                    <div 
                      key={result.id_utilisateur}
                      className="flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer"
                      onClick={() => handleStartNewConversation(result)}
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden mr-2">
                        {result.photo_profil ? (
                          <img src={result.photo_profil} alt={result.nom} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary text-primary-foreground">
                            {result.nom.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{result.nom} {result.prenoms || ''}</div>
                        <div className="text-xs text-gray-500">{result.email}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
          <Input
            type="text"
            placeholder="Rechercher des conversations..."
            className="pl-10 bg-gray-50 border-gray-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>
      
      <div className="divide-y divide-border">
        <AnimatePresence>
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-10 text-center text-gray-500"
            >
              Chargement des conversations...
            </motion.div>
          ) : filteredMessages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-10 text-center text-gray-500"
            >
              {searchTerm ? "Aucune conversation trouvée" : "Commencez une nouvelle conversation"}
            </motion.div>
          ) : (
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="divide-y divide-border"
            >
              {filteredMessages.map((message) => (
                <motion.div key={message.id} variants={item}>
                  <MessageItem
                    {...message}
                    onClick={() => handleOpenChat(message.id)}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {selectedUser && (
        <MessageDialog
          isOpen={isMessageDialogOpen}
          onClose={() => {
            setIsMessageDialogOpen(false);
            setSelectedUser(null);
            loadConversations(); // Recharger les conversations après l'envoi d'un message
          }}
          recipientId={selectedUser.id_utilisateur}
          recipientName={`${selectedUser.nom} ${selectedUser.prenoms || ''}`.trim()}
          recipientPhoto={selectedUser.photo_profil}
        />
      )}
    </div>
  );
};

export default Messages;
