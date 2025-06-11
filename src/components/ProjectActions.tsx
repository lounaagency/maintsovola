
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Heart, MessageCircle, Facebook, Mail, Share2, Link2 as LinkIcon, Smartphone } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { sendGroupedNotification } from '@/lib/groupedNotifications';

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
  const isMobile = useIsMobile();
  const { user } = useAuth();
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

  // Fonction pour gérer le like avec notification
  const handleLikeClick = async () => {
    if (!user) {
      toast.error("Vous devez être connecté pour aimer un projet");
      return;
    }

    try {
      if (!isLiked) {
        // Ajouter un like
        const { error } = await supabase
          .from('aimer_projet')
          .insert({ 
            id_projet: parseInt(projectId), 
            id_utilisateur: user.id 
          });
          
        if (error) throw error;

        // Récupérer le propriétaire du projet pour la notification
        const { data: projectData, error: projectError } = await supabase
          .from('projet')
          .select('id_tantsaha')
          .eq('id_projet', parseInt(projectId))
          .single();
          
        if (projectError) throw projectError;

        // Envoyer une notification groupée au propriétaire du projet
        if (projectData?.id_tantsaha) {
          await sendGroupedNotification({
            senderId: user.id,
            recipientId: projectData.id_tantsaha,
            entityType: 'projet',
            entityId: parseInt(projectId),
            action: 'like',
            projetId: parseInt(projectId)
          });
        }
      } else {
        // Supprimer le like
        const { error } = await supabase
          .from('aimer_projet')
          .delete()
          .match({ 
            id_projet: parseInt(projectId), 
            id_utilisateur: user.id 
          });
          
        if (error) throw error;
      }

      // Appeler le callback parent pour mettre à jour l'UI
      if (onLikeToggle) {
        onLikeToggle();
      }
    } catch (error) {
      console.error("Erreur lors de la gestion du like:", error);
      toast.error("Erreur lors de la gestion du like");
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
          {fundingGap > 0 ? "Investir" : "Financé"}
        </Button>
      )}
      
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          'flex items-center gap-1 text-sm font-normal',
          isLiked ? 'text-red-500' : 'text-muted-foreground'
        )}
        onClick={handleLikeClick}
      >
        <span>{likes > 0 ? likes : ''}</span>
        <Heart
          size={18}
          className={cn(isLiked && 'fill-red-500')}
        />
        <span className={isMobile ? 'sr-only' : ''}>Jaime{likes > 1 ? 's' : ''}</span>
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="flex items-center gap-1 text-sm font-normal text-muted-foreground"
        onClick={onOpenComments}
      >
        <span>{comments > 0 ? comments : ''}</span>
        <MessageCircle size={18} />
        <span className={isMobile ? 'sr-only' : ''}>Commentaire{comments > 0 ? 's' : ''}</span>
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
            <span className={isMobile ? 'sr-only' : ''}>Partager</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={shareHandlers.facebook} className="gap-2">
            <Facebook size={18} />
            Facebook
          </DropdownMenuItem>
          <DropdownMenuItem onClick={shareHandlers.whatsapp} className="gap-2">
            <Smartphone size={18} />
            WhatsApp
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={shareHandlers.mail} className="gap-2">
            <Mail size={18} />
            Email
          </DropdownMenuItem>
          <DropdownMenuItem onClick={shareHandlers.copyLink} className="gap-2">
            <LinkIcon size={18} />
            Copier le lien
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ProjectActions;
