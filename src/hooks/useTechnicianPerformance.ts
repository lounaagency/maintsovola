import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TechnicianPerformance } from "@/types/superviseur";

export const useTechnicianPerformance = (superviseurId: string) => {
  return useQuery({
    queryKey: ["technician-performance", superviseurId],
    queryFn: async (): Promise<TechnicianPerformance[]> => {
      const { data, error } = await supabase
        .from("utilisateur")
        .select(`
          id_utilisateur,
          nom,
          prenoms,
          role!inner(nom_role),
          projet!projet_id_technicien_fkey(
            id_projet,
            id_superviseur,
            jalon_projet(
              statut,
              date_previsionnelle,
              date_reelle
            )
          )
        `)
        .eq("role.nom_role", "technicien")
        .eq("projet.id_superviseur", superviseurId);

      if (error) throw error;

      return (data || []).map(technicien => {
        const projets = technicien.projet || [];
        const tachesTotales = projets.reduce((acc, p) => acc + (p.jalon_projet?.length || 0), 0);
        const tachesCompletes = projets.reduce((acc, p) => 
          acc + (p.jalon_projet?.filter(j => j.statut === "Terminé").length || 0), 0);
        const tachesEnRetard = projets.reduce((acc, p) => 
          acc + (p.jalon_projet?.filter(j => 
            j.statut !== "Terminé" && 
            new Date(j.date_previsionnelle) < new Date()
          ).length || 0), 0);

        const tauxCompletion = tachesTotales > 0 ? (tachesCompletes / tachesTotales) * 100 : 0;

        return {
          id_technicien: technicien.id_utilisateur,
          nom: technicien.nom,
          prenoms: technicien.prenoms || "",
          projets_assignes: projets.length,
          taches_completees: tachesCompletes,
          taches_en_retard: tachesEnRetard,
          taux_completion: Math.round(tauxCompletion),
          qualite_rapports: 85, // À calculer selon critères de qualité
          derniere_activite: new Date().toISOString(),
          presences_semaine: 5 // Mock data - à implémenter selon système de présence
        };
      });
    },
    enabled: !!superviseurId
  });
};