
import React, { useState, useEffect } from "react";
import UserAvatar from "./UserAvatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Image, MapPin, Calendar } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { AgriculturalProject } from "@/types/agriculturalProject";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface NewProjectProps {
  onProjectCreated?: (project: AgriculturalProject) => void;
}

const NewProject: React.FC<NewProjectProps> = ({ onProjectCreated }) => {
  const [content, setContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [cultures, setCultures] = useState<{id: number, nom: string}[]>([]);
  const [selectedCulture, setSelectedCulture] = useState<number | null>(null);
  const { user, profile } = useAuth();
  
  useEffect(() => {
    // Récupérer la liste des cultures disponibles
    const fetchCultures = async () => {
      try {
        const { data, error } = await supabase
          .from('culture')
          .select('id_culture, nom_culture');
          
        if (error) throw error;
        
        setCultures(data.map(c => ({
          id: c.id_culture,
          nom: c.nom_culture
        })));
        
        if (data.length > 0) {
          setSelectedCulture(data[0].id_culture);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des cultures:", error);
      }
    };
    
    fetchCultures();
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Vous devez être connecté pour créer un projet");
      return;
    }
    
    if (!content.trim()) {
      toast.error("Veuillez décrire votre projet agricole");
      return;
    }
    
    if (!selectedCulture) {
      toast.error("Veuillez sélectionner une culture");
      return;
    }
    
    setIsPosting(true);
    
    try {
      // Récupérer les informations de la culture sélectionnée
      const { data: cultureData, error: cultureError } = await supabase
        .from('culture')
        .select('*')
        .eq('id_culture', selectedCulture)
        .single();
        
      if (cultureError) throw cultureError;
      
      // Créer un nouveau projet
      const newProject: AgriculturalProject = {
        id: Date.now().toString(),
        title: `Projet de culture de ${cultureData.nom_culture}`,
        farmer: {
          id: user.id,
          name: profile ? `${profile.nom} ${profile.prenoms || ''}`.trim() : 'Utilisateur',
          username: profile ? profile.nom.toLowerCase().replace(' ', '') : 'utilisateur',
          avatar: profile?.photo_profil,
        },
        location: {
          region: "À définir",
          district: "À définir",
          commune: "À définir"
        },
        cultivationArea: 2, // Valeur par défaut
        cultivationType: cultureData.nom_culture,
        farmingCost: cultureData.cout_exploitation_ha || 3000,
        expectedYield: cultureData.rendement_ha || 2,
        expectedRevenue: (cultureData.rendement_ha || 2) * 2 * (cultureData.prix_tonne || 1000),
        creationDate: new Date().toISOString().split('T')[0],
        images: [],
        description: content,
        fundingGoal: (cultureData.cout_exploitation_ha || 3000) * 2, // Surface par défaut * coût
        currentFunding: 0,
        likes: 0,
        comments: 0,
        shares: 0,
      };
      
      if (onProjectCreated) {
        onProjectCreated(newProject);
      }
      
      setContent("");
      toast.success("Projet créé avec succès!");
    } catch (error) {
      console.error("Erreur lors de la création du projet:", error);
      toast.error("Erreur lors de la création du projet");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <Card className="mb-4 overflow-hidden border-border">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit}>
          <div className="flex">
            <UserAvatar 
              src={profile?.photo_profil} 
              alt={profile?.nom || "Vous"} 
              size="md" 
            />
            <div className="ml-3 flex-1">
              <Textarea
                placeholder="Décrivez votre projet agricole..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="resize-none border-0 bg-transparent p-0 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                rows={3}
              />
              
              {cultures.length > 0 && (
                <div className="mt-2">
                  <select 
                    value={selectedCulture || ''} 
                    onChange={(e) => setSelectedCulture(parseInt(e.target.value))}
                    className="w-full p-2 border rounded text-sm"
                  >
                    <option value="">Sélectionnez une culture</option>
                    {cultures.map(culture => (
                      <option key={culture.id} value={culture.id}>
                        {culture.nom}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-between pt-3 border-t border-border">
            <div className="flex">
              <Button type="button" variant="ghost" size="sm" className="rounded-full text-gray-600">
                <Image size={18} className="mr-1" />
                <span className="text-xs">Photos</span>
              </Button>
              <Button type="button" variant="ghost" size="sm" className="rounded-full text-gray-600">
                <MapPin size={18} className="mr-1" />
                <span className="text-xs">Lieu</span>
              </Button>
              <Button type="button" variant="ghost" size="sm" className="rounded-full text-gray-600">
                <Calendar size={18} className="mr-1" />
                <span className="text-xs">Date</span>
              </Button>
            </div>
            
            <Button 
              type="submit" 
              size="sm" 
              className="rounded-full px-4"
              disabled={!content.trim() || isPosting || !user || !selectedCulture}
            >
              {isPosting ? "Publication..." : "Publier"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default NewProject;
