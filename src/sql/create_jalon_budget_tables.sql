
-- Table pour définir les jalons agricoles
CREATE TABLE IF NOT EXISTS "jalon_agricole" (
  "id_jalon_agricole" SERIAL PRIMARY KEY,
  "id_culture" INTEGER NOT NULL REFERENCES "culture"("id_culture"),
  "nom_jalon" VARCHAR NOT NULL,
  "delai_apres_lancement" INTEGER NOT NULL,
  "description" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "modified_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "created_by" UUID DEFAULT auth.uid()
);

-- Table pour associer les jalons aux projets
CREATE TABLE IF NOT EXISTS "jalon_projet" (
  "id_jalon_projet" SERIAL PRIMARY KEY,
  "id_projet" INTEGER NOT NULL REFERENCES "projet"("id_projet"),
  "id_jalon_agricole" INTEGER NOT NULL REFERENCES "jalon_agricole"("id_jalon_agricole"),
  "date_prev_planifiee" DATE NOT NULL,
  "date_reelle_execution" DATE,
  "statut" VARCHAR NOT NULL DEFAULT 'Prévu',
  "observations" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "modified_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "created_by" UUID DEFAULT auth.uid(),
  CONSTRAINT "statut_check" CHECK (statut IN ('Prévu', 'En cours', 'Terminé', 'Retardé'))
);

-- Table de référence des coûts par jalon et type de culture
CREATE TABLE IF NOT EXISTS "cout_jalon_reference" (
  "id_cout_jalon_reference" SERIAL PRIMARY KEY,
  "id_culture" INTEGER NOT NULL REFERENCES "culture"("id_culture"),
  "id_jalon_agricole" INTEGER NOT NULL REFERENCES "jalon_agricole"("id_jalon_agricole"),
  "type_depense" VARCHAR NOT NULL,
  "montant_par_hectare" DECIMAL(12, 2) NOT NULL,
  "unite" VARCHAR,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "modified_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "created_by" UUID DEFAULT auth.uid()
);

-- Table des coûts prévisionnels par jalon et projet
CREATE TABLE IF NOT EXISTS "cout_jalon_projet" (
  "id_cout_jalon_projet" SERIAL PRIMARY KEY,
  "id_projet" INTEGER NOT NULL REFERENCES "projet"("id_projet"),
  "id_jalon_projet" INTEGER NOT NULL REFERENCES "jalon_projet"("id_jalon_projet"),
  "type_depense" VARCHAR NOT NULL,
  "montant_par_hectare" DECIMAL(12, 2) NOT NULL,
  "montant_total" DECIMAL(12, 2) NOT NULL,
  "montant_total_reel" DECIMAL(12, 2),
  "statut_paiement" VARCHAR NOT NULL DEFAULT 'Non engagé',
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "modified_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "created_by" UUID DEFAULT auth.uid(),
  CONSTRAINT "statut_paiement_check" CHECK (statut_paiement IN ('Non engagé', 'Engagé', 'Payé'))
);

-- Table d'historique des paiements
CREATE TABLE IF NOT EXISTS "historique_paiement" (
  "id_historique_paiement" SERIAL PRIMARY KEY,
  "id_projet" INTEGER NOT NULL REFERENCES "projet"("id_projet"),
  "id_cout_jalon_projet" INTEGER REFERENCES "cout_jalon_projet"("id_cout_jalon_projet"),
  "montant" DECIMAL(12, 2) NOT NULL,
  "id_technicien" UUID REFERENCES auth.users(id),
  "reference_paiement" VARCHAR,
  "type_paiement" VARCHAR NOT NULL,
  "id_responsable_financier" UUID REFERENCES auth.users(id),
  "date_paiement" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "observation" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "modified_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "created_by" UUID DEFAULT auth.uid(),
  CONSTRAINT "type_paiement_check" CHECK (type_paiement IN ('Mobile Banking', 'Chèque de banque', 'Liquide'))
);

-- Trigger pour mettre à jour la date de modification
CREATE OR REPLACE FUNCTION update_modified_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.modified_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Application des triggers sur les tables
CREATE TRIGGER update_jalon_agricole_modified_at
  BEFORE UPDATE ON jalon_agricole
  FOR EACH ROW EXECUTE FUNCTION update_modified_at();

CREATE TRIGGER update_jalon_projet_modified_at
  BEFORE UPDATE ON jalon_projet
  FOR EACH ROW EXECUTE FUNCTION update_modified_at();

CREATE TRIGGER update_cout_jalon_reference_modified_at
  BEFORE UPDATE ON cout_jalon_reference
  FOR EACH ROW EXECUTE FUNCTION update_modified_at();

CREATE TRIGGER update_cout_jalon_projet_modified_at
  BEFORE UPDATE ON cout_jalon_projet
  FOR EACH ROW EXECUTE FUNCTION update_modified_at();

CREATE TRIGGER update_historique_paiement_modified_at
  BEFORE UPDATE ON historique_paiement
  FOR EACH ROW EXECUTE FUNCTION update_modified_at();

-- Fonction pour générer automatiquement les jalons d'un projet lors du lancement
CREATE OR REPLACE FUNCTION generate_project_milestones()
RETURNS TRIGGER AS $$
DECLARE
    culture_record RECORD;
    jalon_record RECORD;
    cout_record RECORD;
    date_lancement DATE;
    date_jalon DATE;
    jalon_projet_id INTEGER;
BEGIN
    -- Vérifier que c'est bien un passage à "en cours"
    IF NEW.statut = 'en cours' AND OLD.statut != 'en cours' THEN
        date_lancement := COALESCE(NEW.date_lancement, CURRENT_DATE);
        
        -- Pour chaque culture du projet
        FOR culture_record IN 
            SELECT pc.id_culture 
            FROM projet_culture pc 
            WHERE pc.id_projet = NEW.id_projet
        LOOP
            -- Pour chaque jalon associé à cette culture
            FOR jalon_record IN 
                SELECT ja.* 
                FROM jalon_agricole ja 
                WHERE ja.id_culture = culture_record.id_culture
            LOOP
                -- Calculer la date prévue du jalon
                date_jalon := date_lancement + (jalon_record.delai_apres_lancement || ' days')::INTERVAL;
                
                -- Créer le jalon pour ce projet
                INSERT INTO jalon_projet (
                    id_projet, 
                    id_jalon_agricole, 
                    date_prev_planifiee, 
                    statut, 
                    created_by
                ) VALUES (
                    NEW.id_projet,
                    jalon_record.id_jalon_agricole,
                    date_jalon,
                    'Prévu',
                    NEW.created_by
                )
                RETURNING id_jalon_projet INTO jalon_projet_id;
                
                -- Générer les coûts associés à ce jalon pour ce projet
                FOR cout_record IN 
                    SELECT * 
                    FROM cout_jalon_reference cjr 
                    WHERE cjr.id_jalon_agricole = jalon_record.id_jalon_agricole 
                    AND cjr.id_culture = culture_record.id_culture
                LOOP
                    INSERT INTO cout_jalon_projet (
                        id_projet,
                        id_jalon_projet,
                        type_depense,
                        montant_par_hectare,
                        montant_total,
                        statut_paiement,
                        created_by
                    ) VALUES (
                        NEW.id_projet,
                        jalon_projet_id,
                        cout_record.type_depense,
                        cout_record.montant_par_hectare,
                        cout_record.montant_par_hectare * NEW.surface_ha,
                        'Non engagé',
                        NEW.created_by
                    );
                END LOOP;
            END LOOP;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attacher le trigger au statut du projet
CREATE TRIGGER project_status_change_trigger
  AFTER UPDATE OF statut ON projet
  FOR EACH ROW
  WHEN (NEW.statut = 'en cours' AND OLD.statut != 'en cours')
  EXECUTE FUNCTION generate_project_milestones();

-- Vue pour le suivi financier des projets
CREATE OR REPLACE VIEW vue_suivi_financier_projet AS
SELECT 
    p.id_projet,
    p.id_tantsaha,
    p.surface_ha,
    p.statut as statut_projet,
    SUM(cjp.montant_total) as cout_total_previsionnel,
    SUM(COALESCE(cjp.montant_total_reel, 0)) as cout_total_reel,
    SUM(CASE WHEN cjp.statut_paiement = 'Payé' THEN cjp.montant_total_reel ELSE 0 END) as total_paye,
    SUM(CASE WHEN cjp.statut_paiement = 'Engagé' THEN cjp.montant_total_reel ELSE 0 END) as total_engage,
    SUM(CASE WHEN cjp.statut_paiement = 'Non engagé' THEN cjp.montant_total ELSE 0 END) as total_non_engage,
    (SELECT SUM(montant) FROM investissement WHERE id_projet = p.id_projet) as total_investissement
FROM 
    projet p
LEFT JOIN 
    cout_jalon_projet cjp ON p.id_projet = cjp.id_projet
GROUP BY 
    p.id_projet, p.id_tantsaha, p.surface_ha, p.statut;

-- Vue pour le suivi des jalons par projet
CREATE OR REPLACE VIEW vue_suivi_jalons_projet AS
SELECT 
    p.id_projet,
    p.statut as statut_projet,
    ja.id_jalon_agricole,
    ja.nom_jalon,
    jp.id_jalon_projet,
    jp.date_prev_planifiee,
    jp.date_reelle_execution,
    jp.statut as statut_jalon,
    CASE 
        WHEN jp.date_reelle_execution IS NULL AND jp.date_prev_planifiee < CURRENT_DATE THEN 'Retard'
        WHEN jp.statut = 'Terminé' AND jp.date_reelle_execution > jp.date_prev_planifiee THEN 'Complété en retard'
        WHEN jp.statut = 'Terminé' AND jp.date_reelle_execution <= jp.date_prev_planifiee THEN 'Complété à temps'
        ELSE 'À venir'
    END as performance_jalon,
    c.nom_culture
FROM 
    projet p
JOIN 
    projet_culture pc ON p.id_projet = pc.id_projet
JOIN 
    culture c ON pc.id_culture = c.id_culture
JOIN 
    jalon_agricole ja ON c.id_culture = ja.id_culture
LEFT JOIN 
    jalon_projet jp ON p.id_projet = jp.id_projet AND ja.id_jalon_agricole = jp.id_jalon_agricole
ORDER BY 
    p.id_projet, jp.date_prev_planifiee;

-- Facilite la conversion de la table jalon existante vers le nouveau système
INSERT INTO jalon_agricole (id_culture, nom_jalon, delai_apres_lancement, description, created_at, created_by)
SELECT 
    j.id_culture,
    j.nom_jalon,
    j.jours_apres_lancement,
    j.action_a_faire,
    j.created_at,
    j.created_by
FROM jalon j
ON CONFLICT DO NOTHING;
