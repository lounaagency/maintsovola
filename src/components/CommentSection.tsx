
import React, { useState, useEffect } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Reply } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Link } from "react-router-dom";

interface Comment {
  id: string;
  text: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
  likes: number;
  isLiked: boolean;
  parentId: string | null;
}

interface CommentSectionProps {
  postId: string;
}

const CommentSection: React.FC<CommentSectionProps> = ({ postId }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { user, profile } = useAuth();

  useEffect(() => {
    if (postId) {
      fetchComments();
    }
  }, [postId]);

  const fetchComments = async () => {
    if (!postId) return;
    
    try {
      setLoading(true);
      
      // Récupération des commentaires pour ce projet
      const { data: commentsData, error: commentsError } = await supabase
        .from('commentaire')
        .select(`
          id_commentaire,
          texte,
          date_creation,
          id_utilisateur,
          id_parent_commentaire,
          utilisateur:id_utilisateur(id_utilisateur, nom, prenoms, photo_profil)
        `)
        .eq('id_projet', parseInt(postId))
        .order('date_creation', { ascending: true });
        
      if (commentsError) throw commentsError;
      
      // Récupération des likes pour chaque commentaire
      const { data: likesData, error: likesError } = await supabase
        .from('aimer_commentaire')
        .select(`
          id_commentaire,
          id_utilisateur
        `);
        
      if (likesError) throw likesError;
      
      // Traitement des données pour créer les objets Comment
      const transformedComments = commentsData.map(comment => {
        // Nombre de likes pour ce commentaire
        const commentLikes = likesData.filter(like => like.id_commentaire === comment.id_commentaire).length;
        
        // Vérifier si l'utilisateur connecté a aimé ce commentaire
        const isLiked = user ? 
          likesData.some(like => like.id_commentaire === comment.id_commentaire && like.id_utilisateur === user.id) : 
          false;
        
        return {
          id: comment.id_commentaire.toString(),
          text: comment.texte,
          author: {
            id: comment.utilisateur.id_utilisateur,
            name: `${comment.utilisateur.nom} ${comment.utilisateur.prenoms || ''}`.trim(),
            avatar: comment.utilisateur.photo_profil,
          },
          createdAt: comment.date_creation,
          likes: commentLikes,
          isLiked,
          parentId: comment.id_parent_commentaire ? comment.id_parent_commentaire.toString() : null,
        };
      });
      
      setComments(transformedComments);
    } catch (error) {
      console.error("Erreur lors de la récupération des commentaires:", error);
      toast.error("Impossible de charger les commentaires");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!user) {
      toast.error("Vous devez être connecté pour commenter");
      return;
    }
    
    if (!newComment.trim()) {
      toast.error("Le commentaire ne peut pas être vide");
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('commentaire')
        .insert({
          texte: newComment,
          id_projet: parseInt(postId),
          id_utilisateur: user.id,
          id_parent_commentaire: replyingTo ? parseInt(replyingTo) : null,
          date_creation: new Date().toISOString(),
        })
        .select('id_commentaire')
        .single();
        
      if (error) throw error;
      
      // Ajouter le nouveau commentaire à la liste
      const newCommentObj: Comment = {
        id: data.id_commentaire.toString(),
        text: newComment,
        author: {
          id: user.id,
          name: profile ? `${profile.nom} ${profile.prenoms || ''}`.trim() : 'Utilisateur',
          avatar: profile?.photo_profil,
        },
        createdAt: new Date().toISOString(),
        likes: 0,
        isLiked: false,
        parentId: replyingTo,
      };
      
      setComments([...comments, newCommentObj]);
      setNewComment("");
      setReplyingTo(null);
      
      toast.success("Commentaire ajouté avec succès");
    } catch (error) {
      console.error("Erreur lors de l'ajout du commentaire:", error);
      toast.error("Erreur lors de l'ajout du commentaire");
    }
  };

  const handleToggleLike = async (commentId: string, isCurrentlyLiked: boolean) => {
    if (!user) {
      toast.error("Vous devez être connecté pour aimer un commentaire");
      return;
    }
    
    try {
      if (isCurrentlyLiked) {
        // Supprimer le like
        const { error } = await supabase
          .from('aimer_commentaire')
          .delete()
          .match({ 
            id_commentaire: parseInt(commentId), 
            id_utilisateur: user.id 
          });
          
        if (error) throw error;
      } else {
        // Ajouter un like
        const { error } = await supabase
          .from('aimer_commentaire')
          .insert({ 
            id_commentaire: parseInt(commentId), 
            id_utilisateur: user.id 
          });
          
        if (error) throw error;
      }
      
      // Mettre à jour l'état local
      setComments(comments.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            likes: isCurrentlyLiked ? comment.likes - 1 : comment.likes + 1,
            isLiked: !isCurrentlyLiked
          };
        }
        return comment;
      }));
    } catch (error) {
      console.error("Erreur lors de la gestion du like:", error);
      toast.error("Erreur lors de la gestion du like");
    }
  };

  const renderComment = (comment: Comment, isReply: boolean = false) => {
    const replies = comments.filter(c => c.parentId === comment.id);
    
    return (
      <div key={comment.id} className={`${isReply ? 'ml-8 mt-2' : 'mt-3'}`}>
        <div className="flex">
          <Avatar className="h-8 w-8">
            {comment.author.avatar && (
              <img src={comment.author.avatar} alt={comment.author.name} className="object-cover" />
            )}
          </Avatar>
          <div className="ml-2 flex-1">
            <div className="bg-muted p-2 rounded-lg">
              {/* Transformation du nom en lien vers le profil */}
              <div className="font-medium text-xs">
                <Link 
                  to={`/profile/${comment.author.id}`} 
                  className="hover:underline hover:text-primary transition-colors"
                >
                  {comment.author.name}
                </Link>
              </div>
              <div className="text-sm mt-1">{comment.text}</div>
            </div>
            <div className="flex items-center mt-1 text-xs text-gray-500">
              <span>{new Date(comment.createdAt).toLocaleString()}</span>
              <button 
                className={`ml-3 flex items-center ${comment.isLiked ? 'text-red-500' : ''}`}
                onClick={() => handleToggleLike(comment.id, comment.isLiked)}
              >
                <Heart size={12} className={`mr-1 ${comment.isLiked ? 'fill-red-500' : ''}`} />
                <span>{comment.likes > 0 ? comment.likes : ''}</span>
              </button>
              <button 
                className="ml-3 flex items-center"
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              >
                <Reply size={12} className="mr-1" />
                <span>Répondre</span>
              </button>
            </div>
            
            {replyingTo === comment.id && (
              <div className="mt-2">
                <Textarea 
                  value={newComment} 
                  onChange={(e) => setNewComment(e.target.value)} 
                  placeholder="Écrire une réponse..."
                  className="min-h-[60px] text-sm"
                />
                <div className="flex justify-end mt-1">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="mr-2"
                    onClick={() => setReplyingTo(null)}
                  >
                    Annuler
                  </Button>
                  <Button 
                    size="sm"
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim()}
                  >
                    Répondre
                  </Button>
                </div>
              </div>
            )}
            
            {replies.length > 0 && (
              <div className="mt-1">
                {replies.map(reply => renderComment(reply, true))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const rootComments = comments.filter(comment => !comment.parentId);

  return (
    <div className="px-4 pb-4 border-t border-border pt-3">
      <div className="flex items-start mb-4">
        {user && profile ? (
          <Avatar className="h-8 w-8 mr-2">
            {profile.photo_profil && (
              <img src={profile.photo_profil} alt={profile.nom} className="object-cover" />
            )}
          </Avatar>
        ) : (
          <Avatar className="h-8 w-8 mr-2" />
        )}
        <div className="flex-1">
          <Textarea 
            value={newComment} 
            onChange={(e) => setNewComment(e.target.value)} 
            placeholder="Ajouter un commentaire..."
            className="min-h-[60px] text-sm"
          />
          <div className="flex justify-end mt-1">
            <Button 
              size="sm"
              onClick={handleSubmitComment}
              disabled={!newComment.trim() || !user}
            >
              Commenter
            </Button>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-1">
          {rootComments.length > 0 ? (
            rootComments.map(comment => renderComment(comment))
          ) : (
            <div className="text-center text-gray-500 text-sm py-3">
              Soyez le premier à commenter
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentSection;
