import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Heart, MessageCircle, Facebook, Mail, Share2, Link, Whatsapp } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from 'sonner';

interface ProjectActionsProps {
  projectId: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked?: boolean;
  onLikeToggle?: () => void;
  onOpenComments?: () => void;
  onShare?: () => void;
  className?: string;
  canInvest?: boolean;
  onInvest?: () => void;
  fundingGap: number;
}

const ProjectActions: React.FC<ProjectActionsProps> = ({
  projectId,
  likes,
  comments,
  shares,
  isLiked = false,
  onLikeToggle,
  onOpenComments,
  className,
  canInvest,
  onInvest,
  fundingGap = 0
}) => {
  const projectUrl = `${window.location.origin}/feed?id_projet=${projectId}`;
  
  const shareHandlers = {
    facebook: () => {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(projectUrl)}`, '_blank');
    },
    whatsapp: () => {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(projectUrl)}`, '_blank');
    },
    mail: () => {
      window.open(`mailto:?body=${encodeURIComponent(projectUrl)}`, '_blank');
    },
    copyLink: () => {
      navigator.clipboard.writeText(projectUrl).then(() => {
        toast.success("Lien copié !");
      });
    }
  };

  return (      
    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
      {canInvest && (
        <Button 
          size="sm" 
          className="text-xs" 
          onClick={onInvest}
          disabled={fundingGap === 0}
        >
          {fundingGap > 0 ? "S'investir" : "Financé"}
        </Button>
      )}
      
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'flex items-center gap-1 text-sm font-normal',
          isLiked ? 'text-red-500' : 'text-muted-foreground'
        )}
        onClick={onLikeToggle}
      >
        <span>{likes > 0 ? likes : ''}</span>
        <Heart
          size={18}
          className={cn(isLiked && 'fill-red-500')}
        />
        <span>Jaime{likes > 1 ? 's' : ''}</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="flex items-center gap-1 text-sm font-normal text-muted-foreground"
        onClick={onOpenComments}
      >
        <span>{comments > 0 ? comments : ''}</span>
        <MessageCircle size={18} />
        <span>Commentaire{comments > 0 ? 's' : ''}</span>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-1 text-sm font-normal text-muted-foreground"
          >
            <Share2 size={18} />
            <span>{shares > 0 ? shares : ''}</span>
            <span>Partager</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={shareHandlers.facebook} className="gap-2">
            <Facebook size={18} />
            Facebook
          </DropdownMenuItem>
          <DropdownMenuItem onClick={shareHandlers.whatsapp} className="gap-2">
            <Whatsapp size={18} />
            WhatsApp
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={shareHandlers.mail} className="gap-2">
            <Mail size={18} />
            Email
          </DropdownMenuItem>
          <DropdownMenuItem onClick={shareHandlers.copyLink} className="gap-2">
            <Link size={18} />
            Copier le lien
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ProjectActions;
