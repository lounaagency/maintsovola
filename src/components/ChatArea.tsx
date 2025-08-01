import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { ConversationMessage } from "@/types/message";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeftCircle, Send, MessageCircle, Paperclip, FileText, Image, X, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import UserAvatar from "./UserAvatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { v4 as uuidv4 } from 'uuid';
import { useRealtimeChannels } from '@/hooks/useRealtimeChannels';

interface ChatAreaProps {
  userId: string;
  conversation: ConversationMessage | null;
  onBack: () => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({
  userId,
  conversation,
  onBack
}) => {
  const [currentMessages, setCurrentMessages] = useState<ConversationMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fetchMessages = useCallback(async (conversationId: number) => {
    try {
      const {
        data,
        error
      } = await supabase.from('message').select(`
          *,
          expediteur:utilisateur!id_expediteur(id_utilisateur, nom, prenoms, photo_profil)
        `).eq('id_conversation', conversationId).order('date_envoi', {
        ascending: true
      });
      if (error) {
        throw error;
      }
      if (data) {
        const formattedMessages = data.map(message => ({
          ...message,
          sender: {
            id_utilisateur: message.expediteur?.id_utilisateur || "",
            nom: message.expediteur?.nom || "",
            prenoms: message.expediteur?.prenoms || null,
            photo_profil: message.expediteur?.photo_profil || null
          }
        }));
        setCurrentMessages(formattedMessages as ConversationMessage[]);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des messages:', error);
    }
  }, []);
  const markMessagesAsRead = useCallback(async (conversationId: number) => {
    if (!userId) return;
    try {
      await supabase.from('message').update({
        lu: true
      }).eq('id_conversation', conversationId).eq('id_destinataire', userId).eq('lu', false);
    } catch (error) {
      console.error('Erreur lors du marquage des messages comme lus:', error);
    }
  }, [userId]);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setAttachments(prev => [...prev, ...newFiles]);
    }
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
      const {
        error: uploadError
      } = await supabase.storage.from('message-attachments').upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
      if (uploadError) throw uploadError;
      return filePath;
    } catch (error) {
      console.error('Error uploading attachment:', error);
      return null;
    }
  };
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !conversation || !newMessage.trim() && attachments.length === 0) return;
    setIsSendingMessage(true);
    try {
      let attachmentPaths: string[] = [];
      if (attachments.length > 0) {
        const uploadPromises = attachments.map(file => uploadAttachment(file));
        const results = await Promise.all(uploadPromises);
        attachmentPaths = results.filter((path): path is string => path !== null);
      }
      const messageToSend = {
        id_conversation: conversation.id_conversation,
        id_expediteur: userId,
        id_destinataire: conversation.id_destinataire || "",
        contenu: newMessage.trim(),
        date_envoi: new Date().toISOString(),
        lu: false,
        pieces_jointes: attachmentPaths.length > 0 ? attachmentPaths : undefined
      };
      const optimisticMessage: ConversationMessage = {
        ...messageToSend,
        id_message: Date.now(),
        sender: {
          id_utilisateur: userId,
          nom: "",
          prenoms: null,
          photo_profil: null
        },
        pieces_jointes: attachmentPaths
      };
      setCurrentMessages(prev => [...prev, optimisticMessage]);
      setNewMessage("");
      setAttachments([]);
      setTimeout(scrollToBottom, 50);
      const {
        error
      } = await supabase.from('message').insert(messageToSend);
      if (error) throw error;
      await supabase.from('conversation').update({
        derniere_activite: new Date().toISOString()
      }).eq('id_conversation', conversation.id_conversation);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSendingMessage(false);
    }
  };
  const formatMessageDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: fr
      });
    } catch (error) {
      return dateString;
    }
  };
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  };
  const getFileUrl = (filePath: string) => {
    const {
      data
    } = supabase.storage.from('message-attachments').getPublicUrl(filePath);
    return data.publicUrl;
  };
  const isImageFile = (filePath: string) => {
    const extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    return extensions.some(ext => filePath.toLowerCase().endsWith(ext));
  };
  const getFileName = (path: string) => {
    return path.split('/').pop() || 'fichier';
  };
  useEffect(() => {
    scrollToBottom();
  }, [currentMessages]);
  // Stable callback functions
  const stableFetchMessages = useCallback(() => {
    if (conversation) {
      fetchMessages(conversation.id_conversation);
    }
  }, [conversation, fetchMessages]);

  const stableMarkMessagesAsRead = useCallback(() => {
    if (conversation) {
      markMessagesAsRead(conversation.id_conversation);
    }
  }, [conversation, markMessagesAsRead]);

  // Configure realtime channels for messages - stable callbacks
  const channelConfigs = useMemo(() => {
    if (!conversation) return [];
    return [
      {
        table: 'message',
        event: 'INSERT',
        filter: `id_conversation=eq.${conversation.id_conversation}`,
        callback: (payload: any) => {
          if (payload.new && payload.new.id_expediteur !== userId) {
            stableFetchMessages();
          }
          if (payload.new && payload.new.id_destinataire === userId) {
            stableMarkMessagesAsRead();
          }
        }
      }
    ];
  }, [conversation, userId, stableFetchMessages, stableMarkMessagesAsRead]);

  // Use the centralized realtime hook
  useRealtimeChannels({
    userId,
    channelType: 'messages',
    conversationId: conversation?.id_conversation,
    configs: channelConfigs
  });

  // Initial fetch and setup when conversation changes
  useEffect(() => {
    if (conversation) {
      fetchMessages(conversation.id_conversation);
      markMessagesAsRead(conversation.id_conversation);
    }
  }, [conversation, fetchMessages, markMessagesAsRead]);
  if (!conversation) {
    return <div className="flex items-center justify-center h-full">
        <div className="text-center p-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <MessageCircle className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Vos messages</h3>
          <p className="text-muted-foreground">
            Sélectionnez une conversation ou recherchez<br />
            un utilisateur pour commencer à discuter
          </p>
        </div>
      </div>;
  }
  return <>
      <div className="flex items-center p-4 border-b border-border sticky top-0 bg-white z-10 py-[2px] px-[16px]">
        <Button variant="ghost" size="icon" className="md:hidden mr-2" onClick={onBack}>
          <ArrowLeftCircle className="h-5 w-5" />
        </Button>
        <UserAvatar src={conversation.other_user?.photo_profil} alt={conversation.other_user?.nom || ""} size="sm" />
        <div className="ml-3">
          <h3 className="font-semibold">
            {conversation.other_user?.nom} 
            {conversation.other_user?.prenoms && ` ${conversation.other_user.prenoms}`}
          </h3>
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-4 h-full">
        <div className="space-y-4">
          {currentMessages.map((message, index) => <div key={message.id_message} className={`flex ${message.id_expediteur === userId ? 'justify-end' : 'justify-start'}`}>
              <div className="flex max-w-[80%]">
                {message.id_expediteur !== userId && <div className="mr-2 mt-1">
                    <UserAvatar src={message.sender?.photo_profil} alt={message.sender?.nom || ""} size="sm" />
                  </div>}
                <div>
                  {message.contenu && <div className={`rounded-2xl px-4 py-2 inline-block ${message.id_expediteur === userId ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      {message.contenu}
                    </div>}
                  
                  {message.pieces_jointes && message.pieces_jointes.length > 0 && <div className="mt-2 space-y-2">
                      {message.pieces_jointes.map((attachment, i) => <div key={i} className="rounded-md overflow-hidden border border-border">
                          {isImageFile(attachment) ? <div className="relative">
                              <img src={getFileUrl(attachment)} alt="Attachment" className="max-w-[300px] max-h-[200px] object-contain bg-muted" />
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <a href={getFileUrl(attachment)} target="_blank" rel="noopener noreferrer" className="absolute top-2 right-2 p-1 bg-black/50 rounded-full">
                                      <ExternalLink className="h-4 w-4 text-white" />
                                    </a>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Ouvrir l'image</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div> : <a href={getFileUrl(attachment)} target="_blank" rel="noopener noreferrer" className={`flex items-center p-2 ${message.id_expediteur === userId ? 'bg-primary/10' : 'bg-muted'}`}>
                              <FileText className="h-5 w-5 mr-2" />
                              <span className="text-sm font-medium truncate">{getFileName(attachment)}</span>
                              <ExternalLink className="h-4 w-4 ml-2" />
                            </a>}
                        </div>)}
                    </div>}
                  
                  <div className="text-xs text-gray-500 mt-1">
                    {formatMessageDate(message.date_envoi)}
                  </div>
                </div>
              </div>
            </div>)}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      {attachments.length > 0 && <div className="p-2 border-t border-border bg-muted/30">
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, index) => <div key={index} className="flex items-center bg-background border rounded-md p-1.5 pr-2">
                {file.type.startsWith('image/') ? <Image className="h-4 w-4 mr-1" /> : <FileText className="h-4 w-4 mr-1" />}
                <span className="text-xs truncate max-w-[100px]">{file.name}</span>
                <Button type="button" variant="ghost" size="icon" className="h-5 w-5 ml-1 p-0" onClick={() => removeAttachment(index)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>)}
          </div>
        </div>}
      
      <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt" />
      
      <form onSubmit={handleSendMessage} className="p-4 border-t border-border sticky bottom-0 bg-white py-[8px] px-0">
        <div className="flex space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" variant="outline" size="icon" onClick={() => fileInputRef.current?.click()}>
                  <Paperclip className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Ajouter une pièce jointe</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Textarea placeholder="Écrivez un message..." value={newMessage} onChange={e => setNewMessage(e.target.value)} className="min-h-[50px] max-h-[120px] resize-none" onKeyDown={e => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (newMessage.trim() || attachments.length > 0) {
              handleSendMessage(e);
            }
          }
        }} />
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="submit" size="icon" disabled={isSendingMessage || !newMessage.trim() && attachments.length === 0}>
                  <Send className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Envoyer le message</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </form>
    </>;
};

export default ChatArea;
