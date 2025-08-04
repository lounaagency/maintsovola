import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import UserAvatar from './UserAvatar';

interface MessageBubbleProps {
  message: {
    id_message: number;
    contenu: string;
    date_envoi: string;
    id_expediteur: string;
    pieces_jointes?: string[];
  };
  sender?: {
    id_utilisateur: string;
    nom: string;
    prenoms: string | null;
    photo_profil: string | null;
  };
  isOwn: boolean;
  isGrouped?: boolean;
  position?: 'first' | 'middle' | 'last' | 'single';
  showAvatar?: boolean;
  showTimestamp?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  sender,
  isOwn,
  isGrouped = false,
  position = 'single',
  showAvatar = true,
  showTimestamp = true
}) => {
  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: fr });
    } catch (error) {
      return '';
    }
  };

  const getBubbleClasses = () => {
    const baseClasses = "px-4 py-2 max-w-[70%] break-words";
    
    if (isOwn) {
      return `${baseClasses} message-bubble-sent ml-auto ${position === 'single' ? 'message-group-single' : 
        position === 'first' ? 'message-group-first sent' :
        position === 'middle' ? 'message-group-middle sent' :
        'message-group-last sent'}`;
    } else {
      return `${baseClasses} message-bubble-received ${position === 'single' ? 'message-group-single' : 
        position === 'first' ? 'message-group-first' :
        position === 'middle' ? 'message-group-middle' :
        'message-group-last'}`;
    }
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1 ${isGrouped ? 'mt-1' : 'mt-4'}`}>
      {!isOwn && showAvatar && (
        <div className={`mr-2 ${isGrouped ? 'invisible' : ''}`}>
          <UserAvatar
            src={sender?.photo_profil}
            alt={`${sender?.nom} ${sender?.prenoms || ''}`}
            className="w-8 h-8"
          />
        </div>
      )}
      
      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        <div className={getBubbleClasses()}>
          <p className="text-sm leading-relaxed">{message.contenu}</p>
          
          {/* Attachments */}
          {message.pieces_jointes && message.pieces_jointes.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.pieces_jointes.map((attachment, index) => (
                <div key={index} className="text-xs opacity-75">
                  📎 Pièce jointe: {attachment}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {showTimestamp && (
          <div className={`text-xs text-muted-foreground mt-1 px-1 ${isOwn ? 'text-right' : 'text-left'}`}>
            {formatTime(message.date_envoi)}
          </div>
        )}
      </div>
      
      {isOwn && showAvatar && (
        <div className="ml-2 w-8 h-8"> {/* Placeholder for consistency */}
        </div>
      )}
    </div>
  );
};

export default MessageBubble;