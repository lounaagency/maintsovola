
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
  className
}) => {
  return (
    <div className={cn('flex justify-between items-center py-2 px-1', className)}>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'flex items-center gap-1 text-sm font-normal',
          isLiked ? 'text-red-500' : 'text-muted-foreground'
        )}
        onClick={onLikeToggle}
      >
        <Heart
          size={18}
          className={cn(isLiked && 'fill-red-500')}
        />
        <span>{likes > 0 ? likes : ''}</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="flex items-center gap-1 text-sm font-normal text-muted-foreground"
        onClick={onOpenComments}
      >
        <MessageCircle size={18} />
        <span>{comments > 0 ? comments : ''}</span>
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
