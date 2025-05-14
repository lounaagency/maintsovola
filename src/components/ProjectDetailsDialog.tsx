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
import JalonReportDialog from "./JalonReportDialog";
import { ExternalLink } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

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
  const [jalons, setJalons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJalon, setSelectedJalon] = useState<{
    id: number;
    name: string;
    datePrevue: string;
    readOnly?: boolean;
    initialData?: {
      rapport?: string;
      dateReelle?: string;
      photos?: string[];
    };
  } | null>(null);
  const [currentFunding, setCurrentFunding] = useState<number>(0);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [totalRendement, setTotalRendement] = useState<number>(0);
  const [rendementProduits, setRendementProduits] = useState<string>('');
  const [totalProfit, setTotalProfit] = useState<number>(0);
  const [fundingProgress, setFundingProgress] = useState<number>(0);
  
  useEffect(() => {
    if (isOpen && projectId) {
      fetchProjectDetails();
      fetchInvestments();
      fetchJalons();
    }
  }, [isOpen, projectId]);
  
  // Calculate funding progress whenever investments or project changes
  useEffect(() => {
    if (project && investments.length >= 0) {
      calculateFundingProgress();
    }
  }, [investments, project]);
  
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
            culture:id_culture(nom_culture,prix_tonne,rendement_ha)
          )
        `)
        .eq('id_projet', projectId)
        .single();
      if (error) throw error;
      setProject(data);
    } catch (error) {
      console.error('Error fetching project details:', error);
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
          investisseur:id_investisseur(nom, prenoms),
          statut_paiement:statut_paiement
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
      const { data, error } = await supabase
        .from('jalon_projet')
        .select(`
          *,
          jalon_agricole:id_jalon_agricole(nom_jalon, action_a_faire, id_culture),
          culture:jalon_agricole(id_culture(nom_culture))
        `)
        .eq('id_projet', projectId)
        .order('date_previsionnelle', { ascending: true });
      
      if (error) throw error;
      data.sort((a, b) =>
        a.culture.id_culture?.nom_culture?.localeCompare(
          b.culture.id_culture?.nom_culture
        )
      );
      
      setJalons(data || []);
    } catch (error) {
      console.error('Error fetching jalons:', error);
    }
  };
  
  const calculateFundingProgress = () => {
    if (!project) return 0;
    const projetCultures = project.projet_culture || [];

      const totalFarmingCost = projetCultures.reduce((sum, pc) => 
        sum + ((pc.cout_exploitation_previsionnel || 0) ), 0);

      const totalEstimatedRevenue = projetCultures.reduce((sum, pc) => {
        const rendement = pc.rendement_previsionnel || 0;
        const prixTonne = pc.culture?.prix_tonne || 0;
        return sum + (rendement * prixTonne);
      }, 0);


      const yieldStrings = projetCultures.map(pc => {
        const nom = pc.culture?.nom_culture || "Non spécifié";
        const tonnage = pc.rendement_previsionnel != null ? pc.rendement_previsionnel : (pc.culture?.rendement_ha || 0) * (project.surface_ha || 1);
        
        return `${Math.round(tonnage * 100) / 100} t de ${nom}`;
      });
      const expectedYieldLabel = yieldStrings.length > 0 ? yieldStrings.join(", ") : "N/A";
      const totalProfit = totalEstimatedRevenue - totalFarmingCost;
      
    const totalInvestment = investments.reduce((sum, inv) => sum + (inv.montant || 0), 0);
    setTotalCost(totalFarmingCost);
    setTotalRendement(totalEstimatedRevenue);
    setRendementProduits(expectedYieldLabel);
    setTotalProfit(totalProfit);
    setCurrentFunding(totalInvestment);
    const progress = totalCost === 0 ? 0 : Math.min(Math.round((totalInvestment / totalCost) * 100), 100);
    setFundingProgress(progress);
    return progress;
  };

  const handleStartProduction = async () => {
    try {
      const startDate = new Date().toISOString().split('T')[0];
      
      // Update project status
      const { error } = await supabase
        .from('projet')
        .update({
          statut: 'en cours',
          date_lancement: startDate
        })
        .eq('id_projet', projectId);
      
      if (error) throw error;
      
      // Create jalons for each culture in the project
      for (const projectCulture of project.projet_culture) {
        const { data: jalons, error: jalonsError } = await supabase
          .from('jalon_agricole')
          .select('*')
          .eq('id_culture', projectCulture.id_culture);
        
        if (jalonsError) throw jalonsError;
        
        for (const jalon of jalons || []) {
          const jalonDate = new Date(startDate);
          jalonDate.setDate(jalonDate.getDate() + jalon.delai_apres_lancement);
          
          const { error: insertError } = await supabase
            .from('jalon_projet')
            .insert({
              id_projet: projectId,
              id_jalon_agricole: jalon.id_jalon_agricole,
              date_previsionnelle: jalonDate.toISOString().split('T')[0]
            });
          
          if (insertError) throw insertError;
        }
      }
      
      toast({
        title: "Succès",
        description: "Le projet a été lancé en production",
      });
      
      // Refresh project data
      fetchProjectDetails();
      fetchJalons();
    } catch (error) {
      console.error('Error starting production:', error);
      toast({
        title: "Erreur",
        description: "Impossible de lancer le projet en production",
        variant: "destructive"
      });
    }
  };

  const handleCompleteJalon = async (jalonId: number) => {
    try {
      // Update jalon with real date
      const { error } = await supabase
        .from('jalon_projet')
        .update({
          date_reelle: new Date().toISOString().split('T')[0]
        })
        .eq('id_projet', projectId)
        .eq('id_jalon_agricole', jalonId);
      
      if (error) throw error;
      
      toast({
        title: "Succès",
        description: "Jalon marqué comme réalisé",
      });
      
      // Refresh jalons
      fetchJalons();
    } catch (error) {
      console.error('Error completing jalon:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le jalon",
        variant: "destructive"
      });
    }
  };

  const handleCompleteProject = async () => {
    try {
      // Update project status
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
      
      // Refresh project data
      fetchProjectDetails();
    } catch (error) {
      console.error('Error completing project:', error);
      toast({
        title: "Erreur",
        description: "Impossible de terminer le projet",
        variant: "destructive"
      });
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

  const handleShowJalonReport = (jalon: any, readOnly: boolean = false) => {
    setSelectedJalon({
      id: jalon.id_jalon_agricole,
      name: jalon.jalon_agricole?.nom_jalon || '',
      datePrevue: jalon.date_previsionnelle,
      readOnly,
      initialData: readOnly ? {
        rapport: jalon.rapport_jalon,
        dateReelle: jalon.date_reelle,
        photos: jalon.photos_jalon ? JSON.parse(jalon.photos_jalon) : []
      } : undefined
    });
  };

  const handleJalonReportSuccess = () => {
    fetchJalons();
    setSelectedJalon(null);
  };

  const getJalonStatus = (jalon: any): 'completed' | 'overdue' | 'normal' => {
    // If it has a date_reelle, it's completed
    if (jalon.date_reelle) {
      return 'completed';
    }
    
    // If it has no date_reelle but the date_previsionnelle is in the past, it's overdue
    const today = new Date();
    const datePrevisionnelle = new Date(jalon.date_previsionnelle);
    
    if (datePrevisionnelle < today && !jalon.date_reelle) {
      return 'overdue';
    }
    
    // Otherwise, it's a normal jalon
    return 'normal';
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

  const isFundingComplete = fundingProgress >= 100;

  return (
    <>
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
                <div 
                  className="grid grid-cols-2 gap-3 mb-4 bg-muted/30 p-2 rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => {}}
                >
                  <div className="text-xs">
                    <span className="text-gray-500 block">Coût d'exploitation</span>
                    <span className="font-medium flex items-center">
                      {formatCurrency(totalCost)} 
                      <ExternalLink className="h-3 w-3 ml-1 text-primary" />
                    </span>
                  </div>
                  <div className="text-xs">
                    <span className="text-gray-500 block">Rendement prévu</span>
                    <span className="font-medium flex items-center">
                      {rendementProduits} 
                      <ExternalLink className="h-3 w-3 ml-1 text-primary" />
                    </span>
                  </div>
                  <div className="text-xs">
                    <span className="text-gray-500 block">Revenu estimé</span>
                    <span className="font-medium flex items-center">
                      {formatCurrency(totalRendement)}
                      <ExternalLink className="h-3 w-3 ml-1 text-primary" />
                    </span>
                  </div>
                  <div className="text-xs">
                    <span className="text-gray-500 block">Bénéfice total</span>
                    <span className="font-medium">{formatCurrency(totalProfit)}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Progression du financement</p>
                    <p className="text-sm font-medium">
                      {formatCurrency(currentFunding)} / {formatCurrency(totalCost)}
                    </p>
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
                        investments.map((inv) => {
                          const isPaid = inv.statut_paiement === 'payé' || inv.date_paiement;
                          const displayDate = isPaid ? inv.date_paiement : inv.date_decision_investir;
                          
                          return (
                            <tr 
                              key={inv.id_investissement} 
                              className={`border-t ${!isPaid ? 'bg-[#FEC6A1]' : ''}`}
                            >
                              <td className="p-2 text-sm">
                                {inv.investisseur?.nom} {inv.investisseur?.prenoms || ''}
                              </td>
                              <td className="p-2 text-right text-sm">
                                {inv.montant?.toLocaleString()} Ar
                              </td>
                              <td className="p-2 text-right text-sm">
                                {formatDate(displayDate)}
                              </td>
                            </tr>
                          );
                        })
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
                
                {userRole === 'technicien' && 
                 project.statut === 'validé' && 
                 isFundingComplete && (
                  <div className="flex justify-end mt-4">
                    <Button onClick={handleStartProduction}>
                      Lancer la production
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="jalons" className="space-y-4 mt-4">
                {project.statut === 'en cours' ? (
                  <div className="space-y-4">
                    <div className="border rounded-md">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-muted">
                            <th className="p-2 text-left text-sm">Culture</th>
                            <th className="p-2 text-left text-sm">Jalon</th>
                            <th className="p-2 text-left text-sm">Date prévue</th>
                            <th className="p-2 text-left text-sm">Date réelle</th>
                            {userRole === 'technicien' && <th className="p-2 text-sm"></th>}
                          </tr>
                        </thead>
                        <tbody>
                          {jalons.length > 0 ? (
                            jalons.map((jalon) => {
                              const status = getJalonStatus(jalon);
                              const rowClassName = 
                                status === 'completed' ? 'bg-[#F2FCE2]' : 
                                status === 'overdue' ? 'bg-[#ffcccc]' : '';
                              
                              return (
                                <tr 
                                  key={`${jalon.id_projet}-${jalon.id_jalon_agricole}`} 
                                  className={`border-t ${rowClassName}`}
                                >
                                  <td className="p-2 text-sm">
                                    {jalon.culture?.id_culture.nom_culture || ''}
                                  </td>
                                  <td className="p-2 text-sm">
                                    {jalon.jalon_agricole?.nom_jalon}
                                  </td>
                                  <td className="p-2 text-sm">
                                    {formatDate(jalon.date_previsionnelle)}
                                  </td>
                                  <td className="p-2 text-sm">
                                    {jalon.date_reelle ? (
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => handleShowJalonReport(jalon, true)}
                                      >
                                        Voir le rapport
                                      </Button>
                                    ) : (
                                      userRole === 'technicien' && (
                                        <Button 
                                          size="sm" 
                                          variant="outline"
                                          onClick={() => handleShowJalonReport(jalon)}
                                        >
                                          Marquer réalisé
                                        </Button>
                                      )
                                    )}
                                  </td>
                                </tr>
                              );
                            })
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
      </Dialog>

      {selectedJalon && (
        <JalonReportDialog
          isOpen={!!selectedJalon}
          onClose={() => setSelectedJalon(null)}
          projectId={projectId}
          jalonId={selectedJalon.id}
          jalonName={selectedJalon.name}
          datePrevue={selectedJalon.datePrevue}
          onSubmitSuccess={handleJalonReportSuccess}
          readOnly={selectedJalon.readOnly}
          initialData={selectedJalon.initialData}
        />
      )}
    </>
  );
};

export default ProjectDetailsDialog;
