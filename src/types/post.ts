
export interface Post {
  id: number;
  title: string;
  content: string;
  created_at: string;
  entity_type?: string;
  entity_id?: number;
  id_utilisateur: string;
  author?: {
    nom?: string;
    prenoms?: string;
    avatar_url?: string;
  };
}
