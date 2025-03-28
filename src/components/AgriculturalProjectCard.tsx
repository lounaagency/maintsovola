import React, { useState, useEffect } from "react";
import { Heart, MessageCircle, Share, MoreHorizontal, MapPin } from "lucide-react";
import UserAvatar from "./UserAvatar";
import { AnimatePresence, motion } from "framer-motion";
import CommentSection from "./CommentSection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/lib/supabaseClient";

interface AgriculturalProject {
  id: string;
  titre: string;
  description: string;
  localisation: { commune: string; district: string; region: string };
  date_creation: string;
  surface_cultivable: number;
  type_culture: string;
  cout_exploitation: number;
  rendement_attendu: number;
  objectif_financement: number;
  financement_actuel: number;
  revenu_attendu: number;
  images: string[];
  agriculteur: { nom: string; pseudo: string; avatar: string };
  nombre_likes: number;
  est_aime: boolean;
  nombre_commentaires: number;
  nombre_partages: number;
}

const AgriculturalProjectCard: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [project, setProject] = useState<AgriculturalProject | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      const { data, error } = await supabase
        .from("projets")
        .select("*, localisation:localisations(commune, district, region), agriculteur:utilisateurs(nom, pseudo, avatar)")
        .eq("id", projectId)
        .single();

      if (error) {
        console.error("Erreur de chargement du projet:", error);
      } else {
        setProject(data);
        setLiked(data.est_aime);
        setLikeCount(data.nombre_likes);
      }
    };

    fetchProject();
  }, [projectId]);

  const handleLike = async () => {
    const newLikedState = !liked;
    setLiked(newLikedState);
    setLikeCount(newLikedState ? likeCount + 1 : likeCount - 1);
    await supabase.from("likes_projets").upsert({ projet_id: projectId, aime: newLikedState });
  };

  if (!project) return <div>Chargement...</div>;

  const fundingPercentage = (project.financement_actuel / project.objectif_financement) * 100;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <UserAvatar src={project.agriculteur.avatar} alt={project.agriculteur.nom} size="md" />
            <div className="ml-3">
              <div className="font-semibold text-sm text-gray-900">{project.agriculteur.nom}</div>
              <div className="text-xs text-gray-500">
                @{project.agriculteur.pseudo} · {new Date(project.date_creation).toLocaleDateString()}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
            <MoreHorizontal size={18} className="text-gray-500" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-2">{project.titre}</h3>
        <div className="mb-3 text-sm text-gray-800 leading-relaxed">{project.description}</div>
        <div className="space-y-2 mb-3">
          <div className="flex items-center text-xs text-gray-600">
            <MapPin size={14} className="mr-1" />
            <span>{project.localisation.commune}, {project.localisation.district}, {project.localisation.region}</span>
          </div>
        </div>
        <div className="mt-4 mb-2">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium">{project.financement_actuel.toLocaleString()} € collectés</span>
            <span className="text-gray-600">{fundingPercentage.toFixed(0)}%</span>
          </div>
          <Progress value={fundingPercentage} className="h-2" />
        </div>
        <Button className="w-full" size="sm">Investir dans ce projet</Button>
      </CardContent>
      <CardFooter className="flex items-center justify-between p-4 pt-0 border-t border-border">
        <button className={`like-button flex items-center text-sm font-medium p-1 rounded-full transition-colors ${liked ? 'liked text-red-500' : 'text-gray-600 hover:text-red-500'}`} onClick={handleLike}>
          <Heart size={18} className={`mr-1 ${liked ? 'fill-red-500 animate-heart-beat' : ''}`} />
          <span>{likeCount}</span>
        </button>
        <button className="flex items-center text-sm font-medium text-gray-600 p-1 rounded-full hover:text-primary transition-colors" onClick={() => setShowComments(!showComments)}>
          <MessageCircle size={18} className="mr-1" />
          <span>{project.nombre_commentaires}</span>
        </button>
        <button className="flex items-center text-sm font-medium text-gray-600 p-1 rounded-full hover:text-green-500 transition-colors">
          <Share size={18} className="mr-1" />
        </button>
      </CardFooter>
      <AnimatePresence>
        {showComments && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <CommentSection postId={project.id} />
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default AgriculturalProjectCard;
