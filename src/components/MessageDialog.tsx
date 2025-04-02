
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { SendHorizonal } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { createConversation, sendMessage } from "@/lib/messagerie";

export interface MessageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  recipient: {
    id: string;
    name: string;
  };
  subject: string;
  initialMessage?: string;
}

const MessageDialog: React.FC<MessageDialogProps> = ({
  isOpen,
  onClose,
  recipient,
  subject,
  initialMessage = ""
}) => {
  const [message, setMessage] = useState(initialMessage || "");
  const [sending, setSending] = useState(false);
  const { user } = useAuth();

  const handleSend = async () => {
    if (!user) {
      toast.error("Vous devez être connecté pour envoyer un message");
      return;
    }

    if (!message.trim()) {
      toast.error("Le message ne peut pas être vide");
      return;
    }

    setSending(true);
    try {
      const conversation = await createConversation(user.id, recipient.id);
      if (!conversation) {
        toast.error("Impossible de créer la conversation");
        return;
      }

      const sent = await sendMessage(
        conversation.id_conversation,
        user.id,
        recipient.id,
        message
      );

      if (sent) {
        toast.success("Message envoyé avec succès");
        setMessage("");
        onClose();
      } else {
        toast.error("Impossible d'envoyer le message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Une erreur est survenue");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            Message à {recipient.name} - {subject}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Écrivez votre message..."
            rows={6}
            className="resize-none"
          />

          <div className="mt-4 flex justify-between">
            <Button variant="outline" onClick={onClose} disabled={sending}>
              Annuler
            </Button>
            <Button onClick={handleSend} disabled={sending || !message.trim()}>
              <SendHorizonal className="mr-2 h-4 w-4" />
              Envoyer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MessageDialog;
