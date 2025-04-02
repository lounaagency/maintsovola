import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Send } from "lucide-react";
import { Link } from 'react-router-dom';

interface Conversation {
  id_conversation: number;
  created_at: string;
  user1_id: string;
  user2_id: string;
}

interface ConversationMessage {
  id_message: number;
  id_conversation: number;
  id_expediteur: string;
  id_destinataire: string;
  message: string;
  date_envoi: string;
  lu: boolean;
}

const Messages: React.FC = () => {
  const { user, profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id_conversation);
    }
  }, [selectedConversation]);

  const fetchConversations = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('conversation')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
        console.error('Error fetching conversations:', error);
      } else {
        setConversations(data || []);
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Exception fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: number) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('message')
        .select('*')
        .eq('id_conversation', conversationId)
        .order('date_envoi', { ascending: true });

      if (error) {
        setError(error.message);
        console.error('Error fetching messages:', error);
      } else {
        setMessages(data || []);
        // Mark messages as read when the conversation is opened
        if (user && data) {
          const otherUserId = selectedConversation?.user1_id === user.id ? selectedConversation.user2_id : selectedConversation?.user1_id;
          if (otherUserId) {
            markConversationAsRead(conversationId, otherUserId);
          }
        }
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Exception fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!user || !selectedConversation) return;

    const trimmedMessage = newMessage.trim();
    if (!trimmedMessage) return;

    try {
      const { error } = await supabase
        .from('message')
        .insert([
          {
            id_conversation: selectedConversation.id_conversation,
            id_expediteur: user.id,
            id_destinataire: selectedConversation.user1_id === user.id ? selectedConversation.user2_id : selectedConversation.user1_id,
            message: trimmedMessage,
            lu: false,
          },
        ]);

      if (error) {
        setError(error.message);
        console.error('Error sending message:', error);
        toast.error("Failed to send message.");
      } else {
        setNewMessage('');
        fetchMessages(selectedConversation.id_conversation);
        toast.success("Message sent!");
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Exception sending message:', err);
      toast.error("An error occurred while sending the message.");
    }
  };

  // Fix property access on ConversationMessage
  const markConversationAsRead = async (conversationId: number, otherUserId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('message')
        .update({ lu: true })
        .eq('id_conversation', conversationId)
        .eq('id_destinataire', user.id)
        .eq('id_expediteur', otherUserId);
        
      if (error) {
        console.error('Error marking conversation as read:', error);
      }
    } catch (error) {
      console.error('Exception marking conversation as read:', error);
    }
  };

  const getOtherUserId = (conversation: Conversation): string => {
    return conversation.user1_id === user?.id ? conversation.user2_id : conversation.user1_id;
  };

  return (
    <div className="container mx-auto mt-8 h-screen">
      <h1 className="text-2xl font-bold mb-4">Messages</h1>
      
      <div className="flex h-full">
        {/* Conversations List */}
        <div className="w-1/4 border-r pr-4">
          <h2 className="text-lg font-semibold mb-2">Conversations</h2>
          {loading && <p>Loading conversations...</p>}
          {error && <p className="text-red-500">Error: {error}</p>}
          <ScrollArea className="h-[70vh]">
            {conversations.map((conversation) => (
              <div
                key={conversation.id_conversation}
                className={`p-2 rounded cursor-pointer hover:bg-gray-100 ${selectedConversation?.id_conversation === conversation.id_conversation ? 'bg-gray-200' : ''}`}
                onClick={() => {
                  setSelectedConversation(conversation);
                }}
              >
                <ConversationItem conversation={conversation} currentUserId={user?.id} />
              </div>
            ))}
          </ScrollArea>
        </div>

        {/* Messages Area */}
        <div className="w-3/4 pl-4 flex flex-col">
          {selectedConversation ? (
            <>
              <div className="border-b pb-2">
                <h2 className="text-lg font-semibold">
                  Conversation with <ConversationName conversation={selectedConversation} currentUserId={user?.id} />
                </h2>
              </div>
              
              {/* Messages List */}
              <div className="flex-grow overflow-y-auto">
                <ScrollArea className="h-[60vh]">
                  {loading && <p>Loading messages...</p>}
                  {error && <p className="text-red-500">Error: {error}</p>}
                  {messages.map((msg) => (
                    <div
                      key={msg.id_message}
                      className={`mb-2 p-2 rounded-md ${msg.id_expediteur === user?.id ? 'bg-blue-100 self-end text-right' : 'bg-gray-100 self-start'}`}
                    >
                      <p>{msg.message}</p>
                      <p className="text-xs text-gray-500">{new Date(msg.date_envoi).toLocaleString()}</p>
                    </div>
                  ))}
                </ScrollArea>
              </div>

              {/* Message Input */}
              <div className="mt-4">
                <div className="flex items-center">
                  <Input
                    type="text"
                    placeholder="Type your message..."
                    className="flex-grow mr-2"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <Button onClick={sendMessage}><Send className="h-4 w-4 mr-2" />Send</Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-grow flex items-center justify-center">
              <p className="text-gray-500">Select a conversation to view messages.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface ConversationItemProps {
  conversation: Conversation;
  currentUserId?: string;
}

const ConversationItem: React.FC<ConversationItemProps> = ({ conversation, currentUserId }) => {
  const otherUserId = conversation.user1_id === currentUserId ? conversation.user2_id : conversation.user1_id;

  return (
    <div className="flex items-center space-x-3">
      <Avatar>
        <AvatarImage src={`https://avatar.vercel.sh/${otherUserId}.png`} />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
      <div>
        <div className="font-bold"><ConversationName conversation={conversation} currentUserId={currentUserId} /></div>
        <div className="text-sm opacity-50">Last message preview...</div>
      </div>
    </div>
  );
};

interface ConversationNameProps {
  conversation: Conversation;
  currentUserId?: string;
}

const ConversationName: React.FC<ConversationNameProps> = ({ conversation, currentUserId }) => {
  const otherUserId = conversation.user1_id === currentUserId ? conversation.user2_id : conversation.user1_id;
  const [otherUserName, setOtherUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOtherUserName = async () => {
      setLoading(true);
      setError(null);
  
      try {
        const { data, error } = await supabase
          .from('utilisateur')
          .select('nom, prenoms')
          .eq('id_utilisateur', otherUserId)
          .single();
  
        if (error) {
          setError(error.message);
          console.error('Error fetching user name:', error);
        } else {
          setOtherUserName(`${data?.nom} ${data?.prenoms || ''}`);
        }
      } catch (err: any) {
        setError(err.message);
        console.error('Exception fetching user name:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOtherUserName();
  }, [conversation, currentUserId]);

  if (loading) return <span>Loading...</span>;
  if (error) return <span className="text-red-500">Error: {error}</span>;

  return <span>{otherUserName || 'Unknown User'}</span>;
};

export default Messages;
