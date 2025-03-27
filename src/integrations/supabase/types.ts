export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      aimer_commentaire: {
        Row: {
          created_at: string | null
          id_aimer_commentaire: number
          id_commentaire: number | null
          id_utilisateur: number | null
        }
        Insert: {
          created_at?: string | null
          id_aimer_commentaire?: number
          id_commentaire?: number | null
          id_utilisateur?: number | null
        }
        Update: {
          created_at?: string | null
          id_aimer_commentaire?: number
          id_commentaire?: number | null
          id_utilisateur?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "aimer_commentaire_id_commentaire_fkey"
            columns: ["id_commentaire"]
            isOneToOne: false
            referencedRelation: "commentaire"
            referencedColumns: ["id_commentaire"]
          },
          {
            foreignKeyName: "aimer_commentaire_id_utilisateur_fkey"
            columns: ["id_utilisateur"]
            isOneToOne: false
            referencedRelation: "utilisateur"
            referencedColumns: ["id_utilisateur"]
          },
        ]
      }
      aimer_projet: {
        Row: {
          created_at: string | null
          id_aimer_projet: number
          id_projet: number | null
          id_utilisateur: number | null
        }
        Insert: {
          created_at?: string | null
          id_aimer_projet?: number
          id_projet?: number | null
          id_utilisateur?: number | null
        }
        Update: {
          created_at?: string | null
          id_aimer_projet?: number
          id_projet?: number | null
          id_utilisateur?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "aimer_projet_id_projet_fkey"
            columns: ["id_projet"]
            isOneToOne: false
            referencedRelation: "projet"
            referencedColumns: ["id_projet"]
          },
          {
            foreignKeyName: "aimer_projet_id_utilisateur_fkey"
            columns: ["id_utilisateur"]
            isOneToOne: false
            referencedRelation: "utilisateur"
            referencedColumns: ["id_utilisateur"]
          },
        ]
      }
      commentaire: {
        Row: {
          date_creation: string | null
          date_modification: string | null
          id_commentaire: number
          id_parent_commentaire: number | null
          id_projet: number | null
          id_utilisateur: number | null
          texte: string | null
        }
        Insert: {
          date_creation?: string | null
          date_modification?: string | null
          id_commentaire?: number
          id_parent_commentaire?: number | null
          id_projet?: number | null
          id_utilisateur?: number | null
          texte?: string | null
        }
        Update: {
          date_creation?: string | null
          date_modification?: string | null
          id_commentaire?: number
          id_parent_commentaire?: number | null
          id_projet?: number | null
          id_utilisateur?: number | null
          texte?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commentaire_id_commentaire_fkey"
            columns: ["id_parent_commentaire"]
            isOneToOne: false
            referencedRelation: "commentaire"
            referencedColumns: ["id_commentaire"]
          },
          {
            foreignKeyName: "commentaire_id_projet_fkey"
            columns: ["id_projet"]
            isOneToOne: false
            referencedRelation: "projet"
            referencedColumns: ["id_projet"]
          },
          {
            foreignKeyName: "commentaire_id_utilisateur_fkey"
            columns: ["id_utilisateur"]
            isOneToOne: false
            referencedRelation: "utilisateur"
            referencedColumns: ["id_utilisateur"]
          },
        ]
      }
      commune: {
        Row: {
          created_at: string | null
          emplacement_chef_lieu: string | null
          id_commune: number
          id_district: number | null
          id_region: number | null
          nom_commune: string
        }
        Insert: {
          created_at?: string | null
          emplacement_chef_lieu?: string | null
          id_commune?: number
          id_district?: number | null
          id_region?: number | null
          nom_commune: string
        }
        Update: {
          created_at?: string | null
          emplacement_chef_lieu?: string | null
          id_commune?: number
          id_district?: number | null
          id_region?: number | null
          nom_commune?: string
        }
        Relationships: [
          {
            foreignKeyName: "commune_id_district_fkey"
            columns: ["id_district"]
            isOneToOne: false
            referencedRelation: "district"
            referencedColumns: ["id_district"]
          },
        ]
      }
      culture: {
        Row: {
          cout_exploitation_ha: number | null
          created_at: string | null
          fiche_technique: string | null
          id_culture: number
          nom_culture: string
          prix_tonne: number | null
          rendement_ha: number | null
        }
        Insert: {
          cout_exploitation_ha?: number | null
          created_at?: string | null
          fiche_technique?: string | null
          id_culture?: number
          nom_culture: string
          prix_tonne?: number | null
          rendement_ha?: number | null
        }
        Update: {
          cout_exploitation_ha?: number | null
          created_at?: string | null
          fiche_technique?: string | null
          id_culture?: number
          nom_culture?: string
          prix_tonne?: number | null
          rendement_ha?: number | null
        }
        Relationships: []
      }
      culture_jalon: {
        Row: {
          created_at: string | null
          id_culture: number | null
          id_culture_jalon: number
          id_jalon: number | null
          jours_apres_lancement: number | null
        }
        Insert: {
          created_at?: string | null
          id_culture?: number | null
          id_culture_jalon?: number
          id_jalon?: number | null
          jours_apres_lancement?: number | null
        }
        Update: {
          created_at?: string | null
          id_culture?: number | null
          id_culture_jalon?: number
          id_jalon?: number | null
          jours_apres_lancement?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "culture_jalon_id_culture_fkey"
            columns: ["id_culture"]
            isOneToOne: false
            referencedRelation: "culture"
            referencedColumns: ["id_culture"]
          },
          {
            foreignKeyName: "culture_jalon_id_jalon_fkey"
            columns: ["id_jalon"]
            isOneToOne: false
            referencedRelation: "jalon"
            referencedColumns: ["id_jalon"]
          },
        ]
      }
      district: {
        Row: {
          created_at: string | null
          emplacement_chef_lieu: string | null
          id_district: number
          id_region: number | null
          nom_district: string
        }
        Insert: {
          created_at?: string | null
          emplacement_chef_lieu?: string | null
          id_district?: number
          id_region?: number | null
          nom_district: string
        }
        Update: {
          created_at?: string | null
          emplacement_chef_lieu?: string | null
          id_district?: number
          id_region?: number | null
          nom_district?: string
        }
        Relationships: [
          {
            foreignKeyName: "district_id_region_fkey"
            columns: ["id_region"]
            isOneToOne: false
            referencedRelation: "region"
            referencedColumns: ["id_region"]
          },
        ]
      }
      investissement: {
        Row: {
          created_at: string | null
          date_decision_investir: string | null
          date_paiement: string | null
          id_investissement: number
          id_projet: number | null
          id_utilisateur: number | null
          montant: number
          reference_paiement: string | null
        }
        Insert: {
          created_at?: string | null
          date_decision_investir?: string | null
          date_paiement?: string | null
          id_investissement?: number
          id_projet?: number | null
          id_utilisateur?: number | null
          montant: number
          reference_paiement?: string | null
        }
        Update: {
          created_at?: string | null
          date_decision_investir?: string | null
          date_paiement?: string | null
          id_investissement?: number
          id_projet?: number | null
          id_utilisateur?: number | null
          montant?: number
          reference_paiement?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investissement_id_projet_fkey"
            columns: ["id_projet"]
            isOneToOne: false
            referencedRelation: "projet"
            referencedColumns: ["id_projet"]
          },
          {
            foreignKeyName: "investissement_id_utilisateur_fkey"
            columns: ["id_utilisateur"]
            isOneToOne: false
            referencedRelation: "utilisateur"
            referencedColumns: ["id_utilisateur"]
          },
        ]
      }
      jalon: {
        Row: {
          action_a_faire: string | null
          created_at: string | null
          id_jalon: number
          nom_jalon: string
        }
        Insert: {
          action_a_faire?: string | null
          created_at?: string | null
          id_jalon?: number
          nom_jalon: string
        }
        Update: {
          action_a_faire?: string | null
          created_at?: string | null
          id_jalon?: number
          nom_jalon?: string
        }
        Relationships: []
      }
      projet: {
        Row: {
          created_at: string | null
          id_commune: number | null
          id_district: number | null
          id_projet: number
          id_region: number | null
          id_superviseur: number
          id_tantsaha: number
          id_technicien: number
          statut: string | null
          surface_ha: number
        }
        Insert: {
          created_at?: string | null
          id_commune?: number | null
          id_district?: number | null
          id_projet?: number
          id_region?: number | null
          id_superviseur: number
          id_tantsaha: number
          id_technicien: number
          statut?: string | null
          surface_ha: number
        }
        Update: {
          created_at?: string | null
          id_commune?: number | null
          id_district?: number | null
          id_projet?: number
          id_region?: number | null
          id_superviseur?: number
          id_tantsaha?: number
          id_technicien?: number
          statut?: string | null
          surface_ha?: number
        }
        Relationships: [
          {
            foreignKeyName: "projet_id_commune_fkey"
            columns: ["id_commune"]
            isOneToOne: false
            referencedRelation: "commune"
            referencedColumns: ["id_commune"]
          },
          {
            foreignKeyName: "projet_id_district_fkey"
            columns: ["id_district"]
            isOneToOne: false
            referencedRelation: "district"
            referencedColumns: ["id_district"]
          },
          {
            foreignKeyName: "projet_id_region_fkey"
            columns: ["id_region"]
            isOneToOne: false
            referencedRelation: "region"
            referencedColumns: ["id_region"]
          },
          {
            foreignKeyName: "projet_id_superviseur_fkey"
            columns: ["id_superviseur"]
            isOneToOne: false
            referencedRelation: "utilisateur"
            referencedColumns: ["id_utilisateur"]
          },
          {
            foreignKeyName: "projet_id_tantsaha_fkey"
            columns: ["id_tantsaha"]
            isOneToOne: false
            referencedRelation: "utilisateur"
            referencedColumns: ["id_utilisateur"]
          },
          {
            foreignKeyName: "projet_id_technicien_fkey"
            columns: ["id_technicien"]
            isOneToOne: false
            referencedRelation: "utilisateur"
            referencedColumns: ["id_utilisateur"]
          },
        ]
      }
      projet_culture: {
        Row: {
          cout_exploitation_previsionnel: number | null
          cout_exploitation_reel: number | null
          created_at: string | null
          date_debut_previsionnelle: string | null
          date_debut_reelle: string | null
          id_culture: number | null
          id_projet: number | null
          id_projet_culture: number
          rendement_previsionnel: number | null
          rendement_reel: number | null
        }
        Insert: {
          cout_exploitation_previsionnel?: number | null
          cout_exploitation_reel?: number | null
          created_at?: string | null
          date_debut_previsionnelle?: string | null
          date_debut_reelle?: string | null
          id_culture?: number | null
          id_projet?: number | null
          id_projet_culture?: number
          rendement_previsionnel?: number | null
          rendement_reel?: number | null
        }
        Update: {
          cout_exploitation_previsionnel?: number | null
          cout_exploitation_reel?: number | null
          created_at?: string | null
          date_debut_previsionnelle?: string | null
          date_debut_reelle?: string | null
          id_culture?: number | null
          id_projet?: number | null
          id_projet_culture?: number
          rendement_previsionnel?: number | null
          rendement_reel?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projet_culture_id_culture_fkey"
            columns: ["id_culture"]
            isOneToOne: false
            referencedRelation: "culture"
            referencedColumns: ["id_culture"]
          },
          {
            foreignKeyName: "projet_culture_id_projet_fkey"
            columns: ["id_projet"]
            isOneToOne: false
            referencedRelation: "projet"
            referencedColumns: ["id_projet"]
          },
        ]
      }
      projet_jalon: {
        Row: {
          created_at: string | null
          date_previsionnelle: string | null
          date_reelle: string | null
          id_jalon: number | null
          id_projet: number | null
          id_projet_jalon: number
        }
        Insert: {
          created_at?: string | null
          date_previsionnelle?: string | null
          date_reelle?: string | null
          id_jalon?: number | null
          id_projet?: number | null
          id_projet_jalon?: number
        }
        Update: {
          created_at?: string | null
          date_previsionnelle?: string | null
          date_reelle?: string | null
          id_jalon?: number | null
          id_projet?: number | null
          id_projet_jalon?: number
        }
        Relationships: [
          {
            foreignKeyName: "projet_jalon_id_jalon_fkey"
            columns: ["id_jalon"]
            isOneToOne: false
            referencedRelation: "jalon"
            referencedColumns: ["id_jalon"]
          },
          {
            foreignKeyName: "projet_jalon_id_projet_fkey"
            columns: ["id_projet"]
            isOneToOne: false
            referencedRelation: "projet"
            referencedColumns: ["id_projet"]
          },
        ]
      }
      province: {
        Row: {
          created_at: string | null
          emplacement_chef_lieu: string | null
          id_province: number
          nom_province: string
        }
        Insert: {
          created_at?: string | null
          emplacement_chef_lieu?: string | null
          id_province?: number
          nom_province: string
        }
        Update: {
          created_at?: string | null
          emplacement_chef_lieu?: string | null
          id_province?: number
          nom_province?: string
        }
        Relationships: []
      }
      region: {
        Row: {
          created_at: string | null
          emplacement_chef_lieu: string | null
          id_province: number
          id_region: number
          nom_region: string
        }
        Insert: {
          created_at?: string | null
          emplacement_chef_lieu?: string | null
          id_province: number
          id_region?: number
          nom_region: string
        }
        Update: {
          created_at?: string | null
          emplacement_chef_lieu?: string | null
          id_province?: number
          id_region?: number
          nom_region?: string
        }
        Relationships: [
          {
            foreignKeyName: "region_id_province_fkey"
            columns: ["id_province"]
            isOneToOne: false
            referencedRelation: "province"
            referencedColumns: ["id_province"]
          },
        ]
      }
      terrain: {
        Row: {
          acces_eau: boolean | null
          acces_route: boolean | null
          created_at: string | null
          id_commune: number | null
          id_district: number | null
          id_region: number | null
          id_superviseur: number | null
          id_tantsaha: number | null
          id_technicien: number | null
          id_terrain: number
          statut: boolean | null
          surface_proposee: number
          surface_validee: number
        }
        Insert: {
          acces_eau?: boolean | null
          acces_route?: boolean | null
          created_at?: string | null
          id_commune?: number | null
          id_district?: number | null
          id_region?: number | null
          id_superviseur?: number | null
          id_tantsaha?: number | null
          id_technicien?: number | null
          id_terrain?: number
          statut?: boolean | null
          surface_proposee: number
          surface_validee: number
        }
        Update: {
          acces_eau?: boolean | null
          acces_route?: boolean | null
          created_at?: string | null
          id_commune?: number | null
          id_district?: number | null
          id_region?: number | null
          id_superviseur?: number | null
          id_tantsaha?: number | null
          id_technicien?: number | null
          id_terrain?: number
          statut?: boolean | null
          surface_proposee?: number
          surface_validee?: number
        }
        Relationships: [
          {
            foreignKeyName: "terrain_id_commune_fkey"
            columns: ["id_commune"]
            isOneToOne: false
            referencedRelation: "commune"
            referencedColumns: ["id_commune"]
          },
          {
            foreignKeyName: "terrain_id_district_fkey"
            columns: ["id_district"]
            isOneToOne: false
            referencedRelation: "district"
            referencedColumns: ["id_district"]
          },
          {
            foreignKeyName: "terrain_id_region_fkey"
            columns: ["id_region"]
            isOneToOne: false
            referencedRelation: "region"
            referencedColumns: ["id_region"]
          },
          {
            foreignKeyName: "terrain_id_superviseur_fkey"
            columns: ["id_superviseur"]
            isOneToOne: false
            referencedRelation: "utilisateur"
            referencedColumns: ["id_utilisateur"]
          },
          {
            foreignKeyName: "terrain_id_tantsaha_fkey"
            columns: ["id_tantsaha"]
            isOneToOne: false
            referencedRelation: "utilisateur"
            referencedColumns: ["id_utilisateur"]
          },
          {
            foreignKeyName: "terrain_id_technicien_fkey"
            columns: ["id_technicien"]
            isOneToOne: false
            referencedRelation: "utilisateur"
            referencedColumns: ["id_utilisateur"]
          },
        ]
      }
      utilisateur: {
        Row: {
          created_at: string | null
          email: string
          id_utilisateur: number
          mot_de_passe: string
          nom: string
          photo_courant: boolean | null
          photo_profil: string | null
          role: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id_utilisateur?: number
          mot_de_passe: string
          nom: string
          photo_courant?: boolean | null
          photo_profil?: string | null
          role?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id_utilisateur?: number
          mot_de_passe?: string
          nom?: string
          photo_courant?: boolean | null
          photo_profil?: string | null
          role?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
