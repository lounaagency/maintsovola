
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { createConversationIfNotExists } from "@/lib/messagerie";

interface MessageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  recipient: {
    id: string;
    name: string;
  };
  subject?: string;
}

const MessageDialog: React.FC<MessageDialogProps> = ({
  isOpen,
  onClose,
  recipient,
  subject = "",
}) => {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (subject) {
      setMessage(`Concernant ${subject}:\n\n`);
    } else {
      setMessage("");
    }
  }, [subject, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !message.trim()) return;

    try {
      setIsSubmitting(true);

      // Create or get a conversation
      const conversationId = await createConversationIfNotExists(
        user.id,
        recipient.id,
      );

      if (!conversationId) {
        throw new Error("Impossible de créer une conversation");
      }

      // Send the message
      const { error } = await supabase.from("message").insert({
        id_conversation: conversationId,
        id_expediteur: user.id,
        id_destinataire: recipient.id,
        contenu: message.trim(),
        date_envoi: new Date().toISOString(),
      });

      if (error) throw error;

      // Update conversation activity
      await supabase
        .from("conversation")
        .update({ derniere_activite: new Date().toISOString() })
        .eq("id_conversation", conversationId);

      toast({
        title: "Message envoyé",
        description: `Votre message a été envoyé à ${recipient.name}`,
      });

      setMessage("");
      onClose();
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le message",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Message à {recipient.name}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 mt-4">
            <Textarea
              placeholder="Écrivez votre message ici..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[150px]"
              required
            />
          </div>
          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting || !message.trim()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Envoyer
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MessageDialog;
