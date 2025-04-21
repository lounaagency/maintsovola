import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import UserAvatar from './UserAvatar';
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ProjectDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  userRole?: string;
}

const ProjectDetailsDialog: React.FC<ProjectDetailsDialogProps> = ({
  isOpen,
  onClose,
  projectId,
  userRole
}) => {
  const { toast } = useToast();
  const [project, setProject] = useState<any>(null);
  const [investments, setInvestments] = useState<any[]>([]);
  const [jalonsProjet, setJalonsProjet] = useState<any[]>([]);
  const [coutsParJalonProjet, setCoutsParJalonProjet] = useState<{ [key: number]: any[] }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && projectId) {
      fetchProjectDetails();
      fetchInvestments();
      fetchJalonsProjetFull();
    }
  }, [isOpen, projectId]);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projet')
        .select(`
          *,
          tantsaha:id_tantsaha(nom, prenoms,photo_profil),
          technicien:id_technicien(nom, prenoms,photo_profil),
          superviseur:id_superviseur(nom, prenoms,photo_profil),
          terrain:id_terrain(*),
          region:id_region(nom_region),
          district:id_district(nom_district),
          commune:id_commune(nom_commune),
          projet_culture:projet_culture(
            id_projet_culture,
            id_culture,
            cout_exploitation_previsionnel,
            rendement_previsionnel,
            date_debut_previsionnelle,
            culture:id_culture(nom_culture)
          )
        `)
        .eq('id_projet', projectId)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les détails du projet",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchInvestments = async () => {
    try {
      const { data, error } = await supabase
        .from('investissement')
        .select(`
          *,
          investisseur:id_investisseur(nom, prenoms)
        `)
        .eq('id_projet', projectId)
        .order('date_paiement', { ascending: false });

      if (error) throw error;
      setInvestments(data || []);
    } catch (error) {
    }
  };

  const fetchJalonsProjetFull = async () => {
    try {
      const { data: jalons, error: jalonsError } = await supabase
        .from('jalon_projet')
        .select(`
          *,
          jalon_agricole:id_jalon_agricole(nom_jalon, delai_apres_lancement, description, id_culture),
          culture:jalon_agricole(id_culture, culture:nom_culture)
        `)
        .eq('id_projet', projectId)
        .order('date_prev_planifiee', { ascending: true });

      if (jalonsError) throw jalonsError;

      let coutsParJalon: { [key: number]: any[] } = {};
      if (jalons.length > 0) {
        const { data: coutsData } = await supabase
          .from('cout_jalon_projet')
          .select('*')
          .in('id_jalon_projet', jalons.map(j => j.id_jalon_projet));

        for (const jId of jalons.map(j => j.id_jalon_projet)) {
          coutsParJalon[jId] = (coutsData || []).filter(c => c.id_jalon_projet === jId);
        }
      }
      setJalonsProjet(jalons || []);
      setCoutsParJalonProjet(coutsParJalon);
    } catch (err) {
      setJalonsProjet([]);
      setCoutsParJalonProjet({});
    }
  };

  const calculateFundingProgress = () => {
    if (!project) return 0;

    const totalInvestment = investments.reduce((sum, inv) => sum + (inv.montant || 0), 0);

    let totalCouts = 0;
    Object.values(coutsParJalonProjet).forEach(coutsList => {
      totalCouts += coutsList.reduce((acc, c) => acc + (Number(c.montant_total) || 0), 0);
    });

    return totalCouts === 0 ? 0 : Math.min(Math.round((totalInvestment / totalCouts) * 100), 100);
  };

  const handleStartProduction = async () => {
  };

  const handleCompleteJalon = async (jalonProjetId: number) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { error } = await supabase
        .from('jalon_projet')
        .update({ date_reelle: today, statut: 'Terminé' })
        .eq('id_jalon_projet', jalonProjetId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Jalon marqué comme réalisé",
      });

      fetchJalonsProjetFull();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le jalon",
        variant: "destructive"
      });
    }
  };

  const handleCompleteProject = async () => {
    try {
      const { error } = await supabase
        .from('projet')
        .update({
          statut: 'terminé',
          date_fin: new Date().toISOString().split('T')[0]
        })
        .eq('id_projet', projectId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Le projet a été marqué comme terminé",
      });

      fetchProjectDetails();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de terminer le projet",
        variant: "destructive"
      });
    }
  };

  const allJalonsCompleted = () => {
    return jalonsProjet.length > 0 && jalonsProjet.every(j => j.date_reelle);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Non défini";
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading || !project) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Détails du projet</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center py-8">
            <p>Chargement des détails du projet...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const fundingProgress = calculateFundingProgress();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Détails du projet #{project.id_projet}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div  className="text-xs">
                  <p className="text-muted-foreground">Agriculteur</p>
                  
                  <div className="flex items-center">
                    <UserAvatar 
                      src={project.tantsaha?.photo_profil} 
                      alt={typeof project.tantsaha?.nom === 'string' ? project.tantsaha.nom : 'Agriculteur'} 
                      size="sm" 
                    />
                    <div  className="text-xs">
                      <div className="text-green-900">
                        {project.tantsaha?.nom} {project.tantsaha?.prenoms || ''}
                      </div>
                    </div>
                  </div>
                </div>
                <div  className="text-xs">
                  <p className="text-muted-foreground">Terrain</p>
                  <p className="text-green-900">{project.terrain?.nom_terrain} ({project.surface_ha} ha)</p>
                </div>
                <div  className="text-xs">
                  <p className="text-muted-foreground">Localisation</p>
                  <p className="text-green-900">{project.region?.nom_region}, {project.district?.nom_district}, {project.commune?.nom_commune}</p>
                </div>
                <div  className="text-xs">
                  <p className="text-muted-foreground">Statut</p>
                  <Badge 
                    variant={
                      project.statut === 'en attente' ? 'outline' : 
                      project.statut === 'validé' ? 'secondary' :
                      project.statut === 'en cours' ? 'default' :
                      project.statut === 'terminé' ? 'secondary' : 'outline'
                    }
                  >
                    {project.statut}
                  </Badge>
                </div>
                <div  className="text-xs">
                  <p className="text-muted-foreground">Cultures</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {project.projet_culture.map((pc: any) => (
                      <Badge key={pc.id_projet_culture} variant="outline">
                        {pc.culture?.nom_culture}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div  className="text-xs">
                  <p className="text-muted-foreground">Equipe Maintso Vola</p>                  
                  {project.superviseur && (
                    <div className="flex items-center">
                      <span className="text-green-900">Superviseur : </span>
                      <UserAvatar 
                        src={project.superviseur?.photo_profil} 
                        alt={typeof project.superviseur?.nom === 'string' ? project.superviseur.nom : 'Agriculteur'} 
                        size="sm" 
                      />
                      <div className="font-semibold text-sm text-green-900">
                        {project.superviseur?.nom} {project.superviseur?.prenoms || ''}
                      </div>
                    </div>
                  )}
                  {project.technicien && (
                    <div className="flex items-center">
                    <span className="text-green-900">Technicien : </span>
                      <UserAvatar 
                        src={project.technicien?.photo_profil} 
                        alt={typeof project.technicien?.nom === 'string' ? project.technicien.nom : 'Agriculteur'} 
                        size="sm" 
                      />
                      <div className="text-green-900">
                        {project.technicien?.nom} {project.technicien?.prenoms || ''}
                      </div>
                    </div>
                  )}
                </div>
                {project.date_lancement && (
                  <div>
                    <p className="text-muted-foreground">Date de lancement</p>
                    <p className="text-green-900">{formatDate(project.date_lancement)}</p>
                  </div>
                )}
              </div>
              
              {project.description && (
                <div className="mt-4 text-xs">
                  <p className="text-muted-foreground mb-1">Description</p>
                  <p  className="text-green-900">{project.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="finances" className="w-full text-xs">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="finances">Financement</TabsTrigger>
              <TabsTrigger value="jalons">Jalons & Production</TabsTrigger>
            </TabsList>

            <TabsContent value="finances" className="space-y-4 mt-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Progression du financement</p>
                  <p className="text-sm font-medium">{fundingProgress}%</p>
                </div>
                <Progress value={fundingProgress} className="h-2" />
              </div>

              <Separator className="my-4" />

              <h3 className="text-lg font-medium">Coûts prévisionnels par jalon</h3>
              <div className="border rounded-md mb-4">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted">
                      <th className="p-2 text-left text-sm">Jalon</th>
                      <th className="p-2 text-left text-sm">Culture</th>
                      <th className="p-2 text-left text-sm">Date prévue</th>
                      <th className="p-2 text-right text-sm">Type dépense</th>
                      <th className="p-2 text-right text-sm">Montant (Ar)</th>
                      <th className="p-2 text-right text-sm">Statut paiement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jalonsProjet.length > 0 ? (
                      jalonsProjet.flatMap((jalon) => (
                        (coutsParJalonProjet[jalon.id_jalon_projet] || []).map((cout, idx) => (
                          <tr key={jalon.id_jalon_projet + '-' + cout.id_cout_jalon_projet}>
                            <td className="p-2 text-sm">{idx === 0 ? jalon.jalon_agricole?.nom_jalon || '' : ''}</td>
                            <td className="p-2 text-sm">{idx === 0 ? jalon.culture?.culture || '' : ''}</td>
                            <td className="p-2 text-sm">{idx === 0 ? formatDate(jalon.date_prev_planifiee) : ''}</td>
                            <td className="p-2 text-right text-sm">{cout.type_depense}</td>
                            <td className="p-2 text-right text-sm">{cout.montant_total?.toLocaleString()}</td>
                            <td className="p-2 text-right text-sm">{cout.statut_paiement}</td>
                          </tr>
                        ))
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-4 text-center text-sm text-muted-foreground">
                          Aucun coût enregistré pour le moment
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="jalons" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="border rounded-md">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted">
                        <th className="p-2 text-left text-sm">Jalon</th>
                        <th className="p-2 text-left text-sm">Culture</th>
                        <th className="p-2 text-left text-sm">Date prévue</th>
                        <th className="p-2 text-left text-sm">Date réelle</th>
                        {userRole === 'technicien' && <th className="p-2 text-sm"></th>}
                      </tr>
                    </thead>
                    <tbody>
                      {jalonsProjet.length > 0 ? (
                        jalonsProjet.map((jalon) => (
                          <tr key={jalon.id_jalon_projet}>
                            <td className="p-2 text-sm">{jalon.jalon_agricole?.nom_jalon}</td>
                            <td className="p-2 text-sm">{jalon.culture?.culture || ''}</td>
                            <td className="p-2 text-sm">{formatDate(jalon.date_prev_planifiee)}</td>
                            <td className="p-2 text-sm">
                              {jalon.date_reelle ? formatDate(jalon.date_reelle) : 'Non réalisé'}
                            </td>
                            {userRole === 'technicien' && (
                              <td className="p-2 text-right">
                                {!jalon.date_reelle && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCompleteJalon(jalon.id_jalon_projet)}
                                  >
                                    Marquer réalisé
                                  </Button>
                                )}
                              </td>
                            )}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={userRole === 'technicien' ? 5 : 4} className="p-4 text-center text-sm text-muted-foreground">
                            Aucun jalon défini pour ce projet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {userRole === 'technicien' && allJalonsCompleted() && (
                  <div className="flex justify-end mt-4">
                    <Button onClick={handleCompleteProject}>
                      Terminer le projet
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectDetailsDialog;
