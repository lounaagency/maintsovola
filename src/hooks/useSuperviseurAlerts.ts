import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProjectAlert } from "@/types/superviseur";

export const useSuperviseurAlerts = (superviseurId: string) => {
  return useQuery({
    queryKey: ["superviseur-alerts", superviseurId],
    queryFn: async (): Promise<ProjectAlert[]> => {
      // Récupérer les alertes existantes depuis les notifications
      const { data: notifications, error: notifError } = await supabase
        .from("notification")
        .select(`
          id_notification,
          titre,
          message,
          type,
          date_creation,
          lu,
          projet_id
        `)
        .eq("id_destinataire", superviseurId)
        .eq("type", "alerte")
        .order("date_creation", { ascending: false });

      if (notifError) throw notifError;

      // Générer des alertes automatiques basées sur les jalons en retard
      const { data: jalonsEnRetard, error: jalonsError } = await supabase
        .from("jalon_projet")
        .select(`
          id_jalon_projet,
          statut,
          date_previsionnelle,
          projet!inner(
            id_projet,
            titre,
            id_superviseur,
            id_technicien
          )
        `)
        .eq("projet.id_superviseur", superviseurId)
        .neq("statut", "Terminé")
        .lt("date_previsionnelle", new Date().toISOString());

      if (jalonsError) throw jalonsError;

      // Récupérer les coûts qui dépassent le budget
      const { data: coutsBudget, error: coutsError } = await supabase
        .from("cout_jalon_projet")
        .select(`
          id_cout_jalon_projet,
          montant_total,
          montant_total_reel,
          type_depense,
          projet!inner(
            id_projet,
            titre,
            id_superviseur,
            id_technicien
          )
        `)
        .eq("projet.id_superviseur", superviseurId)
        .not("montant_total_reel", "is", null);

      if (coutsError) throw coutsError;

      const alertes: ProjectAlert[] = [];

      // Ajouter les alertes depuis les notifications
      alertes.push(
        ...(notifications || []).map((notification) => ({
          id_alerte: notification.id_notification,
          type: "anomalie" as const,
          gravite: "moyenne" as const,
          message: notification.message,
          date_creation: notification.date_creation,
          statut: (notification.lu ? "resolue" : "ouverte") as ProjectAlert['statut'],
          id_projet: notification.projet_id || 0,
          id_technicien: undefined
        }))
      );

      // Générer alertes pour jalons en retard
      (jalonsEnRetard || []).forEach((jalon) => {
        const joursRetard = Math.floor(
          (new Date().getTime() - new Date(jalon.date_previsionnelle).getTime()) / (1000 * 60 * 60 * 24)
        );
        
        alertes.push({
          id_alerte: -jalon.id_jalon_projet, // ID négatif pour les alertes générées
          type: "retard" as const,
          gravite: joursRetard > 7 ? "critique" : joursRetard > 3 ? "haute" : "moyenne" as const,
          message: `Jalon en retard de ${joursRetard} jour(s) sur le projet "${jalon.projet.titre}"`,
          date_creation: new Date().toISOString(),
          statut: "ouverte" as const,
          id_projet: jalon.projet.id_projet,
          id_technicien: jalon.projet.id_technicien
        });
      });

      // Générer alertes pour dépassements budgétaires
      (coutsBudget || []).forEach((cout) => {
        if (cout.montant_total_reel && cout.montant_total_reel > cout.montant_total * 1.1) {
          const depassement = ((cout.montant_total_reel - cout.montant_total) / cout.montant_total * 100).toFixed(1);
          
          alertes.push({
            id_alerte: -cout.id_cout_jalon_projet - 100000, // ID négatif unique
            type: "blocage" as const,
            gravite: cout.montant_total_reel > cout.montant_total * 1.2 ? "critique" : "haute" as const,
            message: `Dépassement budgétaire de ${depassement}% pour ${cout.type_depense} sur "${cout.projet.titre}"`,
            date_creation: new Date().toISOString(),
            statut: "ouverte" as const,
            id_projet: cout.projet.id_projet,
            id_technicien: cout.projet.id_technicien
          });
        }
      });

      // Trier par gravité et date
      return alertes.sort((a, b) => {
        const graviteOrder = { "critique": 4, "haute": 3, "moyenne": 2, "faible": 1 };
        const graviteA = graviteOrder[a.gravite];
        const graviteB = graviteOrder[b.gravite];
        
        if (graviteA !== graviteB) return graviteB - graviteA;
        return new Date(b.date_creation).getTime() - new Date(a.date_creation).getTime();
      });
    },
    enabled: !!superviseurId
  });
};