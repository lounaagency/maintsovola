
import React, { useState } from "react";
import { TrashIcon, PencilIcon, MessageSquareIcon, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TerrainData } from "@/types/terrain";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TerrainTableProps {
  terrains: TerrainData[];
  type: "pending" | "validated";
  userRole?: string;
  onEdit?: (terrain: TerrainData) => void;
  onTerrainUpdate?: () => void;
  onContactTechnicien?: (terrain: TerrainData) => void;
  techniciens?: { id_utilisateur: string; nom: string; prenoms?: string }[];
}

const TerrainTable: React.FC<TerrainTableProps> = ({
  terrains,
  type,
  userRole,
  onEdit,
  onTerrainUpdate,
  onContactTechnicien,
  techniciens,
}) => {
  const [assignTechnicienId, setAssignTechnicienId] = useState<string>("");
  const [pendingUpdate, setPendingUpdate] = useState<boolean>(false);

  const handleDeleteTerrain = async (terrainId: number | undefined) => {
    if (!terrainId) return;

    try {
      setPendingUpdate(true);
      const { error } = await supabase
        .from("terrain")
        .update({ archive: true })
        .eq("id_terrain", terrainId);

      if (error) throw error;

      toast.success("Terrain supprimé avec succès");
      if (onTerrainUpdate) onTerrainUpdate();
    } catch (error) {
      console.error("Error deleting terrain:", error);
      toast.error("Erreur lors de la suppression du terrain");
    } finally {
      setPendingUpdate(false);
    }
  };

  const handleAssignTechnicien = async (terrainId: number | undefined) => {
    if (!terrainId || !assignTechnicienId) return;

    try {
      setPendingUpdate(true);
      const { error } = await supabase
        .from("terrain")
        .update({ id_technicien: assignTechnicienId })
        .eq("id_terrain", terrainId);

      if (error) throw error;

      toast.success("Technicien assigné avec succès");
      if (onTerrainUpdate) onTerrainUpdate();
    } catch (error) {
      console.error("Error assigning technician:", error);
      toast.error("Erreur lors de l'assignation du technicien");
    } finally {
      setPendingUpdate(false);
      setAssignTechnicienId("");
    }
  };

  const handleValidateTerrain = async (terrainId: number | undefined) => {
    if (!terrainId) return;

    try {
      setPendingUpdate(true);
      const { error } = await supabase
        .from("terrain")
        .update({ statut: true })
        .eq("id_terrain", terrainId);

      if (error) throw error;

      toast.success("Terrain validé avec succès");
      if (onTerrainUpdate) onTerrainUpdate();
    } catch (error) {
      console.error("Error validating terrain:", error);
      toast.error("Erreur lors de la validation du terrain");
    } finally {
      setPendingUpdate(false);
    }
  };

  if (terrains.length === 0) {
    return (
      <div className="text-center py-8 border rounded-md border-dashed">
        <p className="text-gray-500">Aucun terrain {type === "pending" ? "en attente" : "validé"}</p>
      </div>
    );
  }

  const renderTerrainTableHeader = () => (
    <thead>
      <tr className="border-b bg-muted/50">
        <th className="text-left p-2">Nom</th>
        <th className="text-left p-2">Surface (ha)</th>
        <th className="text-left p-2">Localisation</th>
        {userRole === "superviseur" && type === "pending" && (
          <th className="text-left p-2">Technicien</th>
        )}
        {type === "validated" && <th className="text-left p-2">Technicien</th>}
        <th className="text-right p-2">Actions</th>
      </tr>
    </thead>
  );

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        {renderTerrainTableHeader()}
        <tbody>
          {terrains.map((terrain) => (
            <tr key={terrain.id_terrain} className="border-b hover:bg-muted/50">
              <td className="p-2">{terrain.nom_terrain}</td>
              <td className="p-2">{terrain.surface_proposee}</td>
              <td className="p-2">
                {terrain.commune_name && terrain.district_name && terrain.region_name
                  ? `${terrain.commune_name}, ${terrain.district_name}, ${terrain.region_name}`
                  : "Non spécifié"}
              </td>

              {/* Technicien column for supervisor (pending terrains) */}
              {userRole === "superviseur" && type === "pending" && (
                <td className="p-2">
                  {terrain.id_technicien ? (
                    terrain.techniqueNom || "Assigné"
                  ) : techniciens ? (
                    <Select
                      value={assignTechnicienId}
                      onValueChange={(value) => setAssignTechnicienId(value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Assigner..." />
                      </SelectTrigger>
                      <SelectContent>
                        {techniciens.map((tech) => (
                          <SelectItem key={tech.id_utilisateur} value={tech.id_utilisateur}>
                            {tech.nom} {tech.prenoms || ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    "Non assigné"
                  )}
                </td>
              )}

              {/* Technicien column for validated terrains */}
              {type === "validated" && (
                <td className="p-2">{terrain.techniqueNom || "Non assigné"}</td>
              )}

              <td className="p-2 text-right space-x-1 whitespace-nowrap">
                {/* Edit button */}
                {onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(terrain)}
                    className="px-2"
                  >
                    <PencilIcon className="h-4 w-4" />
                    <span className="sr-only">Modifier</span>
                  </Button>
                )}

                {/* Assign technicien button for superviseur */}
                {userRole === "superviseur" &&
                  type === "pending" &&
                  !terrain.id_technicien &&
                  assignTechnicienId && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleAssignTechnicien(terrain.id_terrain)}
                      disabled={pendingUpdate}
                      className="px-2"
                    >
                      <Check className="h-4 w-4" />
                      <span className="sr-only">Assigner</span>
                    </Button>
                  )}

                {/* Validate button for technicien and superviseur */}
                {((userRole === "technicien" && terrain.id_technicien) ||
                  (userRole === "superviseur" && terrain.id_technicien)) &&
                  type === "pending" && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleValidateTerrain(terrain.id_terrain)}
                      disabled={pendingUpdate}
                    >
                      Valider
                    </Button>
                  )}

                {/* Delete button */}
                {((userRole === "simple" && type === "pending") ||
                  userRole === "technicien") && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="px-2">
                        <TrashIcon className="h-4 w-4 text-destructive" />
                        <span className="sr-only">Supprimer</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmation</AlertDialogTitle>
                        <AlertDialogDescription>
                          Êtes-vous sûr de vouloir supprimer ce terrain ?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => handleDeleteTerrain(terrain.id_terrain)}
                        >
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

                {/* Contact technicien button */}
                {type === "validated" &&
                  userRole === "simple" &&
                  onContactTechnicien && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onContactTechnicien(terrain)}
                    >
                      <MessageSquareIcon className="h-4 w-4 mr-1" />
                      Contact
                    </Button>
                  )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TerrainTable;
