
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Heart, MessageCircle, Share2 } from 'lucide-react';

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
  onShare,
  className,
  canInvest,
  onInvest,
  fundingGap = 0
}) => {
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

      <Button
        variant="ghost"
        size="sm"
        className="flex items-center gap-1 text-sm font-normal text-muted-foreground"
        onClick={onShare}
      >
        <Share2 size={18} />
        <span>{shares > 0 ? shares : ''}</span>
      </Button>
    </div>
  );
};

export default ProjectActions;
