
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CalendarIcon, Loader2 } from "lucide-react";

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

type JalonsPreview = {
  culture: string;
  jalons: Array<{
    id_jalon_agricole: number;
    nom_jalon: string;
    delai_apres_lancement: number;
    description: string | null;
    datePrevue: Date;
    couts?: Array<{
      id_cout_jalon_reference: number;
      type_depense: string;
      montant_par_hectare: number;
      montant_total: number;
      unite: string | null;
    }>;
  }>;
};

const ProductionLaunchDialog: React.FC<ProductionLaunchDialogProps> = ({
  isOpen,
  onClose,
  project,
  onSubmitSuccess
}) => {
  const today = new Date();
  const [startDate, setStartDate] = useState<Date>(today);
  const [jalonsPreview, setJalonsPreview] = useState<JalonsPreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [openCalendar, setOpenCalendar] = useState(false);

  useEffect(() => {
    if (isOpen && project) {
      fetchJalonsPreview();
    }
    // eslint-disable-next-line
  }, [isOpen, project, startDate]);

  const fetchJalonsPreview = async () => {
    if (!project.projet_culture || project.projet_culture.length === 0) {
      setJalonsPreview([]);
      return;
    }

    setLoading(true);
    try {
      const cultureIds = project.projet_culture.map(pc => pc.id_culture);

      // Get all jalons agricoles for each culture
      const { data: jalonsData, error } = await supabase
        .from('jalon_agricole')
        .select('id_jalon_agricole, nom_jalon, delai_apres_lancement, description, id_culture, culture:id_culture(nom_culture)')
        .in('id_culture', cultureIds);

      if (error) throw error;

      // Pour chaque culture, obtenir les couts par jalon de cout_jalon_reference
      let jalonsPreviewByCulture: JalonsPreview[] = [];

      for (const id_culture of cultureIds) {
        const cultureJalons = (jalonsData || []).filter(j => j.id_culture === id_culture);
        const cultureName = cultureJalons?.[0]?.culture?.nom_culture
          || project.projet_culture.find(pc => pc.id_culture === id_culture)?.culture?.nom_culture
          || `Culture #${id_culture}`;

        // Fetch les coûts associés à chaque jalon
        for (const jalon of cultureJalons) {
          const { data: coutsData, error: coutsError } = await supabase
            .from('cout_jalon_reference')
            .select('id_cout_jalon_reference, type_depense, montant_par_hectare, unite')
            .eq('id_jalon_agricole', jalon.id_jalon_agricole)
            .eq('id_culture', id_culture);

          if (coutsError) throw coutsError;

          jalon.couts = (coutsData || []).map(c => ({
            ...c,
            montant_total: Number(c.montant_par_hectare) * (project.surface_ha || 1),
          }));
        }

        jalonsPreviewByCulture.push({
          culture: cultureName,
          jalons: cultureJalons.map(jalon => ({
            ...jalon,
            datePrevue: new Date(new Date(startDate).setDate(startDate.getDate() + jalon.delai_apres_lancement)),
            couts: jalon.couts
          }))
        });
      }

      setJalonsPreview(jalonsPreviewByCulture);
    } catch (e) {
      toast.error("Impossible de charger les jalons prévisionnels.");
      setJalonsPreview([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartProduction = async () => {
    setSubmitting(true);

    try {
      // MAJ du statut projet : le trigger génère les jalons et les coûts
      const { error: projectError } = await supabase
        .from('projet')
        .update({
          statut: 'en cours',
          date_debut_production: startDate.toISOString().split('T')[0]
        })
        .eq('id_projet', project.id_projet);

      if (projectError) throw projectError;

      toast.success("Le projet a été lancé en production (jalons & charges générés automatiquement)");
      onSubmitSuccess();
      onClose();
    } catch (error) {
      toast.error("Impossible de lancer le projet en production");
    } finally {
      setSubmitting(false);
    }
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
            <h3 className="text-sm font-medium mb-4">Planification prévisionnelle des jalons et charges</h3>
            {loading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              jalonsPreview.length > 0 ? (
                jalonsPreview.map(culture => (
                  <div key={culture.culture} className="border rounded-md overflow-hidden mb-4">
                    <div className="bg-muted px-4 py-2 font-medium">
                      {culture.culture}
                    </div>
                    <div className="p-2">
                      <table className="w-full text-sm mb-2">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-2">Jalon</th>
                            <th className="text-left py-2 px-2">Description</th>
                            <th className="text-left py-2 px-2">Délai après lancement</th>
                            <th className="text-left py-2 px-2">Date prévue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {culture.jalons.map((jalon) => (
                            <tr key={jalon.id_jalon_agricole} className="border-b">
                              <td className="py-2 px-2">{jalon.nom_jalon}</td>
                              <td className="py-2 px-2">{jalon.description}</td>
                              <td className="py-2 px-2">{jalon.delai_apres_lancement} j</td>
                              <td className="py-2 px-2">{format(jalon.datePrevue, 'PPP', { locale: fr })}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Détail des charges pour chaque jalon */}
                      {culture.jalons.map(jalon => (
                        <div key={jalon.id_jalon_agricole + "_charges"}>
                          {jalon.couts?.length > 0 && (
                            <div className="mb-2">
                              <b>Coûts pour {jalon.nom_jalon} :</b>
                              <ul className="list-disc pl-6">
                                {jalon.couts.map(cout => (
                                  <li key={cout.id_cout_jalon_reference}>
                                    {cout.type_depense} : {cout.montant_total.toLocaleString()} Ar ({cout.montant_par_hectare} Ar/ha{cout.unite ? `, ${cout.unite}` : ""})
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
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
