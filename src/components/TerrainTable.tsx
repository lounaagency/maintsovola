
import React from "react";
import { TerrainData } from "@/types/terrain";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Check, User, Edit } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface TerrainTableProps {
  terrains: TerrainData[];
  type: 'validated' | 'pending';
  userRole?: string;
  onTerrainUpdate?: () => void;
  techniciens?: { id: string; nom: string; prenoms?: string }[];
}

const TerrainTable: React.FC<TerrainTableProps> = ({ 
  terrains, 
  type, 
  userRole, 
  onTerrainUpdate,
  techniciens 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleValidate = async (terrainId: number) => {
    try {
      const { error } = await supabase
        .from('terrain')
        .update({ 
          statut: true,
          surface_validee: terrains.find(t => t.id_terrain === terrainId)?.surface_proposee
        })
        .eq('id_terrain', terrainId);

      if (error) throw error;
      
      toast({
        title: "Succès",
        description: "Le terrain a été validé avec succès",
      });
      
      if (onTerrainUpdate) onTerrainUpdate();
    } catch (error) {
      console.error('Erreur lors de la validation du terrain:', error);
      toast({
        title: "Erreur",
        description: "Impossible de valider le terrain",
        variant: "destructive"
      });
    }
  };

  const handleAssignTechnicien = async (terrainId: number, technicienId: string) => {
    try {
      const { error } = await supabase
        .from('terrain')
        .update({ id_technicien: technicienId })
        .eq('id_terrain', terrainId);

      if (error) throw error;
      
      toast({
        title: "Succès",
        description: "Le technicien a été assigné avec succès",
      });
      
      if (onTerrainUpdate) onTerrainUpdate();
    } catch (error) {
      console.error('Erreur lors de l\'assignation du technicien:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'assigner le technicien",
        variant: "destructive"
      });
    }
  };

  const canEdit = (terrain: TerrainData): boolean => {
    if (userRole === 'superviseur') return true;
    if (userRole === 'technicien' && terrain.id_technicien === user?.id) return true;
    if (['agriculteur', 'investisseur'].includes(userRole || '') && terrain.id_tantsaha === user?.id) {
      // Vérifier si le terrain n'est pas dans un projet en cours
      // Cette logique serait idéalement implémentée avec une requête à la base de données
      return true; // Simplifié pour l'instant
    }
    return false;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Nom</TableHead>
            <TableHead>Région</TableHead>
            <TableHead>District</TableHead>
            <TableHead>Commune</TableHead>
            <TableHead>Surface</TableHead>
            <TableHead>Accès eau</TableHead>
            <TableHead>Accès route</TableHead>
            {type === 'pending' && userRole === 'superviseur' && (
              <TableHead>Technicien</TableHead>
            )}
            {type === 'validated' && (
              <TableHead>Surface validée</TableHead>
            )}
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {terrains.length > 0 ? (
            terrains.map((terrain) => (
              <TableRow key={terrain.id_terrain}>
                <TableCell>{terrain.id_terrain}</TableCell>
                <TableCell>{terrain.nom_terrain}</TableCell>
                <TableCell>{terrain.region_name}</TableCell>
                <TableCell>{terrain.district_name}</TableCell>
                <TableCell>{terrain.commune_name}</TableCell>
                <TableCell>{terrain.surface_proposee} ha</TableCell>
                <TableCell>{terrain.acces_eau ? "Oui" : "Non"}</TableCell>
                <TableCell>{terrain.acces_route ? "Oui" : "Non"}</TableCell>
                {type === 'pending' && userRole === 'superviseur' && (
                  <TableCell>
                    {terrain.id_technicien ? (
                      `${terrain.techniqueNom || 'Non spécifié'}`
                    ) : (
                      <select
                        className="border p-1 rounded-md w-full"
                        onChange={(e) => handleAssignTechnicien(terrain.id_terrain || 0, e.target.value)}
                      >
                        <option value="">Sélectionner un technicien</option>
                        {techniciens?.map((tech) => (
                          <option key={tech.id} value={tech.id}>
                            {tech.nom} {tech.prenoms || ''}
                          </option>
                        ))}
                      </select>
                    )}
                  </TableCell>
                )}
                {type === 'validated' && (
                  <TableCell>{terrain.surface_validee || terrain.surface_proposee} ha</TableCell>
                )}
                <TableCell className="flex gap-2">
                  {type === 'pending' && (userRole === 'technicien' || userRole === 'superviseur') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleValidate(terrain.id_terrain || 0)}
                      disabled={userRole === 'technicien' && terrain.id_technicien !== user?.id}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Valider
                    </Button>
                  )}
                  {canEdit(terrain) && (
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Modifier
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={type === 'pending' && userRole === 'superviseur' ? 9 : 8} className="text-center py-4">
                Aucun terrain {type === 'validated' ? 'validé' : 'en attente'} disponible
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default TerrainTable;
