
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
import { Loader2 } from "lucide-react";
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
        throw new Error("Unable to create conversation");
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

      // Update the conversation's last activity timestamp
      await supabase
        .from("conversation")
        .update({ derniere_activite: new Date().toISOString() })
        .eq("id_conversation", conversationId);

      toast({
        title: "Message sent",
        description: `Your message has been sent to ${recipient.name}`,
      });

      setMessage("");
      onClose();
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Unable to send the message",
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
            Message to {recipient.name}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 mt-4">
            <Textarea
              placeholder="Write your message here..."
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
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MessageDialog;
