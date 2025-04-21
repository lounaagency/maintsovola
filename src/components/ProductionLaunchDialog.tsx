
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface JalonData {
  id_jalon: number;
  nom_jalon: string;
  action_a_faire: string;
  jours_apres_lancement: number;
  id_culture: number;
  culture: {
    nom_culture: string;
  };
  datePrevue: Date;
}

interface ProjectData {
  id_projet: number;
  titre?: string;
  description?: string;
  surface_ha: number;
  terrain?: {
    nom_terrain?: string;
  };
  projet_culture?: Array<{
    id_projet_culture: number;
    id_culture: number;
    culture?: {
      nom_culture?: string;
    };
  }>;
  currentFunding?: number;
  fundingGoal?: number;
}

interface ProductionLaunchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectData;
  onSubmitSuccess: () => void;
}

const ProductionLaunchDialog: React.FC<ProductionLaunchDialogProps> = ({
  isOpen,
  onClose,
  project,
  onSubmitSuccess
}) => {
  const today = new Date();
  const [startDate, setStartDate] = useState<Date>(today);
  const [jalons, setJalons] = useState<{ [key: number]: JalonData[] }>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [openCalendar, setOpenCalendar] = useState(false);

  useEffect(() => {
    if (isOpen && project) {
      fetchJalons();
    }
  }, [isOpen, project]);

  useEffect(() => {
    updateJalonDates();
  }, [startDate]);

  const fetchJalons = async () => {
    if (!project.projet_culture || project.projet_culture.length === 0) return;
    
    setLoading(true);
    try {
      const cultureIds = project.projet_culture.map(pc => pc.id_culture);
      
      if (!cultureIds.length) return;
      
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
      
      const jalonsByCulture: { [key: number]: JalonData[] } = {};
      
      if (data) {
        data.forEach(jalon => {
          const datePrevue = new Date(startDate);
          datePrevue.setDate(datePrevue.getDate() + jalon.jours_apres_lancement);
          
          const jalonWithDate = { ...jalon, datePrevue };
          
          if (!jalonsByCulture[jalon.id_culture]) {
            jalonsByCulture[jalon.id_culture] = [];
          }
          
          jalonsByCulture[jalon.id_culture].push(jalonWithDate);
        });
        
        for (const cultureId in jalonsByCulture) {
          jalonsByCulture[cultureId].sort((a, b) => a.jours_apres_lancement - b.jours_apres_lancement);
        }
      }
      
      setJalons(jalonsByCulture);
    } catch (error) {
      console.error("Erreur lors de la récupération des jalons:", error);
      toast.error("Impossible de charger les jalons");
    } finally {
      setLoading(false);
    }
  };

  const updateJalonDates = () => {
    const updatedJalons: { [key: number]: JalonData[] } = {};
    
    for (const cultureId in jalons) {
      updatedJalons[cultureId] = jalons[cultureId].map(jalon => {
        const datePrevue = new Date(startDate);
        datePrevue.setDate(datePrevue.getDate() + jalon.jours_apres_lancement);
        
        return { ...jalon, datePrevue };
      });
    }
    
    setJalons(updatedJalons);
  };

  const handleStartProduction = async () => {
    setSubmitting(true);
    
    try {
      // 1. Update project status
      const { error: projectError } = await supabase
        .from('projet')
        .update({
          statut: 'en cours',
          date_debut_production: startDate.toISOString().split('T')[0]
        })
        .eq('id_projet', project.id_projet);
      
      if (projectError) throw projectError;
      
      // 2. Insert all jalons
      const jalonsToInsert = [];
      
      for (const cultureId in jalons) {
        for (const jalon of jalons[cultureId]) {
          jalonsToInsert.push({
            id_projet: project.id_projet,
            id_jalon: jalon.id_jalon,
            date_previsionnelle: jalon.datePrevue.toISOString().split('T')[0],
            statut: 'Prévu'
          });
        }
      }
      
      if (jalonsToInsert.length > 0) {
        const { error: jalonsError } = await supabase
          .from('jalon_projet')
          .insert(jalonsToInsert);
        
        if (jalonsError) throw jalonsError;
      }
      
      toast.success("Le projet a été lancé en production");
      onSubmitSuccess();
      onClose();
    } catch (error) {
      console.error("Erreur lors du lancement de la production:", error);
      toast.error("Impossible de lancer le projet en production");
    } finally {
      setSubmitting(false);
    }
  };

  const updateJalonDate = (cultureId: number, jalonId: number, newDate: Date) => {
    setJalons(prev => {
      const updated = { ...prev };
      
      if (updated[cultureId]) {
        updated[cultureId] = updated[cultureId].map(jalon => 
          jalon.id_jalon === jalonId ? { ...jalon, datePrevue: newDate } : jalon
        );
      }
      
      return updated;
    });
  };

  if (!project) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lancer la production - {project.titre || `Projet #${project.id_projet}`}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Détails du projet</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Terrain:</span> {project.terrain?.nom_terrain || `Terrain #${project.id_projet}`}</p>
                <p><span className="font-medium">Surface:</span> {project.surface_ha} ha</p>
                <p><span className="font-medium">Cultures:</span> {project.projet_culture?.map(pc => pc.culture?.nom_culture).join(', ') || 'N/A'}</p>
                {project.currentFunding !== undefined && project.fundingGoal !== undefined && (
                  <p>
                    <span className="font-medium">Financement:</span> {project.currentFunding.toLocaleString()} Ar / {project.fundingGoal.toLocaleString()} Ar
                    ({Math.round((project.currentFunding / project.fundingGoal) * 100)}%)
                  </p>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">Date de lancement</h3>
              <Popover open={openCalendar} onOpenChange={setOpenCalendar}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP', { locale: fr }) : "Sélectionner une date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      if (date) {
                        setStartDate(date);
                        setOpenCalendar(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground mt-2">
                La date de lancement détermine le début du projet et le planning des jalons.
              </p>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-4">Planification des jalons par culture</h3>
            
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              Object.keys(jalons).length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(jalons).map(([cultureId, cultureJalons]) => {
                    const cultureName = cultureJalons[0]?.culture?.nom_culture || `Culture #${cultureId}`;
                    
                    return (
                      <div key={cultureId} className="border rounded-md overflow-hidden">
                        <div className="bg-muted px-4 py-2 font-medium">
                          {cultureName}
                        </div>
                        <div className="p-2">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2 px-2">Jalon</th>
                                <th className="text-left py-2 px-2">Action</th>
                                <th className="text-left py-2 px-2">Jours après lancement</th>
                                <th className="text-left py-2 px-2">Date prévue</th>
                              </tr>
                            </thead>
                            <tbody>
                              {cultureJalons.map((jalon) => (
                                <tr key={jalon.id_jalon} className="border-b">
                                  <td className="py-2 px-2">{jalon.nom_jalon}</td>
                                  <td className="py-2 px-2">{jalon.action_a_faire}</td>
                                  <td className="py-2 px-2">{jalon.jours_apres_lancement}</td>
                                  <td className="py-2 px-2">
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button 
                                          variant="outline" 
                                          className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !jalon.datePrevue && "text-muted-foreground"
                                          )}
                                        >
                                          <CalendarIcon className="mr-2 h-4 w-4" />
                                          {jalon.datePrevue ? format(jalon.datePrevue, 'PPP', { locale: fr }) : "Sélectionner une date"}
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-auto p-0">
                                        <Calendar
                                          mode="single"
                                          selected={jalon.datePrevue}
                                          onSelect={(date) => {
                                            if (date) {
                                              updateJalonDate(parseInt(cultureId), jalon.id_jalon, date);
                                            }
                                          }}
                                          initialFocus
                                        />
                                      </PopoverContent>
                                    </Popover>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  Aucun jalon disponible pour les cultures de ce projet.
                </div>
              )
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button 
            type="button" 
            onClick={handleStartProduction}
            disabled={submitting || loading}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                Lancement en cours...
              </>
            ) : (
              "Lancer la production"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductionLaunchDialog;
