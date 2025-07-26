import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProjectOverview } from "@/types/superviseur";

export const useSuperviseurProjects = (superviseurId: string) => {
  return useQuery({
    queryKey: ["superviseur-projects", superviseurId],
    queryFn: async (): Promise<ProjectOverview[]> => {
      const { data, error } = await supabase
        .from("projet")
        .select(`
          id_projet,
          titre,
          statut,
          surface_ha,
          date_debut_production,
          id_technicien,
          technicien_user:utilisateur!id_technicien(nom, prenoms),
          jalon_projet(
            statut,
            date_previsionnelle,
            date_reelle
          )
        `)
        .eq("id_superviseur", superviseurId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map(projet => {
        const jalons = projet.jalon_projet || [];
        const jalonsCompletes = jalons.filter(j => j.statut === "Terminé").length;
        const jalonsTotal = jalons.length;
        const avancement = jalonsTotal > 0 ? (jalonsCompletes / jalonsTotal) * 100 : 0;
        
        const jalonsEnRetard = jalons.filter(j => 
          j.statut !== "Terminé" && 
          new Date(j.date_previsionnelle) < new Date()
        ).length;

        // Calculer les alertes pour ce projet
        const alertes: any[] = [];
        
        // Alerte si jalons en retard
        if (jalonsEnRetard > 0) {
          alertes.push({
            id_alerte: `retard-${projet.id_projet}`,
            type: "retard",
            gravite: jalonsEnRetard > 2 ? "haute" : "moyenne",
            message: `${jalonsEnRetard} jalon(s) en retard`,
            date_creation: new Date().toISOString(),
            statut: "ouverte",
            id_projet: projet.id_projet,
            id_technicien: projet.id_technicien
          });
        }

        // Alerte si pas de technicien assigné
        if (!projet.id_technicien) {
          alertes.push({
            id_alerte: `no-tech-${projet.id_projet}`,
            type: "materiel",
            gravite: "haute",
            message: "Aucun technicien assigné",
            date_creation: new Date().toISOString(),
            statut: "ouverte",
            id_projet: projet.id_projet,
            id_technicien: null
          });
        }

        // Alerte si faible avancement (< 30% après 30 jours)
        const joursDepuisDebut = projet.date_debut_production ? 
          Math.floor((new Date().getTime() - new Date(projet.date_debut_production).getTime()) / (1000 * 60 * 60 * 24)) : 0;
        
        if (joursDepuisDebut > 30 && avancement < 30) {
          alertes.push({
            id_alerte: `slow-progress-${projet.id_projet}`,
            type: "anomalie",
            gravite: "moyenne",
            message: `Avancement lent: ${Math.round(avancement)}% après ${joursDepuisDebut} jours`,
            date_creation: new Date().toISOString(),
            statut: "ouverte",
            id_projet: projet.id_projet,
            id_technicien: projet.id_technicien
          });
        }

        return {
          id_projet: projet.id_projet,
          titre: projet.titre || `Projet ${projet.id_projet}`,
          statut: projet.statut || "en_attente",
          avancement_pourcentage: Math.round(avancement),
          technicien_assigne: {
            id_utilisateur: projet.id_technicien || "",
            nom: projet.technicien_user?.nom || "Non assigné",
            prenoms: projet.technicien_user?.prenoms || ""
          },
          alertes: alertes,
          retards: jalonsEnRetard,
          derniere_activite: projet.date_debut_production || new Date().toISOString()
        };
      });
    },
    enabled: !!superviseurId
  });
};