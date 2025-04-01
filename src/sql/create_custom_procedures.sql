
-- Get notifications for a user
CREATE OR REPLACE FUNCTION public.get_notifications_for_user(user_id UUID)
RETURNS SETOF notification
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT *
  FROM notification
  WHERE id_destinataire = user_id
  ORDER BY date_creation DESC
  LIMIT 20;
$$;

-- Mark a notification as read
CREATE OR REPLACE FUNCTION public.mark_notification_as_read(notification_id INTEGER)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE notification
  SET lu = true
  WHERE id_notification = notification_id;
$$;

-- Mark all notifications as read for a user
CREATE OR REPLACE FUNCTION public.mark_all_notifications_as_read(user_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE notification
  SET lu = true
  WHERE id_destinataire = user_id AND lu = false;
$$;

-- Create a notification for technician assignment
CREATE OR REPLACE FUNCTION public.create_technicien_assignment_notification(
  technicien_id UUID,
  terrain_id INTEGER,
  superviseur_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO notification (
    id_destinataire,
    id_expediteur,
    titre,
    message,
    entity_type,
    entity_id
  ) VALUES (
    technicien_id,
    superviseur_id,
    'Nouvelle affectation de terrain',
    'Vous avez été assigné à un nouveau terrain (#' || terrain_id || ')',
    'terrain',
    terrain_id
  );
END;
$$;

-- Create a subscription between users
CREATE OR REPLACE FUNCTION public.create_subscription(
  follower_id UUID,
  followed_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO abonnement (
    id_abonne,
    id_suivi
  ) VALUES (
    follower_id,
    followed_id
  );
END;
$$;

-- Count followers for a user
CREATE OR REPLACE FUNCTION public.count_followers(user_id UUID)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::integer
  FROM abonnement
  WHERE id_suivi = user_id;
$$;

-- Count subscriptions for a user
CREATE OR REPLACE FUNCTION public.count_subscriptions(user_id UUID)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COUNT(*)::integer
  FROM abonnement
  WHERE id_abonne = user_id;
$$;
