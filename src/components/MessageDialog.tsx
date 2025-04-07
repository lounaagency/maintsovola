
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
import { Loader2, Send, Paperclip, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { createConversationIfNotExists } from "@/lib/messagerie";
import { ScrollArea } from "@/components/ui/scroll-area";
import { v4 as uuidv4 } from 'uuid';

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
  const [attachments, setAttachments] = useState<File[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (subject) {
      setMessage(`Concernant ${subject}:\n\n`);
    } else {
      setMessage("");
    }
  }, [subject, isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...newFiles]);
    }
    // Reset input value so the same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const uploadAttachment = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `message-attachments/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('message-attachments')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      return filePath;
    } catch (error) {
      console.error('Error uploading attachment:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !message.trim() && attachments.length === 0) return;

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

      // Upload attachments if there are any
      let attachmentPaths: string[] = [];
      if (attachments.length > 0) {
        // Upload each attachment
        const uploadPromises = attachments.map(file => uploadAttachment(file));
        const results = await Promise.all(uploadPromises);
        attachmentPaths = results.filter((path): path is string => path !== null);
      }

      // Send the message
      const { error } = await supabase.from("message").insert({
        id_conversation: conversationId,
        id_expediteur: user.id,
        id_destinataire: recipient.id,
        contenu: message.trim(),
        date_envoi: new Date().toISOString(),
        pieces_jointes: attachmentPaths.length > 0 ? attachmentPaths : null
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
      setAttachments([]);
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Message à {recipient.name}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4 mt-4">
            <Textarea
              placeholder="Écrivez votre message ici..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[150px]"
            />
            
            {/* Attachments section */}
            {attachments.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Pièces jointes:</p>
                <ScrollArea className="h-24 w-full rounded-md border">
                  <div className="p-2 space-y-2">
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-muted p-2 rounded-md">
                        <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeAttachment(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
            />
            
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2"
            >
              <Paperclip className="mr-2 h-4 w-4" />
              Ajouter une pièce jointe
            </Button>
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
            <Button 
              type="submit" 
              disabled={isSubmitting || (!message.trim() && attachments.length === 0)}
            >
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
