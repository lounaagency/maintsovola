
-- Ajouter les colonnes pour les heures de début et fin d'opération
ALTER TABLE jalon_projet 
ADD COLUMN heure_debut TIME,
ADD COLUMN heure_fin TIME;

-- Mettre à jour le trigger de modification
UPDATE jalon_projet SET modified_at = NOW() WHERE id_jalon_projet IS NOT NULL;
