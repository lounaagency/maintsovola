-- Insertion des données de référence pour les coûts par jalon et culture
-- Coûts en Ariary malgache basés sur les pratiques agricoles locales

-- Riz (id_culture = 1)
-- Jalon 1: Préparation du terrain
INSERT INTO cout_jalon_reference (id_culture, id_jalon_agricole, type_depense, montant_par_hectare, unite) VALUES
(1, 1, 'Main d''œuvre préparation', 120000, 'Ar/ha'),
(1, 1, 'Location tracteur/charrue', 80000, 'Ar/ha'),
(1, 1, 'Carburant', 30000, 'Ar/ha');

-- Jalon 2: Semis/plantation
INSERT INTO cout_jalon_reference (id_culture, id_jalon_agricole, type_depense, montant_par_hectare, unite) VALUES
(1, 2, 'Semences riz', 45000, 'Ar/ha'),
(1, 2, 'Main d''œuvre semis', 60000, 'Ar/ha'),
(1, 2, 'Transport semences', 15000, 'Ar/ha');

-- Jalon 3: Fertilisation
INSERT INTO cout_jalon_reference (id_culture, id_jalon_agricole, type_depense, montant_par_hectare, unite) VALUES
(1, 3, 'Engrais NPK', 180000, 'Ar/ha'),
(1, 3, 'Urée', 120000, 'Ar/ha'),
(1, 3, 'Main d''œuvre épandage', 40000, 'Ar/ha');

-- Jalon 4: Irrigation
INSERT INTO cout_jalon_reference (id_culture, id_jalon_agricole, type_depense, montant_par_hectare, unite) VALUES
(1, 4, 'Eau irrigation', 25000, 'Ar/ha'),
(1, 4, 'Main d''œuvre irrigation', 35000, 'Ar/ha'),
(1, 4, 'Entretien canaux', 20000, 'Ar/ha');

-- Jalon 5: Désherbage
INSERT INTO cout_jalon_reference (id_culture, id_jalon_agricole, type_depense, montant_par_hectare, unite) VALUES
(1, 5, 'Herbicides', 65000, 'Ar/ha'),
(1, 5, 'Main d''œuvre sarclage', 80000, 'Ar/ha');

-- Jalon 6: Récolte
INSERT INTO cout_jalon_reference (id_culture, id_jalon_agricole, type_depense, montant_par_hectare, unite) VALUES
(1, 6, 'Main d''œuvre récolte', 100000, 'Ar/ha'),
(1, 6, 'Transport récolte', 50000, 'Ar/ha'),
(1, 6, 'Séchage/stockage', 30000, 'Ar/ha');

-- Arachide (id_culture = 2)
-- Jalon 7: Préparation du terrain
INSERT INTO cout_jalon_reference (id_culture, id_jalon_agricole, type_depense, montant_par_hectare, unite) VALUES
(2, 7, 'Main d''œuvre préparation', 100000, 'Ar/ha'),
(2, 7, 'Location charrue', 60000, 'Ar/ha'),
(2, 7, 'Carburant', 25000, 'Ar/ha');

-- Jalon 8: Semis
INSERT INTO cout_jalon_reference (id_culture, id_jalon_agricole, type_depense, montant_par_hectare, unite) VALUES
(2, 8, 'Semences arachide', 80000, 'Ar/ha'),
(2, 8, 'Main d''œuvre semis', 50000, 'Ar/ha');

-- Jalon 9: Fertilisation
INSERT INTO cout_jalon_reference (id_culture, id_jalon_agricole, type_depense, montant_par_hectare, unite) VALUES
(2, 9, 'Engrais NPK', 150000, 'Ar/ha'),
(2, 9, 'Main d''œuvre épandage', 35000, 'Ar/ha');

-- Jalon 10: Entretien
INSERT INTO cout_jalon_reference (id_culture, id_jalon_agricole, type_depense, montant_par_hectare, unite) VALUES
(2, 10, 'Sarclage manuel', 70000, 'Ar/ha'),
(2, 10, 'Buttage', 40000, 'Ar/ha');

-- Jalon 11: Traitement phytosanitaire
INSERT INTO cout_jalon_reference (id_culture, id_jalon_agricole, type_depense, montant_par_hectare, unite) VALUES
(2, 11, 'Insecticides', 45000, 'Ar/ha'),
(2, 11, 'Fongicides', 35000, 'Ar/ha'),
(2, 11, 'Main d''œuvre traitement', 25000, 'Ar/ha');

-- Jalon 12: Récolte arachide
INSERT INTO cout_jalon_reference (id_culture, id_jalon_agricole, type_depense, montant_par_hectare, unite) VALUES
(2, 12, 'Main d''œuvre récolte', 90000, 'Ar/ha'),
(2, 12, 'Transport récolte', 40000, 'Ar/ha'),
(2, 12, 'Séchage', 25000, 'Ar/ha');

-- Manioc (id_culture = 3)
-- Jalon 13: Préparation terrain manioc
INSERT INTO cout_jalon_reference (id_culture, id_jalon_agricole, type_depense, montant_par_hectare, unite) VALUES
(3, 13, 'Défrichage', 80000, 'Ar/ha'),
(3, 13, 'Labour', 70000, 'Ar/ha'),
(3, 13, 'Hersage', 40000, 'Ar/ha');

-- Jalon 14: Plantation manioc
INSERT INTO cout_jalon_reference (id_culture, id_jalon_agricole, type_depense, montant_par_hectare, unite) VALUES
(3, 14, 'Boutures manioc', 60000, 'Ar/ha'),
(3, 14, 'Main d''œuvre plantation', 80000, 'Ar/ha');

-- Jalon 15: Premier sarclage
INSERT INTO cout_jalon_reference (id_culture, id_jalon_agricole, type_depense, montant_par_hectare, unite) VALUES
(3, 15, 'Sarclage manuel', 60000, 'Ar/ha'),
(3, 15, 'Buttage', 35000, 'Ar/ha');

-- Jalon 16: Deuxième sarclage
INSERT INTO cout_jalon_reference (id_culture, id_jalon_agricole, type_depense, montant_par_hectare, unite) VALUES
(3, 16, 'Sarclage manuel', 55000, 'Ar/ha'),
(3, 16, 'Buttage', 30000, 'Ar/ha');

-- Jalon 17: Fertilisation manioc
INSERT INTO cout_jalon_reference (id_culture, id_jalon_agricole, type_depense, montant_par_hectare, unite) VALUES
(3, 17, 'Engrais NPK', 120000, 'Ar/ha'),
(3, 17, 'Main d''œuvre épandage', 30000, 'Ar/ha');

-- Jalon 18: Récolte manioc
INSERT INTO cout_jalon_reference (id_culture, id_jalon_agricole, type_depense, montant_par_hectare, unite) VALUES
(3, 18, 'Main d''œuvre arrachage', 120000, 'Ar/ha'),
(3, 18, 'Transport récolte', 60000, 'Ar/ha');

-- Haricot blanc (id_culture = 4)
-- Jalon 19: Préparation terrain haricot
INSERT INTO cout_jalon_reference (id_culture, id_jalon_agricole, type_depense, montant_par_hectare, unite) VALUES
(4, 19, 'Labour', 80000, 'Ar/ha'),
(4, 19, 'Hersage', 40000, 'Ar/ha'),
(4, 19, 'Sillonnage', 30000, 'Ar/ha');

-- Jalon 20: Semis haricot
INSERT INTO cout_jalon_reference (id_culture, id_jalon_agricole, type_depense, montant_par_hectare, unite) VALUES
(4, 20, 'Semences haricot', 70000, 'Ar/ha'),
(4, 20, 'Main d''œuvre semis', 45000, 'Ar/ha');

-- Jalon 21: Fertilisation haricot
INSERT INTO cout_jalon_reference (id_culture, id_jalon_agricole, type_depense, montant_par_hectare, unite) VALUES
(4, 21, 'Engrais NPK', 130000, 'Ar/ha'),
(4, 21, 'Main d''œuvre épandage', 25000, 'Ar/ha');

-- Jalon 22: Entretien haricot
INSERT INTO cout_jalon_reference (id_culture, id_jalon_agricole, type_depense, montant_par_hectare, unite) VALUES
(4, 22, 'Sarclage', 50000, 'Ar/ha'),
(4, 22, 'Buttage', 35000, 'Ar/ha'),
(4, 22, 'Tuteurage', 40000, 'Ar/ha');

-- Jalon 23: Traitement haricot
INSERT INTO cout_jalon_reference (id_culture, id_jalon_agricole, type_depense, montant_par_hectare, unite) VALUES
(4, 23, 'Fongicides', 40000, 'Ar/ha'),
(4, 23, 'Insecticides', 35000, 'Ar/ha'),
(4, 23, 'Main d''œuvre traitement', 20000, 'Ar/ha');

-- Jalon 24: Récolte haricot
INSERT INTO cout_jalon_reference (id_culture, id_jalon_agricole, type_depense, montant_par_hectare, unite) VALUES
(4, 24, 'Main d''œuvre récolte', 80000, 'Ar/ha'),
(4, 24, 'Transport', 35000, 'Ar/ha'),
(4, 24, 'Séchage/tri', 25000, 'Ar/ha');

-- Pois Bambara (id_culture = 5)
-- Jalon 25: Préparation terrain pois
INSERT INTO cout_jalon_reference (id_culture, id_jalon_agricole, type_depense, montant_par_hectare, unite) VALUES
(5, 25, 'Labour', 75000, 'Ar/ha'),
(5, 25, 'Hersage', 35000, 'Ar/ha');

-- Jalon 26: Semis pois bambara
INSERT INTO cout_jalon_reference (id_culture, id_jalon_agricole, type_depense, montant_par_hectare, unite) VALUES
(5, 26, 'Semences pois bambara', 85000, 'Ar/ha'),
(5, 26, 'Main d''œuvre semis', 50000, 'Ar/ha');

-- Jalon 27: Fertilisation pois
INSERT INTO cout_jalon_reference (id_culture, id_jalon_agricole, type_depense, montant_par_hectare, unite) VALUES
(5, 27, 'Engrais NPK', 100000, 'Ar/ha'),
(5, 27, 'Main d''œuvre épandage', 25000, 'Ar/ha');

-- Jalon 28: Entretien pois
INSERT INTO cout_jalon_reference (id_culture, id_jalon_agricole, type_depense, montant_par_hectare, unite) VALUES
(5, 28, 'Sarclage', 45000, 'Ar/ha'),
(5, 28, 'Buttage', 30000, 'Ar/ha');

-- Jalon 29: Récolte pois bambara
INSERT INTO cout_jalon_reference (id_culture, id_jalon_agricole, type_depense, montant_par_hectare, unite) VALUES
(5, 29, 'Main d''œuvre récolte', 70000, 'Ar/ha'),
(5, 29, 'Transport', 30000, 'Ar/ha'),
(5, 29, 'Séchage', 20000, 'Ar/ha');

-- Création d'une fonction pour calculer le coût total d'un jalon projet
CREATE OR REPLACE FUNCTION calculate_jalon_cost(
    p_id_jalon_projet INTEGER,
    p_surface_ha NUMERIC
) RETURNS NUMERIC AS $$
DECLARE
    total_cost NUMERIC := 0;
    jalon_culture_record RECORD;
BEGIN
    -- Récupérer la culture et le jalon agricole associés au jalon projet
    SELECT ja.id_jalon_agricole, pc.id_culture
    INTO jalon_culture_record
    FROM jalon_projet jp
    JOIN jalon_agricole ja ON jp.id_jalon_agricole = ja.id_jalon_agricole
    JOIN projet p ON jp.id_projet = p.id_projet
    JOIN projet_culture pc ON p.id_projet = pc.id_projet
    WHERE jp.id_jalon_projet = p_id_jalon_projet
    LIMIT 1;
    
    IF jalon_culture_record IS NOT NULL THEN
        -- Calculer le coût total basé sur les coûts de référence
        SELECT COALESCE(SUM(montant_par_hectare * p_surface_ha), 0)
        INTO total_cost
        FROM cout_jalon_reference
        WHERE id_culture = jalon_culture_record.id_culture
        AND id_jalon_agricole = jalon_culture_record.id_jalon_agricole;
    END IF;
    
    RETURN total_cost;
END;
$$ LANGUAGE plpgsql;

-- Création d'une vue pour le résumé des coûts par projet
CREATE OR REPLACE VIEW vue_cout_total_projet AS
SELECT 
    p.id_projet,
    p.titre,
    p.surface_ha,
    pc.id_culture,
    c.nom_culture,
    COALESCE(SUM(cjr.montant_par_hectare * p.surface_ha), 0) as cout_total_previsionnel,
    COUNT(DISTINCT jp.id_jalon_projet) as nombre_jalons,
    COUNT(DISTINCT CASE WHEN jp.statut = 'Terminé' THEN jp.id_jalon_projet END) as jalons_termines
FROM projet p
LEFT JOIN projet_culture pc ON p.id_projet = pc.id_projet
LEFT JOIN culture c ON pc.id_culture = c.id_culture
LEFT JOIN jalon_projet jp ON p.id_projet = jp.id_projet
LEFT JOIN jalon_agricole ja ON jp.id_jalon_agricole = ja.id_jalon_agricole
LEFT JOIN cout_jalon_reference cjr ON (ja.id_jalon_agricole = cjr.id_jalon_agricole AND pc.id_culture = cjr.id_culture)
WHERE p.statut IN ('validé', 'en_financement', 'en_cours', 'en_production')
GROUP BY p.id_projet, p.titre, p.surface_ha, pc.id_culture, c.nom_culture;

-- Fonction pour générer automatiquement les coûts projet lors du lancement de production
CREATE OR REPLACE FUNCTION generate_project_costs()
RETURNS TRIGGER AS $$
BEGIN
    -- Si le statut passe à 'en_cours', générer les coûts pour chaque jalon
    IF NEW.statut = 'en_cours' AND OLD.statut != 'en_cours' THEN
        INSERT INTO cout_jalon_projet (
            id_projet, 
            id_jalon_projet, 
            type_depense, 
            montant_par_hectare, 
            montant_total, 
            statut_paiement
        )
        SELECT 
            jp.id_projet,
            jp.id_jalon_projet,
            cjr.type_depense,
            cjr.montant_par_hectare,
            cjr.montant_par_hectare * NEW.surface_ha,
            'Non engagé'
        FROM jalon_projet jp
        JOIN jalon_agricole ja ON jp.id_jalon_agricole = ja.id_jalon_agricole
        JOIN projet_culture pc ON jp.id_projet = pc.id_projet
        JOIN cout_jalon_reference cjr ON (ja.id_jalon_agricole = cjr.id_jalon_agricole AND pc.id_culture = cjr.id_culture)
        WHERE jp.id_projet = NEW.id_projet
        ON CONFLICT DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour générer automatiquement les coûts
DROP TRIGGER IF EXISTS trigger_generate_project_costs ON projet;
CREATE TRIGGER trigger_generate_project_costs
    AFTER UPDATE ON projet
    FOR EACH ROW
    EXECUTE FUNCTION generate_project_costs();