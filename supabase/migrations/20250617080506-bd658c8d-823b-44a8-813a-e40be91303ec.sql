
-- Fix messages with null id_conversation by matching them with existing conversations
-- based on sender/recipient pairs

UPDATE message 
SET id_conversation = (
  SELECT c.id_conversation 
  FROM conversation c 
  WHERE (
    (c.id_utilisateur1 = message.id_expediteur AND c.id_utilisateur2 = message.id_destinataire) 
    OR 
    (c.id_utilisateur1 = message.id_destinataire AND c.id_utilisateur2 = message.id_expediteur)
  )
  LIMIT 1
)
WHERE id_conversation IS NULL;

-- For messages that still don't have a conversation, create one
-- Fixed the GROUP BY issue by grouping by the fields we're selecting
INSERT INTO conversation (id_utilisateur1, id_utilisateur2, derniere_activite)
SELECT 
  LEAST(m.id_expediteur, m.id_destinataire) as id_utilisateur1,
  GREATEST(m.id_expediteur, m.id_destinataire) as id_utilisateur2,
  MIN(m.date_envoi) as derniere_activite
FROM message m
WHERE m.id_conversation IS NULL
  AND m.id_expediteur IS NOT NULL 
  AND m.id_destinataire IS NOT NULL
  AND m.id_expediteur != m.id_destinataire
GROUP BY LEAST(m.id_expediteur, m.id_destinataire), GREATEST(m.id_expediteur, m.id_destinataire);

-- Update messages that still have null id_conversation with the newly created conversations
UPDATE message 
SET id_conversation = (
  SELECT c.id_conversation 
  FROM conversation c 
  WHERE (
    (c.id_utilisateur1 = message.id_expediteur AND c.id_utilisateur2 = message.id_destinataire) 
    OR 
    (c.id_utilisateur1 = message.id_destinataire AND c.id_utilisateur2 = message.id_expediteur)
  )
  LIMIT 1
)
WHERE id_conversation IS NULL;
