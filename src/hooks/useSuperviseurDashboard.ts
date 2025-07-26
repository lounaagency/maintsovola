import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PerformanceKPI } from "@/types/superviseur";

export const useSuperviseurDashboard = (superviseurId: string) => {
  return useQuery({
    queryKey: ["superviseur-dashboard", superviseurId],
    queryFn: async (): Promise<PerformanceKPI> => {
      const [projectsResult, alertsResult, jalonsResult, paymentsResult] = await Promise.all([
        // Récupérer les projets du superviseur
        supabase
          .from("projet")
          .select(`
            id_projet,
            statut,
            date_debut_production,
            created_at,
            commentaire(id_commentaire)
          `)
          .eq("id_superviseur", superviseurId),
        
        // Récupérer les alertes actives
        supabase
          .from("notification")
          .select("*")
          .eq("id_destinataire", superviseurId)
          .eq("lu", false)
          .eq("type", "alerte"),
        
        // Récupérer les jalons pour calculer la productivité
        supabase
          .from("jalon_projet")
          .select(`
            statut,
            date_previsionnelle,
            date_reelle,
            projet!inner(id_superviseur)
          `)
          .eq("projet.id_superviseur", superviseurId),

        // Récupérer les paiements pour les incidents résolus
        supabase
          .from("historique_paiement")
          .select(`
            id_historique_paiement,
            created_at,
            projet!inner(id_superviseur)
          `)
          .eq("projet.id_superviseur", superviseurId)
          .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // 30 derniers jours
      ]);

      const projects = projectsResult.data || [];
      const alerts = alertsResult.data || [];
      const jalons = jalonsResult.data || [];
      const payments = paymentsResult.data || [];
      
      const projetsTotal = projects.length;
      const projetsEnCours = projects.filter(p => p.statut === "en_cours").length;
      const projetsEnRetard = projects.filter(p => p.statut === "en_retard").length;
      
      const tauxReussite = projetsTotal > 0 ? 
        ((projetsTotal - projetsEnRetard) / projetsTotal) * 100 : 0;

      // Calculer la productivité basée sur les jalons
      const jalonsTotal = jalons.length;
      const jalonsCompletes = jalons.filter(j => j.statut === "Terminé").length;
      const jalonsEnRetard = jalons.filter(j => 
        j.statut !== "Terminé" && new Date(j.date_previsionnelle) < new Date()
      ).length;
      const productiviteMoyenne = jalonsTotal > 0 ? 
        ((jalonsCompletes / jalonsTotal) * 100) : 0;

      // Calculer satisfaction basée sur les commentaires positifs (approximation)
      const totalCommentaires = projects.reduce((acc, p) => acc + (p.commentaire?.length || 0), 0);
      const satisfactionAgriculteurs = totalCommentaires > 0 ? 
        Math.min(95, 70 + (totalCommentaires * 2)) : 75; // Base 75% + bonus pour engagement

      return {
        periode: "current",
        projets_total: projetsTotal,
        projets_en_cours: projetsEnCours,
        projets_en_retard: projetsEnRetard,
        taux_reussite: Math.round(tauxReussite),
        productivite_moyenne: Math.round(productiviteMoyenne),
        incidents_resolus: payments.length, // Paiements récents = incidents résolus
        satisfaction_agriculteurs: Math.round(satisfactionAgriculteurs)
      };
    },
    enabled: !!superviseurId
  });
};