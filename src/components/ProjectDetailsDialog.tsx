
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
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import FinancialDetailsDialog from './FinancialDetailsDialog';

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
  const [project, setProject] = useState<any>(null);
  const [investments, setInvestments] = useState<any[]>([]);
  const [jalons, setJalons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  
  const [editedDates, setEditedDates] = useState<{[key: string]: string}>({});
  const [showFinancialDetails, setShowFinancialDetails] = useState(false);
  
  useEffect(() => {
    if (isOpen && projectId) {
      fetchProjectDetails();
      fetchInvestments();
      fetchJalons();
    }
  }, [isOpen, projectId]);
  
  useEffect(() => {
    if (isOpen) {
      setProductionStartDate(new Date().toISOString().split('T')[0]);
      setEditedDates({});
    }
  }, [isOpen]);
  
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
            culture:id_culture(nom_culture, rendement_ha, cout_exploitation_ha, prix_tonne)
          )
        `)
        .eq('id_projet', projectId)
        .single();
      
      if (error) throw error;
      setProject(data);
    } catch (error) {
      console.error('Error fetching project details:', error);
      toast.error("Impossible de récupérer les détails du projet");
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
      console.error('Error fetching investments:', error);
    }
  };
  
  const fetchJalons = async () => {
    try {
      console.log("Fetching jalons for project:", projectId);
      const { data: cultureData, error: cultureError } = await supabase
        .from('projet_culture')
        .select('id_culture')
        .eq('id_projet', projectId);
      
      if (cultureError) throw cultureError;
      
      if (!cultureData || cultureData.length === 0) {
        console.log("No cultures found for this project");
        return;
      }
      
      const cultureIds = cultureData.map(c => c.id_culture);
      console.log("Culture IDs:", cultureIds);
      
      const { data, error } = await supabase
        .from('jalon')
        .select(`
          id_jalon,
          nom_jalon,
          action_a_faire,
          jours_apres_lancement,
          id_culture,
          culture:id_culture(nom_culture)
        `)
        .in('id_culture', cultureIds);
      
      if (error) throw error;
      
      console.log("Fetched jalons:", data);
      
      if (data) {
        const formattedJalons = data.map(jalon => ({
          id_jalon: jalon.id_jalon,
          nom_jalon: jalon.nom_jalon,
          action_a_faire: jalon.action_a_faire,
          jours_apres_lancement: jalon.jours_apres_lancement,
          id_culture: jalon.id_culture,
          culture: jalon.culture,
          date_previsionnelle: calculateJalonDate(productionStartDate, jalon.jours_apres_lancement, jalon.id_jalon)
        }));
        
        setJalons(formattedJalons);
      } else {
        setJalons([]);
      }
    } catch (error) {
      console.error('Error fetching jalons:', error);
      toast.error("Impossible de récupérer les jalons");
    }
  };
  
  const calculateJalonDate = (startDate: string, daysAfter: number, jalonId: number): string => {
    const editedKey = `${projectId}-${jalonId}`;
    if (editedDates[editedKey]) {
      return editedDates[editedKey];
    }
    
    const date = new Date(startDate);
    date.setDate(date.getDate() + daysAfter);
    return date.toISOString().split('T')[0];
  };
  
  const handleDateChange = (jalonId: number, newDate: string) => {
    const editedKey = `${projectId}-${jalonId}`;
    setEditedDates(prev => ({
      ...prev,
      [editedKey]: newDate
    }));
  };
  
  const calculateFundingProgress = () => {
    if (!project) return 0;
    
    const totalInvestment = investments.reduce((sum, inv) => sum + (inv.montant || 0), 0);
    const totalCost = project.projet_culture.reduce((sum: number, pc: any) => 
      sum + (pc.cout_exploitation_previsionnel || 0), 0);
    
    return totalCost === 0 ? 0 : Math.min(Math.round((totalInvestment / totalCost) * 100), 100);
  };

  const [productionStartDate, setProductionStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const updateJalonDates = (startDate: string) => {
    if (!jalons.length) return;
    
    const newJalons = jalons.map(jalon => {
      if (!jalon.jours_apres_lancement) return jalon;
      
      return {
        ...jalon,
        date_previsionnelle: calculateJalonDate(startDate, jalon.jours_apres_lancement, jalon.id_jalon)
      };
    });
    
    setJalons(newJalons);
  };

  useEffect(() => {
    updateJalonDates(productionStartDate);
  }, [productionStartDate, jalons.length]);

  const handleStartProduction = async () => {
    try {
      if (!user) {
        toast.error("Vous devez être connecté pour lancer la production");
        return;
      }
      
      console.log("Starting production with date:", productionStartDate);
      
      // Step 1: Update project status to "en cours"
      const { error: updateError } = await supabase
        .from('projet')
        .update({
          statut: 'en cours',
          date_debut_production: productionStartDate,
          id_lanceur_production: user.id
        })
        .eq('id_projet', projectId);
      
      if (updateError) {
        console.error("Error updating project:", updateError);
        throw updateError;
      }
      
      console.log("Project updated successfully");
      
      // Step 2: Insert jalons if we have any
      if (jalons && jalons.length > 0) {
        console.log("Preparing jalon entries for insertion:", jalons.length);
        
        // First, delete any existing jalons for this project
        const { error: deleteError } = await supabase
          .from('projet_jalon')
          .delete()
          .eq('id_projet', projectId);
          
        if (deleteError) {
          console.error("Error deleting existing jalons:", deleteError);
          // Continue anyway, as they might not exist yet
        }
        
        // Now insert each jalon individually
        for (const jalon of jalons) {
          const jalonEntry = {
            id_projet: projectId,
            id_jalon: jalon.id_jalon,
            date_previsionnelle: jalon.date_previsionnelle
          };
          
          console.log("Inserting jalon:", jalonEntry);
          
          const { error: insertError } = await supabase
            .from('projet_jalon')
            .insert(jalonEntry);
            
          if (insertError) {
            console.error("Error inserting jalon:", insertError);
            console.error("Failed jalon entry:", jalonEntry);
          } else {
            console.log("Jalon inserted successfully:", jalon.id_jalon);
          }
        }
      } else {
        console.log("No jalons to insert");
      }
      
      // Step 3: Send notification to farmer if we have their ID
      if (project && project.id_tantsaha) {
        console.log("Sending notification to farmer:", project.id_tantsaha);
        
        const { error: notificationError } = await supabase
          .from('notification')
          .insert({
            id_destinataire: project.id_tantsaha,
            titre: "Votre projet est en production",
            message: `Votre projet "${project.titre || `Projet #${project.id_projet}`}" est maintenant en cours de production.`,
            type: "success",
            entity_type: "projet",
            entity_id: projectId,
            projet_id: projectId
          });
          
        if (notificationError) {
          console.error("Error sending notification:", notificationError);
        }
      }
      
      toast.success("Le projet a été lancé en production");
      fetchProjectDetails();
    } catch (error) {
      console.error('Error starting production:', error);
      toast.error("Impossible de lancer le projet en production");
    }
  };

  const handleCompleteJalon = async (jalonId: number) => {
    try {
      const { error } = await supabase
        .from('projet_jalon')
        .update({
          date_reelle: new Date().toISOString().split('T')[0]
        })
        .eq('id_projet', projectId)
        .eq('id_jalon', jalonId);
      
      if (error) throw error;
      
      toast.success("Jalon marqué comme réalisé");
      
      fetchJalons();
    } catch (error) {
      console.error('Error completing jalon:', error);
      toast.error("Impossible de mettre à jour le jalon");
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
      
      toast.success("Le projet a été marqué comme terminé");
      
      fetchProjectDetails();
    } catch (error) {
      console.error('Error completing project:', error);
      toast.error("Impossible de terminer le projet");
    }
  };
  
  const allJalonsCompleted = () => {
    return jalons.length > 0 && jalons.every(j => j.date_reelle);
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

  const handleOpenFinancialDetails = () => {
    setShowFinancialDetails(true);
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
  const isFundingComplete = fundingProgress >= 100;
  const canLaunchProduction = (userRole === 'technicien' || userRole === 'superviseur') && 
                             project.statut === 'en financement' && 
                             isFundingComplete;

  const defaultTab = canLaunchProduction ? "jalons" : "finances";

  const jalonsByCulture = jalons.reduce((acc: {[key: string]: typeof jalons}, jalon) => {
    const cultureName = jalon.culture?.nom_culture || 'Sans culture';
    if (!acc[cultureName]) {
      acc[cultureName] = [];
    }
    acc[cultureName].push(jalon);
    return acc;
  }, {});

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
                <div className="text-xs">
                  <p className="text-muted-foreground">Agriculteur</p>
                  
                  <div className="flex items-center">
                    <UserAvatar 
                      src={project.tantsaha?.photo_profil} 
                      alt={typeof project.tantsaha?.nom === 'string' ? project.tantsaha.nom : 'Agriculteur'} 
                      size="sm" 
                    />
                    <div className="text-xs">
                      <div className="text-green-900">
                        {project.tantsaha?.nom} {project.tantsaha?.prenoms || ''}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-xs">
                  <p className="text-muted-foreground">Terrain</p>
                  <p className="text-green-900">{project.terrain?.nom_terrain} ({project.surface_ha} ha)</p>
                </div>
                <div className="text-xs">
                  <p className="text-muted-foreground">Localisation</p>
                  <p className="text-green-900">{project.region?.nom_region}, {project.district?.nom_district}, {project.commune?.nom_commune}</p>
                </div>
                <div className="text-xs">
                  <p className="text-muted-foreground">Statut</p>
                  <Badge 
                    variant={
                      project.statut === 'en attente' ? 'outline' : 
                      project.statut === 'validé' ? 'secondary' :
                      project.statut === 'en financement' ? 'secondary' :
                      project.statut === 'en cours' ? 'default' :
                      project.statut === 'terminé' ? 'secondary' : 'outline'
                    }
                  >
                    {project.statut}
                  </Badge>
                </div>
                <div className="text-xs">
                  <p className="text-muted-foreground">Cultures</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {project.projet_culture.map((pc: any) => (
                      <Badge key={pc.id_projet_culture} variant="outline">
                        {pc.culture?.nom_culture}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="text-xs">
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
                {project.date_debut_production && (
                  <div className="text-xs">
                    <p className="text-muted-foreground">Date de lancement</p>
                    <p className="text-green-900">{formatDate(project.date_debut_production)}</p>
                  </div>
                )}
              </div>
              
              {project.description && (
                <div className="mt-4 text-xs">
                  <p className="text-muted-foreground mb-1">Description</p>
                  <p className="text-green-900">{project.description}</p>
                </div>
              )}
              
              <div 
                className="mt-4 p-3 bg-muted/30 rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={handleOpenFinancialDetails}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Détails financiers</span>
                  <span className="text-xs text-muted-foreground">Cliquez pour voir plus</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground block">Coût d'exploitation total</span>
                    <span className="font-medium">
                      {project.projet_culture.reduce((sum: number, pc: any) => 
                        sum + (pc.cout_exploitation_previsionnel || 0), 0).toLocaleString()} Ar
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Surface totale</span>
                    <span className="font-medium">{project.surface_ha} ha</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue={defaultTab} className="w-full text-xs">
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
              
              <h3 className="text-lg font-medium">Investissements</h3>
              
              <div className="border rounded-md">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted">
                      <th className="p-2 text-left text-sm">Investisseur</th>
                      <th className="p-2 text-right text-sm">Montant</th>
                      <th className="p-2 text-right text-sm">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {investments.length > 0 ? (
                      investments.map((inv) => (
                        <tr key={inv.id_investissement} className="border-t">
                          <td className="p-2 text-sm">
                            {inv.investisseur?.nom} {inv.investisseur?.prenoms || ''}
                          </td>
                          <td className="p-2 text-right text-sm">
                            {inv.montant?.toLocaleString()} Ar
                          </td>
                          <td className="p-2 text-right text-sm">
                            {formatDate(inv.date_paiement)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="p-4 text-center text-sm text-muted-foreground">
                          Aucun investissement pour le moment
                        </td>
                      </tr>
                    )}
                  </tbody>
                  {investments.length > 0 && (
                    <tfoot>
                      <tr className="border-t bg-muted">
                        <td className="p-2 font-medium">Total</td>
                        <td className="p-2 text-right font-medium">
                          {investments.reduce((sum, inv) => sum + (inv.montant || 0), 0).toLocaleString()} Ar
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
              
              {canLaunchProduction && (
                <div className="flex justify-end mt-4">
                  <Button onClick={handleStartProduction}>
                    Lancer la production
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="jalons" className="space-y-4 mt-4">
              {canLaunchProduction ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="startDate" className="text-sm font-medium">
                      Date de début de production
                    </label>
                    <input
                      id="startDate"
                      type="date"
                      value={productionStartDate}
                      onChange={(e) => setProductionStartDate(e.target.value)}
                      className="w-full p-2 border rounded"
                    />
                  </div>

                  {Object.entries(jalonsByCulture).map(([cultureName, cultureJalons]) => (
                    <div key={cultureName} className="space-y-2">
                      <h3 className="font-medium text-lg">{cultureName}</h3>
                      <div className="border rounded-md">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-muted">
                              <th className="p-2 text-left text-sm">Jalon</th>
                              <th className="p-2 text-left text-sm">Action à faire</th>
                              <th className="p-2 text-left text-sm">Date prévue</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Array.isArray(cultureJalons) && cultureJalons.map((jalon) => (
                              <tr key={`${projectId}-${jalon.id_jalon}`} className="border-t">
                                <td className="p-2 text-sm">
                                  {jalon.nom_jalon}
                                </td>
                                <td className="p-2 text-sm">
                                  {jalon.action_a_faire}
                                </td>
                                <td className="p-2 text-sm">
                                  <input
                                    type="date"
                                    value={calculateJalonDate(productionStartDate, jalon.jours_apres_lancement, jalon.id_jalon)}
                                    onChange={(e) => handleDateChange(jalon.id_jalon, e.target.value)}
                                    className="border rounded p-1 w-full"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-end mt-4">
                    <Button onClick={handleStartProduction}>
                      Lancer la production
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  {project.statut === 'terminé' ? (
                    <p>Ce projet est terminé.</p>
                  ) : (
                    <p>Le projet n'est pas encore en cours de production.</p>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
      
      <FinancialDetailsDialog
        isOpen={showFinancialDetails}
        onClose={() => setShowFinancialDetails(false)}
        projectCultures={project.projet_culture}
        title="Détails financiers par culture"
      />
    </Dialog>
  );
};

export default ProjectDetailsDialog;
