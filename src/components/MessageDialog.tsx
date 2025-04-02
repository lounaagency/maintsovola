
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface MessageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  recipient: {
    id: string;
    name: string;
  };
  subject?: string;
  initialMessage?: string;
}

const MessageDialog: React.FC<MessageDialogProps> = ({
  isOpen,
  onClose,
  recipient,
  subject = "",
  initialMessage = "",
}) => {
  const { user } = useAuth();
  const { register, handleSubmit, reset } = useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      reset({ message: initialMessage, subject: subject });
    }
  }, [isOpen, initialMessage, subject, reset]);

  const onSubmit = async (data: any) => {
    if (!user) {
      toast.error("Vous devez être connecté pour envoyer un message.");
      return;
    }
  
    setLoading(true);
    try {
      const { error } = await supabase.from("message").insert({
        id_expediteur: user.id, 
        id_destinataire: recipient.id,
        contenu: data.message,
        lu: false 
      });
  
      if (error) {
        throw error;
      }
  
      toast.success("Message envoyé !");
      onClose();
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error(error.message || "Une erreur est survenue lors de l'envoi du message.");
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Envoyer un message à {recipient.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Input
              id="subject"
              placeholder="Sujet"
              defaultValue={subject}
              {...register("subject")}
            />
          </div>
          <div>
            <Textarea
              id="message"
              placeholder="Votre message..."
              defaultValue={initialMessage}
              {...register("message", { required: true })}
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              Envoyer <Send className="ml-2" size={16} />
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default MessageDialog;
