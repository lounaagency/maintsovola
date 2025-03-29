
-- Création de la table de téléphones utilisateurs
CREATE TABLE IF NOT EXISTS public.telephone (
  id_telephone SERIAL PRIMARY KEY,
  id_utilisateur UUID REFERENCES auth.users(id) NOT NULL,
  numero VARCHAR NOT NULL,
  type VARCHAR NOT NULL DEFAULT 'principal',
  est_whatsapp BOOLEAN DEFAULT FALSE,
  est_mobile_banking BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  modified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ajout d'une colonne photo_couverture à la table utilisateur si elle n'existe pas déjà
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'utilisateur'
    AND column_name = 'photo_couverture'
  ) THEN
    ALTER TABLE public.utilisateur ADD COLUMN photo_couverture VARCHAR;
  END IF;
END
$$;

-- Trigger pour la colonne modified_at
CREATE TRIGGER trigger_set_modified_at_telephone
BEFORE UPDATE ON public.telephone
FOR EACH ROW
EXECUTE FUNCTION public.set_created_by_and_modified_at();

-- Politiques RLS pour telephone
ALTER TABLE public.telephone ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes
DO $$
BEGIN
  DROP POLICY IF EXISTS "Utilisateurs peuvent voir leurs téléphones" ON public.telephone;
  DROP POLICY IF EXISTS "Utilisateurs peuvent gérer leurs téléphones" ON public.telephone;
END
$$;

-- Ajouter les nouvelles politiques
CREATE POLICY "Utilisateurs peuvent voir leurs téléphones" 
ON public.telephone FOR SELECT 
TO authenticated 
USING (id_utilisateur = auth.uid());

CREATE POLICY "Utilisateurs peuvent gérer leurs téléphones" 
ON public.telephone FOR ALL
TO authenticated 
USING (id_utilisateur = auth.uid())
WITH CHECK (id_utilisateur = auth.uid());

-- Création d'un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_telephone_utilisateur ON public.telephone(id_utilisateur);
