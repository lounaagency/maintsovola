import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TechnicianPerformance } from "@/types/superviseur";

export const useTechnicianPerformance = (superviseurId: string) => {
  return useQuery({
    queryKey: ["technician-performance", superviseurId],
    queryFn: async (): Promise<TechnicianPerformance[]> => {
      // Récupérer les techniciens avec leurs projets et jalons
      const { data: techniciensData, error: techError } = await supabase
        .from("utilisateur")
        .select(`
          id_utilisateur,
          nom,
          prenoms,
          role!inner(nom_role)
        `)
        .eq("role.nom_role", "technicien");

      if (techError) throw techError;

      // Pour chaque technicien, récupérer ses projets sous ce superviseur
      const techniciensWithProjects = await Promise.all(
        (techniciensData || []).map(async (technicien) => {
          const { data: projetsData, error: projetsError } = await supabase
            .from("projet")
            .select(`
              id_projet,
              jalon_projet(
                statut,
                date_previsionnelle,
                date_reelle,
                rapport_jalon
              )
            `)
            .eq("id_technicien", technicien.id_utilisateur)
            .eq("id_superviseur", superviseurId);

          if (projetsError) throw projetsError;

          return {
            ...technicien,
            projets: projetsData || []
          };
        })
      );

      return techniciensWithProjects.map(technicien => {
        const projets = technicien.projets || [];
        const tachesTotales = projets.reduce((acc, p) => acc + (p.jalon_projet?.length || 0), 0);
        const tachesCompletes = projets.reduce((acc, p) => 
          acc + (p.jalon_projet?.filter(j => j.statut === "Terminé").length || 0), 0);
        const tachesEnRetard = projets.reduce((acc, p) => 
          acc + (p.jalon_projet?.filter(j => 
            j.statut !== "Terminé" && 
            new Date(j.date_previsionnelle) < new Date()
          ).length || 0), 0);

        // Calculer la qualité des rapports basée sur les rapports non vides
        const rapportsRemplis = projets.reduce((acc, p) => 
          acc + (p.jalon_projet?.filter(j => j.rapport_jalon && j.rapport_jalon.trim() !== "").length || 0), 0);
        const qualiteRapports = tachesTotales > 0 ? Math.round((rapportsRemplis / tachesTotales) * 100) : 0;

        // Calculer présences basées sur les jalons des 7 derniers jours
        const septDerniersJours = new Date();
        septDerniersJours.setDate(septDerniersJours.getDate() - 7);
        const activitesRecentes = projets.reduce((acc, p) => 
          acc + (p.jalon_projet?.filter(j => 
            j.date_reelle && new Date(j.date_reelle) >= septDerniersJours
          ).length || 0), 0);

        const tauxCompletion = tachesTotales > 0 ? (tachesCompletes / tachesTotales) * 100 : 0;

        // Dernière activité basée sur le jalon le plus récent
        const derniereActivite = projets
          .flatMap(p => p.jalon_projet || [])
          .filter(j => j.date_reelle)
          .sort((a, b) => new Date(b.date_reelle!).getTime() - new Date(a.date_reelle!).getTime())[0]?.date_reelle || new Date().toISOString();

        return {
          id_technicien: technicien.id_utilisateur,
          nom: technicien.nom,
          prenoms: technicien.prenoms || "",
          projets_assignes: projets.length,
          taches_completees: tachesCompletes,
          taches_en_retard: tachesEnRetard,
          taux_completion: Math.round(tauxCompletion),
          qualite_rapports: qualiteRapports,
          derniere_activite: derniereActivite,
          presences_semaine: Math.min(5, activitesRecentes) // Max 5 jours de travail par semaine
        };
      });
    },
    enabled: !!superviseurId
  });
};