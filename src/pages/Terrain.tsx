
import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { TerrainData } from "@/types/terrain";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Copy, Edit, Trash2, MapPin, MessageSquare, UserPlus, User, CheckCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
} from "@/components/ui/alert-dialog"
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import TerrainEditDialog from "@/components/TerrainEditDialog";
import MessageDialog from "@/components/MessageDialog";

const ITEMS_PER_PAGE = 10;

const Terrain: React.FC = () => {
  const [terrains, setTerrains] = useState<TerrainData[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedTerrain, setSelectedTerrain] = useState<TerrainData | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showContactTechnicianDialog, setShowContactTechnicianDialog] = useState(false);
  const [agriculteurs, setAgriculteurs] = useState<{ id_utilisateur: string; nom: string; prenoms?: string }[]>([]);
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      let query = supabase
        .from('terrain')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (search) {
        query = query.ilike('nom_terrain', `%${search}%`);
      }

      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      query = query.range(startIndex, startIndex + ITEMS_PER_PAGE - 1);

      if (profile?.id_role === 2) {
        query = query.eq('id_tantsaha', user.id);
      } else if (profile?.id_role === 3 || profile?.id_role === 4) {
        query = query.eq('id_technicien', user.id);
      }

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      setTerrains(data || []);
      setTotalItems(count || 0);
      setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));
    } catch (error: any) {
      console.error("Error fetching terrains:", error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, user, profile]);

  const fetchAgriculteurs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('utilisateur')
        .select('id_utilisateur, nom, prenoms')
        .eq('id_role', 2);

      if (error) {
        throw error;
      }

      setAgriculteurs(data || []);
    } catch (error: any) {
      console.error("Error fetching agriculteurs:", error);
      toast.error(error.message);
    }
  }, []);

  useEffect(() => {
    fetchData();
    if (profile?.id_role === 3 || profile?.id_role === 4) {
      fetchAgriculteurs();
    }
  }, [fetchData, fetchAgriculteurs, profile?.id_role]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleDelete = async () => {
    if (!selectedTerrain) return;

    try {
      const { error } = await supabase
        .from('terrain')
        .delete()
        .eq('id_terrain', selectedTerrain.id_terrain);

      if (error) {
        throw error;
      }

      handleDeleteSuccess();
    } catch (error: any) {
      console.error("Error deleting terrain:", error);
      toast.error(error.message);
    } finally {
      setShowDeleteConfirmation(false);
    }
  };

  const handleDeleteSuccess = () => {
    toast.success("Terrain supprimé avec succès");
    setTerrains(terrains.filter(terrain => terrain.id_terrain !== selectedTerrain?.id_terrain));
    setSelectedTerrain(null);
  };

  const handleEditSuccess = () => {
    setShowEditDialog(false);
    fetchData();
  };

  const handleContactTechnician = (terrain: TerrainData) => {
    setSelectedTerrain(terrain);
    setShowContactTechnicianDialog(true);
  };

  const handleCloseContactTechnicianDialog = () => {
    setShowContactTechnicianDialog(false);
    setSelectedTerrain(null);
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copié dans le presse-papier !");
  };

  const getStatusBadge = (statut: boolean | undefined) => {
    if (statut === undefined) {
      return <Badge variant="outline">Inconnu</Badge>;
    } else if (statut) {
      return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="mr-2 h-4 w-4" />Validé</Badge>;
    } else {
      return <Badge variant="destructive"><AlertCircle className="mr-2 h-4 w-4" />Non validé</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Terrains</h1>
        <Input
          type="search"
          placeholder="Rechercher un terrain..."
          value={search}
          onChange={handleSearchChange}
          className="max-w-md"
        />
      </div>

      <div className="mb-4">
        <Button onClick={() => setShowEditDialog(true)}>Ajouter un Terrain</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="rounded-md border">
          <ScrollArea>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Nom</TableHead>
                  <TableHead>Surface (ha)</TableHead>
                  <TableHead>Région</TableHead>
                  <TableHead>Commune</TableHead>
                  <TableHead>Date de création</TableHead>
                  <TableHead>Statut</TableHead>
                  {profile?.id_role !== 2 && <TableHead>Propriétaire</TableHead>}
                  {profile?.id_role !== 2 && <TableHead>Technicien</TableHead>}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {terrains.map((terrain) => (
                  <TableRow key={terrain.id_terrain}>
                    <TableCell className="font-medium">{terrain.nom_terrain}</TableCell>
                    <TableCell>{terrain.surface_proposee}</TableCell>
                    <TableCell>{terrain.region_name}</TableCell>
                    <TableCell>{terrain.commune_name}</TableCell>
                    <TableCell>{format(new Date(terrain.created_at || ''), 'dd MMMM yyyy', { locale: fr })}</TableCell>
                    <TableCell>{getStatusBadge(terrain.statut)}</TableCell>
                    {profile?.id_role !== 2 && <TableHead>{terrain.techniqueNom} {terrain.techniquePrenoms}</TableHead>}
                    {profile?.id_role !== 2 && <TableHead>{terrain.techniqueNom} {terrain.techniquePrenoms}</TableHead>}
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Ouvrir le menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleCopyToClipboard(window.location.origin + `/terrain?id=${terrain.id_terrain}`)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copier le lien
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/terrain/${terrain.id_terrain}`)}>
                            <MapPin className="mr-2 h-4 w-4" />
                            Voir sur la carte
                          </DropdownMenuItem>
                          {profile?.id_role !== 2 && (
                            <DropdownMenuItem onClick={() => handleContactTechnician(terrain)}>
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Contacter le technicien
                            </DropdownMenuItem>
                          )}
                          {(profile?.id_role === 1 || profile?.id_role === 3 || profile?.id_role === 4) && (
                            <>
                              <DropdownMenuItem onClick={() => {
                                setSelectedTerrain(terrain);
                                setShowEditDialog(true);
                              }}>
                                <Edit className="mr-2 h-4 w-4" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => {
                                setSelectedTerrain(terrain);
                                setShowDeleteConfirmation(true);
                              }}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Supprimer
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={9}>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total: {totalItems} terrains
                  </span>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                    >
                      Précédent
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages}
                      onClick={() => handlePageChange(currentPage + 1)}
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          </TableFooter>
        </div>
      )}

      <AlertDialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr(e) ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera le terrain définitivement. Êtes-vous sûr(e) de vouloir continuer ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <TerrainEditDialog
        isOpen={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        terrain={selectedTerrain || undefined}
        onSubmitSuccess={handleEditSuccess}
        userId={user?.id || ""}
        userRole={profile?.nom_role}
        agriculteurs={agriculteurs}
      />

      {showContactTechnicianDialog && selectedTerrain && (
        <MessageDialog
          isOpen={showContactTechnicianDialog}
          onClose={handleCloseContactTechnicianDialog}
          recipient={{
            id: selectedTerrain.id_technicien || "",
            name: `${selectedTerrain.techniqueNom || ""} ${selectedTerrain.techniquePrenoms || ""}`
          }}
          subject={`Demande concernant terrain: ${selectedTerrain.nom_terrain}`}
          initialMessage={`Bonjour ${selectedTerrain.techniquePrenoms || ""} ! Je vous contacte parce que j'aimerais modifier quelques informations concernant mon terrain ${selectedTerrain.nom_terrain}.`}
        />
      )}
    </div>
  );
};

export default Terrain;
