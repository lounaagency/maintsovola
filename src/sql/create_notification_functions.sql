
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

-- Fonction pour notifier toutes les parties prenantes d'un investissement
CREATE OR REPLACE FUNCTION notify_investment_stakeholders(
  project_id INT,
  investor_id UUID,
  investment_amount NUMERIC
)
RETURNS void AS $$
DECLARE
  project_record RECORD;
  other_investor RECORD;
  project_title TEXT;
BEGIN
  -- Récupérer les informations du projet et les parties prenantes
  SELECT 
    p.id_tantsaha, 
    p.id_superviseur, 
    t.id_technicien, 
    COALESCE(p.titre, 'Projet #' || project_id) AS titre
  INTO project_record
  FROM projet p
  LEFT JOIN terrain t ON p.id_terrain = t.id_terrain
  WHERE p.id_projet = project_id;
  
  project_title := project_record.titre;
  
  -- 1. Notifier le propriétaire du projet (tantsaha)
  IF project_record.id_tantsaha IS NOT NULL THEN
    INSERT INTO notification (
      id_expediteur,
      id_destinataire,
      titre,
      message,
      lu,
      type,
      entity_id,
      entity_type,
      projet_id
    ) VALUES (
      investor_id,
      project_record.id_tantsaha,
      'Nouvel investissement',
      'Un nouvel investissement de ' || investment_amount || ' Ar a été réalisé sur votre projet "' || project_title || '".',
      false,
      'success',
      project_id::text,
      'projet',
      project_id
    );
  END IF;
  
  -- 2. Notifier le superviseur si disponible
  IF project_record.id_superviseur IS NOT NULL AND project_record.id_superviseur != investor_id THEN
    INSERT INTO notification (
      id_expediteur,
      id_destinataire,
      titre,
      message,
      lu,
      type,
      entity_id,
      entity_type,
      projet_id
    ) VALUES (
      investor_id,
      project_record.id_superviseur,
      'Nouvel investissement',
      'Un nouvel investissement de ' || investment_amount || ' Ar a été réalisé sur le projet "' || project_title || '".',
      false,
      'info',
      project_id::text,
      'projet',
      project_id
    );
  END IF;
  
  -- 3. Notifier le technicien si disponible
  IF project_record.id_technicien IS NOT NULL AND project_record.id_technicien != investor_id THEN
    INSERT INTO notification (
      id_expediteur,
      id_destinataire,
      titre,
      message,
      lu,
      type,
      entity_id,
      entity_type,
      projet_id
    ) VALUES (
      investor_id,
      project_record.id_technicien,
      'Nouvel investissement',
      'Un nouvel investissement de ' || investment_amount || ' Ar a été réalisé sur le projet "' || project_title || '".',
      false,
      'info',
      project_id::text,
      'projet',
      project_id
    );
  END IF;
  
  -- 4. Notifier les autres investisseurs
  FOR other_investor IN 
    SELECT DISTINCT id_investisseur 
    FROM investissement 
    WHERE id_projet = project_id AND id_investisseur != investor_id
  LOOP
    INSERT INTO notification (
      id_expediteur,
      id_destinataire,
      titre,
      message,
      lu,
      type,
      entity_id,
      entity_type,
      projet_id
    ) VALUES (
      investor_id,
      other_investor.id_investisseur,
      'Nouvel investissement',
      'Un nouvel investissement de ' || investment_amount || ' Ar a été réalisé sur le projet "' || project_title || '" dans lequel vous avez également investi.',
      false,
      'info',
      project_id::text,
      'projet',
      project_id
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;
