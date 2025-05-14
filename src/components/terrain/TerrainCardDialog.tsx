
import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import TerrainCard from '@/components/terrain/TerrainCard';
import { TerrainData } from "@/types/terrain";

interface TerrainCardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  terrainId: number;
}

const TerrainCardDialog: React.FC<TerrainCardDialogProps> = ({
  isOpen,
  onClose,
  terrainId
}) => {
  const [loading, setLoading] = useState(true);
  const [terrain, setTerrain] = useState<TerrainData | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && terrainId) {
      fetchTerrainDetails();
    }
  }, [isOpen, terrainId]);

  const fetchTerrainDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('terrain')
        .select(`
          *,
          region:id_region(nom_region),
          district:id_district(nom_district),
          commune:id_commune(nom_commune),
          tantsaha:id_tantsaha(nom, prenoms),
          superviseur:id_superviseur(nom, prenoms),
          technicien:id_technicien(nom, prenoms)
        `)
        .eq('id_terrain', terrainId)
        .single();
      
      if (error) throw error;
      
      // Format any field names needed
      const formattedData = {
        ...data,
        region_name: data.region?.nom_region,
        district_name: data.district?.nom_district,
        commune_name: data.commune?.nom_commune,
        tantsahaNom: data.tantsaha ? `${data.tantsaha.nom} ${data.tantsaha.prenoms || ''}`.trim() : undefined,
        techniqueNom: data.technicien ? `${data.technicien.nom} ${data.technicien.prenoms || ''}`.trim() : 'Non assigné',
        superviseurNom: data.superviseur ? `${data.superviseur.nom} ${data.superviseur.prenoms || ''}`.trim() : 'Non assigné',
      };
      
      setTerrain(formattedData as TerrainData);
    } catch (error) {
      console.error('Error fetching terrain details:', error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les détails du terrain",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // If not open or no terrain data, don't render anything
  if (!isOpen || !terrainId) {
    return null;
  }

  // If loading or no terrain data yet, just return the closed TerrainCard
  if (loading || !terrain) {
    return null;
  }

  return (
    <TerrainCard
      isOpen={isOpen}
      onClose={onClose}
      terrain={terrain}
      userRole="simple" // Using 'simple' as default, could be passed as prop if needed
    />
  );
};

export default TerrainCardDialog;
