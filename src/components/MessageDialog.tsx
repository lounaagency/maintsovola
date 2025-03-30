
import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { createConversation, sendMessage, useGetMessagesRealTime } from "@/lib/messagerie";
import { useAuth } from "@/contexts/AuthContext";
import UserAvatar from "@/components/UserAvatar";
import { useToast } from "@/components/ui/use-toast";

interface MessageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId: string;
  recipientName: string;
  recipientPhoto?: string;
  onMessageSent?: () => void;
}

const MessageDialog: React.FC<MessageDialogProps> = ({
  isOpen,
  onClose,
  recipientId,
  recipientName,
  recipientPhoto,
  onMessageSent
}) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user && recipientId && isOpen) {
      initializeConversation();
    }
  }, [user, recipientId, isOpen]);

  useGetMessagesRealTime(conversationId || 0, (newMessages) => {
    setMessages(newMessages);
  });

  const initializeConversation = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const conversation = await createConversation(user.id, recipientId);
      setConversationId(conversation.id_conversation);
    } catch (error) {
      console.error("Erreur lors de l'initialisation de la conversation:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'initialiser la conversation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !user || !conversationId) return;

    try {
      await sendMessage({
        id_expediteur: user.id,
        id_destinataire: recipientId,
        contenu: message,
      });
      
      setMessage("");
      
      if (onMessageSent) {
        onMessageSent();
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    // Scroll to bottom whenever messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserAvatar src={recipientPhoto} alt={recipientName} size="sm" />
            <span>{recipientName}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col h-[400px]">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : messages.length > 0 ? (
              messages.map((msg) => {
                const isCurrentUser = msg.id_expediteur === user?.id;
                return (
                  <div
                    key={msg.id_message}
                    className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        isCurrentUser
                          ? "bg-primary text-primary-foreground rounded-br-none"
                          : "bg-muted rounded-bl-none"
                      }`}
                    >
                      <p>{msg.contenu}</p>
                      <p className={`text-xs mt-1 ${isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {new Date(msg.date_envoi).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex justify-center items-center h-full text-muted-foreground">
                Aucun message. Commencez la conversation!
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="p-4 border-t">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex gap-2"
            >
              <Input
                placeholder="Tapez votre message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={!message.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MessageDialog;
