
-- Création de la table des conversations
CREATE TABLE IF NOT EXISTS public.conversation (
  id_conversation SERIAL PRIMARY KEY,
  id_utilisateur1 UUID REFERENCES auth.users(id) NOT NULL,
  id_utilisateur2 UUID REFERENCES auth.users(id) NOT NULL,
  derniere_activite TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Création de la table des messages
CREATE TABLE IF NOT EXISTS public.message (
  id_message SERIAL PRIMARY KEY,
  id_conversation INTEGER REFERENCES public.conversation(id_conversation),
  id_expediteur UUID REFERENCES auth.users(id) NOT NULL,
  id_destinataire UUID REFERENCES auth.users(id) NOT NULL,
  contenu TEXT NOT NULL,
  date_envoi TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  lu BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT DEFAULT auth.uid(),
  modified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger pour la colonne modified_at
CREATE TRIGGER trigger_set_modified_at_message
BEFORE UPDATE ON public.message
FOR EACH ROW
EXECUTE FUNCTION public.set_created_by_and_modified_at();

-- Politiques RLS pour conversation
ALTER TABLE public.conversation ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes pour conversation
DO $$
BEGIN
  DROP POLICY IF EXISTS "Utilisateurs peuvent voir leurs conversations" ON public.conversation;
  DROP POLICY IF EXISTS "Utilisateurs peuvent créer leurs conversations" ON public.conversation;
END
$$;

-- Ajouter les nouvelles politiques pour conversation
CREATE POLICY "Utilisateurs peuvent voir leurs conversations" 
ON public.conversation FOR SELECT 
TO authenticated 
USING (id_utilisateur1 = auth.uid() OR id_utilisateur2 = auth.uid());

CREATE POLICY "Utilisateurs peuvent créer leurs conversations" 
ON public.conversation FOR INSERT 
TO authenticated 
WITH CHECK (id_utilisateur1 = auth.uid() OR id_utilisateur2 = auth.uid());

-- Politiques RLS pour message
ALTER TABLE public.message ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes pour message
DO $$
BEGIN
  DROP POLICY IF EXISTS "Utilisateurs peuvent voir leurs messages" ON public.message;
  DROP POLICY IF EXISTS "Utilisateurs peuvent envoyer des messages" ON public.message;
  DROP POLICY IF EXISTS "Utilisateurs peuvent marquer leurs messages comme lus" ON public.message;
END
$$;

-- Ajouter les nouvelles politiques pour message
CREATE POLICY "Utilisateurs peuvent voir leurs messages" 
ON public.message FOR SELECT 
TO authenticated 
USING (id_expediteur = auth.uid() OR id_destinataire = auth.uid());

CREATE POLICY "Utilisateurs peuvent envoyer des messages" 
ON public.message FOR INSERT 
TO authenticated 
WITH CHECK (id_expediteur = auth.uid());

CREATE POLICY "Utilisateurs peuvent marquer leurs messages comme lus" 
ON public.message FOR UPDATE 
TO authenticated 
USING (id_destinataire = auth.uid());

-- Création d'un index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_message_conversation ON public.message(id_conversation);
CREATE INDEX IF NOT EXISTS idx_conversation_users ON public.conversation(id_utilisateur1, id_utilisateur2);
