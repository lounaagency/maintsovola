import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip, Smile } from 'lucide-react';
import { motion } from 'framer-motion';

interface MessengerInputProps {
  onSendMessage: (message: string, attachments?: File[]) => void;
  onTyping?: (isTyping: boolean) => void;
  disabled?: boolean;
  placeholder?: string;
}

const MessengerInput: React.FC<MessengerInputProps> = ({
  onSendMessage,
  onTyping,
  disabled = false,
  placeholder = "Tapez un message..."
}) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleSend = useCallback(() => {
    if (message.trim() || attachments.length > 0) {
      onSendMessage(message.trim(), attachments);
      setMessage('');
      setAttachments([]);
      onTyping?.(false);
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  }, [message, attachments, onSendMessage, onTyping]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    
    // Trigger typing indicator
    onTyping?.(value.length > 0);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="border-t border-border bg-background p-4">
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {attachments.map((file, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2"
            >
              <span className="text-sm text-muted-foreground truncate max-w-[150px]">
                {file.name}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                onClick={() => removeAttachment(index)}
              >
                ×
              </Button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2">
        {/* Attachment Button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 p-0 text-[hsl(var(--messenger-blue))] hover:bg-[hsl(var(--messenger-blue))]/10"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        {/* Message Input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={disabled}
            className="min-h-[40px] max-h-[120px] resize-none rounded-2xl border-border bg-muted px-4 py-2 focus:border-[hsl(var(--messenger-blue))] focus:ring-[hsl(var(--messenger-blue))] placeholder:text-muted-foreground"
            style={{ paddingRight: '50px' }}
          />
          
          {/* Emoji Button - could be expanded later */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 text-muted-foreground hover:text-[hsl(var(--messenger-blue))]"
            disabled={disabled}
          >
            <Smile className="h-4 w-4" />
          </Button>
        </div>

        {/* Send Button */}
        <Button
          onClick={handleSend}
          disabled={disabled || (!message.trim() && attachments.length === 0)}
          className="h-9 w-9 p-0 rounded-full bg-[hsl(var(--messenger-blue))] hover:bg-[hsl(var(--messenger-blue))]/90 text-white"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileSelect}
        accept="image/*,application/pdf,.doc,.docx,.txt"
      />
    </div>
  );
};

export default MessengerInput;