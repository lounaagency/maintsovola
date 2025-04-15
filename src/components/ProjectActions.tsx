
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

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
  fundingGap?: number; // Making this optional with a default value
}

const ProjectActions: React.FC<ProjectActionsProps> = ({
  projectId,
  likes,
  comments,
  shares,
  isLiked = false,
  onLikeToggle,
  onOpenComments,
  onShare,
  className,
  canInvest,
  onInvest,
  fundingGap = 0 // Default value
}) => {
  const handleShare = (platform: string) => {
    const projectUrl = `${window.location.origin}/projects?id=${projectId}`;
    let shareUrl = '';
    
    switch (platform) {
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(`Découvrez ce projet agricole: ${projectUrl}`)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(projectUrl)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(projectUrl)}&text=${encodeURIComponent('Découvrez ce projet agricole')}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent('Projet agricole intéressant')}&body=${encodeURIComponent(`Découvrez ce projet agricole: ${projectUrl}`)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(projectUrl);
        if (onShare) onShare();
        return;
      default:
        if (onShare) onShare();
        return;
    }
    
    // Ouvrir dans une nouvelle fenêtre
    window.open(shareUrl, '_blank');
    if (onShare) onShare();
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
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleShare('whatsapp')}>
            Partager sur WhatsApp
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShare('facebook')}>
            Partager sur Facebook
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShare('twitter')}>
            Partager sur Twitter
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShare('email')}>
            Partager par email
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleShare('copy')}>
            Copier le lien
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ProjectActions;
