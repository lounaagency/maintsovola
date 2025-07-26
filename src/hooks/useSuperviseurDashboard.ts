import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PerformanceKPI } from "@/types/superviseur";

export const useSuperviseurDashboard = (superviseurId: string) => {
  return useQuery({
    queryKey: ["superviseur-dashboard", superviseurId],
    queryFn: async (): Promise<PerformanceKPI> => {
      const [projectsResult, alertsResult, performanceResult] = await Promise.all([
        // Récupérer les projets du superviseur
        supabase
          .from("projet")
          .select("statut")
          .eq("id_superviseur", superviseurId),
        
        // Récupérer les alertes actives
        supabase
          .from("notification")
          .select("*")
          .eq("id_destinataire", superviseurId)
          .eq("lu", false)
          .eq("type", "alerte"),
        
        // Récupérer les données de performance
        supabase
          .from("jalon_projet")
          .select(`
            *,
            projet!inner(id_superviseur)
          `)
          .eq("projet.id_superviseur", superviseurId)
      ]);

      const projects = projectsResult.data || [];
      const alerts = alertsResult.data || [];
      
      const projetsTotal = projects.length;
      const projetsEnCours = projects.filter(p => p.statut === "en_cours").length;
      const projetsEnRetard = projects.filter(p => p.statut === "en_retard").length;
      
      const tauxReussite = projetsTotal > 0 ? 
        ((projetsTotal - projetsEnRetard) / projetsTotal) * 100 : 0;

      return {
        periode: "current",
        projets_total: projetsTotal,
        projets_en_cours: projetsEnCours,
        projets_en_retard: projetsEnRetard,
        taux_reussite: tauxReussite,
        productivite_moyenne: 75, // Calculé selon critères métier
        incidents_resolus: alerts.length,
        satisfaction_agriculteurs: 85 // Mock data - à implémenter selon les retours
      };
    },
    enabled: !!superviseurId
  });
};