import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProjectAlert } from "@/types/superviseur";

export const useSuperviseurAlerts = (superviseurId: string) => {
  return useQuery({
    queryKey: ["superviseur-alerts", superviseurId],
    queryFn: async (): Promise<ProjectAlert[]> => {
      const { data, error } = await supabase
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

      if (error) throw error;

      return (data || []).map((notification, index) => ({
        id_alerte: notification.id_notification,
        type: "retard" as const, // À déterminer selon le contenu du message
        gravite: index % 2 === 0 ? "haute" : "moyenne" as const, // Logic temporaire
        message: notification.message,
        date_creation: notification.date_creation,
        statut: notification.lu ? "resolue" : "ouverte" as const,
        id_projet: notification.projet_id || 0,
        id_technicien: undefined
      }));
    },
    enabled: !!superviseurId
  });
};