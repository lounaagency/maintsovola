
import React, { useState, useEffect, useRef } from "react";
import UserAvatar from "./UserAvatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Image, MapPin, Calendar, Upload, X, Loader2 } from "lucide-react";
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
  const [terrains, setTerrains] = useState<{id: number, nom: string, surface: number}[]>([]);
  const [selectedTerrain, setSelectedTerrain] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { user, profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('utilisateurs_par_role')
            .select('nom_role')
            .eq('id_utilisateur', user.id)
            .single();
            
          if (error) throw error;
          
          if (data) {
            setUserRole(data.nom_role);
          }
        } catch (error) {
          console.error("Erreur lors de la récupération du rôle de l'utilisateur:", error);
        }
      }
    };
    
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
    
    const fetchTerrains = async () => {
      if (user) {
        try {
          let query = supabase
            .from('terrain')
            .select('id_terrain, surface_validee');
          
          if (userRole === 'superviseur') {
            query = query.eq('statut', true);
          } else if (userRole === 'technicien') {
            query = query.eq('id_technicien', user.id);
          } else {
            query = query.eq('id_tantsaha', user.id).eq('statut', true);
          }
          
          const { data, error } = await query;
          
          if (error) throw error;
          
          if (data && data.length > 0) {
            setTerrains(data.map(t => ({
              id: t.id_terrain,
              nom: `Terrain #${t.id_terrain}`,
              surface: t.surface_validee
            })));
            setSelectedTerrain(data[0].id_terrain);
          }
        } catch (error) {
          console.error("Erreur lors de la récupération des terrains:", error);
        }
      }
    };
    
    fetchUserRole();
    fetchCultures();
    
    if (user) {
      fetchTerrains();
    }
  }, [user, userRole]);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const selectedFiles = Array.from(e.target.files);
    setPhotos(prevPhotos => [...prevPhotos, ...selectedFiles]);
    
    // Create preview URLs
    selectedFiles.forEach(file => {
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreviewUrls(prevUrls => [...prevUrls, previewUrl]);
    });
  };

  const removePhoto = (index: number) => {
    setPhotos(prevPhotos => {
      const newPhotos = [...prevPhotos];
      newPhotos.splice(index, 1);
      return newPhotos;
    });

    setPhotoPreviewUrls(prevUrls => {
      const newUrls = [...prevUrls];
      URL.revokeObjectURL(newUrls[index]); // Clean up object URL
      newUrls.splice(index, 1);
      return newUrls;
    });
  };

  const uploadPhotos = async (): Promise<string[]> => {
    if (photos.length === 0) return [];
    
    setIsUploading(true);
    const uploadedUrls: string[] = [];
    
    try {
      for (const photo of photos) {
        const fileExt = photo.name.split('.').pop();
        const fileName = `project-${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `project-photos/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('project-photos')
          .upload(filePath, photo);
          
        if (uploadError) {
          console.error("Error uploading photo:", uploadError);
          continue;
        }
        
        const { data: publicUrlData } = supabase.storage
          .from('project-photos')
          .getPublicUrl(filePath);
          
        if (publicUrlData) {
          uploadedUrls.push(publicUrlData.publicUrl);
        }
      }
      
      return uploadedUrls;
    } catch (error) {
      console.error("Error in photo upload process:", error);
      return [];
    } finally {
      setIsUploading(false);
    }
  };

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
    
    if (!selectedTerrain) {
      toast.error("Veuillez sélectionner un terrain");
      return;
    }
    
    setIsPosting(true);
    
    try {
      // Upload photos first
      const uploadedPhotoUrls = await uploadPhotos();
      
      const { data: cultureData, error: cultureError } = await supabase
        .from('culture')
        .select('*')
        .eq('id_culture', selectedCulture)
        .single();
        
      if (cultureError) throw cultureError;
      
      const { data: terrainData, error: terrainError } = await supabase
        .from('terrain')
        .select('*')
        .eq('id_terrain', selectedTerrain)
        .single();
        
      if (terrainError) throw terrainError;
      
      const { data: projetData, error: projetError } = await supabase
        .from('projet')
        .insert({
          id_terrain: selectedTerrain,
          id_tantsaha: user.id,
          surface_ha: terrainData.surface_validee,
          statut: 'en attente',
          id_region: terrainData.id_region,
          id_district: terrainData.id_district,
          id_commune: terrainData.id_commune,
          description: content,
          photos: uploadedPhotoUrls.join(',')
        })
        .select('id_projet')
        .single();
        
      if (projetError) throw projetError;
      
      const { error: projetCultureError } = await supabase
        .from('projet_culture')
        .insert({
          id_projet: projetData.id_projet,
          id_culture: selectedCulture,
          cout_exploitation_previsionnel: cultureData.cout_exploitation_ha,
          rendement_previsionnel: cultureData.rendement_ha,
          date_debut_previsionnelle: new Date().toISOString().split('T')[0]
        });
        
      if (projetCultureError) throw projetCultureError;
      
      const newProject: AgriculturalProject = {
        id: projetData.id_projet.toString(),
        title: `Projet de culture de ${cultureData.nom_culture}`,
        farmer: {
          id: user.id,
          name: profile ? `${profile.nom} ${profile.prenoms || ''}`.trim() : 'Utilisateur',
          username: profile ? profile.nom.toLowerCase().replace(/\s+/g, '') : 'utilisateur',
          avatar: profile?.photo_profil,
        },
        location: {
          region: terrainData.id_region ? "À définir" : "À définir",
          district: terrainData.id_district ? "À définir" : "À définir",
          commune: terrainData.id_commune ? "À définir" : "À définir"
        },
        cultivationArea: terrainData.surface_validee,
        cultivationType: cultureData.nom_culture,
        farmingCost: cultureData.cout_exploitation_ha || 3000,
        expectedYield: cultureData.rendement_ha || 2,
        expectedRevenue: (cultureData.rendement_ha || 2) * terrainData.surface_validee * (cultureData.prix_tonne || 1000),
        creationDate: new Date().toISOString().split('T')[0],
        images: uploadedPhotoUrls,
        description: content,
        fundingGoal: (cultureData.cout_exploitation_ha || 3000) * terrainData.surface_validee,
        currentFunding: 0,
        likes: 0,
        comments: 0,
        shares: 0,
      };
      
      if (onProjectCreated) {
        onProjectCreated(newProject);
      }
      
      setContent("");
      setPhotoPreviewUrls([]);
      setPhotos([]);
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
              
              {terrains.length > 0 && (
                <div className="mt-2">
                  <select 
                    value={selectedTerrain || ''} 
                    onChange={(e) => setSelectedTerrain(parseInt(e.target.value))}
                    className="w-full p-2 border rounded text-sm mb-2"
                  >
                    <option value="">Sélectionnez un terrain</option>
                    {terrains.map(terrain => (
                      <option key={terrain.id} value={terrain.id}>
                        {terrain.nom} ({terrain.surface} ha)
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
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
              
              {/* Photo preview area */}
              {photoPreviewUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {photoPreviewUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={url} 
                        alt={`Preview ${index + 1}`} 
                        className="h-20 w-full object-cover rounded border border-border"
                      />
                      <button
                        type="button"
                        className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removePhoto(index)}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-between pt-3 border-t border-border">
            <div className="flex">
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                className="rounded-full text-gray-600"
                onClick={() => fileInputRef.current?.click()}
              >
                <Image size={18} className="mr-1" />
                <span className="text-xs">Photos</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
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
              disabled={!content.trim() || isPosting || isUploading || !user || !selectedCulture || !selectedTerrain}
            >
              {isPosting || isUploading ? (
                <div className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isUploading ? "Upload..." : "Publication..."}
                </div>
              ) : "Publier"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default NewProject;
