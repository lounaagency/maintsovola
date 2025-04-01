
-- Fonction pour récupérer les notifications d'un utilisateur
CREATE OR REPLACE FUNCTION get_notifications_for_user(user_id UUID)
RETURNS SETOF notification AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM notification
  WHERE id_destinataire = user_id
  ORDER BY date_creation DESC;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour marquer une notification comme lue
CREATE OR REPLACE FUNCTION mark_notification_as_read(notification_id INT)
RETURNS void AS $$
BEGIN
  UPDATE notification
  SET lu = true
  WHERE id_notification = notification_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour marquer toutes les notifications d'un utilisateur comme lues
CREATE OR REPLACE FUNCTION mark_all_notifications_as_read(user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE notification
  SET lu = true
  WHERE id_destinataire = user_id AND lu = false;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer une notification d'assignation de technicien
CREATE OR REPLACE FUNCTION create_technicien_assignment_notification(
  technicien_id UUID,
  terrain_id INT,
  superviseur_id UUID
)
RETURNS void AS $$
DECLARE
  terrain_name TEXT;
BEGIN
  -- Récupérer le nom du terrain
  SELECT nom_terrain INTO terrain_name FROM terrain WHERE id_terrain = terrain_id;
  
  -- Créer la notification
  INSERT INTO notification (
    id_expediteur,
    id_destinataire,
    titre,
    message,
    lu,
    type,
    entity_id,
    entity_type
  ) VALUES (
    superviseur_id,
    technicien_id,
    'Assignation à un terrain',
    'Vous avez été assigné au terrain ' || COALESCE(terrain_name, 'ID ' || terrain_id),
    false,
    'assignment',
    terrain_id::text,
    'terrain'
  );
END;
$$ LANGUAGE plpgsql;
