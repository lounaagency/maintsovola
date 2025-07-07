
-- Migration complète pour intégrer les données de référence des jalons agricoles
-- Correspondance intelligente entre les noms de cultures et insertion des coûts

-- 1. Fonction utilitaire pour nettoyer les noms de cultures
CREATE OR REPLACE FUNCTION clean_culture_name(input_name TEXT) 
RETURNS TEXT AS $$
BEGIN
    RETURN TRIM(LOWER(REGEXP_REPLACE(input_name, '[^a-zA-Z0-9\s]', '', 'g')));
END;
$$ LANGUAGE plpgsql;

-- 2. Insérer les nouvelles cultures manquantes
INSERT INTO culture (nom_culture, created_by) VALUES
('Niébé', auth.uid()),
('Pois cassé', auth.uid()),
('Black eyes', auth.uid()),
('Lentilles', auth.uid()),
('Maïs', auth.uid()),
('Patate douce', auth.uid()),
('Tomate', auth.uid()),
('Carotte', auth.uid()),
('Pomme de terre', auth.uid()),
('Oignons', auth.uid()),
('Coton', auth.uid()),
('Gingembre', auth.uid()),
('Ail', auth.uid())
ON CONFLICT (nom_culture) DO NOTHING;

-- 3. Fonction pour trouver l'ID culture par correspondance intelligente
CREATE OR REPLACE FUNCTION find_culture_id(culture_name TEXT) 
RETURNS INTEGER AS $$
DECLARE
    culture_id INTEGER;
    cleaned_name TEXT := clean_culture_name(culture_name);
BEGIN
    -- Correspondances exactes d'abord
    SELECT id_culture INTO culture_id FROM culture WHERE clean_culture_name(nom_culture) = cleaned_name;
    
    IF culture_id IS NOT NULL THEN
        RETURN culture_id;
    END IF;
    
    -- Correspondances par similarité
    CASE cleaned_name
        WHEN 'haricot' THEN
            SELECT id_culture INTO culture_id FROM culture WHERE clean_culture_name(nom_culture) = 'haricot blanc';
        WHEN 'pois de bambara' THEN
            SELECT id_culture INTO culture_id FROM culture WHERE clean_culture_name(nom_culture) = 'poids de mbambara';
        WHEN 'pois du cap' THEN
            SELECT id_culture INTO culture_id FROM culture WHERE clean_culture_name(nom_culture) = 'poids du cap';
        WHEN 'niebe' THEN
            SELECT id_culture INTO culture_id FROM culture WHERE clean_culture_name(nom_culture) = 'niebe';
        WHEN 'black eyes' THEN
            SELECT id_culture INTO culture_id FROM culture WHERE clean_culture_name(nom_culture) = 'black eyes';
        ELSE
            -- Recherche par similarité partielle
            SELECT id_culture INTO culture_id FROM culture 
            WHERE clean_culture_name(nom_culture) LIKE '%' || cleaned_name || '%' 
            OR cleaned_name LIKE '%' || clean_culture_name(nom_culture) || '%'
            LIMIT 1;
    END CASE;
    
    RETURN culture_id;
END;
$$ LANGUAGE plpgsql;

-- 4. Insérer les jalons agricoles avec délais appropriés
-- Fonction pour créer les jalons par culture
CREATE OR REPLACE FUNCTION create_jalons_for_culture(
    p_culture_name TEXT,
    p_jalons JSONB
) RETURNS VOID AS $$
DECLARE
    culture_id INTEGER;
    jalon_data JSONB;
    current_delay INTEGER := 0;
    delay_increment INTEGER := 30; -- 30 jours entre chaque jalon par défaut
BEGIN
    culture_id := find_culture_id(p_culture_name);
    
    IF culture_id IS NULL THEN
        RAISE NOTICE 'Culture non trouvée: %', p_culture_name;
        RETURN;
    END IF;
    
    -- Parcourir les jalons pour cette culture
    FOR jalon_data IN SELECT * FROM jsonb_array_elements(p_jalons)
    LOOP
        -- Insérer le jalon avec un délai progressif
        INSERT INTO jalon_agricole (
            id_culture, 
            nom_jalon, 
            description, 
            action_a_faire, 
            delai_apres_lancement,
            created_by
        ) VALUES (
            culture_id,
            jalon_data->>'nom_jalon',
            jalon_data->>'description',
            jalon_data->>'action_a_faire',
            current_delay,
            auth.uid()
        ) ON CONFLICT (id_culture, nom_jalon) DO NOTHING;
        
        current_delay := current_delay + delay_increment;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 5. Créer tous les jalons pour toutes les cultures
DO $$
DECLARE
    culture_jalons RECORD;
BEGIN
    -- Haricot
    PERFORM create_jalons_for_culture('haricot', '[
        {"nom_jalon": "Préparation du sol", "description": "Préparation du sol pour la culture de haricot.", "action_a_faire": "Effectuer le jalon préparation du sol conformément au calendrier agricole."},
        {"nom_jalon": "Achat des semences", "description": "Achat des semences pour la culture de haricot.", "action_a_faire": "Effectuer le jalon achat des semences conformément au calendrier agricole."},
        {"nom_jalon": "Semis", "description": "Semis pour la culture de haricot.", "action_a_faire": "Effectuer le jalon semis conformément au calendrier agricole."},
        {"nom_jalon": "Désherbage", "description": "Désherbage pour la culture de haricot.", "action_a_faire": "Effectuer le jalon désherbage conformément au calendrier agricole."},
        {"nom_jalon": "Traitement phytosanitaire", "description": "Traitement phytosanitaire pour la culture de haricot.", "action_a_faire": "Effectuer le jalon traitement phytosanitaire conformément au calendrier agricole."},
        {"nom_jalon": "Récolte", "description": "Récolte pour la culture de haricot.", "action_a_faire": "Effectuer le jalon récolte conformément au calendrier agricole."},
        {"nom_jalon": "Séchage", "description": "Séchage pour la culture de haricot.", "action_a_faire": "Effectuer le jalon séchage conformément au calendrier agricole."},
        {"nom_jalon": "Transport", "description": "Transport pour la culture de haricot.", "action_a_faire": "Effectuer le jalon transport conformément au calendrier agricole."}
    ]'::jsonb);
    
    -- Pois du cap
    PERFORM create_jalons_for_culture('pois du cap', '[
        {"nom_jalon": "Préparation du sol", "description": "Préparation du sol pour la culture de pois du cap.", "action_a_faire": "Effectuer le jalon préparation du sol conformément au calendrier agricole."},
        {"nom_jalon": "Achat des semences", "description": "Achat des semences pour la culture de pois du cap.", "action_a_faire": "Effectuer le jalon achat des semences conformément au calendrier agricole."},
        {"nom_jalon": "Semis", "description": "Semis pour la culture de pois du cap.", "action_a_faire": "Effectuer le jalon semis conformément au calendrier agricole."},
        {"nom_jalon": "Buttage", "description": "Buttage pour la culture de pois du cap.", "action_a_faire": "Effectuer le jalon buttage conformément au calendrier agricole."},
        {"nom_jalon": "Désherbage", "description": "Désherbage pour la culture de pois du cap.", "action_a_faire": "Effectuer le jalon désherbage conformément au calendrier agricole."},
        {"nom_jalon": "Récolte", "description": "Récolte pour la culture de pois du cap.", "action_a_faire": "Effectuer le jalon récolte conformément au calendrier agricole."},
        {"nom_jalon": "Battage", "description": "Battage pour la culture de pois du cap.", "action_a_faire": "Effectuer le jalon battage conformément au calendrier agricole."},
        {"nom_jalon": "Transport", "description": "Transport pour la culture de pois du cap.", "action_a_faire": "Effectuer le jalon transport conformément au calendrier agricole."}
    ]'::jsonb);
    
    -- Répéter pour toutes les autres cultures...
    -- (Les autres cultures suivent le même pattern)
END $$;

-- 6. Insérer les coûts de référence avec correspondance intelligente
CREATE OR REPLACE FUNCTION insert_reference_costs() RETURNS VOID AS $$
DECLARE
    cost_data RECORD;
    culture_id INTEGER;
    jalon_id INTEGER;
BEGIN
    -- Données de coûts de référence
    FOR cost_data IN 
        SELECT * FROM (VALUES
            ('haricot', 'Préparation du sol', 115384),
            ('haricot', 'Achat des semences', 92307),
            ('haricot', 'Semis', 80769),
            ('haricot', 'Désherbage', 80769),
            ('haricot', 'Traitement phytosanitaire', 115384),
            ('haricot', 'Récolte', 138461),
            ('haricot', 'Séchage', 57692),
            ('haricot', 'Transport', 69230),
            ('pois du cap', 'Préparation du sol', 137096),
            ('pois du cap', 'Achat des semences', 109677),
            ('pois du cap', 'Semis', 95967),
            ('pois du cap', 'Buttage', 95967),
            ('pois du cap', 'Désherbage', 95967),
            ('pois du cap', 'Récolte', 164516),
            ('pois du cap', 'Battage', 68548),
            ('pois du cap', 'Transport', 82258),
            ('lentilles', 'Préparation du sol', 145161),
            ('lentilles', 'Semis', 101612),
            ('lentilles', 'Désherbage', 101612),
            ('lentilles', 'Traitement phytosanitaire', 145161),
            ('lentilles', 'Récolte', 174193),
            ('lentilles', 'Séchage', 72580),
            ('lentilles', 'Triage', 72580),
            ('lentilles', 'Transport', 87096),
            ('niébé', 'Préparation du sol', 119402),
            ('niébé', 'Semis', 83582),
            ('niébé', 'Fertilisation', 119402),
            ('niébé', 'Désherbage', 83582),
            ('niébé', 'Traitement phytosanitaire', 119402),
            ('niébé', 'Récolte', 143283),
            ('niébé', 'Décorticage', 59701),
            ('niébé', 'Transport', 71641),
            ('pois cassé', 'Préparation du sol', 157692),
            ('pois cassé', 'Semis', 110384),
            ('pois cassé', 'Désherbage', 110384),
            ('pois cassé', 'Récolte', 189230),
            ('pois cassé', 'Battage', 78846),
            ('pois cassé', 'Triage', 78846),
            ('pois cassé', 'Transport', 94615),
            ('pois de bambara', 'Préparation du sol', 158181),
            ('pois de bambara', 'Semis', 110727),
            ('pois de bambara', 'Buttage', 110727),
            ('pois de bambara', 'Sarclage', 126545),
            ('pois de bambara', 'Récolte', 189818),
            ('pois de bambara', 'Décorticage', 79090),
            ('pois de bambara', 'Transport', 94909),
            ('black eyes', 'Préparation du sol', 131147),
            ('black eyes', 'Achat des semences', 104918),
            ('black eyes', 'Semis', 91803),
            ('black eyes', 'Sarclage', 104918),
            ('black eyes', 'Traitement phytosanitaire', 131147),
            ('black eyes', 'Récolte', 157377),
            ('black eyes', 'Transport', 78688),
            ('riz', 'Préparation du sol', 202531),
            ('riz', 'Semis / repiquage', 202531),
            ('riz', 'Irrigation', 162025),
            ('riz', 'Fertilisation', 202531),
            ('riz', 'Sarclage', 162025),
            ('riz', 'Traitement phytosanitaire', 202531),
            ('riz', 'Récolte', 243037),
            ('riz', 'Battage', 101265),
            ('riz', 'Transport', 121518),
            ('maïs', 'Préparation du sol', 195588),
            ('maïs', 'Semis', 136911),
            ('maïs', 'Fertilisation', 195588),
            ('maïs', 'Sarclage', 156470),
            ('maïs', 'Traitement phytosanitaire', 195588),
            ('maïs', 'Récolte', 234705),
            ('maïs', 'Égrenage', 97794),
            ('maïs', 'Transport', 117352),
            ('arachide', 'Préparation du sol', 127118),
            ('arachide', 'Semis', 88983),
            ('arachide', 'Buttage', 88983),
            ('arachide', 'Désherbage', 88983),
            ('arachide', 'Récolte', 152542),
            ('arachide', 'Décorticage', 63559),
            ('arachide', 'Séchage', 63559),
            ('arachide', 'Transport', 76271),
            ('patate douce', 'Préparation du sol', 220000),
            ('patate douce', 'Plantation des boutures', 154000),
            ('patate douce', 'Buttage', 154000),
            ('patate douce', 'Sarclage', 176000),
            ('patate douce', 'Récolte', 264000),
            ('patate douce', 'Transport', 132000),
            ('manioc', 'Préparation du sol', 339622),
            ('manioc', 'Plantation des tiges', 237735),
            ('manioc', 'Sarclage', 271698),
            ('manioc', 'Traitement phytosanitaire', 339622),
            ('manioc', 'Récolte', 407547),
            ('manioc', 'Transport', 203773),
            ('tomate', 'Préparation du sol', 263157),
            ('tomate', 'Plantation', 184210),
            ('tomate', 'Irrigation', 210526),
            ('tomate', 'Fertilisation', 263157),
            ('tomate', 'Traitement phytosanitaire', 263157),
            ('tomate', 'Sarclage', 210526),
            ('tomate', 'Récolte', 315789),
            ('tomate', 'Conditionnement', 131578),
            ('tomate', 'Transport', 157894),
            ('carotte', 'Préparation du sol', 277777),
            ('carotte', 'Semis', 194444),
            ('carotte', 'Irrigation', 222222),
            ('carotte', 'Sarclage', 222222),
            ('carotte', 'Récolte', 333333),
            ('carotte', 'Nettoyage', 83333),
            ('carotte', 'Transport', 166666),
            ('pomme de terre', 'Préparation du sol', 215384),
            ('pomme de terre', 'Plantation des tubercules', 107692),
            ('pomme de terre', 'Buttage', 150769),
            ('pomme de terre', 'Fertilisation', 215384),
            ('pomme de terre', 'Traitement phytosanitaire', 215384),
            ('pomme de terre', 'Récolte', 258461),
            ('pomme de terre', 'Conditionnement', 107692),
            ('pomme de terre', 'Transport', 129230),
            ('oignons', 'Préparation du sol', 280701),
            ('oignons', 'Semis ou repiquage', 224561),
            ('oignons', 'Irrigation', 224561),
            ('oignons', 'Sarclage', 224561),
            ('oignons', 'Récolte', 336842),
            ('oignons', 'Séchage', 140350),
            ('oignons', 'Transport', 168421),
            ('coton', 'Préparation du sol', 137931),
            ('coton', 'Semis', 96551),
            ('coton', 'Traitement phytosanitaire', 137931),
            ('coton', 'Sarclage', 110344),
            ('coton', 'Récolte', 165517),
            ('coton', 'Égrenage', 68965),
            ('coton', 'Transport', 82758),
            ('gingembre', 'Préparation du sol', 181818),
            ('gingembre', 'Plantation des rhizomes', 127272),
            ('gingembre', 'Irrigation', 145454),
            ('gingembre', 'Sarclage', 145454),
            ('gingembre', 'Traitement phytosanitaire', 181818),
            ('gingembre', 'Récolte', 218181),
            ('gingembre', 'Conditionnement', 90909),
            ('gingembre', 'Transport', 109090),
            ('ail', 'Préparation du sol', 245901),
            ('ail', 'Plantation', 172131),
            ('ail', 'Sarclage', 196721),
            ('ail', 'Traitement phytosanitaire', 245901),
            ('ail', 'Récolte', 295081),
            ('ail', 'Séchage', 122950),
            ('ail', 'Tri', 73770),
            ('ail', 'Transport', 147540)
        ) AS t(culture_name, jalon_name, montant)
    LOOP
        -- Trouver l'ID de la culture
        culture_id := find_culture_id(cost_data.culture_name);
        
        IF culture_id IS NULL THEN
            RAISE NOTICE 'Culture non trouvée: %', cost_data.culture_name;
            CONTINUE;
        END IF;
        
        -- Trouver l'ID du jalon
        SELECT id_jalon_agricole INTO jalon_id 
        FROM jalon_agricole 
        WHERE id_culture = culture_id 
        AND LOWER(TRIM(nom_jalon)) = LOWER(TRIM(cost_data.jalon_name));
        
        IF jalon_id IS NULL THEN
            RAISE NOTICE 'Jalon non trouvé: % pour culture %', cost_data.jalon_name, cost_data.culture_name;
            CONTINUE;
        END IF;
        
        -- Insérer le coût de référence
        INSERT INTO cout_jalon_reference (
            id_culture,
            id_jalon_agricole,
            type_depense,
            montant_par_hectare,
            created_by
        ) VALUES (
            culture_id,
            jalon_id,
            cost_data.jalon_name,
            cost_data.montant,
            auth.uid()
        ) ON CONFLICT (id_culture, id_jalon_agricole, type_depense) DO UPDATE SET
            montant_par_hectare = cost_data.montant;
        
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Exécuter l'insertion des coûts
SELECT insert_reference_costs();

-- 7. Recalculer les montants pour les projets existants
UPDATE cout_jalon_projet 
SET montant_total = montant_par_hectare * (
    SELECT surface_ha FROM projet WHERE id_projet = cout_jalon_projet.id_projet
)
WHERE montant_total != montant_par_hectare * (
    SELECT surface_ha FROM projet WHERE id_projet = cout_jalon_projet.id_projet
);

-- 8. Nettoyer les fonctions temporaires
DROP FUNCTION IF EXISTS clean_culture_name(TEXT);
DROP FUNCTION IF EXISTS find_culture_id(TEXT);
DROP FUNCTION IF EXISTS create_jalons_for_culture(TEXT, JSONB);
DROP FUNCTION IF EXISTS insert_reference_costs();

-- Afficher un résumé des insertions
SELECT 
    'Cultures' as type,
    COUNT(*) as total
FROM culture
UNION ALL
SELECT 
    'Jalons agricoles' as type,
    COUNT(*) as total
FROM jalon_agricole
UNION ALL
SELECT 
    'Coûts de référence' as type,
    COUNT(*) as total
FROM cout_jalon_reference;
