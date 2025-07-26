-- Créer la table demande_materiel pour les demandes logistiques
CREATE TABLE public.demande_materiel (
  id_demande SERIAL PRIMARY KEY,
  id_superviseur UUID NOT NULL,
  type_materiel VARCHAR(50) NOT NULL CHECK (type_materiel IN ('semences', 'engrais', 'outils', 'equipement', 'autre')),
  description TEXT NOT NULL,
  quantite NUMERIC NOT NULL CHECK (quantite > 0),
  unite VARCHAR(20) DEFAULT 'kg',
  urgence VARCHAR(20) NOT NULL DEFAULT 'normale' CHECK (urgence IN ('normale', 'urgente', 'critique')),
  statut VARCHAR(20) NOT NULL DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'approuvee', 'en_cours', 'livree', 'refusee')),
  date_demande TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  date_livraison_souhaitee TIMESTAMP WITH TIME ZONE NOT NULL,
  date_livraison_reelle TIMESTAMP WITH TIME ZONE,
  projet_concerne INTEGER REFERENCES public.projet(id_projet),
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  modified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID DEFAULT auth.uid()
);

-- Activer RLS
ALTER TABLE public.demande_materiel ENABLE ROW LEVEL SECURITY;

-- Politique pour que les superviseurs voient leurs demandes
CREATE POLICY "Superviseurs peuvent voir leurs demandes" 
ON public.demande_materiel 
FOR SELECT 
USING (id_superviseur = auth.uid());

-- Politique pour que les superviseurs créent leurs demandes
CREATE POLICY "Superviseurs peuvent créer leurs demandes" 
ON public.demande_materiel 
FOR INSERT 
WITH CHECK (id_superviseur = auth.uid());

-- Politique pour que les superviseurs modifient leurs demandes
CREATE POLICY "Superviseurs peuvent modifier leurs demandes" 
ON public.demande_materiel 
FOR UPDATE 
USING (id_superviseur = auth.uid());

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION public.update_modified_at_demande_materiel()
RETURNS TRIGGER AS $$
BEGIN
  NEW.modified_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_demande_materiel_modified_at
  BEFORE UPDATE ON public.demande_materiel
  FOR EACH ROW
  EXECUTE FUNCTION public.update_modified_at_demande_materiel();

-- Index pour les performances
CREATE INDEX idx_demande_materiel_superviseur ON public.demande_materiel(id_superviseur);
CREATE INDEX idx_demande_materiel_statut ON public.demande_materiel(statut);
CREATE INDEX idx_demande_materiel_urgence ON public.demande_materiel(urgence);