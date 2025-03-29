
-- Insertion de rôles d'utilisateurs
INSERT INTO role (id_role, nom_role, description_role)
VALUES 
  (1, 'agriculteur', 'Producteur agricole possédant des terrains'),
  (2, 'technicien', 'Technicien agricole validant les terrains'),
  (3, 'superviseur', 'Superviseur des techniciens et du processus'),
  (4, 'investisseur', 'Investisseur dans les projets agricoles')
ON CONFLICT (id_role) DO NOTHING;

-- Insertion d'utilisateurs de test
INSERT INTO utilisateur (id_utilisateur, nom, prenoms, email, mot_de_passe, id_role, photo_profil, photo_couverture)
VALUES
  ('user1', 'Rakoto', 'Jean', 'rakoto.jean@example.com', 'password', 1, 'https://i.pravatar.cc/150?img=1', 'https://picsum.photos/800/200?random=1'),
  ('user2', 'Rabe', 'Marie', 'rabe.marie@example.com', 'password', 1, 'https://i.pravatar.cc/150?img=2', 'https://picsum.photos/800/200?random=2'),
  ('user3', 'Rasoa', 'Pierre', 'rasoa.pierre@example.com', 'password', 2, 'https://i.pravatar.cc/150?img=3', 'https://picsum.photos/800/200?random=3'),
  ('user4', 'Randria', 'Sophie', 'randria.sophie@example.com', 'password', 2, 'https://i.pravatar.cc/150?img=4', 'https://picsum.photos/800/200?random=4'),
  ('user5', 'Rakotonandrasana', 'Eric', 'rakotonandrasana.eric@example.com', 'password', 3, 'https://i.pravatar.cc/150?img=5', 'https://picsum.photos/800/200?random=5'),
  ('user6', 'Ravalomanana', 'Celine', 'ravalomanana.celine@example.com', 'password', 4, 'https://i.pravatar.cc/150?img=6', 'https://picsum.photos/800/200?random=6'),
  ('user7', 'Rajaonarison', 'Marc', 'rajaonarison.marc@example.com', 'password', 4, 'https://i.pravatar.cc/150?img=7', 'https://picsum.photos/800/200?random=7'),
  ('user8', 'Rabemananjara', 'Aina', 'rabemananjara.aina@example.com', 'password', 1, 'https://i.pravatar.cc/150?img=8', 'https://picsum.photos/800/200?random=8')
ON CONFLICT (id_utilisateur) DO NOTHING;

-- Insertion des numéros de téléphone
INSERT INTO telephone (id_utilisateur, numero, type, est_whatsapp, est_mobile_banking)
VALUES
  ('user1', '0341234567', 'principal', true, false),
  ('user1', '0331234567', 'mobile_banking', false, true),
  ('user2', '0342345678', 'principal', true, true),
  ('user3', '0343456789', 'principal', true, false),
  ('user3', '0333456789', 'mobile_banking', false, true),
  ('user4', '0344567890', 'principal', true, true),
  ('user5', '0345678901', 'principal', true, false),
  ('user6', '0346789012', 'principal', false, false),
  ('user7', '0347890123', 'principal', true, true),
  ('user8', '0348901234', 'principal', true, false)
ON CONFLICT DO NOTHING;

-- Insertion de terrains de test
INSERT INTO terrain (id_tantsaha, id_region, id_district, id_commune, surface_proposee, surface_validee, acces_eau, acces_route, statut, id_technicien)
VALUES
  ('f0b6ad5e-2190-47ef-9320-556fc84239c4', 19, 96, 1183, 5.5, 5.0, true, true, true, '71b883a3-9b70-4bbb-b3f4-97c0234a4493'),
  ('f0b6ad5e-2190-47ef-9320-556fc84239c4', 19, 100, 1232, 3.2, 3.0, true, false, true, '71b883a3-9b70-4bbb-b3f4-97c0234a4493'),
  ('28ff57b7-fb92-4593-b239-5c56b0f44560', 19, 96, 1190, 8.0, 7.5, true, true, true, 'a624b2e6-4c2d-412a-bdbf-923f87883348'),
  ( '28ff57b7-fb92-4593-b239-5c56b0f44560',19, 100, 1229, 4.7, 4.5, false, true, true, 'a624b2e6-4c2d-412a-bdbf-923f87883348'),
  ('28ff57b7-fb92-4593-b239-5c56b0f44560', 19, 96, 1185, 6.3, 0.0, true, true, false, '71b883a3-9b70-4bbb-b3f4-97c0234a4493'),
  ('28ff57b7-fb92-4593-b239-5c56b0f44560', 19, 96, 1183, 2.8, 0.0, false, false, false, 'a624b2e6-4c2d-412a-bdbf-923f87883348'),
  ('f0b6ad5e-2190-47ef-9320-556fc84239c4', 19, 100, 1227, 10.0, 0.0, true, true, false, null),
  ('f0b6ad5e-2190-47ef-9320-556fc84239c4', 19, 96, 1185, 7.2, 0.0, true, false, false, null)
ON CONFLICT (id_terrain) DO NOTHING;

-- Insertion de projets de test
INSERT INTO projet (id_projet, id_terrain, id_tantsaha, id_commune, surface_ha, statut, id_technicien)
VALUES
  (1, 1, 'user1', 10101, 5.0, 'en_cours', 'user3'),
  (2, 2, 'user1', 10201, 3.0, 'en_cours', 'user3'),
  (3, 3, 'user2', 20101, 7.5, 'en_cours', 'user4'),
  (4, 4, 'user2', 20201, 4.5, 'planifie', 'user4')
ON CONFLICT (id_projet) DO NOTHING;

-- Insertion de cultures pour les projets
INSERT INTO projet_culture (id_projet, id_culture, cout_exploitation_previsionnel, rendement_previsionnel)
VALUES
  (1, 1, 2500, 5.5),  -- Riz
  (2, 2, 1800, 4.0),  -- Maïs
  (3, 3, 3200, 12.0), -- Manioc
  (4, 4, 5000, 8.0)   -- Café
ON CONFLICT DO NOTHING;

-- Insertion d'investissements
INSERT INTO investissement (id_investissement, id_projet, id_investisseur, montant, date_decision_investir)
VALUES
  (1, 1, 'user6', 5000, '2023-05-15'),
  (2, 1, 'user7', 3000, '2023-05-20'),
  (3, 2, 'user6', 2000, '2023-06-10'),
  (4, 3, 'user7', 8000, '2023-07-05')
ON CONFLICT (id_investissement) DO NOTHING;

-- Insertion de likes sur les projets
INSERT INTO aimer_projet (id_projet, id_utilisateur)
VALUES
  (1, 'user6'),
  (1, 'user7'),
  (1, 'user5'),
  (2, 'user6'),
  (2, 'user4'),
  (3, 'user7'),
  (3, 'user5'),
  (3, 'user3'),
  (4, 'user6')
ON CONFLICT DO NOTHING;

-- Insertion de commentaires sur les projets
INSERT INTO commentaire (id_commentaire, id_projet, id_utilisateur, contenu, date_creation)
VALUES
  (1, 1, 'user6', 'Projet très prometteur, j''aime beaucoup!', '2023-05-16'),
  (2, 1, 'user7', 'Quel est le rendement prévu?', '2023-05-17'),
  (3, 1, 'user1', 'Merci pour votre intérêt! Le rendement prévu est de 5.5 tonnes par hectare.', '2023-05-18'),
  (4, 2, 'user6', 'Beau projet, continuez!', '2023-06-11'),
  (5, 3, 'user7', 'Je suis intéressé à investir davantage.', '2023-07-06'),
  (6, 3, 'user2', 'Contactez-moi pour plus d''informations!', '2023-07-07'),
  (7, 4, 'user6', 'C''est un projet intéressant.', '2023-08-01')
ON CONFLICT (id_commentaire) DO NOTHING;

-- Insertion de conversations
INSERT INTO conversation (id_conversation, id_utilisateur1, id_utilisateur2, derniere_mise_a_jour, dernier_message)
VALUES
  (1, 'user1', 'user3', '2023-05-19 14:30:00', 'Quand pouvez-vous venir inspecter mon terrain?'),
  (2, 'user2', 'user4', '2023-06-15 10:45:00', 'Les plants de maïs sont arrivés.'),
  (3, 'user1', 'user6', '2023-07-20 16:20:00', 'Merci pour votre investissement!'),
  (4, 'user2', 'user7', '2023-08-05 09:15:00', 'Contactez-moi pour discuter des détails du projet.')
ON CONFLICT (id_conversation) DO NOTHING;

-- Insertion de messages
INSERT INTO message (id_message, id_conversation, id_expediteur, contenu, date_envoi, lu)
VALUES
  (1, 1, 'user1', 'Bonjour, j''aimerais savoir quand vous pourrez venir voir mon terrain?', '2023-05-19 14:25:00', true),
  (2, 1, 'user3', 'Bonjour! Je peux venir ce jeudi vers 10h, ça vous convient?', '2023-05-19 14:28:00', true),
  (3, 1, 'user1', 'Quand pouvez-vous venir inspecter mon terrain?', '2023-05-19 14:30:00', true),
  (4, 2, 'user4', 'Les semences ont été commandées, elles arriveront la semaine prochaine.', '2023-06-15 10:40:00', true),
  (5, 2, 'user2', 'Les plants de maïs sont arrivés.', '2023-06-15 10:45:00', false),
  (6, 3, 'user6', 'J''ai investi dans votre projet, très enthousiaste de voir les résultats!', '2023-07-20 16:15:00', true),
  (7, 3, 'user1', 'Merci pour votre investissement!', '2023-07-20 16:20:00', false),
  (8, 4, 'user7', 'Bonjour, j''ai quelques questions concernant votre projet.', '2023-08-05 09:10:00', true),
  (9, 4, 'user2', 'Contactez-moi pour discuter des détails du projet.', '2023-08-05 09:15:00', false)
ON CONFLICT (id_message) DO NOTHING;

-- Reset sequence values
SELECT setval('telephone_id_telephone_seq', (SELECT MAX(id_telephone) FROM telephone), true);
SELECT setval('commentaire_id_commentaire_seq', (SELECT MAX(id_commentaire) FROM commentaire), true);
SELECT setval('conversation_id_conversation_seq', (SELECT MAX(id_conversation) FROM conversation), true);
SELECT setval('message_id_message_seq', (SELECT MAX(id_message) FROM message), true);
